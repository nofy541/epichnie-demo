'use strict';
/* ЭПИЧНЫЕ — поведение сайта.
   1) прайс + калькулятор, аккордеон, меню, статус «открыто» — работают всегда;
   2) анимации (GSAP + ScrollTrigger + Lenis) — только если нет prefers-reduced-motion. */

// ───────────── данные прайса: онлайн-запись студии (YCLIENTS, Богатырский), октябрь 2026 ─────────────
// [название, цена ₽, минут, пояснение?]
const PRICE = {
  f: [
    ['Комплексы', [
      ['Всё тело', 8200, 90, 'подмышки, тотальное бикини, межъягодичная зона, руки, ноги, стопы и пальцы + 2 малые зоны на выбор'],
      ['Всё тело — безлимит', 14900, 120],
      ['Подмышки + тотальное бикини + ноги полностью', 6400, 60],
      ['Подмышки + тотальное бикини + голени', 5200, 60],
      ['Подмышки + тотальное бикини', 3800, 30],
    ]],
    ['Лицо и шея', [
      ['Верхняя губа', 1300, 10], ['Подбородок', 1300, 10], ['Бакенбарды', 1300, 10], ['Скулы', 1300, 10],
      ['Лицо — 4 зоны на выбор', 2900, 20], ['Шея', 1400, 15],
    ]],
    ['Руки', [
      ['Подмышки', 1400, 10], ['Руки до локтя', 2900, 20], ['Руки полностью', 3000, 25], ['Кисти / стопы с пальцами', 1300, 10],
    ]],
    ['Ноги', [
      ['Колени', 1400, 15], ['Голени с коленями', 2900, 25], ['Бёдра с коленями', 2900, 25], ['Ноги полностью', 4300, 40],
    ]],
    ['Бикини', [
      ['Классическое бикини', 2100, 15], ['Среднее бикини', 2400, 15], ['Тотальное бикини', 2900, 15], ['Межъягодичная область', 1300, 10],
    ]],
    ['Тело', [
      ['Ареолы груди', 1300, 10], ['Белая линия живота', 1300, 10], ['Живот полностью', 2900, 15],
      ['Поясница', 2900, 20], ['Спина', 3900, 30], ['Ягодицы полностью', 2900, 20],
    ]],
  ],
  m: [
    ['Комплексы', [
      ['Всё тело', 12000, 120], ['Всё тело — безлимит', 17900, 150], ['Тотальное бикини + подмышки', 4000, 60],
    ]],
    ['Лицо и голова', [
      ['Лицо', 3300, 30], ['Борода полностью', 2900, 30], ['Щёки', 1300, 30], ['Подбородок', 1300, 15], ['Бакенбарды', 1300, 15],
      ['Верхняя губа', 1300, 15], ['Шея', 1600, 30], ['Голова полностью', 3500, 40, 'шея по линии волос входит'],
    ]],
    ['Руки и плечи', [
      ['Подмышки', 1600, 15], ['Плечи', 2900, 40], ['Руки до локтя', 2900, 30], ['Руки полностью', 3300, 40], ['Кисти / стопы с пальцами', 1300, 30],
    ]],
    ['Ноги', [
      ['Голени с коленями', 2900, 30], ['Бёдра с коленями', 2900, 40], ['Ноги полностью', 4300, 60],
    ]],
    ['Тело', [
      ['Грудь полностью', 2900, 30], ['Живот полностью', 2900, 30], ['Белая линия живота', 1300, 10], ['Ареолы груди', 1300, 15],
      ['Спина полностью', 4300, 30], ['Лопатки', 2900, 30], ['Поясница', 2900, 15], ['Ягодицы полностью', 2900, 30], ['Межъягодичная область', 1300, 20],
    ]],
    ['Бикини', [['Классическое бикини', 2100, 15], ['Тотальное бикини', 2900, 30]]],
  ],
};
const PROMO = [
  ['Глубокое бикини + подмышки', 1900, '30 мин'],
  ['Глубокое бикини + подмышки + голени', 2990, '1 ч'],
  ['Глубокое бикини + подмышки + ноги полностью', 3990, '1 ч'],
];
const EXTRA = {
  f: [['Прессотерапия: живот + ноги', 1750, '1 ч 15 мин'], ['Бритьё одной зоны', 200, '5 мин']],
  m: [['Бритьё одной зоны', 200, '5 мин']],
};
const DISCOUNT = { 1: 0, 6: 5, 8: 10, 10: 15, 12: 20 }; // постер «Скидки на абонементы»

