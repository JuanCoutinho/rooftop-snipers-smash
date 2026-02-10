/**
 * PLAYER CLASS - Jogador com slide corrigido e knockback limitado
 */

class Player {
    constructor(id, x, y, color, config = {}) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.w = 28;
        this.h = 58;
        this.color = color;

        // Física
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.aimAngle = 0;
        this.angVel = 0;

        // Status
        this.damage = 0;
        this.onGround = false;
        this.dead = false;
        this.facing = id === 0 ? 1 : -1;

        // Slide CORRIGIDO
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideCooldown = 0;
        this.slideDirection = 0;

        // Hero system
        this.hero = null;
        this.heroType = null;

        // Animação
        this.walkCycle = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.hitFlash = 0;
        this.deathTimer = 0;

        // AI
        this.aiTimer = 0;
        this.aiShootTimer = 0;
        this.difficulty = config.difficulty || 'medium';

        // Configuração
        this.isAI = config.isAI || false;
    }

    setHero(heroType) {
        this.heroType = heroType;
        this.hero = new Hero(heroType, this);
        this.color = heroType.color;
    }

    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.aimAngle = 0;
        this.angVel = 0;
        this.damage = 0;
        this.onGround = false;
        this.dead = false;
        this.facing = this.id === 0 ? 1 : -1;
        this.hitFlash = 0;
        this.deathTimer = 0;
        this.aiShootTimer = 0;
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideCooldown = 0;
        this.slideDirection = 0;

        if (this.heroType) {
            this.hero = new Hero(this.heroType, this);
        }
    }

    update(keys, mouse, island, walls, camera, gravity) {
        if (this.dead) {
            this.deathTimer++;
            this.y += 15;
            this.angle += 0.2;
            return;
        }

        // Atualizar hero
        if (this.hero) {
            this.hero.update();
        }

        // Atualizar timers
        if (this.hitFlash > 0) this.hitFlash--;
        if (this.slideCooldown > 0) this.slideCooldown--;

        // Slide update - CORRIGIDO: não achata, desliza!
        if (this.isSliding) {
            this.slideTimer--;
            // Mantém velocidade do slide
            this.vx = this.slideDirection * 18;

            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.slideDirection = 0;
            }
        }

        // Blink animation
        this.blinkTimer++;
        if (this.blinkTimer > 180) {
            this.isBlinking = true;
            if (this.blinkTimer > 186) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }

        // Controles
        if (this.isAI) {
            this.updateAI(keys, island, walls);
        } else if (this.id === 0) {
            this.updateP1Controls(keys, mouse, camera);
        } else {
            this.updateP2Controls(keys);
        }

        // Física de equilíbrio
        if (!this.isJumping && !this.isSliding) {
            const uprightForce = 0.012;
            this.angVel -= this.angle * uprightForce;
        }

        // Rotação
        this.angle += this.angVel;
        this.angVel *= this.onGround ? 0.85 : 0.99;

        // Gravidade modificada por habilidades
        let effectiveGravity = gravity;

        // Superman pode planar
        if (this.hero?.canGlide() && !this.onGround && keys['KeyW']) {
            effectiveGravity = this.heroType.glideGravity;
            this.hero.isGliding = true;
        } else if (this.hero) {
            this.hero.isGliding = false;
        }

        // Iron Man/Hellbat pode voar
        if (this.hero?.canFly() && keys['KeyW'] && !this.onGround) {
            if (this.hero.flyTimer > 0 || this.hero.startFly()) {
                if (this.hero.updateFly()) {
                    effectiveGravity = -0.35;
                    Particles.emit(this.x, this.y + this.h / 2, '#00bfff', 2, {
                        vy: 5, size: 4, decay: 0.1
                    });
                }
            }
        }

        this.vy += effectiveGravity;
        this.x += this.vx;
        this.y += this.vy;

        // Atrito
        if (this.onGround && !this.isSliding) {
            this.vx *= 0.85;

            if (Math.abs(this.vx) > 1) {
                this.walkCycle++;
                if (this.walkCycle % 10 === 0) {
                    Particles.emitDust(this.x, this.y + this.h / 2, Math.sign(this.vx));
                }
            }
        } else if (!this.isSliding) {
            this.vx *= 0.98;
        }

        // Colisões
        this.checkIslandCollision(island);
        this.checkWallCollision(walls);
        this.checkBounds();
    }

    updateP1Controls(keys, mouse, camera) {
        if (!this.isSliding) {
            const speed = 0.9;
            if (keys['KeyA']) this.vx -= speed;
            if (keys['KeyD']) this.vx += speed;
        }

        // Slide com espaço - CORRIGIDO
        if (keys['Space'] && this.onGround && !this.isSliding && this.slideCooldown <= 0) {
            this.startSlide();
        }

        // Especial com botão direito do mouse é tratado no Game.js
        // Também pode usar tecla 1
        if (keys['Digit1'] && this.hero) {
            if (!this.hero.isCharging) {
                this.hero.activateSpecial();
            }
        }

        // Soltar especial
        if (!keys['Digit1'] && this.hero?.isCharging && !Game.mouse.rightClicked) {
            this.releaseSpecialAttack();
        }

        // Mira com mouse
        const worldMouseX = (mouse.x - camera.offsetX) / camera.zoom;
        const worldMouseY = (mouse.y - camera.offsetY) / camera.zoom;
        this.aimAngle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        this.facing = worldMouseX < this.x ? -1 : 1;
    }

    updateP2Controls(keys) {
        if (!this.isSliding) {
            const speed = 0.9;
            if (keys['ArrowLeft']) this.vx -= speed;
            if (keys['ArrowRight']) this.vx += speed;
        }

        // Slide com shift direito
        if (keys['ShiftRight'] && this.onGround && !this.isSliding && this.slideCooldown <= 0) {
            this.startSlide();
        }

        // Especial com 0
        if (keys['Digit0'] && this.hero) {
            if (!this.hero.isCharging) {
                this.hero.activateSpecial();
            }
        }

        this.aimAngle = this.angle + (this.facing === -1 ? Math.PI : 0);
    }

    startSlide() {
        this.isSliding = true;
        this.slideTimer = 18;
        this.slideCooldown = 35;
        this.slideDirection = this.facing;

        // Partículas de slide
        for (let i = 0; i < 8; i++) {
            Particles.emit(this.x - this.slideDirection * 20, this.y + this.h / 2 - 5, '#fff', 1, {
                vx: -this.slideDirection * (2 + Math.random() * 3),
                vy: -Math.random() * 2,
                size: 4,
                decay: 0.05
            });
        }

        Audio.playJump();
    }

    releaseSpecialAttack() {
        if (!this.hero?.isCharging) return;

        const specialBullet = this.hero.releaseSpecial(
            this.x + Math.cos(this.aimAngle) * 45,
            this.y + Math.sin(this.aimAngle) * 45,
            this.aimAngle,
            this.id
        );

        if (specialBullet) {
            Game.bulletManager.add(specialBullet);
            this.vx -= Math.cos(this.aimAngle) * 25;
            this.vy -= Math.sin(this.aimAngle) * 25;
            Game.camera.shake = 25;
            Audio.playShoot();
        }
    }

    updateAI(keys, island, walls) {
        this.aiTimer++;
        this.aiShootTimer++;

        const target = Game.players[0];
        if (!target) return null;

        const dx = target.x - this.x;
        const dy = target.y - this.y;

        const difficultyConfig = {
            easy: { accuracy: 0.3, shootInterval: 70, jumpChance: 0.01, slideChance: 0.003 },
            medium: { accuracy: 0.5, shootInterval: 45, jumpChance: 0.015, slideChance: 0.008 },
            hard: { accuracy: 0.7, shootInterval: 25, jumpChance: 0.02, slideChance: 0.012 },
            insane: { accuracy: 0.9, shootInterval: 12, jumpChance: 0.03, slideChance: 0.015 }
        };

        const config = difficultyConfig[this.difficulty] || difficultyConfig.medium;

        // Movimento
        if (Math.abs(dx) > 180) {
            this.vx += Math.sign(dx) * 0.5;
        } else if (Math.abs(dx) < 80) {
            this.vx -= Math.sign(dx) * 0.3;
        }

        // Pulo
        if (this.onGround && (Math.random() < config.jumpChance || this.y > island.y + 50)) {
            this.startJump();
        }

        // Slide
        if (this.onGround && Math.random() < config.slideChance && this.slideCooldown <= 0) {
            this.facing = Math.sign(dx) || 1;
            this.startSlide();
        }

        // Ativar especial
        if (this.hero && Math.random() < 0.001 && this.hero.specialCooldown <= 0) {
            this.hero.activateSpecial();
        }

        // Mira
        let idealAngle = Math.atan2(dy, dx);
        const inaccuracy = (1 - config.accuracy) * (Math.random() - 0.5) * 0.5;
        idealAngle += inaccuracy;
        this.aimAngle = this.aimAngle + (idealAngle - this.aimAngle) * 0.15;
        this.facing = dx > 0 ? 1 : -1;

        // Atira
        if (this.aiShootTimer >= config.shootInterval) {
            this.aiShootTimer = 0;
            return this.shoot();
        }

        if (!this.onGround && Math.random() < 0.05) {
            this.angVel -= 0.01 * this.facing;
        }

        return null;
    }

    startJump() {
        if (!this.onGround || this.dead || this.isSliding) return;

        Audio.playJump();
        this.vy = -15;
        this.onGround = false;
        this.isJumping = true;
        this.angVel = -0.4 * this.facing;

        Particles.emitJump(this.x, this.y + this.h / 2);
    }

    endJump() {
        if (this.vy < -5) this.vy = -5;
        this.isJumping = false;
    }

    shoot() {
        if (!this.hero || !this.hero.canAttack() || this.dead) return null;

        Audio.playShoot();

        const muzzleDist = 45;
        const mx = this.x + Math.cos(this.aimAngle) * muzzleDist;
        const my = this.y - 10 + Math.sin(this.aimAngle) * muzzleDist;

        const bullets = this.hero.attack(mx, my, this.aimAngle, this.id);

        if (bullets && bullets.length > 0) {
            Particles.emitMuzzleFlash(mx, my, this.aimAngle);

            const recoil = this.hero.getRecoil();
            this.vx -= Math.cos(this.aimAngle) * recoil;
            this.vy -= Math.sin(this.aimAngle) * recoil;
            this.angVel += 0.08 * this.facing * (Math.random() + 0.5);
        }

        return bullets;
    }

    hit(bulletVx, bulletVy, damage, isHeadshot = false) {
        if (this.dead) return;

        let actualDamage = damage;
        if (isHeadshot) {
            actualDamage *= 2;
            Particles.emit(this.x, this.y - 40, '#ff0000', 15, {
                size: 8, decay: 0.03, glow: true
            });
        }

        Audio.playHit();
        this.hitFlash = 10;
        this.damage += actualDamage;

        // Defesa (Hellbat etc)
        let defenseMultiplier = 1;
        if (this.hero?.specialActive && this.heroType.special?.effects?.defenseMultiplier) {
            defenseMultiplier = this.heroType.special.effects.defenseMultiplier;
        }

        // KNOCKBACK SMASH BROS STYLE - EXPONENCIAL!
        // Base: quanto mais dano, mais voa (ao quadrado/exponencial)
        // Fórmula: pow(damage / 40, 1.5) + 0.5
        // 0% = 0.5x
        // 50% = 1.9x
        // 100% = 4.0x
        // 150% = 7.7x
        // 200% = 11.6x
        const knockbackMultiplier = Math.pow(Math.max(0, this.damage) / 40, 1.5) + 0.5;

        // Aplica knockback
        const knockbackX = bulletVx * knockbackMultiplier * 0.25 * defenseMultiplier;
        const knockbackY = bulletVy * knockbackMultiplier * 0.25 * defenseMultiplier;

        // Limite maior para voar longe
        const maxVelocity = 80;
        this.vx = Math.max(-maxVelocity, Math.min(maxVelocity, this.vx + knockbackX));
        this.vy = Math.max(-maxVelocity, Math.min(maxVelocity, this.vy + knockbackY - 8)); // -8 = joga mais pra cima

        this.angVel += (Math.random() - 0.5) * 3 * knockbackMultiplier;

        Particles.emitHit(this.x, this.y, this.color);

        return isHeadshot ? 25 : 15;
    }

    getHeadHitbox() {
        return {
            x: this.x - 12,
            y: this.y - 42,
            width: 24,
            height: 20
        };
    }

    checkIslandCollision(island) {
        if (this.x > island.x && this.x < island.x + island.width &&
            this.y + this.h / 2 > island.y && this.y - this.h / 2 < island.y + island.height) {
            if (this.vy > 0 && this.y < island.y + 35) {
                this.y = island.y - this.h / 2;
                this.vy = 0;
                this.onGround = true;
                this.isJumping = false;
            }
        } else {
            this.onGround = false;
        }
    }

    checkWallCollision(walls) {
        if (!walls) return;

        walls.forEach(wall => {
            if (this.x + this.w / 2 > wall.x &&
                this.x - this.w / 2 < wall.x + wall.width &&
                this.y + this.h / 2 > wall.y &&
                this.y - this.h / 2 < wall.y + wall.height) {

                const overlapLeft = (this.x + this.w / 2) - wall.x;
                const overlapRight = (wall.x + wall.width) - (this.x - this.w / 2);

                if (overlapLeft < overlapRight) {
                    this.x = wall.x - this.w / 2;
                    // PARA a velocidade, não rebate!
                    if (this.vx > 0) this.vx = 0;
                } else {
                    this.x = wall.x + wall.width + this.w / 2;
                    if (this.vx < 0) this.vx = 0;
                }
            }
        });
    }

    checkBounds() {
        const bounds = {
            left: -1500,
            right: window.innerWidth + 1500,
            bottom: window.innerHeight + 500
        };

        if (this.y > bounds.bottom || this.x < bounds.left || this.x > bounds.right) {
            if (!this.dead) {
                this.die();
            }
        }
    }

    die() {
        if (this.dead) return;

        this.dead = true;
        Audio.playSplash();
        Particles.emitSplash(this.x, window.innerHeight - 50);

        return this.id;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Aura de transformação (Gear 4, Hellbat)
        if (this.hero?.specialActive) {
            this.drawTransformationAura(ctx);
        }

        // Porcentagem de dano
        this.drawDamagePercent(ctx);

        // Flash de hit
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2) saturate(0.5)';
        }

        // Corpo (rotacionado)
        ctx.save();
        ctx.rotate(this.angle);

        // Durante slide, inclina o personagem (não achata!)
        if (this.isSliding) {
            ctx.rotate(this.slideDirection * 0.3); // Inclina pra frente
            ctx.translate(this.slideDirection * 10, 10); // Move um pouco
        }

        this.drawBody(ctx);
        ctx.restore();

        // Braço/Arma (não durante slide)
        if (!this.isSliding) {
            ctx.save();
            this.drawArm(ctx);
            ctx.restore();
        }

        // Hero specific drawings
        if (this.hero) {
            this.hero.draw(ctx);
        }

        ctx.restore();

        // Laser sight (apenas P1)
        if (this.id === 0 && !this.dead && !this.isSliding) {
            this.drawLaser(ctx);
        }

        // Charge indicator
        if (this.hero?.isCharging) {
            this.drawChargeIndicator(ctx);
        }
    }

    drawTransformationAura(ctx) {
        const auraColor = this.heroType.special?.effects?.armorColor ||
            this.heroType.special?.effects?.armColor ||
            '#ff4757';

        ctx.save();
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = auraColor;
        ctx.shadowBlur = 30;

        // Aura pulsante
        const pulse = Math.sin(Date.now() * 0.01) * 5;
        ctx.beginPath();
        ctx.arc(0, 0, 55 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Partículas de energia
        if (Math.random() < 0.3) {
            Particles.emit(this.x + (Math.random() - 0.5) * 50,
                this.y + (Math.random() - 0.5) * 60,
                auraColor, 1, {
                vy: -3, size: 5, decay: 0.05, glow: true
            });
        }

        ctx.restore();
    }

    drawChargeIndicator(ctx) {
        const progress = Math.min(1, this.hero.chargeTime / (this.heroType.special?.chargeTime || 1000));

        ctx.save();
        ctx.translate(this.x, this.y - 85);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-35, 0, 70, 10);

        const gradient = ctx.createLinearGradient(-35, 0, 35, 0);
        gradient.addColorStop(0, '#00bfff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ff00ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(-35, 0, 70 * progress, 10);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-35, 0, 70, 10);

        // Texto
        if (progress >= 1) {
            ctx.fillStyle = '#0f0';
            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('READY!', 0, -5);
        }

        ctx.restore();
    }

    drawDamagePercent(ctx) {
        let dmgColor = '#ffffff';
        if (this.damage > 50) dmgColor = '#f1c40f';
        if (this.damage > 100) dmgColor = '#e67e22';
        if (this.damage > 150) dmgColor = '#e74c3c';

        ctx.font = '14px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = dmgColor;

        const text = Math.floor(this.damage) + '%';
        ctx.strokeText(text, 0, -65);
        ctx.fillText(text, 0, -65);

        if (this.heroType) {
            ctx.font = '18px Arial';
            ctx.fillStyle = this.heroType.color;
            ctx.strokeText(this.heroType.emoji, 0, -90);
            ctx.fillText(this.heroType.emoji, 0, -90);
        }
    }

    drawBody(ctx) {
        const legOffset = Math.sin(this.walkCycle * 0.2) * 3;

        let scale = 1;
        if (this.hero?.specialActive && this.heroType.special?.effects?.sizeMultiplier) {
            scale = this.heroType.special.effects.sizeMultiplier;
        }

        ctx.scale(scale, scale);

        // DESENHAR SKIN ESPECÍFICA DE CADA HERÓI
        if (this.heroType) {
            this.drawHeroSkin(ctx, legOffset);
        } else {
            // Personagem genérico
            this.drawGenericBody(ctx, legOffset, this.color);
        }
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    drawGenericBody(ctx, legOffset, bodyColor) {
        const shadowColor = this.adjustColor(bodyColor, -40);

        // Pernas (com sombra na de trás)
        ctx.fillStyle = shadowColor;
        this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
        ctx.fillStyle = bodyColor;
        this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

        // Sapatos genéricos
        ctx.fillStyle = '#333';
        this.drawRoundedRect(ctx, -12, 30 - legOffset, 10, 4, 1);
        this.drawRoundedRect(ctx, 2, 30 + legOffset, 10, 4, 1);

        // Tronco
        ctx.fillStyle = bodyColor;
        this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

        // Detalhe no peito
        ctx.fillStyle = this.adjustColor(bodyColor, -20);
        this.drawRoundedRect(ctx, -10, -18, 20, 6, 2);

        // Cabeça
        ctx.fillStyle = '#ffccaa';
        this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);

        // Cabelo
        ctx.fillStyle = '#333';
        this.drawRoundedRect(ctx, -14, -42, 28, 10, 3);

        // Olhos
        this.drawEyes(ctx, null);
    }

    drawHeroSkin(ctx, legOffset) {
        const hero = this.heroType;
        const isTransformed = this.hero?.specialActive;

        switch (hero.id) {
            case 'luffy':
                // LUFFY - Shorts azuis, faixa amarela, colete vermelho
                // Pernas (shorts)
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 16, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 16, 2);

                // Canelas (pele)
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -12, 28 - legOffset, 10, 8, 1);
                this.drawRoundedRect(ctx, 2, 28 + legOffset, 10, 8, 1);

                // Sandálias
                ctx.fillStyle = '#8b4513';
                this.drawRoundedRect(ctx, -12, 34 - legOffset, 10, 2, 1);
                this.drawRoundedRect(ctx, 2, 34 + legOffset, 10, 2, 1);

                // Tronco (colete vermelho aberto)
                ctx.fillStyle = '#e74c3c';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Peito exposto
                ctx.fillStyle = '#ffccaa';
                ctx.beginPath();
                ctx.moveTo(-6, -22);
                ctx.lineTo(6, -22);
                ctx.lineTo(8, 16);
                ctx.lineTo(-8, 16);
                ctx.fill();

                // Cicatriz X
                ctx.strokeStyle = '#c0392b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-5, -12);
                ctx.lineTo(5, 2);
                ctx.moveTo(5, -12);
                ctx.lineTo(-5, 2);
                ctx.stroke();

                // Faixa amarela
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -14, 10, 28, 6, 2);

                // Botões
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(-10, -10, 2, 0, Math.PI * 2);
                ctx.arc(10, -10, 2, 0, Math.PI * 2);
                ctx.fill();

                // Cabeça
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);

                // Cabelo preto
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -12, -42, 24, 8, 2);

                if (isTransformed) {
                    // GEAR 4
                    ctx.fillStyle = '#1a1a1a';
                    this.drawRoundedRect(ctx, -16, -24, 32, 42, 6);
                    ctx.strokeStyle = '#ff4757';
                    ctx.lineWidth = 3;
                    this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);
                    ctx.stroke();
                }
                break;

            case 'goku':
                // GOKU
                // Pernas (calça laranja)
                ctx.fillStyle = '#e67e22';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Botas azuis
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -12, 28 - legOffset, 10, 8, 2);
                this.drawRoundedRect(ctx, 2, 28 + legOffset, 10, 8, 2);
                ctx.fillStyle = '#e74c3c'; // Detalhe vermelho
                this.drawRoundedRect(ctx, -12, 28 - legOffset, 10, 2, 0);
                this.drawRoundedRect(ctx, 2, 28 + legOffset, 10, 2, 0);

                // Tronco (gi laranja)
                ctx.fillStyle = '#e67e22';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Camiseta azul (gola)
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.moveTo(-8, -22);
                ctx.lineTo(8, -22);
                ctx.lineTo(0, -12);
                ctx.fill();

                // Faixa azul
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -14, 8, 28, 8, 2);

                // Símbolo
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(8, -12, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('亀', 8, -10);

                // Cabeça
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);
                break;

            case 'superman':
                // SUPERMAN
                // Capa (atrás)
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -18, -20, 8, 55, 2);
                this.drawRoundedRect(ctx, 10, -20, 8, 55, 2);

                // Pernas (azul)
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Sunga vermelha
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 6, 0);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 6, 0);

                // Botas vermelhas
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -12, 26 - legOffset, 10, 10, 2);
                this.drawRoundedRect(ctx, 2, 26 + legOffset, 10, 10, 2);

                // Tronco (azul)
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Cinto amarelo
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -14, 10, 28, 4, 1);

                // S symbol
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.lineTo(8, -10);
                ctx.lineTo(6, 2);
                ctx.lineTo(0, 8);
                ctx.lineTo(-6, 2);
                ctx.lineTo(-8, -10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#c0392b';
                ctx.font = 'bold 12px serif';
                ctx.textAlign = 'center';
                ctx.fillText('S', 0, -2);

                // Cabeça
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);

                // Cacho de cabelo
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(0, -40, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'thor':
                // THOR
                // Capa
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -18, -20, 8, 50, 2);
                this.drawRoundedRect(ctx, 10, -20, 8, 50, 2);

                // Pernas (armadura escura)
                ctx.fillStyle = '#2c3e50';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Botas amarelas
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -12, 28 - legOffset, 10, 8, 2);
                this.drawRoundedRect(ctx, 2, 28 + legOffset, 10, 8, 2);

                // Tronco (armadura)
                ctx.fillStyle = '#2c3e50';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Discos prateados (6 discos)
                ctx.fillStyle = '#bdc3c7';
                for(let i=0; i<3; i++) {
                   ctx.beginPath();
                   ctx.arc(-7, -15 + i*12, 4, 0, Math.PI*2);
                   ctx.arc(7, -15 + i*12, 4, 0, Math.PI*2);
                   ctx.fill();
                   // Brilho
                   ctx.fillStyle = '#fff';
                   ctx.beginPath();
                   ctx.arc(-8, -16 + i*12, 1, 0, Math.PI*2);
                   ctx.arc(6, -16 + i*12, 1, 0, Math.PI*2);
                   ctx.fill();
                   ctx.fillStyle = '#bdc3c7';
                }

                // Cinto
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -14, 10, 28, 4, 1);

                // Cabeça
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);

                // Cabelo loiro
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -14, -42, 28, 10, 2);
                this.drawRoundedRect(ctx, -16, -38, 6, 16, 2);
                this.drawRoundedRect(ctx, 10, -38, 6, 16, 2);
                break;

            case 'captain_america':
                // CAP
                // Pernas (azul)
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Botas vermelhas
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -12, 26 - legOffset, 10, 10, 2);
                this.drawRoundedRect(ctx, 2, 26 + legOffset, 10, 10, 2);

                // Tronco (azul)
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Listras abdominais
                ctx.fillStyle = '#fff';
                this.drawRoundedRect(ctx, -10, 0, 20, 14, 0);
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -10, 0, 4, 14, 0);
                this.drawRoundedRect(ctx, -2, 0, 4, 14, 0);
                this.drawRoundedRect(ctx, 6, 0, 4, 14, 0);

                // Estrela no peito
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('★', 0, -8);

                // Cinto utilitário
                ctx.fillStyle = '#7f8c8d';
                this.drawRoundedRect(ctx, -14, 14, 28, 4, 1);

                // Cabeça com máscara
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);

                // Queixo exposto
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -10, -28, 20, 10, 2);

                // "A" na testa
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('A', 0, -38);
                break;

            case 'iron_man':
                // IRON MAN
                // Pernas (vermelho)
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Detalhes dourados pernas
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -12, 24 - legOffset, 10, 4, 0);
                this.drawRoundedRect(ctx, 2, 24 + legOffset, 10, 4, 0);

                // Tronco
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Arc Reactor
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(6, -6);
                ctx.lineTo(0, 0);
                ctx.lineTo(-6, -6);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Placas douradas
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -16, -24, 6, 10, 2); // Ombro E
                this.drawRoundedRect(ctx, 10, -24, 6, 10, 2); // Ombro D
                this.drawRoundedRect(ctx, -8, -18, 16, 4, 0); // Peitoral

                // Cabeça (capacete)
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);

                // Placa facial dourada
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -10, -38, 20, 20, 2);

                // Olhos
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 5;
                this.drawRoundedRect(ctx, -8, -32, 6, 2, 0);
                this.drawRoundedRect(ctx, 2, -32, 6, 2, 0);
                ctx.shadowBlur = 0;

                return;

            case 'samurai':
                // SAMURAI
                // Pernas (hakama preto)
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Sandálias
                ctx.fillStyle = '#f1c40f'; // Palha
                this.drawRoundedRect(ctx, -12, 34 - legOffset, 10, 2, 1);
                this.drawRoundedRect(ctx, 2, 34 + legOffset, 10, 2, 1);

                // Armadura (vermelho)
                ctx.fillStyle = '#8b0000';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Placas de armadura (horizontal)
                ctx.fillStyle = '#1a1a1a';
                for(let i=0; i<4; i++) {
                    this.drawRoundedRect(ctx, -12, -18 + i*8, 24, 4, 1);
                }

                // Cabeça
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);
                break;

            case 'batman':
                // BATMAN
                // Pernas (cinza escuro)
                ctx.fillStyle = '#57606f';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Botas pretas
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -12, 26 - legOffset, 10, 10, 2);
                this.drawRoundedRect(ctx, 2, 26 + legOffset, 10, 10, 2);

                // Sunga preta
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 6, 0);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 6, 0);

                // Tronco (cinza)
                ctx.fillStyle = '#57606f';
                this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);

                // Símbolo do morcego
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, -8, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Cinto utilitário amarelo
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -14, 10, 28, 6, 1);
                // Bolsos do cinto
                ctx.fillStyle = '#d35400';
                this.drawRoundedRect(ctx, -10, 10, 4, 6, 1);
                this.drawRoundedRect(ctx, -2, 10, 4, 6, 1);
                this.drawRoundedRect(ctx, 6, 10, 4, 6, 1);

                // Cabeça com máscara
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -12, -38, 24, 22, 4);
                ctx.fillStyle = '#ffccaa';
                this.drawRoundedRect(ctx, -6, -26, 12, 8, 2);

                // Olhos brancos (sem pupilas)
                const eyeX = this.facing === 1 ? 2 : -12;
                ctx.fillStyle = '#fff';
                this.drawRoundedRect(ctx, eyeX, -32, 10, 4, 1);

                if (isTransformed) {
                    // HELLBAT
                    ctx.fillStyle = '#8b0000';
                    this.drawRoundedRect(ctx, -14, -22, 28, 38, 4);
                    // Brilho no peito
                    ctx.fillStyle = '#ff0000';
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(-10, -10); ctx.lineTo(10, -10); ctx.lineTo(0, 5);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                return;

            case 'darkseid':
                // DARKSEID
                // Pernas (cinza escuro)
                ctx.fillStyle = '#2f3542';
                this.drawRoundedRect(ctx, -12, 12 - legOffset, 10, 22, 2);
                this.drawRoundedRect(ctx, 2, 12 + legOffset, 10, 22, 2);

                // Botas
                ctx.fillStyle = '#1e272e';
                this.drawRoundedRect(ctx, -12, 24 - legOffset, 10, 12, 2);
                this.drawRoundedRect(ctx, 2, 24 + legOffset, 10, 12, 2);

                // Corpo (largo)
                ctx.fillStyle = '#2f3542';
                this.drawRoundedRect(ctx, -16, -22, 32, 40, 4);

                // Símbolo Omega
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 5;
                ctx.fillText('Ω', 0, -2);
                ctx.shadowBlur = 0;

                // Cabeça (pele rochosa cinza)
                ctx.fillStyle = '#535c68';
                this.drawRoundedRect(ctx, -14, -40, 28, 26, 4);

                // Olhos vermelhos brilhantes
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 15;
                this.drawRoundedRect(ctx, -10, -34, 8, 4, 1);
                this.drawRoundedRect(ctx, 2, -34, 8, 4, 1);
                ctx.shadowBlur = 0;
                return;

            default:
                // Armas genéricas
                this.drawGenericBody(ctx, legOffset, this.color);
                return;
        }

        // Olhos padrão (para heróis sem olhos customizados)
        this.drawEyes(ctx, hero.id);
    }

    drawEyes(ctx, heroId) {
        const eyeX = this.facing === 1 ? 2 : -12;

        // Alguns heróis não mostram olhos normais
        if (heroId === 'darkseid' || heroId === 'iron_man') return;

        let eyeGlow = null;
        if (this.hero?.specialActive && this.heroType?.special?.effects?.eyeGlow) {
            eyeGlow = this.heroType.special.effects.eyeGlow;
        }

        if (!this.isBlinking) {
            ctx.fillStyle = eyeGlow || 'white';
            if (eyeGlow) {
                ctx.shadowColor = eyeGlow;
                ctx.shadowBlur = 10;
            }
            ctx.fillRect(eyeX, -32, 10, 10);
            ctx.shadowBlur = 0;

            if (!eyeGlow) {
                ctx.fillStyle = '#000';
                ctx.fillRect(eyeX + (this.facing === 1 ? 5 : 2), -29, 4, 4);
            }
        } else {
            ctx.fillStyle = '#ffccaa';
            ctx.fillRect(eyeX, -28, 10, 3);
        }
    }

    drawHeroHeadgear(ctx, bodyColor) {
        if (!this.heroType) {
            ctx.fillStyle = bodyColor;
            this.drawRoundedRect(ctx, -14, -42, 28, 10, 4);
            return;
        }

        switch (this.heroType.id) {
            case 'luffy':
                // Chapéu de palha
                ctx.fillStyle = '#f1c40f'; // Palha
                // Aba
                ctx.beginPath();
                ctx.ellipse(0, -38, 22, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Copa
                this.drawRoundedRect(ctx, -12, -50, 24, 14, 2);
                // Faixa vermelha
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -12, -42, 24, 4, 1);
                break;

            case 'goku':
                // Cabelo espetado (SSJ?)
                ctx.fillStyle = '#1a1a1a';
                for (let i = -3; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 6, -38);
                    const h = 15 + Math.abs(i) * 5;
                    ctx.lineTo(i * 8 - 4, -38 - h);
                    ctx.lineTo(i * 8 + 4, -38 - h + 5);
                    ctx.fill();
                }
                break;

            case 'superman':
                // Cabelo
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -12, -44, 24, 8, 3);
                break;

            case 'thor':
                // Capacete
                ctx.fillStyle = '#95a5a6';
                this.drawRoundedRect(ctx, -14, -44, 28, 12, 4);
                // Asas laterais
                ctx.fillStyle = '#ecf0f1';
                ctx.beginPath();
                ctx.moveTo(-14, -40); ctx.lineTo(-24, -54); ctx.lineTo(-10, -44);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(14, -40); ctx.lineTo(24, -54); ctx.lineTo(10, -44);
                ctx.fill();
                break;

            case 'captain_america':
                // Máscara
                ctx.fillStyle = '#3498db';
                this.drawRoundedRect(ctx, -14, -44, 28, 12, 4);
                // Asinhas pintadas
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('A', 0, -36);
                break;

            case 'iron_man':
                // Topo do capacete
                ctx.fillStyle = '#c0392b';
                this.drawRoundedRect(ctx, -14, -44, 28, 10, 4);
                ctx.fillStyle = '#f1c40f';
                this.drawRoundedRect(ctx, -6, -42, 12, 4, 1);
                break;

            case 'samurai':
                // Capacete
                ctx.fillStyle = '#1a1a1a';
                this.drawRoundedRect(ctx, -14, -42, 28, 6, 2);
                // Chifres (Kuwagata)
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.quadraticCurveTo(-10, -55, -15, -45);
                ctx.lineTo(0, -40);
                ctx.quadraticCurveTo(10, -55, 15, -45);
                ctx.fill();
                break;

            case 'batman':
                // Orelhas de morcego
                ctx.fillStyle = this.hero?.specialActive ? '#8b0000' : '#1a1a1a';
                ctx.beginPath();
                ctx.moveTo(-10, -42); ctx.lineTo(-12, -55); ctx.lineTo(-4, -42);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(10, -42); ctx.lineTo(12, -55); ctx.lineTo(4, -42);
                ctx.fill();
                break;

            case 'darkseid':
                // Capacete rochoso
                ctx.fillStyle = '#2f3542';
                this.drawRoundedRect(ctx, -16, -46, 32, 14, 4);
                break;

            default:
                ctx.fillStyle = bodyColor;
                this.drawRoundedRect(ctx, -14, -42, 28, 10, 3);
        }
    }

    drawArm(ctx) {
        ctx.rotate(this.aimAngle);

        if (Math.abs(this.aimAngle) > Math.PI / 2) {
            ctx.scale(1, -1);
        }

        let armColor = this.color;
        if (this.hero?.specialActive) {
            if (this.heroType.special?.effects?.armColor) {
                armColor = this.heroType.special.effects.armColor;
            } else if (this.heroType.special?.effects?.armorColor) {
                armColor = this.heroType.special.effects.armorColor;
            }
        }

        ctx.fillStyle = armColor;
        ctx.fillRect(5, -6, 15, 10);

        // Desenha arma específica do herói
        this.drawHeroWeapon(ctx);
    }

    drawHeroWeapon(ctx) {
        if (!this.heroType) return;

        switch (this.heroType.id) {
            case 'samurai':
                // Katana
                ctx.fillStyle = '#333';
                ctx.fillRect(18, -3, 8, 40);
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(18, -35, 6, 35);
                ctx.fillStyle = '#fff';
                ctx.fillRect(20, -32, 2, 28);
                break;

            case 'luffy':
                if (!this.hero?.stretchArm) {
                    ctx.fillStyle = this.hero?.specialActive ? '#1a1a1a' : '#ffccaa';
                    ctx.beginPath();
                    ctx.arc(30, 0, this.hero?.specialActive ? 18 : 12, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'goku':
                ctx.fillStyle = '#ffccaa';
                ctx.beginPath();
                ctx.arc(25, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(0, 191, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(30, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'superman':
                // Sem arma, só punhos
                ctx.fillStyle = '#ffccaa';
                ctx.beginPath();
                ctx.arc(25, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'iron_man':
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(15, -7, 25, 14);
                ctx.fillStyle = this.hero?.attackCooldown > this.heroType.attack.cooldown - 3 ? '#00ffff' : '#87ceeb';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(35, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;

            case 'batman':
                // Batarang na mão
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.lineTo(35, -8);
                ctx.lineTo(30, 0);
                ctx.lineTo(35, 8);
                ctx.closePath();
                ctx.fill();
                break;

            case 'darkseid':
                // Punho rochoso
                ctx.fillStyle = '#4a4a4a';
                ctx.beginPath();
                ctx.arc(28, 0, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#333';
                ctx.fillRect(20, -5, 10, 10);
                break;

            case 'thor':
                // Mjolnir
                if (!this.hero?.thrownProjectile) {
                    ctx.fillStyle = '#7f8c8d';
                    ctx.fillRect(20, -15, 25, 30); // Cabeça do martelo
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(20, 0, 10, 8); // Cabo (horizontal pq braço ta virado)
                    // Detalhe
                    ctx.fillStyle = '#95a5a6';
                    ctx.fillRect(22, -12, 21, 24);
                }
                break;

            case 'captain_america':
                // Escudo
                if (!this.hero?.thrownProjectile) {
                    ctx.fillStyle = '#c0392b';
                    ctx.beginPath();
                    ctx.arc(30, 0, 20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(30, 0, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#c0392b';
                    ctx.beginPath();
                    ctx.arc(30, 0, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#3498db';
                    ctx.beginPath();
                    ctx.arc(30, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            default:
                // Arma genérica
                ctx.fillStyle = '#333';
                ctx.fillRect(18, -4, 28, 8);
                ctx.fillRect(40, -3, 8, 6);
        }
    }

    drawLaser(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const laserColor = this.heroType?.attack?.color || '#ff0000';

        const gradient = ctx.createLinearGradient(
            0, 0,
            Math.cos(this.aimAngle) * 1000,
            Math.sin(this.aimAngle) * 1000
        );
        gradient.addColorStop(0, laserColor + '88');
        gradient.addColorStop(1, laserColor + '00');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.aimAngle) * 1000, Math.sin(this.aimAngle) * 1000);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}
