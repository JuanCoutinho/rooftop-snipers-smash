/**
 * PARTICLE SYSTEM - Sistema de Partículas Avançado
 */

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx ?? (Math.random() - 0.5) * 10;
        this.vy = options.vy ?? (Math.random() - 0.5) * 10;
        this.life = options.life ?? 1.0;
        this.decay = options.decay ?? 0.02;
        this.color = options.color ?? '#ffffff';
        this.size = options.size ?? (Math.random() * 6 + 2);
        this.gravity = options.gravity ?? 0.2;
        this.friction = options.friction ?? 0.99;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.type = options.type ?? 'square'; // square, circle, star, spark
        this.trail = options.trail ?? false;
        this.trailPositions = [];
        this.glow = options.glow ?? false;
    }

    update() {
        if (this.trail) {
            this.trailPositions.push({ x: this.x, y: this.y, life: this.life });
            if (this.trailPositions.length > 8) {
                this.trailPositions.shift();
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay;
        this.size *= 0.97;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);

        // Desenhar trail
        if (this.trail && this.trailPositions.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * 0.5;
            ctx.lineCap = 'round';

            this.trailPositions.forEach((pos, i) => {
                ctx.globalAlpha = (i / this.trailPositions.length) * this.life * 0.5;
                if (i === 0) {
                    ctx.moveTo(pos.x, pos.y);
                } else {
                    ctx.lineTo(pos.x, pos.y);
                }
            });
            ctx.stroke();
            ctx.globalAlpha = this.life;
        }

        // Glow effect
        if (this.glow) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;

        switch (this.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star':
                this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
                break;

            case 'spark':
                ctx.beginPath();
                ctx.moveTo(-this.size * 2, 0);
                ctx.lineTo(this.size * 2, 0);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'square':
            default:
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
        }

        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    get isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.enabled = true;
    }

    update() {
        if (!this.enabled) return;

        this.particles = this.particles.filter(p => !p.isDead);
        this.particles.forEach(p => p.update());
    }

    draw(ctx) {
        if (!this.enabled) return;
        this.particles.forEach(p => p.draw(ctx));
    }

    // Explosão de partículas básica
    emit(x, y, color, count = 10, options = {}) {
        if (!this.enabled) return;

        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                color: color,
                ...options
            }));
        }
    }

    // Explosão de impacto (quando leva tiro)
    emitHit(x, y, color) {
        if (!this.enabled) return;

        // Partículas de sangue/impacto
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 5;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 8 + 3,
                decay: 0.025,
                type: 'circle',
                glow: true
            }));
        }

        // Estrelas de impacto
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                color: '#ffff00',
                size: Math.random() * 10 + 5,
                decay: 0.04,
                type: 'star',
                gravity: 0.1,
                glow: true
            }));
        }
    }

    // Efeito de tiro (muzzle flash)
    emitMuzzleFlash(x, y, angle) {
        if (!this.enabled) return;

        // Flash principal
        for (let i = 0; i < 10; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 15 + 10;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle + spread) * speed,
                vy: Math.sin(angle + spread) * speed,
                color: i < 5 ? '#ffff00' : '#ff8800',
                size: Math.random() * 5 + 2,
                decay: 0.08,
                gravity: 0,
                type: 'circle',
                glow: true
            }));
        }

        // Faíscas
        for (let i = 0; i < 5; i++) {
            const spread = (Math.random() - 0.5) * 1;
            const speed = Math.random() * 20 + 15;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle + spread) * speed,
                vy: Math.sin(angle + spread) * speed,
                color: '#ffffff',
                size: 3,
                decay: 0.05,
                gravity: 0.1,
                type: 'spark',
                trail: true
            }));
        }
    }

    // Efeito de pulo
    emitJump(x, y) {
        if (!this.enabled) return;

        for (let i = 0; i < 8; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * 1;
            const speed = Math.random() * 5 + 3;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ffffff',
                size: Math.random() * 4 + 2,
                decay: 0.05,
                gravity: 0.3,
                type: 'circle'
            }));
        }
    }

    // Efeito de poeira ao andar
    emitDust(x, y, direction) {
        if (!this.enabled) return;

        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(x, y, {
                vx: -direction * (Math.random() * 2 + 1),
                vy: -Math.random() * 2,
                color: '#8d6e63',
                size: Math.random() * 4 + 2,
                decay: 0.03,
                gravity: 0.05,
                type: 'circle'
            }));
        }
    }

    // Splash de água
    emitSplash(x, y) {
        if (!this.enabled) return;

        // Gotículas
        for (let i = 0; i < 25; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
            const speed = Math.random() * 15 + 8;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 3 === 0 ? '#4fc3f7' : '#0277bd',
                size: Math.random() * 6 + 3,
                decay: 0.015,
                gravity: 0.4,
                type: 'circle'
            }));
        }

        // Espuma
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 50, y, {
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3,
                color: '#ffffff',
                size: Math.random() * 8 + 4,
                decay: 0.02,
                gravity: 0.05,
                type: 'circle'
            }));
        }
    }

    // Confetti de vitória
    emitConfetti(x, y, count = 50) {
        if (!this.enabled) return;

        const colors = ['#ff4757', '#2ed573', '#ffa502', '#3742fa', '#ff6b81', '#1e90ff'];

        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 200, y, {
                vx: (Math.random() - 0.5) * 15,
                vy: -Math.random() * 20 - 5,
                color: color,
                size: Math.random() * 8 + 4,
                decay: 0.008,
                gravity: 0.3,
                friction: 0.99,
                type: Math.random() > 0.5 ? 'square' : 'circle'
            }));
        }
    }

    // Impacto na terra/ilha
    emitGroundHit(x, y) {
        if (!this.enabled) return;

        for (let i = 0; i < 8; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1;
            const speed = Math.random() * 5 + 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 2 === 0 ? '#5d4037' : '#8d6e63',
                size: Math.random() * 5 + 2,
                decay: 0.03,
                gravity: 0.3,
                type: 'square'
            }));
        }
    }

    clear() {
        this.particles = [];
    }
}

// Instância global
const Particles = new ParticleSystem();