// ───────────── утилиты ─────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const rub = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const dur = (m) => (m >= 60 ? Math.floor(m / 60) + ' ч' + (m % 60 ? ' ' + (m % 60) + ' мин' : '') : m + ' мин');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const hasGsap = !!(window.gsap && window.ScrollTrigger);
const MOTION = root.classList.contains('motion') && hasGsap;
const FINE = root.classList.contains('mouse') && hasGsap;
if (root.classList.contains('motion') && !hasGsap) { root.classList.remove('motion', 'mouse'); root.classList.add('ready'); }
let lenis = null;

// ───────────── прайс и калькулятор ─────────────
const list = $('#plist');
const seg = $('.seg');
let gender = 'f';
const picked = new Map();
let shownTotal = 0, totalTween = null;

function render() {
  picked.clear();
  const promo = gender === 'f' ? `
    <section class="promo" data-reveal aria-labelledby="pr-t">
      <h3 id="pr-t">Первый визит: <em>−20% на любую зону</em></h3>
      <ul>${PROMO.map(([n, p, t]) => `<li><span>${n}<small>${t} · акция для новых клиентов</small></span><b>${rub(p)}</b></li>`).join('')}</ul>
      <p class="fine">Акции не суммируются между собой.</p>
    </section>` : '';
  const groups = PRICE[gender].map(([title, rows], g) => `
    <section class="grp" data-reveal aria-labelledby="g${g}">
      <h3 id="g${g}">${title}<small>${String(rows.length).padStart(2, '0')} позиций</small></h3>
      <ul>${rows.map(([n, p, m, note], i) => `
        <li><label>
          <input type="checkbox" data-id="${g}-${i}">
          <span class="box" aria-hidden="true"><svg class="ic"><use href="#i-check"/></svg></span>
          <span class="nm">${esc(n)}<small>${dur(m)}${note ? ' · ' + esc(note) : ''}</small></span>
          <span class="pr">${rub(p)}</span>
        </label></li>`).join('')}</ul>
    </section>`).join('');
  const extra = `
    <section class="grp" data-reveal aria-labelledby="gx"><h3 id="gx">Дополнительно<small>без скидок</small></h3>
      <ul>${EXTRA[gender].map(([n, p, t]) => `<li><div class="row"><span class="nm">${n}<small>${t}</small></span><span class="pr">${rub(p)}</span></div></li>`).join('')}</ul>
    </section>`;
  list.innerHTML = promo + groups + extra;
  update(true);
  if (window.__afterRender) window.__afterRender();
}

