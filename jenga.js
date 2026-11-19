/* 젠가 탑(옆에서 본 말랑한 3D): 미리 그려 둔 블록 이미지를 같은 시점으로 배치하고, 쌓기/얹기/빼기/무너뜨리기를 움직인다.
   블록 이미지는 scratchpad의 render_blocks.py(둥근 직육면체 레이마칭)로 만든 assets/jg-*.png */
(function (root) {
  const layersFor = (d = new Date(), max = 7) => Math.min(max, Math.ceil(max * d.getDate() / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (cls, parent, tag = 'div') => { const d = document.createElement(tag); d.className = cls; parent?.append(d); return d; };
  const U = 20, TH = 0.96, YAW = -26, PITCH = -27;            // 1단위(블록 폭) = 20px*k, 한 층 높이 0.84단위, 보는 각도
  const META = { S: 84, even: { w: 276, h: 169, cx: 138.38, cy: 84.86 }, odd: { w: 199, h: 204, cx: 99.7, cy: 102.42 } };
  const PULL = { layer: 2, block: 1, out: 1.02 };               // 08-2에서 "찔끔 빠져 있는" 블록: 4번째 층 가운데, 1.02단위 튀어나옴
  const tone = (i, b) => ((i * 7 + b * 5 + (i % 3)) % 3 === 0 ? 'blue' : 'light'); // 연한 블록과 진한 블록을 섞는다(고정)
  const a = YAW * Math.PI / 180, bb = PITCH * Math.PI / 180;
  const view = ([x, y, z]) => { const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a); return [x1, y * Math.cos(bb) - z1 * Math.sin(bb), y * Math.sin(bb) + z1 * Math.cos(bb)]; };
  const AX = view([1, 0, 0]);                                  // 블록 길이 방향이 화면에서 향하는 방향(1단위당)

  function block(layer, i, b, k, out = 0, tones) {
    const even = i % 2 === 0, off = b - 1;
    const wx = even ? out : off, wz = even ? off : -out, wy = -(i * TH + TH / 2);
    const [sx, sy, sz] = view([wx, wy, wz]), m = META[even ? 'even' : 'odd'], sc = U * k / META.S;
    const im = el('jbk', layer, 'img');
    im.src = `assets/jg-${even ? 'even' : 'odd'}-${(tones ? tones[i * 3 + b] : tone(i, b))}.png`; im.alt = ''; im.draggable = false;
    im.style.width = m.w * sc + 'px'; im.style.height = m.h * sc + 'px';
    im.style.left = sx * U * k - m.cx * sc + 'px'; im.style.top = sy * U * k - m.cy * sc + 'px';
    im.dataset.i = i; im.dataset.b = b; im.dataset.z = sz; im.dataset.sx = sx * U * k; im.dataset.sy = sy * U * k;
    return im;
  }
  function layer(i, k, parent, pull, only, tones) {
    const l = el('jl', parent); l.dataset.i = i;
    const bs = [0, 1, 2].filter((b) => !only || only.includes(b));
    const depth = (b) => { const even = i % 2 === 0, off = b - 1; return view(even ? [0, 0, off] : [off, 0, 0])[2]; };
    bs.sort((p, q) => depth(p) - depth(q)).forEach((b) => { const im = block(l, i, b, k, pull && i === PULL.layer && b === PULL.block ? PULL.out : 0, tones); if (pull && i === PULL.layer && b === PULL.block) im.classList.add('pull'); });
    return l;
  }
  function tower(parent, { layers, k = 1, sway = 0, total = 8, pull = false, tones }) {
    parent.replaceChildren();
    const t = el('jg-tower', parent), scene = el('jg-scene', t);
    t.style.width = 6 * U * k + 'px'; t.style.height = (total * TH * U * 0.89 + 52) * k + 'px';
    t.style.setProperty('--L', 3 * U * k + 'px'); scene.style.bottom = 22 * k + 'px';
    el('jg-floor', scene);
    if (sway) { t.style.setProperty('--sway', sway + 'deg'); t.classList.add('sway'); }
    const ls = Array.from({ length: layers }, (_, i) => layer(i, k, scene, pull, null, tones));
    return { el: t, scene, layers: ls, k, total, count: layers };
  }
  const drop = (l, k, last) => l.animate(last
    ? [{ translate: `0 ${-130 * k}px`, opacity: 0 }, { translate: '0 0', opacity: 1, offset: .55, easing: 'cubic-bezier(.3,0,.8,1)' }, { translate: `0 ${-5 * k}px`, offset: .78 }, { translate: '0 0' }]
    : [{ translate: `0 ${-130 * k}px`, opacity: 0 }, { opacity: 1, offset: .25 }, { translate: '0 0', opacity: 1 }],
    { duration: last ? 950 : 700, easing: 'cubic-bezier(.4,0,.9,.6)' });

  async function build(h, { gap = 220 } = {}) { // 아래층부터 하나씩 얹힌다
    const run = (h.token = {});
    h.layers.forEach((l) => { l.getAnimations().forEach((x) => x.cancel()); l.style.visibility = ''; });
    if (reduced()) return;
    h.layers.forEach((l) => (l.style.visibility = 'hidden'));
    for (let i = 0; i < h.layers.length; i++) {
      if (h.token !== run) return;
      h.layers[i].style.visibility = ''; drop(h.layers[i], h.k, i === h.layers.length - 1);
      await wait(gap);
    }
  }
  // 다음 층의 첫 블록 하나를 (처음부터 보이는 모양 그대로) 위에서 천천히 내려 얹는다 (07). delay 동안은 탑 위에 떠 있다.
  async function addBlock(h, b = 0, { delay = 450 } = {}) {
    const l = layer(h.layers.length, h.k, h.scene, false, [b]); h.layers.push(l); h.count++;
    const bk = l.firstElementChild;
    if (reduced()) return l;
    await bk.animate([{ translate: `0 ${-70 * h.k}px` }, { translate: '0 0', offset: .7, easing: 'cubic-bezier(.35,0,.7,1)' }, { translate: `0 ${-3 * h.k}px`, offset: .87 }, { translate: '0 0' }], { duration: 850, delay, fill: 'backwards', easing: 'cubic-bezier(.3,0,.6,1)' }).finished.catch(() => {});
    h.el.animate([{ rotate: '0deg' }, { rotate: '.7deg', offset: .3 }, { rotate: '-.5deg', offset: .6 }, { rotate: '0deg' }], { duration: 700 });
    return l;
  }
  // 블록 길이 방향(화면에서 오른쪽 아래)으로 dx(px, 가로 기준)만큼 이동한 변환
  const pullTx = (h, dx) => `translate(${dx}px, ${dx * AX[1] / AX[0]}px)`;
  const setPull = (h, bk, dx) => { bk.style.transform = pullTx(h, dx); };
  const pullThreshold = (h) => .35 * 3 * U * h.k * Math.abs(AX[0]);
  async function pullOut(h, bk) {
    if (reduced()) return;
    const from = bk.style.transform || 'translate(0px, 0px)';
    await bk.animate([{ transform: from }, { transform: pullTx(h, 3.4 * U * h.k * Math.abs(AX[0])) }], { duration: 700, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' }).finished;
  }
  // 와르르: 먼저 위층부터 옆으로 살짝 미끄러지고, 층 순서대로 곧게 내려앉아 바닥에 납작하게 쌓였다가 사라진다 (정돈된 무너짐)
  async function collapse(h, { seed = 4 } = {}) {
    if (reduced()) return;
    const rand = rng(seed), k = h.k, blocks = [...h.scene.querySelectorAll('.jbk')];
    await h.el.animate([{ rotate: '0deg' }, { rotate: '.4deg' }, { rotate: '-.5deg' }, { rotate: '.7deg' }, { rotate: '-.9deg' }, { rotate: '1.2deg' }], { duration: 1100, easing: 'ease-in', fill: 'forwards' }).finished;
    const maxI = Math.max(...blocks.map((x) => +x.dataset.i));
    const anims = blocks.map((bk) => {
      const i = +bk.dataset.i, side = i % 2 ? 1 : -1, sy = +bk.dataset.sy, sx = +bk.dataset.sx;
      const slide = side * (5 + rand() * 4) * k;                                      // 층마다 번갈아 살짝 밀려난다
      const dx = slide + sx * .55 + (rand() - .5) * 34 * k;                              // 안쪽에서 바깥으로 완만하게 퍼진다
      const dy = -sy - 4 * k - (i % 3) * 5 * k + (rand() - .3) * 12 * k;                  // 바닥 근처에 납작하게 겹쳐 쌓인다
      const rz = side * (6 + rand() * 20), from = bk.style.transform || 'none';
      return bk.animate([{ transform: from }, { transform: `translate(${slide}px, 0) rotate(${rz * .3}deg)`, offset: .18 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rz}deg)`, offset: .86, easing: 'cubic-bezier(.3,0,.9,.7)' }, { transform: `translate(${dx}px, ${dy - 4 * k}px) rotate(${rz * .9}deg)`, offset: .93 }, { transform: `translate(${dx}px, ${dy}px) rotate(${rz}deg)` }],
        { duration: 1000, delay: (maxI - bk.dataset.i) * 120, easing: 'ease-in', fill: 'forwards' }).finished;
    });
    await Promise.all(anims);
    await wait(800);
    await Promise.all(blocks.map((b) => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }).finished));
  }
  const api = { layersFor, tower, build, addBlock, pullOut, setPull, pullThreshold, collapse, PULL };
  if (typeof module !== 'undefined') module.exports = api; else root.Jenga = api;
})(typeof window !== 'undefined' ? window : globalThis);
