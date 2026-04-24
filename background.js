/* ============================================================
   CODEWARTS — background.js
   Animated Hogwarts castle canvas background
   ============================================================ */

(function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let stars = [], torches = [], owls = [], particles = [];
  let animTime = 0;

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Init stars ── */
  function initStars() {
    stars = [];
    for (let i = 0; i < 280; i++) {
      stars.push({
        x:          Math.random() * W,
        y:          Math.random() * H * 0.72,
        r:          Math.random() * 1.5 + 0.2,
        twinkle:    Math.random() * Math.PI * 2,
        speed:      Math.random() * 0.04 + 0.01,
        brightness: Math.random(),
      });
    }
  }

  /* ── Init torches ── */
  function initTorches() {
    torches = [];
    const xPositions = [0.1, 0.25, 0.5, 0.75, 0.9];
    for (const px of xPositions) {
      torches.push({
        x:            px,
        y:            0.74 + Math.random() * 0.1,
        flicker:      Math.random() * Math.PI * 2,
        flickerSpeed: 0.08 + Math.random() * 0.06,
      });
    }
  }

  /* ── Init owls ── */
  function initOwls() {
    owls = [];
    for (let i = 0; i < 3; i++) {
      owls.push({
        x:         Math.random() * W,
        y:         50 + Math.random() * 150,
        vx:        (Math.random() - 0.5) * 0.8,
        vy:        (Math.random() - 0.5) * 0.2,
        wing:      0,
        wingSpeed: 0.05 + Math.random() * 0.03,
      });
    }
  }

  /* ── Init particles (floating magic motes) ── */
  function initParticles() {
    particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x:     Math.random() * W,
        y:     H * 0.3 + Math.random() * H * 0.7,
        vx:    (Math.random() - 0.5) * 0.3,
        vy:    -0.2 - Math.random() * 0.4,
        alpha: Math.random(),
        size:  Math.random() * 2 + 0.5,
        color: Math.random() < 0.5 ? '197,160,80' : '155,95,212',
      });
    }
  }

  /* ── Draw sky gradient ── */
  function drawSky() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#040210');
    sky.addColorStop(0.4, '#08041a');
    sky.addColorStop(0.7, '#0d0820');
    sky.addColorStop(1,   '#050212');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Draw animated clouds ── */
  function drawClouds() {
    for (let i = 0; i < 4; i++) {
      const cx  = ((W * 0.1 + i * W * 0.28 + animTime * 8 * (i % 2 === 0 ? 1 : -1) * 0.3) % W + W) % W;
      const cy  = H * 0.15 + i * H * 0.04;
      const al  = 0.04 + 0.02 * Math.sin(animTime * 0.3 + i);
      ctx.fillStyle = `rgba(100,80,140,${al})`;
      ctx.beginPath(); ctx.arc(cx,       cy,      60 + i * 15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 40,  cy + 10, 45,          0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 30,  cy + 8,  38,          0, Math.PI * 2); ctx.fill();
    }
  }

  /* ── Draw moon ── */
  function drawMoon() {
    const mx = W * 0.78, my = H * 0.12;

    // Glow halo
    const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 80);
    halo.addColorStop(0, 'rgba(220,200,120,0.08)');
    halo.addColorStop(1, 'rgba(220,200,120,0)');
    ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();

    // Moon body
    const mg = ctx.createRadialGradient(mx, my, 2, mx, my, 35);
    mg.addColorStop(0,   'rgba(248,240,200,0.95)');
    mg.addColorStop(0.7, 'rgba(220,200,150,0.80)');
    mg.addColorStop(1,   'rgba(180,150,80,0)');
    ctx.beginPath(); ctx.arc(mx, my, 30, 0, Math.PI * 2);
    ctx.fillStyle = mg; ctx.fill();

    // Shadow crescent
    ctx.beginPath(); ctx.arc(mx + 12, my - 4, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,5,18,0.85)'; ctx.fill();
  }

  /* ── Draw twinkling stars ── */
  function drawStars() {
    for (const s of stars) {
      s.twinkle += s.speed;
      const b = 0.4 + 0.6 * Math.abs(Math.sin(s.twinkle)) * s.brightness;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,230,200,${b})`; ctx.fill();
    }
  }

  /* ── Draw floating magic particles ── */
  function drawParticles() {
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.003;
      if (p.alpha <= 0) {
        p.alpha = 0.8 + Math.random() * 0.2;
        p.x = Math.random() * W;
        p.y = H;
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha * 0.4})`; ctx.fill();
    }
  }

  /* ── Draw Hogwarts castle ── */
  function drawCastle(cx, cy, scale) {
    const s = scale;
    const base = 180 * s, bh = 120 * s, tw = 18 * s;

    ctx.save(); ctx.translate(cx, cy);

    // Main keep
    ctx.fillStyle = '#0c0818'; ctx.strokeStyle = 'rgba(197,160,80,0.18)'; ctx.lineWidth = 0.5;
    ctx.fillRect(-base, 0, base * 2, bh); ctx.strokeRect(-base, 0, base * 2, bh);

    // Battlements along top
    const batt = 16 * s, batW = 10 * s, batH = 16 * s;
    for (let i = -base; i < base; i += batt) {
      ctx.fillStyle = '#0c0818';
      ctx.fillRect(i, 0 - batH, batW, batH);
      ctx.strokeRect(i, 0 - batH, batW, batH);
    }

    // Tower helper
    function tower(tx, th, tw2) {
      ctx.fillStyle = '#0a0614'; ctx.strokeStyle = 'rgba(197,160,80,0.22)';
      ctx.fillRect(tx - tw2, 0 - th, tw2 * 2, th);
      ctx.strokeRect(tx - tw2, 0 - th, tw2 * 2, th);
      // Conical roof
      const r = tw2 * 1.2, ch = r * 1.8;
      ctx.beginPath(); ctx.moveTo(tx - tw2, 0 - th); ctx.lineTo(tx, 0 - th - ch); ctx.lineTo(tx + tw2, 0 - th); ctx.closePath();
      ctx.fillStyle = '#120a1e'; ctx.fill(); ctx.stroke();
      // Tower battlements
      const bt = tw2 * 0.7;
      for (let b = -tw2; b < tw2; b += bt) {
        ctx.fillStyle = '#0a0614';
        ctx.fillRect(tx + b, 0 - th - bt * 0.8, bt * 0.6, bt * 0.8);
      }
    }

    // Five towers
    tower(-base * 0.85, bh * 1.6,  tw * 1.1);
    tower(-base * 0.40, bh * 1.2,  tw * 0.9);
    tower(0,            bh * 1.85, tw * 1.35);
    tower( base * 0.40, bh * 1.2,  tw * 0.9);
    tower( base * 0.85, bh * 1.6,  tw * 1.1);

    // Gothic arch windows
    function window(wx, wy) {
      ctx.fillStyle   = 'rgba(255,200,80,0.1)';
      ctx.strokeStyle = 'rgba(197,160,80,0.28)';
      ctx.beginPath();
      ctx.arc(wx, wy - 8 * s, 6 * s, Math.PI, 0, false);
      ctx.lineTo(wx + 6 * s, wy); ctx.lineTo(wx - 6 * s, wy); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    for (let wi = -base + 20 * s; wi < base - 10 * s; wi += 30 * s) window(wi, -bh * 0.5);

    ctx.restore();
  }

  /* ── Draw castle ambient glow ── */
  function drawCastleGlow(castleY) {
    const hr = ctx.createLinearGradient(0, castleY - 30, 0, H);
    hr.addColorStop(0,   'rgba(197,160,80,0.055)');
    hr.addColorStop(0.3, 'rgba(100,60,160,0.038)');
    hr.addColorStop(1,   'rgba(5,2,15,0.95)');
    ctx.fillStyle = hr;
    ctx.fillRect(0, castleY - 30, W, H - (castleY - 30));
  }

  /* ── Draw torch glows ── */
  function drawTorches() {
    for (const torch of torches) {
      torch.flicker += torch.flickerSpeed;
      const intensity = 0.6 + 0.4 * Math.sin(torch.flicker);
      const tx = torch.x * W, ty = torch.y * H;
      const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 40 + intensity * 20);
      tg.addColorStop(0,   `rgba(255,160,40,${intensity * 0.3})`);
      tg.addColorStop(0.4, `rgba(200,100,20,${intensity * 0.12})`);
      tg.addColorStop(1,   'rgba(150,60,0,0)');
      ctx.beginPath(); ctx.arc(tx, ty, 50 + intensity * 15, 0, Math.PI * 2);
      ctx.fillStyle = tg; ctx.fill();
    }
  }

  /* ── Draw an owl ── */
  function drawOwl(owl) {
    ctx.save(); ctx.translate(owl.x, owl.y);
    const s = 0.7;

    // Body
    ctx.fillStyle = 'rgba(180,150,80,0.5)';
    ctx.beginPath(); ctx.ellipse(0, 0, 8*s, 10*s, 0, 0, Math.PI*2); ctx.fill();

    // Wings
    const span = 20 * s * Math.abs(Math.sin(owl.wing));
    ctx.fillStyle = 'rgba(140,110,60,0.5)';
    ctx.beginPath(); ctx.moveTo(-3*s,-2*s); ctx.lineTo(-span,-8*s); ctx.lineTo(-span,2*s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 3*s,-2*s); ctx.lineTo( span,-8*s); ctx.lineTo( span,2*s); ctx.closePath(); ctx.fill();

    // Eyes
    ctx.fillStyle = 'rgba(255,200,80,0.7)';
    ctx.beginPath(); ctx.arc(-3*s, -4*s, 2*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3*s, -4*s, 2*s, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  /* ── Update & draw owls ── */
  function updateOwls() {
    for (const owl of owls) {
      owl.x    += owl.vx;
      owl.y    += owl.vy;
      owl.wing += owl.wingSpeed;
      if (owl.x < -50)    owl.x = W + 50;
      if (owl.x > W + 50) owl.x = -50;
      if (owl.y < 30)      owl.vy =  Math.abs(owl.vy);
      if (owl.y > H * 0.35) owl.vy = -Math.abs(owl.vy);
      drawOwl(owl);
    }
  }

  /* ── Ground fog ── */
  function drawGroundFog() {
    const fg = ctx.createLinearGradient(0, H * 0.86, 0, H);
    fg.addColorStop(0, 'rgba(4,2,12,0)');
    fg.addColorStop(1, 'rgba(4,2,12,0.98)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
  }

  /* ── Main animation loop ── */
  function frame() {
    requestAnimationFrame(frame);
    animTime += 0.016;
    ctx.clearRect(0, 0, W, H);

    drawSky();
    drawClouds();
    drawMoon();
    drawStars();
    drawParticles();

    const castleY = H * 0.78;
    drawCastleGlow(castleY);

    // Three castle silhouettes at different depths
    drawCastle(W * 0.50, castleY,      W / 900);
    drawCastle(W * 0.12, castleY + 20, W / 1600);
    drawCastle(W * 0.88, castleY + 15, W / 1800);

    drawTorches();
    updateOwls();
    drawGroundFog();
  }

  /* ── Boot ── */
  initStars();
  initTorches();
  initOwls();
  initParticles();
  frame();

})();
