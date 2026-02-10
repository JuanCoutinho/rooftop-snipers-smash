/**
 * GAME ENGINE - Motor principal com heróis E armas
 */

const Game = {
    state: 'MENU',
    isTwoPlayer: false,

    canvas: null,
    ctx: null,

    players: [],
    bulletManager: new BulletManager(),
    backgroundManager: new BackgroundManager(),
    clouds: [],
    walls: [],

    island: { x: 0, y: 0, width: 0, height: 0 },
    gravity: 0.55,

    camera: {
        x: 0, y: 0,
        zoom: 1,
        targetZoom: 1,
        shake: 0,
        offsetX: 0,
        offsetY: 0
    },

    scores: { p1: 0, p2: 0 },
    round: 1,
    winScore: 5,

    keys: {},
    mouse: { x: 0, y: 0, clicked: false, rightClicked: false },

    selectedCharacters: { p1: null, p2: null },
    selectPlayer: 0,

    settings: {
        screenShake: true,
        particles: true,
        sfxVolume: 0.8,
        cpuDifficulty: 'medium'
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        this.bindEvents();
        this.createCharacterSelectUI();

        this.menuLoop();

        setTimeout(() => {
            document.getElementById('preloader').classList.add('hidden');
        }, 1800);
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.backgroundManager.init(this.canvas.width, this.canvas.height);
    },

    createCharacterSelectUI() {
        const container = document.createElement('div');
        container.id = 'character-select';
        container.className = 'hidden';
        container.innerHTML = `
            <div class="select-content">
                <h2 class="select-title">⚔️ ESCOLHA SEU PERSONAGEM ⚔️</h2>
                <div class="select-player" id="select-player-indicator">JOGADOR 1</div>
                
                <div class="select-section">
                    <h3 class="section-title">🦸 HERÓIS</h3>
                    <div class="character-grid" id="hero-grid"></div>
                </div>
                
                <div class="select-section">
                    <h3 class="section-title">🔫 ARMAS CLÁSSICAS</h3>
                    <div class="character-grid" id="weapon-grid"></div>
                </div>
                
                <div class="character-description" id="char-description">
                    <div class="char-desc-name" id="char-desc-name">Selecione um personagem</div>
                    <div class="char-desc-text" id="char-desc-text">Passe o mouse para ver habilidades</div>
                </div>
            </div>
        `;
        document.getElementById('ui-layer').appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            #character-select {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(135deg, rgba(26,26,46,0.97), rgba(22,33,62,0.97));
                display: flex;
                justify-content: center;
                align-items: flex-start;
                z-index: 1000;
                overflow-y: auto;
                padding: 20px 0;
            }
            #character-select.hidden { display: none; }
            .select-content {
                text-align: center;
                max-width: 950px;
                padding: 20px;
            }
            .select-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 28px;
                color: #fff;
                margin-bottom: 10px;
                text-shadow: 0 0 20px #ff4757;
            }
            .select-player {
                font-family: 'Press Start 2P', cursive;
                font-size: 14px;
                padding: 8px 25px;
                border-radius: 20px;
                display: inline-block;
                margin-bottom: 15px;
            }
            .select-player.p1 {
                background: linear-gradient(135deg, #2ecc71, #27ae60);
                box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
            }
            .select-player.p2 {
                background: linear-gradient(135deg, #e67e22, #d35400);
                box-shadow: 0 0 20px rgba(230, 126, 34, 0.5);
            }
            .select-section {
                margin-bottom: 15px;
            }
            .section-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 16px;
                color: #ffa502;
                margin-bottom: 10px;
                text-align: left;
                padding-left: 10px;
                border-left: 4px solid #ffa502;
            }
            .character-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 12px;
                margin-bottom: 10px;
            }
            .char-card {
                background: rgba(255, 255, 255, 0.06);
                border: 2px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 15px 10px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .char-card:hover {
                transform: translateY(-3px);
                border-color: #fff;
                background: rgba(255, 255, 255, 0.12);
            }
            .char-card.selected {
                border-color: #2ecc71;
                background: rgba(46, 204, 113, 0.25);
                box-shadow: 0 0 25px rgba(46, 204, 113, 0.4);
            }
            .char-emoji {
                font-size: 35px;
                margin-bottom: 5px;
            }
            .char-name {
                font-family: 'Orbitron', sans-serif;
                font-size: 9px;
                color: #fff;
            }
            .character-description {
                background: rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 15px;
                min-height: 80px;
            }
            .char-desc-name {
                font-family: 'Orbitron', sans-serif;
                font-size: 18px;
                color: #fff;
                margin-bottom: 8px;
            }
            .char-desc-text {
                font-family: 'Press Start 2P', cursive;
                font-size: 9px;
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.8;
            }
            @media (max-width: 700px) {
                .character-grid { grid-template-columns: repeat(3, 1fr); }
                .char-emoji { font-size: 28px; }
            }
        `;
        document.head.appendChild(style);

        this.updateCharacterGrids();
    },

    updateCharacterGrids() {
        const heroGrid = document.getElementById('hero-grid');
        const weaponGrid = document.getElementById('weapon-grid');
        if (!heroGrid || !weaponGrid) return;

        heroGrid.innerHTML = '';
        weaponGrid.innerHTML = '';

        // Heróis
        HeroList.forEach(hero => {
            const card = document.createElement('div');
            card.className = 'char-card';
            card.dataset.charId = hero.id;
            card.dataset.charType = 'hero';
            card.style.borderColor = hero.color + '44';
            card.innerHTML = `
                <div class="char-emoji">${hero.emoji}</div>
                <div class="char-name">${hero.name}</div>
            `;

            card.addEventListener('click', () => this.selectCharacter(hero, 'hero'));
            card.addEventListener('mouseenter', () => this.showCharacterInfo(hero, 'hero'));

            heroGrid.appendChild(card);
        });

        // Armas
        WeaponList.forEach(weapon => {
            const card = document.createElement('div');
            card.className = 'char-card';
            card.dataset.charId = weapon.id;
            card.dataset.charType = 'weapon';
            card.style.borderColor = weapon.color + '44';
            card.innerHTML = `
                <div class="char-emoji">${weapon.emoji}</div>
                <div class="char-name">${weapon.name}</div>
            `;

            card.addEventListener('click', () => this.selectCharacter(weapon, 'weapon'));
            card.addEventListener('mouseenter', () => this.showCharacterInfo(weapon, 'weapon'));

            weaponGrid.appendChild(card);
        });
    },

    showCharacterInfo(char, type) {
        document.getElementById('char-desc-name').innerHTML =
            `${char.emoji} ${char.name}`;
        document.getElementById('char-desc-name').style.color = char.color;

        let desc = char.description + '<br><br>';

        desc += `<span style="color: #ff6b6b">⚔️ Dano:</span> ${char.attack.damage}`;
        desc += ` | <span style="color: #3498db">⏱️ Cooldown:</span> ${char.attack.cooldown}`;

        if (char.special) {
            desc += `<br><span style="color: #ffa502">⭐ Especial (Botão Direito):</span> ${char.special.name}`;
        }

        if (char.canGlide) desc += `<br><span style="color: #00bfff">🪂 Pode planar!</span>`;
        if (char.canFly) desc += `<br><span style="color: #00bfff">🚀 Pode voar!</span>`;
        if (char.attack.canCutBullets) desc += `<br><span style="color: #fff">⚔️ Corta projéteis!</span>`;
        if (char.attack.tracking) desc += `<br><span style="color: #ff0000">🎯 Projéteis SEGUEM o inimigo!</span>`;

        document.getElementById('char-desc-text').innerHTML = desc;
    },

    selectCharacter(char, type) {
        Audio.playClick();

        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-char-id="${char.id}"]`).classList.add('selected');

        if (this.selectPlayer === 0) {
            this.selectedCharacters.p1 = { char, type };

            if (this.isTwoPlayer) {
                setTimeout(() => {
                    this.selectPlayer = 1;
                    document.getElementById('select-player-indicator').textContent = 'JOGADOR 2';
                    document.getElementById('select-player-indicator').className = 'select-player p2';
                    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                }, 400);
            } else {
                // CPU escolhe aleatório
                const allChars = [...HeroList, ...WeaponList].filter(c => c.id !== char.id);
                const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
                this.selectedCharacters.p2 = {
                    char: randomChar,
                    type: randomChar.isWeapon ? 'weapon' : 'hero'
                };

                setTimeout(() => {
                    document.getElementById('character-select').classList.add('hidden');
                    this.startCountdown();
                }, 400);
            }
        } else {
            this.selectedCharacters.p2 = { char, type };

            setTimeout(() => {
                document.getElementById('character-select').classList.add('hidden');
                this.selectPlayer = 0;
                document.getElementById('select-player-indicator').textContent = 'JOGADOR 1';
                document.getElementById('select-player-indicator').className = 'select-player p1';
                this.startCountdown();
            }, 400);
        }
    },

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        // Mouse
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            Audio.init();

            if (e.button === 0) { // Left click
                this.mouse.clicked = true;
                if (this.state === 'PLAYING' && this.players[0]) {
                    const bulletData = this.players[0].shoot();
                    if (bulletData) {
                        this.bulletManager.add(bulletData);
                        this.camera.shake = 8;
                    }
                }
            } else if (e.button === 2) { // Right click - ESPECIAL!
                this.mouse.rightClicked = true;
                if (this.state === 'PLAYING' && this.players[0]?.hero) {
                    if (!this.players[0].hero.isCharging) {
                        this.players[0].hero.activateSpecial();
                    }
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.clicked = false;
            } else if (e.button === 2) {
                this.mouse.rightClicked = false;
                // Soltar especial carregado
                if (this.state === 'PLAYING' && this.players[0]) {
                    this.players[0].releaseSpecialAttack();
                }
            }
        });

        // Prevenir menu de contexto
        window.addEventListener('contextmenu', (e) => {
            if (this.state === 'PLAYING') {
                e.preventDefault();
            }
        });

        // Teclado
        window.addEventListener('keydown', (e) => {
            Audio.init();
            this.keys[e.code] = true;

            if (this.state === 'PLAYING') {
                if (e.code === 'KeyW') {
                    this.players[0]?.startJump();
                }
                if (this.isTwoPlayer && e.code === 'Period') {
                    this.players[1]?.startJump();
                }
                if (this.isTwoPlayer && e.code === 'Slash') {
                    const bulletData = this.players[1]?.shoot();
                    if (bulletData) {
                        this.bulletManager.add(bulletData);
                        this.camera.shake = 8;
                    }
                }
                if (e.code === 'Escape') {
                    this.togglePause();
                }
            } else if (this.state === 'PAUSED') {
                if (e.code === 'Escape') {
                    this.togglePause();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (this.state === 'PLAYING') {
                if (e.code === 'KeyW') {
                    this.players[0]?.endJump();
                }
                if (this.isTwoPlayer && e.code === 'Period') {
                    this.players[1]?.endJump();
                }
            }
        });

        // Botões
        document.getElementById('btn-1player')?.addEventListener('click', () => {
            Audio.playClick();
            this.startGame(false);
        });

        document.getElementById('btn-2players')?.addEventListener('click', () => {
            Audio.playClick();
            this.startGame(true);
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            Audio.playClick();
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.getElementById('btn-close-settings')?.addEventListener('click', () => {
            Audio.playClick();
            this.saveSettings();
            document.getElementById('settings-modal').classList.add('hidden');
        });

        document.getElementById('btn-rematch')?.addEventListener('click', () => {
            Audio.playClick();
            this.resetMatch();
        });

        document.getElementById('btn-menu')?.addEventListener('click', () => {
            Audio.playClick();
            this.showMenu();
        });

        document.getElementById('btn-resume')?.addEventListener('click', () => {
            Audio.playClick();
            this.togglePause();
        });

        document.getElementById('btn-quit')?.addEventListener('click', () => {
            Audio.playClick();
            this.showMenu();
        });

        // Settings
        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            this.settings.sfxVolume = e.target.value / 100;
            Audio.setSfxVolume(this.settings.sfxVolume);
        });

        document.getElementById('win-score')?.addEventListener('change', (e) => {
            this.winScore = parseInt(e.target.value);
        });

        document.getElementById('cpu-difficulty')?.addEventListener('change', (e) => {
            this.settings.cpuDifficulty = e.target.value;
        });

        document.getElementById('screen-shake')?.addEventListener('change', (e) => {
            this.settings.screenShake = e.target.checked;
        });

        document.getElementById('particles-enabled')?.addEventListener('change', (e) => {
            this.settings.particles = e.target.checked;
            Particles.enabled = e.target.checked;
        });
    },

    saveSettings() {
        localStorage.setItem('rooftopSettings', JSON.stringify(this.settings));
    },

    startGame(twoPlayer) {
        this.isTwoPlayer = twoPlayer;
        this.scores = { p1: 0, p2: 0 };
        this.round = 1;

        document.getElementById('menu').classList.add('hidden');

        this.state = 'CHARACTER_SELECT';
        this.selectPlayer = 0;
        document.getElementById('select-player-indicator').textContent = 'JOGADOR 1';
        document.getElementById('select-player-indicator').className = 'select-player p1';
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('character-select').classList.remove('hidden');
    },

    startCountdown() {
        this.state = 'COUNTDOWN';
        this.generateLevel();

        document.getElementById('scoreboard').classList.add('visible');
        document.getElementById('hints').classList.add('visible');
        this.updateScoreUI();

        const countdownEl = document.getElementById('countdown');
        const numberEl = document.getElementById('countdown-number');

        countdownEl.classList.remove('hidden');

        let count = 3;
        numberEl.textContent = count;
        Audio.playCountdown(false);

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                numberEl.textContent = count;
                numberEl.style.animation = 'none';
                numberEl.offsetHeight;
                numberEl.style.animation = 'countdownPop 0.5s ease';
                Audio.playCountdown(false);
            } else if (count === 0) {
                numberEl.textContent = 'FIGHT!';
                numberEl.style.color = '#ff4757';
                Audio.playCountdown(true);
            } else {
                clearInterval(interval);
                countdownEl.classList.add('hidden');
                numberEl.style.color = '';
                this.state = 'PLAYING';
                document.getElementById('ui-layer').classList.add('game-active');
                this.gameLoop();
            }
        }, 1000);
    },

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pause-menu').classList.remove('hidden');
            document.getElementById('ui-layer').classList.remove('game-active');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pause-menu').classList.add('hidden');
            document.getElementById('ui-layer').classList.add('game-active');
            this.gameLoop();
        }
    },

    showMenu() {
        this.state = 'MENU';
        document.getElementById('ui-layer').classList.remove('game-active');
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('character-select').classList.add('hidden');
        document.getElementById('scoreboard').classList.remove('visible');
        document.getElementById('hints').classList.remove('visible');
        this.menuLoop();
    },

    resetMatch() {
        this.scores = { p1: 0, p2: 0 };
        this.round = 1;
        this.updateScoreUI();
        document.getElementById('game-over').classList.add('hidden');

        this.state = 'CHARACTER_SELECT';
        this.selectPlayer = 0;
        document.getElementById('select-player-indicator').textContent = 'JOGADOR 1';
        document.getElementById('select-player-indicator').className = 'select-player p1';
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('character-select').classList.remove('hidden');
    },

    generateLevel() {
        const w = 1200 + Math.random() * 300;
        const h = 350;

        this.island = {
            x: (this.canvas.width - w) / 2,
            y: this.canvas.height - 180,
            width: w,
            height: h,
            windows: []
        };

        // Gerar janelas estáticas para o prédio principal
        const windowSize = 30;
        const gap = 60;
        for (let y = this.island.y + 80; y < this.island.y + this.island.height; y += gap + 20) {
            for (let x = this.island.x + 50; x < this.island.x + this.island.width - 50; x += gap) {
                if (Math.random() > 0.3) {
                    this.island.windows.push({ x, y, w: windowSize, h: windowSize * 1.5 });
                }
            }
        }

        const wallHeight = 200;
        const wallWidth = 40;

        this.walls = [
            {
                x: this.island.x - wallWidth / 2,
                y: this.island.y - wallHeight,
                width: wallWidth,
                height: wallHeight
            },
            {
                x: this.island.x + this.island.width - wallWidth / 2,
                y: this.island.y - wallHeight,
                width: wallWidth,
                height: wallHeight
            }
        ];

        const centerX = this.island.x + this.island.width / 2;
        const spawnY = this.island.y - 100;

        this.players = [
            new Player(0, centerX - 150, spawnY, '#2ecc71', { isAI: false }),
            new Player(1, centerX + 150, spawnY, '#e67e22', {
                isAI: !this.isTwoPlayer,
                difficulty: this.settings.cpuDifficulty
            })
        ];

        // Aplicar personagens selecionados
        if (this.selectedCharacters.p1) {
            this.players[0].setHero(this.selectedCharacters.p1.char);
        }
        if (this.selectedCharacters.p2) {
            this.players[1].setHero(this.selectedCharacters.p2.char);
        }

        this.players[1].facing = -1;
        this.bulletManager.clear();
        Particles.clear();

        this.camera.zoom = 1;
        this.camera.targetZoom = 1;
        this.camera.shake = 0;
    },

    generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2.5),
                w: 50 + Math.random() * 60,
                speed: 0.15 + Math.random() * 0.4,
                opacity: 0.4 + Math.random() * 0.3
            });
        }
    },

    update() {
        this.backgroundManager.update();

        // Atualizar jogadores
        this.players.forEach(player => {
            player.update(this.keys, this.mouse, this.island, this.walls, this.camera, this.gravity);

            // Boomerangs
            if (player.hero?.thrownProjectile) {
                const hit = player.hero.updateBoomerang(this.players, player.x, player.y);
                if (hit && hit.type === 'player') {
                    const shake = hit.player.hit(hit.vx, hit.vy, hit.damage, false);
                    if (this.settings.screenShake) {
                        this.camera.shake = Math.max(this.camera.shake, shake);
                    }
                }
            }
        });

        // AI
        if (!this.isTwoPlayer && this.players[1] && !this.players[1].dead) {
            const aiBullets = this.players[1].updateAI(this.keys, this.island, this.walls);
            if (aiBullets && aiBullets.length > 0) {
                this.bulletManager.add(aiBullets);
                this.camera.shake = 5;
            }
        }

        // Balas
        const bulletResults = this.bulletManager.update(this.players, this.island, this.walls);
        bulletResults.forEach(result => {
            if (result.type === 'player') {
                const shakeAmount = result.player.hit(result.vx, result.vy, result.damage, result.isHeadshot);
                if (this.settings.screenShake) {
                    this.camera.shake = Math.max(this.camera.shake, shakeAmount);
                }

                if (result.isHeadshot) {
                    this.addKillFeed(-1, -1, '🎯 HEADSHOT!');
                }
            } else if (result.type === 'ground' || result.type === 'wall') {
                if (this.settings.screenShake) {
                    this.camera.shake = Math.max(this.camera.shake, 3);
                }
            }
        });

        Particles.update();

        // Mortes
        this.players.forEach(player => {
            if (player.dead && player.deathTimer === 1) {
                this.onPlayerDeath(player);
            }
        });

        this.updateCamera();
    },

    updateCamera() {
        if (this.players.length < 2) return;

        const p1 = this.players[0];
        const p2 = this.players[1];

        let midX = (p1.x + p2.x) / 2;
        let midY = (p1.y + p2.y) / 2;

        const dist = Math.abs(p1.x - p2.x);
        const targetZ = Math.min(1.0, Math.max(0.35, this.canvas.width / (dist + 700)));
        this.camera.targetZoom += (targetZ - this.camera.targetZoom) * 0.04;
        this.camera.zoom = this.camera.targetZoom;

        if (this.settings.screenShake && this.camera.shake > 0) {
            this.camera.shake *= 0.9;
            if (this.camera.shake < 0.5) this.camera.shake = 0;
        }

        this.camera.offsetX = this.canvas.width / 2 - midX * this.camera.zoom;
        this.camera.offsetY = this.canvas.height / 2 - midY * this.camera.zoom + 60;

        if (this.settings.screenShake && this.camera.shake > 0) {
            this.camera.offsetX += (Math.random() - 0.5) * this.camera.shake;
            this.camera.offsetY += (Math.random() - 0.5) * this.camera.shake;
        }
    },

    onPlayerDeath(player) {
        const winnerId = player.id === 0 ? 1 : 0;
        const winnerKey = winnerId === 0 ? 'p1' : 'p2';

        this.scores[winnerKey]++;
        Audio.playScore();
        this.updateScoreUI();
        this.addKillFeed(winnerId, player.id);

        if (this.scores.p1 >= this.winScore || this.scores.p2 >= this.winScore) {
            setTimeout(() => this.endMatch(), 1500);
        } else {
            this.round++;
            setTimeout(() => {
                if (this.state === 'PLAYING') {
                    this.generateLevel();
                    this.startCountdown();
                }
            }, 2000);
        }
    },

    endMatch() {
        this.state = 'GAMEOVER';

        const winner = this.scores.p1 >= this.winScore ? 'JOGADOR 1' : 'JOGADOR 2';
        const winnerChar = this.scores.p1 >= this.winScore ?
            this.selectedCharacters.p1?.char : this.selectedCharacters.p2?.char;

        Audio.playWin();
        Particles.emitConfetti(this.canvas.width / 2, this.canvas.height / 2, 100);

        document.getElementById('winner-text').innerHTML =
            `${winnerChar?.emoji || '🏆'} ${winner} VENCEU!`;
        document.getElementById('final-score').textContent = `${this.scores.p1} - ${this.scores.p2}`;
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('hints').classList.remove('visible');
    },

    updateScoreUI() {
        document.getElementById('p1-score').textContent = this.scores.p1;
        document.getElementById('p2-score').textContent = this.scores.p2;
        document.getElementById('round-text').textContent = `ROUND ${this.round}`;

        document.getElementById('p1-stars').innerHTML = '⭐'.repeat(this.scores.p1);
        document.getElementById('p2-stars').innerHTML = '⭐'.repeat(this.scores.p2);
    },

    addKillFeed(winnerId, loserId, customMessage = null) {
        const feed = document.getElementById('kill-feed');
        const entry = document.createElement('div');
        entry.className = 'kill-entry';

        if (customMessage) {
            entry.innerHTML = `<span style="color: #ffa502; font-weight: bold;">${customMessage}</span>`;
        } else {
            const winnerName = winnerId === 0 ? 'P1' : 'P2';
            const loserName = loserId === 0 ? 'P1' : 'P2';
            const winnerChar = winnerId === 0 ?
                this.selectedCharacters.p1?.char : this.selectedCharacters.p2?.char;

            entry.innerHTML = `${winnerChar?.emoji || ''} <span style="color: ${winnerId === 0 ? '#2ecc71' : '#e67e22'}">${winnerName}</span> eliminou <span style="color: ${loserId === 0 ? '#2ecc71' : '#e67e22'}">${loserName}</span>`;
        }

        feed.appendChild(entry);

        setTimeout(() => entry.remove(), 3500);
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.backgroundManager.draw(this.ctx, this.camera);

        this.ctx.save();
        this.ctx.translate(this.camera.offsetX, this.camera.offsetY);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        this.drawIsland();
        this.drawWalls();

        // Boomerangs
        this.players.forEach(p => {
            if (p.hero?.thrownProjectile) {
                p.hero.drawBoomerang(this.ctx);
            }
            // Omega beams
            if (p.hero?.omegaBeams) {
                p.hero.drawOmegaBeams(this.ctx);
            }
        });

        this.players.forEach(p => p.draw(this.ctx));
        this.bulletManager.draw(this.ctx);
        Particles.draw(this.ctx);

        this.ctx.restore();
    },

    drawWalls() {
        const ctx = this.ctx;

        this.walls.forEach(wall => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(wall.x + 5, wall.y + 5, wall.width, wall.height);

            const brickGrad = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.width, wall.y);
            brickGrad.addColorStop(0, '#8b4513');
            brickGrad.addColorStop(0.5, '#a0522d');
            brickGrad.addColorStop(1, '#8b4513');
            ctx.fillStyle = brickGrad;
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

            ctx.fillStyle = '#6b3510';
            const brickH = 20;
            for (let y = wall.y; y < wall.y + wall.height; y += brickH) {
                ctx.fillRect(wall.x, y, wall.width, 2);
                const offset = ((y - wall.y) / brickH) % 2 === 0 ? wall.width / 2 : 0;
                if (offset > 0) {
                    ctx.fillRect(wall.x + offset - 1, y, 2, brickH);
                }
            }

            ctx.fillStyle = '#654321';
            ctx.fillRect(wall.x - 5, wall.y - 10, wall.width + 10, 15);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(wall.x, wall.y, 5, wall.height);
        });
    },

    drawIsland() {
        const ctx = this.ctx;
        const island = this.island;

        // Sombras
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(
            island.x + island.width / 2,
            this.canvas.height, // Mais baixo
            island.width / 2 + 100,
            100,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Prédio Base (Concreto)
        const buildingGrad = ctx.createLinearGradient(island.x, island.y, island.x + island.width, island.y);
        buildingGrad.addColorStop(0, '#2c3e50');
        buildingGrad.addColorStop(0.5, '#34495e');
        buildingGrad.addColorStop(1, '#2c3e50');
        ctx.fillStyle = buildingGrad;
        ctx.fillRect(island.x, island.y, island.width, island.height + 200);

        // Detalhes de concreto
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(island.x + 20, island.y + 50, island.width - 40, island.height);

        // Borda superior (telhado)
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(island.x - 10, island.y, island.width + 20, 20);
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(island.x - 10, island.y + 20, island.width + 20, 10);

        // Props do telhado
        // Caixa de ar condicionado
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(island.x + 100, island.y - 40, 60, 40);
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(island.x + 105, island.y - 35, 50, 30); // grade
        for(let i=0; i<5; i++) {
             ctx.fillRect(island.x + 110 + i*10, island.y - 35, 2, 30);
        }

        // Antena
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(island.x + island.width - 150, island.y);
        ctx.lineTo(island.x + island.width - 150, island.y - 120);
        ctx.stroke();
        // Prato da antena
        ctx.beginPath();
        ctx.arc(island.x + island.width - 150, island.y - 120, 20, 0, Math.PI, true);
        ctx.stroke();

        // Exaustor
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(island.x + island.width/2, island.y - 15, 25, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#34495e'; // buraco
        ctx.beginPath();
        ctx.arc(island.x + island.width/2, island.y - 15, 18, Math.PI, 0);
        ctx.fill();

        // Janelas do prédio principal (estáticas)
        ctx.fillStyle = '#f1c40f'; // luz amarela
        ctx.globalAlpha = 0.8;
        if (island.windows) {
            island.windows.forEach(w => {
                ctx.fillRect(w.x, w.y, w.w, w.h);
            });
        }
        ctx.globalAlpha = 1;
    },

    gameLoop() {
        if (this.state !== 'PLAYING') return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    },

    menuLoop() {
        if (this.state !== 'MENU' && this.state !== 'GAMEOVER') return;

        this.backgroundManager.update();
        this.backgroundManager.draw(this.ctx, this.camera);

        // Simples chão para o menu
        const ctx = this.ctx;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 10);

        requestAnimationFrame(() => this.menuLoop());
    }
};
