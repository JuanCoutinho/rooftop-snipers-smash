/**
 * HERO CLASSES SYSTEM - Sistema de Classes de Heróis CORRIGIDO
 * Cada herói tem habilidades únicas e ataques especiais
 */

const HeroClasses = {
    // ========================================
    // SAMURAI - Katana com slash animado
    // ========================================
    SAMURAI: {
        id: 'samurai',
        name: 'Samurai',
        emoji: '⚔️',
        color: '#e74c3c',
        description: 'Corta projéteis com a katana! Slash rápido.',
        health: 110, // Buff +10 HP
        speed: 1.05, // Buff speed

        attack: {
            type: 'slash',
            damage: 24, // Buff +2 dano
            speed: 50,
            cooldown: 20, // Nerf +2 cooldown
            recoil: 4,
            color: '#ffffff',
            size: 12,
            canCutBullets: true,
            slashRange: 120
        },

        special: null,
        hasSlashAnimation: true
    },

    // ========================================
    // LUFFY - Braço que ESTICA (não atira!)
    // ========================================
    LUFFY: {
        id: 'luffy',
        name: 'Luffy',
        emoji: '🏴‍☠️',
        color: '#e74c3c',
        description: 'Gomu Gomu no Pistol! Braço estica e volta!',
        health: 115, // Nerf -5 HP
        speed: 0.95, // Buff speed

        attack: {
            type: 'stretch_punch',
            damage: 20, // Buff +2 dano
            cooldown: 35, // Nerf +5 cooldown
            recoil: 6,
            stretchSpeed: 40,
            maxStretch: 350,
            returnSpeed: 50,
            punchSize: 25
        },

        special: {
            name: 'Gear 4',
            cooldown: 15000,
            duration: 10000,
            effects: {
                damageMultiplier: 2.5,
                defenseMultiplier: 0.4,
                sizeMultiplier: 1.4,
                punchSize: 50,
                armColor: '#1a1a1a'
            }
        }
    },

    // ========================================
    // GOKU - Kamehameha GROSSO
    // ========================================
    GOKU: {
        id: 'goku',
        name: 'Goku',
        emoji: '🐉',
        color: '#f39c12',
        description: 'KAMEHAMEHA!!! (Segura botão direito)',
        health: 95, // Nerf -5 HP (Glass cannon)
        speed: 1.1,

        attack: {
            type: 'ki_blast',
            damage: 9, // Nerf -1 dano (spam nerf)
            speed: 50,
            cooldown: 12, // Nerf +2 cooldown
            recoil: 3,
            color: '#00bfff',
            size: 10
        },

        special: {
            name: 'Kamehameha',
            chargeTime: 1200,
            cooldown: 8000,
            damage: 80,
            beamWidth: 60, // BEM GROSSO!
            beamLength: 800,
            beamColor: '#00bfff'
        }
    },

    // ========================================
    // SUPERMAN - Laser + Planar
    // ========================================
    SUPERMAN: {
        id: 'superman',
        name: 'Superman',
        emoji: '🦸',
        color: '#3498db',
        description: 'Visão de calor + Planar no ar!',
        health: 130,
        speed: 1.0,
        canGlide: true,
        glideGravity: 0.12,

        attack: {
            type: 'laser',
            damage: 14,
            speed: 100,
            cooldown: 12,
            recoil: 0,
            color: '#ff0000',
            size: 5,
            dualBeam: true
        },

        special: null
    },

    // ========================================
    // THOR - Mjolnir boomerang
    // ========================================
    THOR: {
        id: 'thor',
        name: 'Thor',
        emoji: '⚡',
        color: '#9b59b6',
        description: 'Mjolnir vai e volta! Dano na ida e volta!',
        health: 120,
        speed: 0.95,

        attack: {
            type: 'boomerang',
            damage: 28,
            returnDamage: 22,
            speed: 38,
            cooldown: 55,
            recoil: 5,
            maxDistance: 450,
            isHammer: true
        },

        special: null
    },

    // ========================================
    // CAPTAIN AMERICA - Escudo
    // ========================================
    CAPTAIN_AMERICA: {
        id: 'captain_america',
        name: 'Capitão América',
        emoji: '🛡️',
        color: '#2980b9',
        description: 'Escudo indestrutível que bloqueia tiros!',
        health: 110,
        speed: 1.0,

        attack: {
            type: 'boomerang',
            damage: 18,
            returnDamage: 14,
            speed: 42,
            cooldown: 45,
            recoil: 3,
            maxDistance: 380,
            isShield: true,
            canBlockBullets: true
        },

        special: null
    },

    // ========================================
    // IRON MAN - Voo + Repulsores
    // ========================================
    IRON_MAN: {
        id: 'iron_man',
        name: 'Homem de Ferro',
        emoji: '🤖',
        color: '#c0392b',
        description: 'Voo com propulsores + Repulsores duplos!',
        health: 100,
        speed: 1.0,
        canFly: true,
        flyDuration: 2500,
        flyCooldown: 4000,

        attack: {
            type: 'dual_beam',
            damage: 8,
            speed: 55,
            cooldown: 10,
            recoil: 2,
            color: '#00bfff',
            size: 7,
            spread: 0.12,
            noFlash: true // Remove partícula de explosão no muzzle
        },

        special: {
            name: 'Unibeam',
            chargeTime: 600,
            cooldown: 6000,
            damage: 55,
            beamWidth: 45,
            beamColor: '#00ffff'
        }
    },

    // ========================================
    // BATMAN - Hellbat Armor!
    // ========================================
    BATMAN: {
        id: 'batman',
        name: 'Batman',
        emoji: '🦇',
        color: '#2c3e50',
        description: 'Combo de Batarangs: Normal -> Gelo -> Explosivo!',
        health: 90,
        speed: 1.05,

        attack: {
            type: 'batarang_combo', // Novo tipo
            damage: 15,
            speed: 45,
            cooldown: 25,
            recoil: 2,
            color: '#2c3e50',
            size: 12,
            spinSpeed: 0.4
        },

        special: {
            name: 'Hellbat',
            cooldown: 20000,
            duration: 12000,
            effects: {
                damageMultiplier: 2.0,
                defenseMultiplier: 0.3,
                speedMultiplier: 1.3,
                armorColor: '#8b0000',
                canFly: true,
                eyeGlow: '#ff0000'
            }
        }
    },

    // ========================================
    // DARKSEID - Omega Beams que SEGUEM!
    // ========================================
    DARKSEID: {
        id: 'darkseid',
        name: 'Darkseid',
        emoji: '👹',
        color: '#4a4a4a',
        description: 'OMEGA BEAMS que perseguem o inimigo!',
        health: 150,
        speed: 0.8,

        attack: {
            type: 'omega_beam',
            damage: 25,
            speed: 25,
            cooldown: 50,
            recoil: 0,
            color: '#ff0000',
            size: 8,
            tracking: true,
            trackingStrength: 0.08,
            maxLifetime: 180
        },

        special: {
            name: 'Omega Sanction',
            cooldown: 15000,
            damage: 60,
            dualBeams: true,
            trackingStrength: 0.12
        }
    }
};

