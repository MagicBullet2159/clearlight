/* =========================================================
   RECALL — scroll-driven decay engine
   ========================================================= */
(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const $ = (id) => document.getElementById(id);

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const fade = (p, a, b, c, d) => Math.min(seg(p, a, b), 1 - seg(p, c, d));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------
     颜色阶段
     --------------------------------------------------------- */
  const STOPS = [
    { at: 0.00, bg: [251, 251, 249], fg: [20, 22, 24], ac: [30, 59, 255], mu: [109, 115, 121] },
    { at: 0.20, bg: [250, 249, 246], fg: [22, 23, 26], ac: [34, 58, 232], mu: [110, 114, 120] },
    { at: 0.30, bg: [247, 244, 237], fg: [28, 26, 23], ac: [52, 52, 196], mu: [116, 112, 106] },
    { at: 0.38, bg: [238, 232, 220], fg: [36, 32, 26], ac: [92, 44, 74], mu: [124, 114, 102] },
    { at: 0.46, bg: [221, 208, 188], fg: [42, 33, 26], ac: [120, 36, 32], mu: [126, 112, 98] },
    { at: 0.560, bg: [200, 186, 166], fg: [40, 31, 24], ac: [132, 32, 28], mu: [112, 98, 86] },
    { at: 0.578, bg: [204, 190, 170], fg: [40, 31, 24], ac: [132, 32, 28], mu: [112, 98, 86] },
    { at: 0.608, bg: [52, 43, 36], fg: [228, 218, 206], ac: [160, 40, 32], mu: [150, 136, 122] },
    { at: 0.68, bg: [20, 17, 14], fg: [204, 194, 182], ac: [180, 44, 36], mu: [132, 120, 108] },
    { at: 0.80, bg: [5, 5, 4], fg: [172, 162, 152], ac: [194, 48, 38], mu: [104, 96, 88] },
    { at: 1.00, bg: [0, 0, 0], fg: [150, 140, 130], ac: [200, 50, 40], mu: [92, 86, 78] },
  ];

  function sampleColor(p, key) {
    let i = 0;
    while (i < STOPS.length - 2 && p > STOPS[i + 1].at) i++;
    const a = STOPS[i];
    const b = STOPS[i + 1];
    const t = clamp01((p - a.at) / (b.at - a.at));
    const ca = a[key];
    const cb = b[key];
    return [
      Math.round(lerp(ca[0], cb[0], t)),
      Math.round(lerp(ca[1], cb[1], t)),
      Math.round(lerp(ca[2], cb[2], t)),
    ];
  }

  const rgb = (c) => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

  /* ---------------------------------------------------------
     元素
     --------------------------------------------------------- */
  const grainEl = $('grain');
  const flashEl = $('flash');
  const curtainEl = $('curtain');
  const endstageEl = $('endstage');
  const eyeEl = $('eye');
  const pupilEl = $('pupil');
  const eyeWordEl = document.querySelector('.eye-word');
  const endLastEl = $('endLast');
  const resetHintEl = $('resetHint');
  const monoBackEl = $('monoBack');
  const navEl = $('nav');
  const navCtaEl = $('navCta');
  const tick3El = $('tick3');
  const memCountEl = $('memCount');
  const recTimerEl = $('recTimer');
  const liveClockEl = $('liveClock');
  const dwellEl = $('dwell');
  const scrollPxEl = $('scrollPx');
  const visitsEl = $('visits');
  const tDevice = $('tDevice');
  const tViewport = $('tViewport');
  const tLang = $('tLang');
  const tTz = $('tTz');
  const tCursor = $('tCursor');
  const tSpeed = $('tSpeed');
  const tBehind = $('tBehind');
  const matchPctEl = $('matchPct');
  const archivePrice = $('archivePrice');
  const scanEl = document.querySelector('.fx-scan');

  const navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  const endWords = Array.prototype.slice.call(document.querySelectorAll('.ew'));
  const NAV_SETS = [
    ['功能', '用户', '定价', '安全'],
    ['观察', '记录', '档案', '许可'],
    ['正在', '看着', '你', '—'],
  ];
  let navStage = -1;

  const tracks = Array.prototype.slice.call(document.querySelectorAll('[data-track]'));
  const watchSec = $('watch');
  const privacySec = $('privacy');
  const scrollCue = document.querySelector('.scroll-cue');

  /* ---------------------------------------------------------
     索引流：生成记忆条目
     --------------------------------------------------------- */
  (function buildStream() {
    const host = $('corrStream');
    if (!host) return;
    const sources = ['本设备', '本设备', '本设备', '其他设备', '未知', '本设备', '本设备'];
    const states = ['已归档', '已归档', '已归档', '已归档', '写入中', '已归档'];
    let num = 4892104331;
    const rows = [];
    for (let i = 0; i < 26; i++) {
      num -= 1;
      const src = sources[Math.floor(Math.random() * sources.length)];
      const st = states[Math.floor(Math.random() * states.length)];
      const n = String(num).padStart(10, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      rows.push('<p>MEM ' + n + ' · 来源：' + src + ' · 状态：' + st + '</p>');
    }
    rows.push('<p>MEM 4,892,104,299 · 来源：未知 · 状态：已删除，但仍在</p>');
    rows.push('<p class="self">MEM 000,000,000,001 · 来源：你 · 状态：永远</p>');
    host.innerHTML = rows.join('');
  })();

  /* ---------------------------------------------------------
     访问计数
     --------------------------------------------------------- */
  let visits = 1;
  try {
    visits = parseInt(localStorage.getItem('recall.visits') || '0', 10) + 1;
    localStorage.setItem('recall.visits', String(visits));
  } catch (e) { /* 隐私模式 */ }
  if (visitsEl) visitsEl.textContent = String(visits);

  /* ---------------------------------------------------------
     设备信息
     --------------------------------------------------------- */
  const ua = navigator.userAgent;
  let deviceName = '未知设备';
  if (/Windows NT/i.test(ua)) deviceName = 'Windows';
  else if (/Mac OS X/i.test(ua)) deviceName = 'macOS';
  else if (/Android/i.test(ua)) deviceName = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) deviceName = 'iOS';
  else if (/Linux/i.test(ua)) deviceName = 'Linux';

  if (tDevice) tDevice.textContent = deviceName;
  if (tLang) tLang.textContent = navigator.language || '—';
  try {
    if (tTz) tTz.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || '—';
  } catch (e) { if (tTz) tTz.textContent = 'UTC'; }

  function updateViewport() {
    if (tViewport) tViewport.textContent = window.innerWidth + ' × ' + window.innerHeight;
  }
  updateViewport();

  let cursorX = 0.5, cursorY = 0.5;
  let mx = 0, my = 0;
  let lastMouseAt = 0;
  window.addEventListener('mousemove', function (e) {
    cursorX = e.clientX / window.innerWidth;
    cursorY = e.clientY / window.innerHeight;
    if (tCursor) {
      tCursor.textContent =
        Math.round(cursorX * 100) + '% , ' + Math.round(cursorY * 100) + '%';
    }
    mx = cursorX * 2 - 1;
    my = cursorY * 2 - 1;
    lastMouseAt = performance.now();
  }, { passive: true });

  /* ---------------------------------------------------------
     音频：低频嗡鸣，首次交互后启动
     --------------------------------------------------------- */
  let audioCtx = null;
  let audioNodes = [];
  function initAudio() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      audioCtx = new AC();
      const pairs = [[55, 0.9], [55.7, 0.7], [110, 0.35]];
      pairs.forEach(function (pair) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = pair[0];
        g.gain.value = 0.0001;
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        audioNodes.push({ gain: g, base: pair[1] });
      });
    } catch (e) { audioCtx = null; }
  }
  ['click', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, initAudio, { once: true, passive: true });
  });

  /* ---------------------------------------------------------
     状态
     --------------------------------------------------------- */
  const t0 = performance.now();
  let lastT = t0;
  let scrollY = window.scrollY || 0;
  let prevScrollY = scrollY;
  let scrollVel = 0;
  let maxScroll = 1;
  let sealed = false;
  let punished = false;
  let peaked = false;
  let jumpUntil = 0;
  let upAccum = 0;
  let peakP = 0;
  let memAcc = 0;
  let memTotal = 4892104331;
  let uid = 0;
  let eyeX = 0, eyeY = 0;
  let lastTitle = '';
  let lastBehind = 0;
  let lastClockText = '';
  let lastTimerText = '';
  let lastDwell = -1;
  let lastPx = -1;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    updateViewport();
  }
  measure();
  window.addEventListener('resize', measure);
  setTimeout(measure, 400);

  /* ---------------------------------------------------------
     进度计算
     --------------------------------------------------------- */
  function progressOf(mode, r, vh) {
    if (mode === 'exit') return clamp01(-r.top / vh);
    if (mode === 'hold') return clamp01((vh * 0.9 - r.top) / (vh * 0.55));
    if (mode === 'enter') return clamp01((vh - r.top) / vh);
    return clamp01((vh - r.top) / (vh + r.height));
  }

  /* ---------------------------------------------------------
     闪白
     --------------------------------------------------------- */
  let flashLock = false;
  function flash() {
    if (flashLock || !flashEl) return;
    flashLock = true;
    flashEl.style.transition = 'none';
    flashEl.style.opacity = '1';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        flashEl.style.transition = 'opacity 480ms cubic-bezier(.2,.9,.3,1)';
        flashEl.style.opacity = '0';
        setTimeout(function () { flashLock = false; }, 600);
      });
    });
  }

  /* ---------------------------------------------------------
     主循环
     --------------------------------------------------------- */
  function frame(now) {
    const dt = Math.min(80, now - lastT);
    lastT = now;

    const vh = window.innerHeight;
    scrollY = window.scrollY || window.pageYOffset || 0;
    const p = clamp01(scrollY / maxScroll);
    const dScroll = scrollY - prevScrollY;
    prevScrollY = scrollY;

    scrollVel = scrollVel * 0.85 + Math.abs(dScroll) * 0.15;
    if (p > peakP) peakP = p;

    /* ---- 颜色 ---- */
    const bg = sampleColor(p, 'bg');
    const fg = sampleColor(p, 'fg');
    const ac = sampleColor(p, 'ac');
    const mu = sampleColor(p, 'mu');

    root.style.setProperty('--bg', rgb(bg));
    root.style.setProperty('--fg', rgb(fg));
    root.style.setProperty('--accent', rgb(ac));
    root.style.setProperty('--muted', rgb(mu));
    root.style.setProperty('--line', rgba(fg, 0.14));
    root.style.setProperty('--thumb', rgba(fg, 0.2));
    root.style.setProperty('--grain', (0.045 + p * 0.11).toFixed(3));
    root.style.setProperty('--vignette', (seg(p, 0.18, 0.88) * 0.92).toFixed(3));

    if (grainEl) {
      const bm = p < 0.58 ? 'multiply' : 'screen';
      if (grainEl.style.mixBlendMode !== bm) grainEl.style.mixBlendMode = bm;
    }
    if (scanEl) scanEl.style.opacity = (seg(p, 0.6, 0.95) * 0.42).toFixed(3);

    /* ---- 各段进度 ---- */
    const rects = [];
    for (let i = 0; i < tracks.length; i++) {
      rects.push({ el: tracks[i], r: tracks[i].getBoundingClientRect() });
    }
    let watchLP = 0;
    let privacyLP = 0;
    for (let i = 0; i < rects.length; i++) {
      const item = rects[i];
      const mode = item.el.dataset.track || 'full';
      const v = progressOf(mode, item.r, vh);
      item.el.style.setProperty('--lp', v.toFixed(4));
      if (item.el === watchSec) watchLP = v;
      if (item.el === privacySec) privacyLP = v;
    }

    /* ---- 记忆计数 ---- */
    memAcc += dt;
    if (memAcc > Math.max(12, 260 - p * 250)) {
      memAcc = 0;
      memTotal += 1 + Math.floor(Math.random() * (1 + Math.floor(p * p * 60)));
      if (memCountEl) memCountEl.textContent = memTotal.toLocaleString('en-US');
    }

    /* ---- 时钟 / 计时 ---- */
    const elapsed = Math.floor((now - t0) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const sec = String(elapsed % 60).padStart(2, '0');
    const timerText = m + ':' + sec;
    if (recTimerEl && timerText !== lastTimerText) {
      lastTimerText = timerText;
      recTimerEl.textContent = timerText;
    }
    if (dwellEl && elapsed !== lastDwell) {
      lastDwell = elapsed;
      dwellEl.textContent = String(elapsed);
    }

    if (liveClockEl) {
      const d = new Date();
      const clock =
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
      if (clock !== lastClockText) {
        lastClockText = clock;
        liveClockEl.textContent = clock;
      }
    }
    if (scrollPxEl) {
      const px = Math.round(scrollY);
      if (px !== lastPx) {
        lastPx = px;
        scrollPxEl.textContent = String(px);
      }
    }

    /* ---- 阅读速度 ---- */
    if (tSpeed && (now % 700) < 20) {
      let label = '很慢';
      if (scrollVel > 240) label = '正常';
      if (scrollVel > 700) label = '偏快';
      if (scrollVel > 1400) label = '很快';
      if (scrollVel < 6) label = '停住了';
      tSpeed.textContent = label;
    }

    /* ---- 身后 ---- */
    if (tBehind && watchLP > 0.35 && now - lastBehind > 850) {
      lastBehind = now;
      const words = ['空', '空', '空', '空', '有影子', '空', '很近', '空'];
      if (Math.random() < 0.28 + p * 0.4) {
        tBehind.textContent = words[Math.floor(Math.random() * words.length)];
      }
    }

    /* ---- 画像匹配度 ---- */
    if (matchPctEl) {
      const v = 41 + Math.round(seg(p, 0.35, 0.8) * 58);
      matchPctEl.textContent = String(v);
    }

    /* ---- 导航变质 ---- */
    let stage = 0;
    if (p > 0.5) stage = 2;
    else if (p > 0.2) stage = 1;
    if (stage !== navStage) {
      navStage = stage;
      const set = NAV_SETS[stage];
      navLinks.forEach(function (a, i) { a.textContent = set[i] || '—'; });
      if (navCtaEl) {
        navCtaEl.textContent = stage === 0 ? '免费开始' : stage === 1 ? '你已被记录' : '继续';
      }
    }
    if (navEl) navEl.style.opacity = String(1 - seg(p, 0.48, 0.56));

    /* ---- 隐私第三条的勾变成叉 ---- */
    if (tick3El && privacyLP > 0.42) tick3El.classList.add('turn');

    /* ---- 标题 ---- */
    let title = 'RECALL · 你的人生，值得被完整保存';
    if (p > 0.5) title = 'RECALL · 正在记录';
    if (p > 0.68) title = 'RECALL';
    if (p > 0.84) title = '别往下滚';
    if (p > 0.93) title = '你在这里';
    if (sealed) title = '你在看我';
    if (title !== lastTitle) { lastTitle = title; document.title = title; }

    /* ---- 终局 ---- */
    if (p > 0.858) sealed = true;

    const curtainO = sealed ? 1 : seg(p, 0.8, 0.858);
    if (curtainEl) curtainEl.style.opacity = curtainO.toFixed(3);
    if (curtainO > 0.02) body.classList.add('sealed');
    else body.classList.remove('sealed');

    if (endstageEl) {
      let esO = seg(p, 0.858, 0.885);
      if (sealed && p < 0.8) esO = 1;
      endstageEl.style.opacity = esO.toFixed(3);
    }

    const ew = endWords;
    if (ew.length === 4) {
      ew[0].style.opacity = fade(p, 0.818, 0.834, 0.868, 0.882).toFixed(3);
      ew[1].style.opacity = fade(p, 0.878, 0.892, 0.908, 0.922).toFixed(3);
      ew[2].style.opacity = fade(p, 0.917, 0.929, 0.941, 0.951).toFixed(3);
      ew[3].style.opacity = fade(p, 0.947, 0.962, 1.06, 1.1).toFixed(3);
    }

    if (eyeEl) {
      const inA = seg(p, 0.862, 0.912);
      const grow = seg(p, 0.955, 1.0);
      const sc = 0.24 + inA * 0.62 + grow * grow * 0.56;
      if (now > jumpUntil) eyeEl.style.setProperty('--eyeScale', sc.toFixed(3));
      eyeEl.style.setProperty('--eyeOpacity', (inA * 0.95).toFixed(3));
    }

    /* ---- 到底之后的那一下 ---- */
    if (!peaked && p > 0.994) {
      peaked = true;
      setTimeout(function () {
        if (!eyeEl) return;
        jumpUntil = performance.now() + 2000;
        eyeEl.style.transition = 'transform 110ms cubic-bezier(.5,0,.9,1)';
        eyeEl.style.setProperty('--eyeScale', '3.1');
        if (flashEl) {
          flashEl.style.transition = 'opacity 70ms linear';
          flashEl.style.opacity = '0.42';
        }
        setTimeout(function () {
          if (flashEl) {
            flashEl.style.transition = 'opacity 900ms ease';
            flashEl.style.opacity = '0';
          }
        }, 80);
        setTimeout(function () {
          if (!eyeEl) return;
          eyeEl.style.transition = 'transform 2200ms cubic-bezier(.16,.84,.24,1)';
          eyeEl.style.setProperty('--eyeScale', '1.34');
        }, 160);
      }, 2800);
    }

    if (pupilEl) {
      const idle = now - lastMouseAt > 1900;
      const tx = idle ? Math.sin(now / 2600) * 0.26 : mx;
      const ty = idle ? Math.cos(now / 3550) * 0.18 : my;
      eyeX = lerp(eyeX, tx * 20, 0.07);
      eyeY = lerp(eyeY, ty * 13, 0.07);
      const grow2 = seg(p, 0.955, 1.0);
      const shrink = 1 - grow2 * 0.6;
      pupilEl.setAttribute('cx', (200 + eyeX * shrink).toFixed(2));
      pupilEl.setAttribute('cy', (98 + eyeY * shrink).toFixed(2));
      pupilEl.setAttribute('r', (22 + grow2 * 14).toFixed(2));
    }

    if (eyeWordEl && !eyeWordEl.classList.contains('on') && p > 0.988) {
      eyeWordEl.classList.add('on');
    }

    /* ---- 往回滚的代价 ---- */
    if (dScroll < 0) upAccum += -dScroll;
    else upAccum = Math.max(0, upAccum - dScroll * 0.6);

    if (peakP > 0.52 && upAccum > 520 && monoBackEl) {
      monoBackEl.classList.add('show');
    }

    if (sealed && !punished && scrollY < maxScroll * 0.62) {
      punished = true;
      flash();
      if (endLastEl) endLastEl.classList.add('on');
    }

    /* 回头到底：只剩一个出口 */
    if (punished && resetHintEl) {
      if (p < 0.06) resetHintEl.classList.add('on');
      else resetHintEl.classList.remove('on');
    }

    /* ---- 档案价签：逐步失去数字 ---- */
    if (archivePrice && Math.random() < 0.006) {
      const roll = Math.random();
      archivePrice.textContent = p < 0.32 ? (roll < 0.5 ? '¥—' : '¥ —') : roll < 0.5 ? '¥' : '—';
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  /* ---------------------------------------------------------
     滚轮 / 触摸的细微阻力提示（仅封存后）
     --------------------------------------------------------- */
  window.addEventListener('wheel', function (e) {
    if (!sealed) return;
    if (e.deltaY < 0 && scrollY < maxScroll * 0.7) {
      if (Math.random() < 0.07) flash();
    }
  }, { passive: true });
})();