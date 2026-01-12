class SpaceAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq, type, duration, startTime = 0, volume = 0.1) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = type;

        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playLaunch() {
        this.init();
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        // Sci-fi rising sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playComplete() {
        this.init();
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        // Success chord (C Major ish)
        this.playTone(523.25, 'sine', 0.5, now, 0.1); // C5
        this.playTone(659.25, 'sine', 0.5, now + 0.1, 0.1); // E5
        this.playTone(783.99, 'sine', 0.8, now + 0.2, 0.1); // G5
        this.playTone(1046.50, 'sine', 1.0, now + 0.3, 0.05); // C6
    }

    playDelete() {
        this.init();
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        // Retro explosion / debris
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
        osc.type = 'square';

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playLevelUp() {
        this.init();
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        // Fanfare
        this.playTone(440, 'triangle', 0.2, now, 0.1);
        this.playTone(440, 'triangle', 0.2, now + 0.15, 0.1);
        this.playTone(440, 'triangle', 0.2, now + 0.3, 0.1);
        this.playTone(587, 'triangle', 0.6, now + 0.45, 0.2); // D5
    }
}

export const spaceAudio = new SpaceAudio();
