/* =========================================================
   SHIVANSH VERMA — CINEMATIC PORTFOLIO ENGINE
   main.js — All interactive logic
   ========================================================= */

'use strict';

// ─────────────────────────────────────────────
// 1. GLOBAL STATE
// ─────────────────────────────────────────────
const STATE = {
  currentScreen: 'landing',
  soundEnabled: false,
  audioCtx: null,
  ambientGain: null,
  spaceExplorer: null,
  journeyInitialized: false,
  journeyScroll: 0,
  journeyTarget: 0,
  journeyImages: [],
  journeyLoaded: 0,
  journeyLoopRunning: false,
  journeyListenersBound: false,
  journeyIntroDone: false,
  journeyStartTime: null
};

// ─────────────────────────────────────────────
// 2. UTILITY HELPERS
// ─────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Touch / mobile detection — coarse pointer means no hover & no keyboard
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// ─────────────────────────────────────────────
// 3. CURSOR GLOW
// ─────────────────────────────────────────────
function initCursor() {
  const cursor = $('#cursor-glow');
  if (!cursor) return;
  if (IS_TOUCH) { cursor.style.display = 'none'; return; }

  let mouseX = -100, mouseY = -100;
  let curX = -100, curY = -100;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseenter', (e) => {
    const el = e.target;
    if (el.matches('button, a, [role="button"], .nav-btn, .planet-node, .back-btn')) {
      cursor.classList.add('hovering');
    }
  }, true);

  document.addEventListener('mouseleave', (e) => {
    const el = e.target;
    if (el.matches('button, a, [role="button"], .nav-btn, .planet-node, .back-btn')) {
      cursor.classList.remove('hovering');
    }
  }, true);

  function animateCursor() {
    curX += (mouseX - curX) * 0.15;
    curY += (mouseY - curY) * 0.15;
    cursor.style.left = `${curX}px`;
    cursor.style.top = `${curY}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

// ─────────────────────────────────────────────
// 4. LOADING SCREEN
// ─────────────────────────────────────────────
async function runLoadingScreen() {
  const loader = $('#loading-screen');
  if (!loader) return;

  const lines = $$('.terminal-line');
  const bar = $('.loader-bar');

  // Reveal terminal lines one by one
  for (let i = 0; i < lines.length; i++) {
    await sleep(parseInt(lines[i].dataset.delay) || i * 800);
    lines[i].style.opacity = '1';
    lines[i].style.transform = 'translateY(0)';
    if (bar) {
      bar.style.width = `${((i + 1) / lines.length) * 100}%`;
    }
  }

  await sleep(800);

  // Fade out loader
  loader.classList.add('fade-out');
  await sleep(900);
  loader.style.display = 'none';

  // Kick off landing animations
  animateLandingEntrance();
}

// ─────────────────────────────────────────────
// 5. SCREEN NAVIGATION
// ─────────────────────────────────────────────
function initNavigation() {
  const overlay = $('#transition-overlay');

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-target]');
    if (!btn) return;

    const target = btn.dataset.target;
    if (!target || target === STATE.currentScreen) return;

    await transitionTo(target);
  });
}

async function transitionTo(targetId) {
  const transitionOverlay = $('#page-transition-overlay');
  const current = $(`#${STATE.currentScreen}`);
  const next = $(`#${targetId}`);

  if (!next) return;

  // Cinematic Exit (Wormhole Start)
  if (transitionOverlay) {
    transitionOverlay.classList.add('active', 'animating');
  }
  
  await sleep(600); // Wait for the peak of the wormhole animation

  // Swap screens in the background
  if (current) current.classList.remove('active');
  next.classList.add('active');
  STATE.currentScreen = targetId;
  next.scrollTop = 0;

  // Trigger page-specific logic
  if (targetId === 'explore') initSpaceExplorer();
  if (targetId === 'journey') initJourney();

  await sleep(400); // Complete the warp

  // Cinematic Entry (Wormhole End)
  if (transitionOverlay) {
    transitionOverlay.classList.remove('animating');
    setTimeout(() => {
      transitionOverlay.classList.remove('active');
    }, 500);
  }
}

// ─────────────────────────────────────────────
// 6. LANDING CANVAS — SPEED STREAKS + STARS
// ─────────────────────────────────────────────
function animateLandingEntrance() {
  // Stagger landing buttons
  const buttons = $$('.landing-buttons .nav-btn');
  buttons.forEach((btn, i) => {
    setTimeout(() => {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    }, 400 + i * 150);
  });

  // Subtitle
  const subtitle = $('.landing-subtitle');
  if (subtitle) {
    setTimeout(() => {
      subtitle.style.opacity = '1';
      subtitle.style.transform = 'translateY(0)';
    }, 200);
  }

  initLandingCanvas();
}

function initLandingCanvas() {
  const canvas = $('#landing-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, stars = [], streaks = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Stars
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  // Light streaks
  function spawnStreak() {
    streaks.push({
      x: Math.random() < 0.5 ? -200 : W + 200,
      y: Math.random() * H * 0.8,
      vx: (Math.random() * 30 + 20) * (Math.random() < 0.5 ? 1 : -1),
      length: Math.random() * 250 + 100,
      opacity: Math.random() * 0.6 + 0.3,
      color: Math.random() < 0.6 ? '#00d4ff' : '#ff2d55',
      life: 1,
      decay: Math.random() * 0.015 + 0.008,
    });
  }

  let frame = 0;
  function draw() {
    if (STATE.currentScreen !== 'landing') return;

    ctx.clearRect(0, 0, W, H);

    // Add a very subtle dark vignette to help text pop without hiding video
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
    vignette.addColorStop(0, 'rgba(2, 2, 10, 0)');
    vignette.addColorStop(1, 'rgba(2, 2, 10, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Draw stars
    frame++;
    stars.forEach((s) => {
      s.twinkle += 0.02;
      const alpha = s.opacity * (0.7 + 0.3 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
      s.x += s.speed * 0.2;
      if (s.x > W) s.x = 0;
    });

    // Spawn streaks
    if (frame % 18 === 0) spawnStreak();

    // Draw streaks
    streaks = streaks.filter((s) => s.life > 0);
    streaks.forEach((s) => {
      const gradient = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.4, s.y);
      gradient.addColorStop(0, `rgba(${hexToRgb(s.color)},${s.opacity * s.life})`);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + (s.vx > 0 ? -s.length : s.length), s.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.stroke();

      s.x += s.vx;
      s.life -= s.decay;
    });

    requestAnimationFrame(draw);
  }

  draw();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─────────────────────────────────────────────
// 7. GLITCH EFFECT ON TITLE
// ─────────────────────────────────────────────
function initGlitch() {
  const el = $('.glitch-text');
  if (!el) return;

  setInterval(() => {
    if (STATE.currentScreen !== 'landing') return;
    el.classList.add('glitch-active');
    setTimeout(() => el.classList.remove('glitch-active'), 200);
  }, 4000 + Math.random() * 3000);
}

// ─────────────────────────────────────────────
// 8. JOURNEY MODE — SCROLL REVEALS + CANVASES
// ─────────────────────────────────────────────
function initJourneyObserver() {
  const phases = $$('.journey-phase');
  const progressBar = $('.journey-progress-bar');
  const progressLabel = $('.journey-progress-label');

  // Reveal elements as they enter view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const phase = entry.target;
          phase.classList.add('in-view');

          // Reveal all .reveal-text inside
          const texts = phase.querySelectorAll('.reveal-text');
          texts.forEach((t, i) => {
            setTimeout(() => t.classList.add('visible'), i * 300);
          });

          // Typewriter elements
          const typewriters = phase.querySelectorAll('.typewriter-target');
          typewriters.forEach((tw, index) => {
            if (tw.dataset.typed === "true") return;
            tw.dataset.typed = "true";

            const textToType = tw.textContent;
            tw.textContent = "";
            let charIndex = 0;

            setTimeout(() => {
              const typeInterval = setInterval(() => {
                if (charIndex < textToType.length) {
                  tw.textContent += textToType.charAt(charIndex);
                  charIndex++;
                } else {
                  clearInterval(typeInterval);
                }
              }, 20);
            }, 300 + (index * 1000)); // Stagger headers and paragraphs
          });

          // Update progress
          const phaseNum = parseInt(phase.dataset.phase);
          if (progressBar) {
            progressBar.style.height = `${(phaseNum / 6) * 100}%`;
          }
          if (progressLabel) {
            progressLabel.textContent = `PHASE 0${phaseNum}`;
          }

          // Init per-phase canvas
          const bgType = ['beginning', 'struggle', 'building', 'responsibility', 'balance', 'ambition'][phaseNum - 1];
          initPhaseCanvas(bgType, phase.querySelector('.phase-bg'));
        }
      });
    },
    { threshold: 0.3 }
  );

  phases.forEach((p) => observer.observe(p));
}

