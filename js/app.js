/**
 * Main Application Controller for Country Flag Battle
 * Coordinates physics arena, territorial war, elimination wheel, overlays, audio, and streamer tools.
 */

class App {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.currentMode = 'rotating'; // 'rotating' | 'physics' | 'territory' | 'wheel'
    this.currentGame = null;
    this.chatSim = null;

    this.autoLoop = true;
    this.speed = 1.0;
    this.isPaused = false;
    this.roundCount = 1;
    this.autoLoopTimeout = null;

    this.killFeedContainer = document.getElementById('killFeed');
    this.aliveCountEl = document.getElementById('aliveCount');
    this.leaderboardListEl = document.getElementById('leaderboardMiniList');
    this.chatBoxEl = document.getElementById('streamChatBox');

    this.initTheme();
    this.initCanvas();
    this.initChatSimulator();
    this.bindUIEvents();
    this.switchMode('rotating');
    this.startLoop();
  }

  initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Internal resolution (high DPI)
    this.canvas.width = (rect.width || 460) * dpr;
    this.canvas.height = (rect.height || 818) * dpr;

    const ctx = this.canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    this.logicalWidth = rect.width || 460;
    this.logicalHeight = rect.height || 818;

    window.addEventListener('resize', () => {
      const newRect = this.canvas.getBoundingClientRect();
      this.canvas.width = (newRect.width || 460) * dpr;
      this.canvas.height = (newRect.height || 818) * dpr;
      ctx.scale(dpr, dpr);
      this.logicalWidth = newRect.width || 460;
      this.logicalHeight = newRect.height || 818;
      if (this.currentGame && this.currentGame.resize) {
        this.currentGame.resize(this.logicalWidth, this.logicalHeight);
      }
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem('flag_battle_theme') || 'midnight';
    this.setTheme(savedTheme);
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    try {
      localStorage.setItem('flag_battle_theme', themeName);
    } catch (e) {}

    // Update active state on buttons
    document.querySelectorAll('.theme-chip-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
  }

  handleGameEvent(type, data) {
    if (type === 'kill') {
      this.addKillFeedItem(data);
    } else if (type === 'update_alive') {
      if (this.aliveCountEl) {
        this.aliveCountEl.innerText = `${data.alive} / ${data.total} ALIVE`;
      }
    } else if (type === 'victory') {
      this.handleRoundVictory(data);
    }
  }

  switchMode(mode) {
    if (this.currentGame) {
      this.currentGame.pause();
    }
    if (this.autoLoopTimeout) {
      clearTimeout(this.autoLoopTimeout);
    }

    this.currentMode = mode;

    // Update Mode UI Tabs
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Toggle overlay visibility (Rotating mode has built-in UI)
    const topHeader = document.querySelector('.stream-header');
    const miniLeaderboard = document.querySelector('.stream-leaderboard-mini');
    if (mode === 'rotating') {
      if (topHeader) topHeader.style.display = 'none';
      if (miniLeaderboard) miniLeaderboard.style.display = 'none';
    } else {
      if (topHeader) topHeader.style.display = 'flex';
      if (miniLeaderboard) miniLeaderboard.style.display = 'block';
    }

    const eventHandler = (type, data) => this.handleGameEvent(type, data);
    const activeCountries = window.FlagManager.getAll();

    if (mode === 'rotating') {
      this.currentGame = new window.RotatingArena(this.canvas, eventHandler);
      this.currentGame.resize(this.logicalWidth, this.logicalHeight);
      this.currentGame.setupGame(activeCountries);
    } else if (mode === 'physics') {
      this.currentGame = new window.PhysicsArena(this.canvas, eventHandler);
      this.currentGame.resize(this.logicalWidth, this.logicalHeight);
      this.currentGame.setupGame(activeCountries, 60);
    } else if (mode === 'territory') {
      this.currentGame = new window.TerritoryWar(this.canvas, eventHandler);
      this.currentGame.resize(this.logicalWidth, this.logicalHeight);
      this.currentGame.setupGame(activeCountries, 32);
    } else if (mode === 'wheel') {
      this.currentGame = new window.WheelRoulette(this.canvas, eventHandler);
      this.currentGame.resize(this.logicalWidth, this.logicalHeight);
      this.currentGame.setupGame(activeCountries, 36);
    }

    this.currentGame.setSpeed(this.speed);
    this.killFeedContainer.innerHTML = '';
    this.updateLeaderboardUI();
    this.currentGame.start();
    this.isPaused = false;
    this.updatePlayPauseButton();
  }

  restartCurrentGame() {
    if (this.autoLoopTimeout) clearTimeout(this.autoLoopTimeout);
    this.killFeedContainer.innerHTML = '';
    const activeCountries = window.FlagManager.getAll();

    if (this.currentMode === 'rotating') {
      this.currentGame.setupGame(activeCountries);
    } else if (this.currentMode === 'physics') {
      this.currentGame.setupGame(activeCountries, 60);
    } else if (this.currentMode === 'territory') {
      this.currentGame.setupGame(activeCountries, 32);
    } else if (this.currentMode === 'wheel') {
      this.currentGame.setupGame(activeCountries, 36);
    }

    this.currentGame.setSpeed(this.speed);
    this.currentGame.start();
    this.isPaused = false;
    this.updatePlayPauseButton();
  }

  togglePlayPause() {
    if (!this.currentGame) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.currentGame.pause();
    } else {
      this.currentGame.start();
    }
    this.updatePlayPauseButton();
  }

  updatePlayPauseButton() {
    const btn = document.getElementById('btnPlayPause');
    if (btn) {
      btn.innerHTML = this.isPaused ? '▶️ Resume Match' : '⏸️ Pause Match';
      btn.classList.toggle('primary', this.isPaused);
    }
  }

  setSpeed(val) {
    this.speed = parseFloat(val);
    if (this.currentGame && this.currentGame.setSpeed) {
      this.currentGame.setSpeed(this.speed);
    }
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.speed) === this.speed);
    });
  }

  handleRoundVictory(winnerData) {
    this.roundCount++;
    const roundTitle = document.getElementById('matchRoundTitle');
    if (roundTitle) {
      roundTitle.innerText = `MATCH #${this.roundCount}`;
    }

    // If auto-loop is enabled, start next round after celebration delay (4.5s)
    if (this.autoLoop) {
      this.autoLoopTimeout = setTimeout(() => {
        this.restartCurrentGame();
      }, 4500 / this.speed);
    }
  }

  addKillFeedItem(data) {
    const item = document.createElement('div');
    item.className = 'kill-feed-item';
    item.innerHTML = `
      <img src="${window.FlagManager.getFlagUrl(data.victim.code)}" width="16" height="12" style="border-radius:2px; object-fit:cover;" onerror="this.style.display='none'">
      <span><strong>${data.victim.name}</strong> eliminated!</span>
    `;

    this.killFeedContainer.prepend(item);

    // Remove oldest if more than 5
    if (this.killFeedContainer.children.length > 5) {
      this.killFeedContainer.lastElementChild.remove();
    }

    // Auto fade after 4.5 seconds
    setTimeout(() => {
      if (item.parentNode) {
        item.style.opacity = '0';
        item.style.transition = 'opacity 0.5s ease';
        setTimeout(() => item.remove(), 500);
      }
    }, 4000);
  }

  updateLeaderboardUI() {
    if (!this.currentGame || !this.leaderboardListEl) return;
    const leaderboard = this.currentGame.getLeaderboard().slice(0, 5);

    this.leaderboardListEl.innerHTML = leaderboard.map((item, idx) => {
      const country = item.country;
      const isRank1 = idx === 0;
      let stat = '';

      if (this.currentMode === 'physics') {
        stat = `⚔️ ${item.kills || 0}`;
      } else if (this.currentMode === 'territory') {
        stat = `${item.percent || 0}%`;
      } else if (this.currentMode === 'wheel') {
        stat = item.alive ? 'ALIVE' : `#${item.rank || ''}`;
      }

      return `
        <div class="leaderboard-mini-item ${isRank1 ? 'rank-1' : ''}">
          <div class="mini-flag-name">
            <span>#${idx + 1}</span>
            <img src="${window.FlagManager.getFlagUrl(country.code)}" width="14" height="10" style="border-radius:2px; object-fit:cover;" onerror="this.style.display='none'">
            <span>${country.name.substring(0, 8)}</span>
          </div>
          <span style="color:var(--accent-cyan);">${stat}</span>
        </div>
      `;
    }).join('');
  }

  initChatSimulator() {
    this.chatSim = new window.ChatSimulator(
      // On Command
      (cmd) => {
        if (this.currentGame && this.currentGame.boostCountry) {
          this.currentGame.boostCountry(cmd.countryCode, cmd.type);
        }
      },
      // On Message
      (msg) => {
        this.addChatMessage(msg);
      }
    );

    this.chatSim.start();
  }

  addChatMessage(msg) {
    if (!this.chatBoxEl) return;

    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="chat-user">${msg.user}:</span> <span>${msg.text}</span>`;

    this.chatBoxEl.appendChild(div);

    // Keep max 4 visible
    if (this.chatBoxEl.children.length > 4) {
      this.chatBoxEl.firstElementChild.remove();
    }
  }

  bindUIEvents() {
    // Mode Switcher Buttons
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchMode(btn.dataset.mode);
      });
    });

    // Action Buttons
    const btnPlayPause = document.getElementById('btnPlayPause');
    if (btnPlayPause) btnPlayPause.addEventListener('click', () => this.togglePlayPause());

    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) btnRestart.addEventListener('click', () => this.restartCurrentGame());

    // Speed Selector Buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setSpeed(btn.dataset.speed);
      });
    });

    // Auto-Loop Toggle
    const autoLoopCheck = document.getElementById('autoLoopCheck');
    if (autoLoopCheck) {
      autoLoopCheck.addEventListener('change', (e) => {
        this.autoLoop = e.target.checked;
      });
    }

    // Sound Mute Toggle
    const muteCheck = document.getElementById('muteCheck');
    if (muteCheck) {
      muteCheck.addEventListener('change', (e) => {
        window.SoundEngine.setMuted(e.target.checked);
      });
    }

    // OBS Clean Mode Toggle
    const obsToggle = document.getElementById('obsModeToggle');
    if (obsToggle) {
      obsToggle.addEventListener('click', () => {
        document.body.classList.toggle('obs-clean-mode');
        obsToggle.innerText = document.body.classList.contains('obs-clean-mode') ? '🖥️ Exit Clean Mode' : '📺 OBS Clean Mode';
      });
    }

    // Theme Picker Buttons
    document.querySelectorAll('.theme-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.theme) {
          this.setTheme(btn.dataset.theme);
        }
      });
    });

    // Quick Cheer Buttons
    document.querySelectorAll('.cheer-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.country;
        if (this.currentGame && this.currentGame.boostCountry) {
          this.currentGame.boostCountry(code, 'speed');
        }
      });
    });

    // Streamer Chat Send
    const chatInput = document.getElementById('streamerChatInput');
    const btnSend = document.getElementById('btnSendChat');
    const sendCustom = () => {
      if (!chatInput || !chatInput.value.trim()) return;
      this.chatSim.sendCustomMessage('👑 Streamer', chatInput.value.trim());
      chatInput.value = '';
    };

    if (btnSend) btnSend.addEventListener('click', sendCustom);
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendCustom();
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.key === 'r' || e.key === 'R') {
        this.restartCurrentGame();
      } else if (e.key === '1') {
        this.switchMode('rotating');
      } else if (e.key === '2') {
        this.switchMode('physics');
      } else if (e.key === '3') {
        this.switchMode('territory');
      } else if (e.key === '4') {
        this.switchMode('wheel');
      } else if (e.key === 'o' || e.key === 'O') {
        document.body.classList.toggle('obs-clean-mode');
      }
    });

    // Periodic leaderboard refresh
    setInterval(() => {
      this.updateLeaderboardUI();
    }, 600);
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (this.currentGame) {
        this.currentGame.update(dt);
        this.currentGame.render();
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.AppInstance = new App();
});
