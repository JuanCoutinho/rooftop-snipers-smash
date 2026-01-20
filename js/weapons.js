/**
 * WEAPONS SYSTEM - Sistema de Armas
 */

const WeaponTypes = {
    PISTOL: {
        id: 'pistol',
        name: 'Pistola',
        emoji: '🔫',
        damage: 12,
        speed: 35,
        cooldown: 25,
        recoil: 8,
        spread: 0.05,
        bulletsPerShot: 1,
        color: '#ffcc00',
        description: 'Equilibrada e confiável'
    },
    SHOTGUN: {
        id: 'shotgun',
        name: 'Escopeta',
        emoji: '💥',
        damage: 8,
        speed: 30,
        cooldown: 50,
        recoil: 18,
        spread: 0.3,
        bulletsPerShot: 5,
        color: '#ff6600',
        description: 'Devastadora de perto'
    },
    SNIPER: {
        id: 'sniper',
        name: 'Sniper',
        emoji: '🎯',
        damage: 35,
        speed: 60,
        cooldown: 80,
        recoil: 25,
        spread: 0,
        bulletsPerShot: 1,
        color: '#00ff88',
        description: 'Um tiro, uma kill'
    },
    SMG: {
        id: 'smg',
        name: 'Metralhadora',
        emoji: '⚡',
        damage: 6,
        speed: 40,
        cooldown: 8,
        recoil: 4,
        spread: 0.15,
        bulletsPerShot: 1,
        color: '#ff00ff',
        description: 'Cadência insana'
    },
    ROCKET: {
        id: 'rocket',
        name: 'Lança-Foguetes',
        emoji: '🚀',
        damage: 50,
        speed: 20,
        cooldown: 100,
        recoil: 30,
        spread: 0,
        bulletsPerShot: 1,
        color: '#ff0000',
        explosive: true,
        explosionRadius: 80,
        description: 'Explosão massiva!'
    },
    LASER: {
        id: 'laser',
        name: 'Laser',
        emoji: '⚡',
        damage: 15,
        speed: 100,
        cooldown: 35,
        recoil: 5,
        spread: 0,
        bulletsPerShot: 1,
        color: '#00ffff',
        isLaser: true,
        description: 'Precisão futurística'
    }
};

// Lista de armas para seleção
const WeaponList = [
    WeaponTypes.PISTOL,
    WeaponTypes.SHOTGUN,
    WeaponTypes.SNIPER,
    WeaponTypes.SMG,
    WeaponTypes.ROCKET,
    WeaponTypes.LASER
];

/**
 * Classe de arma equipada
 */
class Weapon {
    constructor(type) {
        this.type = type;
        this.currentCooldown = 0;
    }

    update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }

    canShoot() {
        return this.currentCooldown <= 0;
    }

    shoot(x, y, angle, ownerId) {
        if (!this.canShoot()) return [];

        this.currentCooldown = this.type.cooldown;

        const bullets = [];

        for (let i = 0; i < this.type.bulletsPerShot; i++) {
            // Adiciona spread
            const spreadAngle = angle + (Math.random() - 0.5) * this.type.spread * 2;

            bullets.push({
                x: x,
                y: y,
                vx: Math.cos(spreadAngle) * this.type.speed,
                vy: Math.sin(spreadAngle) * this.type.speed,
                ownerId: ownerId,
                damage: this.type.damage,
                color: this.type.color,
                explosive: this.type.explosive || false,
                explosionRadius: this.type.explosionRadius || 0,
                isLaser: this.type.isLaser || false
            });
        }

        return bullets;
    }

    getRecoil() {
        return this.type.recoil;
    }

    draw(ctx) {
        // Desenho específico da arma
        const t = this.type;

        ctx.fillStyle = '#333';

        switch (t.id) {
            case 'pistol':
                ctx.fillRect(15, -4, 25, 7);
                ctx.fillRect(18, 3, 6, 6);
                break;

            case 'shotgun':
                ctx.fillRect(10, -5, 40, 8);
                ctx.fillRect(10, -7, 8, 12);
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(10, 3, 15, 8);
                break;

            case 'sniper':
                ctx.fillRect(10, -3, 55, 5);
                ctx.fillRect(55, -6, 10, 3);
                ctx.fillStyle = '#444';
                ctx.fillRect(30, -8, 15, 5);
                ctx.fillStyle = '#00ff88';
                ctx.fillRect(35, -7, 5, 3);
                break;

            case 'smg':
                ctx.fillRect(15, -5, 30, 8);
                ctx.fillRect(20, 3, 5, 10);
                ctx.fillStyle = '#666';
                ctx.fillRect(12, -3, 8, 5);
                break;

            case 'rocket':
                ctx.fillRect(10, -8, 50, 14);
                ctx.fillStyle = '#880000';
                ctx.fillRect(50, -6, 10, 10);
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(15, -10, 5, 18);
                break;

            case 'laser':
                ctx.fillStyle = '#222';
                ctx.fillRect(10, -5, 45, 8);
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(50, -3, 8, 4);
                ctx.fillStyle = '#004444';
                ctx.fillRect(20, -7, 20, 3);
                ctx.fillRect(20, 2, 20, 3);
                break;
        }
    }
}
