class BackgroundManager {
    constructor() {
        this.buildings = [];
        this.clouds = [];
        this.stars = [];
        this.rain = [];
        this.weather = 'rain'; // 'clear', 'rain', 'snow'
        this.time = 0;
        this.width = 0;
        this.height = 0;
    }

    init(width, height) {
        this.width = width;
        this.height = height;
        this.generateCity();
        this.generateClouds();
        this.generateStars();
        this.generateRain();
    }

    generateCity() {
        this.buildings = [];
        // Camada de fundo (mais escura, move devagar)
        this.generateBuildingLayer(50, '#0f1020', 0.2, 150, 400);
        // Camada média
        this.generateBuildingLayer(30, '#1a1a2e', 0.5, 100, 300);
        // Camada frontal (mais clara)
        this.generateBuildingLayer(20, '#252540', 0.8, 80, 200);
    }

    generateBuildingLayer(count, color, parallaxFactor, minWidth, maxHeight) {
        let x = -500;
        for (let i = 0; i < count; i++) {
            const w = minWidth + Math.random() * 100;
            const h = 100 + Math.random() * maxHeight;
            const windows = [];

            // Gerar janelas
            const rows = Math.floor(h / 20);
            const cols = Math.floor(w / 15);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.6) { // 40% chance de janela acesa
                        windows.push({
                            x: c * 15 + 5,
                            y: r * 20 + 5,
                            w: 8,
                            h: 12,
                            on: true,
                            flicker: Math.random() > 0.95
                        });
                    }
                }
            }

            this.buildings.push({
                x: x,
                y: this.height, // Base no fundo
                w: w,
                h: h,
                color: color,
                parallax: parallaxFactor,
                windows: windows,
                antenna: Math.random() > 0.7
            });

            x += w - (Math.random() * 20); // Sobreposição leve
        }
    }

    generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 15; i++) {
            this.clouds.push({
                x: Math.random() * this.width * 2 - this.width,
                y: Math.random() * (this.height / 3),
                w: 80 + Math.random() * 120,
                speed: 0.2 + Math.random() * 0.5,
                opacity: 0.1 + Math.random() * 0.2
            });
        }
    }

    generateStars() {
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.6,
                size: Math.random() * 2,
                twinkleSpeed: 0.05 + Math.random() * 0.1,
                offset: Math.random() * Math.PI * 2
            });
        }
    }

    generateRain() {
        this.rain = [];
        for (let i = 0; i < 200; i++) {
            this.rain.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                len: 10 + Math.random() * 10,
                speed: 10 + Math.random() * 10
            });
        }
    }

    update() {
        this.time++;

        // Nuvens
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > this.width + 200) c.x = -200;
        });

        // Chuva
        if (this.weather === 'rain') {
            this.rain.forEach(r => {
                r.y += r.speed;
                r.x -= 2; // Vento
                if (r.y > this.height) {
                    r.y = -20;
                    r.x = Math.random() * this.width + 200; // Recicla e compensa vento
                }
            });
        }
    }

    draw(ctx, camera) {
        // Céu Gradiente
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(1, '#202040');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Estrelas (fixas em relação à câmera ou parallax muito lento)
        ctx.save();
        ctx.fillStyle = '#ffffff';
        this.stars.forEach(s => {
            const alpha = 0.5 + Math.sin(this.time * s.twinkleSpeed + s.offset) * 0.5;
            ctx.globalAlpha = alpha;
            // Parallax leve nas estrelas
            const px = (s.x - camera.offsetX * 0.05) % this.width;
            const py = s.y;
            // Wrap around
            const drawX = px < 0 ? px + this.width : px;

            ctx.beginPath();
            ctx.arc(drawX, py, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Lua
        ctx.save();
        const moonX = this.width - 150 - camera.offsetX * 0.02;
        const moonY = 100 - camera.offsetY * 0.02;
        ctx.shadowColor = '#ffffcc';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#ffffdd';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Crateras
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
        ctx.beginPath(); ctx.arc(moonX - 10, moonY + 10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(moonX + 15, moonY - 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Nuvens (camada fundo)
        this.drawClouds(ctx, camera, 0.1);

        // Cidade Parallax
        this.drawCity(ctx, camera);

        // Nuvens (camada frente)
        this.drawClouds(ctx, camera, 0.3);

        // Chuva (sobre tudo, mas atrás da UI)
        if (this.weather === 'rain') {
            this.drawRain(ctx, camera);
        }
    }

    drawCity(ctx, camera) {
        this.buildings.forEach(b => {
            const parallaxX = (b.x - camera.offsetX * b.parallax);
            const y = this.height - b.h - (camera.offsetY * b.parallax * 0.5); // Move verticalmente menos

            // Otimização: só desenhar se visível
            if (parallaxX + b.w < 0 || parallaxX > this.width) return;

            // Prédio
            ctx.fillStyle = b.color;
            ctx.fillRect(parallaxX, y, b.w, b.h + 500); // +500 pra garantir que vai até o fundo

            // Janelas
            ctx.fillStyle = '#ffffaa';
            b.windows.forEach(w => {
                if (w.on) {
                    if (w.flicker && Math.random() > 0.9) return; // Piscar
                    // Só desenha se dentro da tela
                    if (parallaxX + w.x > 0 && parallaxX + w.x < this.width) {
                        ctx.globalAlpha = 0.6 + Math.random() * 0.4;
                        ctx.fillRect(parallaxX + w.x, y + w.y, w.w, w.h);
                    }
                }
            });
            ctx.globalAlpha = 1;

            // Antena
            if (b.antenna) {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(parallaxX + b.w / 2, y);
                ctx.lineTo(parallaxX + b.w / 2, y - 30);
                ctx.stroke();
                // Luz vermelha na ponta
                if (Math.floor(this.time / 30) % 2 === 0) {
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(parallaxX + b.w / 2, y - 30, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
    }

    drawClouds(ctx, camera, parallaxBase) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.clouds.forEach(c => {
            const px = (c.x - camera.offsetX * parallaxBase) % (this.width + 400);
            const drawX = px < -200 ? px + this.width + 400 : px;

            ctx.globalAlpha = c.opacity;
            ctx.beginPath();
            ctx.arc(drawX, c.y, c.w / 2, 0, Math.PI * 2);
            ctx.arc(drawX + c.w * 0.4, c.y - 10, c.w / 2.5, 0, Math.PI * 2);
            ctx.arc(drawX + c.w * 0.8, c.y, c.w / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    drawRain(ctx, camera) {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.rain.forEach(r => {
            // Chuva cai na tela, independe da câmera (ou levemente afetada)
            const rx = (r.x - camera.offsetX * 1.2 + this.width) % this.width;
            const ry = (r.y - camera.offsetY * 1.2 + this.height) % this.height;

            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 2, ry + r.len);
        });
        ctx.stroke();
    }
}
