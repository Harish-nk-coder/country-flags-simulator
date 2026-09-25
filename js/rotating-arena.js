/**
 * Rotating Circle Gravity Flag Battle (Authentic YouTube Live Format)
 * 198 country flags bouncing inside a rotating ring with an escape gap!
 */

class RotatingArena {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});

    this.width = canvas.width;
    this.height = canvas.height;

    this.centerX = this.width / 2;
    this.centerY = this.height * 0.44;
    this.ringRadius = Math.min(this.width * 0.44, 210);

    this.ringAngle = 0;
    this.ringSpeed = 0.007; // smooth rotation
    this.gapSize = 0.85; // radians gap opening (~48 degrees)

    this.gravity = 0.0; // ZERO-G: Flags float and drift across the entire arena!
    this.restitution = 0.95;
    this.friction = 0.999;

    this.flags = [];
    this.qualified = [];
    this.particles = [];
    this.floatingTexts = [];

    this.isRunning = false;
    this.gameSpeed = 1.0;
    this.roundTime = 0;
    this.timerSeconds = 22 * 60 + 26; // 22:26 timer
    this.roundNumber = 1;
    this.targetQualifiers = 70;
    this.winner = null;
    this.galleryDirty = true;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.centerX = w / 2;
    this.centerY = h * 0.44;
    this.ringRadius = Math.min(w * 0.44, 210);
    this.galleryDirty = true;
  }

  setupGame(countries) {
    this.flags = [];
    this.qualified = [];
    this.particles = [];
    this.floatingTexts = [];
    this.winner = null;
    this.roundTime = 0;
    this.ringAngle = Math.PI * 0.5;
    this.galleryDirty = true;

    const allCountries = countries || window.FlagManager.getAll();

    // Spawn all 198 country flags evenly distributed across the circular area
    allCountries.forEach((country, index) => {
      const r = Math.sqrt(Math.random()) * (this.ringRadius * 0.82);
      const theta = Math.random() * Math.PI * 2;
      const x = this.centerX + Math.cos(theta) * r;
      const y = this.centerY + Math.sin(theta) * r;

      const floatAngle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * 0.9;

      this.flags.push({
        id: `${country.code}-${index}`,
        country: country,
        x: x,
        y: y,
        vx: Math.cos(floatAngle) * speed,
        vy: Math.sin(floatAngle) * speed,
        width: 22,
        height: 14,
        radius: 10,
        mass: 1.0,
        angle: (Math.random() - 0.5) * 0.4,
        angularVelocity: (Math.random() - 0.5) * 0.03,
        alive: true,
        escaped: false,
        escapeTime: 0,
        rank: null
      });
    });

    this.onEvent('update_alive', { alive: this.flags.length, total: this.flags.length });
  }

  start() {
    this.isRunning = true;
  }

  pause() {
    this.isRunning = false;
  }

  setSpeed(speed) {
    this.gameSpeed = speed;
  }

  boostCountry(countryCode) {
    const flag = this.flags.find(f => f.country.code.toLowerCase() === countryCode.toLowerCase() && f.alive);
    if (!flag) return false;

    // Boost flag with extra floating momentum
    const boostAngle = Math.random() * Math.PI * 2;
    flag.vx = Math.cos(boostAngle) * 3.5;
    flag.vy = Math.sin(boostAngle) * 3.5;

    this.addFloatingText(flag.x, flag.y, `⚡ ${flag.country.name.toUpperCase()} BOOST!`, '#ffd700');
    window.SoundEngine.playPowerup();

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: flag.x,
        y: flag.y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: flag.country.color || '#ffd700',
        radius: 3,
        life: 0.8,
        decay: 0.04
      });
    }
    return true;
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    if (this.floatingTexts.length > 3) {
      this.floatingTexts.shift();
    }
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1.0,
      vy: -1.0,
      life: 0.8
    });
  }

  qualifyFlag(flag) {
    if (!flag.alive || flag.escaped) return;
    flag.alive = false;
    flag.escaped = true;
    flag.escapeTime = this.roundTime;
    flag.rank = this.qualified.length + 1;

    this.qualified.push(flag);
    this.galleryDirty = true;
    window.SoundEngine.playPowerup();

    // Spawn escape celebration particles
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: flag.x,
        y: flag.y,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 1,
        color: ['#ffd700', '#00f0ff', '#22c55e', '#ffffff'][i % 4],
        radius: 3.5,
        life: 1.0,
        decay: 0.03
      });
    }

    this.addFloatingText(flag.x, flag.y, `#${flag.rank} ${flag.country.name} WIN!`, '#22c55e');

    const remainingCount = this.flags.filter(f => f.alive).length;
    this.onEvent('kill', {
      victim: flag.country,
      killer: `Qualified #${flag.rank}`,
      rank: flag.rank,
      alive: remainingCount,
      total: this.flags.length
    });

    this.onEvent('update_alive', { alive: remainingCount, total: this.flags.length });

    // Check if target reached or 1 remaining
    if (this.qualified.length >= this.targetQualifiers || remainingCount <= 1) {
      if (remainingCount === 1 && !this.winner) {
        this.winner = this.flags.find(f => f.alive);
        this.handleVictory(this.winner);
      }
    }
  }

  handleVictory(winner) {
    window.SoundEngine.playVictory();
    this.onEvent('victory', {
      country: winner.country,
      kills: this.qualified.length,
      damage: 100
    });
  }

  update(dt) {
    if (!this.isRunning) return;

    const effectiveDt = dt * this.gameSpeed;
    this.roundTime += effectiveDt;

    // Rotate the circular cage
    this.ringAngle += this.ringSpeed * effectiveDt * 60;
    if (this.ringAngle > Math.PI * 2) this.ringAngle -= Math.PI * 2;

    const aliveFlags = this.flags.filter(f => f.alive);

    // Physics step - Zero-G Floating Drift
    aliveFlags.forEach(flag => {
      // Natural gentle damping
      flag.vx *= 0.998;
      flag.vy *= 0.998;

      // Speed clamping & min floating speed so flags never stall
      const currentSpeed = Math.hypot(flag.vx, flag.vy);
      const maxSpeed = 2.4;
      if (currentSpeed > maxSpeed) {
        flag.vx = (flag.vx / currentSpeed) * maxSpeed;
        flag.vy = (flag.vy / currentSpeed) * maxSpeed;
      } else if (currentSpeed < 0.6) {
        const ang = Math.random() * Math.PI * 2;
        flag.vx += Math.cos(ang) * 0.25;
        flag.vy += Math.sin(ang) * 0.25;
      }

      // Integrate position
      flag.x += flag.vx * effectiveDt * 60;
      flag.y += flag.vy * effectiveDt * 60;

      flag.angle += flag.angularVelocity * effectiveDt * 60;
      flag.angularVelocity *= 0.97;

      // Distance from center of rotating circle
      const dx = flag.x - this.centerX;
      const dy = flag.y - this.centerY;
      const dist = Math.hypot(dx, dy);

      // Check collision with outer ring
      if (dist + flag.radius >= this.ringRadius) {
        // Calculate angle of collision relative to ring rotation
        let contactAngle = Math.atan2(dy, dx);
        let relAngle = (contactAngle - this.ringAngle) % (Math.PI * 2);
        if (relAngle < 0) relAngle += Math.PI * 2;

        // Gap is located between (0 and this.gapSize)
        const inGap = (relAngle >= 0 && relAngle <= this.gapSize);

        if (inGap) {
          // Flag escapes through the gap!
          if (dist >= this.ringRadius + 8) {
            this.qualifyFlag(flag);
          }
        } else {
          // Collide and bounce off solid ring arc
          const overlap = (dist + flag.radius) - this.ringRadius;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Push back inside
          flag.x -= nx * overlap * 1.05;
          flag.y -= ny * overlap * 1.05;

          // Tangential friction from spinning ring
          const tx = -ny;
          const ty = nx;

          const dot = flag.vx * nx + flag.vy * ny;
          if (dot > 0) {
            flag.vx -= 1.9 * dot * nx;
            flag.vy -= 1.9 * dot * ny;

            // Add slight ring rotation nudge
            flag.vx += tx * 0.15;
            flag.vy += ty * 0.15;
            flag.angularVelocity += (Math.random() - 0.5) * 0.05;

            if (Math.hypot(flag.vx, flag.vy) > 1.4 && Math.random() < 0.1) {
              window.SoundEngine.playBounce(0.3);
            }
          }
        }
      }
    });

    // Flag-to-Flag collisions (soft elastic bounce to keep flags floating and spread out)
    const aliveCount = aliveFlags.length;
    for (let i = 0; i < aliveCount; i++) {
      const f1 = aliveFlags[i];
      const r1 = f1.radius;
      for (let j = i + 1; j < aliveCount; j++) {
        const f2 = aliveFlags[j];
        const minDist = r1 + f2.radius;
        const cdx = f2.x - f1.x;
        if (cdx > minDist || cdx < -minDist) continue;
        const cdy = f2.y - f1.y;
        if (cdy > minDist || cdy < -minDist) continue;

        const distSq = cdx * cdx + cdy * cdy;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq && distSq > 0.0001) {
          const cDist = Math.sqrt(distSq);
          const nx = cdx / cDist;
          const ny = cdy / cDist;
          const overlap = (minDist - cDist) * 0.5;

          f1.x -= nx * overlap;
          f1.y -= ny * overlap;
          f2.x += nx * overlap;
          f2.y += ny * overlap;

          const kx = f1.vx - f2.vx;
          const ky = f1.vy - f2.vy;
          const p = 2 * (nx * kx + ny * ky) / (f1.mass + f2.mass);

          f1.vx -= p * f2.mass * nx * 0.85;
          f1.vy -= p * f2.mass * ny * 0.85;
          f2.vx += p * f1.mass * nx * 0.85;
          f2.vy += p * f1.mass * ny * 0.85;
        }
      }
    }

    // Update escaping flags (glide down smoothly)
    this.flags.filter(f => f.escaped).forEach(flag => {
      flag.y += 3.5 * effectiveDt * 60;
    });

    // Update particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.x += part.vx * effectiveDt * 60;
      part.y += part.vy * effectiveDt * 60;
      part.life -= part.decay * effectiveDt * 60;
      if (part.life <= 0) {
        this.particles.splice(p, 1);
      }
    }

    // Update floating texts
    for (let t = this.floatingTexts.length - 1; t >= 0; t--) {
      const ft = this.floatingTexts[t];
      ft.y += ft.vy * effectiveDt * 60;
      ft.alpha -= (1 / ft.life) * effectiveDt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(t, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Deep Midnight Blue Stream Background
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Top Header Panels (QUALIFIED FOR FINAL & TOP GIFTERS)
    this.renderTopPanels(ctx);

    // 3. Middle Countdown Title
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ELIMINATIONS IN  `, this.width / 2 - 25, this.centerY - this.ringRadius - 16);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`22:26`, this.width / 2 + 35, this.centerY - this.ringRadius - 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText(`${this.qualified.length} / ${this.targetQualifiers} QUALIFIED`, this.width / 2, this.centerY - this.ringRadius - 3);
    ctx.restore();

    // 4. Render Rotating Outer Circle Arc with Gap
    ctx.save();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#ffffff';

    const startArc = this.ringAngle + this.gapSize;
    const endArc = this.ringAngle + Math.PI * 2;

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.ringRadius, startArc, endArc);
    ctx.stroke();

    // Gap highlight markers
    const gapStartX = this.centerX + Math.cos(this.ringAngle) * this.ringRadius;
    const gapStartY = this.centerY + Math.sin(this.ringAngle) * this.ringRadius;
    const gapEndX = this.centerX + Math.cos(startArc) * this.ringRadius;
    const gapEndY = this.centerY + Math.sin(startArc) * this.ringRadius;

    ctx.beginPath();
    ctx.arc(gapStartX, gapStartY, 4, 0, Math.PI * 2);
    ctx.arc(gapEndX, gapEndY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.restore();

    // 5. Render Active Flag Rectangles
    const aliveFlags = this.flags.filter(f => f.alive);
    aliveFlags.forEach(flag => {
      ctx.save();
      ctx.translate(flag.x, flag.y);
      if (flag.angle !== 0) {
        ctx.rotate(flag.angle);
      }
      window.FlagManager.drawRectFlag(ctx, flag.country, 0, 0, flag.width, flag.height, 2, '#ffffff', 1.2);
      ctx.restore();
    });

    // 6. Escaping Flags Animation
    this.flags.filter(f => f.escaped && f.y < this.height).forEach(flag => {
      ctx.save();
      ctx.translate(flag.x, flag.y);
      window.FlagManager.drawRectFlag(ctx, flag.country, 0, 0, flag.width, flag.height, 2, '#ffd700', 2);
      ctx.restore();
    });

    // 7. Render Particles & Floating Texts
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });

    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 8. Bottom Progress Bar & Flag Grid
    this.renderBottomGallery(ctx);

    // 9. Winner Celebration if completed
    if (this.winner) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑🏆', this.width / 2, this.height / 2 - 80);

      window.FlagManager.drawRectFlag(ctx, this.winner.country, this.width / 2, this.height / 2, 70, 45, 6, '#ffd700', 4);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(this.winner.country.name.toUpperCase(), this.width / 2, this.height / 2 + 65);

      ctx.fillStyle = '#ffffff';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText(`ULTIMATE SURVIVOR!`, this.width / 2, this.height / 2 + 95);
      ctx.restore();
    }
  }

  renderTopPanels(ctx) {
    const pad = 12;
    const panelW = (this.width - pad * 3) / 2;
    const panelH = 110;
    const topY = 12;

    // --- Left Box: QUALIFIED FOR FINAL ---
    ctx.save();
    ctx.fillStyle = 'rgba(10, 18, 38, 0.85)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pad, topY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();

    // Box Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUALIFIED FOR FINAL', pad + panelW / 2, topY + 16);

    // Last 4 Qualified Items
    const recent = [...this.qualified].slice(-4).reverse();
    const itemH = 18;
    recent.forEach((item, idx) => {
      const iy = topY + 32 + idx * itemH;

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`#${item.rank}`, pad + 8, iy);

      window.FlagManager.drawRectFlag(ctx, item.country, pad + 38, iy - 3, 14, 9, 1, '#ffffff', 0.5);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '600 9px Inter, sans-serif';
      ctx.fillText(item.country.name.substring(0, 10), pad + 52, iy);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('WIN', pad + panelW - 8, iy);
    });
    ctx.restore();

    // --- Right Box: TOP GIFTERS ---
    ctx.save();
    const rx = pad * 2 + panelW;
    ctx.fillStyle = 'rgba(10, 18, 38, 0.85)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rx, topY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💎 TOP GIFTERS', rx + 10, topY + 16);

    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 9px Inter, sans-serif';
    ctx.fillText('No gifts yet · Type !boost', rx + 10, topY + 36);
    ctx.restore();
  }

  updateGalleryCache() {
    if (!this.galleryCanvas) {
      this.galleryCanvas = document.createElement('canvas');
    }
    const cols = 22;
    const rows = 9;
    const iconW = 15;
    const iconH = 10;
    const spacingX = (this.width - 24) / cols;
    const spacingY = 13;

    this.galleryCanvas.width = this.width;
    this.galleryCanvas.height = rows * spacingY + 10;
    const gCtx = this.galleryCanvas.getContext('2d');
    gCtx.clearRect(0, 0, this.galleryCanvas.width, this.galleryCanvas.height);

    const allFlags = this.flags;
    allFlags.forEach((flag, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      if (row >= rows) return;

      const gx = 16 + col * spacingX + iconW / 2;
      const gy = row * spacingY + iconH / 2 + 2;

      if (flag.alive) {
        window.FlagManager.drawRectFlag(gCtx, flag.country, gx, gy, iconW, iconH, 1, 'rgba(255,255,255,0.4)', 0.5);
      } else {
        gCtx.globalAlpha = 0.22;
        window.FlagManager.drawRectFlag(gCtx, flag.country, gx, gy, iconW, iconH, 1, '#000000', 0.5);
        gCtx.globalAlpha = 1.0;
      }
    });

    this.galleryDirty = false;
  }

  renderBottomGallery(ctx) {
    const bottomY = this.centerY + this.ringRadius + 14;
    const barW = this.width - 40;
    const barX = 20;

    // Yellow / Amber Progress Bar
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, bottomY, barW, 5);

    const remainingCount = this.flags.filter(f => f.alive).length;
    const pct = remainingCount / (this.flags.length || 1);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(barX, bottomY, barW * pct, 5);

    // Counter Text
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${remainingCount} / ${this.flags.length} FLAGS LEFT`, this.width / 2, bottomY + 18);
    ctx.restore();

    // 198 Flags Grid Matrix Cached Draw
    const gridTop = bottomY + 28;
    if (this.galleryDirty || !this.galleryCanvas) {
      this.updateGalleryCache();
    }
    if (this.galleryCanvas) {
      ctx.drawImage(this.galleryCanvas, 0, gridTop);
    }

    // Footer Titles
    const rows = 9;
    const spacingY = 13;
    const footerY = gridTop + rows * spacingY + 26;
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${this.roundNumber} · ${this.targetQualifiers - this.qualified.length} SPOTS LEFT`, this.width / 2, footerY);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px Inter, sans-serif';
    ctx.fillText('COUNTRY FLAG BATTLE', this.width / 2, footerY + 24);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(`ROUND ${this.roundNumber} · QUALIFYING`, this.width / 2, footerY + 40);
    ctx.restore();
  }

  getLeaderboard() {
    // Show top qualified first, then remaining
    return [...this.qualified].reverse().map(f => ({
      country: f.country,
      alive: false,
      rank: f.rank,
      percent: 0,
      kills: 0
    }));
  }
}

window.RotatingArena = RotatingArena;