// Lista de heróis + armas antigas
const HeroList = Object.values(HeroClasses);

// ========================================
// ARMAS CLÁSSICAS (mantidas do sistema antigo)
// ========================================
const WeaponTypes = {
    PISTOL: {
        id: 'pistol',
        name: 'Pistola',
        emoji: '🔫',
        color: '#27ae60',
        description: 'Arma equilibrada e confiável',
        isWeapon: true,
        attack: {
            type: 'projectile',
            damage: 12,
            speed: 40,
            cooldown: 20,
            recoil: 6,
            color: '#ffcc00',
            size: 5
        }
    },
    SHOTGUN: {
        id: 'shotgun',
        name: 'Escopeta',
        emoji: '💥',
        color: '#e67e22',
        description: 'Devastadora de perto! 5 projéteis!',
        isWeapon: true,
        attack: {
            type: 'shotgun',
            damage: 7,
            speed: 35,
            cooldown: 45,
            recoil: 15,
            color: '#ff6600',
            size: 4,
            pellets: 5,
            spread: 0.25
        }
    },
    SNIPER: {
        id: 'sniper',
        name: 'Sniper',
        emoji: '🎯',
        color: '#2ecc71',
        description: 'Um tiro, uma kill!',
        isWeapon: true,
        attack: {
            type: 'projectile',
            damage: 45,
            speed: 80,
            cooldown: 70,
            recoil: 20,
            color: '#00ff88',
            size: 4
        }
    },
    SMG: {
        id: 'smg',
        name: 'Metralhadora',
        emoji: '⚡',
        color: '#9b59b6',
        description: 'Cadência insana!',
        isWeapon: true,
        attack: {
            type: 'projectile',
            damage: 5,
            speed: 45,
            cooldown: 6,
            recoil: 3,
            color: '#ff00ff',
            size: 4,
            spread: 0.1
        }
    },
    ROCKET: {
        id: 'rocket',
        name: 'Lança-Foguetes',
        emoji: '🚀',
        color: '#e74c3c',
        description: 'BOOM! Explosão massiva!',
        isWeapon: true,
        attack: {
            type: 'rocket',
            damage: 55,
            speed: 22,
            cooldown: 90,
            recoil: 25,
            color: '#ff0000',
            size: 10,
            explosive: true,
            explosionRadius: 100
        }
    }
};