function initPhaseCanvas(type, canvas) {
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();

  const particles = [];

  switch (type) {
    case 'beginning':
      initBeginningCanvas(ctx, particles);
      break;
    case 'struggle':
      initStruggleCanvas(ctx, particles);
      break;
    case 'building':
      initBuildingCanvas(ctx, particles);
      break;
    case 'responsibility':
      initResponsibilityCanvas(ctx, particles);
      break;
    case 'balance':
      initBalanceCanvas(ctx, particles);
      break;
    case 'ambition':
      initAmbitionCanvas(ctx, particles);
      break;
  }

  function loop() {
    if (!canvas.isConnected) return;
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    drawParticles(ctx, W, H, particles, type);
    requestAnimationFrame(loop);
  }
  loop();
}

function initBeginningCanvas(ctx, particles) {
  // Deep Blue Nebula
  for (let i = 0; i < 4; i++) {
    particles.push({ type: 'cloud', x: Math.random(), y: Math.random(), r: Math.random() * 0.4 + 0.3, color: '0, 100, 255', speedX: (Math.random() - 0.5) * 0.001, speedY: (Math.random() - 0.5) * 0.001 });
  }
  for (let i = 0; i < 60; i++) particles.push(createStar());
}

function initStruggleCanvas(ctx, particles) {
  // Dark Crimson Storm
  for (let i = 0; i < 5; i++) {
    particles.push({ type: 'cloud', x: Math.random(), y: Math.random(), r: Math.random() * 0.5 + 0.2, color: '200, 20, 50', speedX: (Math.random() - 0.5) * 0.002, speedY: (Math.random() - 0.5) * 0.002 });
  }
  for (let i = 0; i < 40; i++) particles.push({ ...createStar(), color: '255, 100, 100' });
}

function initBuildingCanvas(ctx, particles) {
  // Teal/Green grid nebula
  for (let i = 0; i < 4; i++) {
    particles.push({ type: 'cloud', x: Math.random(), y: Math.random(), r: Math.random() * 0.4 + 0.2, color: '0, 255, 150', speedX: (Math.random() - 0.5) * 0.001, speedY: (Math.random() - 0.5) * 0.001 });
  }
  for (let i = 0; i < 80; i++) {
    particles.push({ type: 'grid', x: Math.random(), y: Math.random(), speed: Math.random() * 0.001 });
  }
}

function initResponsibilityCanvas(ctx, particles) {
  // Purple Galaxy
  for (let i = 0; i < 3; i++) {
    particles.push({ type: 'cloud', x: Math.random(), y: Math.random(), r: Math.random() * 0.6 + 0.3, color: '150, 50, 255', speedX: (Math.random() - 0.5) * 0.0015, speedY: (Math.random() - 0.5) * 0.0015 });
  }
  for (let i = 0; i < 100; i++) {
    let angle = Math.random() * Math.PI * 2;
    let dist = Math.random() * 0.5;
    particles.push({ type: 'spiral', angle: angle, dist: dist, speed: 0.002 / (dist + 0.1) });
  }
}

function initBalanceCanvas(ctx, particles) {
  // Split Warm/Cool
  particles.push({ type: 'cloud', x: 0.2, y: 0.5, r: 0.6, color: '255, 100, 0', speedX: 0.0005, speedY: 0.0005 });
  particles.push({ type: 'cloud', x: 0.8, y: 0.5, r: 0.6, color: '0, 150, 255', speedX: -0.0005, speedY: -0.0005 });
  for (let i = 0; i < 70; i++) particles.push(createStar());
}

function initAmbitionCanvas(ctx, particles) {
  // Bright cosmic burst
  particles.push({ type: 'cloud', x: 0.5, y: 0.5, r: 0.8, color: '255, 255, 255', speedX: 0, speedY: 0 });
  particles.push({ type: 'cloud', x: 0.5, y: 0.5, r: 0.5, color: '0, 200, 255', speedX: 0, speedY: 0 });
  for (let i = 0; i < 150; i++) {
    let angle = Math.random() * Math.PI * 2;
    particles.push({ type: 'burst', x: 0.5, y: 0.5, angle: angle, speed: Math.random() * 0.005 + 0.001 });
  }
}

function createStar() {
  return { type: 'star', x: Math.random(), y: Math.random(), r: Math.random() * 1.5, twinkle: Math.random() * Math.PI * 2 };
}