function setTotal(v, instant) {
  const el = $('#cTotal');
  totalTween && totalTween.kill();
  if (!MOTION || instant) { shownTotal = v; el.textContent = rub(v); return; }
  const o = { v: shownTotal };
  totalTween = gsap.to(o, { v, duration: 0.9, ease: 'power3.out', onUpdate() { shownTotal = o.v; el.textContent = rub(o.v); } });
  gsap.fromTo(el, { scale: 1.12 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1,.45)', overwrite: 'auto' });
}

function update(instant) {
  const items = [...picked.values()];
  const n = +$('input[name=n]:checked').value;
  const d = DISCOUNT[n];
  const session = items.reduce((s, i) => s + i[1], 0);
  const minutes = items.reduce((s, i) => s + i[2], 0);
  const total = session * n * (1 - d / 100);
  $('.sum').classList.toggle('is-empty', items.length === 0);
  $('#sumEmpty').hidden = items.length > 0;
  $('#sumBody').hidden = items.length === 0;
  $('#chips').innerHTML = items.map((i) => `<li>${esc(i[0])}</li>`).join('');
  $('#cSession').textContent = rub(session);
  $('#cTime').textContent = '≈ ' + dur(minutes);
  $('#cSaveRow').hidden = n === 1;
  $('#cSave').textContent = `−${d}% · −${rub(session * n - total)}`;
  $('#cLabel').textContent = n === 1 ? 'Итого' : `Курс из ${n} процедур`;
  setTotal(total, instant);
}

list.addEventListener('change', (e) => {
  const cb = e.target.closest('input[data-id]');
  if (!cb) return;
  const [g, i] = cb.dataset.id.split('-').map(Number);
  const [name, price, min] = PRICE[gender][g][1][i];
  cb.checked ? picked.set(cb.dataset.id, [name, price, min]) : picked.delete(cb.dataset.id);
  update();
});
$$('input[name=n]').forEach((r) => r.addEventListener('change', () => update()));

function placeIndicator() {
  const b = $('button[aria-pressed="true"]', seg);
  if (!b) return;
  seg.style.setProperty('--x', b.offsetLeft - 5 + 'px');
  seg.style.setProperty('--w', b.offsetWidth + 'px');
}
$$('button', seg).forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.g === gender) return;
    gender = b.dataset.g;
    $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', x === b));
    placeIndicator();
    render();
  })
);
render();
placeIndicator();
addEventListener('resize', placeIndicator);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator);

// эквалайзер SilkLase (декор)
const eq = $('.beams'); if (eq) eq.innerHTML = Array.from({ length: 34 }, (_, i) => '<i style="--i:' + i + '"></i>').join('');

// ───────────── аккордеон ─────────────
$$('.acc-i button').forEach((btn) =>
  btn.addEventListener('click', () => {
    const item = btn.closest('.acc-i');
    const open = !item.classList.contains('open');
    item.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 800);
  })
);

// ───────────── статус «открыто» (Петербург = МСК) ─────────────
(function status() {
  const h = +new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Moscow' }).format(new Date()) % 24;
  const open = h >= 9 && h < 21;
  $('#statusText').textContent = open ? 'Открыто сегодня до 21:00' : 'Сейчас закрыто · откроемся в 9:00';
  $('#statusText').closest('.chip').classList.toggle('closed', !open);
  $('#statusText2').textContent = open ? 'Сейчас открыто' : 'Сейчас закрыто · откроемся в 9:00';
})();

// ───────────── график «скачок роста» (по памятке студии) ─────────────
const chart = (function buildChart() {
  const line = $('#chLine'), g = $('#chDots');
  if (!line) return null;
  const ys = [150, 134, 62, 40, 120, 108, 54, 30];
  const hot = [2, 3, 6, 7];
  const pts = [[0, 166], ...ys.map((y, i) => [62.5 + 125 * i, y]), [1000, 40]];
  let d = `M${pts[0][0]} ${pts[0][1]}`; // Catmull-Rom → Bezier
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  line.setAttribute('d', d);
  const NS = 'http://www.w3.org/2000/svg';
  const dots = ys.map((y, i) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', 62.5 + 125 * i); c.setAttribute('cy', y); c.setAttribute('r', 9);
    if (hot.includes(i)) c.classList.add('hot');
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', 62.5 + 125 * i); t.setAttribute('y', 188); t.textContent = i + 1;
    g.append(c, t);
    return c;
  });
  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('id', 'chHead'); head.setAttribute('r', '8');
  g.parentNode.appendChild(head);
  return { line, dots, head };
})();

// положение «головы» = конец нарисованной части линии (читаем из strokeDashoffset)
function syncHead() {
  if (!chart) return;
  const len = chart.line.getTotalLength();
  const off = parseFloat(chart.line.style.strokeDashoffset);
  if (isNaN(off) || off <= 0.5 || off >= len - 0.5) { chart.head.classList.remove('show'); return; }
  const p = chart.line.getPointAtLength(len - off);
  chart.head.setAttribute('cx', p.x); chart.head.setAttribute('cy', p.y);
  chart.head.classList.add('show');
}

