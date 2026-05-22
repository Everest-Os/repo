export async function launch(ctx, options = {}) {
  const { windowManager, vfs } = ctx;
  const { IconHelper, showSystemDialog } = window.osAPI;

  const content = document.createElement('div');
  content.style.cssText = `
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #0f0f12;
    color: #eeeeee;
    font-family: var(--font-main, 'Inter', sans-serif);
    user-select: none;
    position: relative;
  `;

  // Toolbar HTML
  content.innerHTML = `
    <div class="paint-toolbar" style="
      height: 52px;
      background: rgba(20, 20, 25, 0.85);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      flex-shrink: 0;
    ">
      <!-- File Operations -->
      <div style="display: flex; gap: 6px;">
        <button class="paint-btn" id="paint-new" title="New Canvas" style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #eeeeee;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          transition: all 0.2s;
        ">
          ${IconHelper?.getIcon('file', { size: 14 }) || 'New'}
        </button>
        <button class="paint-btn" id="paint-save" title="Save to VFS" style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #eeeeee;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          transition: all 0.2s;
        ">
          ${IconHelper?.getIcon('disk', { size: 14 }) || 'Save'}
        </button>
      </div>

      <div style="width: 1px; height: 24px; background: rgba(255, 255, 255, 0.15); margin: 0 4px;"></div>

      <!-- Tools -->
      <div style="display: flex; gap: 4px;" id="paint-tools">
        <button class="tool-btn active" data-tool="brush" title="Brush" style="padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.08); color: #fff; cursor: pointer; font-size: 12px;">✏️ Brush</button>
        <button class="tool-btn" data-tool="line" title="Line" style="padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); background: transparent; color: #aaa; cursor: pointer; font-size: 12px;">📏 Line</button>
        <button class="tool-btn" data-tool="rect" title="Rectangle" style="padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); background: transparent; color: #aaa; cursor: pointer; font-size: 12px;">⬜ Rect</button>
        <button class="tool-btn" data-tool="circle" title="Circle" style="padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); background: transparent; color: #aaa; cursor: pointer; font-size: 12px;">⭕ Circle</button>
        <button class="tool-btn" data-tool="eraser" title="Eraser" style="padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); background: transparent; color: #aaa; cursor: pointer; font-size: 12px;">🧼 Eraser</button>
      </div>

      <div style="width: 1px; height: 24px; background: rgba(255, 255, 255, 0.15); margin: 0 4px;"></div>

      <!-- Size -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 12px; color: #888;">Size:</span>
        <input type="range" id="brush-size" min="1" max="50" value="5" style="width: 80px; cursor: pointer;">
        <span id="size-display" style="font-size: 12px; min-width: 20px; font-family: monospace;">5px</span>
      </div>

      <div style="width: 1px; height: 24px; background: rgba(255, 255, 255, 0.15); margin: 0 4px;"></div>

      <!-- Color Presets -->
      <div style="display: flex; align-items: center; gap: 6px;" id="color-palette">
        <div class="color-swatch active" data-color="#ffffff" style="width: 18px; height: 18px; border-radius: 50%; background: #ffffff; border: 2px solid #ff007f; cursor: pointer;"></div>
        <div class="color-swatch" data-color="#ff007f" style="width: 18px; height: 18px; border-radius: 50%; background: #ff007f; border: 1px solid rgba(255,255,255,0.2); cursor: pointer;"></div>
        <div class="color-swatch" data-color="#00f0ff" style="width: 18px; height: 18px; border-radius: 50%; background: #00f0ff; border: 1px solid rgba(255,255,255,0.2); cursor: pointer;"></div>
        <div class="color-swatch" data-color="#39ff14" style="width: 18px; height: 18px; border-radius: 50%; background: #39ff14; border: 1px solid rgba(255,255,255,0.2); cursor: pointer;"></div>
        <div class="color-swatch" data-color="#ffff00" style="width: 18px; height: 18px; border-radius: 50%; background: #ffff00; border: 1px solid rgba(255,255,255,0.2); cursor: pointer;"></div>
        <div class="color-swatch" data-color="#ff0000" style="width: 18px; height: 18px; border-radius: 50%; background: #ff0000; border: 1px solid rgba(255,255,255,0.2); cursor: pointer;"></div>
        <input type="color" id="paint-color" style="width: 24px; height: 24px; border: 1px solid #333; padding: 0; background: transparent; cursor: pointer; border-radius: 4px;" title="Custom Color" value="#ffffff">
      </div>

      <div style="width: 1px; height: 24px; background: rgba(255, 255, 255, 0.15); margin: 0 4px;"></div>

      <!-- History -->
      <div style="display: flex; gap: 4px;">
        <button class="paint-btn" id="paint-undo" title="Undo" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">↩️</button>
        <button class="paint-btn" id="paint-redo" title="Redo" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">↪️</button>
        <button class="paint-btn" id="paint-clear" title="Clear Canvas" style="background: rgba(255,50,50,0.1); border: 1px solid rgba(255,50,50,0.2); color: #ff5555; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑️ Clear</button>
      </div>
    </div>

    <!-- Canvas Container -->
    <div style="flex: 1; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <canvas id="paint-canvas" style="background: #1e1e24; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; cursor: crosshair; display: block;"></canvas>
    </div>

    <style>
      .paint-btn:hover {
        background: rgba(255, 255, 255, 0.12) !important;
      }
      .tool-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
      }
      .tool-btn.active {
        background: var(--accent, #ff007f) !important;
        border-color: var(--accent, #ff007f) !important;
        color: #fff !important;
      }
      .color-swatch:hover {
        transform: scale(1.1);
      }
    </style>
  `;

  // Init window
  const win = windowManager.createWindow({
    id: 'paint',
    title: 'Everest Paint',
    icon: 'image',
    width: 900,
    height: 650,
    content
  });

  const canvas = content.querySelector('#paint-canvas');
  const ctx2d = canvas.getContext('2d');

  // Set initial dimensions
  canvas.width = 800;
  canvas.height = 500;

  // Fill canvas with white initially
  ctx2d.fillStyle = '#ffffff';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);

  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let currentTool = 'brush';
  let currentColor = '#ffffff';
  let currentSize = 5;

  // History stacks
  let historyStack = [];
  let redoStack = [];

  const saveState = () => {
    historyStack.push(canvas.toDataURL());
    if (historyStack.length > 30) historyStack.shift(); // Limit to 30 undo states
    redoStack = []; // Clear redo
  };

  // Initial save
  saveState();

  // Mouse handlers
  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  let dragImage = null;

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;

    if (currentTool !== 'brush' && currentTool !== 'eraser') {
      // Save canvas state to draw previews
      dragImage = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      ctx2d.beginPath();
      ctx2d.moveTo(startX, startY);
      ctx2d.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx2d.lineWidth = currentSize;
      ctx2d.lineCap = 'round';
      ctx2d.lineJoin = 'round';
      ctx2d.lineTo(pos.x, pos.y);
      ctx2d.stroke();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);

    if (currentTool === 'brush' || currentTool === 'eraser') {
      ctx2d.lineTo(pos.x, pos.y);
      ctx2d.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx2d.stroke();
    } else if (currentTool === 'line') {
      ctx2d.putImageData(dragImage, 0, 0);
      ctx2d.beginPath();
      ctx2d.moveTo(startX, startY);
      ctx2d.lineTo(pos.x, pos.y);
      ctx2d.strokeStyle = currentColor;
      ctx2d.lineWidth = currentSize;
      ctx2d.lineCap = 'round';
      ctx2d.stroke();
    } else if (currentTool === 'rect') {
      ctx2d.putImageData(dragImage, 0, 0);
      ctx2d.strokeStyle = currentColor;
      ctx2d.lineWidth = currentSize;
      ctx2d.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
    } else if (currentTool === 'circle') {
      ctx2d.putImageData(dragImage, 0, 0);
      ctx2d.strokeStyle = currentColor;
      ctx2d.lineWidth = currentSize;
      ctx2d.beginPath();
      const r = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
      ctx2d.arc(startX, startY, r, 0, 2 * Math.PI);
      ctx2d.stroke();
    }
  });

  const stopDrawing = () => {
    if (isDrawing) {
      isDrawing = false;
      saveState();
    }
  };

  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Tool Selection
  const toolBtns = content.querySelectorAll('.tool-btn');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = '#aaa';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--accent, #ff007f)';
      btn.style.color = '#fff';
      currentTool = btn.dataset.tool;
    });
  });

  // Size Slider
  const sizeSlider = content.querySelector('#brush-size');
  const sizeDisplay = content.querySelector('#size-display');
  sizeSlider.addEventListener('input', () => {
    currentSize = parseInt(sizeSlider.value, 10);
    sizeDisplay.textContent = currentSize + 'px';
  });

  // Color Swatches
  const swatches = content.querySelectorAll('.color-swatch');
  const colorPicker = content.querySelector('#paint-color');

  const updateSwatchBorder = (selectedColor) => {
    swatches.forEach(swatch => {
      if (swatch.dataset.color.toLowerCase() === selectedColor.toLowerCase()) {
        swatch.style.border = '2px solid #ff007f';
        swatch.classList.add('active');
      } else {
        swatch.style.border = '1px solid rgba(255,255,255,0.2)';
        swatch.classList.remove('active');
      }
    });
  };

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      currentColor = swatch.dataset.color;
      colorPicker.value = currentColor;
      updateSwatchBorder(currentColor);
    });
  });

  colorPicker.addEventListener('input', () => {
    currentColor = colorPicker.value;
    updateSwatchBorder(currentColor);
  });

  // Undo / Redo / Clear
  content.querySelector('#paint-undo').onclick = () => {
    if (historyStack.length > 1) {
      const current = historyStack.pop();
      redoStack.push(current);
      const prev = historyStack[historyStack.length - 1];

      const img = new Image();
      img.src = prev;
      img.onload = () => {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(img, 0, 0);
      };
    }
  };

  content.querySelector('#paint-redo').onclick = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      historyStack.push(nextState);

      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(img, 0, 0);
      };
    }
  };

  content.querySelector('#paint-clear').onclick = () => {
    showSystemDialog({
      title: 'Clear Canvas',
      message: 'Are you sure you want to clear the entire canvas?',
      type: 'confirm',
      onConfirm: () => {
        ctx2d.fillStyle = '#ffffff';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    });
  };

  content.querySelector('#paint-new').onclick = () => {
    showSystemDialog({
      title: 'New Canvas',
      message: 'Reset canvas? All unsaved work will be lost.',
      type: 'confirm',
      onConfirm: () => {
        ctx2d.fillStyle = '#ffffff';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        historyStack = [];
        redoStack = [];
        saveState();
      }
    });
  };

  // Save to VFS
  content.querySelector('#paint-save').onclick = () => {
    showSystemDialog({
      title: 'Save Painting',
      message: 'Enter filename (e.g. artwork.png):',
      type: 'prompt',
      value: `painting_${Date.now()}.png`,
      onConfirm: async (filename) => {
        if (!filename) return;
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const savePath = `/home/user/Pictures/${filename}`;
          
          // Ensure Pictures folder exists
          try { await vfs.mkdir('/home/user/Pictures'); } catch (e) {}

          await vfs.writeFile(savePath, dataUrl);
          
          window.__everestConsole?.log(`🎨 Paint: Saved painting to ${savePath}`);
          showSystemDialog({
            title: 'File Saved',
            message: `Successfully saved painting to ${savePath}`,
            type: 'alert'
          });
        } catch (err) {
          showSystemDialog({
            title: 'Save Failed',
            message: 'Error saving canvas: ' + err.message,
            type: 'alert'
          });
        }
      }
    });
  };
}