function drawParticles(ctx, W, H, particles, type) {
  // Base dark background
  ctx.fillStyle = 'rgba(5, 5, 12, 1)';
  ctx.fillRect(0, 0, W, H);

  // Use lighter composite for magical glowing overlaps
  ctx.globalCompositeOperation = 'lighter';

  particles.forEach((p) => {
    if (p.type === 'cloud') {
      const gradient = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, p.r * Math.max(W, H));
      gradient.addColorStop(0, `rgba(${p.color}, 0.2)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r * Math.max(W, H), 0, Math.PI * 2);
      ctx.fill();

      // Cloud movement
      p.x += p.speedX; p.y += p.speedY;
      if (p.x < -0.2 || p.x > 1.2) p.speedX *= -1;
      if (p.y < -0.2 || p.y > 1.2) p.speedY *= -1;
    }
    else if (p.type === 'star') {
      p.twinkle += 0.02;
      ctx.fillStyle = `rgba(${p.color || '255,255,255'}, ${0.3 + 0.7 * Math.sin(p.twinkle)})`;
      ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.type === 'grid') {
      ctx.fillStyle = 'rgba(0, 255, 150, 0.3)';
      ctx.fillRect(p.x * W, p.y * H, 2, 8);
      p.y -= p.speed;
      if (p.y < 0) p.y = 1;
    }
    else if (p.type === 'spiral') {
      p.angle += p.speed;
      let px = 0.5 + Math.cos(p.angle) * p.dist;
      let py = 0.5 + Math.sin(p.angle) * p.dist;
      ctx.fillStyle = 'rgba(200, 150, 255, 0.8)';
      ctx.beginPath(); ctx.arc(px * W, py * H, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.type === 'burst') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 2, 0, Math.PI * 2); ctx.fill();
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) { p.x = 0.5; p.y = 0.5; }
    }
  });

  ctx.globalCompositeOperation = 'source-over'; // Reset
}

// ─────────────────────────────────────────────
// 9. EXPLORE MODE — 2D SPACE NAVIGATOR
// ─────────────────────────────────────────────
function initSpaceExplorer() {
  if (STATE.spaceExplorer) return; // already running

  const canvas = $('#space-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Stars ---
  const stars = Array.from({ length: IS_TOUCH ? 140 : 300 }, () => ({
    x: Math.random() * 4000 - 2000,
    y: Math.random() * 4000 - 2000,
    r: Math.random() * 1.8 + 0.2,
    op: Math.random() * 0.8 + 0.2,
    tw: Math.random() * Math.PI * 2,
  }));

  // --- Planets ---
  // --- Planets with Orbital Physics ---
  const planets = [
    {
      id: 'sun', label: 'ABOUT_ME.DAT', desc: 'About Me', icon: '☀️',
      x: 0, y: 0, r: 90, color: '#ffcc00', glowColor: 'rgba(255,204,0,0.6)', ring: false, orbitRadius: 0, orbitAngle: 0, orbitSpeed: 0,
      detail: 'Hey — I\'m <strong>Shivansh Verma</strong>, a full-stack & AI engineer from Nagpur, India.<br><br>I build things end-to-end: AI memory systems, a wearable that helps blind people navigate, marketplaces, cross-platform apps. I like problems where I have to understand the whole machine, not just my corner of it.<br><br>Right now I\'m managing product and engineering at Gigzs, finishing my B.Tech (8.95 CGPA), and shipping freelance work on the side.<br><br>If you\'re hiring someone who actually ships — fly around. The planets don\'t bite.',
      satellites: [
        { id: 'sun1', label: 'NOW.LOG', desc: 'What I\'m On Right Now', icon: '🛰️', r: 12, orbit: 140, speed: 0.005, detail: '<strong>Current Missions</strong><br><br>• <strong>Supermemory (GML)</strong> — a long-term memory layer that lets AI assistants like Claude and GPT remember you across sessions.<br>• Leading product & engineering at <strong>Gigzs</strong>.<br>• Freelance client work — two apps currently live in production.<br>• Final stretch of my B.Tech in Computer Science.' },
        { id: 'sun2', label: 'WHY.TXT', desc: 'What Drives Me', icon: '🚀', r: 10, orbit: 180, speed: -0.003, detail: '<strong>The Honest Answer</strong><br><br>Space, mostly. I don\'t come from a background that leads there, so I\'m building my own path — through code, startups, and learning things I don\'t fully understand yet.<br><br>Day to day, what keeps me going is simpler: I like making things that hold up in real use. Demos are easy. Systems that survive real users are the actual game.' }
      ]
    },
    {
      id: 'mercury', label: 'EDUCATION.LOG', desc: 'Education', icon: '☿️',
      r: 25, color: '#a0a0a0', glowColor: 'rgba(160,160,160,0.4)', ring: false, orbitRadius: 350, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.007,
      detail: '<strong>Education</strong><br><br>B.Tech in Computer Science & Engineering at G.H. Raisoni College, Nagpur (2023–2027).<br><br>Holding an <strong>8.95 CGPA</strong> while running everything else on this map — which tells you more about my time management than any bullet point could.',
      satellites: [
        { id: 'mer1', label: 'BTECH_CSE.DEG', desc: 'G.H. Raisoni College', icon: '🎓', r: 10, orbit: 80, speed: 0.01, detail: '<strong>G.H. Raisoni College of Engineering, Nagpur</strong><br><br><strong>Degree:</strong> B.Tech, Computer Science & Engineering<br><strong>Timeline:</strong> 2023 – 2027<br><strong>CGPA:</strong> 8.95 / 10<br><br>Focus areas: systems architecture and AI — the theory behind the things I was already building anyway.' }
      ]
    },
    {
      id: 'venus', label: 'PROJECTS.EXE', desc: 'Projects', icon: '🔴',
      r: 40, color: '#ff6b35', glowColor: 'rgba(255,107,53,0.4)', ring: false, orbitRadius: 650, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.004,
      detail: '<strong>Things I\'ve Built</strong><br><br>Five moons, five real projects — two of them live in production for paying clients, one wearable that passed thesis evaluation, and two AI systems built to fix problems I personally ran into.<br><br>Every one of these taught me something a tutorial couldn\'t.',
      satellites: [
        { id: 'p1', label: 'GML.AI', desc: 'Supermemory (GML)', icon: '🧠', r: 12, orbit: 110, speed: 0.005, detail: '<strong>Supermemory (GML) — Cross-Model AI Memory</strong><br><br>AI assistants forget you the moment a session ends. GML fixes that: a persistent memory layer that lets models like Claude and GPT retain user context across sessions and even across providers.<br><br>The semantic embedding pipeline (Pinecone + ChromaDB) improved response relevance by <strong>~35%</strong>. I handle vector indexing, similarity thresholds, and retrieval latency tuning on an Azure VM I run myself.', tech: 'Pinecone, ChromaDB, Vector Embeddings, Azure VM, Node.js' },
        { id: 'p2', label: 'DRISHTI.CAP', desc: 'Drishti Cap', icon: '👁️', r: 10, orbit: 150, speed: -0.003, detail: '<strong>Drishti Cap — A Camera-Cap That Speaks</strong><br><br>A wearable for visually impaired users: real-time object detection, face recognition, and obstacle alerts — all converted instantly to audio. Runs fully on-device on a Raspberry Pi. No cloud, no connectivity excuses.<br><br>Getting YOLOv8 and TensorFlow to perform under strict edge-hardware constraints was the hard part. Validated end-to-end and passed thesis evaluation.', tech: 'Python, YOLOv8, TensorFlow, Raspberry Pi, OpenCV, TTS' },
        { id: 'p3', label: 'ARQIV.EXE', desc: 'ArqivAI', icon: '📚', r: 10, orbit: 190, speed: 0.004, detail: '<strong>ArqivAI — Ask Once, Get an Answer Models Agree On</strong><br><br>A research assistant that routes each query to 4+ LLMs in parallel, then cross-validates the outputs into one high-confidence answer using confidence scoring and source tracking.<br><br>Result: <strong>~40% fewer hallucinations</strong> than a single-model baseline. FastAPI backend, unified interface, fine-tuned domain adapters.', tech: 'FastAPI, LLM Orchestration, Fine-tuning, REST APIs', link: 'https://arqiv.kesug.com/?i=1' },
        { id: 'p4', label: 'FOUNDER.APP', desc: 'Founder Network App', icon: '🤝', r: 10, orbit: 230, speed: -0.0035, detail: '<strong>Founder Networking App — Live in Production</strong><br><br>A cross-platform app connecting startup founders, investors, and domain experts through role-based feeds. One Capacitor codebase shipping to Android, iOS, and Web.<br><br>Built solo for a freelance client, currently live with real users. Shipping to three platforms from one codebase teaches you respect for the small differences fast.', tech: 'Capacitor, React, Android Studio, Xcode' },
        { id: 'p5', label: 'MLS.ESTATE', desc: 'US Real-Estate Platform', icon: '🏠', r: 10, orbit: 270, speed: 0.003, detail: '<strong>MLS Listings Platform — US Real-Estate Client</strong><br><br>A large-scale property listings platform with Airbnb-style browsing, search, and filtering over live MLS data.<br><br>Built for a US client as a freelance engagement — the kind of project where "it works on my machine" isn\'t an acceptable sentence.', tech: 'React, Node.js, REST APIs, SQL' }
      ]
    },
    {
      id: 'earth', label: 'ROLES.LOG', desc: 'Experience', icon: '🌍',
      r: 45, color: '#00d4ff', glowColor: 'rgba(0,212,255,0.4)', ring: false, orbitRadius: 1000, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.0025,
      detail: '<strong>Where I\'ve Been On the Hook</strong><br><br>Roles where people actually depended on the outcome — leading a team, shipping for clients, running events for hundreds of participants. Less "exposure to", more "responsible for".',
      satellites: [
        { id: 'e1', label: 'GIGZS.CORP', desc: 'PM & Full-Stack @ Gigzs', icon: '💼', r: 12, orbit: 120, speed: 0.006, detail: '<strong>Gigzs — AI-Powered Gig Marketplace</strong><br><em>Sept 2024 – Present</em><br><br>Led a 6-person cross-functional team building an AI gig marketplace to <strong>500+ users</strong> before a strategic pivot. Owned the full stack — frontend UX, backend APIs, Azure VM deployment — while being the single communication bridge between founders, developers, and designers.<br><br>Translation: when something broke, it was my phone that rang.', tech: 'Next.js, Supabase, Node.js, Azure VM' },
        { id: 'e2', label: 'FREELANCE.DEV', desc: 'Full-Stack Freelancer', icon: '💻', r: 12, orbit: 170, speed: -0.004, detail: '<strong>Independent Client Work</strong><br><em>2024 – 2025</em><br><br>Delivered <strong>5+ client projects</strong> across web, mobile, and cross-platform — including the founder networking app (live in production on Android, iOS & Web) and a large-scale US real-estate MLS platform.<br><br>Freelancing teaches you the skill no course covers: shipping things people pay for, on deadlines they chose.', tech: 'Capacitor, React, Node.js, Android Studio, Xcode' },
        { id: 'e3', label: 'NASA.LEAD', desc: 'Tech Lead @ Space Apps', icon: '🚀', r: 10, orbit: 220, speed: 0.003, detail: '<strong>Technical Team Lead — NASA Space Apps Challenge, Nagpur</strong><br><em>2023 – 2025</em><br><br>Helped run city-wide hackathons for the world\'s largest space & science hackathon: technical mentorship for hundreds of participants, plus owning the event infrastructure that everything ran on.<br><br>For someone whose whole map points at space, this one wasn\'t really work.' }
      ]
    },
    {
      id: 'mars', label: 'TECH_ARSENAL.DAT', desc: 'Skills', icon: '🪐',
      r: 35, color: '#ff2d55', glowColor: 'rgba(255,45,85,0.4)', ring: false, orbitRadius: 1400, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.0018,
      detail: '<strong>The Toolkit</strong><br><br>Tools are just tools — what matters is what got shipped with them. Everything listed on these moons has been used in a real project on this map, not just in a tutorial.',
      satellites: [
        { id: 's1', label: 'LANGUAGES.DAT', desc: 'Languages', icon: '🗣️', r: 9, orbit: 100, speed: 0.007, detail: '<strong>Languages</strong><br><br><strong>Daily drivers:</strong><br>• JavaScript / TypeScript<br>• Java<br>• C++<br>• SQL<br><br><strong>Comfortable with:</strong><br>• Python (all my AI/edge work)<br>• PHP' },
        { id: 's2', label: 'FULLSTACK.SYS', desc: 'Web & Mobile', icon: '🌐', r: 9, orbit: 140, speed: -0.005, detail: '<strong>Frontend, Backend & Mobile</strong><br><br>• Next.js & React — Gigzs, MLS platform<br>• Node.js & Express — APIs behind everything<br>• REST API design<br>• Capacitor + Android Studio + Xcode — one codebase, three platforms, live in production<br>• HTML5 / CSS3 — including this site, hand-rolled, no framework' },
        { id: 's3', label: 'AI_ML.NET', desc: 'AI & Machine Learning', icon: '🤖', r: 9, orbit: 180, speed: 0.004, detail: '<strong>AI & Machine Learning</strong><br><br>• LLM Orchestration & RAG pipelines — ArqivAI, Supermemory<br>• Vector Embeddings & Fine-tuning<br>• YOLOv8 & TensorFlow — optimized for edge inference on Drishti Cap<br>• OpenCV<br><br>Not "prompt engineering" — actual retrieval systems, actual model deployment on actual hardware.' },
        { id: 's4', label: 'DATA_INFRA.LOG', desc: 'Data & Infrastructure', icon: '🗄️', r: 9, orbit: 220, speed: -0.003, detail: '<strong>Data & Infrastructure</strong><br><br>• Supabase, Firebase, MongoDB, MySQL, TiDB<br>• Pinecone & ChromaDB — vector search in production<br>• Azure VM + Nginx — I deploy and babysit my own servers<br>• Git / GitHub, Docker<br>• Raspberry Pi — when the cloud isn\'t allowed to exist' }
      ]
    },
    {
      id: 'jupiter', label: 'CERTS.TXT', desc: 'Certifications', icon: '📜',
      r: 65, color: '#f3b05a', glowColor: 'rgba(243,176,90,0.4)', ring: false, orbitRadius: 1850, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.0012,
      detail: '<strong>Certifications</strong><br><br>Paper doesn\'t build systems, but it does prove I go deep on fundamentals instead of just winging it. Deep learning, distributed databases, classical ML, and the language I started with.',
      satellites: [
        { id: 'c1', label: 'NVIDIA.DLI', desc: 'Deep Learning Fundamentals', icon: '🟢', r: 10, orbit: 120, speed: 0.005, detail: '<strong>Deep Learning Fundamentals</strong><br><em>NVIDIA Deep Learning Institute</em><br><br>Neural networks from the ground up — the theory behind the YOLOv8 and TensorFlow work on Drishti Cap.' },
        { id: 'c2', label: 'STANFORD.ML', desc: 'Supervised ML — Andrew Ng', icon: '🎓', r: 10, orbit: 155, speed: -0.0045, detail: '<strong>Supervised Machine Learning: Regression & Classification</strong><br><em>Stanford University — Andrew Ng</em><br><br>The classic. Regression, classification, and the math that everything else in ML quietly stands on.' },
        { id: 'c3', label: 'SALESFORCE.AI', desc: 'Salesforce AI Associate', icon: '☁️', r: 10, orbit: 190, speed: 0.0035, detail: '<strong>Salesforce AI Associate</strong><br><em>Salesforce Trailhead</em><br><br>AI in the context of CRM and enterprise systems — where "it works" also has to mean "it\'s compliant and explainable".' },
        { id: 'c4', label: 'PINGCAP.DB', desc: 'TiDB Practitioner', icon: '🐬', r: 10, orbit: 225, speed: -0.003, detail: '<strong>TiDB Practitioner</strong><br><em>PingCAP</em><br><br>Distributed SQL databases — sharding, consensus, and why horizontal scaling is never as simple as the diagram suggests.' },
        { id: 'c5', label: 'JAVA.MASTER', desc: 'Java Masterclass', icon: '☕', r: 10, orbit: 260, speed: 0.0025, detail: '<strong>Java Programming Masterclass (Java SE 17)</strong><br><em>Udemy — Tim Buchalka</em><br><br>The deep end of the first language I took seriously. OOP discipline that carried over into everything since.' }
      ]
    },
    {
      id: 'saturn', label: 'LEADERSHIP.LOG', desc: 'Leadership', icon: '🪐',
      r: 55, color: '#a855f7', glowColor: 'rgba(168,85,247,0.4)', ring: true, orbitRadius: 2350, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.0008,
      detail: '<strong>Beyond the Keyboard</strong><br><br>Code is half the job. The other half is people — running communities, organizing events, and showing up for causes that have nothing to do with my career.',
      satellites: [
        { id: 'l1', label: 'IEEE.SEC', desc: 'Secretary, IEEE SB GHRCE', icon: '⚡', r: 11, orbit: 140, speed: 0.004, detail: '<strong>Secretary & Webmaster — IEEE Student Branch, GHRCE</strong><br><em>Aug 2023 – Sept 2025</em><br><br>Ran the branch\'s web infrastructure and official communications, organized technical workshops, and grew technical outreach across the student body. Two years of making sure events actually happened, not just got planned.' },
        { id: 'l2', label: 'PHOENIX.LEAD', desc: 'Tech Lead, Phoenix Forum', icon: '🐦', r: 11, orbit: 190, speed: -0.003, detail: '<strong>Technical Lead — Phoenix Forum</strong><br><em>July 2024 – July 2025</em><br><br>Led technical events and skill-building initiatives — the kind of sessions I wish someone had run when I was struggling with the basics.' },
        { id: 'l3', label: 'NGO.VOL', desc: 'Volunteer & Content Lead', icon: '🤝', r: 11, orbit: 240, speed: 0.002, detail: '<strong>Community Work</strong><br><br>• <strong>A Better Hand</strong> — environment NGO, member 2021–2024<br>• <strong>House of Hearts</strong> — Content Lead, 2023–2024<br><br>Digital outreach and engagement for causes that keep you grounded. Not everything has to compile.' }
      ]
    },
    {
      id: 'uranus', label: 'CONTACT.NET', desc: 'Contact', icon: '📞',
      r: 40, color: '#00ffff', glowColor: 'rgba(0,255,255,0.4)', ring: false, orbitRadius: 2850, orbitAngle: Math.random() * Math.PI * 2, orbitSpeed: 0.0005,
      detail: '<strong>Say Hi</strong><br><br>You made it to the edge of the system — that\'s usually a good sign.<br><br>If you\'re hiring, building something interesting, or just want to talk shop about AI, space, or why your side project broke at 2am — my comms are open. I reply fast.',
      satellites: [
        { id: 'co1', label: 'EMAIL.COM', desc: 'Email Me', icon: '✉️', r: 10, orbit: 100, speed: 0.006, detail: '<strong>Email</strong><br><br>shivansh1411@gmail.com<br><br>The fastest way to reach me. Real messages get real replies — usually same day.', link: 'mailto:shivansh1411@gmail.com' },
        { id: 'co2', label: 'PHONE.NET', desc: 'Call or WhatsApp', icon: '📱', r: 10, orbit: 140, speed: -0.005, detail: '<strong>Phone</strong><br><br>+91 9623688451<br>Nagpur, Maharashtra, India (IST)<br><br>Calls, WhatsApp — whatever works for you.' },
        { id: 'co3', label: 'GITHUB.GIT', desc: 'See the Code', icon: '🐙', r: 10, orbit: 180, speed: 0.004, detail: '<strong>GitHub</strong><br><br>The receipts. Project repositories and contributions — including the source for this very site.', link: 'https://github.com/Shivansh1411' },
        { id: 'co4', label: 'LINKEDIN.PRO', desc: 'Connect on LinkedIn', icon: '💼', r: 10, orbit: 220, speed: -0.003, detail: '<strong>LinkedIn</strong><br><br>The professional version of all this — endorsements, timeline, and significantly fewer planets.', link: 'https://www.linkedin.com/in/shivansh-verma' }
      ]
    }
  ];


  // --- Ship ---
  const ship = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
  const keys = {};

  // Initialize positions
  planets.forEach(p => {
    if (p.orbitRadius > 0) {
      p.x = Math.cos(p.orbitAngle) * p.orbitRadius;
      p.y = Math.sin(p.orbitAngle) * p.orbitRadius;
    }
  });

  // Shared interaction logic — used by keyboard [E]/[ESC] and the touch buttons
  function doInteract() {
    if (zoomTargetPlanet) {
      // Panel is open: close it and drop into orbit to access moons
      orbitModePlanet = zoomTargetPlanet;
      targetScale = 3;
      closePlanetPanel();
    } else if (nearPlanet) {
      // Near a planet (or a moon while in orbit mode): open its panel
      openPlanetPanel(nearPlanet);
    }
  }

  function doEscape() {
    if (zoomTargetPlanet) {
      closePlanetPanel();
    } else if (orbitModePlanet) {
      orbitModePlanet = null;
      targetScale = 1;
    }
  }

  function onKeyDown(e) {
    keys[e.key] = true;
    if (STATE.currentScreen !== 'explore') return;
    if (e.key === 'e' || e.key === 'E') doInteract();
    if (e.key === 'Escape') doEscape();
  }
  function onKeyUp(e) { keys[e.key] = false; }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  let orbitModePlanet = null;

  // --- Touch controls: virtual joystick + action buttons ---
  const joy = { active: false, dx: 0, dy: 0, id: null };

  if (IS_TOUCH) {
    const zone = $('#joystick-zone');
    const base = $('#joystick-base');
    const knob = $('#joystick-knob');
    const KNOB_RANGE = 40; // px the knob can travel from center

    function updateJoy(touch) {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > KNOB_RANGE) {
        dx = (dx / dist) * KNOB_RANGE;
        dy = (dy / dist) * KNOB_RANGE;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      joy.dx = dx / KNOB_RANGE;
      joy.dy = dy / KNOB_RANGE;
    }

    function resetJoy() {
      joy.active = false;
      joy.id = null;
      joy.dx = 0;
      joy.dy = 0;
      knob.style.transform = 'translate(0, 0)';
    }

    if (zone) {
      // Assignment (not addEventListener) so re-entering Explore doesn't stack handlers
      zone.ontouchstart = (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        joy.id = t.identifier;
        joy.active = true;
        updateJoy(t);
      };
      zone.ontouchmove = (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id) updateJoy(t);
        }
      };
      zone.ontouchend = zone.ontouchcancel = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id) resetJoy();
        }
      };
    }

    const btnBoost = $('#btn-boost');
    if (btnBoost) {
      btnBoost.ontouchstart = (e) => { e.preventDefault(); keys['Shift'] = true; };
      btnBoost.ontouchend = btnBoost.ontouchcancel = (e) => { e.preventDefault(); keys['Shift'] = false; };
    }

    const btnInteract = $('#btn-interact');
    if (btnInteract) {
      btnInteract.ontouchstart = (e) => { e.preventDefault(); doInteract(); };
    }

    const btnExit = $('#btn-exit');
    if (btnExit) {
      btnExit.ontouchstart = (e) => { e.preventDefault(); doEscape(); };
    }
  }

  // --- Asteroids ---
  const asteroids = Array.from({ length: IS_TOUCH ? 50 : 150 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * 2500;

    const points = [];
    const numPoints = 5 + Math.floor(Math.random() * 4);
    const r = 4 + Math.random() * 12;
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const variance = r * 0.4;
      points.push({
        x: Math.cos(a) * (r + (Math.random() * variance - variance / 2)),
        y: Math.sin(a) * (r + (Math.random() * variance - variance / 2))
      });
    }

    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      r: r,
      points: points
    };
  });

  let nearPlanet = null;
  const prompt = $('#explore-prompt');
  const promptText = $('#prompt-text');

  // Removed duplicate keydown event listener.
  // Close panel button
  const panelClose = $('#panel-close');
  if (panelClose) panelClose.addEventListener('click', closePlanetPanel);

  // Click / tap planets and moons directly.
  // Screen position must account for the camera zoom (worldScale),
  // otherwise hits are wrong whenever we're zoomed in.
  canvas.onclick = (e) => {
    if (zoomTargetPlanet) return; // panel already open
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const slack = IS_TOUCH ? 45 : 30; // forgiving hit area on touch

    // Moons first (smaller targets drawn on top), then planets
    for (const p of planets) {
      const targets = [...(p.satellites || []), p];
      for (const obj of targets) {
        const sx = W / 2 + (obj.x - ship.x) * worldScale;
        const sy = H / 2 + (obj.y - ship.y) * worldScale;
        if (Math.hypot(mx - sx, my - sy) < obj.r * worldScale + slack) {
          openPlanetPanel(obj);
          return;
        }
      }
    }
  };

  let running = true;
  STATE.spaceExplorer = {
    stop: () => {
      running = false;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', resize);
    }
  };

  let worldScale = 1;
  let targetScale = 1;
  let zoomTargetPlanet = null;

  function openPlanetPanel(planet) {
    zoomTargetPlanet = planet;
    targetScale = 6; // Zoom in even closer for the popup

    const panel = $('#planet-panel');
    const content = $('#panel-content');
    if (!panel || !content) return;

    content.innerHTML = `
      <div class="planet-panel-inner glass-content">
        <div class="panel-main-content">
          <div class="panel-header">
            <div class="planet-icon-large">${planet.icon}</div>
            <div class="title-wrap">
              <h2 class="planet-title-main">${planet.desc}</h2>
              <span class="planet-id-tag">${planet.label}</span>
            </div>
          </div>
          
          <div class="panel-body-scroll">
            <div class="planet-description">
              ${planet.detail}
            </div>
            
            ${planet.tech ? `
              <div class="tech-grid">
                ${planet.tech.split(',').map(t => `<span class="tech-badge">${t.trim()}</span>`).join('')}
              </div>
            ` : ''}
            
            ${planet.link ? `
              <div class="link-action">
                <a href="${planet.link}" target="_blank" class="cyber-link">
                  <span class="glitch-text" data-text="ESTABLISH UPLINK">ESTABLISH UPLINK</span>
                  <span class="link-arrow">↗</span>
                </a>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="panel-sidebar">
          <div class="metadata-group">
            <div class="meta-item">
              <label>SIGNAL</label>
              <span>STABLE</span>
            </div>
            <div class="meta-item">
              <label>CLASS</label>
              <span>${planet.id.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="sidebar-actions">
            ${planet.satellites && planet.satellites.length ? `
              <p class="control-hint">PRESS [E] FOR MOONS</p>
              <button class="nav-btn view-moons">VIEW MOONS</button>
            ` : ''}
            <button class="nav-btn primary back-to-system">RETURN TO SYSTEM</button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      panel.classList.remove('hidden');
      const backBtn = panel.querySelector('.back-to-system');
      if (backBtn) backBtn.onclick = closePlanetPanel;
      const moonsBtn = panel.querySelector('.view-moons');
      if (moonsBtn) moonsBtn.onclick = doInteract; // same as pressing [E]: close panel, enter orbit
    }, 500);
  }

  function closePlanetPanel() {
    zoomTargetPlanet = null;
    targetScale = orbitModePlanet ? 3 : 1; // Return to orbit or system scale
    const panel = $('#planet-panel');
    if (panel) panel.classList.add('hidden');
  }

  function drawShip(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(8, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Engine glow when moving
    if (keys['ArrowUp'] || keys['w'] || keys['W'] || joy.active) {
      ctx.beginPath();
      ctx.moveTo(-5, 8);
      ctx.lineTo(5, 8);
      ctx.lineTo(0, 22 + Math.random() * 8);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, ${100 + Math.floor(Math.random() * 100)}, 0, 0.8)`;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      ctx.fill();
    }

    ctx.restore();
  }

  function drawPlanet(ctx, p, camX, camY) {
    const sx = p.x - camX;
    const sy = p.y - camY;

    // Glow (scaled)
    const glowSize = p.r * 2.5;
    const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowSize);
    grd.addColorStop(0, p.glowColor);
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(sx, sy, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Planet body with rotation
    ctx.save();
    ctx.translate(sx, sy);
    p.spinAngle = (p.spinAngle || 0) + 0.015;
    ctx.rotate(p.spinAngle);

    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 25 / worldScale;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Add some "surface" detail
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2 / worldScale;
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.8, 0);
    ctx.lineTo(p.r * 0.8, 0);
    ctx.stroke();
    ctx.restore();

    // Saturn ring
    if (p.ring) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, p.r * 1.8, p.r * 0.4, 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = `${p.color}88`;
      ctx.lineWidth = 5 / worldScale;
      ctx.stroke();
    }

    // Satellites (Orbits)
    if (p.satellites) {
      p.satellites.forEach((s) => {
        const ssx = s.x - camX;
        const ssy = s.y - camY;

        // Draw orbit line (faint)
        ctx.beginPath();
        ctx.arc(sx, sy, s.orbit, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1 / worldScale;
        ctx.stroke();

        // Draw satellite (Moon)
        ctx.save();
        ctx.translate(ssx, ssy);
        s.spinAngle = (s.spinAngle || 0) + 0.03;
        ctx.rotate(s.spinAngle);

        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10 / worldScale;
        ctx.fill();
        ctx.restore();

        if (worldScale > 4) {
          ctx.font = `${10 / worldScale}px "Courier New"`;
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.textAlign = 'center';
          ctx.fillText(s.label, ssx, ssy + s.r + (12 / worldScale));
        }
      });
    }

    // Labels only when not zoomed in too far
    if (worldScale < 3) {
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = 'rgba(200,220,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, sx, sy + p.r + 18);
      ctx.fillText(p.icon + ' ' + p.desc, sx, sy + p.r + 32);
    }
  }

  let frameCount = 0;

  function loop() {
    if (!running || STATE.currentScreen !== 'explore') {
      running = false;
      return;
    }

    frameCount++;
    ctx.fillStyle = 'rgba(2,2,10,0.97)';
    ctx.fillRect(0, 0, W, H);

    // Draw stars
    stars.forEach((s) => {
      s.tw += 0.01;
      const a = s.op * (0.7 + 0.3 * Math.sin(s.tw));
      ctx.beginPath();
      const sx = ((s.x - ship.x * 0.08 + 2000) % 4000);
      const sy = ((s.y - ship.y * 0.08 + 2000) % 4000);
      ctx.arc((sx / 4000) * W, (sy / 4000) * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    });

    // Ship movement
    let speed = 0.5; // Increased baseline
    const drag = 0.92;

    // Boost mechanics
    ship.boost = ship.boost === undefined ? 100 : ship.boost;
    const isBoosting = (keys['Shift'] || keys[' ']) && ship.boost > 0;

    if (isBoosting) {
      speed *= 2.5;
      ship.boost -= 1.5;
    } else {
      ship.boost = Math.min(100, ship.boost + 0.4);
    }

    // Update boost bar UI
    const boostBar = $('#boost-bar');
    if (boostBar) boostBar.style.width = `${ship.boost}%`;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) ship.angle -= 0.08;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) ship.angle += 0.08;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      ship.vx += Math.sin(ship.angle) * speed;
      ship.vy -= Math.cos(ship.angle) * speed;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
      ship.vx -= Math.sin(ship.angle) * speed * 0.5;
      ship.vy += Math.cos(ship.angle) * speed * 0.5;
    }

    // Virtual joystick: point the ship where the stick points, thrust by deflection
    if (joy.active && (joy.dx !== 0 || joy.dy !== 0)) {
      const mag = Math.min(1, Math.hypot(joy.dx, joy.dy));
      // Ship convention: vx += sin(angle), vy -= cos(angle), so angle 0 = up
      const targetAngle = Math.atan2(joy.dx, -joy.dy);
      let dA = targetAngle - ship.angle;
      dA = Math.atan2(Math.sin(dA), Math.cos(dA)); // shortest rotation
      ship.angle += dA * 0.2;
      ship.vx += Math.sin(ship.angle) * speed * mag;
      ship.vy -= Math.cos(ship.angle) * speed * mag;
    }

    ship.vx *= drag;
    ship.vy *= drag;
    // Smoothly interpolate scale
    worldScale += (targetScale - worldScale) * 0.05;

    // If looking at a specific panel, we center on it slowly
    if (zoomTargetPlanet) {
      ship.x += (zoomTargetPlanet.x - ship.x) * 0.1;
      ship.y += (zoomTargetPlanet.y - ship.y) * 0.1;
      ship.vx *= 0.8;
      ship.vy *= 0.8;
    } else {
      // Free flight in system or in orbit
      ship.x += ship.vx;
      ship.y += ship.vy;
    }

    ctx.save();
    // Translate and Scale world
    ctx.translate(W / 2, H / 2);
    ctx.scale(worldScale, worldScale);
    ctx.translate(-ship.x, -ship.y);

    // Draw planets and satellites with Orbital Mechanics
    nearPlanet = null;
    planets.forEach((p) => {
      // Update Planet Position based on orbit
      if (p.orbitRadius > 0) {
        p.orbitAngle += p.orbitSpeed;
        p.x = Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = Math.sin(p.orbitAngle) * p.orbitRadius;
      }

      // Update Satellites Positions relative to planet
      if (p.satellites) {
        p.satellites.forEach(s => {
          s.orbitAngle = (s.orbitAngle || 0) + s.speed;
          s.x = p.x + Math.cos(s.orbitAngle) * s.orbit;
          s.y = p.y + Math.sin(s.orbitAngle) * s.orbit;
        });
      }

      drawPlanet(ctx, p, 0, 0);

      const dist = Math.hypot(p.x - ship.x, p.y - ship.y);
      if (dist < p.r + 90) nearPlanet = p;

      // Check satellites
      if (p.satellites) {
        p.satellites.forEach(s => {
          const sDist = Math.hypot(s.x - ship.x, s.y - ship.y);
          if (sDist < s.r + 50) nearPlanet = s;
        });
      }
    });

    // Draw and Update Asteroids
    ctx.strokeStyle = 'rgba(120, 120, 130, 0.6)';
    ctx.fillStyle = 'rgba(20, 20, 25, 0.8)';
    ctx.lineWidth = 1.5 / worldScale;

    asteroids.forEach((ast) => {
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rot += ast.rotSpeed;

      // Wrap around logic if they drift too far
      const distFromCenter = Math.hypot(ast.x, ast.y);
      if (distFromCenter > 3500) {
        ast.x *= -0.9;
        ast.y *= -0.9;
      }

      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);
      ctx.beginPath();
      ast.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Collision detection with ship
      const distToShip = Math.hypot(ast.x - ship.x, ast.y - ship.y);
      if (distToShip < ast.r + 10) {
        // Collision!
        ship.vx *= 0.5;
        ship.vy *= 0.5;
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 200);
        // Bounce asteroid
        ast.vx *= -1.5;
        ast.vy *= -1.5;
      }
    });

    ctx.restore();

    // Draw ship at center (not scaled)
    drawShip(ctx, W / 2, H / 2, ship.angle);

    // Proximity Prompt
    const scanKey = IS_TOUCH ? 'TAP ◎' : '[E]';
    const exitKey = IS_TOUCH ? 'TAP ✕' : '[ESC]';
    if (nearPlanet && !zoomTargetPlanet) {
      if (nearPlanet.orbitRadius && !orbitModePlanet) {
        promptText.innerHTML = `<strong>ENTER ORBIT ${scanKey}</strong>: ${nearPlanet.desc}`;
        prompt.classList.add('active');
      } else if (!nearPlanet.orbitRadius) {
        promptText.innerHTML = `<strong>SCAN NODE ${scanKey}</strong>: ${nearPlanet.label}`;
        prompt.classList.add('active');
      } else {
        prompt.classList.remove('active');
      }
    } else if (orbitModePlanet && !zoomTargetPlanet) {
      promptText.innerHTML = `<strong>${exitKey} EXIT ORBIT</strong>`;
      prompt.classList.add('active');
    } else {
      prompt.classList.remove('active');
    }

    // HUD coords
    const hudCoords = $('#hud-pos');
    if (hudCoords && frameCount % 5 === 0) {
      hudCoords.textContent = `${Math.round(ship.x)}, ${Math.round(ship.y)}`;
    }

    requestAnimationFrame(loop);
  }

  loop();
}

