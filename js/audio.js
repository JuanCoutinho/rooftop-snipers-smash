/**
 * AUDIO SYSTEM - Sintetizador de Sons Profissional
 * Gera todos os efeitos sonoros proceduralmente
 */

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = this.sfxVolume;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API não suportada');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSfxVolume(value) {
        this.sfxVolume = value;
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    }

    // Criar oscilador base
    createOscillator(type, frequency) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = frequency;
        return osc;
    }

    // Criar envelope ADSR
    createEnvelope(attack, decay, sustain, release) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + attack);
        gain.gain.linearRampToValueAtTime(sustain, this.ctx.currentTime + attack + decay);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + attack + decay + release);
        return gain;
    }

    // Som de tiro - épico e impactante
    playShoot() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Camada 1: Explosão grave
        const osc1 = this.createOscillator('sawtooth', 150);
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Camada 2: Crack agudo
        const osc2 = this.createOscillator('square', 800);
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now);
        osc2.stop(now + 0.05);

        // Camada 3: Ruído
        this.playNoise(0.08, 0.15);
    }

    // Ruído branco
    playNoise(duration, volume) {
        if (!this.initialized) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    // Som de pulo
    playJump() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.createOscillator('sine', 200);
        const gain = this.ctx.createGain();

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Som de hit/impacto
    playHit() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Impacto grave
        const osc1 = this.createOscillator('sawtooth', 100);
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc1.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Distorção
        const osc2 = this.createOscillator('square', 200);
        const gain2 = this.ctx.createGain();
        const distortion = this.ctx.createWaveShaper();
        distortion.curve = this.makeDistortionCurve(400);

        gain2.gain.setValueAtTime(0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc2.connect(distortion);
        distortion.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now);
        osc2.stop(now + 0.15);
    }

    // Curva de distorção
    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    // Som de morte/splash
    playSplash() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Splash noise
        this.playNoise(0.5, 0.3);

        // Tom descendente
        const osc = this.createOscillator('sine', 400);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Som de vitória
    playWin() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.createOscillator('square', freq);
            const gain = this.ctx.createGain();
            const startTime = now + i * 0.12;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Som de countdown
    playCountdown(isFinal = false) {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const freq = isFinal ? 880 : 440;
        const duration = isFinal ? 0.4 : 0.15;

        const osc = this.createOscillator('square', freq);
        const gain = this.ctx.createGain();

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }

    // Som de menu click
    playClick() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.createOscillator('sine', 600);
        const gain = this.ctx.createGain();

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Som de ponto marcado
    playScore() {
        if (!this.initialized) return;
        this.resume();

        const now = this.ctx.currentTime;

        [440, 660, 880].forEach((freq, i) => {
            const osc = this.createOscillator('triangle', freq);
            const gain = this.ctx.createGain();
            const startTime = now + i * 0.08;

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }
}

// Instância global
const Audio = new AudioSystem();
