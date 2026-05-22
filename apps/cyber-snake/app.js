export async function launch(ctx, options = {}) {
  const { windowManager } = ctx;
  const { IconHelper, showSystemDialog } = window.osAPI;

  const content = document.createElement('div');
  content.tabIndex = 0;
  content.style.cssText = `
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #020204;
    color: #e2e8f0;
    font-family: var(--font-main, 'Inter', sans-serif);
    user-select: none;
    position: relative;
    overflow: hidden;
    outline: none;
  `;
  content.addEventListener('click', () => content.focus());
  setTimeout(() => content.focus(), 100);

  content.innerHTML = `
    <!-- Top Neon Header -->
    <div style="
      height: 50px;
      background: #0b0b10;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
    ">
      <h3 style="margin: 0; font-size: 15px; color: #fff; letter-spacing: 0.5px;">🐍 Cyber Snake</h3>
      <!-- Controls & Sound -->
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="snake-sound" style="
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
        ">
          🔊 Sound: ON
        </button>
      </div>
    </div>

    <!-- Main Game Port -->
    <div style="
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    ">
      <canvas id="snake-canvas" style="display: block; box-shadow: 0 0 40px rgba(0, 240, 255, 0.15); border-radius: 8px; background: #030305; border: 1px solid #1a1a24;"></canvas>
    </div>

    <!-- Scanline Overlay Effect -->
    <div style="
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
      background-size: 100% 4px;
      z-index: 10;
      opacity: 0.12;
    "></div>
  `;

  // Init window
  const win = windowManager.createWindow({
    id: 'cyber-snake',
    title: 'Cyber Snake',
    icon: 'application',
    width: 480,
    height: 560,
    content
  });

  const canvas = content.querySelector('#snake-canvas');
  const soundBtn = content.querySelector('#snake-sound');

  // Sound System (Web Audio Synth)
  let soundEnabled = true;
  let audioCtx = null;

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'coin') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'pause') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(500, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.5);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      }
    } catch (e) {}
  };

  soundBtn.onclick = () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    soundBtn.style.color = soundEnabled ? '#fff' : '#ff5555';
    soundBtn.style.borderColor = soundEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,50,50,0.3)';
  };

  // Keyboard Listeners
  let keys = {};
  const onKeyDown = (e) => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'p'].includes(e.key)) {
      e.preventDefault();
    }
  };
  const onKeyUp = (e) => {
    keys[e.key] = false;
  };

  content.addEventListener('keydown', onKeyDown);
  content.addEventListener('keyup', onKeyUp);

  win.onClose = () => {
    content.removeEventListener('keydown', onKeyDown);
    content.removeEventListener('keyup', onKeyUp);
    if (gameInterval) clearInterval(gameInterval);
  };

  // Cyber Snake game logic
  let snake = [];
  let food = {};
  let direction = 'right';
  let nextDirection = 'right';
  let lastMovedDirection = 'right';
  let score = 0;
  let gameOver = false;
  let isPaused = false;
  let snakeSpeed = 120;
  let gameInterval = null;

  const initSnake = () => {
    canvas.width = 400;
    canvas.height = 400;
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    lastMovedDirection = 'right';
    score = 0;
    gameOver = false;
    isPaused = false;
    spawnFood();
  };

  const spawnFood = () => {
    const cols = canvas.width / 20;
    const rows = canvas.height / 20;
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
    if (snake.some(cell => cell.x === food.x && cell.y === food.y)) {
      spawnFood();
    }
  };

  const updateSnake = () => {
    if (gameOver) {
      if (keys[' ']) {
        keys[' '] = false;
        initSnake();
      }
      return;
    }

    if (keys['p'] || keys['P']) {
      keys['p'] = keys['P'] = false;
      isPaused = !isPaused;
      playSound('pause');
      return;
    }

    if (isPaused) return;

    if ((keys['ArrowUp'] || keys['w']) && lastMovedDirection !== 'down') nextDirection = 'up';
    else if ((keys['ArrowDown'] || keys['s']) && lastMovedDirection !== 'up') nextDirection = 'down';
    else if ((keys['ArrowLeft'] || keys['a']) && lastMovedDirection !== 'right') nextDirection = 'left';
    else if ((keys['ArrowRight'] || keys['d']) && lastMovedDirection !== 'left') nextDirection = 'right';

    direction = nextDirection;

    const head = { ...snake[0] };
    if (direction === 'up') head.y--;
    else if (direction === 'down') head.y++;
    else if (direction === 'left') head.x--;
    else if (direction === 'right') head.x++;

    lastMovedDirection = direction;

    const cols = canvas.width / 20;
    const rows = canvas.height / 20;
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      gameOver = true;
      playSound('gameover');
      return;
    }

    if (snake.some(cell => cell.x === head.x && cell.y === head.y)) {
      gameOver = true;
      playSound('gameover');
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      playSound('coin');
      spawnFood();
    } else {
      snake.pop();
    }
  };

  const drawSnake = () => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = '#111116';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw food (Neon magenta circle)
    ctx.fillStyle = '#ff007f';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff007f';
    ctx.beginPath();
    ctx.arc(food.x * 20 + 10, food.y * 20 + 10, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Snake (Neon cyan body)
    snake.forEach((cell, idx) => {
      ctx.fillStyle = idx === 0 ? '#00f0ff' : '#00a3ff';
      ctx.shadowBlur = idx === 0 ? 10 : 0;
      ctx.shadowColor = '#00f0ff';
      ctx.fillRect(cell.x * 20 + 2, cell.y * 20 + 2, 16, 16);
    });

    ctx.shadowBlur = 0; // Reset

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`SCORE: ${score}`, 16, 24);

    if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#aaa';
      ctx.font = '12px monospace';
      ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 35);
      ctx.textAlign = 'left';
    }
  };

  // Start loop
  initSnake();
  gameInterval = setInterval(() => {
    updateSnake();
    drawSnake();
  }, snakeSpeed);
}