// ─────────────────────────────────────────────
// 10. SKILL BARS ANIMATION
// ─────────────────────────────────────────────
function animateSkillBars() {
  const fills = $$('.skill-fill');
  fills.forEach((fill, i) => {
    const level = fill.dataset.level || 50;
    fill.style.width = '0%';
    setTimeout(() => {
      fill.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      fill.style.width = `${level}%`;
    }, 300 + i * 120);
  });
}

// ─────────────────────────────────────────────
// 11. SOUND TOGGLE — Web Audio Ambient
// ─────────────────────────────────────────────
function initSound() {
  const btn = $('#sound-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!STATE.audioCtx) {
      STATE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      STATE.ambientGain = STATE.audioCtx.createGain();
      STATE.ambientGain.gain.value = 0;
      STATE.ambientGain.connect(STATE.audioCtx.destination);

      // Create ambient drone (layered oscillators)
      const freqs = [55, 110, 165, 220];
      freqs.forEach((freq, i) => {
        const osc = STATE.audioCtx.createOscillator();
        const gain = STATE.audioCtx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        gain.gain.value = 0.04 / (i + 1);
        osc.connect(gain);
        gain.connect(STATE.ambientGain);
        osc.start();
      });

      // LFO for slow modulation
      const lfo = STATE.audioCtx.createOscillator();
      const lfoGain = STATE.audioCtx.createGain();
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(STATE.ambientGain.gain);
      lfo.start();
    }

    STATE.soundEnabled = !STATE.soundEnabled;

    if (STATE.soundEnabled) {
      STATE.ambientGain.gain.setTargetAtTime(0.3, STATE.audioCtx.currentTime, 0.5);
      btn.querySelector('.sound-on').style.display = '';
      btn.querySelector('.sound-off').style.display = 'none';
    } else {
      STATE.ambientGain.gain.setTargetAtTime(0, STATE.audioCtx.currentTime, 0.5);
      btn.querySelector('.sound-on').style.display = 'none';
      btn.querySelector('.sound-off').style.display = '';
    }
  });
}

