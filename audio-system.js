// Mobile Audio System for Game Speech
// Uses pre-generated audio files instead of text-to-speech on mobile

class MobileAudioSystem {
    constructor() {
        this.audioCache = new Map();
        this.currentAudio = null;
        this.audioManifest = null;
        this.isMobile = this.detectMobile();
        this.audioEnabled = true;
        this.audioUnlocked = false;
        this.loadAudioManifest();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }
    
    async loadAudioManifest() {
        try {
            const response = await fetch('./audio/manifest.json');
            if (response.ok) {
                this.audioManifest = await response.json();
                console.log(`🎵 Loaded audio manifest with ${this.audioManifest.total_files} files`);
            } else {
                console.warn('⚠️  Audio manifest not found, falling back to text-to-speech');
                this.audioManifest = null;
            }
        } catch (error) {
            console.warn('⚠️  Failed to load audio manifest:', error);
            this.audioManifest = null;
        }
    }
    
    generateDialogueId(text, character) {
        // Generate the same ID as used in the extraction script
        const crypto = window.crypto || window.msCrypto;
        const encoder = new TextEncoder();
        const data = encoder.encode(`${text}_${character}`);
        
        return crypto.subtle.digest('MD5', data).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex.substring(0, 8);
        }).catch(() => {
            // Fallback for older browsers
            return Math.random().toString(36).substring(2, 10);
        });
    }
    
    async getAudioFile(text, character) {
        if (!this.audioManifest) return null;
        
        // Clean text the same way as in the extraction script
        const cleanText = text.replace(/[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋]/g, '')
                          .replace(/^(George|Matilda|Moon Dog):\s*/i, '')
                          .trim();
        
        // Find matching audio file
        const audioFile = this.audioManifest.files.find(file => 
            file.character === character && 
            (file.text === text || file.clean_text === cleanText)
        );
        
        return audioFile ? `./audio/${audioFile.filename}` : null;
    }
    
    async preloadAudio(audioPath) {
        if (this.audioCache.has(audioPath)) {
            return this.audioCache.get(audioPath);
        }
        
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                this.audioCache.set(audioPath, audio);
                resolve(audio);
            });
            
            audio.addEventListener('error', (error) => {
                console.warn(`⚠️ Failed to load audio: ${audioPath}`, error);
                reject(error);
            });
            
            audio.src = audioPath;
            audio.preload = 'auto';
        });
    }
    
    async unlockAudio() {
        if (this.audioUnlocked) return;
        
        try {
            // Create a silent audio to unlock the audio context
            const silentAudio = new Audio();
            silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSRxx+/e';
            
            await silentAudio.play();
            this.audioUnlocked = true;
            console.log('🔓 Audio context unlocked for mobile');
        } catch (error) {
            console.warn('⚠️ Failed to unlock audio context:', error);
        }
    }

    async playAudio(audioPath) {
        try {
            // Ensure audio is unlocked
            if (!this.audioUnlocked) {
                await this.unlockAudio();
            }
            
            const audio = await this.preloadAudio(audioPath);
            
            // Stop current audio
            if (this.currentAudio && !this.currentAudio.paused) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            this.currentAudio = audio;
            audio.currentTime = 0;
            
            return new Promise((resolve) => {
                const handleEnd = () => {
                    audio.removeEventListener('ended', handleEnd);
                    audio.removeEventListener('error', handleError);
                    resolve();
                };
                
                const handleError = (error) => {
                    audio.removeEventListener('ended', handleEnd);
                    audio.removeEventListener('error', handleError);
                    console.warn('⚠️ Audio playback error:', error);
                    resolve(); // Continue even if audio fails
                };
                
                audio.addEventListener('ended', handleEnd);
                audio.addEventListener('error', handleError);
                
                audio.play().catch(error => {
                    console.warn('⚠️ Audio play failed:', error);
                    resolve(); // Continue even if play fails
                });
            });
        } catch (error) {
            console.warn('⚠️ Audio system error:', error);
            return Promise.resolve(); // Continue even if audio system fails
        }
    }
    
    async speak(text, character) {
        if (!this.audioEnabled) {
            return Promise.resolve();
        }
        
        // Try to use audio files on mobile, fall back to text-to-speech
        if (this.isMobile && this.audioManifest) {
            const audioPath = await this.getAudioFile(text, character);
            if (audioPath) {
                console.log(`🎵 Playing audio: ${character} - ${text.substring(0, 30)}...`);
                return this.playAudio(audioPath);
            }
        }
        
        // Fallback to text-to-speech
        return this.fallbackToTextToSpeech(text, character);
    }
    
    fallbackToTextToSpeech(text, character) {
        // This will be handled by the existing game text-to-speech system
        console.log(`🗣️ Using text-to-speech: ${character} - ${text.substring(0, 30)}...`);
        return Promise.resolve();
    }
    
    stop() {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
    }
    
    setEnabled(enabled) {
        this.audioEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }
    
    isEnabled() {
        return this.audioEnabled;
    }
    
    // Estimate duration for timing (used by game for dialogue pacing)
    estimateDuration(text) {
        const wordsPerMinute = 180; // Average speaking rate
        const words = text.split(' ').length;
        const durationMs = (words / wordsPerMinute) * 60 * 1000;
        return Math.max(2000, durationMs + 1000); // Minimum 2 seconds, plus 1 second buffer
    }
}

// Export for use in main game
window.MobileAudioSystem = MobileAudioSystem;