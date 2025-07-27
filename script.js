class MoonVegetableGame {
    constructor() {
        this.score = 0;
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('score');
        this.startBtn = document.getElementById('startBtn');
        this.george = document.getElementById('george');
        this.matilda = document.getElementById('matilda');
        
        this.currentPlayer = 'george';
        this.gameRunning = false;
        this.vegetables = ['🥕', '🥬', '🌽', '🍅', '🥒', '🥔'];
        
        this.init();
    }
    
    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.createStars();
    }
    
    createStars() {
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.textContent = '✦';
            star.style.left = Math.random() * 800 + 'px';
            star.style.top = Math.random() * 400 + 'px';
            star.style.animationDelay = Math.random() * 3 + 's';
            this.gameArea.appendChild(star);
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.updateScore();
        this.startBtn.textContent = 'Game Running!';
        this.startBtn.disabled = true;
        
        // Clear existing vegetables
        document.querySelectorAll('.vegetable').forEach(v => v.remove());
        
        // Start spawning vegetables
        this.spawnVegetables();
        
        // Game timer
        setTimeout(() => this.endGame(), 60000); // 1 minute game
    }
    
    spawnVegetables() {
        if (!this.gameRunning) return;
        
        const vegetable = document.createElement('div');
        vegetable.className = 'vegetable';
        vegetable.textContent = this.vegetables[Math.floor(Math.random() * this.vegetables.length)];
        
        // Random position on moon surface
        vegetable.style.left = Math.random() * 700 + 'px';
        vegetable.style.bottom = Math.random() * 200 + 120 + 'px';
        
        vegetable.addEventListener('click', () => this.collectVegetable(vegetable));
        
        this.gameArea.appendChild(vegetable);
        
        // Remove vegetable after 5 seconds if not collected
        setTimeout(() => {
            if (vegetable.parentNode) {
                vegetable.remove();
            }
        }, 5000);
        
        // Spawn next vegetable
        setTimeout(() => this.spawnVegetables(), Math.random() * 2000 + 1000);
    }
    
    collectVegetable(vegetable) {
        // Check if character is close enough
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
        const charRect = currentCharacter.getBoundingClientRect();
        const vegRect = vegetable.getBoundingClientRect();
        
        const distance = Math.sqrt(
            Math.pow(charRect.left - vegRect.left, 2) + 
            Math.pow(charRect.top - vegRect.top, 2)
        );
        
        if (distance < 100) {
            vegetable.classList.add('collected');
            this.score += 10;
            this.updateScore();
            
            setTimeout(() => {
                if (vegetable.parentNode) {
                    vegetable.remove();
                }
            }, 500);
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        const currentCharacter = this.currentPlayer === 'george' ? this.george : this.matilda;
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
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    endGame() {
        this.gameRunning = false;
        this.startBtn.textContent = 'Play Again';
        this.startBtn.disabled = false;
        
        alert(`🎉 Great job! George and Matilda collected ${this.score} points worth of vegetables from the moon! 🌙`);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MoonVegetableGame();
});