// ─────────────────────────────────────────────
// 12. CONTACT FORM
// ─────────────────────────────────────────────
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    btn.textContent = 'Transmitting...';
    btn.disabled = true;

    await sleep(2000); // Simulate send

    btn.textContent = '✓ Transmitted!';
    btn.style.background = 'rgba(0,255,136,0.2)';
    btn.style.borderColor = '#00ff88';
    btn.style.color = '#00ff88';

    form.reset();

    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 3000);
  });
}

// ─────────────────────────────────────────────
// 13. STOP EXPLORE WHEN LEAVING
// ─────────────────────────────────────────────
function monitorScreenChanges() {
  const originalTransition = transitionTo;

  // When navigating away from explore, stop the loop
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target]');
    if (!btn) return;
    const targetId = btn.getAttribute('data-target');
    if (STATE.currentScreen === 'explore' && targetId !== 'explore' && STATE.spaceExplorer) {
      STATE.spaceExplorer.stop();
      STATE.spaceExplorer = null;
    }
  });
}

// ─────────────────────────────────────────────
// 13.5 LINKEDIN DATA INTEGRATION
// Fetches /profile-data.json (scraped by the bot)
// and dynamically updates Experience + About info.
// Falls back silently to hardcoded HTML if missing.
// ─────────────────────────────────────────────
async function fetchProfileData() {
  try {
    const resp = await fetch('/profile-data.json');
    if (!resp.ok) {
      console.log('[LinkedIn Data] No profile-data.json found — using hardcoded fallback.');
      return null;
    }
    const data = await resp.json();
    console.log('[LinkedIn Data] ✅ Loaded scraped profile:', data.name);
    console.log(`[LinkedIn Data]    Last scraped: ${data.lastUpdated}`);
    return data;
  } catch (err) {
    console.log('[LinkedIn Data] Fetch failed — using hardcoded fallback.', err.message);
    return null;
  }
}