// ───────────── меню (мобильное) ─────────────
const burger = $('#burger'), menu = $('#menu');
function setMenu(open) {
  menu.classList.toggle('open', open);
  menu.setAttribute('aria-hidden', !open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
  if (lenis) open ? lenis.stop() : lenis.start();
  else document.body.style.overflow = open ? 'hidden' : '';
  $('#hdr').classList.remove('hide');
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

// ───────────── без анимаций: завершаем ─────────────
if (!MOTION) {
  if (chart) chart.dots.forEach((d) => d.classList.add('on'));
  root.classList.add('ready');
} else {
  initMotion();
}

// ═════════════════════════════ АНИМАЦИИ ═════════════════════════════
function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });
  if ('scrollRestoration' in history && !location.hash) history.scrollRestoration = 'manual';
  if (!location.hash) scrollTo(0, 0);

  // ── плавный скролл ──
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.__lenis = lenis;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    lenis.scrollTo(t, { offset: id === '#top' ? 0 : -4, duration: 1.7, easing: (x) => 1 - Math.pow(1 - x, 4) });
    history.replaceState(null, '', id);
  });

  // ── утилиты сплита ──
  const splitWords = (el, wCls, iCls) => {
    const out = [];
    const frag = document.createDocumentFragment();
    const walk = (src, dst) => src.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/([ \t\n]+)/).forEach((tok) => {
          if (!tok) return;
          if (/^[ \t\n]+$/.test(tok)) { dst.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = wCls; w.setAttribute('aria-hidden', 'true');
          if (iCls) { const i = document.createElement('span'); i.className = iCls; i.textContent = tok; w.appendChild(i); out.push(i); }
          else { w.textContent = tok; out.push(w); }
          dst.appendChild(w);
        });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') { dst.appendChild(n.cloneNode()); return; }
        const c = n.cloneNode(false); c.setAttribute('aria-hidden', 'true'); dst.appendChild(c); walk(n, c);
      }
    });
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    walk(el, frag);
    el.replaceChildren(frag);
    return out;
  };
  const splitChars = (el) => {
    const t = el.textContent; el.textContent = '';
    return [...t].map((ch) => { const s = document.createElement('span'); s.className = 'c'; s.textContent = ch === ' ' ? ' ' : ch; el.appendChild(s); return s; });
  };

  // ── шапка: прячется вниз, возвращается вверх ──
  const hdr = $('#hdr');
  lenis.on('scroll', ({ scroll, direction }) => {
    hdr.classList.toggle('scrolled', scroll > 40);
    if (!menu.classList.contains('open')) hdr.classList.toggle('hide', direction === 1 && scroll > 500);
  });
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // ── HERO: подготовка (за прелоадером) ──
  const chars = $$('.mega .tx').flatMap(splitChars);
  const pills = $$('.pill');
  const pillW = pills.map((p) => getComputedStyle(p).width);
  pills.forEach((p) => (p.style.transition = 'none'));
  gsap.set(pills, { width: 0 });
  gsap.set(chars, { yPercent: 135, rotate: 7, opacity: 0 });
  gsap.set('.orb', { scale: 0 });
  gsap.set('.hero-meta > *, .lead, .hero-cta > *, .ring-badge', { y: 36, opacity: 0 });
  gsap.set('.ticker', { yPercent: 101 });
  gsap.set('.hdr > *', { y: -26, opacity: 0 });

  function heroIn() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(chars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.3, stagger: 0.04 })
      .to(pills, { width: (i) => pillW[i], duration: 1.5, onComplete: () => pills.forEach((p) => { p.style.width = ''; p.style.transition = ''; }) }, 0.25)
      .to('.orb', { scale: 1, duration: 1.6, ease: 'elastic.out(1,.55)' }, 0.55)
      .to('.hero-meta > *, .lead, .hero-cta > *, .ring-badge', { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'power3.out' }, 0.5)
      .to('.ticker', { yPercent: 0, duration: 1.2 }, 0.7)
      .to('.hdr > *', { y: 0, opacity: 1, duration: 1, stagger: 0.1, clearProps: 'transform,opacity' }, 0.6);
    // «вспышка»: волна света пробегает по буквам, когда всё встало на места
    const glowFrom = (i, t) => (t.parentElement.classList.contains('it') ? '0 0 .5em rgba(255,138,61,.45)' : '0 0 0em rgba(255,200,140,0)');
    const glowTo = (i, t) => (t.parentElement.classList.contains('it') ? '0 0 .65em rgba(255,214,150,1)' : '0 0 .34em rgba(255,214,170,.9)');
    tl.fromTo(chars, { textShadow: glowFrom }, { textShadow: glowTo, duration: 0.45, stagger: 0.065, yoyo: true, repeat: 1, ease: 'sine.inOut', clearProps: 'textShadow' }, 1.35);
    tl.add(() => { heroReady = true; }, 1.9);
    lenis.start();
  }
  let heroReady = false;

  (function loader() {
    const ld = $('#loader'), num = $('#ldNum'), orb = $('.ld-orb'), o = { v: 0 };
    const finish = () => { root.classList.add('ready'); ScrollTrigger.refresh(); };
    if (sessionStorage.getItem('epic-seen')) { // повторный заход — без показа
      root.classList.add('ready'); heroIn(); return;
    }
    gsap.timeline({ onComplete: finish })
      .to(o, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => (num.textContent = Math.round(o.v)) })
      .to(orb, { scale: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
      .to('.ld-count, .ld-word', { opacity: 0, duration: 0.3 }, '>-0.1')
      .to(orb, { scale: 38, duration: 1, ease: 'expo.in' }, '>-0.05')
      .add(heroIn, '>-0.35')
      .to(ld, { opacity: 0, duration: 0.9, ease: 'power2.out' }, '>-0.1');
    try { sessionStorage.setItem('epic-seen', '1'); } catch (_) {}
  })();

  // ── HERO: интерактив ──
  const hero = $('.hero');
  gsap.to('.hero-in', { yPercent: -7, scale: 0.95, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.scan', start: 'top bottom', end: 'top top', scrub: true } });
  if (FINE) {
    let raf = 0, px = 0, py = 0, cx = 0, cy = 0, waveOn = false;
    const mega = $('.mega'), fsz = () => parseFloat(getComputedStyle(mega).fontSize);
    const cq = chars.map((c) => ({ y: gsap.quickTo(c, 'y', { duration: 0.55, ease: 'power3' }), r: gsap.quickTo(c, 'rotation', { duration: 0.7, ease: 'power3' }), sx: gsap.quickTo(c, 'scaleX', { duration: 0.55, ease: 'power3' }), sy: gsap.quickTo(c, 'scaleY', { duration: 0.55, ease: 'power3' }) }));
    const pq = pills.map((p) => ({ x: gsap.quickTo(p, 'x', { duration: 1.1, ease: 'power3' }), y: gsap.quickTo(p, 'y', { duration: 1.1, ease: 'power3' }) }));
    const wave = () => {
      if (!heroReady) return;
      const f = fsz(), sg = f * 0.85, mr = mega.getBoundingClientRect();
      const inside = cx > mr.left - 60 && cx < mr.right + 60 && cy > mr.top - 60 && cy < mr.bottom + 60;
      if (!inside && !waveOn) return;
      waveOn = inside;
      chars.forEach((c, i) => {
        if (!inside) { cq[i].y(0); cq[i].r(0); cq[i].sx(1); cq[i].sy(1); return; }
        const r = c.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = (cy - (r.top + r.height / 2)) * 0.7;
        const k = Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg));
        cq[i].y(-k * f * 0.07); cq[i].r(clamp(dx / sg, -1, 1) * k * -5); cq[i].sx(1 + k * 0.05); cq[i].sy(1 + k * 0.05);
      });
    };
    hero.addEventListener('pointerleave', () => { cx = cy = -9999; waveOn = true; wave(); waveOn = false; });
    const blobs = $$('.mesh i').map((b, i) => ({ x: gsap.quickTo(b, 'x', { duration: 1.6, ease: 'power3' }), y: gsap.quickTo(b, 'y', { duration: 1.6, ease: 'power3' }), k: [-.045, .06, -.03][i] }));
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; cx = e.clientX; cy = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0; hero.style.setProperty('--mx', px + 'px'); hero.style.setProperty('--my', py + 'px');
        blobs.forEach((b) => { b.x((px - r.width / 2) * b.k * 6); b.y((py - r.height / 2) * b.k * 6); });
        pq.forEach((p, i) => { p.x((px - r.width / 2) * (i ? -0.035 : 0.035)); p.y((py - r.height / 2) * (i ? 0.03 : -0.03)); });
        wave();
      });
    });
  }

  // ── бегущая строка: скорость зависит от скорости скролла ──
  $$('[data-marquee]').forEach((track) => {
    let x = 0;
    gsap.ticker.add(() => {
      const half = track.scrollWidth / 2;
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      x -= (1.1 + Math.min(v, 60) * 0.28) * gsap.ticker.deltaRatio();
      if (x <= -half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });

  // ── общие появления ──
  function reveals(scope = document) {
    $$('[data-reveal]:not(.is-rv)', scope).forEach((el) => {
      el.classList.add('is-rv');
      gsap.from(el, { y: 56, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-split]:not(.is-rv)', scope).forEach((el) => {
      el.classList.add('is-rv');
      const words = splitWords(el, 'w', 'wi');
      gsap.from(words, { yPercent: 118, rotate: 3, duration: 1.3, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
  }
  // плитки bento влетают каждая со своей стороны
  {
    const k = innerWidth < 900 ? 0.3 : 1;
    const from = { 't-magic': { x: -110, rotate: -2.5 }, 't-nm': { y: -70, rotate: 1.5 }, 't-cool': { scale: 0.82, y: 40 }, 't-zero': { x: 90, rotate: 3.5 }, 't-tyrion': { y: 110, rotate: -2 }, 't-silk': { x: 130, rotate: 1.2 } };
    $$('.bento .tile').forEach((t) => {
      t.removeAttribute('data-reveal');
      const key = Object.keys(from).find((c) => t.classList.contains(c)), f = from[key] || { y: 60 };
      gsap.from(t, { ...f, x: (f.x || 0) * k, opacity: 0, duration: 1.7, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 90%', once: true } });
    });
  }
  reveals();

  // линия у подписи секции «прорисовывается»
  $$('.label').forEach((el) => gsap.fromTo(el, { '--lw': 0 }, { '--lw': 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));

  // ── манифест: слова «проявляются» вместе со скроллом ──
  const man = $('[data-scrub]');
  if (man) {
    man.classList.add('is-rv');
    const words = splitWords(man, 'sw');
    gsap.set(words, { opacity: 0.13 });
    gsap.to(words, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: man, start: 'top 82%', end: 'bottom 55%', scrub: 0.6 } });
  }

  // ── параллакс картинок ──
  $$('[data-parallax]').forEach((img) => {
    const sp = parseFloat(img.dataset.parallax) || 0.1;
    gsap.fromTo(img, { yPercent: -sp * 100, scale: 1 + sp * 2 + 0.06 }, { yPercent: sp * 100, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ── счётчики ──
  const fmt = (v) => Math.round(v).toLocaleString('ru-RU');
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count, from = to === 0 ? 9 : 0, o = { v: from };
    el.textContent = fmt(from);
    gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)), scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  gsap.fromTo('.g-fg', { strokeDashoffset: 100 }, { strokeDashoffset: 28, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: '.t-cool', start: 'top 88%', once: true } });
  gsap.from('.ladder li', { height: 0, duration: 1.6, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.ladder', start: 'top 85%', once: true } });

  // ── адаптивные сцены ──
  const mm = gsap.matchMedia();

  // SCAN: рамка раскрывается, лазер «проходит» по кадру и проявляет цвет
  mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, (ctx) => {
    const { mob } = ctx.conditions;
    const scanP = { v: 0 }, scanNum = $('#scanPct');
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#scan', start: 'top top', end: 'bottom bottom', scrub: 0.7 } });
    tl.fromTo('.scan-frame', { clipPath: mob ? 'inset(0% 0% 0% 0% round 28px)' : 'inset(16% 14% 16% 14% round 48px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: mob ? 0.01 : 0.28 })
      .fromTo('.scan-tag', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.12, stagger: 0.04 }, '<0.1')
      .set('.beam, .scan-read, .scan-grid', { opacity: 1 })
      .fromTo('.scan-color', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.6 }, '>0.02')
      .fromTo('.scan-grid', { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', ease: 'none', duration: 0.6 }, '<')
      .fromTo('.beam, .scan-read', { top: '0%' }, { top: '100%', ease: 'none', duration: 0.6 }, '<')
      .fromTo(scanP, { v: 0 }, { v: 100, ease: 'none', duration: 0.6, onUpdate: () => (scanNum.textContent = Math.round(scanP.v)) }, '<')
      .to('.beam, .scan-read, .scan-grid', { opacity: 0, duration: 0.05 })
      .to({}, { duration: 0.12 });
    if (mob) tl.fromTo('.scan-frame img', { objectPosition: '8% 40%' }, { objectPosition: '92% 40%', ease: 'none', duration: 1 }, 0);
  });

  // COURSE: sticky-сцена, шаги переключаются скроллом
  mm.add('(min-width: 900px) and (min-height: 700px)', () => {
    const course = $('#course'), steps = $$('#csSteps li'), n = steps.length;
    const num = $('#csNum'), numWrap = $('.cs-num');
    course.classList.add('pinned');
    const len = chart.line.getTotalLength();
    gsap.set(chart.line, { strokeDasharray: len, strokeDashoffset: len });
    let cur = -1;
    const set = (i) => {
      if (i === cur) return; cur = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      chart.dots.forEach((d, k) => d.classList.toggle('on', k <= i));
      num.textContent = i + 1;
      numWrap.classList.toggle('hot', steps[i].classList.contains('hot'));
      gsap.fromTo(num, { yPercent: 35, opacity: 0, rotate: -5 }, { yPercent: 0, opacity: 1, rotate: 0, duration: 0.8, ease: 'expo.out', overwrite: true });
    };
    set(0);
    ScrollTrigger.create({
      trigger: course, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (s) => { set(clamp(Math.floor(s.progress * n), 0, n - 1)); chart.line.style.strokeDashoffset = len * (1 - clamp(s.progress * 1.04, 0, 1)); syncHead(); },
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { chart.head.classList.remove('show'); course.classList.remove('pinned'); steps.forEach((s) => s.classList.remove('on')); chart.dots.forEach((d) => d.classList.add('on')); gsap.set(chart.line, { clearProps: 'strokeDasharray,strokeDashoffset' }); };
  });
  mm.add('(max-width: 899px), (max-height: 699px)', () => {
    const len = chart.line.getTotalLength();
    chart.dots.forEach((d) => d.classList.remove('on'));
    gsap.fromTo(chart.line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', onUpdate: syncHead, onComplete: () => chart.head.classList.remove('show'), scrollTrigger: { trigger: '.cs-chart', start: 'top 85%', once: true, onEnter: () => chart.dots.forEach((d, i) => setTimeout(() => d.classList.add('on'), 250 * i)) } });
    gsap.from('#csSteps li', { y: 40, opacity: 0, duration: 1, stagger: 0.08, scrollTrigger: { trigger: '#csSteps', start: 'top 85%', once: true } });
    return () => { chart.dots.forEach((d) => d.classList.add('on')); gsap.set(chart.line, { clearProps: 'strokeDasharray,strokeDashoffset' }); };
  });

  // ── «шторка»: фото раскрываются снизу вверх ──
  $$('.man-img, .ph-in').forEach((el) => gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));

  // ── скорость скролла слегка «гнёт» фото ──
  {
    const sk = $$('.man-img, .ph-in').map((el) => gsap.quickTo(el, 'skewY', { duration: 0.7, ease: 'power3' }));
    gsap.ticker.add(() => { const v = clamp(lenis.velocity * 0.05, -3, 3); sk.forEach((f) => f(v)); });
  }

  // ── контурная строка за командой едет вместе со скроллом ──
  gsap.fromTo('.bgword span', { x: '6%' }, { x: '-46%', ease: 'none', scrollTrigger: { trigger: '.people', start: 'top bottom', end: 'bottom top', scrub: true } });

  // ── подвал: большое слово поднимается ──
  gsap.fromTo('.foot-word', { yPercent: 38, opacity: 0.15, scale: 0.94 }, { yPercent: 0, opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top 85%', end: 'bottom bottom', scrub: true } });

  // ── искры при выборе зон и числа процедур ──
  const sparks = (x, y, n = 11) => {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'spark'; document.body.appendChild(s);
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6, d = 44 + Math.random() * 56;
      gsap.fromTo(s, { x, y, scale: 1, opacity: 1 }, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, scale: 0, opacity: 0, duration: 0.65 + Math.random() * 0.35, ease: 'power2.out', onComplete: () => s.remove() });
    }
  };
  list.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-id]');
    if (!cb || !cb.checked) return;
    const r = cb.nextElementSibling.getBoundingClientRect();
    sparks(r.left + r.width / 2, r.top + r.height / 2);
  });
  $$('.course-pick input').forEach((inp) => inp.addEventListener('change', () => { const r = inp.nextElementSibling.getBoundingClientRect(); sparks(r.left + r.width / 2, r.top + r.height / 2, 9); }));

  // ── после рендера прайса: новые блоки получают появления, мёртвые триггеры чистим ──
  window.__afterRender = () => {
    ScrollTrigger.getAll().filter((t) => t.trigger && !t.trigger.isConnected).forEach((t) => t.kill());
    reveals(list);
    ScrollTrigger.refresh();
  };
  reveals(list);

  // ── только мышь: курсор, магнитные кнопки, tilt, заливка кнопок ──
  if (FINE) initPointer();

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

function initPointer() {
  const dot = $('.c-dot'), ring = $('.c-ring'), lab = $('.c-label'), cur = $('.cursor');
  let tx = innerWidth / 2, ty = innerHeight / 2, rx = tx, ry = ty, s = 1, ts = 1, ls = 0, tls = 0, seen = false;
  root.classList.add('cursor-on');
  cur.style.opacity = 0;
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; rx = tx; ry = ty; cur.style.opacity = 1; }
  }, { passive: true });
  root.addEventListener('pointerleave', () => (cur.style.opacity = 0));
  root.addEventListener('pointerenter', () => (cur.style.opacity = 1));
  document.addEventListener('pointerover', (e) => {
    const c = e.target.closest('[data-cursor]');
    if (c) { lab.textContent = c.dataset.cursor; tls = 1; ts = 0; dot.style.opacity = 0; return; }
    tls = 0; dot.style.opacity = 1;
    ts = e.target.closest('a, button, summary, label, input, [data-magnetic]') ? 1.9 : 1;
  });
  gsap.ticker.add(() => {
    rx += (tx - rx) * 0.17; ry += (ty - ry) * 0.17; s += (ts - s) * 0.16; ls += (tls - ls) * 0.2;
    dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${s})`;
    lab.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${ls})`;
  });

  // круг-«рябь» от клика
  addEventListener('pointerdown', (e) => {
    const r = document.createElement('i'); r.className = 'ripple'; document.body.appendChild(r);
    gsap.fromTo(r, { x: e.clientX, y: e.clientY, scale: 0.2, opacity: 0.8 }, { scale: 1.7, opacity: 0, duration: 0.85, ease: 'power2.out', onComplete: () => r.remove() });
  });

  // заливка кнопки растёт из точки входа курсора
  document.addEventListener('pointerover', (e) => {
    const b = e.target.closest('.btn'); if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', ((e.clientX - r.left) / r.width) * 100 + '%');
    b.style.setProperty('--by', ((e.clientY - r.top) / r.height) * 100 + '%');
  });
  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest('.btn'); if (!b || b.contains(e.relatedTarget)) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', ((e.clientX - r.left) / r.width) * 100 + '%');
    b.style.setProperty('--by', ((e.clientY - r.top) / r.height) * 100 + '%');
  });

  // магнитные элементы
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.32); yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  // 3D-наклон плиток bento + блик под курсором
  $$('.tilt').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
    gsap.set(el, { transformPerspective: 1000 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 9); rx(-(py - 0.5) * 9);
      el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
