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

        // Física de equilíbrio (agora muito mais forte para evitar "mortais")
        if (!this.isSliding && !this.dead) {
            const uprightForce = 0.1; // Força muito maior para manter em pé
            this.angVel -= this.angle * uprightForce;

            // Inclinação leve baseada na velocidade X
            const targetLean = this.vx * 0.015;
            this.angle += (targetLean - this.angle) * 0.1;
        }

        // Rotação
        this.angle += this.angVel;
        this.angVel *= this.onGround ? 0.5 : 0.9; // Mais atrito angular

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

                    // Inclina para frente ao voar (estilo Iron Man)
                    this.angle = this.facing * 0.5; // ~30 graus
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

        // Encontrar alvo mais próximo
        let target = null;
        let minDist = Infinity;

        for (const p of Game.players) {
            if (p.id !== this.id && !p.dead) {
                const d = Math.abs(p.x - this.x) + Math.abs(p.y - this.y);
                if (d < minDist) {
                    minDist = d;
                    target = p;
                }
            }
        }

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
        // Removida a rotação forçada (angVel = -0.4...)
        // this.angVel = -0.4 * this.facing;

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
            // Flash de tiro (apenas se não tiver noFlash)
            if (!this.hero.type.attack.noFlash) {
                Particles.emitMuzzleFlash(mx, my, this.aimAngle);
            }

            const recoil = this.hero.getRecoil();
            this.vx -= Math.cos(this.aimAngle) * recoil;
            this.vy -= Math.sin(this.aimAngle) * recoil;
            this.angVel += 0.08 * this.facing * (Math.random() + 0.5);
        }

        return bullets;
    }

    hit(bulletVx, bulletVy, damage, isHeadshot = false) {
        if (this.dead) return;

        // i-frames mais longos e estritos
        if (this.hitFlash > 0) return;

        let actualDamage = damage;
        if (isHeadshot) {
            actualDamage *= 2;
            Particles.emit(this.x, this.y - 40, '#ff0000', 15, {
                size: 8, decay: 0.03, glow: true
            });
        }

        Audio.playHit();
        this.hitFlash = 15; // Aumentado tempo de invencibilidade visual e lógica
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

    drawGenericBody(ctx, legOffset, bodyColor) {
        // Pernas
        this.drawRect(ctx, -12, 12 - legOffset, 10, 22, bodyColor);
        this.drawRect(ctx, 2, 12 + legOffset, 10, 22, bodyColor);

        // Tronco
        this.drawRect(ctx, -14, -22, 28, 38, bodyColor);

        // Detalhe no peito
        ctx.fillStyle = this.adjustColor(bodyColor, -30);
        ctx.fillRect(-12, -18, 24, 4);

        // Cabeça
        this.drawRect(ctx, -12, -38, 24, 22, '#ffccaa');

        // Cabelo
        this.drawRect(ctx, -14, -42, 28, 10, '#333');

        // Olhos
        this.drawEyes(ctx, null);
    }

    // Helper para desenhar retângulo com sombra simples
    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);

        // Sombra lateral direita e inferior para dar volume
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x + w - 3, y, 3, h); // Sombra lateral
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x, y + h - 2, w, 2); // Sombra inferior

        // Brilho na esquerda/topo para dar mais volume
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, 2, h);
        ctx.fillRect(x, y, w, 2);
    }

    // Helper para desenhar círculo com sombra
    drawCircle(ctx, x, y, radius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Sombra crescente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0.25 * Math.PI, 1.25 * Math.PI, true);
        ctx.fill();
    }

    drawHeroSkin(ctx, legOffset) {
        const hero = this.heroType;
        const isTransformed = this.hero?.specialActive;

        switch (hero.id) {
            case 'luffy':
                // LUFFY - Colete vermelho, shorts azuis, chapéu de palha
                // Pernas (shorts azuis com bainha branca)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 18, '#3498db');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 18, '#3498db');
                // Bainha
                this.drawRect(ctx, -12, 30 - legOffset, 10, 4, '#ecf0f1');
                this.drawRect(ctx, 2, 30 + legOffset, 10, 4, '#ecf0f1');

                // Tronco (colete vermelho aberto)
                this.drawRect(ctx, -14, -22, 28, 38, '#e74c3c');

                // Peito exposto e barriga
                this.drawRect(ctx, -8, -18, 16, 34, '#ffccaa');

                // Botões do colete (amarelo)
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath(); ctx.arc(-10, -5, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI*2); ctx.fill();

                // Cicatriz X no peito
                ctx.strokeStyle = '#c0392b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-6, -12);
                ctx.lineTo(6, 0);
                ctx.moveTo(6, -12);
                ctx.lineTo(-6, 0);
                ctx.stroke();

                // Cabeça
                this.drawRect(ctx, -12, -38, 24, 22, '#ffccaa');

                // Cabelo preto bagunçado
                this.drawRect(ctx, -13, -42, 26, 8, '#1a1a1a');
                // Franja
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.moveTo(-12, -34); ctx.lineTo(-10, -30); ctx.lineTo(-6, -34);
                ctx.lineTo(0, -28);
                ctx.lineTo(6, -34); ctx.lineTo(10, -30); ctx.lineTo(12, -34);
                ctx.fill();

                if (isTransformed) {
                    // GEAR 4 - corpo fica preto brilhante com marcas vermelhas
                    this.drawRect(ctx, -16, -22, 32, 38, '#1a1a1a'); // Mais largo
                    ctx.strokeStyle = '#ff4757';
                    ctx.lineWidth = 3;
                    // Haki marks
                    ctx.beginPath();
                    ctx.arc(-8, -10, 5, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(8, 10, 5, 0, Math.PI*2);
                    ctx.stroke();
                }
                break;

            case 'goku':
                // GOKU - Gi laranja, faixa azul
                // Pernas (calça laranja)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#e67e22');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#e67e22');
                // Botas azuis com detalhe vermelho/amarelo
                this.drawRect(ctx, -12, 28 - legOffset, 10, 6, '#2c3e50');
                this.drawRect(ctx, 2, 28 + legOffset, 10, 6, '#2c3e50');
                ctx.fillStyle = '#f1c40f'; // Detalhe da bota
                ctx.fillRect(-12, 30 - legOffset, 10, 1);
                ctx.fillRect(2, 30 + legOffset, 10, 1);

                // Tronco (gi laranja)
                this.drawRect(ctx, -14, -22, 28, 38, '#e67e22');

                // Camiseta azul por baixo
                this.drawRect(ctx, -8, -22, 16, 6, '#3498db');

                // Gola do Gi
                ctx.fillStyle = '#e67e22';
                ctx.beginPath();
                ctx.moveTo(-14, -22); ctx.lineTo(-8, -10); ctx.lineTo(-14, 0);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(14, -22); ctx.lineTo(8, -10); ctx.lineTo(14, 0);
                ctx.fill();

                // Faixa azul com nó
                this.drawRect(ctx, -14, 0, 28, 8, '#3498db');
                // Nó da faixa
                this.drawRect(ctx, -16, 2, 4, 10, '#3498db');

                // Símbolo no peito
                this.drawCircle(ctx, -8, -12, 5, '#fff');
                ctx.fillStyle = '#000';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('亀', -8, -10);

                // Cabeça
                this.drawRect(ctx, -12, -38, 24, 22, '#ffccaa');
                break;

            case 'superman':
                // SUPERMAN - Traje azul, capa vermelha, S no peito
                // Capa (atrás)
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.moveTo(-18, -20); ctx.lineTo(-24, 35); ctx.lineTo(-10, 35); ctx.lineTo(-10, -20);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(10, -20); ctx.lineTo(10, 35); ctx.lineTo(24, 35); ctx.lineTo(18, -20);
                ctx.fill();

                // Pernas (azul)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#3498db');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#3498db');

                // Botas vermelhas
                this.drawRect(ctx, -12, 24 - legOffset, 10, 10, '#c0392b');
                this.drawRect(ctx, 2, 24 + legOffset, 10, 10, '#c0392b');
                // Detalhe topo da bota (V shape)
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.moveTo(-12, 24 - legOffset); ctx.lineTo(-7, 28 - legOffset); ctx.lineTo(-2, 24 - legOffset);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(2, 24 + legOffset); ctx.lineTo(7, 28 + legOffset); ctx.lineTo(12, 24 + legOffset);
                ctx.fill();

                // Calção vermelho
                this.drawRect(ctx, -12, 12 - legOffset, 10, 6, '#c0392b');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 6, '#c0392b');

                // Tronco (azul)
                this.drawRect(ctx, -14, -22, 28, 38, '#3498db');

                // Músculos (sombreamento sutil)
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(-10, -10, 20, 2); // Peitoral
                ctx.fillRect(-4, -10, 8, 20); // Abdomen

                // Cinto amarelo
                this.drawRect(ctx, -14, 10, 28, 4, '#f1c40f');

                // S symbol (Diamante)
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.moveTo(0, -20);
                ctx.lineTo(10, -14);
                ctx.lineTo(0, 4);
                ctx.lineTo(-10, -14);
                ctx.closePath();
                ctx.fill();

                // S
                ctx.fillStyle = '#c0392b';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('S', 0, -8);

                // Cabeça
                this.drawRect(ctx, -12, -38, 24, 22, '#ffccaa');
                // Cacho do superman
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -38, 3, 0, Math.PI, false);
                ctx.stroke();
                break;

            case 'thor':
                // THOR - Armadura prateada, capa vermelha, cabelo loiro
                // Capa esvoaçante
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.moveTo(-18, -20); ctx.lineTo(-28, 30); ctx.lineTo(-8, 30); ctx.lineTo(-8, -20);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(8, -20); ctx.lineTo(8, 30); ctx.lineTo(28, 30); ctx.lineTo(18, -20);
                ctx.fill();

                // Pernas (armadura escura)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#2c3e50');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#2c3e50');
                // Botas douradas
                this.drawRect(ctx, -12, 26 - legOffset, 10, 8, '#f1c40f');
                this.drawRect(ctx, 2, 26 + legOffset, 10, 8, '#f1c40f');

                // Armadura (cinza metálico com detalhes)
                this.drawRect(ctx, -14, -22, 28, 38, '#95a5a6');
                // Colar detalhado
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(0, -10); ctx.lineTo(14, -22); ctx.stroke();

                // Discos metálicos (6 discos)
                for(let i=0; i<3; i++) {
                    this.drawCircle(ctx, -7, -14 + i*14, 4, '#bdc3c7');
                    this.drawCircle(ctx, 7, -14 + i*14, 4, '#bdc3c7');
                }

                // Cabeça
                this.drawRect(ctx, -12, -38, 24, 22, '#ffccaa');

                // Cabelo loiro longo
                this.drawRect(ctx, -14, -42, 28, 10, '#f1c40f');
                this.drawRect(ctx, -15, -38, 4, 18, '#f1c40f');
                this.drawRect(ctx, 11, -38, 4, 18, '#f1c40f');

                // Capacete alado (asas laterais)
                ctx.fillStyle = '#bdc3c7';
                ctx.beginPath();
                ctx.moveTo(-14, -38); ctx.lineTo(-24, -48); ctx.lineTo(-14, -44);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(14, -38); ctx.lineTo(24, -48); ctx.lineTo(14, -44);
                ctx.fill();
                break;

            case 'captain_america':
                // CAP - Uniforme azul com listras, estrela no peito
                // Pernas (azul)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#3498db');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#3498db');
                // Botas vermelhas
                this.drawRect(ctx, -12, 24 - legOffset, 10, 10, '#e74c3c');
                this.drawRect(ctx, 2, 24 + legOffset, 10, 10, '#e74c3c');

                // Tronco
                this.drawRect(ctx, -14, -22, 28, 38, '#3498db');
                // Escamas (textura)
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                for(let i=0; i<3; i++) {
                    ctx.fillRect(-10 + i*8, -18, 4, 4);
                    ctx.fillRect(-14 + i*8, -14, 4, 4);
                }

                // Listras vermelhas e brancas no abdomen
                for (let i = 0; i < 5; i++) {
                    this.drawRect(ctx, -14, 2 + i * 4, 28, 4, i % 2 === 0 ? '#e74c3c' : '#fff');
                }

                // Estrela branca
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('★', 0, -8);

                // Cinto utilidades
                this.drawRect(ctx, -14, 0, 28, 4, '#2c3e50');

                // Cabeça com máscara
                this.drawRect(ctx, -12, -38, 24, 22, '#3498db');
                this.drawRect(ctx, -8, -30, 16, 14, '#ffccaa');
                // Asas pintadas na máscara
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('A', 0, -40);
                break;

            case 'iron_man':
                // IRON MAN - Armadura vermelha e dourada
                // Pernas (vermelho)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#c0392b');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#c0392b');
                // Detalhe perna dourado
                this.drawRect(ctx, -12, 18 - legOffset, 10, 6, '#f1c40f');
                this.drawRect(ctx, 2, 18 + legOffset, 10, 6, '#f1c40f');

                // Armadura (vermelho metálico)
                this.drawRect(ctx, -14, -22, 28, 38, '#c0392b');

                // Gradiente simples no peito para parecer metal
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(-10, -20, 10, 10);

                // Arc reactor
                ctx.fillStyle = '#00bfff';
                ctx.shadowColor = '#00bfff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, -6, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff'; // Centro branco
                ctx.beginPath();
                ctx.arc(0, -6, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Detalhes dourados no ombro/lateral
                this.drawRect(ctx, -14, -22, 6, 12, '#f1c40f');
                this.drawRect(ctx, 8, -22, 6, 12, '#f1c40f');

                // Cabeça (capacete)
                this.drawRect(ctx, -12, -38, 24, 22, '#c0392b');
                // Faceplate dourada
                this.drawRect(ctx, -10, -36, 20, 20, '#f1c40f');
                // Queixo vermelho
                this.drawRect(ctx, -8, -18, 16, 2, '#c0392b');

                // Olhos brilhantes
                ctx.fillStyle = '#87ceeb';
                ctx.shadowColor = '#87ceeb';
                ctx.shadowBlur = 10;
                ctx.fillRect(-7, -30, 6, 2);
                ctx.fillRect(1, -30, 6, 2);
                ctx.shadowBlur = 0;
                break;

            case 'samurai':
                // SAMURAI - Armadura tradicional, cabelo preso
                // Pernas (hakama preto)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#1a1a1a');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#1a1a1a');

                // Tronco (armadura vermelha)
                this.drawRect(ctx, -14, -22, 28, 38, '#8b0000');

                // Kusazuri (placas da cintura)
                this.drawRect(ctx, -14, 10, 28, 8, '#1a1a1a');
                // Detalhes dourados
                ctx.fillStyle = '#f1c40f';
                for(let i=0; i<4; i++) {
                    ctx.fillRect(-12 + i*7, 12, 2, 4);
                }

                // Peitoral detalhado
                this.drawRect(ctx, -12, -20, 10, 20, '#1a1a1a');
                this.drawRect(ctx, 2, -20, 10, 20, '#1a1a1a');

                // Cabeça
                this.drawRect(ctx, -12, -38, 24, 22, '#ffccaa');

                // Capacete Kabuto (se não desenhado no headgear, desenha aqui a base)
                this.drawRect(ctx, -13, -42, 26, 6, '#1a1a1a');
                // Chifres (Kuwagata) dourados
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-8, -42); ctx.quadraticCurveTo(-15, -55, -5, -58);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(8, -42); ctx.quadraticCurveTo(15, -55, 5, -58);
                ctx.stroke();
                break;

            case 'batman':
                // BATMAN - Todo preto, cinto amarelo, símbolo do morcego
                // Capa escura
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.moveTo(-18, -20); ctx.lineTo(-24, 30);
                // Pontas da capa
                ctx.lineTo(-20, 25); ctx.lineTo(-16, 30); ctx.lineTo(-12, 25); ctx.lineTo(-8, 30);
                ctx.lineTo(-8, -20);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(8, -20); ctx.lineTo(8, 30);
                ctx.lineTo(12, 25); ctx.lineTo(16, 30); ctx.lineTo(20, 25); ctx.lineTo(24, 30);
                ctx.lineTo(18, -20);
                ctx.fill();

                // Pernas (preto)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#1a1a1a');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#1a1a1a');

                // Tronco (cinza escuro e armadura)
                this.drawRect(ctx, -14, -22, 28, 38, '#2c3e50');
                // Placas da armadura
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(-12, -20, 10, 12);
                ctx.fillRect(2, -20, 10, 12);
                ctx.fillRect(-12, -6, 10, 8);
                ctx.fillRect(2, -6, 10, 8);

                // Cinto amarelo com bolsos
                this.drawRect(ctx, -14, 4, 28, 6, '#f1c40f');
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(-10, 5, 4, 4); ctx.fillRect(-2, 5, 4, 4); ctx.fillRect(6, 5, 4, 4);

                // Símbolo do morcego
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, -10, 12, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Cabeça com máscara
                this.drawRect(ctx, -12, -38, 24, 22, '#1a1a1a');
                this.drawRect(ctx, -6, -28, 12, 10, '#ffccaa');
                // Orelhas pontudas
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.moveTo(-12, -38); ctx.lineTo(-10, -50); ctx.lineTo(-4, -38);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(12, -38); ctx.lineTo(10, -50); ctx.lineTo(4, -38);
                ctx.fill();

                if (isTransformed) {
                    // HELLBAT - armadura vermelha brilhante
                    this.drawRect(ctx, -14, -22, 28, 38, '#8b0000');
                    ctx.fillStyle = '#ff0000';
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 20;
                    ctx.fillRect(-12, -20, 24, 4);
                    ctx.fillRect(-12, 10, 24, 4);
                    ctx.shadowBlur = 0;
                }
                break;

            case 'darkseid':
                // DARKSEID - Pele cinza, armadura preta, olhos vermelhos
                // Pernas (azul escuro/cinza)
                this.drawRect(ctx, -12, 12 - legOffset, 10, 22, '#2c3e50');
                this.drawRect(ctx, 2, 12 + legOffset, 10, 22, '#2c3e50');
                // Botas
                this.drawRect(ctx, -12, 26 - legOffset, 10, 8, '#1a1a1a');
                this.drawRect(ctx, 2, 26 + legOffset, 10, 8, '#1a1a1a');

                // Corpo (mais largo)
                this.drawRect(ctx, -16, -22, 32, 40, '#2c3e50'); // Túnica azul escura

                // Textura rochosa
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(-10, -18, 2, 2);
                ctx.fillRect(5, -12, 2, 2);
                ctx.fillRect(-6, 0, 2, 2);
                ctx.fillRect(8, 10, 2, 2);
                ctx.fillRect(0, -5, 2, 2);

                // Cinto/Detalhe
                this.drawRect(ctx, -16, 0, 32, 6, '#1a1a1a');

                // Símbolo Omega
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 10;
                ctx.fillText('Ω', 0, -5);
                ctx.shadowBlur = 0;

                // Cabeça (pele rochosa)
                this.drawRect(ctx, -14, -40, 28, 26, '#4a4a4a');
                // Textura na cara
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(-10, -38, 4, 1);
                ctx.fillRect(5, -36, 3, 1);
                ctx.fillRect(-5, -20, 10, 2); // Boca

                // Olhos vermelhos brilhantes
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.fillRect(-10, -34, 8, 4);
                ctx.fillRect(2, -34, 8, 4);
                ctx.shadowBlur = 0;
                return; // Não desenha olhos normais

            default:
                // Armas genéricas - usa cor do herói
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
            ctx.fillRect(-14, -42, 28, 10);
            return;
        }

        switch (this.heroType.id) {
            case 'luffy':
                ctx.fillStyle = '#f4d03f';
                ctx.beginPath();
                ctx.ellipse(0, -38, 18, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-10, -50, 20, 15);
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(-12, -42, 24, 4);
                break;

            case 'goku':
                ctx.fillStyle = '#1a1a1a';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 8, -38);
                    ctx.lineTo(i * 8 - 5, -58 - Math.abs(i) * 3);
                    ctx.lineTo(i * 8 + 5, -58 - Math.abs(i) * 3);
                    ctx.closePath();
                    ctx.fill();
                }
                break;

            case 'superman':
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-12, -42, 24, 8);
                ctx.beginPath();
                ctx.moveTo(-5, -42);
                ctx.lineTo(0, -50);
                ctx.lineTo(5, -42);
                ctx.closePath();
                ctx.fill();
                break;

            case 'thor':
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(-14, -44, 28, 10);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(-14, -40);
                ctx.lineTo(-22, -58);
                ctx.lineTo(-10, -44);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(14, -40);
                ctx.lineTo(22, -58);
                ctx.lineTo(10, -44);
                ctx.closePath();
                ctx.fill();
                break;

            case 'captain_america':
                ctx.fillStyle = '#3498db';
                ctx.fillRect(-14, -44, 28, 10);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('A', 0, -35);
                break;

            case 'iron_man':
                ctx.fillStyle = bodyColor;
                ctx.fillRect(-14, -44, 28, 10);
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(-6, -42, 12, 4);
                break;

            case 'samurai':
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-14, -42, 28, 6);
                ctx.beginPath();
                ctx.arc(0, -50, 10, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'batman':
                // Capuz com orelhas
                ctx.fillStyle = bodyColor;
                ctx.fillRect(-14, -44, 28, 10);
                ctx.beginPath();
                ctx.moveTo(-12, -44);
                ctx.lineTo(-8, -58);
                ctx.lineTo(-4, -44);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(12, -44);
                ctx.lineTo(8, -58);
                ctx.lineTo(4, -44);
                ctx.closePath();
                ctx.fill();
                break;

            case 'darkseid':
                // Capacete rochoso
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(-16, -46, 32, 14);
                ctx.fillStyle = '#333';
                ctx.fillRect(-12, -50, 10, 8);
                ctx.fillRect(2, -50, 10, 8);
                break;

            default:
                ctx.fillStyle = bodyColor;
                ctx.fillRect(-14, -42, 28, 10);
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
