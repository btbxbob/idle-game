// Prestige Manager - Handles prestige confirmation modal and animation
class PrestigeManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.PRESTIGE_THRESHOLD = 1000000; // 1 million coins required
        this.modal = document.getElementById('prestige-modal');
        this.animation = document.getElementById('prestige-animation');
        this.prestigeButton = document.getElementById('prestige-button');
        this.confirmBtn = document.getElementById('prestige-confirm-btn');
        this.cancelBtn = document.getElementById('prestige-cancel-btn');
        this.currentCoinsEl = document.getElementById('prestige-current-coins');
        this.willGainEl = document.getElementById('prestige-will-gain');
        
        this.init();
    }
    
    init() {
        // Bind events
        if (this.prestigeButton) {
            this.prestigeButton.addEventListener('click', () => this.openModal());
        }
        
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => this.confirmPrestige());
        }
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Close modal on outside click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }
    
    // Calculate PP to gain based on current coins
    calculatePPGain() {
        const coins = this.rustGame.get_coins();
        if (coins < this.PRESTIGE_THRESHOLD) return 0;
        
        // Formula: 1 PP per 100k coins above threshold
        const excess = coins - this.PRESTIGE_THRESHOLD;
        return Math.floor(excess / 100000) + 1;
    }
    
    // Open prestige confirmation modal
    openModal() {
        const coins = this.rustGame.get_coins();
        const ppGain = this.calculatePPGain();
        
        if (coins < this.PRESTIGE_THRESHOLD) {
            alert(`需要 ${this.formatInteger(this.PRESTIGE_THRESHOLD)} 金币才能转生！\n当前金币：${this.formatInteger(coins)}`);
            return;
        }
        
        if (this.currentCoinsEl) {
            this.currentCoinsEl.textContent = this.formatInteger(coins);
        }
        
        if (this.willGainEl) {
            this.willGainEl.textContent = this.formatInteger(ppGain);
        }
        
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }
    
    // Close prestige modal
    closeModal() {
        if (this.modal) {
            this.modal.classList.add('fade-out');
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modal.classList.remove('fade-out');
            }, 300);
        }
    }
    
    // Confirm and execute prestige
    async confirmPrestige() {
        this.closeModal();
        
        // Show animation
        if (this.animation) {
            this.animation.style.display = 'block';
            this.animation.classList.add('fade-in');
        }
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Call Rust prestige function
        const ppGain = this.calculatePPGain();
        this.rustGame.do_prestige(ppGain);
        
        // Hide animation
        if (this.animation) {
            this.animation.classList.remove('fade-in');
            setTimeout(() => {
                this.animation.style.display = 'none';
            }, 1000);
        }
        
        alert(`转生成功！获得 ${this.formatInteger(ppGain)} PP！`);
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.PrestigeManager = PrestigeManager;
}
