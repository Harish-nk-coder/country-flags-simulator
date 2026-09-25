/**
 * Country Elimination Roulette Wheel
 * Smooth physics wheel with flag wedges, peg ticks, and survivor battle royale elimination.
 */

class WheelRoulette {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});

    this.width = canvas.width;
    this.height = canvas.height;

    this.countries = [];
    this.eliminated = [];
    this.particles = [];
    this.floatingTexts = [];

    this.angle = 0;
    this.angularVelocity = 0;
    this.friction = 0.985;
    this.isSpinning = false;
    this.isRunning = false;
    this.lastTickIndex = -1;

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = Math.min(this.width, this.height) * 0.42;

    this.pointerAngle = -Math.PI / 2; // Top pointer
    this.pointerDeflect = 0;

    this.winner = null;
    this.mode = 'eliminate'; // 'eliminate' or 'survive'
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
    this.radius = Math.min(w, h) * 0.42;
  }

  setupGame(selectedCountries, count = 24) {
    this.countries = [];
    this.eliminated = [];
    this.particles = [];
    this.floatingTexts = [];
    this.winner = null;
    this.angle = 0;
    this.angularVelocity = 0;
    this.isSpinning = false;

    let pool = [...selectedCountries];
    if (pool.length < count) {
      while (pool.length < count) {
        pool.push(window.FlagManager.getRandomCountry());
      }
    } else {
      pool = pool.slice(0, count);
    }

    this.countries = pool.map(country => ({
      country: country,
      alive: true,
      spinsWon: 0,
      kills: 0
    }));

    this.onEvent('update_alive', { alive: this.countries.length, total: this.countries.length });
  }

  start() {
    this.isRunning = true;
    if (!this.isSpinning && this.countries.filter(c => c.alive).length > 1) {
      this.spin();
    }
  }

  pause() {
    this.isRunning = false;
    this.angularVelocity = 0;
  }

  setSpeed() {
    // Speed multiplier logic
  }

  spin() {
    const aliveList = this.countries.filter(c => c.alive);
    if (aliveList.length <= 1) return;

    this.isSpinning = true;
    // Smooth initial angular velocity with suspenseful spin
    this.angularVelocity = 0.22 + Math.random() * 0.12;
    window.SoundEngine.playBounce(1.0);
  }

  boostCountry(countryCode) {
    const cObj = this.countries.find(c => c.country.code.toLowerCase() === countryCode.toLowerCase() && c.alive);
    if (!cObj) return false;

    cObj.spinsWon++;
    this.addFloatingText(this.centerX, this.centerY, `✨ ${cObj.country.name} CHEERED!`, '#ffd700');
    window.SoundEngine.playPowerup();
    return true;
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1.0,
      vy: -1.2,
      life: 1.4
    });
  }

  getSelectedCountryIndex() {
    const aliveList = this.countries.filter(c => c.alive);
    if (aliveList.length === 0) return -1;

    const sliceAngle = (Math.PI * 2) / aliveList.length;
    // Normalize wheel angle
    let norm = (this.pointerAngle - this.angle) % (Math.PI * 2);
    if (norm < 0) norm += Math.PI * 2;

    const index = Math.floor(norm / sliceAngle) % aliveList.length;
    return index;
  }

  onWheelStop() {
    this.isSpinning = false;
    const aliveList = this.countries.filter(c => c.alive);
    if (aliveList.length <= 1) return;

    const selectedIdx = this.getSelectedCountryIndex();
    const target = aliveList[selectedIdx];
    if (!target) return;

    // Eliminate target
    target.alive = false;
    target.rank = aliveList.length;
    this.eliminated.unshift(target);

    window.SoundEngine.playElimination();

    // Explosion particles at pointer
    const ptrX = this.centerX + Math.cos(this.pointerAngle) * (this.radius + 10);
    const ptrY = this.centerY + Math.sin(this.pointerAngle) * (this.radius + 10);

    for (let i = 0; i < 30; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 7;
      this.particles.push({
        x: ptrX,
        y: ptrY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: target.country.color || '#ff0055',
        radius: 3 + Math.random() * 4,
        life: 1.2,
        decay: 0.02
      });
    }

    const remainingCount = this.countries.filter(c => c.alive).length;
    this.addFloatingText(this.centerX, this.centerY - 20, `💥 ${target.country.name.toUpperCase()} ELIMINATED!`, '#ff0055');

    this.onEvent('kill', {
      victim: target.country,
      killer: 'The Roulette Wheel',
      rank: target.rank,
      alive: remainingCount,
      total: this.countries.length
    });

    this.onEvent('update_alive', { alive: remainingCount, total: this.countries.length });

    // Check winner
    if (remainingCount === 1) {
      this.winner = this.countries.find(c => c.alive);
      this.handleVictory(this.winner);
    } else if (this.isRunning) {
      // Auto spin next round after 1.8 seconds delay
      setTimeout(() => {
        if (this.isRunning && !this.winner) {
          this.spin();
        }
      }, 1600);
    }
  }

  handleVictory(winner) {
    window.SoundEngine.playVictory();

    for (let i = 0; i < 90; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 9;
      this.particles.push({
        x: this.centerX,
        y: this.centerY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: ['#ffd700', '#ff0055', '#00f0ff', '#22c55e'][i % 4],
        radius: 4 + Math.random() * 5,
        life: 2.5,
        decay: 0.015
      });
    }

    this.onEvent('victory', {
      country: winner.country,
      kills: 0,
      damage: 0
    });
  }

  update(dt) {
    if (this.isSpinning) {
      this.angle += this.angularVelocity * dt * 60;
      this.angularVelocity *= Math.pow(this.friction, dt * 60);

      // Tick sound check
      const aliveList = this.countries.filter(c => c.alive);
      if (aliveList.length > 0) {
        const sliceAngle = (Math.PI * 2) / aliveList.length;
        const currentIdx = Math.floor(((this.pointerAngle - this.angle) % (Math.PI * 2) + Math.PI * 2) / sliceAngle) % aliveList.length;

        if (currentIdx !== this.lastTickIndex) {
          this.lastTickIndex = currentIdx;
          this.pointerDeflect = 0.25;
          window.SoundEngine.playWheelTick(1.0 + Math.random() * 0.3);
        }
      }

      // Pointer spring return
      this.pointerDeflect *= 0.85;

      // Wheel stopped
      if (this.angularVelocity < 0.003) {
        this.angularVelocity = 0;
        this.onWheelStop();
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

    // Update floating texts
    for (let t = this.floatingTexts.length - 1; t >= 0; t--) {
      const ft = this.floatingTexts[t];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= (1 / ft.life) * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(t, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Background
    const bgGrad = ctx.createRadialGradient(this.centerX, this.centerY, 30, this.centerX, this.centerY, this.width * 0.7);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    const aliveList = this.countries.filter(c => c.alive);

    if (aliveList.length > 0) {
      const sliceAngle = (Math.PI * 2) / aliveList.length;

      // 2. Wheel Outer Ring Glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // 3. Render Slices
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.angle);

      aliveList.forEach((item, idx) => {
        const startAng = idx * sliceAngle;
        const endAng = startAng + sliceAngle;

        // Draw Wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.radius, startAng, endAng);
        ctx.closePath();
        ctx.fillStyle = item.country.color || '#3b82f6';
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Flag & Text inside slice
        ctx.save();
        ctx.rotate(startAng + sliceAngle / 2);
        
        // Position along the radius
        const flagDist = this.radius * 0.65;
        window.FlagManager.drawCircularFlag(ctx, item.country, flagDist, 0, 15, '#ffffff', 2);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(item.country.name.substring(0, 10), this.radius * 0.45, 0);

        ctx.restore();
      });

      ctx.restore();

      // 4. Center Gold Hub
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 36, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPIN', this.centerX, this.centerY);
      ctx.restore();

      // 5. Pointer Indicator at top
      ctx.save();
      const ptrLength = 32;
      const topY = this.centerY - this.radius + 6;

      ctx.translate(this.centerX, topY);
      ctx.rotate(this.pointerDeflect);

      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(-14, -ptrLength);
      ctx.lineTo(14, -ptrLength);
      ctx.closePath();
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pointer jewel
      ctx.beginPath();
      ctx.arc(0, -ptrLength + 8, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();

      ctx.restore();
    }

    // 6. Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 7. Particles
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

    // 8. Winner Banner
    if (this.winner) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑🎰', this.centerX, this.centerY - 80);

      window.FlagManager.drawCircularFlag(ctx, this.winner.country, this.centerX, this.centerY, 65, '#ffd700', 6);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.fillText(this.winner.country.name.toUpperCase(), this.centerX, this.centerY + 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText(`SURVIVED THE ROULETTE!`, this.centerX, this.centerY + 115);
      ctx.restore();
    }
  }

  getLeaderboard() {
    return [...this.countries].sort((a, b) => {
      if (a.alive && !b.alive) return -1;
      if (!a.alive && b.alive) return 1;
      return (a.rank || 999) - (b.rank || 999);
    });
  }
}

window.WheelRoulette = WheelRoulette;
