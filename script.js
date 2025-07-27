class MoonVegetableGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.startBtn = document.getElementById('startBtn');
        this.george = document.getElementById('george');
        this.matilda = document.getElementById('matilda');
        
        this.currentPlayer = 'george';
        this.gameRunning = false;
        this.vegetables = ['🥕', '🥬', '🌽', '🍅', '🥒', '🥔'];
        this.vegetableElements = [];
        this.collectedVegetables = [];
        this.vegetablesNeeded = 6;
        
        // Game state management
        this.gameState = 'spaceFlight'; // spaceFlight, moonSurface, moonDogHouse, emptyFridge, vegetableGarden, etc.
        this.spaceshipX = 400;
        this.spaceshipY = 300;
        this.flightProgress = 0;
        this.asteroids = [];
        this.dialogueStep = 0;
        this.houseEntered = false;
        this.cookingStarted = false;
        this.returnDialogueStep = 0;
        this.cookingDialogueStep = 0;
        this.cleanedVegetables = [];
        this.choppedVegetables = [];
        this.platedFood = false;
        this.dayCounter = 0;
        this.currentCookingStep = 'washing'; // washing, chopping, plating, eating, sleeping, staying
        this.selectedActivities = [];
        this.currentActivity = null;
        this.dailyActivitiesCompleted = [];
        
        // Following mechanics
        this.followQueue = [];
        this.maxFollowDistance = 80;
        this.followSpeed = 12;
        
        this.init();
    }
    
    init() {
        this.startBtn.addEventListener('click', () => this.startSpaceFlight());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Add click listener to unlock audio on any user interaction
        this.gameArea.addEventListener('click', () => {
            if (this.mobileAudio && this.mobileAudio.isMobile && !this.mobileAudio.audioUnlocked) {
                this.mobileAudio.unlockAudio();
            }
        });
        
        this.createPickupSound();
        this.initSpaceFlight();
        this.initAudioSettings();
        this.initMobileControls();
    }
    
    initAudioSettings() {
        // Audio is always enabled - no mute functionality
        this.speechMuted = false;
    }
    
    initMobileControls() {
        // Detect if device is mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        window.innerWidth <= 768;
        
        if (this.isMobile) {
            this.showMobileControls();
        }
        
        // Add touch event listeners for mobile controls
        const directionButtons = document.querySelectorAll('.direction-btn');
        const switchButton = document.getElementById('switchBtn');
        
        directionButtons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.handleMobileMovement(direction);
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
        });
        
        if (switchButton) {
            switchButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.switchCharacter();
            });
        }
        
        // Add window resize listener to show/hide mobile controls
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            if (this.isMobile) {
                this.showMobileControls();
            } else {
                this.hideMobileControls();
            }
        });
    }
    
    showMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'block';
        }
    }
    
    hideMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
    }
    
    handleMobileMovement(direction) {
        // Simulate keyboard event for mobile touch
        const keyMap = {
            'up': 'ArrowUp',
            'down': 'ArrowDown',
            'left': 'ArrowLeft',
            'right': 'ArrowRight'
        };
        
        const keyEvent = {
            key: keyMap[direction],
            preventDefault: () => {}
        };
        
        this.handleKeyPress(keyEvent);
    }
    
    createPickupSound() {
        // Create a simple pickup sound using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Initialize text-to-speech and mobile audio system
        this.initTextToSpeech();
        this.initMobileAudio();
    }
    
    initTextToSpeech() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            this.voices = {};
            
            // Wait for voices to load
            const loadVoices = () => {
                const availableVoices = this.speechSynthesis.getVoices();
                
                // Try to find different voice types for characters
                const femaleVoices = availableVoices.filter(voice => 
                    voice.name.toLowerCase().includes('female') || 
                    voice.name.toLowerCase().includes('woman') ||
                    voice.name.toLowerCase().includes('alex') ||
                    voice.name.toLowerCase().includes('zira')
                );
                
                const maleVoices = availableVoices.filter(voice => 
                    voice.name.toLowerCase().includes('male') || 
                    voice.name.toLowerCase().includes('man') ||
                    voice.name.toLowerCase().includes('david') ||
                    voice.name.toLowerCase().includes('mark')
                );
                
                // Assign voices to characters
                this.voices.george = maleVoices[0] || availableVoices[0];
                this.voices.matilda = femaleVoices[0] || availableVoices[1] || availableVoices[0];
                this.voices.moondog = availableVoices.find(voice => 
                    voice.name.toLowerCase().includes('daniel') ||
                    voice.name.toLowerCase().includes('google')
                ) || availableVoices[2] || availableVoices[0];
                this.voices.narrator = availableVoices[0];
            };
            
            // Load voices immediately if available
            loadVoices();
            
            // Also listen for voice changes (some browsers load voices async)
            this.speechSynthesis.onvoiceschanged = loadVoices;
        } else {
            console.log('Text-to-speech not supported in this browser');
        }
    }
    
    initMobileAudio() {
        // Initialize mobile audio system for better mobile speech
        if (window.MobileAudioSystem) {
            this.mobileAudio = new window.MobileAudioSystem();
            console.log('🎵 Mobile audio system initialized');
        } else {
            console.warn('⚠️ Mobile audio system not available');
            this.mobileAudio = null;
        }
    }
    
    speak(text, character = 'narrator') {
        console.log(`🎮 Game speak() called - text: "${text.substring(0, 30)}..."`);
        
        // Audio is always enabled
        
        // Try mobile audio system first on mobile devices
        if (this.mobileAudio && this.mobileAudio.isMobile) {
            console.log('📱 Using mobile audio system');
            return this.mobileAudio.speak(text, character);
        }
        
        console.log('🖥️ Using desktop text-to-speech');
        
        // Fallback to text-to-speech
        if (!this.speechSynthesis) return Promise.resolve();
        
        // Stop any currently speaking text
        this.speechSynthesis.cancel();
        
        // Process text for more natural speech
        const naturalText = this.processTextForSpeech(text, character);
        
        if (naturalText.length === 0) return Promise.resolve();
        
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(naturalText);
            
            // Set voice based on character
            if (this.voices[character]) {
                utterance.voice = this.voices[character];
            }
            
            // Character-specific natural speech settings
            this.applyCharacterVoice(utterance, character);
            
            // Add event listeners to handle completion
            utterance.onend = () => {
                resolve();
            };
            
            utterance.onerror = () => {
                resolve(); // Resolve even on error to prevent hanging
            };
            
            this.speechSynthesis.speak(utterance);
        });
    }
    
    // Calculate estimated speech duration for fallback timing
    estimateSpeechDuration(text, rate = 0.8) {
        // Rough estimate: average speaking rate is about 150-160 words per minute
        // Adjusted for our slower rate
        const wordsPerMinute = 120 * rate;
        const words = text.split(' ').length;
        const durationMs = (words / wordsPerMinute) * 60 * 1000;
        return Math.max(2000, durationMs + 1000); // Minimum 2 seconds, plus 1 second buffer
    }
    
    processTextForSpeech(text, character) {
        // Remove emojis but keep the text natural
        let cleanText = text.replace(/[🚀👨‍🚀👩‍🚀🐕‍🦺🧊😢💖👨‍🍳👩‍🍳🥕🥬🌽🍅🥒🥔🌙🏠🚪😋]/g, '').trim();
        
        // Remove character names from the beginning since we're using different voices
        cleanText = cleanText.replace(/^(George|Matilda|Moon Dog):\s*/i, '');
        
        // Add natural pauses and improve readability
        cleanText = cleanText
            // Add natural breathing pauses
            .replace(/\.\.\./g, '... ')
            // Add emphasis to important words
            .replace(/\bWoof\b/gi, 'Woof woof')
            .replace(/\bOh no\b/gi, 'Oh... no')
            .replace(/\bGreat\b/gi, 'Great!')
            .replace(/\bAmazing\b/gi, 'Amazing!')
            .replace(/\bWelcome\b/gi, 'Welcome!')
            // Add natural hesitation for emotional moments
            .replace(/I'm so embarrassed/gi, "I'm... so embarrassed")
            .replace(/I haven't been to the garden/gi, "I haven't been to the garden")
            // Make exclamations more enthusiastic
            .replace(/\bLet's\b/gi, "Let's")
            .replace(/\bDon't worry\b/gi, "Don't worry!")
            // Add natural flow for numbers
            .replace(/(\d+)/g, (match) => {
                const num = parseInt(match);
                return num === 1 ? 'one' : num === 2 ? 'two' : num === 3 ? 'three' : 
                       num === 4 ? 'four' : num === 5 ? 'five' : num === 6 ? 'six' : match;
            });
        
        // Character-specific text modifications for personality
        if (character === 'moondog') {
            // Make Moon Dog sound more dog-like and friendly
            cleanText = cleanText.replace(/\bHi\b/gi, 'Woof! Hi there');
            cleanText = cleanText.replace(/\bHello\b/gi, 'Woof! Hello');
            cleanText = cleanText.replace(/\bThank you\b/gi, 'Thank you so much, woof!');
        } else if (character === 'george') {
            // Make George sound more enthusiastic and helpful
            cleanText = cleanText.replace(/\bGreat idea\b/gi, 'That\'s a great idea');
            cleanText = cleanText.replace(/\bWe're back\b/gi, 'Hey! We\'re back');
        } else if (character === 'matilda') {
            // Make Matilda sound more caring and solution-oriented
            cleanText = cleanText.replace(/\bDon't worry\b/gi, 'Oh, don\'t worry about that');
            cleanText = cleanText.replace(/\bLet's go\b/gi, 'Come on, let\'s go');
        }
        
        return cleanText.trim();
    }
    
    applyCharacterVoice(utterance, character) {
        // Base settings for natural speech
        utterance.volume = 0.9;
        utterance.rate = 0.8; // Slower for better comprehension and naturalness
        
        switch (character) {
            case 'george':
                utterance.pitch = 0.85; // Lower, more masculine
                utterance.rate = 0.85; // Confident pace
                break;
                
            case 'matilda':
                utterance.pitch = 1.25; // Higher, more feminine
                utterance.rate = 0.8; // Thoughtful, caring pace
                break;
                
            case 'moondog':
                utterance.pitch = 1.1; // Friendly, dog-like
                utterance.rate = 0.9; // Energetic but clear
                break;
                
            case 'narrator':
                utterance.pitch = 1.0; // Neutral
                utterance.rate = 0.75; // Clear and steady for instructions
                break;
                
            default:
                utterance.pitch = 1.0;
                utterance.rate = 0.8;
        }
        
        // Add natural speech events
        utterance.onstart = () => {
            // Visual feedback could go here
        };
        
        utterance.onend = () => {
            // Natural pause after speech completes
        };
    }
    
    playPickupSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    initSpaceFlight() {
        this.gameState = 'spaceFlight';
        this.gameArea.innerHTML = '';
        this.createSpaceBackground();
        this.createSpaceship();
        this.createEarth();
        this.createMoon();
        this.startBtn.textContent = 'Start Space Journey!';
    }
    
    createSpaceBackground() {
        // Create scrolling starfield
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'space-star';
            star.textContent = '✦';
            star.style.left = Math.random() * 800 + 'px';
            star.style.top = Math.random() * 600 + 'px';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.fontSize = (Math.random() * 10 + 5) + 'px';
            this.gameArea.appendChild(star);
        }
    }
    
    createSpaceship() {
        const spaceship = document.createElement('div');
        spaceship.id = 'spaceship';
        spaceship.className = 'spaceship';
        spaceship.textContent = '🚀';
        spaceship.style.left = this.spaceshipX + 'px';
        spaceship.style.top = this.spaceshipY + 'px';
        this.gameArea.appendChild(spaceship);
    }
    
    createEarth() {
        const earth = document.createElement('div');
        earth.id = 'earth';
        earth.className = 'planet';
        earth.textContent = '🌍';
        earth.style.left = '50px';
        earth.style.bottom = '50px';
        earth.style.fontSize = '80px';
        this.gameArea.appendChild(earth);
    }
    
    createMoon() {
        const moon = document.createElement('div');
        moon.id = 'moon';
        moon.className = 'planet';
        moon.textContent = '🌙';
        moon.style.right = '50px';
        moon.style.top = '50px';
        moon.style.fontSize = '60px';
        this.gameArea.appendChild(moon);
    }
    
    startSpaceFlight() {
        if (this.gameState === 'spaceFlight' || this.gameState === 'completed') {
            // Reset all game variables for a fresh start
            if (this.gameState === 'completed') {
                this.resetGameState();
            }
            
            // Unlock audio context for mobile when user interacts
            if (this.mobileAudio && this.mobileAudio.isMobile) {
                this.mobileAudio.unlockAudio();
            }
            
            this.gameRunning = true;
            this.startBtn.textContent = 'Flying to Moon...';
            this.startBtn.disabled = true;
            this.flightProgress = 0;
            this.spawnAsteroids();
            this.spaceFlightLoop();
        } else if (this.gameState === 'readyForSurface') {
            this.initMoonSurface();
        } else if (this.gameState === 'readyForGarden') {
            this.startVegetableGame();
        } else if (this.gameState === 'readyToReturn') {
            this.returnToHouseWithVegetables();
        }
    }
    
    resetGameState() {
        // Clear any existing timers
        if (this.gameTimer) {
            clearTimeout(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Reset all cooking and game variables
        this.cookingStarted = false;
        this.returnDialogueStep = 0;
        this.cookingDialogueStep = 0;
        this.cleanedVegetables = [];
        this.choppedVegetables = [];
        this.platedFood = false;
        this.dayCounter = 0;
        this.currentCookingStep = 'washing';
        this.collectedVegetables = [];
        this.vegetableElements = [];
        this.dialogueStep = 0;
        this.houseEntered = false;
        this.refrigeratorChecked = false;
        this.followQueue = [];
        this.selectedActivities = [];
        this.currentActivity = null;
        this.dailyActivitiesCompleted = [];
        this.gameState = 'spaceFlight';
        
        console.log('Game state reset for new game');
    }
    
    startVegetableGame() {
        this.gameState = 'vegetableGarden';
        this.gameRunning = true;
        this.initVegetableGarden();
        
        // Start spawning vegetables
        this.spawnVegetables();
        
        // Start collision detection
        this.gameLoop();
        
        // Game timer - store reference so we can clear it later
        this.gameTimer = setTimeout(() => this.endGame(), 60000); // 1 minute game
    }
    
    initVegetableGarden() {
        this.gameArea.innerHTML = '';
        
        // Create moon surface
        const moonSurface = document.createElement('div');
        moonSurface.className = 'moon-surface';
        this.gameArea.appendChild(moonSurface);
        
        // Create inventory display
        this.createInventoryDisplay();
        
        // Create stars background
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.textContent = '✦';
            star.style.left = Math.random() * 800 + 'px';
            star.style.top = Math.random() * 400 + 'px';
            star.style.animationDelay = Math.random() * 3 + 's';
            this.gameArea.appendChild(star);
        }
        
        // Re-create characters
        const george = document.createElement('div');
        george.className = 'character';
        george.id = 'george';
        george.textContent = '👨‍🚀';
        george.style.bottom = '120px';
        george.style.left = '100px';
        this.gameArea.appendChild(george);
        
        const matilda = document.createElement('div');
        matilda.className = 'character';
        matilda.id = 'matilda';
        matilda.textContent = '👩‍🚀';
        matilda.style.bottom = '120px';
        matilda.style.left = '200px';
        this.gameArea.appendChild(matilda);
        
        this.george = george;
        this.matilda = matilda;
    }
    
    spaceFlightLoop() {
        if (!this.gameRunning || this.gameState !== 'spaceFlight') return;
        
        this.updateSpaceFlight();
        this.checkAsteroidCollisions();
        
        if (this.flightProgress >= 100) {
            this.completeFlight();
            return;
        }
        
        requestAnimationFrame(() => this.spaceFlightLoop());
    }
    
    updateSpaceFlight() {
        this.flightProgress += 0.5;
        
        // Move spaceship towards moon
        const startX = 400;
        const endX = 650;
        const startY = 300;
        const endY = 150;
        
        const progress = this.flightProgress / 100;
        this.spaceshipX = startX + (endX - startX) * progress;
        this.spaceshipY = startY + (endY - startY) * progress;
        
        const spaceship = document.getElementById('spaceship');
        if (spaceship) {
            spaceship.style.left = this.spaceshipX + 'px';
            spaceship.style.top = this.spaceshipY + 'px';
        }
        
        // Scroll stars
        document.querySelectorAll('.space-star').forEach(star => {
            let left = parseInt(star.style.left);
            left -= 2;
            if (left < -20) {
                left = 820;
                star.style.top = Math.random() * 600 + 'px';
            }
            star.style.left = left + 'px';
        });
        
        // Update progress display
        this.startBtn.textContent = `Flying to Moon... ${Math.floor(this.flightProgress)}%`;
    }
    
    spawnAsteroids() {
        if (!this.gameRunning || this.gameState !== 'spaceFlight') return;
        
        const asteroid = document.createElement('div');
        asteroid.className = 'asteroid';
        asteroid.textContent = '☄️';
        asteroid.style.right = '0px';
        asteroid.style.top = Math.random() * 500 + 'px';
        asteroid.style.fontSize = '30px';
        this.gameArea.appendChild(asteroid);
        this.asteroids.push(asteroid);
        
        setTimeout(() => this.spawnAsteroids(), Math.random() * 3000 + 2000);
    }
    
    checkAsteroidCollisions() {
        const spaceship = document.getElementById('spaceship');
        if (!spaceship) return;
        
        this.asteroids.forEach((asteroid, index) => {
            if (!asteroid.parentNode) {
                this.asteroids.splice(index, 1);
                return;
            }
            
            // Move asteroid left
            let right = parseInt(asteroid.style.right) || 0;
            right += 3;
            asteroid.style.right = right + 'px';
            
            // Remove if off screen
            if (right > 850) {
                asteroid.remove();
                this.asteroids.splice(index, 1);
            }
        });
    }
    
    completeFlight() {
        this.gameRunning = false;
        this.startBtn.textContent = 'Landed! Walk to Moon Dog\'s House';
        this.startBtn.disabled = false;
        this.gameState = 'readyForSurface';
        this.speak('We have landed on the moon! Now let\'s walk to Moon Dog\'s house!', 'narrator');
    }
    
    initMoonSurface() {
        this.gameState = 'moonSurface';
        this.gameArea.innerHTML = '';
        this.createMoonSurfaceScene();
        this.createCharactersOnSurface();
        this.createMoonDogHouse();
        this.gameRunning = true;
        this.startBtn.textContent = 'Walk with arrow keys to Moon Dog\'s house!';
        this.startBtn.disabled = true;
        this.surfaceLoop();
    }
    
    createMoonSurfaceScene() {
        // Moon surface background
        const surface = document.createElement('div');
        surface.className = 'moon-surface-scene';
        surface.style.position = 'absolute';
        surface.style.width = '100%';
        surface.style.height = '100%';
        surface.style.background = 'linear-gradient(to bottom, #000022 0%, #220044 50%, #444 100%)';
        this.gameArea.appendChild(surface);
        
        // Create stars
        for (let i = 0; i < 30; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.textContent = '✦';
            star.style.left = Math.random() * 800 + 'px';
            star.style.top = Math.random() * 300 + 'px';
            star.style.animationDelay = Math.random() * 3 + 's';
            this.gameArea.appendChild(star);
        }
        
        // Moon ground
        const ground = document.createElement('div');
        ground.className = 'moon-ground';
        ground.style.position = 'absolute';
        ground.style.bottom = '0';
        ground.style.left = '0';
        ground.style.right = '0';
        ground.style.height = '150px';
        ground.style.background = '#888';
        ground.style.borderRadius = '0 0 50px 50px';
        this.gameArea.appendChild(ground);
        
        // Add some craters
        for (let i = 0; i < 5; i++) {
            const crater = document.createElement('div');
            crater.className = 'crater';
            crater.style.position = 'absolute';
            crater.style.bottom = Math.random() * 50 + 100 + 'px';
            crater.style.left = Math.random() * 600 + 100 + 'px';
            crater.style.width = '30px';
            crater.style.height = '30px';
            crater.style.background = '#666';
            crater.style.borderRadius = '50%';
            crater.style.boxShadow = 'inset 0 5px 10px rgba(0,0,0,0.5)';
            this.gameArea.appendChild(crater);
        }
    }
    
    createCharactersOnSurface() {
        // George
        const george = document.createElement('div');
        george.className = 'character';
        george.id = 'george';
        george.textContent = '👨‍🚀';
        george.style.bottom = '170px';
        george.style.left = '100px';
        this.gameArea.appendChild(george);
        
        // Matilda
        const matilda = document.createElement('div');
        matilda.className = 'character';
        matilda.id = 'matilda';
        matilda.textContent = '👩‍🚀';
        matilda.style.bottom = '170px';
        matilda.style.left = '150px';
        this.gameArea.appendChild(matilda);
        
        this.george = george;
        this.matilda = matilda;
        this.currentPlayer = 'george';
        this.followQueue = []; // Reset follow queue
        george.style.boxShadow = '0 0 20px #ffff00';
    }
    
    createMoonDogHouse() {
        const house = document.createElement('div');
        house.id = 'moon-dog-house';
        house.className = 'moon-house';
        house.textContent = '🏠';
        house.style.position = 'absolute';
        house.style.bottom = '150px';
        house.style.right = '100px';
        house.style.fontSize = '5em';
        house.style.cursor = 'pointer';
        house.style.filter = 'drop-shadow(0 0 20px rgba(255,255,255,0.3))';
        this.gameArea.appendChild(house);
        
        // Add door
        const door = document.createElement('div');
        door.id = 'house-door';
        door.className = 'house-door';
        door.textContent = '🚪';
        door.style.position = 'absolute';
        door.style.bottom = '150px';
        door.style.right = '140px';
        door.style.fontSize = '2em';
        door.style.zIndex = '10';
        this.gameArea.appendChild(door);
    }
    
    surfaceLoop() {
        if (!this.gameRunning || this.gameState !== 'moonSurface') return;
        
        this.checkHouseCollision();
        this.smoothFollowUpdate();
        requestAnimationFrame(() => this.surfaceLoop());
    }
    
    checkHouseCollision() {
        const george = this.george;
        const matilda = this.matilda;
        const house = document.getElementById('moon-dog-house');
        
        if (!george || !matilda || !house) return;
        
        const georgeLeft = parseInt(george.style.left) || 100;
        const georgeBottom = parseInt(george.style.bottom) || 170;
        const matildaLeft = parseInt(matilda.style.left) || 200;
        const matildaBottom = parseInt(matilda.style.bottom) || 170;
        
        const houseLeft = 650; // Right side - house size
        const houseBottom = 150;
        
        // Check if both characters are near the house
        const georgeDistance = Math.sqrt(Math.pow(georgeLeft - houseLeft, 2) + Math.pow(georgeBottom - houseBottom, 2));
        const matildaDistance = Math.sqrt(Math.pow(matildaLeft - houseLeft, 2) + Math.pow(matildaBottom - houseBottom, 2));
        
        if (georgeDistance < 100 && matildaDistance < 100) {
            this.enterHouse();
        }
    }
    
    enterHouse() {
        if (this.houseEntered) return;
        this.houseEntered = true;
        this.gameRunning = false;
        
        // Show entering message
        const enterMsg = document.createElement('div');
        enterMsg.style.position = 'absolute';
        enterMsg.style.top = '250px';
        enterMsg.style.left = '50%';
        enterMsg.style.transform = 'translateX(-50%)';
        enterMsg.style.background = 'rgba(255,215,0,0.9)';
        enterMsg.style.padding = '20px';
        enterMsg.style.borderRadius = '10px';
        enterMsg.style.fontSize = '20px';
        enterMsg.style.fontFamily = 'Comic Sans MS, cursive';
        enterMsg.style.color = 'black';
        enterMsg.style.zIndex = '30';
        const enterText = '🚪 Entering Moon Dog\'s house...';
        enterMsg.textContent = enterText;
        this.speak(enterText, 'narrator');
        this.gameArea.appendChild(enterMsg);
        
        setTimeout(() => {
            this.initMoonDogHouse();
        }, 2000);
    }
    
    initMoonDogHouse() {
        this.gameState = 'moonDogHouse';
        this.gameArea.innerHTML = '';
        this.dialogueStep = 0;
        this.refrigeratorChecked = false;
        this.createHouseInterior();
        this.createCharactersInHouse();
        this.createMoonDog();
        this.createRefrigerator();
        this.gameRunning = true;
        this.startDialogue();
        this.houseLoop();
    }
    
    createHouseInterior() {
        // House background
        const house = document.createElement('div');
        house.className = 'house-interior';
        house.style.width = '100%';
        house.style.height = '100%';
        house.style.background = 'linear-gradient(to bottom, #8B4513 0%, #D2691E 100%)';
        house.style.position = 'absolute';
        this.gameArea.appendChild(house);
        
        // Floor
        const floor = document.createElement('div');
        floor.className = 'house-floor';
        floor.style.position = 'absolute';
        floor.style.bottom = '0';
        floor.style.left = '0';
        floor.style.right = '0';
        floor.style.height = '100px';
        floor.style.background = '#654321';
        floor.style.borderTop = '3px solid #8B4513';
        this.gameArea.appendChild(floor);
        
        // Window showing moon surface
        const window = document.createElement('div');
        window.className = 'house-window';
        window.textContent = '🌙';
        window.style.position = 'absolute';
        window.style.top = '50px';
        window.style.right = '100px';
        window.style.fontSize = '60px';
        window.style.background = '#000033';
        window.style.border = '5px solid #8B4513';
        window.style.borderRadius = '10px';
        window.style.padding = '10px';
        this.gameArea.appendChild(window);
    }
    
    createCharactersInHouse() {
        // George
        const george = document.createElement('div');
        george.id = 'george';
        george.className = 'character';
        george.textContent = '👨‍🚀';
        george.style.position = 'absolute';
        george.style.bottom = '120px';
        george.style.left = '100px';
        george.style.fontSize = '3em';
        george.style.zIndex = '10';
        this.gameArea.appendChild(george);
        
        // Matilda
        const matilda = document.createElement('div');
        matilda.id = 'matilda';
        matilda.className = 'character';
        matilda.textContent = '👩‍🚀';
        matilda.style.position = 'absolute';
        matilda.style.bottom = '120px';
        matilda.style.left = '200px';
        matilda.style.fontSize = '3em';
        matilda.style.zIndex = '10';
        this.gameArea.appendChild(matilda);
        
        this.george = george;
        this.matilda = matilda;
        this.currentPlayer = 'george';
        this.followQueue = []; // Reset follow queue for house
        george.style.boxShadow = '0 0 20px #ffff00';
    }
    
    createMoonDog() {
        const moonDog = document.createElement('div');
        moonDog.id = 'moon-dog';
        moonDog.className = 'character-house';
        moonDog.textContent = '🐕‍🦺';
        moonDog.style.position = 'absolute';
        moonDog.style.bottom = '120px';
        moonDog.style.left = '350px';
        moonDog.style.fontSize = '3em';
        moonDog.style.zIndex = '10';
        this.gameArea.appendChild(moonDog);
    }
    
    createRefrigerator() {
        const fridge = document.createElement('div');
        fridge.id = 'refrigerator';
        fridge.className = 'refrigerator';
        fridge.textContent = '🧊';
        fridge.style.position = 'absolute';
        fridge.style.bottom = '100px';
        fridge.style.right = '200px';
        fridge.style.fontSize = '4em';
        fridge.style.zIndex = '10';
        this.gameArea.appendChild(fridge);
    }
    
    houseLoop() {
        if (!this.gameRunning || this.gameState !== 'moonDogHouse') return;
        
        this.checkRefrigeratorCollision();
        this.smoothFollowUpdate();
        requestAnimationFrame(() => this.houseLoop());
    }
    
    checkRefrigeratorCollision() {
        if (this.refrigeratorChecked) return;
        
        const george = this.george;
        const matilda = this.matilda;
        
        if (!george || !matilda) return;
        
        const georgeLeft = parseInt(george.style.left) || 100;
        const georgeBottom = parseInt(george.style.bottom) || 120;
        const matildaLeft = parseInt(matilda.style.left) || 200;
        const matildaBottom = parseInt(matilda.style.bottom) || 120;
        
        const fridgeRight = 200;
        const fridgeLeft = 600; // 800 - 200 (right position)
        const fridgeBottom = 100;
        
        // Check if either character is near the refrigerator
        const georgeDistance = Math.sqrt(Math.pow(georgeLeft - fridgeLeft, 2) + Math.pow(georgeBottom - fridgeBottom, 2));
        const matildaDistance = Math.sqrt(Math.pow(matildaLeft - fridgeLeft, 2) + Math.pow(matildaBottom - fridgeBottom, 2));
        
        if (georgeDistance < 80 || matildaDistance < 80) {
            this.openRefrigerator();
        }
    }
    
    startDialogue() {
        this.createDialogueBox();
        this.showNextDialogue();
    }
    
    createDialogueBox() {
        const dialogueBox = document.createElement('div');
        dialogueBox.id = 'dialogue-box';
        dialogueBox.className = 'dialogue-box';
        dialogueBox.style.position = 'absolute';
        dialogueBox.style.bottom = '20px';
        dialogueBox.style.left = '50px';
        dialogueBox.style.right = '50px';
        dialogueBox.style.background = 'rgba(0,0,0,0.8)';
        dialogueBox.style.color = 'white';
        dialogueBox.style.padding = '20px';
        dialogueBox.style.borderRadius = '10px';
        dialogueBox.style.fontSize = '18px';
        dialogueBox.style.fontFamily = 'Comic Sans MS, cursive';
        dialogueBox.style.textAlign = 'center';
        dialogueBox.style.zIndex = '20';
        dialogueBox.style.cursor = 'pointer';
        dialogueBox.addEventListener('click', () => this.showNextDialogue());
        this.gameArea.appendChild(dialogueBox);
    }
    
    async showNextDialogue() {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogues = [
            { text: "🐕‍🦺 Moon Dog: Woof! George and Matilda! Welcome to my moon house!", character: 'moondog' },
            { text: "👨‍🚀 George: Hi Moon Dog! We're so happy to visit you!", character: 'george' },
            { text: "👩‍🚀 Matilda: Your house looks amazing! We brought our appetites!", character: 'matilda' },
            { text: "🐕‍🦺 Moon Dog: Oh no... I'm so embarrassed. I don't have any food to offer you...", character: 'moondog' },
            { text: "👨‍🚀 George: Don't worry! Maybe we can help somehow?", character: 'george' },
            { text: "👩‍🚀 Matilda: Let's check your refrigerator! Walk close to it to see what's inside.", character: 'matilda' }
        ];
        
        if (this.dialogueStep < dialogues.length) {
            const dialogue = dialogues[this.dialogueStep];
            dialogueBox.textContent = dialogue.text;
            
            // Wait for speech to complete before moving to next dialogue
            await this.speak(dialogue.text, dialogue.character);
            this.dialogueStep++;
            
            // Automatically continue to next dialogue after speech completes
            setTimeout(() => {
                if (this.dialogueStep < dialogues.length) {
                    this.showNextDialogue();
                } else {
                    this.showFinalDialogue();
                }
            }, 500); // Small pause between dialogues
        }
    }
    
    async showFinalDialogue() {
        const dialogueBox = document.getElementById('dialogue-box');
        const finalText = "Walk close to the refrigerator 🧊 to see what's inside!";
        dialogueBox.textContent = finalText;
        dialogueBox.style.background = 'rgba(255,215,0,0.8)';
        dialogueBox.style.color = 'black';
        await this.speak(finalText, 'narrator');
    }
    
    async openRefrigerator() {
        if (this.refrigeratorChecked) return;
        this.refrigeratorChecked = true;
        
        const dialogueBox = document.getElementById('dialogue-box');
        const fridge = document.getElementById('refrigerator');
        
        // Change fridge to open state
        fridge.textContent = '📭'; // Empty box
        fridge.style.background = 'rgba(255,255,255,0.9)';
        fridge.style.borderRadius = '10px';
        fridge.style.padding = '10px';
        
        // Show empty fridge dialogue sequence with proper timing
        const emptyText = "😢 Oh no! The refrigerator is completely empty!";
        dialogueBox.textContent = emptyText;
        dialogueBox.style.background = 'rgba(255,0,0,0.8)';
        dialogueBox.style.color = 'white';
        await this.speak(emptyText, 'narrator');
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
        
        const moondogText = "🐕‍🦺 Moon Dog: I'm so sorry! I haven't been to the garden in days...";
        dialogueBox.textContent = moondogText;
        await this.speak(moondogText, 'moondog');
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
        
        const matildaText = "👩‍🚀 Matilda: Don't worry! Let's go to your vegetable garden and pick some fresh food!";
        dialogueBox.textContent = matildaText;
        await this.speak(matildaText, 'matilda');
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
        
        const georgeText = "👨‍🚀 George: Great idea! Let's help our friend Moon Dog!";
        dialogueBox.textContent = georgeText;
        await this.speak(georgeText, 'george');
        
        // Now show the button
        this.startBtn.textContent = 'Go to Vegetable Garden!';
        this.startBtn.disabled = false;
        this.gameState = 'readyForGarden';
        this.gameRunning = false;
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.checkCollisions();
        this.smoothFollowUpdate();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkCollisions() {
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
        const charLeft = parseInt(currentCharacter.style.left) || 100;
        const charBottom = parseInt(currentCharacter.style.bottom) || 120;
        
        this.vegetableElements.forEach((vegetable, index) => {
            if (!vegetable.parentNode) return;
            
            const vegLeft = parseInt(vegetable.style.left);
            const vegBottom = parseInt(vegetable.style.bottom);
            
            const distance = Math.sqrt(
                Math.pow(charLeft - vegLeft, 2) + 
                Math.pow(charBottom - vegBottom, 2)
            );
            
            if (distance < 50) {
                this.collectVegetable(vegetable);
                this.vegetableElements.splice(index, 1);
            }
        });
    }
    
    spawnVegetables() {
        if (!this.gameRunning) return;
        
        const vegetable = document.createElement('div');
        vegetable.className = 'vegetable';
        vegetable.textContent = this.vegetables[Math.floor(Math.random() * this.vegetables.length)];
        
        // Position vegetables on the ground (moon surface)
        vegetable.style.left = Math.random() * 700 + 'px';
        vegetable.style.bottom = '120px'; // Right on the moon surface
        
        this.gameArea.appendChild(vegetable);
        this.vegetableElements.push(vegetable);
        
        // Remove vegetable after 8 seconds if not collected
        setTimeout(() => {
            if (vegetable.parentNode) {
                vegetable.remove();
                const index = this.vegetableElements.indexOf(vegetable);
                if (index > -1) {
                    this.vegetableElements.splice(index, 1);
                }
            }
        }, 8000);
        
        // Spawn next vegetable
        setTimeout(() => this.spawnVegetables(), Math.random() * 2000 + 1500);
    }
    
    collectVegetable(vegetable) {
        vegetable.classList.add('collected');
        this.playPickupSound();
        
        // Add to inventory
        this.collectedVegetables.push(vegetable.textContent);
        this.updateInventoryDisplay();
        
        setTimeout(() => {
            if (vegetable.parentNode) {
                vegetable.remove();
            }
        }, 500);
        
        // Check if enough vegetables collected
        if (this.collectedVegetables.length >= this.vegetablesNeeded) {
            this.triggerReturnToHouse();
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) {
            console.log('Key press ignored - game not running. Game state:', this.gameState);
            return;
        }
        
        if (this.gameState === 'spaceFlight') {
            this.handleSpaceFlightControls(e);
        } else if (this.gameState === 'moonSurface' || this.gameState === 'moonDogHouse' || this.gameState === 'moonDogHouseWithFood') {
            this.handleWalkingControls(e);
        } else if (this.gameState === 'vegetableGarden') {
            this.handleGardenControls(e);
        } else if (this.gameState === 'cookingGame') {
            this.handleCookingControls(e);
        }
    }
    
    handleWalkingControls(e) {
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
        if (!currentCharacter) return;
        
        // Store previous position for following
        const prevLeft = parseInt(currentCharacter.style.left) || 100;
        const prevBottom = parseInt(currentCharacter.style.bottom) || 170;
        
        let newLeft = prevLeft;
        let newBottom = prevBottom;
        
        const moveSpeed = 15;
        
        switch(e.key) {
            case 'ArrowLeft':
                newLeft = Math.max(20, newLeft - moveSpeed);
                break;
            case 'ArrowRight':
                newLeft = Math.min(750, newLeft + moveSpeed);
                break;
            case 'ArrowUp':
                if (this.gameState === 'moonSurface') {
                    newBottom = Math.min(400, newBottom + moveSpeed);
                } else {
                    newBottom = Math.min(450, newBottom + moveSpeed);
                }
                break;
            case 'ArrowDown':
                if (this.gameState === 'moonSurface') {
                    newBottom = Math.max(170, newBottom - moveSpeed);
                } else {
                    newBottom = Math.max(120, newBottom - moveSpeed);
                }
                break;
            case ' ':
                e.preventDefault();
                this.switchCharacter();
                return; // Don't add to follow queue for character switch
        }
        
        // Only move and add to follow queue if position actually changed
        if (newLeft !== prevLeft || newBottom !== prevBottom) {
            currentCharacter.style.left = newLeft + 'px';
            currentCharacter.style.bottom = newBottom + 'px';
            
            // Add previous position to follow queue
            this.addToFollowQueue(prevLeft, prevBottom);
            this.updateFollower();
        }
    }
    
    addToFollowQueue(left, bottom) {
        this.followQueue.push({left, bottom});
        
        // Keep queue to a reasonable size (about 5-10 positions)
        if (this.followQueue.length > 10) {
            this.followQueue.shift();
        }
    }
    
    updateFollower() {
        const follower = this.currentPlayer === 'george' ? this.matilda : this.george;
        if (!follower || this.followQueue.length === 0) return;
        
        const followerLeft = parseInt(follower.style.left) || 200;
        const followerBottom = parseInt(follower.style.bottom) || 170;
        
        // Get target position from queue (a few steps behind)
        const targetIndex = Math.max(0, this.followQueue.length - 3);
        const target = this.followQueue[targetIndex];
        
        // Calculate distance to target
        const distance = Math.sqrt(
            Math.pow(followerLeft - target.left, 2) + 
            Math.pow(followerBottom - target.bottom, 2)
        );
        
        // Only move if distance is significant enough
        if (distance > this.maxFollowDistance) {
            // Move follower towards target position
            const moveX = (target.left - followerLeft) * 0.3;
            const moveY = (target.bottom - followerBottom) * 0.3;
            
            const newFollowerLeft = Math.round(followerLeft + moveX);
            const newFollowerBottom = Math.round(followerBottom + moveY);
            
            follower.style.left = newFollowerLeft + 'px';
            follower.style.bottom = newFollowerBottom + 'px';
        }
    }
    
    smoothFollowUpdate() {
        // Continuous smooth following update for animation frames
        const follower = this.currentPlayer === 'george' ? this.matilda : this.george;
        if (!follower || this.followQueue.length === 0) return;
        
        const followerLeft = parseInt(follower.style.left) || 200;
        const followerBottom = parseInt(follower.style.bottom) || 170;
        
        // Get target position from queue (a few steps behind)
        const targetIndex = Math.max(0, this.followQueue.length - 2);
        const target = this.followQueue[targetIndex];
        
        // Calculate distance to target
        const distance = Math.sqrt(
            Math.pow(followerLeft - target.left, 2) + 
            Math.pow(followerBottom - target.bottom, 2)
        );
        
        // Smooth following with smaller increments for animation
        if (distance > 30) {
            const moveX = (target.left - followerLeft) * 0.08;
            const moveY = (target.bottom - followerBottom) * 0.08;
            
            const newFollowerLeft = Math.round(followerLeft + moveX);
            const newFollowerBottom = Math.round(followerBottom + moveY);
            
            follower.style.left = newFollowerLeft + 'px';
            follower.style.bottom = newFollowerBottom + 'px';
        }
    }
    
    handleSpaceFlightControls(e) {
        const spaceship = document.getElementById('spaceship');
        if (!spaceship) return;
        
        const moveSpeed = 15;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.spaceshipX = Math.max(50, this.spaceshipX - moveSpeed);
                break;
            case 'ArrowRight':
                this.spaceshipX = Math.min(750, this.spaceshipX + moveSpeed);
                break;
            case 'ArrowUp':
                this.spaceshipY = Math.max(50, this.spaceshipY - moveSpeed);
                break;
            case 'ArrowDown':
                this.spaceshipY = Math.min(550, this.spaceshipY + moveSpeed);
                break;
        }
        
        spaceship.style.left = this.spaceshipX + 'px';
        spaceship.style.top = this.spaceshipY + 'px';
    }
    
    handleGardenControls(e) {
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
        if (!currentCharacter) return;
        
        const rect = currentCharacter.getBoundingClientRect();
        const gameRect = this.gameArea.getBoundingClientRect();
        
        let newLeft = parseInt(currentCharacter.style.left) || 100;
        let newBottom = parseInt(currentCharacter.style.bottom) || 120;
        
        const moveSpeed = 20;
        
        switch(e.key) {
            case 'ArrowLeft':
                newLeft = Math.max(0, newLeft - moveSpeed);
                break;
            case 'ArrowRight':
                newLeft = Math.min(750, newLeft + moveSpeed);
                break;
            case 'ArrowUp':
                newBottom = Math.min(550, newBottom + moveSpeed);
                break;
            case 'ArrowDown':
                newBottom = Math.max(120, newBottom - moveSpeed);
                break;
            case ' ':
                e.preventDefault();
                this.switchCharacter();
                break;
        }
        
        currentCharacter.style.left = newLeft + 'px';
        currentCharacter.style.bottom = newBottom + 'px';
    }
    
    switchCharacter() {
        // Remove highlight from current character
        const current = this.currentPlayer === 'george' ? this.george : this.matilda;
        current.style.boxShadow = '';
        
        // Switch character
        this.currentPlayer = this.currentPlayer === 'george' ? 'matilda' : 'george';
        
        // Highlight new character
        const newCurrent = this.currentPlayer === 'george' ? this.george : this.matilda;
        newCurrent.style.boxShadow = '0 0 20px #ffff00';
    }
    
    
    createInventoryDisplay() {
        const inventoryDiv = document.createElement('div');
        inventoryDiv.id = 'inventory-display';
        inventoryDiv.style.position = 'absolute';
        inventoryDiv.style.top = '20px';
        inventoryDiv.style.left = '20px';
        inventoryDiv.style.background = 'rgba(0,0,0,0.8)';
        inventoryDiv.style.color = 'white';
        inventoryDiv.style.padding = '15px';
        inventoryDiv.style.borderRadius = '10px';
        inventoryDiv.style.fontSize = '16px';
        inventoryDiv.style.fontFamily = 'Comic Sans MS, cursive';
        inventoryDiv.style.zIndex = '20';
        inventoryDiv.innerHTML = `
            <div>🧺 Vegetables Collected:</div>
            <div id='inventory-items'></div>
            <div id='inventory-count'>0/${this.vegetablesNeeded}</div>
        `;
        this.gameArea.appendChild(inventoryDiv);
        this.updateInventoryDisplay();
    }
    
    updateInventoryDisplay() {
        const inventoryItems = document.getElementById('inventory-items');
        const inventoryCount = document.getElementById('inventory-count');
        
        if (inventoryItems) {
            inventoryItems.innerHTML = this.collectedVegetables.join(' ');
        }
        
        if (inventoryCount) {
            inventoryCount.textContent = `${this.collectedVegetables.length}/${this.vegetablesNeeded}`;
            
            if (this.collectedVegetables.length >= this.vegetablesNeeded) {
                inventoryCount.style.color = '#00ff00';
                inventoryCount.textContent += ' - Ready to return!';
            }
        }
    }
    
    triggerReturnToHouse() {
        this.gameRunning = false;
        
        // Show message
        const returnMsg = document.createElement('div');
        returnMsg.style.position = 'absolute';
        returnMsg.style.top = '250px';
        returnMsg.style.left = '50%';
        returnMsg.style.transform = 'translateX(-50%)';
        returnMsg.style.background = 'rgba(0,255,0,0.9)';
        returnMsg.style.padding = '20px';
        returnMsg.style.borderRadius = '10px';
        returnMsg.style.fontSize = '20px';
        returnMsg.style.fontFamily = 'Comic Sans MS, cursive';
        returnMsg.style.color = 'black';
        returnMsg.style.zIndex = '30';
        returnMsg.style.textAlign = 'center';
        const returnText = `🎉 Great job! You've collected ${this.collectedVegetables.length} vegetables!\nLet's return to Moon Dog's house!`;
        returnMsg.innerHTML = returnText.replace('\n', '<br>');
        this.speak(returnText, 'narrator');
        this.gameArea.appendChild(returnMsg);
        
        // Update button
        this.startBtn.textContent = 'Return to Moon Dog\'s House';
        this.startBtn.disabled = false;
        this.gameState = 'readyToReturn';
        
        setTimeout(() => {
            if (returnMsg.parentNode) {
                returnMsg.remove();
            }
        }, 4000);
    }
    
    endGame() {
        this.gameRunning = false;
        this.startBtn.textContent = 'Play Again';
        this.startBtn.disabled = false;
    }
    
    returnToHouseWithVegetables() {
        this.gameState = 'moonDogHouseWithFood';
        this.gameArea.innerHTML = '';
        this.createHouseInterior();
        this.createCharactersInHouse();
        this.createMoonDog();
        this.createFilledRefrigerator();
        this.gameRunning = true;
        this.startReturnDialogue();
        this.returnHouseLoop();
    }
    
    createFilledRefrigerator() {
        const fridge = document.createElement('div');
        fridge.id = 'refrigerator-filled';
        fridge.className = 'refrigerator';
        fridge.textContent = '😋'; // Filled/happy refrigerator
        fridge.style.position = 'absolute';
        fridge.style.bottom = '100px';
        fridge.style.right = '200px';
        fridge.style.fontSize = '4em';
        fridge.style.zIndex = '10';
        fridge.style.background = 'rgba(255,255,255,0.9)';
        fridge.style.borderRadius = '10px';
        fridge.style.padding = '10px';
        fridge.style.cursor = 'pointer';
        this.gameArea.appendChild(fridge);
        
        // Show vegetables around the fridge
        this.collectedVegetables.forEach((vegetable, index) => {
            const vegElement = document.createElement('div');
            vegElement.textContent = vegetable;
            vegElement.style.position = 'absolute';
            vegElement.style.fontSize = '2em';
            vegElement.style.bottom = '180px';
            vegElement.style.right = (240 + index * 40) + 'px';
            vegElement.style.zIndex = '12';
            vegElement.style.animation = 'float 2s ease-in-out infinite';
            vegElement.style.animationDelay = (index * 0.2) + 's';
            this.gameArea.appendChild(vegElement);
        });
    }
    
    returnHouseLoop() {
        if (!this.gameRunning || this.gameState !== 'moonDogHouseWithFood') return;
        
        this.checkFilledRefrigeratorCollision();
        this.smoothFollowUpdate();
        requestAnimationFrame(() => this.returnHouseLoop());
    }
    
    checkFilledRefrigeratorCollision() {
        if (this.cookingStarted) return;
        
        const george = this.george;
        const matilda = this.matilda;
        
        if (!george || !matilda) return;
        
        const georgeLeft = parseInt(george.style.left) || 100;
        const georgeBottom = parseInt(george.style.bottom) || 120;
        const matildaLeft = parseInt(matilda.style.left) || 200;
        const matildaBottom = parseInt(matilda.style.bottom) || 120;
        
        const fridgeRight = 200;
        const fridgeLeft = 600;
        const fridgeBottom = 100;
        
        const georgeDistance = Math.sqrt(Math.pow(georgeLeft - fridgeLeft, 2) + Math.pow(georgeBottom - fridgeBottom, 2));
        const matildaDistance = Math.sqrt(Math.pow(matildaLeft - fridgeLeft, 2) + Math.pow(matildaBottom - fridgeBottom, 2));
        
        if (georgeDistance < 80 || matildaDistance < 80) {
            this.startCooking();
        }
    }
    
    startReturnDialogue() {
        this.createDialogueBox();
        this.returnDialogueStep = 0;
        this.showReturnDialogue();
    }
    
    async showReturnDialogue() {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogues = [
            { text: "👨‍🚀 George: We're back, Moon Dog! Look at all the vegetables we found!", character: 'george' },
            { text: "👩‍🚀 Matilda: We collected " + this.collectedVegetables.length + " fresh vegetables for you!", character: 'matilda' },
            { text: "🐕‍🦺 Moon Dog: Wow! You two are amazing! Thank you so much!", character: 'moondog' },
            { text: "👨‍🚀 George: Let's put them in your refrigerator and cook a delicious dinner!", character: 'george' },
            { text: "👩‍🚀 Matilda: Walk close to the refrigerator to start cooking!", character: 'matilda' }
        ];
        
        if (this.returnDialogueStep < dialogues.length) {
            const dialogue = dialogues[this.returnDialogueStep];
            dialogueBox.textContent = dialogue.text;
            
            // Wait for speech to complete before moving to next dialogue
            await this.speak(dialogue.text, dialogue.character);
            this.returnDialogueStep++;
            
            // Brief pause between dialogues, then continue
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (this.returnDialogueStep < dialogues.length) {
                this.showReturnDialogue();
            } else {
                this.showReturnFinalDialogue();
            }
        }
    }
    
    async showReturnFinalDialogue() {
        const dialogueBox = document.getElementById('dialogue-box');
        const finalText = "Walk close to the refrigerator 😋 to put the vegetables inside and start cooking!";
        dialogueBox.textContent = finalText;
        dialogueBox.style.background = 'rgba(255,215,0,0.8)';
        dialogueBox.style.color = 'black';
        await this.speak(finalText, 'narrator');
    }
    
    async startCooking() {
        if (this.cookingStarted) return;
        this.cookingStarted = true;
        this.gameRunning = true;
        
        // Clear any existing game timer from vegetable collection
        if (this.gameTimer) {
            clearTimeout(this.gameTimer);
            this.gameTimer = null;
            console.log('Cleared vegetable game timer');
        }
        
        // Create or update dialogue box
        let dialogueBox = document.getElementById('dialogue-box');
        if (!dialogueBox) {
            this.createDialogueBox();
            dialogueBox = document.getElementById('dialogue-box');
        }
        
        const cookingText = "Now let's cook together! First, we need to wash the vegetables at the sink.";
        if (dialogueBox) {
            dialogueBox.textContent = cookingText;
            dialogueBox.style.background = 'rgba(0,0,0,0.8)';
            dialogueBox.style.color = 'white';
        }
        
        try {
            await this.speak(cookingText, 'narrator');
            this.initCookingKitchen();
        } catch (error) {
            console.error('Error in startCooking:', error);
            // Fallback: continue to cooking kitchen even if speech fails
            this.initCookingKitchen();
        }
    }
    
    initCookingKitchen() {
        try {
            console.log('Initializing cooking kitchen...');
            this.gameState = 'cookingGame';
            this.currentCookingStep = 'washing';
            this.gameArea.innerHTML = '';
            
            // Create kitchen background
            this.createHouseInterior();
            
            // Create cooking stations
            this.createSink();
            this.createChoppingBoard();
            this.createPlate();
            this.createTable();
            
            // Create characters as chefs
            this.createCookingCharacters();
            
            // Create vegetables to wash
            this.createVegetablesToWash();
            
            // Create task display
            this.createTaskDisplay();
            
            // Ensure game is running
            this.gameRunning = true;
            
            console.log('Cooking kitchen initialized, starting game loop...');
            
            // Start the cooking game loop
            setTimeout(() => {
                console.log('Starting cooking game loop with characters:', this.george, this.matilda);
                this.cookingGameLoop();
            }, 100);
            
            // Update start button
            this.startBtn.textContent = 'Cooking in Progress...';
            this.startBtn.disabled = true;
            
        } catch (error) {
            console.error('Error initializing cooking kitchen:', error);
            // Fallback to simple message
            this.gameArea.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 2em; text-align: center;">Cooking time! Use arrow keys to move around the kitchen!</div>';
            this.gameRunning = true;
            this.gameState = 'cookingGame';
            this.cookingGameLoop();
        }
    }
    
    createSink() {
        const sink = document.createElement('div');
        sink.id = 'sink';
        sink.textContent = '🚿';
        sink.style.position = 'absolute';
        sink.style.top = '200px';
        sink.style.left = '100px';
        sink.style.fontSize = '4em';
        sink.style.background = 'rgba(173,216,230,0.8)';
        sink.style.borderRadius = '10px';
        sink.style.padding = '10px';
        sink.style.zIndex = '5';
        this.gameArea.appendChild(sink);
    }
    
    createChoppingBoard() {
        const board = document.createElement('div');
        board.id = 'chopping-board';
        board.textContent = '🔪';
        board.style.position = 'absolute';
        board.style.top = '200px';
        board.style.left = '300px';
        board.style.fontSize = '4em';
        board.style.background = 'rgba(139,69,19,0.8)';
        board.style.borderRadius = '10px';
        board.style.padding = '10px';
        board.style.zIndex = '5';
        board.style.opacity = '0.5'; // Initially disabled
        this.gameArea.appendChild(board);
    }
    
    createPlate() {
        const plate = document.createElement('div');
        plate.id = 'plate';
        plate.textContent = '🍽️';
        plate.style.position = 'absolute';
        plate.style.top = '200px';
        plate.style.left = '500px';
        plate.style.fontSize = '4em';
        plate.style.background = 'rgba(255,255,255,0.8)';
        plate.style.borderRadius = '50%';
        plate.style.padding = '10px';
        plate.style.zIndex = '5';
        plate.style.opacity = '0.5'; // Initially disabled
        this.gameArea.appendChild(plate);
    }
    
    createTable() {
        const table = document.createElement('div');
        table.id = 'dining-table';
        table.textContent = '🪑🪑🪑';
        table.style.position = 'absolute';
        table.style.bottom = '50px';
        table.style.left = '250px';
        table.style.fontSize = '2em';
        table.style.background = 'rgba(139,69,19,0.6)';
        table.style.borderRadius = '10px';
        table.style.padding = '20px';
        table.style.zIndex = '5';
        table.style.opacity = '0.5'; // Initially disabled
        this.gameArea.appendChild(table);
    }
    
    createCookingCharacters() {
        // George as chef
        const george = document.createElement('div');
        george.id = 'george';
        george.className = 'character';
        george.textContent = '👨‍🍳';
        george.style.position = 'absolute';
        george.style.bottom = '120px';
        george.style.left = '200px';
        george.style.fontSize = '3em';
        george.style.zIndex = '10';
        this.gameArea.appendChild(george);
        
        // Matilda as chef
        const matilda = document.createElement('div');
        matilda.id = 'matilda';
        matilda.className = 'character';
        matilda.textContent = '👩‍🍳';
        matilda.style.position = 'absolute';
        matilda.style.bottom = '120px';
        matilda.style.left = '400px';
        matilda.style.fontSize = '3em';
        matilda.style.zIndex = '10';
        this.gameArea.appendChild(matilda);
        
        // Moon Dog helper
        const moonDog = document.createElement('div');
        moonDog.id = 'moon-dog';
        moonDog.className = 'character';
        moonDog.textContent = '🐕‍🦺';
        moonDog.style.position = 'absolute';
        moonDog.style.bottom = '120px';
        moonDog.style.left = '600px';
        moonDog.style.fontSize = '3em';
        moonDog.style.zIndex = '10';
        this.gameArea.appendChild(moonDog);
        
        this.george = george;
        this.matilda = matilda;
        this.currentPlayer = 'george';
        this.followQueue = [];
        george.style.boxShadow = '0 0 20px #ffff00';
        
        console.log('Cooking characters created:', {
            george: this.george,
            matilda: this.matilda,
            currentPlayer: this.currentPlayer
        });
    }
    
    createVegetablesToWash() {
        this.collectedVegetables.forEach((vegetable, index) => {
            const vegElement = document.createElement('div');
            vegElement.textContent = vegetable;
            vegElement.className = 'dirty-vegetable';
            vegElement.style.position = 'absolute';
            vegElement.style.top = '350px';
            vegElement.style.left = (50 + index * 60) + 'px';
            vegElement.style.fontSize = '2em';
            vegElement.style.zIndex = '12';
            vegElement.style.opacity = '0.7'; // Dirty appearance
            vegElement.style.filter = 'sepia(0.5)';
            this.gameArea.appendChild(vegElement);
        });
    }
    
    createTaskDisplay() {
        const taskDiv = document.createElement('div');
        taskDiv.id = 'cooking-task';
        taskDiv.style.position = 'absolute';
        taskDiv.style.top = '20px';
        taskDiv.style.right = '20px';
        taskDiv.style.background = 'rgba(0,0,0,0.8)';
        taskDiv.style.color = 'white';
        taskDiv.style.padding = '15px';
        taskDiv.style.borderRadius = '10px';
        taskDiv.style.fontSize = '16px';
        taskDiv.style.fontFamily = 'Comic Sans MS, cursive';
        taskDiv.style.zIndex = '20';
        taskDiv.innerHTML = `
            <div>🍳 Cooking Tasks:</div>
            <div id='task-status'>1. Wash vegetables at the sink 🚿</div>
        `;
        this.gameArea.appendChild(taskDiv);
    }
    
    cookingGameLoop() {
        if (!this.gameRunning || this.gameState !== 'cookingGame') return;
        
        this.checkCookingInteractions();
        this.smoothFollowUpdate();
        requestAnimationFrame(() => this.cookingGameLoop());
    }
    
    checkCookingInteractions() {
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
        const charLeft = parseInt(currentCharacter.style.left) || 100;
        const charBottom = parseInt(currentCharacter.style.bottom) || 120;
        
        if (this.currentCookingStep === 'washing') {
            this.checkSinkInteraction(charLeft, charBottom);
        } else if (this.currentCookingStep === 'chopping') {
            this.checkChoppingInteraction(charLeft, charBottom);
        } else if (this.currentCookingStep === 'plating') {
            this.checkPlatingInteraction(charLeft, charBottom);
        } else if (this.currentCookingStep === 'eating') {
            this.checkTableInteraction(charLeft, charBottom);
        }
    }
    
    checkSinkInteraction(charLeft, charBottom) {
        const sinkLeft = 100;
        const sinkTop = 200;
        const distance = Math.sqrt(Math.pow(charLeft - sinkLeft, 2) + Math.pow(charBottom - (600 - sinkTop), 2));
        
        if (distance < 80 && this.cleanedVegetables.length < this.collectedVegetables.length) {
            this.washVegetable();
        }
    }
    
    checkChoppingInteraction(charLeft, charBottom) {
        const boardLeft = 300;
        const boardTop = 200;
        const distance = Math.sqrt(Math.pow(charLeft - boardLeft, 2) + Math.pow(charBottom - (600 - boardTop), 2));
        
        if (distance < 80 && this.choppedVegetables.length < this.cleanedVegetables.length) {
            this.chopVegetable();
        }
    }
    
    checkPlatingInteraction(charLeft, charBottom) {
        const plateLeft = 500;
        const plateTop = 200;
        const distance = Math.sqrt(Math.pow(charLeft - plateLeft, 2) + Math.pow(charBottom - (600 - plateTop), 2));
        
        if (distance < 80 && !this.platedFood && this.choppedVegetables.length === this.collectedVegetables.length) {
            this.plateFood();
        }
    }
    
    checkTableInteraction(charLeft, charBottom) {
        const tableLeft = 350;
        const tableBottom = 50;
        const distance = Math.sqrt(Math.pow(charLeft - tableLeft, 2) + Math.pow(charBottom - tableBottom, 2));
        
        if (distance < 100 && this.platedFood) {
            this.startEating();
        }
    }
    
    async washVegetable() {
        if (this.cleanedVegetables.length >= this.collectedVegetables.length) return;
        
        const vegetableIndex = this.cleanedVegetables.length;
        const vegetable = this.collectedVegetables[vegetableIndex];
        this.cleanedVegetables.push(vegetable);
        
        // Remove dirty vegetable and create clean one
        const dirtyVegs = document.querySelectorAll('.dirty-vegetable');
        if (dirtyVegs[vegetableIndex]) {
            dirtyVegs[vegetableIndex].remove();
        }
        
        // Create clean vegetable near sink
        const cleanVeg = document.createElement('div');
        cleanVeg.textContent = vegetable;
        cleanVeg.className = 'clean-vegetable';
        cleanVeg.style.position = 'absolute';
        cleanVeg.style.top = '350px';
        cleanVeg.style.left = (200 + vegetableIndex * 40) + 'px';
        cleanVeg.style.fontSize = '2em';
        cleanVeg.style.zIndex = '12';
        cleanVeg.style.filter = 'brightness(1.2)';
        cleanVeg.style.animation = 'float 2s ease-in-out infinite';
        this.gameArea.appendChild(cleanVeg);
        
        this.playPickupSound();
        await this.speak(`${this.currentPlayer === 'george' ? 'George' : 'Matilda'} washed a ${vegetable}!`, this.currentPlayer);
        
        this.updateTaskDisplay();
        
        if (this.cleanedVegetables.length === this.collectedVegetables.length) {
            this.advanceToChopping();
        }
    }
    
    async chopVegetable() {
        if (this.choppedVegetables.length >= this.cleanedVegetables.length) return;
        
        const vegetableIndex = this.choppedVegetables.length;
        const vegetable = this.cleanedVegetables[vegetableIndex];
        this.choppedVegetables.push(vegetable);
        
        // Remove clean vegetable and create chopped pieces
        const cleanVegs = document.querySelectorAll('.clean-vegetable');
        if (cleanVegs[vegetableIndex]) {
            cleanVegs[vegetableIndex].remove();
        }
        
        // Create chopped vegetable pieces
        for (let i = 0; i < 3; i++) {
            const choppedPiece = document.createElement('div');
            choppedPiece.textContent = '🔸'; // Small pieces
            choppedPiece.className = 'chopped-vegetable';
            choppedPiece.style.position = 'absolute';
            choppedPiece.style.top = '350px';
            choppedPiece.style.left = (400 + vegetableIndex * 60 + i * 15) + 'px';
            choppedPiece.style.fontSize = '1em';
            choppedPiece.style.zIndex = '12';
            choppedPiece.style.color = this.getVegetableColor(vegetable);
            this.gameArea.appendChild(choppedPiece);
        }
        
        this.playPickupSound();
        await this.speak(`${this.currentPlayer === 'george' ? 'George' : 'Matilda'} chopped a ${vegetable}!`, this.currentPlayer);
        
        this.updateTaskDisplay();
        
        if (this.choppedVegetables.length === this.cleanedVegetables.length) {
            this.advanceToPlating();
        }
    }
    
    async plateFood() {
        if (this.platedFood) return;
        
        this.platedFood = true;
        
        // Remove all chopped pieces and create plated food
        document.querySelectorAll('.chopped-vegetable').forEach(piece => piece.remove());
        
        const platedMeal = document.createElement('div');
        platedMeal.textContent = '🍽️🥗';
        platedMeal.style.position = 'absolute';
        platedMeal.style.top = '320px';
        platedMeal.style.left = '480px';
        platedMeal.style.fontSize = '3em';
        platedMeal.style.zIndex = '12';
        platedMeal.style.animation = 'float 2s ease-in-out infinite';
        this.gameArea.appendChild(platedMeal);
        
        this.playPickupSound();
        await this.speak('Beautiful! The meal is plated and ready to eat!', 'narrator');
        
        this.advanceToEating();
    }
    
    async advanceToChopping() {
        this.currentCookingStep = 'chopping';
        document.getElementById('chopping-board').style.opacity = '1';
        await this.speak('Great! Now let\'s chop the vegetables on the cutting board!', 'narrator');
        this.updateTaskDisplay();
    }
    
    async advanceToPlating() {
        this.currentCookingStep = 'plating';
        document.getElementById('plate').style.opacity = '1';
        await this.speak('Perfect! Now let\'s arrange the chopped vegetables on the plate!', 'narrator');
        this.updateTaskDisplay();
    }
    
    async advanceToEating() {
        this.currentCookingStep = 'eating';
        document.getElementById('dining-table').style.opacity = '1';
        await this.speak('Dinner is ready! Everyone gather around the table to eat!', 'narrator');
        this.updateTaskDisplay();
    }
    
    async startEating() {
        this.gameRunning = false;
        
        await this.speak('What a delicious meal! Everyone is eating together!', 'narrator');
        
        // Move characters to table
        this.george.style.left = '200px';
        this.george.style.bottom = '150px';
        this.matilda.style.left = '350px';
        this.matilda.style.bottom = '150px';
        document.getElementById('moon-dog').style.left = '500px';
        document.getElementById('moon-dog').style.bottom = '150px';
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.speak('🐕‍🦺 Moon Dog: This is the most delicious meal I\'ve ever had! Thank you both!', 'moondog');
        await this.speak('👨‍🍳 George: We\'re so happy to cook for you, Moon Dog!', 'george');
        await this.speak('👩‍🍳 Matilda: It\'s wonderful to share a meal with friends!', 'matilda');
        
        this.startSleeping();
    }
    
    async startSleeping() {
        await this.speak('After the wonderful dinner, everyone is getting sleepy...', 'narrator');
        
        this.gameArea.innerHTML = '';
        this.createBedroom();
        
        await this.speak('Good night! Everyone is sleeping peacefully...', 'narrator');
        
        // Show sleeping animation
        this.showSleepingScene();
    }
    
    createBedroom() {
        // Dark bedroom background
        const bedroom = document.createElement('div');
        bedroom.style.width = '100%';
        bedroom.style.height = '100%';
        bedroom.style.background = 'linear-gradient(to bottom, #000011 0%, #000033 100%)';
        bedroom.style.position = 'absolute';
        this.gameArea.appendChild(bedroom);
        
        // Beds
        const beds = ['🛏️', '🛏️', '🛏️'];
        beds.forEach((bed, index) => {
            const bedElement = document.createElement('div');
            bedElement.textContent = bed;
            bedElement.style.position = 'absolute';
            bedElement.style.bottom = '200px';
            bedElement.style.left = (150 + index * 200) + 'px';
            bedElement.style.fontSize = '4em';
            bedElement.style.zIndex = '5';
            this.gameArea.appendChild(bedElement);
            
            // Sleeping characters
            const sleepingChar = document.createElement('div');
            sleepingChar.textContent = index === 0 ? '😴' : index === 1 ? '😴' : '🐕';
            sleepingChar.style.position = 'absolute';
            sleepingChar.style.bottom = '220px';
            sleepingChar.style.left = (160 + index * 200) + 'px';
            sleepingChar.style.fontSize = '2em';
            sleepingChar.style.zIndex = '10';
            this.gameArea.appendChild(sleepingChar);
        });
        
        // Stars and moon
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.textContent = '✨';
            star.style.position = 'absolute';
            star.style.left = Math.random() * 700 + 'px';
            star.style.top = Math.random() * 300 + 'px';
            star.style.fontSize = '1em';
            star.style.animation = 'twinkle 3s infinite';
            star.style.animationDelay = Math.random() * 3 + 's';
            this.gameArea.appendChild(star);
        }
    }
    
    async showSleepingScene() {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.speak('The next morning...', 'narrator');
        this.startThreeDayStay();
    }
    
    async startThreeDayStay() {
        this.dayCounter = 1;
        this.selectedActivities = [];
        await this.speak('Welcome to your 3-day adventure with Moon Dog! Each day you can choose fun activities to do together!', 'narrator');
        this.showInteractiveDay();
    }
    
    async showInteractiveDay() {
        this.gameArea.innerHTML = '';
        this.createHouseInterior();
        this.createInteractiveCharacters();
        
        // Create day title
        const dayTitle = document.createElement('div');
        dayTitle.style.position = 'absolute';
        dayTitle.style.top = '30px';
        dayTitle.style.left = '50%';
        dayTitle.style.transform = 'translateX(-50%)';
        dayTitle.style.fontSize = '2em';
        dayTitle.style.color = '#FFD700';
        dayTitle.style.fontFamily = 'Comic Sans MS, cursive';
        dayTitle.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        dayTitle.style.zIndex = '25';
        dayTitle.textContent = `🌅 Day ${this.dayCounter} with Moon Dog! 🌅`;
        this.gameArea.appendChild(dayTitle);
        
        await this.speak(`Good morning! It's day ${this.dayCounter} of your adventure! What would you like to do today?`, 'narrator');
        
        this.createActivityMenu();
    }
    
    createInteractiveCharacters() {
        // Create characters for interactive scenes
        const characters = [
            { id: 'george', emoji: '👨‍🚀', left: '150px' },
            { id: 'matilda', emoji: '👩‍🚀', left: '300px' },
            { id: 'moon-dog', emoji: '🐕‍🦺', left: '450px' }
        ];
        
        characters.forEach(char => {
            const element = document.createElement('div');
            element.id = char.id;
            element.textContent = char.emoji;
            element.style.position = 'absolute';
            element.style.bottom = '150px';
            element.style.left = char.left;
            element.style.fontSize = '3em';
            element.style.zIndex = '10';
            element.style.animation = 'float 3s ease-in-out infinite';
            element.style.animationDelay = Math.random() * 2 + 's';
            this.gameArea.appendChild(element);
        });
    }
    
    createActivityMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'activity-menu';
        menuContainer.style.position = 'absolute';
        menuContainer.style.bottom = '80px';
        menuContainer.style.left = '50%';
        menuContainer.style.transform = 'translateX(-50%)';
        menuContainer.style.background = 'rgba(0,0,0,0.9)';
        menuContainer.style.borderRadius = '15px';
        menuContainer.style.padding = '20px';
        menuContainer.style.zIndex = '30';
        menuContainer.style.fontFamily = 'Comic Sans MS, cursive';
        menuContainer.style.color = 'white';
        menuContainer.style.textAlign = 'center';
        
        const title = document.createElement('div');
        title.style.fontSize = '1.5em';
        title.style.marginBottom = '15px';
        title.style.color = '#FFD700';
        title.textContent = '🎆 Choose Your Adventure! 🎆';
        menuContainer.appendChild(title);
        
        const activities = this.getAvailableActivities();
        
        activities.forEach((activity, index) => {
            const button = document.createElement('button');
            button.textContent = `${activity.emoji} ${activity.name}`;
            button.style.display = 'block';
            button.style.width = '300px';
            button.style.margin = '8px auto';
            button.style.padding = '12px';
            button.style.fontSize = '16px';
            button.style.border = 'none';
            button.style.borderRadius = '8px';
            button.style.background = activity.color;
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            button.style.fontFamily = 'Comic Sans MS, cursive';
            button.style.fontWeight = 'bold';
            button.style.transition = 'transform 0.2s';
            
            button.addEventListener('mouseover', () => {
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.transform = 'scale(1)';
            });
            
            button.addEventListener('click', () => {
                this.selectActivity(activity);
            });
            
            menuContainer.appendChild(button);
        });
        
        this.gameArea.appendChild(menuContainer);
    }
    
    getAvailableActivities() {
        const morningActivities = [
            { name: 'Cook Breakfast Together', emoji: '🍳', type: 'breakfast', color: '#FF6B6B' },
            { name: 'Pick Fresh Vegetables', emoji: '🥕', type: 'vegetables', color: '#4ECDC4' },
            { name: 'Play at Moon Playground', emoji: '🎠', type: 'playground', color: '#45B7D1' },
            { name: 'Make Delicious Dinner', emoji: '🍽️', type: 'dinner', color: '#F9CA24' }
        ];
        
        return morningActivities;
    }
    
    getVegetableColor(vegetable) {
        const colors = {
            '🥕': '#ff8c00', // carrot - orange
            '🥬': '#90ee90', // lettuce - light green
            '🌽': '#ffd700', // corn - yellow
            '🍅': '#ff4500', // tomato - red
            '🥒': '#32cd32', // cucumber - green
            '🥔': '#deb887'  // potato - tan
        };
        return colors[vegetable] || '#90ee90';
    }
    
    updateTaskDisplay() {
        const taskStatus = document.getElementById('task-status');
        if (!taskStatus) return;
        
        if (this.currentCookingStep === 'washing') {
            taskStatus.innerHTML = `1. Wash vegetables at sink (${this.cleanedVegetables.length}/${this.collectedVegetables.length})`;
        } else if (this.currentCookingStep === 'chopping') {
            taskStatus.innerHTML = `2. Chop vegetables on cutting board (${this.choppedVegetables.length}/${this.cleanedVegetables.length})`;
        } else if (this.currentCookingStep === 'plating') {
            taskStatus.innerHTML = `3. Arrange food on plate`;
        } else if (this.currentCookingStep === 'eating') {
            taskStatus.innerHTML = `4. Gather at table to eat together!`;
        }
    }
    
    handleCookingControls(e) {
        console.log('Cooking controls - Key pressed:', e.key, 'Game state:', this.gameState, 'Game running:', this.gameRunning);
        
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
        if (!currentCharacter) {
            console.log('No current character found!', this.currentPlayer, this.george, this.matilda);
            return;
        }
        
        let newLeft = parseInt(currentCharacter.style.left) || 100;
        let newBottom = parseInt(currentCharacter.style.bottom) || 120;
        
        console.log('Current character position:', newLeft, newBottom);
        
        const moveSpeed = 40; // Increased from 20 to make movement more visible
        
        switch(e.key) {
            case 'ArrowLeft':
                newLeft = Math.max(0, newLeft - moveSpeed);
                break;
            case 'ArrowRight':
                newLeft = Math.min(750, newLeft + moveSpeed);
                break;
            case 'ArrowUp':
                newBottom = Math.min(450, newBottom + moveSpeed);
                break;
            case 'ArrowDown':
                newBottom = Math.max(120, newBottom - moveSpeed);
                break;
            case ' ':
                e.preventDefault();
                this.switchCharacter();
                break;
        }
        
        currentCharacter.style.left = newLeft + 'px';
        currentCharacter.style.bottom = newBottom + 'px';
        
        console.log('Character moved to:', newLeft, newBottom);
        
        // Add to follow queue for the other character
        this.addToFollowQueue(parseInt(currentCharacter.style.left), parseInt(currentCharacter.style.bottom));
    }
    
    async selectActivity(activity) {
        // Remove activity menu
        const menu = document.getElementById('activity-menu');
        if (menu) menu.remove();
        
        this.currentActivity = activity;
        this.selectedActivities.push(activity);
        
        await this.speak(`Great choice! Let's ${activity.name.toLowerCase()}!`, 'narrator');
        
        // Execute the selected activity
        switch(activity.type) {
            case 'breakfast':
                await this.playBreakfastActivity();
                break;
            case 'vegetables':
                await this.playVegetableActivity();
                break;
            case 'playground':
                await this.playPlaygroundActivity();
                break;
            case 'dinner':
                await this.playDinnerActivity();
                break;
        }
    }
    
    async playBreakfastActivity() {
        this.gameArea.innerHTML = '';
        this.createHouseInterior();
        
        // Create breakfast cooking scene
        const title = document.createElement('div');
        title.textContent = '🍳 Cooking Breakfast Together! 🥞';
        title.style.position = 'absolute';
        title.style.top = '50px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#FFD700';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create breakfast items
        const breakfastItems = ['🥞', '🥓', '🍳', '🥖', '🍌'];
        breakfastItems.forEach((item, index) => {
            const element = document.createElement('div');
            element.textContent = item;
            element.style.position = 'absolute';
            element.style.top = '200px';
            element.style.left = (200 + index * 80) + 'px';
            element.style.fontSize = '3em';
            element.style.zIndex = '15';
            element.style.animation = 'float 2s ease-in-out infinite';
            element.style.animationDelay = (index * 0.3) + 's';
            this.gameArea.appendChild(element);
        });
        
        this.createInteractiveCharacters();
        
        await this.speak('Everyone is helping to make a delicious breakfast! Pancakes, bacon, eggs, and fresh fruit!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.speak('🐕‍🦺 Moon Dog: This breakfast smells amazing! Thank you for cooking with me!', 'moondog');
        await this.speak('👨‍🚀 George: Cooking together is so much fun!', 'george');
        await this.speak('👩‍🚀 Matilda: The best part is sharing it with friends!', 'matilda');
        
        await this.completeActivity();
    }
    
    async playVegetableActivity() {
        this.gameArea.innerHTML = '';
        
        // Create moon garden scene
        const surface = document.createElement('div');
        surface.style.width = '100%';
        surface.style.height = '100%';
        surface.style.background = 'linear-gradient(to bottom, #000022 0%, #444 100%)';
        surface.style.position = 'absolute';
        this.gameArea.appendChild(surface);
        
        // Add ground
        const ground = document.createElement('div');
        ground.style.position = 'absolute';
        ground.style.bottom = '0';
        ground.style.left = '0';
        ground.style.right = '0';
        ground.style.height = '150px';
        ground.style.background = '#888';
        ground.style.borderRadius = '0 0 50px 50px';
        this.gameArea.appendChild(ground);
        
        const title = document.createElement('div');
        title.textContent = '🥕 Moon Vegetable Garden 🌱';
        title.style.position = 'absolute';
        title.style.top = '50px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#00FF00';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create vegetable garden
        const vegetables = ['🥕', '🥬', '🌽', '🍅', '🥒', '🥔', '🥦', '🌶️'];
        for (let i = 0; i < 12; i++) {
            const veg = document.createElement('div');
            veg.textContent = vegetables[Math.floor(Math.random() * vegetables.length)];
            veg.style.position = 'absolute';
            veg.style.bottom = '170px';
            veg.style.left = (100 + (i % 6) * 100) + 'px';
            veg.style.fontSize = '2.5em';
            veg.style.zIndex = '15';
            veg.style.animation = 'float 3s ease-in-out infinite';
            veg.style.animationDelay = (i * 0.2) + 's';
            this.gameArea.appendChild(veg);
        }
        
        this.createInteractiveCharacters();
        
        await this.speak('Look at this amazing moon garden! So many fresh vegetables growing in the lunar soil!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.speak('🐕‍🦺 Moon Dog: My garden has grown so well thanks to your help! The vegetables are huge!', 'moondog');
        await this.speak('👩‍🚀 Matilda: These moon vegetables are the most colorful I\'ve ever seen!', 'matilda');
        await this.speak('👨‍🚀 George: Let\'s pick some for later! Fresh vegetables taste the best!', 'george');
        
        await this.completeActivity();
    }
    
    async playPlaygroundActivity() {
        this.gameArea.innerHTML = '';
        
        // Create playground scene
        const playground = document.createElement('div');
        playground.style.width = '100%';
        playground.style.height = '100%';
        playground.style.background = 'linear-gradient(45deg, #87CEEB 0%, #98FB98 100%)';
        playground.style.position = 'absolute';
        this.gameArea.appendChild(playground);
        
        const title = document.createElement('div');
        title.textContent = '🎠 Moon Playground Fun! 🌠';
        title.style.position = 'absolute';
        title.style.top = '50px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#FF1493';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create playground equipment
        const equipment = [
            { emoji: '🎠', name: 'merry-go-round', left: '100px', top: '200px' },
            { emoji: '🛠️', name: 'slide', left: '300px', top: '180px' },
            { emoji: '🎯', name: 'swing', left: '500px', top: '200px' },
            { emoji: '🎈', name: 'balloons', left: '650px', top: '150px' }
        ];
        
        equipment.forEach((item, index) => {
            const element = document.createElement('div');
            element.textContent = item.emoji;
            element.style.position = 'absolute';
            element.style.left = item.left;
            element.style.top = item.top;
            element.style.fontSize = '4em';
            element.style.zIndex = '15';
            element.style.animation = 'float 3s ease-in-out infinite';
            element.style.animationDelay = (index * 0.5) + 's';
            this.gameArea.appendChild(element);
        });
        
        this.createInteractiveCharacters();
        
        await this.speak('Welcome to the amazing Moon Playground! Everything floats and bounces in the low gravity!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.speak('👨‍🚀 George: Wow! I can jump so high here on the moon!', 'george');
        await this.speak('👩‍🚀 Matilda: The merry-go-round spins in slow motion! This is incredible!', 'matilda');
        await this.speak('🐕‍🦺 Moon Dog: This is my favorite place to play! The low gravity makes everything more fun!', 'moondog');
        
        await this.completeActivity();
    }
    
    async playDinnerActivity() {
        await this.speak('Time to make dinner! This will be extra special!', 'narrator');
        
        // Reuse the cooking game but simplified
        this.gameArea.innerHTML = '';
        this.createHouseInterior();
        
        const title = document.createElement('div');
        title.textContent = '🍽️ Special Dinner Time! 🍳';
        title.style.position = 'absolute';
        title.style.top = '50px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#FFD700';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create fancy dinner setup
        const dinnerItems = ['🍖', '🥘', '🍝', '🥗', '🍰'];
        dinnerItems.forEach((item, index) => {
            const element = document.createElement('div');
            element.textContent = item;
            element.style.position = 'absolute';
            element.style.top = '200px';
            element.style.left = (180 + index * 90) + 'px';
            element.style.fontSize = '3em';
            element.style.zIndex = '15';
            element.style.animation = 'float 2s ease-in-out infinite';
            element.style.animationDelay = (index * 0.2) + 's';
            this.gameArea.appendChild(element);
        });
        
        this.createInteractiveCharacters();
        
        await this.speak('Everyone is working together to create a magnificent dinner feast!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.speak('👩‍🚀 Matilda: This dinner looks fit for moon royalty!', 'matilda');
        await this.speak('👨‍🚀 George: The smells are making me so hungry!', 'george');
        await this.speak('🐕‍🦺 Moon Dog: I\'ve never had such a wonderful feast! You two are amazing chefs!', 'moondog');
        
        await this.completeActivity();
    }
    
    async completeActivity() {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if it's dinner time for days 2 or 3
        if (this.currentActivity.type === 'dinner' && this.dayCounter >= 2) {
            await this.stockFridgeAndRestaurant();
        } else {
            await this.continueDay();
        }
    }
    
    async stockFridgeAndRestaurant() {
        await this.speak(`What a wonderful day ${this.dayCounter}! Now let\\'s stock the fridge and visit the fancy restaurant!`, 'narrator');
        
        // Show fridge stocking
        this.gameArea.innerHTML = '';
        this.createHouseInterior();
        
        const title = document.createElement('div');
        title.textContent = '🧿 Stocking the Fridge 🧿';
        title.style.position = 'absolute';
        title.style.top = '50px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#00BFFF';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create full fridge
        const fridge = document.createElement('div');
        fridge.textContent = '🧿';
        fridge.style.position = 'absolute';
        fridge.style.bottom = '150px';
        fridge.style.left = '350px';
        fridge.style.fontSize = '5em';
        fridge.style.zIndex = '15';
        fridge.style.animation = 'float 2s ease-in-out infinite';
        this.gameArea.appendChild(fridge);
        
        // Show food items going into fridge
        const fridgeItems = ['🥛', '🥮', '🍎', '🥕', '🥜', '🍅'];
        fridgeItems.forEach((item, index) => {
            const element = document.createElement('div');
            element.textContent = item;
            element.style.position = 'absolute';
            element.style.bottom = '250px';
            element.style.left = (250 + index * 50) + 'px';
            element.style.fontSize = '2em';
            element.style.zIndex = '20';
            element.style.animation = 'collect 3s ease-out forwards';
            element.style.animationDelay = (index * 0.3) + 's';
            this.gameArea.appendChild(element);
        });
        
        this.createInteractiveCharacters();
        
        await this.speak('Moon Dog\'s fridge is now fully stocked with delicious food!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.goToFancyRestaurant();
    }
    
    async goToFancyRestaurant() {
        await this.speak('Now let\'s go to the fanciest restaurant on the moon!', 'narrator');
        
        this.gameArea.innerHTML = '';
        
        // Create fancy restaurant scene
        const restaurant = document.createElement('div');
        restaurant.style.width = '100%';
        restaurant.style.height = '100%';
        restaurant.style.background = 'linear-gradient(45deg, #8B0000 0%, #FFD700 50%, #8B0000 100%)';
        restaurant.style.position = 'absolute';
        this.gameArea.appendChild(restaurant);
        
        const title = document.createElement('div');
        title.textContent = '🍽️ ✨ Fancy Moon Restaurant ✨ 🍽️';
        title.style.position = 'absolute';
        title.style.top = '30px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#FFD700';
        title.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create fancy table setting
        const table = document.createElement('div');
        table.textContent = '🪑';
        table.style.position = 'absolute';
        table.style.bottom = '200px';
        table.style.left = '300px';
        table.style.fontSize = '6em';
        table.style.zIndex = '10';
        this.gameArea.appendChild(table);
        
        // Add fancy food
        const fancyFoods = ['🥾', '🍞', '🥭', '🍷', '🍰'];
        fancyFoods.forEach((food, index) => {
            const element = document.createElement('div');
            element.textContent = food;
            element.style.position = 'absolute';
            element.style.bottom = '280px';
            element.style.left = (250 + index * 60) + 'px';
            element.style.fontSize = '2.5em';
            element.style.zIndex = '15';
            element.style.animation = 'float 2s ease-in-out infinite';
            element.style.animationDelay = (index * 0.3) + 's';
            this.gameArea.appendChild(element);
        });
        
        // Create dressed up characters
        const fancyChars = [
            { emoji: '🤵', left: '150px' }, // George in tuxedo
            { emoji: '👰', left: '300px' }, // Matilda in dress
            { emoji: '🐕‍🦺', left: '450px' }  // Moon Dog with bow tie
        ];
        
        fancyChars.forEach(char => {
            const element = document.createElement('div');
            element.textContent = char.emoji;
            element.style.position = 'absolute';
            element.style.bottom = '120px';
            element.style.left = char.left;
            element.style.fontSize = '3em';
            element.style.zIndex = '20';
            element.style.animation = 'float 3s ease-in-out infinite';
            this.gameArea.appendChild(element);
        });
        
        await this.speak('Welcome to the most elegant restaurant on the moon! Everyone looks so fancy!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.speak('🤵 George: I feel so fancy in this tuxedo!', 'george');
        await this.speak('👰 Matilda: This restaurant is absolutely beautiful!', 'matilda');
        await this.speak('🐕‍🦺 Moon Dog: Thank you for bringing me to such a special place! This is the best day ever!', 'moondog');
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // After restaurant, end the day
        await this.speak('What a perfect ending to a wonderful day!', 'narrator');
        await this.continueDay();
    }
    
    async endDay() {
        await this.speak(`What a wonderful day ${this.dayCounter}! You completed all 4 activities!`, 'narrator');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (this.dayCounter < 3) {
            await this.speak(`Time to rest and get ready for day ${this.dayCounter + 1}!`, 'narrator');
            await this.showSleepingScene();
        } else {
            await this.speak('What an amazing 3-day adventure! Time to say goodbye to Moon Dog and return to Earth...', 'narrator');
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.startReturnJourney();
        }
    }
    
    async showSleepingScene() {
        // Show sleeping animation between days
        this.gameArea.innerHTML = '';
        this.createBedroom();
        
        await this.speak('Everyone is sleeping peacefully after such a fun day...', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Start next day
        this.dayCounter++;
        this.dailyActivitiesCompleted = []; // Reset activities for new day
        await this.speak(`Good morning! Day ${this.dayCounter} begins!`, 'narrator');
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.showInteractiveDay();
    }
    
    async continueDay() {
        // This function is called after restaurant visits
        await this.endDay();
    }
    
    async startReturnJourney() {
        await this.showGoodbyeScene();
        await this.returnSpaceFlight();
        await this.dropOffGeorgeNYC();
        await this.matildaToSanFrancisco();
        this.finishGame();
    }
    
    async showGoodbyeScene() {
        this.gameArea.innerHTML = '';
        this.createHouseInterior();
        
        // Create farewell scene
        const title = document.createElement('div');
        title.textContent = '👋 Saying Goodbye to Moon Dog 👋';
        title.style.position = 'absolute';
        title.style.top = '50px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#FFD700';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create characters for goodbye
        const characters = [
            { emoji: '👨‍🚀', left: '200px', name: 'George' },
            { emoji: '👩‍🚀', left: '350px', name: 'Matilda' },
            { emoji: '🐕‍🦺', left: '500px', name: 'Moon Dog' }
        ];
        
        characters.forEach(char => {
            const element = document.createElement('div');
            element.textContent = char.emoji;
            element.style.position = 'absolute';
            element.style.bottom = '200px';
            element.style.left = char.left;
            element.style.fontSize = '4em';
            element.style.zIndex = '15';
            element.style.animation = 'float 3s ease-in-out infinite';
            this.gameArea.appendChild(element);
        });
        
        // Add some hearts floating around
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.textContent = '💖';
            heart.style.position = 'absolute';
            heart.style.left = Math.random() * 600 + 100 + 'px';
            heart.style.top = Math.random() * 200 + 300 + 'px';
            heart.style.fontSize = '2em';
            heart.style.zIndex = '20';
            heart.style.animation = 'float 4s ease-in-out infinite';
            heart.style.animationDelay = (i * 0.5) + 's';
            this.gameArea.appendChild(heart);
        }
        
        await this.speak('🐕‍🦺 Moon Dog: Thank you so much for the most wonderful 3 days of my life!', 'moondog');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.speak('👨‍🚀 George: We had so much fun! Thank you for being such a great friend!', 'george');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.speak('👩‍🚀 Matilda: We\'ll never forget our amazing moon adventure with you!', 'matilda');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.speak('🐕‍🦺 Moon Dog: Come back and visit me again soon! I\'ll miss you both so much!', 'moondog');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    async returnSpaceFlight() {
        this.gameArea.innerHTML = '';
        this.createSpaceBackground();
        
        // Create spaceship for return journey
        const spaceship = document.createElement('div');
        spaceship.textContent = '🚀';
        spaceship.style.position = 'absolute';
        spaceship.style.left = '100px';
        spaceship.style.top = '300px';
        spaceship.style.fontSize = '4em';
        spaceship.style.zIndex = '20';
        spaceship.style.filter = 'drop-shadow(0 0 10px #ffaa00)';
        this.gameArea.appendChild(spaceship);
        
        // Create Earth in the distance
        const earth = document.createElement('div');
        earth.textContent = '🌍';
        earth.style.position = 'absolute';
        earth.style.right = '50px';
        earth.style.top = '100px';
        earth.style.fontSize = '60px';
        earth.style.zIndex = '10';
        this.gameArea.appendChild(earth);
        
        // Create moon getting smaller behind them
        const moon = document.createElement('div');
        moon.textContent = '🌙';
        moon.style.position = 'absolute';
        moon.style.left = '50px';
        moon.style.bottom = '50px';
        moon.style.fontSize = '40px';
        moon.style.zIndex = '5';
        moon.style.opacity = '0.7';
        this.gameArea.appendChild(moon);
        
        await this.speak('Now it\'s time to return to Earth! The spaceship is flying back home!', 'narrator');
        
        // Animate spaceship moving toward Earth
        let position = 100;
        const moveInterval = setInterval(() => {
            position += 15;
            spaceship.style.left = position + 'px';
            if (position > 600) {
                clearInterval(moveInterval);
            }
        }, 100);
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        await this.speak('Look! Earth is getting bigger! We\'re almost home!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    async dropOffGeorgeNYC() {
        this.gameArea.innerHTML = '';
        
        // Create New York City scene
        const cityBackground = document.createElement('div');
        cityBackground.style.width = '100%';
        cityBackground.style.height = '100%';
        cityBackground.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #F0E68C 100%)';
        cityBackground.style.position = 'absolute';
        this.gameArea.appendChild(cityBackground);
        
        const title = document.createElement('div');
        title.textContent = '🏙️ New York City - George\'s Home! 🗽';
        title.style.position = 'absolute';
        title.style.top = '30px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#FF6B6B';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create NYC skyline with emojis
        const buildings = ['🏢', '🏬', '🏢', '🏭', '🏢', '🏬', '🏢'];
        buildings.forEach((building, index) => {
            const element = document.createElement('div');
            element.textContent = building;
            element.style.position = 'absolute';
            element.style.bottom = '100px';
            element.style.left = (80 + index * 90) + 'px';
            element.style.fontSize = '4em';
            element.style.zIndex = '10';
            this.gameArea.appendChild(element);
        });
        
        // Add Statue of Liberty
        const liberty = document.createElement('div');
        liberty.textContent = '🗽';
        liberty.style.position = 'absolute';
        liberty.style.bottom = '150px';
        liberty.style.right = '100px';
        liberty.style.fontSize = '5em';
        liberty.style.zIndex = '15';
        liberty.style.animation = 'float 3s ease-in-out infinite';
        this.gameArea.appendChild(liberty);
        
        // Create characters
        const george = document.createElement('div');
        george.textContent = '👨‍🚀';
        george.style.position = 'absolute';
        george.style.bottom = '200px';
        george.style.left = '250px';
        george.style.fontSize = '3em';
        george.style.zIndex = '20';
        this.gameArea.appendChild(george);
        
        const matilda = document.createElement('div');
        matilda.textContent = '👩‍🚀';
        matilda.style.position = 'absolute';
        matilda.style.bottom = '200px';
        matilda.style.left = '400px';
        matilda.style.fontSize = '3em';
        matilda.style.zIndex = '20';
        this.gameArea.appendChild(matilda);
        
        // Add taxi
        const taxi = document.createElement('div');
        taxi.textContent = '🚕';
        taxi.style.position = 'absolute';
        taxi.style.bottom = '150px';
        taxi.style.left = '150px';
        taxi.style.fontSize = '3em';
        taxi.style.zIndex = '15';
        this.gameArea.appendChild(taxi);
        
        await this.speak('Welcome to New York City! This is where George lives!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.speak('👨‍🚀 George: Wow! It feels so good to be back in New York! I can\'t wait to tell everyone about our moon adventure!', 'george');
        await new Promise(resolve => setTimeout(resolve, 2500));
        await this.speak('👩‍🚀 Matilda: I\'m going to miss you so much, George! This was the best adventure ever!', 'matilda');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.speak('👨‍🚀 George: I\'ll miss you too, Matilda! Let\'s plan another adventure soon!', 'george');
        await new Promise(resolve => setTimeout(resolve, 2500));
        await this.speak('George waves goodbye as Matilda continues on to San Francisco...', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    async matildaToSanFrancisco() {
        this.gameArea.innerHTML = '';
        
        // Create San Francisco scene
        const cityBackground = document.createElement('div');
        cityBackground.style.width = '100%';
        cityBackground.style.height = '100%';
        cityBackground.style.background = 'linear-gradient(to bottom, #FF7F50 0%, #FFB6C1 100%)';
        cityBackground.style.position = 'absolute';
        this.gameArea.appendChild(cityBackground);
        
        const title = document.createElement('div');
        title.textContent = '🌉 San Francisco - Matilda\'s Home! 🌁';
        title.style.position = 'absolute';
        title.style.top = '30px';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.fontSize = '2em';
        title.style.color = '#4ECDC4';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.zIndex = '25';
        this.gameArea.appendChild(title);
        
        // Create Golden Gate Bridge
        const bridge = document.createElement('div');
        bridge.textContent = '🌉';
        bridge.style.position = 'absolute';
        bridge.style.top = '120px';
        bridge.style.left = '50%';
        bridge.style.transform = 'translateX(-50%)';
        bridge.style.fontSize = '6em';
        bridge.style.zIndex = '15';
        bridge.style.animation = 'float 4s ease-in-out infinite';
        this.gameArea.appendChild(bridge);
        
        // Create SF buildings
        const sfBuildings = ['🏢', '🏬', '🏘️', '🏢', '🏬'];
        sfBuildings.forEach((building, index) => {
            const element = document.createElement('div');
            element.textContent = building;
            element.style.position = 'absolute';
            element.style.bottom = '150px';
            element.style.left = (120 + index * 120) + 'px';
            element.style.fontSize = '3.5em';
            element.style.zIndex = '10';
            this.gameArea.appendChild(element);
        });
        
        // Create hills with houses
        const hills = ['🏘️', '🏡', '🏘️'];
        hills.forEach((hill, index) => {
            const element = document.createElement('div');
            element.textContent = hill;
            element.style.position = 'absolute';
            element.style.bottom = '250px';
            element.style.left = (200 + index * 150) + 'px';
            element.style.fontSize = '2.5em';
            element.style.zIndex = '5';
            element.style.opacity = '0.8';
            this.gameArea.appendChild(element);
        });
        
        // Create Matilda at home
        const matilda = document.createElement('div');
        matilda.textContent = '👩‍🚀';
        matilda.style.position = 'absolute';
        matilda.style.bottom = '200px';
        matilda.style.left = '350px';
        matilda.style.fontSize = '3em';
        matilda.style.zIndex = '20';
        this.gameArea.appendChild(matilda);
        
        // Add cable car
        const cableCar = document.createElement('div');
        cableCar.textContent = '🚋';
        cableCar.style.position = 'absolute';
        cableCar.style.bottom = '180px';
        cableCar.style.left = '500px';
        cableCar.style.fontSize = '2.5em';
        cableCar.style.zIndex = '15';
        this.gameArea.appendChild(cableCar);
        
        await this.speak('Welcome to beautiful San Francisco! This is Matilda\'s home!', 'narrator');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.speak('👩‍🚀 Matilda: Home sweet home! I love San Francisco, but I\'ll always remember our incredible moon adventure!', 'matilda');
        await new Promise(resolve => setTimeout(resolve, 2500));
        await this.speak('👩‍🚀 Matilda: I can\'t wait to tell my family about Moon Dog, the vegetable garden, the playground, and all our fun activities!', 'matilda');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.speak('👩‍🚀 Matilda: George, Moon Dog, and I will be friends forever! What an amazing adventure we had!', 'matilda');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    async finishGame() {
        this.gameArea.innerHTML = '';
        
        // Create final celebration scene
        const celebration = document.createElement('div');
        celebration.style.width = '100%';
        celebration.style.height = '100%';
        celebration.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)';
        celebration.style.position = 'absolute';
        celebration.style.display = 'flex';
        celebration.style.alignItems = 'center';
        celebration.style.justifyContent = 'center';
        celebration.style.flexDirection = 'column';
        this.gameArea.appendChild(celebration);
        
        const endMessage = document.createElement('div');
        endMessage.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 20px;">🎉 THE END 🎉</div>
            <div style="font-size: 1.5em; text-align: center; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                George and Matilda spent 3 wonderful days with Moon Dog!<br>
                They cooked together, played games, explored the moon,<br>
                and created memories that will last forever!<br><br>
                👨‍🚀👩‍🚀🐕‍🦺 Thanks for playing! 👨‍🚀👩‍🚀🐕‍🦺
            </div>
        `;
        endMessage.style.textAlign = 'center';
        endMessage.style.fontFamily = 'Comic Sans MS, cursive';
        endMessage.style.color = 'white';
        celebration.appendChild(endMessage);
        
        // Add celebration particles
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.textContent = ['🎉', '🎆', '✨', '🎈', '❤️'][Math.floor(Math.random() * 5)];
                particle.style.position = 'absolute';
                particle.style.left = Math.random() * 700 + 'px';
                particle.style.top = Math.random() * 500 + 'px';
                particle.style.fontSize = '2em';
                particle.style.zIndex = '30';
                particle.style.animation = 'collect 4s ease-out forwards';
                this.gameArea.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 4000);
            }, i * 100);
        }
        
        await this.speak('What an amazing adventure! George, Matilda and Moon Dog will be best friends forever!', 'narrator');
        
        // Show play again button
        setTimeout(() => {
            this.startBtn.textContent = 'Play Again!';
            this.startBtn.disabled = false;
            this.gameState = 'completed';
        }, 5000);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MoonVegetableGame();
});