const WeaponList = Object.values(WeaponTypes);

// Combina heróis + armas para seleção
const AllCharacters = [...HeroList, ...WeaponList];

/**
 * Classe Hero - Gerencia as habilidades do herói
 */
class Hero {
    constructor(heroType, player) {
        this.type = heroType;
        this.player = player;

        // Cooldowns
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        this.specialActive = false;
        this.specialTimer = 0;

        // Luffy - braço esticado
        this.stretchArm = null;
        this.slashAnimation = 0;

        // Boomerang (Thor/Cap)
        this.thrownProjectile = null;

        // Omega Beam tracking
        this.omegaBeams = [];

        // Voo/Planar
        this.flyTimer = 0;
        this.canFlyNow = true;
        this.isGliding = false;

        // Charging
        this.isCharging = false;
        this.chargeTime = 0;

        // Combo system (Batman)
        this.comboIndex = 0;
    }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.slashAnimation > 0) this.slashAnimation--;

        // Timer do especial ativo
        if (this.specialActive) {
            this.specialTimer--;
            if (this.specialTimer <= 0) {
                this.deactivateSpecial();
            }
        }

        // Charge
        if (this.isCharging) {
            this.chargeTime += 16;
        }

        // Fly cooldown
        if (!this.canFlyNow && this.flyTimer > 0) {
            this.flyTimer--;
            if (this.flyTimer <= 0) {
                this.canFlyNow = true;
            }
        }

        // Atualizar braço esticado (Luffy)
        this.updateStretchArm();

        // Atualizar omega beams (Darkseid)
        this.updateOmegaBeams();
    }

    updateStretchArm() {
        if (!this.stretchArm) return;

        const arm = this.stretchArm;

        if (!arm.returning) {
            // Esticando
            arm.distance += this.type.attack.stretchSpeed;

            if (arm.distance >= this.type.attack.maxStretch) {
                arm.returning = true;
            }

            // Checa hit
            const hitX = this.player.x + Math.cos(arm.angle) * arm.distance;
            const hitY = this.player.y + Math.sin(arm.angle) * arm.distance;

            for (const target of Game.players) {
                if (target.id === this.player.id || target.dead) continue;

                const dx = hitX - target.x;
                const dy = hitY - target.y;

                if (Math.abs(dx) < 40 && Math.abs(dy) < 50) {
                    // HIT!
                    let damage = this.type.attack.damage;
                    if (this.specialActive) {
                        damage *= this.type.special.effects.damageMultiplier;
                    }

                    const knockback = 15;
                    target.hit(
                        Math.cos(arm.angle) * knockback,
                        Math.sin(arm.angle) * knockback,
                        damage,
                        false
                    );

                    arm.returning = true;
                    Game.camera.shake = 12;
                    Particles.emitHit(hitX, hitY, '#ffccaa');
                    Audio.playHit();
                }
            }
        } else {
            // Voltando
            arm.distance -= this.type.attack.returnSpeed;

            if (arm.distance <= 0) {
                this.stretchArm = null;
            }
        }
    }

    updateOmegaBeams() {
        if (this.type.id !== 'darkseid') return;

        const target = Game.players.find(p => p.id !== this.player.id && !p.dead);
        if (!target) return;

        this.omegaBeams = this.omegaBeams.filter(beam => {
            beam.lifetime--;
            if (beam.lifetime <= 0) return false;

            // Tracking - curva em direção ao alvo!
            const dx = target.x - beam.x;
            const dy = target.y - beam.y;
            const targetAngle = Math.atan2(dy, dx);

            // Suaviza a curva
            let angleDiff = targetAngle - beam.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            beam.angle += angleDiff * beam.tracking;

            // Move
            beam.x += Math.cos(beam.angle) * beam.speed;
            beam.y += Math.sin(beam.angle) * beam.speed;

            // Trail
            beam.trail.push({ x: beam.x, y: beam.y });
            if (beam.trail.length > 20) beam.trail.shift();

            // Check hit
            if (Math.abs(beam.x - target.x) < 30 && Math.abs(beam.y - target.y) < 45) {
                target.hit(
                    Math.cos(beam.angle) * 10,
                    Math.sin(beam.angle) * 10,
                    beam.damage,
                    false
                );
                Game.camera.shake = 15;
                Particles.emit(beam.x, beam.y, '#ff0000', 20, { size: 8, glow: true });
                Audio.playHit();
                return false;
            }

            // Check bounds
            if (beam.x < -500 || beam.x > window.innerWidth + 500 ||
                beam.y < -500 || beam.y > window.innerHeight + 500) {
                return false;
            }

            return true;
        });
    }

    canAttack() {
        if (this.type.attack.type === 'boomerang') {
            return this.attackCooldown <= 0 && !this.thrownProjectile;
        }
        if (this.type.attack.type === 'stretch_punch') {
            return this.attackCooldown <= 0 && !this.stretchArm;
        }
        return this.attackCooldown <= 0;
    }

    attack(x, y, angle, ownerId) {
        if (!this.canAttack()) return [];

        this.attackCooldown = this.type.attack.cooldown;

        const atk = this.type.attack;
        const bullets = [];

        switch (atk.type) {
            case 'slash':
                // Animação de slash
                this.slashAnimation = 15;
                // Cria projétil cortante
                bullets.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * atk.speed,
                    vy: Math.sin(angle) * atk.speed,
                    ownerId: ownerId,
                    damage: atk.damage,
                    color: atk.color,
                    size: atk.size,
                    canCutBullets: true,
                    isSlash: true,
                    slashAngle: angle
                });
                break;

            case 'stretch_punch':
                // Luffy estica o braço
                let punchSize = atk.punchSize;
                if (this.specialActive && this.type.special?.effects?.punchSize) {
                    punchSize = this.type.special.effects.punchSize;
                }
                this.stretchArm = {
                    angle: angle,
                    distance: 0,
                    returning: false,
                    size: punchSize
                };
                Audio.playShoot();
                break;

            case 'boomerang':
                this.launchBoomerang(x, y, angle, ownerId);
                break;

            case 'omega_beam':
                // Darkseid - Omega Beam que segue!
                this.omegaBeams.push({
                    x: x, y: y,
                    angle: angle,
                    speed: atk.speed,
                    damage: atk.damage,
                    tracking: atk.trackingStrength,
                    lifetime: atk.maxLifetime,
                    trail: []
                });
                Audio.playShoot();
                break;

            case 'batarang_combo':
                // Batman Combo: Normal -> Ice -> Explosive
                const types = ['normal', 'ice', 'explosive'];
                const currentType = types[this.comboIndex % 3];
                this.comboIndex++;

                let bColor = atk.color;
                let bDamage = atk.damage;
                let isExplosive = false;
                let isIce = false;

                if (currentType === 'ice') {
                    bColor = '#00ffff';
                    bDamage = atk.damage * 0.8;
                    isIce = true;
                } else if (currentType === 'explosive') {
                    bColor = '#ff0000';
                    bDamage = atk.damage * 1.5;
                    isExplosive = true;
                }

                bullets.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * atk.speed,
                    vy: Math.sin(angle) * atk.speed,
                    ownerId: ownerId,
                    damage: bDamage,
                    color: bColor,
                    size: atk.size,
                    isBatarang: true,
                    spinSpeed: atk.spinSpeed,
                    spin: 0,
                    // Propriedades especiais
                    isIce: isIce,
                    explosive: isExplosive,
                    explosionRadius: isExplosive ? 60 : 0
                });
                break;

            case 'dual_beam':
                const spread = atk.spread || 0.1;
                bullets.push({
                    x: x, y: y - 5,
                    vx: Math.cos(angle - spread) * atk.speed,
                    vy: Math.sin(angle - spread) * atk.speed,
                    ownerId: ownerId,
                    damage: atk.damage,
                    color: atk.color,
                    size: atk.size
                });
                bullets.push({
                    x: x, y: y + 5,
                    vx: Math.cos(angle + spread) * atk.speed,
                    vy: Math.sin(angle + spread) * atk.speed,
                    ownerId: ownerId,
                    damage: atk.damage,
                    color: atk.color,
                    size: atk.size
                });
                break;

            case 'shotgun':
                for (let i = 0; i < atk.pellets; i++) {
                    const spreadAngle = angle + (Math.random() - 0.5) * atk.spread * 2;
                    bullets.push({
                        x: x, y: y,
                        vx: Math.cos(spreadAngle) * atk.speed,
                        vy: Math.sin(spreadAngle) * atk.speed,
                        ownerId: ownerId,
                        damage: atk.damage,
                        color: atk.color,
                        size: atk.size
                    });
                }
                break;

            case 'rocket':
                bullets.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * atk.speed,
                    vy: Math.sin(angle) * atk.speed,
                    ownerId: ownerId,
                    damage: atk.damage,
                    color: atk.color,
                    size: atk.size,
                    explosive: true,
                    explosionRadius: atk.explosionRadius
                });
                break;

            default:
                // Projétil normal
                let spreadAngle = angle;
                if (atk.spread) {
                    spreadAngle += (Math.random() - 0.5) * atk.spread;
                }
                bullets.push({
                    x: x, y: y,
                    vx: Math.cos(spreadAngle) * atk.speed,
                    vy: Math.sin(spreadAngle) * atk.speed,
                    ownerId: ownerId,
                    damage: atk.damage,
                    color: atk.color,
                    size: atk.size,
                    dualBeam: atk.dualBeam
                });
        }

        return bullets;
    }

    launchBoomerang(x, y, angle, ownerId) {
        this.thrownProjectile = {
            x: x, y: y,
            startX: x, startY: y,
            angle: angle,
            vx: Math.cos(angle) * this.type.attack.speed,
            vy: Math.sin(angle) * this.type.attack.speed,
            ownerId: ownerId,
            damage: this.type.attack.damage,
            returning: false,
            maxDistance: this.type.attack.maxDistance,
            isHammer: this.type.attack.isHammer,
            isShield: this.type.attack.isShield,
            canBlockBullets: this.type.attack.canBlockBullets,
            rotation: 0,
            hitTargets: []
        };
        Audio.playShoot();
    }

    updateBoomerang(players, playerX, playerY) {
        if (!this.thrownProjectile) return null;

        const proj = this.thrownProjectile;
        proj.rotation += 0.35;

        if (!proj.returning) {
            proj.x += proj.vx;
            proj.y += proj.vy;

            const dist = Math.sqrt(
                Math.pow(proj.x - proj.startX, 2) +
                Math.pow(proj.y - proj.startY, 2)
            );

            if (dist >= proj.maxDistance) {
                proj.returning = true;
            }
        } else {
            const dx = playerX - proj.x;
            const dy = playerY - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 35) {
                this.thrownProjectile = null;
                this.attackCooldown = 8;
                return null;
            }

            const speed = this.type.attack.speed * 1.3;
            proj.vx = (dx / dist) * speed;
            proj.vy = (dy / dist) * speed;
            proj.x += proj.vx;
            proj.y += proj.vy;
        }

        // Check collision with bullets (shield blocks!)
        if (proj.canBlockBullets) {
            const bullets = Game.bulletManager.getBullets();
            for (const bullet of bullets) {
                if (bullet.ownerId === proj.ownerId) continue;

                const dx = proj.x - bullet.x;
                const dy = proj.y - bullet.y;
                if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                    bullet.active = false;
                    Particles.emit(bullet.x, bullet.y, '#fff', 8, { size: 5 });
                    Audio.playHit();
                }
            }
        }

        // Check hit on players
        for (const player of players) {
            if (player.id === proj.ownerId || player.dead) continue;
            if (proj.hitTargets.includes(player.id)) continue;

            const dx = proj.x - player.x;
            const dy = proj.y - player.y;

            if (Math.abs(dx) < 40 && Math.abs(dy) < 55) {
                const dmg = proj.returning ?
                    this.type.attack.returnDamage :
                    this.type.attack.damage;

                proj.hitTargets.push(player.id);

                return {
                    type: 'player',
                    player: player,
                    vx: proj.vx * 0.4,
                    vy: proj.vy * 0.4,
                    damage: dmg
                };
            }
        }

        return null;
    }

    activateSpecial() {
        if (!this.type.special || this.specialCooldown > 0) return false;

        const spec = this.type.special;

        if (spec.duration) {
            // Transformação (Gear 4, Hellbat)
            this.specialActive = true;
            this.specialTimer = spec.duration / 16;
            this.specialCooldown = spec.cooldown / 16;
            Audio.playWin();

            // Efeito visual épico
            Particles.emitConfetti(this.player.x, this.player.y, 30);
            Game.camera.shake = 20;
            return true;
        }

        if (spec.chargeTime) {
            this.isCharging = true;
            this.chargeTime = 0;
            return true;
        }

        // Darkseid Omega Sanction
        if (spec.dualBeams) {
            this.specialCooldown = spec.cooldown / 16;

            // Dispara 2 omega beams poderosos
            const angles = [-0.2, 0.2];
            angles.forEach(offset => {
                this.omegaBeams.push({
                    x: this.player.x,
                    y: this.player.y,
                    angle: this.player.aimAngle + offset,
                    speed: 30,
                    damage: spec.damage,
                    tracking: spec.trackingStrength,
                    lifetime: 250,
                    trail: [],
                    isSuper: true
                });
            });

            Audio.playShoot();
            Game.camera.shake = 15;
            return true;
        }

        return false;
    }

    releaseSpecial(x, y, angle, ownerId) {
        if (!this.isCharging) return null;

        this.isCharging = false;
        const spec = this.type.special;

        if (this.chargeTime >= spec.chargeTime) {
            this.specialCooldown = spec.cooldown / 16;

            // Kamehameha ou Unibeam - BEM GROSSO!
            return {
                x: x, y: y,
                vx: Math.cos(angle) * 70,
                vy: Math.sin(angle) * 70,
                ownerId: ownerId,
                damage: spec.damage,
                color: spec.beamColor || '#00ffff',
                size: spec.beamWidth, // GROSSO!
                isBigBeam: true,
                beamLength: spec.beamLength || 600
            };
        }

        this.chargeTime = 0;
        return null;
    }

    deactivateSpecial() {
        this.specialActive = false;
        this.specialTimer = 0;
    }

    getRecoil() {
        return this.type.attack.recoil || 5;
    }

    canGlide() {
        return this.type.canGlide === true;
    }

    canFly() {
        if (this.specialActive && this.type.special?.effects?.canFly) {
            return true; // Hellbat voa!
        }
        return this.type.canFly === true && this.canFlyNow;
    }

    startFly() {
        if (!this.canFly()) return false;
        this.flyTimer = (this.type.flyDuration || 2000) / 16;
        return true;
    }

    updateFly() {
        if (this.flyTimer > 0) {
            this.flyTimer--;
            if (this.flyTimer <= 0 && !this.specialActive) {
                this.canFlyNow = false;
                this.flyTimer = (this.type.flyCooldown || 4000) / 16;
            }
            return true;
        }
        return this.specialActive && this.type.special?.effects?.canFly;
    }

    draw(ctx) {
        // Desenhar braço esticado do Luffy
        if (this.stretchArm) {
            this.drawStretchArm(ctx);
        }

        // Slash animation do Samurai
        if (this.slashAnimation > 0) {
            this.drawSlashAnimation(ctx);
        }
    }

    drawStretchArm(ctx) {
        if (!this.stretchArm) return;

        const arm = this.stretchArm;
        const isGear4 = this.specialActive;
        const armColor = isGear4 ? '#1a1a1a' : '#ffccaa';
        const armWidth = isGear4 ? 20 : 12;

        ctx.save();
        ctx.strokeStyle = armColor;
        ctx.lineWidth = armWidth;
        ctx.lineCap = 'round';

        // Braço esticado
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(
            Math.cos(arm.angle) * arm.distance,
            Math.sin(arm.angle) * arm.distance - 10
        );
        ctx.stroke();

        // Punho
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.arc(
            Math.cos(arm.angle) * arm.distance,
            Math.sin(arm.angle) * arm.distance - 10,
            arm.size / 2,
            0, Math.PI * 2
        );
        ctx.fill();

        // Efeito de Haki no Gear 4
        if (isGear4) {
            ctx.strokeStyle = 'rgba(139, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(
                Math.cos(arm.angle) * arm.distance,
                Math.sin(arm.angle) * arm.distance - 10,
                arm.size / 2 + 8,
                0, Math.PI * 2
            );
            ctx.stroke();
        }

        ctx.restore();
    }

    drawSlashAnimation(ctx) {
        const progress = 1 - (this.slashAnimation / 15);
        const slashLength = 80;

        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6 - progress * 4;
        ctx.lineCap = 'round';

        // Arco do slash
        ctx.beginPath();
        const startAngle = this.player.aimAngle - 0.5 + progress * 1.5;
        const endAngle = this.player.aimAngle + 0.5 + progress * 0.5;
        ctx.arc(0, 0, 50 + progress * 30, startAngle, endAngle);
        ctx.stroke();

        ctx.restore();
    }

    drawBoomerang(ctx) {
        if (!this.thrownProjectile) return;

        const proj = this.thrownProjectile;

        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);

        if (proj.isHammer) {
            // Mjolnir
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-5, -18, 10, 36);
            ctx.fillStyle = '#708090';
            ctx.fillRect(-14, -28, 28, 18);

            // Efeito de energia
            ctx.strokeStyle = 'rgba(0, 191, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
        } else if (proj.isShield) {
            // Escudo do Cap
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#e74c3c';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 17, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#e74c3c';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#3498db';
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, 4);
        }

        ctx.restore();
    }

    drawOmegaBeams(ctx) {
        if (this.type.id !== 'darkseid') return;

        this.omegaBeams.forEach(beam => {
            ctx.save();

            // Trail
            if (beam.trail.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = beam.isSuper ? '#ff6600' : '#ff0000';
                ctx.lineWidth = beam.isSuper ? 12 : 8;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;

                beam.trail.forEach((t, i) => {
                    ctx.globalAlpha = i / beam.trail.length;
                    if (i === 0) ctx.moveTo(t.x, t.y);
                    else ctx.lineTo(t.x, t.y);
                });
                ctx.lineTo(beam.x, beam.y);
                ctx.stroke();
            }

            // Beam head
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(beam.x, beam.y, beam.isSuper ? 15 : 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
}