function renderProfileData(data) {
  if (!data) return;

  // --- Update About headline & role ---
  const aboutName = $('.about-name');
  const aboutRole = $('.about-role');
  const aboutDesc = $('.about-desc');

  if (aboutName && data.name) aboutName.textContent = data.name;
  if (aboutRole && data.headline) aboutRole.textContent = data.headline;
  if (aboutDesc && data.about) {
    aboutDesc.textContent = data.about;
  }

  // --- Update Education list ---
  if (data.education && data.education.length > 0) {
    const eduList = $('#education-list-about');
    if (eduList) {
      eduList.innerHTML = data.education.map((edu) => `
        <div class="exp-item">
          <div class="exp-dot"></div>
          <div>
            <strong>${escapeHtml(edu.school)}</strong>
            ${edu.degree ? `<p>${escapeHtml(edu.degree)}</p>` : ''}
            ${edu.dates ? `<span class="exp-dates">${escapeHtml(edu.dates)}</span>` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  // --- Update Experience list ---
  if (data.experience && data.experience.length > 0) {
    const expList = $('#experience-list-about');
    if (expList) {
      expList.innerHTML = `
        <div class="profile-card">
          <h3>Professional Experience</h3>
          <div class="experience-list">
            ${data.experience.map((exp) => `
              <div class="exp-item">
                <div class="exp-dot"></div>
                <div>
                  <strong>${escapeHtml(exp.role)}${exp.company ? ' @ ' + escapeHtml(exp.company) : ''}</strong>
                  ${exp.duration ? `<span class="exp-dates">${escapeHtml(exp.duration)}</span>` : ''}
                  ${exp.description ? `<p>${escapeHtml(exp.description)}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  // --- Add "Last updated" badge to About section ---
  if (data.lastUpdated) {
    const aboutHero = $('.about-hero');
    if (aboutHero && !$('#data-freshness')) {
      const badge = document.createElement('div');
      badge.id = 'data-freshness';
      badge.className = 'data-freshness-badge';
      const date = new Date(data.lastUpdated);
      badge.innerHTML = `<span class="freshness-dot"></span> Auto-synced from LinkedIn · ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      aboutHero.appendChild(badge);
    }
  }
}

  // --- Update Explore mode planet details with live data ---
  // (These are in-memory objects, update them if space explorer hasn't loaded yet)
  // This is handled by the next page navigation, so no action needed here.

// Simple HTML escape to prevent XSS from scraped data
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
// 14. JOURNEY / STORY MODE
// ─────────────────────────────────────────────
function initJourney() {
  const canvas = $('#journey-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scrollContainer = $('#journey-scroll-container');
  const storyContainer = $('#story-part-container');
  const progressBar = $('.journey-progress-bar');
  const progressLabel = $('.journey-progress-label');

  const frameCount = 1333;

  // Cinematic Narrative Content - The Final Upgraded Story (User Version)
  const storyTimeline = [
    {
      id: 'beginning',
      chapter: 'Part 01',
      title: 'The Beginning',
      text: 'I wasn’t born into tech.<br>No prodigy arc. No “built my first app at ten.”<br>2005. Tech wasn’t everywhere yet.<br>I was just a kid — loud, curious, slightly chaotic.<br>Nothing special on paper.<br>Except one habit that refused to leave:<br>asking <b>why</b>.<br>Not in a clever way. Just constantly.<br>Everything else about that kid faded.<br>The question stayed.',
      range: [0.02, 0.07],
      label: 'START'
    },
    {
      id: 'quiet',
      chapter: 'Part 02',
      title: 'The Quiet Years',
      text: 'Growing up, I got quieter.<br>Not because I found answers —<br>because I had too many thoughts and nowhere to put them.<br>Overthinking became my default setting.<br>The curiosity didn’t fade. It went deeper —<br>straight toward the things I couldn’t understand.<br>Like space.<br>It’s the kind of curiosity that doesn’t give you peace.<br>It just keeps the lights on upstairs,<br>whether you want them on or not.',
      range: [0.12, 0.17],
      label: 'STILLNESS'
    },
    {
      id: 'lockdown',
      chapter: 'Part 03',
      title: 'The Chaos Era',
      text: 'Then COVID hit.<br>Lockdown. Board exams. Uncertainty about everything.<br>I’ll be honest — I didn’t “use that time productively.”<br>I was just getting through it.<br>While the internet posted about new skills and morning routines,<br>I was dealing with everything happening at once.<br>But that phase did change something.<br>It made me blunter. More aware. Less naive.<br>Not growth in the aesthetic, grind-mindset way.<br>Just reality, arriving early.',
      range: [0.22, 0.27],
      label: 'CHAOS'
    },
    {
      id: 'coding',
      chapter: 'Part 04',
      title: 'Enter Coding (and Getting Humbled)',
      text: 'When I found coding, I thought I’d finally found my thing.<br>What I actually found was confusion.<br>The concepts made perfect sense —<br>right up until I had to build something.<br>That’s where everything fell apart.<br>Me versus a blank screen.<br>The screen was winning.<br>That’s when I learned the lesson that still shapes how I work:<br><b>understanding something is not the same as being able to build it.</b>',
      range: [0.32, 0.37],
      label: 'HUMILITY'
    },
    {
      id: 'quit',
      chapter: 'Part 05',
      title: 'The Almost-Quit Phase',
      text: 'This part wasn’t pretty.<br>I wanted to quit. Not once. Not twice.<br>Pretty much daily.<br>Watching other people ship things while I fought with basics —<br>that does something to your confidence.<br>And the worst part?<br>I couldn’t even tell if I was improving.<br>There was no progress bar. No checkpoint.<br>I just kept showing up.<br>At the time it felt like stubbornness.<br>Turns out it was the whole skill.',
      range: [0.42, 0.47],
      label: 'DOUBT'
    },
    {
      id: 'shift',
      chapter: 'Part 06',
      title: 'The Shift',
      text: 'There was no main-character transformation scene.<br>Just a small, quiet decision: <b>try anyway.</b><br>I stopped trying to understand everything perfectly<br>and started building things imperfectly.<br>Small projects. Broken logic.<br>Code that barely worked — but worked enough.<br>And slowly, things clicked.<br>Not because I got smarter.<br>Because I got comfortable being bad at things<br>long enough to get good at them.',
      range: [0.52, 0.57],
      label: 'PERSISTENCE'
    },
    {
      id: 'building',
      chapter: 'Part 07',
      title: 'Building Something Real',
      text: 'One project became another.<br>Then somewhere along the way, the word changed:<br>I wasn’t <b>learning</b> anymore. I was <b>building</b>.<br>A startup team at Gigzs. Hackathons with NASA’s name on them.<br>AI systems. Client apps live in production.<br>Things where real people depended on the outcome —<br>and the outcome depended on me.<br>I still feel lost sometimes.<br>But I’m nowhere near where I started.<br>And I have the receipts now.',
      range: [0.62, 0.67],
      label: 'MOMENTUM'
    },
    {
      id: 'perspective',
      chapter: 'Part 08',
      title: 'Perspective',
      text: 'When my head gets too loud,<br>I look up. Literally.<br>Space does something to me I can’t fully explain.<br>It makes everything feel small —<br>and somehow bigger at the same time.<br>The emptiness. The scale. The unknown.<br>Overwhelming in a way that’s almost comforting.<br>I’ve lost whole evenings just sitting with it.<br>Probably not the most productive use of my time.<br>Definitely the most honest.',
      range: [0.72, 0.77],
      label: 'SPACE'
    },
    {
      id: 'becoming',
      chapter: 'Part 09',
      title: 'Becoming',
      text: 'There’s no straight path from where I started<br>to where I’m pointed.<br>I don’t come from a background that leads to space.<br>So I’m building the path myself —<br>through code, through startups,<br>through learning things I don’t fully understand yet,<br>through failing and retrying until something gives.<br>Because if I want to reach somewhere I don’t belong yet,<br>the only move is to become someone who does.',
      range: [0.82, 0.87],
      label: 'GROWTH'
    },
    {
      id: 'direction',
      chapter: 'Part 10',
      title: 'The Direction',
      text: 'I’m not chasing some polished version of success.<br>I’m chasing freedom.<br>Freedom to build. To explore. To never feel stuck.<br>And yes — money is part of that.<br>Freedom isn’t free; let’s not pretend otherwise.<br>But underneath it all, the engine is simpler:<br>the thing that scares me most<br>is becoming someone I never wanted to be.<br>So I keep building.<br>And maybe one day I won’t just be looking at space —<br>I’ll be closer to it.',
      range: [0.92, 0.96],
      label: 'FUTURE'
    },
    {
      id: 'destination',
      chapter: '',
      title: 'The Journey Continues',
      text: 'That’s the story so far. The rest is still being written —<br>possibly by whoever’s reading this.<br><br><button class="nav-btn primary" data-target="explore" style="pointer-events: auto; opacity: 1; transform: none; display: inline-block; margin-top: 1rem;">Explore the Planets</button>',
      range: [0.98, 1.0],
      label: 'DESTINATION'
    }
  ];

  // WebP frames are ~45KB each (vs ~1MB PNG), so we can afford a much
  // larger cache and preload window — this is what makes scrubbing smooth.
  const FRAME_CACHE_LIMIT = 360;
  const PRELOAD_WINDOW = 70;
  const MAX_INFLIGHT = 24; // cap concurrent loads so fast scrubbing can't flood the network
  const COMPLETED_FRAMES = new Set();
  let inflight = 0;

  // Dynamic frame getter with caching and cleanup
  function getFrame(index) {
    if (STATE.journeyImages[index]) return STATE.journeyImages[index];

    // Load on demand
    const img = new Image();
    img.decoding = 'async';
    inflight++;
    img.src = `/journey_frames/${(index + 1).toString().padStart(5, '0')}.webp`;
    img.onload = () => {
      inflight--;
      if (STATE.journeyImages[index]) COMPLETED_FRAMES.add(index);
      // Pre-decode off the main thread so drawImage never stalls on decode
      if (img.decode) img.decode().catch(() => {});
    };
    img.onerror = () => {
      inflight--;
      delete STATE.journeyImages[index]; // allow retry later
    };
    STATE.journeyImages[index] = img;

    // Memory cleanup: If too many frames cached, remove the furthest ones
    const cachedIndices = Object.keys(STATE.journeyImages).map(Number);
    if (cachedIndices.length > FRAME_CACHE_LIMIT) {
      const furthest = cachedIndices.sort((a, b) => Math.abs(b - index) - Math.abs(a - index))[0];
      delete STATE.journeyImages[furthest];
      COMPLETED_FRAMES.delete(furthest);
    }

    return img;
  }

  // Preload frames near the current one. Forward frames first (closest
  // to furthest), then a short backward tail — and stop spawning new
  // requests once the in-flight budget is used up.
  function preloadNeighbors(index) {
    for (let i = 0; i <= PRELOAD_WINDOW; i++) {
      if (inflight >= MAX_INFLIGHT) return;
      const target = index + i;
      if (target >= 0 && target < frameCount) getFrame(target);
    }
    for (let i = 1; i <= 15; i++) {
      if (inflight >= MAX_INFLIGHT) return;
      const target = index - i;
      if (target >= 0 && target < frameCount) getFrame(target);
    }
  }

  // Warm a coarse "spine" of frames across the whole timeline so that
  // jumping anywhere always has a nearby ready frame to show instantly.
  for (let i = 0; i < frameCount; i += 50) getFrame(i);

  function renderFrame(index) {
    const img = getFrame(index);
    preloadNeighbors(index);

    // If current frame isn't ready, find the NEAREST one that IS ready
    let targetImg = (img.complete && img.naturalWidth > 0) ? img : null;
    
    if (!targetImg && COMPLETED_FRAMES.size > 0) {
      const nearestIdx = [...COMPLETED_FRAMES].sort((a, b) => Math.abs(a - index) - Math.abs(b - index))[0];
      targetImg = STATE.journeyImages[nearestIdx];
    }

    if (targetImg && targetImg.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / targetImg.naturalWidth, canvas.height / targetImg.naturalHeight);
      const w = targetImg.naturalWidth * scale;
      const h = targetImg.naturalHeight * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(targetImg, x, y, w, h);
    }
  }


  // --- Virtual Scroll System ---
  let autoScrollSpeed = 6.0;

  function updateTimeline() {
    if (!scrollContainer || STATE.currentScreen !== 'journey') return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const maxScroll = 12000;

    if (STATE.journeyStartTime === null) {
      STATE.journeyStartTime = performance.now();
      console.log("[Journey] Initialized cinematic engine");
    }

    // Cinematic intro: glide forward until we reach the first story beat
    // (4% of the timeline). Target-based, not time-based — slow devices
    // get the same landing spot, just a slightly longer glide.
    if (!STATE.journeyIntroDone) {
      STATE.journeyTarget += autoScrollSpeed;
      if (STATE.journeyTarget >= maxScroll * 0.04) STATE.journeyIntroDone = true;
    }

    if (STATE.journeyTarget < 0) STATE.journeyTarget = 0;
    if (STATE.journeyTarget > maxScroll) STATE.journeyTarget = maxScroll;

    STATE.journeyScroll += (STATE.journeyTarget - STATE.journeyScroll) * 0.1;
    const scrollFraction = STATE.journeyScroll / maxScroll;

    // Cinematic Finale: Fade to black as we reach the singularity
    if (scrollFraction > 0.98) {
      document.querySelector('.fade-to-black-overlay')?.classList.add('visible');
    } else {
      document.querySelector('.fade-to-black-overlay')?.classList.remove('visible');
    }

    const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
    renderFrame(frameIndex);

    // Update Progress UI
    if (progressBar) progressBar.style.width = `${scrollFraction * 100}%`;

    // Check for active story part
    let activePart = null;
    storyTimeline.forEach(part => {
      if (scrollFraction >= part.range[0] && scrollFraction <= part.range[1]) {
        activePart = part;
      }
    });

    if (activePart) {
      if (storyContainer.dataset.current !== activePart.id) {
        storyContainer.innerHTML = `
          <div class="story-part active">
            <div class="story-chapter">${activePart.chapter}</div>
            <h2 class="story-title">${activePart.title}</h2>
            <div class="story-text">${activePart.text}</div>
          </div>
        `;
        storyContainer.dataset.current = activePart.id;
        if (progressLabel) progressLabel.textContent = activePart.label;
      }
    } else {
      if (storyContainer.dataset.current !== 'none') {
        storyContainer.innerHTML = '';
        storyContainer.dataset.current = 'none';
      }
    }

    // Note: requestAnimationFrame handled by the main loop() wrapper
  }

  if (STATE.journeyLoopRunning) {
    return; // Already running, don't start another one
  }

  // Custom update wrapper to manage state
  function loop() {
    if (STATE.currentScreen === 'journey') {
      STATE.journeyLoopRunning = true;
      updateTimeline();
      requestAnimationFrame(loop);
    } else {
      STATE.journeyLoopRunning = false;
    }
  }

  STATE.journeyInitialized = true;
  loop(); // Start or restart the loop

  // Bind input listeners exactly once — initJourney() re-runs on every visit,
  // and stacking these would multiply the scroll speed each time.
  if (!STATE.journeyListenersBound) {
    STATE.journeyListenersBound = true;

    // Intercept wheel for "boost"
    window.addEventListener('wheel', (e) => {
      if (STATE.currentScreen !== 'journey') return;
      STATE.journeyTarget += e.deltaY * 3.5; // Even more boost
    }, { passive: true });

    // Touch support for swipe boost
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (STATE.currentScreen !== 'journey') return;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (STATE.currentScreen !== 'journey') return;
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      STATE.journeyTarget += diff * 3.5; // Match wheel feel on touch
      touchStartY = touchY;
    }, { passive: true });
  }

  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', handleResize);
  handleResize();
  updateTimeline(); // Start loop
}

// ─────────────────────────────────────────────
// 15. BOOT — RUN EVERYTHING
// ─────────────────────────────────────────────
async function boot() {
  // Set initial hidden state for landing elements
  $$('.landing-buttons .nav-btn').forEach((btn) => {
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px)';
    btn.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const sub = $('.landing-subtitle');
  if (sub) {
    sub.style.opacity = '0';
    sub.style.transform = 'translateY(15px)';
    sub.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  }

  // Style transition overlay
  const overlay = $('#transition-overlay');
  if (overlay) {
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: #000; opacity: 0; pointer-events: none;
      transition: opacity 0.35s ease;
    `;
  }

  initCursor();
  initNavigation();
  initSound();
  initContactForm();
  monitorScreenChanges();
  initGlitch();
  initJourney();

  // Fetch LinkedIn profile data (non-blocking, falls back gracefully)
  fetchProfileData().then((data) => {
    if (data) renderProfileData(data);
  });

  // Run loading sequence
  await runLoadingScreen();
}

// Kick it off
boot();
