export async function launch(ctx, options = {}) {
  const { windowManager, vfs } = ctx;
  const { IconHelper, showSystemDialog } = window.osAPI;

  const content = document.createElement('div');
  content.style.cssText = `
    height: 100%;
    display: flex;
    background: #09090b;
    color: #f4f4f5;
    font-family: var(--font-main, 'Inter', sans-serif);
    overflow: hidden;
  `;

  content.innerHTML = `
    <!-- Left Navigation Sidebar -->
    <div style="
      width: 250px;
      background: #0c0c0e;
      border-right: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    ">
      <!-- Logo/Title -->
      <div style="
        padding: 20px;
        font-weight: 800;
        font-size: 15px;
        color: #ff3e3e;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #ff3e3e;"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        Cinematic Tube
      </div>

      <!-- Quick Links / Views -->
      <div style="padding: 16px 0;" id="yt-nav">
        <div class="yt-nav-item active" data-view="discover" style="padding: 10px 20px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px; color: #fff; transition: all 0.2s;">
          ✨ Discover
        </div>
        <div class="yt-nav-item" data-view="playlists" style="padding: 10px 20px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px; color: #a1a1aa; transition: all 0.2s;">
          📂 My Playlists
        </div>
        <div class="yt-nav-item" data-view="history" style="padding: 10px 20px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px; color: #a1a1aa; transition: all 0.2s;">
          ⏳ History
        </div>
      </div>

      <!-- Playlist Creator Section -->
      <div style="margin-top: auto; padding: 20px; border-top: 1px solid rgba(255,255,255,0.04);">
        <button id="yt-create-playlist-btn" style="
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s;
        ">
          ➕ New Playlist
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div style="
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    ">
      <!-- Top Search & URL Paste Bar -->
      <div style="
        height: 60px;
        background: #0a0a0c;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        padding: 0 24px;
        gap: 16px;
        flex-shrink: 0;
      ">
        <div style="flex: 1; position: relative;">
          <input type="text" id="yt-url-input" placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=...) or search..." style="
            width: 100%;
            background: #121214;
            border: 1px solid rgba(255,255,255,0.08);
            color: #fff;
            padding: 8px 16px 8px 36px;
            border-radius: 20px;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
          " />
          <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); opacity: 0.5;">
            🔍
          </span>
        </div>
        <button id="yt-play-btn" class="btn-primary" style="
          background: #ff3e3e;
          border: none;
          color: #fff;
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        ">Play</button>
      </div>

      <!-- App Body (Discover, Playlists, History, and active Player View) -->
      <div id="yt-body" style="
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      ">
        <!-- View containers will be rendered dynamically here -->
      </div>
    </div>

    <style>
      .yt-nav-item:hover {
        background: rgba(255,255,255,0.03);
        color: #fff !important;
      }
      .yt-nav-item.active {
        background: rgba(255, 62, 62, 0.08) !important;
        color: #ff3e3e !important;
        font-weight: 600;
      }
      .yt-card {
        background: #111113;
        border: 1px solid rgba(255,255,255,0.04);
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s, border-color 0.2s;
      }
      .yt-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255, 62, 62, 0.3);
      }
      .playlist-card {
        background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }
      .playlist-card:hover {
        border-color: #ff3e3e;
        box-shadow: 0 4px 20px rgba(255, 62, 62, 0.15);
      }
    </style>
  `;

  // Init window
  const win = windowManager.createWindow({
    id: 'youtube-player',
    title: 'YouTube Cinematic',
    icon: 'video',
    width: 950,
    height: 650,
    content
  });

  const urlInput = content.querySelector('#yt-url-input');
  const playBtn = content.querySelector('#yt-play-btn');
  const ytBody = content.querySelector('#yt-body');

  let currentView = 'discover';
  let activeVideoId = null;
  let activeVideoTitle = '';

  // Local state persisted in VFS
  let store = {
    playlists: [
      { id: 'fav', name: '⭐ Favorites', videos: [] }
    ],
    history: []
  };

  const CONFIG_PATH = '~/.config/youtube-player/data.json';

  const loadSettings = async () => {
    try {
      const data = await vfs.readFile(CONFIG_PATH);
      store = JSON.parse(data);
    } catch (e) {
      // First run or default
    }
  };

  const saveSettings = async () => {
    try {
      await vfs.mkdir('~/.config/youtube-player');
      await vfs.writeFile(CONFIG_PATH, JSON.stringify(store, null, 2));
    } catch (e) {}
  };

  // Video ID Extractor
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Curated list
  const CURATED_VIDEOS = [
    { id: 'jfKfPfyJRdk', title: 'Lofi Girl - Chill Lofi Beats to study/relax', category: 'Lofi Beats' },
    { id: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio - Beats to Study/Relax to', category: 'Lofi Beats' },
    { id: '4xDzrJKXOOY', title: 'Synthwave Radio - Chill synth / retrowave mix', category: 'Synthwave' },
    { id: 'MVPTGnggObY', title: 'RETROWAVE MIX - Best Outrun / Cyberpunk beats', category: 'Synthwave' },
    { id: 'w3Z_GZz-T_8', title: 'Planet Earth Cinematic Chill Ambient Journey', category: 'Ambient' },
    { id: 'dQw4w9WgXcQ', title: 'EverestOS Developer Showcase & Guides', category: 'Guides' }
  ];

  const playVideo = (videoId, title = 'YouTube Video') => {
    activeVideoId = videoId;
    activeVideoTitle = title;

    // Add to history
    store.history = store.history.filter(item => item.id !== videoId);
    store.history.unshift({ id: videoId, title, timestamp: Date.now() });
    if (store.history.length > 20) store.history.pop();
    saveSettings();

    renderPlayer();
  };

  const renderPlayer = () => {
    ytBody.innerHTML = `
      <div style="display: flex; gap: 24px; height: 100%; flex-direction: column;">
        <!-- Back Button -->
        <div>
          <button id="yt-back-btn" class="btn-secondary btn-sm" style="display:flex; align-items:center; gap:6px;">
            ← Back to Discover
          </button>
        </div>

        <!-- Video Frame -->
        <div style="
          flex: 1;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          position: relative;
          min-height: 380px;
        ">
          <iframe 
            src="https://www.youtube.com/embed/${activeVideoId}?autoplay=1&enablejsapi=1" 
            style="width: 100%; height: 100%; border: none;" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>

        <!-- Video Details & Actions -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #0f0f11;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.04);
        ">
          <div>
            <h2 style="margin: 0 0 6px 0; font-size: 16px; color: #fff;">${activeVideoTitle}</h2>
            <div style="font-size: 12px; color: #6b7280; font-family: monospace;">Video ID: ${activeVideoId}</div>
          </div>
          
          <button id="yt-add-playlist-btn" class="btn-primary" style="
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            padding: 8px 16px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-radius: 8px;
            cursor: pointer;
          ">
            📂 Add to Playlist
          </button>
        </div>
      </div>
    `;

    content.querySelector('#yt-back-btn').onclick = () => {
      setView(currentView);
    };

    content.querySelector('#yt-add-playlist-btn').onclick = () => {
      // Prompt choose playlist
      const playlistOptions = store.playlists.map((pl, idx) => `${idx + 1}. ${pl.name}`).join('\n');
      showSystemDialog({
        title: 'Select Playlist',
        message: `Enter playlist number to add video to:\n\n${playlistOptions}`,
        type: 'prompt',
        value: '1',
        onConfirm: (val) => {
          const num = parseInt(val, 10);
          if (isNaN(num) || num < 1 || num > store.playlists.length) {
            showSystemDialog({ title: 'Invalid Selection', message: 'Please select a valid playlist number.', type: 'alert' });
            return;
          }
          const target = store.playlists[num - 1];
          if (target.videos.some(v => v.id === activeVideoId)) {
            showSystemDialog({ title: 'Duplicate', message: 'Video already exists in this playlist.', type: 'alert' });
            return;
          }
          target.videos.push({ id: activeVideoId, title: activeVideoTitle });
          saveSettings();
          showSystemDialog({ title: 'Success', message: `Added to ${target.name}`, type: 'alert' });
        }
      });
    };
  };

  const renderDiscover = () => {
    ytBody.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #fff;">Discover Curated Streams</h2>
      
      <!-- Video Grid -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      " id="yt-curated-grid"></div>
    `;

    const grid = ytBody.querySelector('#yt-curated-grid');
    CURATED_VIDEOS.forEach(video => {
      const card = document.createElement('div');
      card.className = 'yt-card';
      card.innerHTML = `
        <div style="position: relative; aspect-ratio: 16/9; background: #000;">
          <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" style="width:100%; height:100%; object-fit:cover;" />
          <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-family: monospace;">LIVE</div>
        </div>
        <div style="padding: 12px;">
          <div style="font-weight: 600; font-size: 13px; color: #fff; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 36px;">
            ${video.title}
          </div>
          <div style="font-size: 11px; color: #71717a; margin-top: 6px;">Category: ${video.category}</div>
        </div>
      `;

      card.onclick = () => playVideo(video.id, video.title);
      grid.appendChild(card);
    });
  };

  const renderPlaylists = () => {
    ytBody.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #fff;">My Playlists</h2>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      " id="yt-playlists-grid"></div>
    `;

    const grid = ytBody.querySelector('#yt-playlists-grid');
    store.playlists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
        <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #fff;">${pl.name}</h3>
        <div style="font-size: 12px; color: #71717a;">${pl.videos.length} videos</div>
        ${pl.id !== 'fav' ? `<button class="delete-pl-btn" style="position:absolute; top:12px; right:12px; border:none; background:transparent; color:#ff5555; cursor:pointer; font-size:14px;" title="Delete Playlist">🗑️</button>` : ''}
      `;

      card.onclick = (e) => {
        if (e.target.classList.contains('delete-pl-btn')) {
          e.stopPropagation();
          showSystemDialog({
            title: 'Delete Playlist',
            message: `Are you sure you want to delete "${pl.name}"?`,
            type: 'confirm',
            onConfirm: () => {
              store.playlists = store.playlists.filter(p => p.id !== pl.id);
              saveSettings();
              renderPlaylists();
            }
          });
          return;
        }
        renderPlaylistVideos(pl);
      };

      grid.appendChild(card);
    });
  };

  const renderPlaylistVideos = (pl) => {
    ytBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin:0; font-size:18px; font-weight:700; color:#fff;">${pl.name}</h2>
        <button id="yt-back-playlists" class="btn-secondary btn-sm">← Back to Playlists</button>
      </div>

      ${pl.videos.length === 0 ? `
        <div style="padding:40px; text-align:center; color:#71717a; font-size:13px;">This playlist is empty. Add videos from the Discover or play menu!</div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${pl.videos.map((vid, idx) => `
            <div class="playlist-video-item" data-id="${vid.id}" data-idx="${idx}" style="
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 10px 16px;
              background: #111113;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              border: 1px solid transparent;
            ">
              <div style="width: 24px; font-size:12px; color:#52525b; text-align:center;">${idx + 1}</div>
              <img src="https://img.youtube.com/vi/${vid.id}/mqdefault.jpg" style="width:60px; aspect-ratio:16/9; object-fit:cover; border-radius:4px;" />
              <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:13px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${vid.title}</div>
              </div>
              <button class="remove-vid-btn" style="border:none; background:transparent; color:#ff5555; cursor:pointer;" title="Remove from Playlist">❌</button>
            </div>
          `).join('')}
        </div>
      `}
    `;

    ytBody.querySelectorAll('.playlist-video-item').forEach(item => {
      item.onclick = (e) => {
        const id = item.dataset.id;
        const idx = parseInt(item.dataset.idx, 10);
        const vidObj = pl.videos[idx];

        if (e.target.classList.contains('remove-vid-btn')) {
          e.stopPropagation();
          pl.videos.splice(idx, 1);
          saveSettings();
          renderPlaylistVideos(pl);
          return;
        }

        playVideo(id, vidObj.title);
      };
      
      item.onmouseenter = () => item.style.borderColor = 'rgba(255, 62, 62, 0.2)';
      item.onmouseleave = () => item.style.borderColor = 'transparent';
    });

    content.querySelector('#yt-back-playlists').onclick = () => {
      renderPlaylists();
    };
  };

  const renderHistory = () => {
    ytBody.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #fff;">Play History</h2>
      ${store.history.length === 0 ? `
        <div style="padding:40px; text-align:center; color:#71717a; font-size:13px;">No history yet. Videos you watch will appear here.</div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${store.history.map((vid, idx) => `
            <div class="history-item" data-id="${vid.id}" style="
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 10px 16px;
              background: #111113;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              border: 1px solid transparent;
            ">
              <img src="https://img.youtube.com/vi/${vid.id}/mqdefault.jpg" style="width:60px; aspect-ratio:16/9; object-fit:cover; border-radius:4px;" />
              <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:13px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${vid.title}</div>
                <div style="font-size:11px; color:#71717a; margin-top:2px;">Watched ${new Date(vid.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    ytBody.querySelectorAll('.history-item').forEach(item => {
      item.onclick = () => {
        const id = item.dataset.id;
        const title = item.querySelector('div div').textContent;
        playVideo(id, title);
      };
      item.onmouseenter = () => item.style.borderColor = 'rgba(255, 62, 62, 0.2)';
      item.onmouseleave = () => item.style.borderColor = 'transparent';
    });
  };

  const setView = (viewId) => {
    currentView = viewId;
    content.querySelectorAll('.yt-nav-item').forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add('active');
        item.style.color = '#ff3e3e';
      } else {
        item.classList.remove('active');
        item.style.color = '#a1a1aa';
      }
    });

    if (viewId === 'discover') renderDiscover();
    else if (viewId === 'playlists') renderPlaylists();
    else if (viewId === 'history') renderHistory();
  };

  // Nav Actions
  content.querySelectorAll('.yt-nav-item').forEach(item => {
    item.onclick = () => setView(item.dataset.view);
  });

  // Create Playlist Action
  content.querySelector('#yt-create-playlist-btn').onclick = () => {
    showSystemDialog({
      title: 'New Playlist',
      message: 'Enter playlist name:',
      type: 'prompt',
      value: 'My Mix',
      onConfirm: (name) => {
        if (!name) return;
        const newPl = {
          id: 'pl_' + Date.now(),
          name: `📂 ${name}`,
          videos: []
        };
        store.playlists.push(newPl);
        saveSettings();
        if (currentView === 'playlists') renderPlaylists();
      }
    });
  };

  // Play URL Paste / Search Action
  const triggerPlay = () => {
    const query = urlInput.value.trim();
    if (!query) return;

    const parsedId = extractVideoId(query);
    if (parsedId) {
      playVideo(parsedId, 'Pasted Video');
      urlInput.value = '';
    } else {
      // Text search: search the curated list or Rick Roll
      const matches = CURATED_VIDEOS.filter(v => v.title.toLowerCase().includes(query.toLowerCase()));
      if (matches.length > 0) {
        playVideo(matches[0].id, matches[0].title);
      } else {
        showSystemDialog({
          title: 'Direct Search',
          message: `Could not extract video ID. Do you want to play default video or search YouTube directly?`,
          type: 'confirm',
          confirmText: 'Play Demo',
          onConfirm: () => {
            playVideo('dQw4w9WgXcQ', 'EverestOS Tech Tour');
          }
        });
      }
      urlInput.value = '';
    }
  };

  playBtn.onclick = triggerPlay;
  urlInput.onkeydown = (e) => {
    if (e.key === 'Enter') triggerPlay();
  };

  // Load state and display Discover
  (async () => {
    await loadSettings();
    setView('discover');
  })();
}
