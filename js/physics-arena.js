/**
 * Physics Battle Royale Arena (Flag Ball Arena)
 * High-speed 2D physics simulation with shrinking zone, obstacles, powerups, and kill feed.
 */

class PhysicsArena {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});

    this.width = canvas.width;
    this.height = canvas.height;

    this.balls = [];
    this.eliminated = [];
    this.particles = [];
    this.powerups = [];
    this.obstacles = [];
    this.floatingTexts = [];

    this.isRunning = false;
    this.isSlowMo = false;
    this.slowMoFactor = 0.25;
    this.gameSpeed = 1.0;

    // Arena Zone (Shrinking circle)
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.initialRadius = Math.min(this.width, this.height) * 0.46;
    this.currentRadius = this.initialRadius;
    this.targetRadius = 50;
    this.shrinkSpeed = 0.85; // smooth suspenseful shrink speed
    this.zoneWarning = false;

    this.roundTime = 0;
    this.lastTimestamp = 0;
    this.winner = null;

    this.initObstacles();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
    this.initialRadius = Math.min(w, h) * 0.46;
    if (!this.isRunning) {
      this.currentRadius = this.initialRadius;
    }
    this.initObstacles();
  }

  initObstacles() {
    this.obstacles = [
      // Center spinning hazard cross
      { type: 'spinner', x: this.centerX, y: this.centerY, radius: 45, angle: 0, speed: 0.02, arms: 4 },
      // Corner pinball bouncers
      { type: 'bumper', x: this.centerX - this.width * 0.26, y: this.centerY - this.height * 0.2, radius: 24, force: 4.5 },
      { type: 'bumper', x: this.centerX + this.width * 0.26, y: this.centerY - this.height * 0.2, radius: 24, force: 4.5 },
      { type: 'bumper', x: this.centerX - this.width * 0.26, y: this.centerY + this.height * 0.2, radius: 24, force: 4.5 },
      { type: 'bumper', x: this.centerX + this.width * 0.26, y: this.centerY + this.height * 0.2, radius: 24, force: 4.5 },
      // Gravity vortex in center
      { type: 'vortex', x: this.centerX, y: this.centerY, radius: 30, pull: 0.06 }
    ];
  }

  setupGame(selectedCountries, ballCount = 40) {
    this.balls = [];
    this.eliminated = [];
    this.particles = [];
    this.powerups = [];
    this.floatingTexts = [];
    this.currentRadius = this.initialRadius;
    this.roundTime = 0;
    this.winner = null;
    this.isSlowMo = false;

    // Pick countries
    let pool = [...selectedCountries];
    if (pool.length < ballCount) {
      while (pool.length < ballCount) {
        pool.push(window.FlagManager.getRandomCountry());
      }
    } else {
      pool = pool.slice(0, ballCount);
    }

    // Spawn balls evenly spaced inside initial radius
    const spawnRadius = this.initialRadius * 0.78;
    pool.forEach((country, index) => {
      const angle = (index / pool.length) * Math.PI * 2 + (Math.random() * 0.2);
      const dist = Math.random() * spawnRadius;
      const x = this.centerX + Math.cos(angle) * dist;
      const y = this.centerY + Math.sin(angle) * dist;

      const speed = 0.8 + Math.random() * 0.8;
      const moveAngle = Math.random() * Math.PI * 2;

      this.balls.push({
        id: `${country.code}-${index}`,
        country: country,
        x: x,
        y: y,
        vx: Math.cos(moveAngle) * speed,
        vy: Math.sin(moveAngle) * speed,
        radius: 18,
        baseRadius: 18,
        mass: 1.0,
        hp: 100,
        maxHp: 100,
        kills: 0,
        damageDealt: 0,
        lastHitBy: null,
        shieldUntil: 0,
        boostUntil: 0,
        giantUntil: 0,
        trail: [],
        alive: true,
        rank: null
      });
    });

    this.onEvent('update_alive', { alive: this.balls.length, total: this.balls.length });
  }

  start() {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
  }

  pause() {
    this.isRunning = false;
  }

  setSpeed(speed) {
    this.gameSpeed = speed;
  }

  boostCountry(countryCode, boostType = 'speed') {
    const ball = this.balls.find(b => b.country.code.toLowerCase() === countryCode.toLowerCase() && b.alive);
    if (!ball) return false;

    if (boostType === 'speed') {
      ball.vx *= 2.2;
      ball.vy *= 2.2;
      ball.boostUntil = this.roundTime + 6;
      this.addFloatingText(ball.x, ball.y, `⚡ SPEED BOOST!`, '#00f0ff');
      window.SoundEngine.playPowerup();
    } else if (boostType === 'giant') {
      ball.radius = ball.baseRadius * 1.6;
      ball.mass = 3.5;
      ball.giantUntil = this.roundTime + 8;
      this.addFloatingText(ball.x, ball.y, `👑 TITAN MASS!`, '#ffd700');
      window.SoundEngine.playPowerup();
    } else if (boostType === 'shield') {
      ball.shieldUntil = this.roundTime + 7;
      ball.hp = Math.min(ball.maxHp, ball.hp + 40);
      this.addFloatingText(ball.x, ball.y, `🛡️ SHIELD UP!`, '#22c55e');
      window.SoundEngine.playPowerup();
    }

    // Spawn cheer particles
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: ball.x,
        y: ball.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: ball.country.color || '#ffff00',
        radius: 3 + Math.random() * 3,
        life: 1.0,
        decay: 0.03
      });
    }

    return true;
  }

  spawnPowerup() {
    if (this.powerups.length >= 4) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (this.currentRadius * 0.7);
    const types = ['speed', 'shield', 'giant', 'bomb'];
    const chosen = types[Math.floor(Math.random() * types.length)];

    this.powerups.push({
      type: chosen,
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      radius: 14,
      pulse: 0,
      createdAt: this.roundTime
    });
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1.0,
      vy: -1.2,
      life: 1.2
    });
  }

  update(dt) {
    if (!this.isRunning) return;

    // Apply slow-mo if down to final 2 duel
    const aliveCount = this.balls.filter(b => b.alive).length;
    if (aliveCount === 2 && !this.isSlowMo && this.balls.length > 2) {
      this.isSlowMo = true;
      this.addFloatingText(this.centerX, this.centerY - 50, "🔥 FINAL 1v1 DUEL! 🔥", "#ff0055");
      window.SoundEngine.playZoneAlarm();
    } else if (aliveCount !== 2) {
      this.isSlowMo = false;
    }

    const effectiveDt = dt * this.gameSpeed * (this.isSlowMo ? this.slowMoFactor : 1.0);
    this.roundTime += effectiveDt;

    // Shrink zone
    if (this.currentRadius > this.targetRadius) {
      this.currentRadius = Math.max(this.targetRadius, this.currentRadius - (this.shrinkSpeed * effectiveDt));
    }

    // Spawn random powerups
    if (Math.random() < 0.015 * this.gameSpeed && this.powerups.length < 3) {
      this.spawnPowerup();
    }

    // Update obstacles
    this.obstacles.forEach(obs => {
      if (obs.type === 'spinner') {
        obs.angle += obs.speed * effectiveDt * 60;
      }
    });

    // Update active balls
    const aliveBalls = this.balls.filter(b => b.alive);
    aliveBalls.forEach(ball => {
      // Check buff expirations
      if (ball.giantUntil && this.roundTime > ball.giantUntil) {
        ball.radius = ball.baseRadius;
        ball.mass = 1.0;
        ball.giantUntil = 0;
      }

      // Physics integration
      ball.x += ball.vx * effectiveDt * 60;
      ball.y += ball.vy * effectiveDt * 60;

      // Natural damping & min/max speed clamping
      ball.vx *= 0.996;
      ball.vy *= 0.996;

      const currentSpeed = Math.hypot(ball.vx, ball.vy);
      const maxSpeed = (ball.boostUntil > this.roundTime) ? 5.5 : 3.2;
      
      if (currentSpeed > maxSpeed) {
        ball.vx = (ball.vx / currentSpeed) * maxSpeed;
        ball.vy = (ball.vy / currentSpeed) * maxSpeed;
      } else if (currentSpeed < 0.6) {
        const ang = Math.random() * Math.PI * 2;
        ball.vx += Math.cos(ang) * 0.3;
        ball.vy += Math.sin(ang) * 0.3;
      }

      // Keep motion trail
      if (currentSpeed > 3.0 || ball.boostUntil > this.roundTime) {
        ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.7 });
        if (ball.trail.length > 8) ball.trail.shift();
      } else if (ball.trail.length > 0) {
        ball.trail.shift();
      }

      // Distance from arena center
      const dx = ball.x - this.centerX;
      const dy = ball.y - this.centerY;
      const distFromCenter = Math.hypot(dx, dy);

      // Outside the safe zone ring? Take zone damage & bounce softly inward
      if (distFromCenter + ball.radius > this.currentRadius) {
        const overlap = (distFromCenter + ball.radius) - this.currentRadius;
        const normX = dx / (distFromCenter || 1);
        const normY = dy / (distFromCenter || 1);

        // Push back inside
        ball.x -= normX * overlap * 1.05;
        ball.y -= normY * overlap * 1.05;

        // Reflect velocity with damping (no speed increase)
        const dot = ball.vx * normX + ball.vy * normY;
        if (dot > 0) {
          ball.vx -= 1.8 * dot * normX;
          ball.vy -= 1.8 * dot * normY;
        }

        // Zone Burn Damage
        if (!ball.shieldUntil || this.roundTime > ball.shieldUntil) {
          const dmg = (12 + (this.initialRadius - this.currentRadius) * 0.06) * effectiveDt;
          ball.hp -= dmg;
          
          if (Math.random() < 0.25) {
            this.particles.push({
              x: ball.x,
              y: ball.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              color: '#ff2a5f',
              radius: 3 + Math.random() * 2,
              life: 0.6,
              decay: 0.05
            });
          }

          if (ball.hp <= 0) {
            this.eliminateBall(ball, ball.lastHitBy || 'The Storm Ring');
          }
        }
      }

      // Check Obstacle Collisions
      this.obstacles.forEach(obs => {
        if (obs.type === 'bumper') {
          const odx = ball.x - obs.x;
          const ody = ball.y - obs.y;
          const oDist = Math.hypot(odx, ody);
          if (oDist < ball.radius + obs.radius) {
            const nx = odx / (oDist || 1);
            const ny = ody / (oDist || 1);
            ball.vx = nx * obs.force;
            ball.vy = ny * obs.force;
            window.SoundEngine.playBounce(1.0);
            this.addFloatingText(obs.x, obs.y, "BOOM!", "#ffff00");
          }
        } else if (obs.type === 'vortex') {
          const vdx = obs.x - ball.x;
          const vdy = obs.y - ball.y;
          const vDist = Math.hypot(vdx, vdy);
          if (vDist < 160 && vDist > 10) {
            const pull = obs.pull * (1 - vDist / 160);
            ball.vx += (vdx / vDist) * pull;
            ball.vy += (vdy / vDist) * pull;
          }
        }
      });

      // Check Powerup pickups
      for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
        const pow = this.powerups[pIdx];
        const pdx = ball.x - pow.x;
        const pdy = ball.y - pow.y;
        if (Math.hypot(pdx, pdy) < ball.radius + pow.radius) {
          this.applyPowerup(ball, pow);
          this.powerups.splice(pIdx, 1);
        }
      }
    });

    // Ball-to-ball 2D elastic collisions
    for (let i = 0; i < aliveBalls.length; i++) {
      for (let j = i + 1; j < aliveBalls.length; j++) {
        const b1 = aliveBalls[i];
        const b2 = aliveBalls[j];

        const minDist = b1.radius + b2.radius;
        const cdx = b2.x - b1.x;
        if (cdx > minDist || cdx < -minDist) continue;
        const cdy = b2.y - b1.y;
        if (cdy > minDist || cdy < -minDist) continue;

        const distSq = cdx * cdx + cdy * cdy;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq && distSq > 0.0001) {
          const cDist = Math.sqrt(distSq);
          // Normal vector
          const nx = cdx / cDist;
          const ny = cdy / cDist;

          // Separate overlapping balls
          const overlap = (minDist - cDist) * 0.5;
          b1.x -= nx * overlap;
          b1.y -= ny * overlap;
          b2.x += nx * overlap;
          b2.y += ny * overlap;

          // Relative velocity
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

          // Realistic elastic collision with 0.90 restitution
          b1.vx -= p * b2.mass * nx * 0.90;
          b1.vy -= p * b2.mass * ny * 0.90;
          b2.vx += p * b1.mass * nx * 0.90;
          b2.vy += p * b1.mass * ny * 0.90;

          // Damage calculation on impact
          const impactSpeed = Math.hypot(kx, ky);
          if (impactSpeed > 2.2) {
            const dmg = impactSpeed * 2.2;
            b1.hp -= dmg;
            b2.hp -= dmg;
            b1.lastHitBy = b2.country.name;
            b2.lastHitBy = b1.country.name;

            b1.damageDealt += dmg;
            b2.damageDealt += dmg;

            window.SoundEngine.playBounce(Math.min(1.0, impactSpeed / 5));

            // Check lethal smash
            if (b1.hp <= 0 && b1.alive) {
              b2.kills++;
              this.eliminateBall(b1, b2.country.name);
            }
            if (b2.hp <= 0 && b2.alive) {
              b1.kills++;
              this.eliminateBall(b2, b1.country.name);
            }

            // Spawn collision spark particles
            const midX = (b1.x + b2.x) / 2;
            const midY = (b1.y + b2.y) / 2;
            for (let s = 0; s < 3; s++) {
              this.particles.push({
                x: midX,
                y: midY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#fffb00',
                radius: 2 + Math.random() * 2,
                life: 0.4,
                decay: 0.08
              });
            }
          }
        }
      }
    }

    // Update Particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.x += part.vx * effectiveDt * 60;
      part.y += part.vy * effectiveDt * 60;
      part.life -= part.decay * effectiveDt * 60;
      if (part.life <= 0) {
        this.particles.splice(p, 1);
      }
    }

    // Update Floating Texts
    for (let t = this.floatingTexts.length - 1; t >= 0; t--) {
      const ft = this.floatingTexts[t];
      ft.y += ft.vy * effectiveDt * 60;
      ft.alpha -= (1 / ft.life) * effectiveDt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(t, 1);
      }
    }

    // Check for Winner
    const remaining = this.balls.filter(b => b.alive);
    if (remaining.length === 1 && !this.winner && this.balls.length > 1) {
      this.winner = remaining[0];
      this.winner.rank = 1;
      this.handleVictory(this.winner);
    }
  }

  applyPowerup(ball, powerup) {
    if (powerup.type === 'speed') {
      ball.vx *= 2.0;
      ball.vy *= 2.0;
      ball.boostUntil = this.roundTime + 5;
      this.addFloatingText(ball.x, ball.y, "⚡ SPEED!", "#00f0ff");
    } else if (powerup.type === 'shield') {
      ball.shieldUntil = this.roundTime + 6;
      ball.hp = Math.min(ball.maxHp, ball.hp + 50);
      this.addFloatingText(ball.x, ball.y, "🛡️ SHIELD!", "#22c55e");
    } else if (powerup.type === 'giant') {
      ball.radius = ball.baseRadius * 1.6;
      ball.mass = 3.5;
      ball.giantUntil = this.roundTime + 7;
      this.addFloatingText(ball.x, ball.y, "👑 TITAN!", "#ffd700");
    } else if (powerup.type === 'bomb') {
      // Shockwave push enemies
      this.balls.filter(b => b.alive && b !== ball).forEach(other => {
        const dx = other.x - ball.x;
        const dy = other.y - ball.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          const force = (1 - dist / 180) * 15;
          other.vx += (dx / dist) * force;
          other.vy += (dy / dist) * force;
          other.hp -= 20;
          other.lastHitBy = ball.country.name;
          if (other.hp <= 0) {
            ball.kills++;
            this.eliminateBall(other, ball.country.name);
          }
        }
      });
      this.addFloatingText(ball.x, ball.y, "💥 SHOCKWAVE!", "#ff0055");
      window.SoundEngine.playElimination();
    }
    window.SoundEngine.playPowerup();
  }

  eliminateBall(ball, eliminatedBy) {
    if (!ball.alive) return;
    ball.alive = false;
    ball.rank = this.balls.filter(b => b.alive).length + 1;
    this.eliminated.unshift(ball);

    window.SoundEngine.playElimination();

    // Spawn explosion confetti
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 7;
      this.particles.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: i % 2 === 0 ? (ball.country.color || '#ff0055') : (ball.country.altColor || '#ffffff'),
        radius: 3 + Math.random() * 4,
        life: 1.2,
        decay: 0.02
      });
    }

    const aliveCount = this.balls.filter(b => b.alive).length;
    this.onEvent('kill', {
      victim: ball.country,
      killer: eliminatedBy,
      rank: ball.rank,
      alive: aliveCount,
      total: this.balls.length
    });

    this.onEvent('update_alive', { alive: aliveCount, total: this.balls.length });
  }

  handleVictory(winnerBall) {
    window.SoundEngine.playVictory();

    // Giant celebration particles
    for (let i = 0; i < 100; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 10;
      this.particles.push({
        x: this.centerX,
        y: this.centerY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: ['#ffd700', '#ff0055', '#00f0ff', '#22c55e', '#ffffff'][i % 5],
        radius: 4 + Math.random() * 5,
        life: 2.5,
        decay: 0.015
      });
    }

    this.onEvent('victory', {
      country: winnerBall.country,
      kills: winnerBall.kills,
      damage: Math.round(winnerBall.damageDealt)
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Cyber Dark Background
    const bgGrad = ctx.createRadialGradient(this.centerX, this.centerY, 40, this.centerX, this.centerY, this.width * 0.7);
    bgGrad.addColorStop(0, '#0d1322');
    bgGrad.addColorStop(0.7, '#070a12');
    bgGrad.addColorStop(1, '#020408');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Dynamic grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // 2. Safe Zone Circle (Storm Arena Boundary)
    ctx.save();
    // Storm danger outer tint
    ctx.fillStyle = 'rgba(255, 0, 77, 0.14)';
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Glowing Neon Ring Edge
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Inner subtle glow
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.currentRadius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // 3. Render Obstacles
    this.obstacles.forEach(obs => {
      if (obs.type === 'spinner') {
        ctx.save();
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.angle);
        for (let a = 0; a < obs.arms; a++) {
          ctx.rotate((Math.PI * 2) / obs.arms);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(obs.radius, 0);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 6;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(obs.radius, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#ff0055';
          ctx.fill();
        }
        ctx.restore();
      } else if (obs.type === 'bumper') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', obs.x, obs.y);
        ctx.restore();
      }
    });

    // 4. Render Powerups
    this.powerups.forEach(pow => {
      ctx.save();
      const pulse = Math.sin(this.roundTime * 6) * 3;
      ctx.beginPath();
      ctx.arc(pow.x, pow.y, pow.radius + pulse, 0, Math.PI * 2);
      
      let icon = '⚡';
      let color = '#00f0ff';
      if (pow.type === 'shield') { icon = '🛡️'; color = '#22c55e'; }
      else if (pow.type === 'giant') { icon = '👑'; color = '#ffd700'; }
      else if (pow.type === 'bomb') { icon = '💣'; color = '#ff0055'; }

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, pow.x, pow.y);
      ctx.restore();
    });

    // 5. Render Active Ball Trails & Flag Spheres
    const aliveBalls = this.balls.filter(b => b.alive);

    // Draw trails first
    aliveBalls.forEach(ball => {
      if (ball.trail.length > 1) {
        ctx.save();
        for (let t = 0; t < ball.trail.length - 1; t++) {
          const pt1 = ball.trail[t];
          const pt2 = ball.trail[t + 1];
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${pt1.alpha * 0.4})`;
          ctx.lineWidth = (ball.radius * 0.8) * (t / ball.trail.length);
          ctx.stroke();
        }
        ctx.restore();
      }
    });

    // Draw Flag Balls
    aliveBalls.forEach(ball => {
      // Glow if boosted or shielded
      let borderCol = '#ffffff';
      let borderWidth = 2.5;

      if (ball.shieldUntil > this.roundTime) {
        borderCol = '#22c55e';
        borderWidth = 4.5;
      } else if (ball.boostUntil > this.roundTime) {
        borderCol = '#00f0ff';
        borderWidth = 4;
      } else if (ball.giantUntil > this.roundTime) {
        borderCol = '#ffd700';
        borderWidth = 4.5;
      }

      window.FlagManager.drawCircularFlag(ctx, ball.country, ball.x, ball.y, ball.radius, borderCol, borderWidth);

      // Mini Health Bar above ball
      const hpPct = Math.max(0, ball.hp / ball.maxHp);
      const barW = ball.radius * 2.2;
      const barH = 4;
      const barX = ball.x - barW / 2;
      const barY = ball.y - ball.radius - 8;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX, barY, barW, barH);
      
      let hpColor = '#22c55e';
      if (hpPct < 0.3) hpColor = '#ef4444';
      else if (hpPct < 0.6) hpColor = '#eab308';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Display kill crown or count if kills > 0
      if (ball.kills > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️${ball.kills}`, ball.x, ball.y + ball.radius + 12);
      }
    });

    // 6. Particles
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

    // 7. Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 8. Winner Overlay if game won
    if (this.winner) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, this.width, this.height);

      const crownY = this.centerY - 90;
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', this.centerX, crownY);

      window.FlagManager.drawCircularFlag(ctx, this.winner.country, this.centerX, this.centerY, 60, '#ffd700', 6);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.fillText(this.winner.country.name.toUpperCase(), this.centerX, this.centerY + 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText(`🏆 VICTORY ROYALE! | KILLS: ${this.winner.kills}`, this.centerX, this.centerY + 115);
      ctx.restore();
    }
  }

  getLeaderboard() {
    return [...this.balls].sort((a, b) => {
      if (a.alive && !b.alive) return -1;
      if (!a.alive && b.alive) return 1;
      if (a.alive && b.alive) return b.kills - a.kills || b.hp - a.hp;
      return (a.rank || 999) - (b.rank || 999);
    });
  }
}

window.PhysicsArena = PhysicsArena;
