/**
 * World Map Territorial Conquest Engine (Flag War)
 * Grid-based cellular territorial conquest simulation for 9:16 vertical streaming.
 */

class TerritoryWar {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});

    this.width = canvas.width;
    this.height = canvas.height;

    // Grid Dimensions optimized for vertical stream
    this.cols = 32;
    this.rows = 48;
    this.cellW = this.width / this.cols;
    this.cellH = this.height / this.rows;

    this.grid = []; // 2D array of { countryCode, troops, isCapital, color }
    this.countries = []; // Active participating countries
    this.eliminated = [];
    this.particles = [];
    this.floatingTexts = [];

    this.isRunning = false;
    this.gameSpeed = 1.0;
    this.roundTime = 0;
    this.lastTick = 0;
    this.tickInterval = 480; // ms per simulation step (calm & dramatic)
    this.winner = null;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.cellW = this.width / this.cols;
    this.cellH = this.height / this.rows;
  }

  setupGame(selectedCountries, countryCount = 20) {
    this.countries = [];
    this.eliminated = [];
    this.particles = [];
    this.floatingTexts = [];
    this.winner = null;
    this.roundTime = 0;

    let pool = [...selectedCountries];
    if (pool.length < countryCount) {
      while (pool.length < countryCount) {
        pool.push(window.FlagManager.getRandomCountry());
      }
    } else {
      pool = pool.slice(0, countryCount);
    }

    // Initialize blank grid with ocean / neutral land
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = {
          countryCode: null,
          troops: 0,
          isCapital: false,
          color: '#101726',
          flash: 0
        };
      }
    }

    // Place country capitals distributed across the vertical map
    this.countries = pool.map((country, idx) => {
      // Find a nicely spaced spot
      let placed = false;
      let cr = 0, cc = 0;
      let attempts = 0;

      while (!placed && attempts < 100) {
        cr = Math.floor(3 + Math.random() * (this.rows - 6));
        cc = Math.floor(3 + Math.random() * (this.cols - 6));

        // Check distance to existing capitals
        let tooClose = false;
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (this.grid[r][c].isCapital) {
              const d = Math.hypot(r - cr, c - cc);
              if (d < 5) tooClose = true;
            }
          }
        }

        if (!tooClose) placed = true;
        attempts++;
      }

      // Claim capital cell and 3x3 surrounding
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            this.grid[nr][nc].countryCode = country.code;
            this.grid[nr][nc].troops = 10;
            this.grid[nr][nc].color = country.color || '#3b82f6';
          }
        }
      }

      this.grid[cr][cc].isCapital = true;
      this.grid[cr][cc].troops = 25;

      return {
        country: country,
        capitalRow: cr,
        capitalCol: cc,
        troops: 60,
        cellsCount: 9,
        percent: 0,
        kills: 0,
        alive: true,
        boostMultiplier: 1.0,
        boostUntil: 0
      };
    });

    this.calculateTerritoryStats();
    this.onEvent('update_alive', { alive: this.countries.length, total: this.countries.length });
  }

  start() {
    this.isRunning = true;
    this.lastTick = performance.now();
  }

  pause() {
    this.isRunning = false;
  }

  setSpeed(speed) {
    this.gameSpeed = speed;
  }

  boostCountry(countryCode, boostAmount = 50) {
    const cObj = this.countries.find(c => c.country.code.toLowerCase() === countryCode.toLowerCase() && c.alive);
    if (!cObj) return false;

    cObj.troops += boostAmount;
    cObj.boostMultiplier = 2.0;
    cObj.boostUntil = this.roundTime + 8;

    const capX = (cObj.capitalCol + 0.5) * this.cellW;
    const capY = (cObj.capitalRow + 0.5) * this.cellH;
    this.addFloatingText(capX, capY, `+${boostAmount} TROOPS! 💥`, '#ffd700');
    window.SoundEngine.playPowerup();

    // Flash capital
    if (this.grid[cObj.capitalRow] && this.grid[cObj.capitalRow][cObj.capitalCol]) {
      this.grid[cObj.capitalRow][cObj.capitalCol].flash = 1.0;
    }

    return true;
  }

  triggerRandomEvent() {
    const events = ['meteor', 'rebellion', 'reinforcements'];
    const chosen = events[Math.floor(Math.random() * events.length)];

    if (chosen === 'meteor') {
      const mr = Math.floor(Math.random() * this.rows);
      const mc = Math.floor(Math.random() * this.cols);
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const r = mr + dr;
          const c = mc + dc;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            this.grid[r][c].countryCode = null;
            this.grid[r][c].troops = 0;
            this.grid[r][c].color = '#101726';
            this.grid[r][c].flash = 1.0;
          }
        }
      }
      this.addFloatingText(mc * this.cellW, mr * this.cellH, "☄️ METEOR STRIKE!", "#ff0055");
      window.SoundEngine.playElimination();
    } else if (chosen === 'reinforcements') {
      const active = this.countries.filter(c => c.alive);
      if (active.length > 0) {
        const randC = active[Math.floor(Math.random() * active.length)];
        this.boostCountry(randC.country.code, 80);
      }
    }
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1.0,
      vy: -1.0,
      life: 1.2
    });
  }

  simulationStep() {
    const activeCountries = this.countries.filter(c => c.alive);
    if (activeCountries.length <= 1) return;

    // 1. Army production
    activeCountries.forEach(c => {
      const bonus = (c.boostUntil > this.roundTime) ? 2.5 : 1.0;
      c.troops += Math.max(1, Math.floor((c.cellsCount * 0.15 + 1) * bonus));
    });

    // 2. Frontline attacks
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // Shuffle countries for fair order
    const shuffled = [...activeCountries].sort(() => Math.random() - 0.5);

    shuffled.forEach(c => {
      if (c.troops < 5) return;

      // Find all frontier cells for this country
      const frontiers = [];
      for (let r = 0; r < this.rows; r++) {
        for (let col = 0; col < this.cols; col++) {
          if (this.grid[r][col].countryCode === c.country.code) {
            // Check neighbors
            for (const [dr, dc] of directions) {
              const nr = r + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if (this.grid[nr][nc].countryCode !== c.country.code) {
                  frontiers.push({ fromR: r, fromC: col, toR: nr, toC: nc, target: this.grid[nr][nc] });
                }
              }
            }
          }
        }
      }

      if (frontiers.length === 0) return;

      // Pick a random frontier border to attack
      const attackCount = Math.min(frontiers.length, Math.floor(1 + Math.random() * 3));
      for (let a = 0; a < attackCount; a++) {
        if (c.troops < 4) break;

        const border = frontiers[Math.floor(Math.random() * frontiers.length)];
        const sendTroops = Math.min(c.troops - 1, Math.floor(3 + Math.random() * 8));
        c.troops -= sendTroops;

        const targetCode = border.target.countryCode;
        const targetDefense = border.target.troops;

        // Attack roll
        const attackPower = sendTroops * (0.8 + Math.random() * 0.6);
        const defensePower = targetDefense * (0.8 + Math.random() * 0.6);

        if (attackPower > defensePower) {
          // Territory Conquered!
          const prevOwner = targetCode;
          border.target.countryCode = c.country.code;
          border.target.troops = Math.max(1, Math.floor(attackPower - defensePower));
          border.target.color = c.country.color || '#3b82f6';
          border.target.flash = 0.8;

          // Sound effect
          if (Math.random() < 0.2) {
            window.SoundEngine.playBounce(0.6);
          }

          // Capital capture?
          if (border.target.isCapital && prevOwner) {
            border.target.isCapital = false;
            c.kills++;
            this.addFloatingText((border.toC + 0.5) * this.cellW, (border.toR + 0.5) * this.cellH, "⭐ CAPITAL TAKEN!", "#ffd700");
          }
        } else {
          // Attack repelled
          border.target.troops = Math.max(1, Math.floor(defensePower - attackPower));
          border.target.flash = 0.4;
        }
      }
    });

    // 3. Recalculate stats & check eliminations
    this.calculateTerritoryStats();

    // Check eliminations
    this.countries.forEach(c => {
      if (c.alive && c.cellsCount === 0) {
        c.alive = false;
        this.eliminated.unshift(c);
        window.SoundEngine.playElimination();

        const aliveCount = this.countries.filter(c => c.alive).length;
        this.onEvent('kill', {
          victim: c.country,
          killer: 'Border Conquest',
          alive: aliveCount,
          total: this.countries.length
        });
        this.onEvent('update_alive', { alive: aliveCount, total: this.countries.length });
      }
    });

    // Check winner
    const remaining = this.countries.filter(c => c.alive);
    if (remaining.length === 1 && !this.winner && this.countries.length > 1) {
      this.winner = remaining[0];
      this.handleVictory(this.winner);
    }
  }

  calculateTerritoryStats() {
    const totalCells = this.cols * this.rows;
    const counts = {};

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const code = this.grid[r][c].countryCode;
        if (code) {
          counts[code] = (counts[code] || 0) + 1;
        }
      }
    }

    this.countries.forEach(c => {
      c.cellsCount = counts[c.country.code] || 0;
      c.percent = ((c.cellsCount / totalCells) * 100).toFixed(1);
    });
  }

  handleVictory(winner) {
    window.SoundEngine.playVictory();

    for (let i = 0; i < 80; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: ['#ffd700', '#ff0055', '#00f0ff', '#22c55e'][i % 4],
        radius: 4 + Math.random() * 4,
        life: 2.5,
        decay: 0.015
      });
    }

    this.onEvent('victory', {
      country: winner.country,
      kills: winner.kills,
      damage: winner.cellsCount
    });
  }

  update(dt) {
    if (!this.isRunning) return;

    this.roundTime += dt * this.gameSpeed;

    // Simulation Tick
    const interval = this.tickInterval / this.gameSpeed;
    if (performance.now() - this.lastTick >= interval) {
      this.simulationStep();
      this.lastTick = performance.now();
    }

    // Occasional random event
    if (Math.random() < 0.003 * this.gameSpeed) {
      this.triggerRandomEvent();
    }

    // Decay cell flashes
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].flash > 0) {
          this.grid[r][c].flash -= dt * 2.5 * this.gameSpeed;
        }
      }
    }

    // Update floating texts
    for (let t = this.floatingTexts.length - 1; t >= 0; t--) {
      const ft = this.floatingTexts[t];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= (1 / ft.life) * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(t, 1);
      }
    }

    // Update particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.x += part.vx * dt * 60;
      part.y += part.vy * dt * 60;
      part.life -= part.decay * dt * 60;
      if (part.life <= 0) {
        this.particles.splice(p, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Map Cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const x = c * this.cellW;
        const y = r * this.cellH;

        if (cell.countryCode) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(x, y, this.cellW + 0.5, this.cellH + 0.5);

          // Flash highlight if recently conquered
          if (cell.flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${cell.flash * 0.7})`;
            ctx.fillRect(x, y, this.cellW, this.cellH);
          }
        } else {
          // Ocean / Neutral grid background
          ctx.fillStyle = (r + c) % 2 === 0 ? '#0b1120' : '#0e1628';
          ctx.fillRect(x, y, this.cellW, this.cellH);
        }
      }
    }

    // 2. Subtle Grid Border Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= this.rows; r += 2) {
      ctx.beginPath();
      ctx.moveTo(0, r * this.cellH);
      ctx.lineTo(this.width, r * this.cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c += 2) {
      ctx.beginPath();
      ctx.moveTo(c * this.cellW, 0);
      ctx.lineTo(c * this.cellW, this.height);
      ctx.stroke();
    }

    // 3. Render Capital Badges & Flag Icons
    this.countries.filter(c => c.alive).forEach(cObj => {
      const capX = (cObj.capitalCol + 0.5) * this.cellW;
      const capY = (cObj.capitalRow + 0.5) * this.cellH;

      // Draw country badge
      window.FlagManager.drawCircularFlag(ctx, cObj.country, capX, capY, 14, '#ffffff', 2);

      // Draw army troops tag
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(capX - 18, capY + 14, 36, 13);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚔️${cObj.troops}`, capX, capY + 20);
    });

    // 4. Render Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 5. Render Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    });

    // 6. Winner Banner
    if (this.winner) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌍👑', this.width / 2, this.height / 2 - 80);

      window.FlagManager.drawCircularFlag(ctx, this.winner.country, this.width / 2, this.height / 2, 65, '#ffd700', 6);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.fillText(this.winner.country.name.toUpperCase(), this.width / 2, this.height / 2 + 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText(`CONQUERED THE WORLD! (100%)`, this.width / 2, this.height / 2 + 115);
      ctx.restore();
    }
  }

  getLeaderboard() {
    return [...this.countries].sort((a, b) => {
      if (a.alive && !b.alive) return -1;
      if (!a.alive && b.alive) return 1;
      return b.cellsCount - a.cellsCount || b.troops - a.troops;
    });
  }
}

window.TerritoryWar = TerritoryWar;
