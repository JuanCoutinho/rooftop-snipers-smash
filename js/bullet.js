/**
 * BULLET CLASS - Sistema de projéteis com colisão ÉPICA
 */

class Bullet {
    constructor(x, y, vx, vy, ownerId, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ownerId = ownerId;
        this.active = true;
        this.trail = [];
        this.maxTrailLength = 12;
        this.lifetime = 0;

        // Propriedades
        this.damage = options.damage || 12;
        this.color = options.color || '#ffcc00';
        this.size = options.size || 4;
        this.explosive = options.explosive || false;
        this.explosionRadius = options.explosionRadius || 0;
        this.canCutBullets = options.canCutBullets || false;
        this.isSlash = options.isSlash || false;
        this.slashAngle = options.slashAngle || 0;
        this.isBatarang = options.isBatarang || false;
        this.spinSpeed = options.spinSpeed || 0;
        this.spin = 0;
        this.isBigBeam = options.isBigBeam || false;
        this.beamLength = options.beamLength || 400;
        this.dualBeam = options.dualBeam || false;

        if (this.isBigBeam) {
            this.maxTrailLength = 40;
        }
        if (this.isSlash) {
            this.maxTrailLength = 8;
        }
    }

    update(players, island, walls, allBullets) {
        if (!this.active) return null;

        this.lifetime++;
        this.spin += this.spinSpeed;

        // Trail
        this.trail.push({ x: this.x, y: this.y, life: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.trail.forEach(t => t.life -= 0.06);

        // Movimento
        this.x += this.vx;
        this.y += this.vy;

        // Gravidade (menos para beams grandes)
        if (!this.isBigBeam && !this.isSlash) {
            this.vy += 0.02;
        }

        // Limites
        if (this.x < -2000 || this.x > window.innerWidth + 2000 ||
            this.y < -2000 || this.y > window.innerHeight + 2000) {
            this.active = false;
            return null;
        }

        // COLISÃO ENTRE PROJÉTEIS - ÉPICA!
        if (allBullets) {
            const bulletHit = this.checkBulletCollision(allBullets);
            if (bulletHit) {
                return bulletHit;
            }
        }

        // Colisão com jogadores (headshot!)
        const hitResult = this.checkPlayerCollision(players);
        if (hitResult) {
            this.active = false;

            if (this.explosive) {
                this.explode(players);
            }

            return hitResult;
        }

        // Colisão com muros
        if (walls && this.checkWallCollision(walls)) {
            this.active = false;

            if (this.explosive) {
                this.explode(players);
            } else {
                Particles.emitGroundHit(this.x, this.y);
            }

            return { type: 'wall' };
        }

        // Colisão com ilha
        if (this.checkIslandCollision(island)) {
            this.active = false;

            if (this.explosive) {
                this.explode(players);
            } else {
                Particles.emitGroundHit(this.x, this.y);
            }

            return { type: 'ground' };
        }

        return null;
    }

    // COLISÃO ENTRE PROJÉTEIS SUPER VISÍVEL
    checkBulletCollision(allBullets) {
        for (const other of allBullets) {
            if (other === this || !other.active) continue;
            if (other.ownerId === this.ownerId) continue;

            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const combinedSize = this.size + other.size + 8;

            if (dist < combinedSize) {
                // COLISÃO DETECTADA!

                // Samurai corta tudo!
                if (this.canCutBullets && !other.canCutBullets) {
                    other.active = false;

                    // Efeito de corte ÉPICO
                    const midX = (this.x + other.x) / 2;
                    const midY = (this.y + other.y) / 2;

                    Particles.emit(midX, midY, '#fff', 12, {
                        size: 6, decay: 0.04, speed: 8
                    });
                    Particles.emit(midX, midY, other.color, 8, {
                        size: 4, decay: 0.05
                    });

                    // Linha de corte
                    Game.ctx.save();
                    Game.ctx.strokeStyle = '#fff';
                    Game.ctx.lineWidth = 3;
                    Game.ctx.beginPath();
                    Game.ctx.moveTo(midX - 30, midY - 30);
                    Game.ctx.lineTo(midX + 30, midY + 30);
                    Game.ctx.stroke();
                    Game.ctx.restore();

                    Audio.playHit();
                    Game.camera.shake = 8;

                    // Adiciona ao kill feed
                    Game.addKillFeed(-1, -1, '⚔️ CORTOU!');

                    return null; // Samurai continua
                }

                if (other.canCutBullets && !this.canCutBullets) {
                    this.active = false;
                    return { type: 'bullet_cut' };
                }

                // Big beams vencem projéteis normais
                if (this.isBigBeam && !other.isBigBeam) {
                    other.active = false;
                    Particles.emit(other.x, other.y, this.color, 10, {
                        size: 6, decay: 0.03
                    });
                    return null;
                }

                if (other.isBigBeam && !this.isBigBeam) {
                    this.active = false;
                    return { type: 'bullet_absorbed' };
                }

                // Colisão normal - AMBOS EXPLODEM!
                this.active = false;
                other.active = false;

                const midX = (this.x + other.x) / 2;
                const midY = (this.y + other.y) / 2;

                // EXPLOSÃO ÉPICA DE COLISÃO
                Particles.emit(midX, midY, '#ffff00', 25, {
                    size: 12, decay: 0.02, glow: true, speed: 10
                });
                Particles.emit(midX, midY, '#ff6600', 20, {
                    size: 8, decay: 0.03, speed: 8
                });
                Particles.emit(midX, midY, '#fff', 15, {
                    size: 5, decay: 0.04, speed: 12
                });

                Audio.playHit();
                Game.camera.shake = 15;

                // Feedback visual
                Game.addKillFeed(-1, -1, '💥 CLASH!');

                return { type: 'bullet_collision' };
            }
        }
        return null;
    }

    checkPlayerCollision(players) {
        // Big beams têm hitbox maior
        const sizeMultiplier = this.isBigBeam ? 1.5 : 1;

        for (const player of players) {
            if (player.id === this.ownerId || player.dead) continue;

            const dx = this.x - player.x;
            const dy = this.y - player.y;

            // HEADSHOT check
            const head = player.getHeadHitbox();
            if (this.x > head.x && this.x < head.x + head.width &&
                this.y > head.y && this.y < head.y + head.height) {

                return {
                    type: 'player',
                    player: player,
                    vx: this.vx,
                    vy: this.vy,
                    damage: this.damage,
                    isHeadshot: true
                };
            }

            // Body hitbox
            const hitboxW = 30 * sizeMultiplier;
            const hitboxH = 45 * sizeMultiplier;

            if (Math.abs(dx) < hitboxW && Math.abs(dy) < hitboxH) {
                return {
                    type: 'player',
                    player: player,
                    vx: this.vx,
                    vy: this.vy,
                    damage: this.damage,
                    isHeadshot: false
                };
            }
        }
        return null;
    }

    checkWallCollision(walls) {
        for (const wall of walls) {
            if (this.x > wall.x &&
                this.x < wall.x + wall.width &&
                this.y > wall.y &&
                this.y < wall.y + wall.height) {
                return true;
            }
        }
        return false;
    }

    checkIslandCollision(island) {
        return this.x > island.x &&
            this.x < island.x + island.width &&
            this.y > island.y &&
            this.y < island.y + island.height;
    }

    explode(players) {
        // Explosão visual massiva
        Particles.emit(this.x, this.y, '#ff6600', 40, {
            size: 20, decay: 0.015, glow: true, speed: 15
        });
        Particles.emit(this.x, this.y, '#ffff00', 30, {
            size: 15, decay: 0.02, speed: 12
        });
        Particles.emit(this.x, this.y, '#ff0000', 20, {
            size: 25, decay: 0.01, glow: true, speed: 8
        });

        // Dano em área
        players.forEach(player => {
            if (player.dead) return;

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.explosionRadius) {
                const damageMult = 1 - (dist / this.explosionRadius);
                const explosionDamage = this.damage * damageMult;

                const angle = Math.atan2(dy, dx);
                const knockbackForce = 18 * damageMult;

                player.hit(
                    Math.cos(angle) * knockbackForce,
                    Math.sin(angle) * knockbackForce,
                    explosionDamage,
                    false
                );
            }
        });

        Audio.playHit();
        Game.camera.shake = 30;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Trail para BIG BEAM (Kamehameha) - SUPER GROSSO
        if (this.isBigBeam && this.trail.length > 1) {
            // Outer glow
            ctx.beginPath();
            ctx.strokeStyle = this.color + '44';
            ctx.lineWidth = this.size * 2;
            ctx.lineCap = 'round';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 40;

            this.trail.forEach((t, i) => {
                if (i === 0) ctx.moveTo(t.x, t.y);
                else ctx.lineTo(t.x, t.y);
            });
            ctx.lineTo(this.x, this.y);
            ctx.stroke();

            // Main beam
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;

            this.trail.forEach((t, i) => {
                if (i === 0) ctx.moveTo(t.x, t.y);
                else ctx.lineTo(t.x, t.y);
            });
            ctx.lineTo(this.x, this.y);
            ctx.stroke();

            // Core (branco)
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = this.size * 0.4;

            this.trail.forEach((t, i) => {
                if (i === 0) ctx.moveTo(t.x, t.y);
                else ctx.lineTo(t.x, t.y);
            });
            ctx.lineTo(this.x, this.y);
            ctx.stroke();

            // Head do beam
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 50;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.isSlash) {
            // Slash do Samurai
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 20;

            const slashLen = 40;
            ctx.beginPath();
            ctx.moveTo(
                this.x - Math.cos(this.slashAngle + Math.PI / 4) * slashLen,
                this.y - Math.sin(this.slashAngle + Math.PI / 4) * slashLen
            );
            ctx.lineTo(
                this.x + Math.cos(this.slashAngle + Math.PI / 4) * slashLen,
                this.y + Math.sin(this.slashAngle + Math.PI / 4) * slashLen
            );
            ctx.stroke();

            // Inner line
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.stroke();

        } else if (this.isBatarang) {
            // Batarang girando
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spin);

            ctx.fillStyle = '#2c3e50';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.size, -this.size * 1.5);
            ctx.lineTo(this.size * 0.7, 0);
            ctx.lineTo(this.size, this.size * 1.5);
            ctx.lineTo(0, 0);
            ctx.lineTo(-this.size, -this.size * 1.5);
            ctx.lineTo(-this.size * 0.7, 0);
            ctx.lineTo(-this.size, this.size * 1.5);
            ctx.closePath();
            ctx.fill();

        } else {
            // Trail normal
            if (this.trail.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = this.color + '99';
                ctx.lineWidth = this.dualBeam ? 6 : 4;
                ctx.lineCap = 'round';

                this.trail.forEach((t, i) => {
                    if (i === 0) ctx.moveTo(t.x, t.y);
                    else ctx.lineTo(t.x, t.y);
                });
                ctx.lineTo(this.x, this.y);
                ctx.stroke();

                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.dualBeam ? 3 : 2;
                ctx.beginPath();
                this.trail.forEach((t, i) => {
                    if (i === 0) ctx.moveTo(t.x, t.y);
                    else ctx.lineTo(t.x, t.y);
                });
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            }

            // Glow
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;

            // Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.stroke();

            // Rocket
            if (this.explosive) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
                ctx.fill();

                const angle = Math.atan2(this.vy, this.vx);
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.moveTo(this.x - Math.cos(angle) * 12, this.y - Math.sin(angle) * 12);
                ctx.lineTo(this.x - Math.cos(angle - 0.4) * 25, this.y - Math.sin(angle - 0.4) * 25);
                ctx.lineTo(this.x - Math.cos(angle + 0.4) * 25, this.y - Math.sin(angle + 0.4) * 25);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

/**
 * BULLET MANAGER
 */
class BulletManager {
    constructor() {
        this.bullets = [];
    }

    add(bulletData) {
        if (!bulletData) return;

        const bulletsArray = Array.isArray(bulletData) ? bulletData : [bulletData];

        bulletsArray.forEach(data => {
            this.bullets.push(new Bullet(
                data.x,
                data.y,
                data.vx,
                data.vy,
                data.ownerId,
                {
                    damage: data.damage,
                    color: data.color,
                    size: data.size,
                    explosive: data.explosive,
                    explosionRadius: data.explosionRadius,
                    canCutBullets: data.canCutBullets,
                    isSlash: data.isSlash,
                    slashAngle: data.slashAngle,
                    isBatarang: data.isBatarang,
                    spinSpeed: data.spinSpeed,
                    isBigBeam: data.isBigBeam,
                    beamLength: data.beamLength,
                    dualBeam: data.dualBeam
                }
            ));
        });
    }

    update(players, island, walls) {
        const results = [];

        this.bullets = this.bullets.filter(bullet => {
            const result = bullet.update(players, island, walls, this.bullets);
            if (result) {
                results.push(result);
            }
            return bullet.active;
        });

        return results;
    }

    draw(ctx) {
        this.bullets.forEach(bullet => bullet.draw(ctx));
    }

    clear() {
        this.bullets = [];
    }

    getBullets() {
        return this.bullets;
    }
}
