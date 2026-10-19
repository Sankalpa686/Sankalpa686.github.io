/**
 * Arrow Escape - Interactive Web Canvas Simulator
 * Developed for Sankalpa AppWorks / Sankalpa Mahapatra
 * Mechanics matching the Android Kotlin & Jetpack Compose engine
 */

class ArrowPuzzleSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.currentLevelIndex = 0;
        this.moves = 0;
        this.showProjectionLines = true;
        this.soundEnabled = true;
        this.audioCtx = null;
        
        this.particles = [];
        this.hintArrowId = null;
        this.blockingFlashId = null;
        this.isLevelCompleted = false;
        
        // Define handcrafted solvable levels
        this.levels = [
            {
                name: "Level 1: The Gateway",
                gridSize: 5,
                arrows: [
                    { id: 1, dir: 'UP', cells: [{x: 1, y: 3}, {x: 1, y: 2}], color: '#00f0ff' },
                    { id: 2, dir: 'RIGHT', cells: [{x: 2, y: 1}, {x: 3, y: 1}], color: '#ff0077' },
                    { id: 3, dir: 'DOWN', cells: [{x: 3, y: 2}, {x: 3, y: 3}], color: '#10b981' }
                ]
            },
            {
                name: "Level 2: Crossfire Matrix",
                gridSize: 5,
                arrows: [
                    { id: 1, dir: 'UP', cells: [{x: 1, y: 2}, {x: 1, y: 1}], color: '#00f0ff' },
                    { id: 2, dir: 'RIGHT', cells: [{x: 0, y: 3}, {x: 1, y: 3}], color: '#a855f7' },
                    { id: 3, dir: 'LEFT', cells: [{x: 4, y: 2}, {x: 3, y: 2}], color: '#f59e0b' },
                    { id: 4, dir: 'DOWN', cells: [{x: 3, y: 0}, {x: 3, y: 1}], color: '#ff0077' },
                    { id: 5, dir: 'RIGHT', cells: [{x: 2, y: 4}, {x: 3, y: 4}], color: '#10b981' }
                ]
            },
            {
                name: "Level 3: Interlocking Lattice",
                gridSize: 6,
                arrows: [
                    { id: 1, dir: 'UP', cells: [{x: 2, y: 3}, {x: 2, y: 2}], color: '#00f0ff' },
                    { id: 2, dir: 'RIGHT', cells: [{x: 1, y: 1}, {x: 2, y: 1}], color: '#ff0077' },
                    { id: 3, dir: 'DOWN', cells: [{x: 4, y: 1}, {x: 4, y: 2}, {x: 4, y: 3}], color: '#f59e0b' },
                    { id: 4, dir: 'LEFT', cells: [{x: 4, y: 4}, {x: 3, y: 4}], color: '#10b981' },
                    { id: 5, dir: 'UP', cells: [{x: 1, y: 4}, {x: 1, y: 3}], color: '#ec4899' },
                    { id: 6, dir: 'LEFT', cells: [{x: 3, y: 0}, {x: 2, y: 0}], color: '#38bdf8' },
                    { id: 7, dir: 'RIGHT', cells: [{x: 0, y: 2}, {x: 1, y: 2}], color: '#a855f7' }
                ]
            },
            {
                name: "Level 4: Topological Circuit",
                gridSize: 6,
                arrows: [
                    { id: 1, dir: 'RIGHT', cells: [{x: 0, y: 1}, {x: 1, y: 1}], color: '#00f0ff' },
                    { id: 2, dir: 'DOWN', cells: [{x: 2, y: 0}, {x: 2, y: 1}], color: '#ff0077' },
                    { id: 3, dir: 'LEFT', cells: [{x: 5, y: 2}, {x: 4, y: 2}], color: '#10b981' },
                    { id: 4, dir: 'UP', cells: [{x: 3, y: 3}, {x: 3, y: 2}], color: '#f59e0b' },
                    { id: 5, dir: 'RIGHT', cells: [{x: 1, y: 3}, {x: 2, y: 3}], color: '#a855f7' },
                    { id: 6, dir: 'DOWN', cells: [{x: 4, y: 3}, {x: 4, y: 4}], color: '#ec4899' },
                    { id: 7, dir: 'LEFT', cells: [{x: 3, y: 5}, {x: 2, y: 5}], color: '#06b6d4' },
                    { id: 8, dir: 'UP', cells: [{x: 5, y: 4}, {x: 5, y: 3}], color: '#eab308' }
                ]
            }
        ];

        this.initCanvasSize();
        window.addEventListener('resize', () => this.initCanvasSize());
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleClick(mouseEvent);
        }, { passive: false });

        this.loadLevel(0);
        this.startLoop();
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        try {
            this.initAudio();
            if (!this.audioCtx || this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            const ctx = this.audioCtx;
            const now = ctx.currentTime;
            
            if (type === 'escape') {
                // Bright high-frequency arpeggio
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'blocked') {
                // Low thud buzzer
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.18);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'win') {
                // Triumph chords
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(0.18, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + 0.65);
                });
            }
        } catch (e) {
            // Audio policy fallback
        }
    }

    initCanvasSize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width - 40, 480);
        const dpr = window.devicePixelRatio || 1;
        this.displaySize = Math.max(size, 300);
        
        this.canvas.width = this.displaySize * dpr;
        this.canvas.height = this.displaySize * dpr;
        this.canvas.style.width = `${this.displaySize}px`;
        this.canvas.style.height = `${this.displaySize}px`;
        this.ctx.scale(dpr, dpr);
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        const levelData = this.levels[index];
        this.gridSize = levelData.gridSize;
        this.moves = 0;
        this.hintArrowId = null;
        this.blockingFlashId = null;
        this.isLevelCompleted = false;

        // Clone arrows with animation state
        this.arrows = levelData.arrows.map(a => ({
            ...a,
            cells: a.cells.map(c => ({...c})),
            state: 'ACTIVE',
            exitProgress: 0,
            shakeProgress: 0,
            shakeX: 0,
            shakeY: 0
        }));

        this.updateStatsUI();
        const levelTitle = document.getElementById('simLevelTitle');
        if (levelTitle) levelTitle.textContent = levelData.name;
    }

    resetLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    nextLevel() {
        const next = (this.currentLevelIndex + 1) % this.levels.length;
        this.loadLevel(next);
    }

    toggleProjection() {
        this.showProjectionLines = !this.showProjectionLines;
        return this.showProjectionLines;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    getHint() {
        if (this.isLevelCompleted) return;
        const activeArrows = this.arrows.filter(a => a.state === 'ACTIVE');
        for (const arrow of activeArrows) {
            if (this.isPathClear(arrow)) {
                this.hintArrowId = arrow.id;
                this.playSound('escape');
                return arrow.id;
            }
        }
        return null;
    }

    isPathClear(arrow) {
        const head = arrow.cells[arrow.cells.length - 1];
        let dx = 0, dy = 0;
        if (arrow.dir === 'UP') dy = -1;
        else if (arrow.dir === 'DOWN') dy = 1;
        else if (arrow.dir === 'LEFT') dx = -1;
        else if (arrow.dir === 'RIGHT') dx = 1;

        let checkX = head.x + dx;
        let checkY = head.y + dy;

        while (checkX >= 0 && checkX < this.gridSize && checkY >= 0 && checkY < this.gridSize) {
            // Check if any other active arrow occupies (checkX, checkY)
            for (const other of this.arrows) {
                if (other.state === 'ACTIVE' && other.id !== arrow.id) {
                    for (const cell of other.cells) {
                        if (cell.x === checkX && cell.y === checkY) {
                            return false;
                        }
                    }
                }
            }
            checkX += dx;
            checkY += dy;
        }
        return true;
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const cellSize = this.displaySize / this.gridSize;

        // Find which arrow was tapped
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];
            if (arrow.state !== 'ACTIVE') continue;

            const isHit = arrow.cells.some(cell => {
                const cx = cell.x * cellSize + cellSize / 2;
                const cy = cell.y * cellSize + cellSize / 2;
                const dist = Math.hypot(clickX - cx, clickY - cy);
                return dist < cellSize * 0.45;
            });

            if (isHit) {
                this.moves++;
                this.hintArrowId = null;

                if (this.isPathClear(arrow)) {
                    // Escape!
                    arrow.state = 'ESCAPING';
                    this.playSound('escape');
                    this.spawnParticles(arrow, cellSize);
                } else {
                    // Blocked!
                    arrow.shakeProgress = 1.0;
                    this.blockingFlashId = arrow.id;
                    this.playSound('blocked');
                    setTimeout(() => { this.blockingFlashId = null; }, 400);
                }

                this.updateStatsUI();
                break;
            }
        }
    }

    spawnParticles(arrow, cellSize) {
        const head = arrow.cells[arrow.cells.length - 1];
        const hx = head.x * cellSize + cellSize / 2;
        const hy = head.y * cellSize + cellSize / 2;
        
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: hx,
                y: hy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: arrow.color,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.02,
                size: 3 + Math.random() * 3
            });
        }
    }

    updateStatsUI() {
        const movesEl = document.getElementById('simMovesCount');
        const remainingEl = document.getElementById('simRemainingCount');
        if (movesEl) movesEl.textContent = this.moves;
        
        const activeCount = this.arrows.filter(a => a.state === 'ACTIVE' || a.state === 'ESCAPING').length;
        if (remainingEl) remainingEl.textContent = activeCount;
    }

    startLoop() {
        const loop = () => {
            this.update();
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update() {
        const dt = 0.03;
        let allEscaped = true;

        this.arrows.forEach(arrow => {
            if (arrow.state === 'ESCAPING') {
                arrow.exitProgress += dt * 3.5;
                if (arrow.exitProgress >= 1.5) {
                    arrow.state = 'ESCAPED';
                }
            }
            if (arrow.state === 'ACTIVE') {
                allEscaped = false;
            }
            if (arrow.shakeProgress > 0) {
                arrow.shakeProgress -= dt * 2.5;
                if (arrow.shakeProgress < 0) arrow.shakeProgress = 0;
                arrow.shakeX = Math.sin(arrow.shakeProgress * Math.PI * 8) * (arrow.shakeProgress * 8);
            } else {
                arrow.shakeX = 0;
            }
        });

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Check level win
        if (allEscaped && !this.isLevelCompleted) {
            this.isLevelCompleted = true;
            this.playSound('win');
            setTimeout(() => {
                const banner = document.getElementById('simWinBanner');
                if (banner) banner.style.display = 'flex';
            }, 300);
        }
    }

    render() {
        const ctx = this.ctx;
        const size = this.displaySize;
        const cellSize = size / this.gridSize;

        ctx.clearRect(0, 0, size, size);

        // 1. Draw Grid Points / Pins
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const px = c * cellSize + cellSize / 2;
                const py = r * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 2. Draw Projection Guidelines if enabled
        if (this.showProjectionLines) {
            this.arrows.forEach(arrow => {
                if (arrow.state !== 'ACTIVE') return;
                const head = arrow.cells[arrow.cells.length - 1];
                const hx = head.x * cellSize + cellSize / 2;
                const hy = head.y * cellSize + cellSize / 2;

                ctx.strokeStyle = `${arrow.color}25`;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);

                ctx.beginPath();
                ctx.moveTo(hx, hy);
                if (arrow.dir === 'UP') ctx.lineTo(hx, 0);
                else if (arrow.dir === 'DOWN') ctx.lineTo(hx, size);
                else if (arrow.dir === 'LEFT') ctx.lineTo(0, hy);
                else if (arrow.dir === 'RIGHT') ctx.lineTo(size, hy);
                ctx.stroke();
                ctx.setLineDash([]);
            });
        }

        // 3. Draw Arrows
        this.arrows.forEach(arrow => {
            if (arrow.state === 'ESCAPED') return;

            let offsetX = arrow.shakeX;
            let offsetY = 0;

            if (arrow.state === 'ESCAPING') {
                const dist = arrow.exitProgress * size;
                if (arrow.dir === 'UP') offsetY -= dist;
                else if (arrow.dir === 'DOWN') offsetY += dist;
                else if (arrow.dir === 'LEFT') offsetX -= dist;
                else if (arrow.dir === 'RIGHT') offsetX += dist;
            }

            this.drawArrowBody(ctx, arrow, cellSize, offsetX, offsetY);
        });

        // 4. Render Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    drawArrowBody(ctx, arrow, cellSize, offsetX, offsetY) {
        const cells = arrow.cells;
        if (cells.length < 2) return;

        const isHinted = arrow.id === this.hintArrowId;
        const isFlashBlocked = arrow.id === this.blockingFlashId;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Glowing shadow
        ctx.shadowColor = isFlashBlocked ? '#ef4444' : arrow.color;
        ctx.shadowBlur = isHinted ? 25 : (isFlashBlocked ? 20 : 12);

        // Draw body line connecting points
        ctx.strokeStyle = isFlashBlocked ? '#ef4444' : arrow.color;
        ctx.lineWidth = cellSize * 0.28;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        cells.forEach((cell, idx) => {
            const px = cell.x * cellSize + cellSize / 2;
            const py = cell.y * cellSize + cellSize / 2;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Draw Arrowhead on the last cell
        const head = cells[cells.length - 1];
        const hx = head.x * cellSize + cellSize / 2;
        const hy = head.y * cellSize + cellSize / 2;

        ctx.fillStyle = isFlashBlocked ? '#ef4444' : arrow.color;
        ctx.beginPath();

        const arrowHeadLen = cellSize * 0.42;
        const arrowHeadHalfWidth = cellSize * 0.32;

        if (arrow.dir === 'UP') {
            ctx.moveTo(hx, hy - arrowHeadLen);
            ctx.lineTo(hx - arrowHeadHalfWidth, hy + arrowHeadLen * 0.3);
            ctx.lineTo(hx + arrowHeadHalfWidth, hy + arrowHeadLen * 0.3);
        } else if (arrow.dir === 'DOWN') {
            ctx.moveTo(hx, hy + arrowHeadLen);
            ctx.lineTo(hx - arrowHeadHalfWidth, hy - arrowHeadLen * 0.3);
            ctx.lineTo(hx + arrowHeadHalfWidth, hy - arrowHeadLen * 0.3);
        } else if (arrow.dir === 'LEFT') {
            ctx.moveTo(hx - arrowHeadLen, hy);
            ctx.lineTo(hx + arrowHeadLen * 0.3, hy - arrowHeadHalfWidth);
            ctx.lineTo(hx + arrowHeadLen * 0.3, hy + arrowHeadHalfWidth);
        } else if (arrow.dir === 'RIGHT') {
            ctx.moveTo(hx + arrowHeadLen, hy);
            ctx.lineTo(hx - arrowHeadLen * 0.3, hy - arrowHeadHalfWidth);
            ctx.lineTo(hx - arrowHeadLen * 0.3, hy + arrowHeadHalfWidth);
        }
        ctx.closePath();
        ctx.fill();

        // Pulsing hint circle if hinted
        if (isHinted) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(hx, hy, cellSize * 0.55, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }
}

// Global initialization
window.ArrowPuzzleSimulator = ArrowPuzzleSimulator;
