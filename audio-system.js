// ElevenLabs Audio System for Game Speech
// Uses pre-generated ElevenLabs audio files on all platforms

class MobileAudioSystem {
    constructor() {
        this.audioCache = new Map();
        this.currentAudio = null;
        this.audioManifest = null;
        this.isMobile = this.detectMobile();
        this.audioEnabled = true;
        this.audioUnlocked = false;
        this.useElevenLabsEverywhere = true; // Force ElevenLabs audio on all platforms
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
        const cleanText = text.replace(/[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋🎉🎆✨🎈❤️🌉🏙️🗽🏢🏬🏘️🏡🚋🤵👰🌅]/g, '')
                          .trim()
                          .replace(/^George:\s*/i, '')
                          .replace(/^Matilda:\s*/i, '') 
                          .replace(/^Moon\s*Dog:\s*/i, '')
                          .replace(/^Narrator:\s*/i, '')
                          .trim();
        
        console.log(`🔍 Looking for audio: character="${character}", text="${text}"`);
        console.log(`🔍 Clean text: "${cleanText}"`);
        
        // Try multiple matching strategies
        let audioFile = null;
        
        // Strategy 1: Exact match with original text
        audioFile = this.audioManifest.files.find(file => 
            file.character === character && file.text === text
        );
        
        if (audioFile) {
            console.log(`✅ Found exact match: ${audioFile.filename}`);
            return `./audio/${audioFile.filename}`;
        }
        
        // Strategy 2: Match with clean text
        audioFile = this.audioManifest.files.find(file => 
            file.character === character && file.clean_text === cleanText
        );
        
        if (audioFile) {
            console.log(`✅ Found clean text match: ${audioFile.filename}`);
            return `./audio/${audioFile.filename}`;
        }
        
        // Strategy 3: Fuzzy matching (remove extra spaces, normalize quotes)
        const normalizedText = text.replace(/\s+/g, ' ').replace(/['"]/g, "'").trim();
        const normalizedCleanText = cleanText.replace(/\s+/g, ' ').replace(/['"]/g, "'").trim();
        
        audioFile = this.audioManifest.files.find(file => {
            const normalizedFileText = file.text.replace(/\s+/g, ' ').replace(/['"]/g, "'").trim();
            const normalizedFileCleanText = file.clean_text.replace(/\s+/g, ' ').replace(/['"]/g, "'").trim();
            
            return file.character === character && 
                   (normalizedFileText === normalizedText || 
                    normalizedFileCleanText === normalizedCleanText);
        });
        
        if (audioFile) {
            console.log(`✅ Found fuzzy match: ${audioFile.filename}`);
            return `./audio/${audioFile.filename}`;
        }
        
        // Strategy 4: Template matching for dynamic content
        if (cleanText.includes('washed a') || cleanText.includes('chopped a')) {
            // For "George washed a 🥕!" find "George washed a !" pattern
            const templateText = cleanText.replace(/[🥕🥬🌽🍅🥒🥔]/g, '');
            audioFile = this.audioManifest.files.find(file => 
                file.character === character && file.clean_text === templateText
            );
            
            if (audioFile) {
                console.log(`✅ Found template match: ${audioFile.filename}`);
                return `./audio/${audioFile.filename}`;
            }
        }
        
        // Strategy 5: Partial matching for debugging
        const partialMatches = this.audioManifest.files.filter(file => 
            file.character === character && 
            (file.text.includes(cleanText.substring(0, 20)) || 
             cleanText.includes(file.clean_text.substring(0, 20)))
        );
        
        if (partialMatches.length > 0) {
            console.log(`🔍 Found ${partialMatches.length} partial matches:`);
            partialMatches.forEach(file => {
                console.log(`  - ${file.filename}: "${file.clean_text}"`);
            });
        }
        
        console.log(`❌ No audio file found for: "${cleanText}"`);
        return null;
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
            console.log('🔓 Attempting to unlock audio context...');
            
            // Method 1: Try Web Audio API unlock
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContextClass();
                
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                    console.log('🔓 AudioContext resumed');
                }
                
                // Play a silent tone to unlock
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                gainNode.gain.value = 0;
                oscillator.frequency.value = 440;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            }
            
            // Method 2: Try HTML5 Audio unlock with multiple formats
            const formats = [
                'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSRxx+/e',
                'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAASTR4WC4yLjcuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAid8='
            ];
            
            for (const src of formats) {
                try {
                    const silentAudio = new Audio();
                    silentAudio.src = src;
                    silentAudio.volume = 0.01; // Very quiet but not silent
                    silentAudio.preload = 'auto';
                    
                    // Wait for the audio to be ready
                    await new Promise((resolve) => {
                        silentAudio.addEventListener('loadeddata', resolve, { once: true });
                        silentAudio.load();
                    });
                    
                    await silentAudio.play();
                    console.log(`🔓 Audio unlocked with format: ${src.substring(0, 20)}...`);
                    break;
                } catch (formatError) {
                    console.warn(`⚠️ Format failed: ${src.substring(0, 20)}...`, formatError);
                }
            }
            
            this.audioUnlocked = true;
            console.log('🔓 Audio context unlocked for mobile');
        } catch (error) {
            console.warn('⚠️ Failed to unlock audio context:', error);
            // Still mark as unlocked to prevent infinite retry
            this.audioUnlocked = true;
        }
    }

    async playAudio(audioPath) {
        try {
            console.log(`🎵 Attempting to play audio: ${audioPath}`);
            
            // Ensure audio is unlocked
            if (!this.audioUnlocked) {
                console.log('🔓 Audio not unlocked, attempting unlock...');
                await this.unlockAudio();
            }
            
            console.log(`🎵 Preloading audio: ${audioPath}`);
            const audio = await this.preloadAudio(audioPath);
            
            // Stop current audio
            if (this.currentAudio && !this.currentAudio.paused) {
                console.log('⏹️ Stopping current audio');
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            this.currentAudio = audio;
            audio.currentTime = 0;
            
            // Set volume to ensure it's audible
            audio.volume = 1.0;
            
            console.log(`🎵 Audio ready to play. Volume: ${audio.volume}, Duration: ${audio.duration}`);
            
            return new Promise((resolve) => {
                const handleEnd = () => {
                    audio.removeEventListener('ended', handleEnd);
                    audio.removeEventListener('error', handleError);
                    console.log('✅ Audio playback completed');
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
                
                console.log('▶️ Starting audio playback...');
                audio.play().then(() => {
                    console.log('✅ Audio play() succeeded');
                }).catch(error => {
                    console.warn('⚠️ Audio play() failed:', error);
                    resolve(); // Continue even if play fails
                });
            });
        } catch (error) {
            console.warn('⚠️ Audio system error:', error);
            return Promise.resolve(); // Continue even if audio system fails
        }
    }
    
    async speak(text, character) {
        console.log(`🗣️ speak() called - enabled: ${this.audioEnabled}, platform: ${this.isMobile ? 'mobile' : 'desktop'}, character: ${character}`);
        console.log(`🗣️ Text: "${text.substring(0, 50)}..."`);
        
        if (!this.audioEnabled) {
            console.log('⚠️ Audio disabled, skipping speech');
            return Promise.resolve();
        }
        
        // Use ElevenLabs audio files on ALL platforms when available
        if (this.audioManifest && this.useElevenLabsEverywhere) {
            console.log('🎵 Looking for ElevenLabs audio file...');
            const audioPath = await this.getAudioFile(text, character);
            if (audioPath) {
                console.log(`🎵 Found audio file: ${audioPath}`);
                console.log(`🎵 Playing ElevenLabs audio: ${character} - ${text.substring(0, 30)}...`);
                return this.playAudio(audioPath);
            } else {
                console.log('⚠️ No ElevenLabs audio file found for this text');
            }
        }
        
        // Fallback to text-to-speech only if no audio file found
        console.log('🗣️ Falling back to text-to-speech');
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