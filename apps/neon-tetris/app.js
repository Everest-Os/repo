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
      <h3 style="margin: 0; font-size: 15px; color: #fff; letter-spacing: 0.5px;">🧱 Neon Tetris</h3>
      <!-- Sound Toggle -->
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="tetris-sound" style="
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
      <canvas id="tetris-canvas" style="display: block; box-shadow: 0 0 40px rgba(168, 85, 247, 0.15); border-radius: 8px; background: #030305; border: 1px solid #1a1a24;"></canvas>
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
    id: 'neon-tetris',
    title: 'Neon Tetris',
    icon: 'application',
    width: 400,
    height: 600,
    content
  });

  const canvas = content.querySelector('#tetris-canvas');
  const soundBtn = content.querySelector('#tetris-sound');

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
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'pause') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(550, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.6);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
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

  // Tetris logic
  let grid = [];
  let currentPiece = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let gameOver = false;
  let isPaused = false;
  let gameInterval = null;

  const SHAPES = {
    I: [[1, 1, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    T: [[0, 1, 0], [1, 1, 1]],
    Z: [[1, 1, 0], [0, 1, 1]]
  };

  const COLORS = {
    I: '#00f0ff', J: '#3b82f6', L: '#f59e0b', O: '#eab308', S: '#22c55e', T: '#a855f7', Z: '#ef4444'
  };

  const initTetris = () => {
    canvas.width = 300;
    canvas.height = 500;
    grid = Array(20).fill().map(() => Array(10).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    spawnPiece();
  };

  const spawnPiece = () => {
    const keysList = Object.keys(SHAPES);
    const shapeKey = keysList[Math.floor(Math.random() * keysList.length)];
    currentPiece = {
      shape: SHAPES[shapeKey],
      color: COLORS[shapeKey],
      x: 3,
      y: 0
    };
    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
      gameOver = true;
      playSound('gameover');
    }
  };

  const checkCollision = (ax, ay, shape) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = ax + c;
          const newY = ay + r;
          if (newX < 0 || newX >= 10 || newY >= 20) return true;
          if (newY >= 0 && grid[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  const mergePiece = () => {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const gy = currentPiece.y + r;
          const gx = currentPiece.x + c;
          if (gy >= 0) grid[gy][gx] = currentPiece.color;
        }
      }
    }
    clearLines();
    spawnPiece();
  };

  const clearLines = () => {
    let cleared = 0;
    for (let y = 19; y >= 0; y--) {
      if (grid[y].every(cell => cell !== 0)) {
        grid.splice(y, 1);
        grid.unshift(Array(10).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared > 0) {
      const scores = [0, 40, 100, 300, 1200];
      score += scores[cleared] * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      playSound('coin');
    }
  };

  const rotatePiece = () => {
    const s = currentPiece.shape;
    const n = s.length;
    const m = s[0].length;
    const rotated = Array(m).fill().map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        rotated[c][n - 1 - r] = s[r][c];
      }
    }
    if (!checkCollision(currentPiece.x, currentPiece.y, rotated)) {
      currentPiece.shape = rotated;
    }
  };

  const dropPiece = () => {
    if (gameOver || isPaused) return;
    currentPiece.y++;
    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
      currentPiece.y--;
      mergePiece();
    }
  };

  const updateTetris = () => {
    if (gameOver) {
      if (keys[' ']) {
        keys[' '] = false;
        initTetris();
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

    if (keys['ArrowLeft'] || keys['a']) {
      keys['ArrowLeft'] = keys['a'] = false;
      currentPiece.x--;
      if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) currentPiece.x++;
    }
    if (keys['ArrowRight'] || keys['d']) {
      keys['ArrowRight'] = keys['d'] = false;
      currentPiece.x++;
      if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) currentPiece.x--;
    }
    if (keys['ArrowUp'] || keys['w']) {
      keys['ArrowUp'] = keys['w'] = false;
      rotatePiece();
    }
    if (keys['ArrowDown'] || keys['s']) {
      dropPiece();
    }
  };

  const getGhostY = () => {
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece.x, ghostY + 1, currentPiece.shape)) {
      ghostY++;
    }
    return ghostY;
  };

  const drawTetris = () => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bSize = 25;
    const cols = 10;
    const rows = 20;

    // Grid lines subtle
    ctx.strokeStyle = '#111116';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * bSize, 0); ctx.lineTo(c * bSize, rows * bSize); ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * bSize); ctx.lineTo(cols * bSize, r * bSize); ctx.stroke();
    }

    // Draw grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]) {
          ctx.fillStyle = grid[r][c];
          ctx.fillRect(c * bSize + 1, r * bSize + 1, bSize - 2, bSize - 2);
        }
      }
    }

    // Draw piece & ghost
    if (currentPiece && !gameOver) {
      // Ghost
      const ghostY = getGhostY();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            ctx.strokeRect((currentPiece.x + c) * bSize + 2, (ghostY + r) * bSize + 2, bSize - 4, bSize - 4);
          }
        }
      }

      // Active
      ctx.fillStyle = currentPiece.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = currentPiece.color;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            ctx.fillRect((currentPiece.x + c) * bSize + 1, (currentPiece.y + r) * bSize + 1, bSize - 2, bSize - 2);
          }
        }
      }
      ctx.shadowBlur = 0;
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`SCORE: ${score}`, 10, 20);
    ctx.fillText(`LEVEL: ${level}`, 10, 36);

    if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 35);
      ctx.textAlign = 'left';
    }
  };

  // Start Loop
  initTetris();
  let dropTimer = 0;
  gameInterval = setInterval(() => {
    updateTetris();
    dropTimer += 30;
    if (dropTimer >= 1000 - (level * 80)) {
      dropPiece();
      dropTimer = 0;
    }
    drawTetris();
  }, 30);
}
