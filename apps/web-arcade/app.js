export async function launch(ctx, options = {}) {
  const { windowManager } = ctx;
  const { showSystemDialog } = window.osAPI;

  const content = document.createElement('div');
  content.style.cssText = `
    height: 100%;
    display: flex;
    background: #08080c;
    color: #e2e8f0;
    font-family: var(--font-main, 'Inter', sans-serif);
    user-select: none;
    overflow: hidden;
  `;

  content.innerHTML = `
    <!-- Arcade Sidebar -->
    <div style="
      width: 200px;
      background: rgba(13, 13, 20, 0.95);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding: 16px 0;
    ">
      <div style="
        padding: 0 20px 20px;
        font-weight: 800;
        font-size: 15px;
        color: #ff007f;
        text-shadow: 0 0 10px rgba(255, 0, 127, 0.4);
        letter-spacing: 1px;
      ">
        👾 WEB ARCADE
      </div>

      <div style="padding: 0 20px 8px; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
        Classics
      </div>
      <div class="arcade-menu-item active" data-game="pacman" style="
        padding: 10px 20px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        border-left: 3px solid #ff007f;
        background: rgba(255, 0, 127, 0.08);
        color: #fff;
        font-weight: 600;
      ">
        🍒 Pacman
      </div>
      <div class="arcade-menu-item" data-game="hextris" style="
        padding: 10px 20px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        border-left: 3px solid transparent;
        color: #94a3b8;
      ">
        🔷 Hextris
      </div>
      <div class="arcade-menu-item" data-game="play2048" style="
        padding: 10px 20px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        border-left: 3px solid transparent;
        color: #94a3b8;
      ">
        🔢 2048 Neon
      </div>
      <div class="arcade-menu-item" data-game="custom" style="
        padding: 10px 20px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        border-left: 3px solid transparent;
        color: #94a3b8;
      ">
        🌐 Custom URL
      </div>
    </div>

    <!-- Arcade Cabinet Screen -->
    <div style="
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #020204;
      position: relative;
    ">
      <!-- Top Header -->
      <div style="
        height: 50px;
        background: #0b0b10;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        padding: 0 24px;
        flex-shrink: 0;
      ">
        <h3 id="arcade-title" style="margin: 0; font-size: 14px; color: #fff; letter-spacing: 0.5px;">Pacman</h3>
      </div>

      <!-- Main Game Port -->
      <div style="
        flex: 1;
        position: relative;
        overflow: hidden;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <iframe id="arcade-iframe" style="width: 100%; height: 100%; border: none; background: #000;" src="https://platzh1d.github.io/pacman/"></iframe>

        <!-- Custom Prompt -->
        <div id="arcade-custom-prompt" style="
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #fff;
          z-index: 5;
        ">
          <div style="font-size: 14px; text-align: center; color: #94a3b8;">Enter web game URL to embed:</div>
          <div style="display: flex; gap: 8px; width: 340px;">
            <input type="text" id="arcade-custom-input" placeholder="https://..." style="
              flex: 1;
              background: #0f0f16;
              border: 1px solid rgba(255,255,255,0.1);
              color: #fff;
              padding: 8px 12px;
              border-radius: 6px;
              outline: none;
              font-size: 12px;
            ">
            <button id="arcade-custom-load" class="btn-primary" style="padding: 0 12px; height: 32px; font-size: 12px;">Load</button>
          </div>
        </div>
      </div>

      <!-- Scanline Overlay Effect -->
      <div style="
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%);
        background-size: 100% 4px;
        z-index: 10;
        opacity: 0.12;
      "></div>
    </div>

    <style>
      .arcade-menu-item:hover {
        background: rgba(255, 255, 255, 0.03);
        color: #fff;
      }
    </style>
  `;

  // Init window
  const win = windowManager.createWindow({
    id: 'web-arcade',
    title: 'Web Arcade',
    icon: 'video',
    width: 850,
    height: 580,
    content
  });

  const iframe = content.querySelector('#arcade-iframe');
  const customPrompt = content.querySelector('#arcade-custom-prompt');
  const titleDisplay = content.querySelector('#arcade-title');

  const selectGame = (gameId) => {
    iframe.style.display = 'none';
    customPrompt.style.display = 'none';

    content.querySelectorAll('.arcade-menu-item').forEach(item => {
      if (item.dataset.game === gameId) {
        item.classList.add('active');
        item.style.borderLeftColor = '#ff007f';
        item.style.background = 'rgba(255, 0, 127, 0.08)';
        item.style.color = '#fff';
        item.style.fontWeight = '600';
      } else {
        item.classList.remove('active');
        item.style.borderLeftColor = 'transparent';
        item.style.background = 'transparent';
        item.style.color = '#94a3b8';
        item.style.fontWeight = 'normal';
      }
    });

    if (gameId === 'pacman') {
      titleDisplay.textContent = 'Pacman';
      iframe.style.display = 'block';
      iframe.src = 'https://platzh1d.github.io/pacman/';
    } else if (gameId === 'hextris') {
      titleDisplay.textContent = 'Hextris';
      iframe.style.display = 'block';
      iframe.src = 'https://hextris.io/';
    } else if (gameId === 'play2048') {
      titleDisplay.textContent = '2048 Neon';
      iframe.style.display = 'block';
      iframe.src = 'https://play2048.co/';
    } else if (gameId === 'custom') {
      titleDisplay.textContent = 'Custom Web Game';
      customPrompt.style.display = 'flex';
    }
  };

  content.querySelector('#arcade-custom-load').onclick = () => {
    const urlInput = content.querySelector('#arcade-custom-input');
    let url = urlInput.value.trim();
    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      customPrompt.style.display = 'none';
      iframe.style.display = 'block';
      iframe.src = url;
      titleDisplay.textContent = `Web Game: ${url.replace('https://', '').replace('http://', '').split('/')[0]}`;
    }
  };

  content.querySelectorAll('.arcade-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      selectGame(item.dataset.game);
    });
  });

  selectGame('pacman');
}
