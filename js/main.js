/**
 * MAIN.JS - Ponto de entrada do jogo
 */

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // FORÇAR esconder preloader após 2 segundos
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            preloader.style.display = 'none';
        }
    }, 2000);

    // Inicializar sistema de áudio
    try {
        Audio.init();
    } catch (e) {
        console.log('Audio init deferred');
    }

    // Carregar configurações salvas
    try {
        Game.loadSettings();
    } catch (e) {
        console.log('Settings not loaded');
    }

    // Inicializar jogo
    Game.init();

    console.log('%c🎯 ROOFTOP SNIPERS - SMASH EDITION',
        'color: #ff4757; font-size: 24px; font-weight: bold;');
});

// Prevenir menu de contexto apenas durante jogo
document.addEventListener('contextmenu', (e) => {
    if (Game && Game.state === 'PLAYING') {
        e.preventDefault();
    }
});

// Touch support
document.addEventListener('touchstart', (e) => {
    try { Audio.init(); } catch (er) { }

    if (Game && Game.state === 'PLAYING') {
        const touch = e.touches[0];
        Game.mouse.x = touch.clientX;
        Game.mouse.y = touch.clientY;

        if (Game.players && Game.players[0]) {
            const bulletData = Game.players[0].shoot();
            if (bulletData) {
                Game.bulletManager.add(bulletData);
                Game.camera.shake = 8;
            }
        }
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (Game && Game.state === 'PLAYING') {
        const touch = e.touches[0];
        Game.mouse.x = touch.clientX;
        Game.mouse.y = touch.clientY;
    }
}, { passive: true });

// Gamepad (básico)
let gamepadIndex = null;

window.addEventListener('gamepadconnected', (e) => {
    gamepadIndex = e.gamepad.index;
    console.log('🎮 Gamepad conectado:', e.gamepad.id);
});

window.addEventListener('gamepaddisconnected', () => {
    gamepadIndex = null;
});

function pollGamepad() {
    if (gamepadIndex === null || !Game) {
        requestAnimationFrame(pollGamepad);
        return;
    }

    const gamepad = navigator.getGamepads()[gamepadIndex];
    if (!gamepad) {
        requestAnimationFrame(pollGamepad);
        return;
    }

    if (Game.state === 'PLAYING' && Game.players && Game.players[0]) {
        const deadzone = 0.2;
        const axisX = gamepad.axes[0];

        Game.keys['KeyA'] = axisX < -deadzone;
        Game.keys['KeyD'] = axisX > deadzone;

        if (gamepad.buttons[0].pressed) {
            Game.players[0].startJump();
        }

        if (gamepad.buttons[2].pressed || gamepad.buttons[7].pressed) {
            const bulletData = Game.players[0].shoot();
            if (bulletData) {
                Game.bulletManager.add(bulletData);
                Game.camera.shake = 8;
            }
        }
    }

    requestAnimationFrame(pollGamepad);
}

pollGamepad();
