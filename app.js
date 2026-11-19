/* 감정소비 회고 — 화면 전환과 인터랙션 */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = (n) => n.toLocaleString('ko-KR');

  /* ───────── 반복 컴포넌트 채우기 ───────── */
  const tpl = (id) => document.getElementById('tpl-' + id).content;

  $$('[data-tpl="status"]').forEach((el) => {
    el.append(tpl('status').cloneNode(true));
    $('.levels', el).src = `assets/${el.dataset.levels}.svg`;
  });
  $$('[data-tpl="rphead"]').forEach((el) => {
    el.append(tpl('rphead').cloneNode(true));
    $('b', el).textContent = el.dataset.title;
  });
  $$('[data-tpl="summary"]').forEach((el) => {
    el.replaceWith(tpl('summary').cloneNode(true));
  });
  // 요약 카드는 템플릿 한 벌이라 variant 는 교체 후 상위에서 찾아 적용
  $$('[data-tpl="tabbar"]').forEach((el) => el.append(tpl('tabbar').cloneNode(true)));

  /* ───────── 라우터 ───────── */
  const screens = $$('.screen');
  const ids = screens.map((s) => s.id);
  const index = $('#index');
  const indexBtns = {};
  screens.forEach((s) => {
    const b = document.createElement('button');
    b.textContent = s.dataset.title;
    b.addEventListener('click', () => go(s.id));
    index.append(b);
    indexBtns[s.id] = b;
  });

  const onEnter = {};
  let current = null;

  function go(id) {
    if (!ids.includes(id)) id = ids[0];
    if (current === id) return;
    screens.forEach((s) => s.classList.toggle('active', s.id === id));
    Object.entries(indexBtns).forEach(([k, b]) => b.classList.toggle('on', k === id));
    const el = document.getElementById(id);
    el.scrollTop = 0;
    current = id;
    if (location.hash !== '#' + id) location.hash = id; // hashchange 는 current === id 라 무시되고, 브라우저 뒤로 가기는 그대로 동작
    onEnter[id]?.(el);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (t && !t.disabled) go(t.dataset.go);
    if (e.target.closest('[data-soon]')) toast('준비 중인 화면이에요');
  });
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  /* ───────── 슬라이더 (01, 12) ───────── */
  $$('[data-goal]').forEach((card) => {
    const input = $('input[type=range]', card);
    const amount = $('[data-amount]', card);
    const avg = $('[data-avg]', card);
    const slider = $('[data-slider]', card);
    const days = Number(card.dataset.days);
    const max = Number(card.dataset.max);
    const update = () => {
      const v = Number(input.value);
      amount.textContent = fmt(v);
      avg.textContent = fmt(Math.round(v / days / 100) * 100) + '원';
      slider.style.setProperty('--pct', (v / max) * 100 + '%');
    };
    input.addEventListener('input', update);
    update();
  });

  /* ───────── 칩 (소비 항목) ───────── */
  $$('[data-chips]').forEach((box) => {
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('button');
      if (chip) chip.classList.toggle('on');
    });
  });

  /* ───────── 02-1 은행 · 카드 선택 ───────── */
  // [이름, 로고 파일(assets/ 아래, 없으면 이름 첫 글자 원형 아이콘)]
  const BANKS = [
    ['시중은행', [['국민은행', 's03-vector.png'], ['신한은행', 'logo-shinhan-bank.png'], ['우리은행', 's03-vector2.png'], ['하나은행', 's03-vector3.png'], ['SC제일은행', 'logo-sc-bank.png'], ['한국씨티은행', 'logo-citi.png']]],
    ['인터넷전문은행', [['카카오뱅크', 's03-vector4.png'], ['케이뱅크', 'logo-kbank.png'], ['토스뱅크', 'logo-toss-bank.png']]],
    ['특수·국책은행', [['IBK기업은행', 'logo-ibk.png'], ['KDB산업은행', 'logo-kdb.png'], ['한국수출입은행', 'logo-koreaexim.png'], ['NH농협은행', 'logo-nh-bank.png'], ['수협은행', 'logo-suhyup.png']]],
    ['지방은행', [['부산은행', 'logo-bnk.png'], ['경남은행', 'logo-bnk.png'], ['iM뱅크', 'logo-im-bank.png'], ['광주은행', 'logo-kj-bank.png'], ['전북은행', 'logo-jb-bank.png'], ['제주은행', 'logo-jeju-bank.png']]],
    ['기타 금융기관', [['우체국', 'logo-korea-post.png'], ['새마을금고', 'logo-mg.png'], ['신협', 'logo-shinhyup.png']]],
  ];
  const CARDS = [
    ['카드사', [['신한카드', 's03-vector1.png'], ['삼성카드', 'logo-samsung-card.png'], ['현대카드', 'logo-hyundai-card.png'], ['KB국민카드', 's03-vector.png'], ['롯데카드', 'logo-lotte-card.png'], ['하나카드', 'logo-hana-card.png'], ['우리카드', 'logo-woori-card.png'], ['BC카드', 'logo-bc-card.png'], ['NH농협카드', 'logo-nh-bank.png']]],
  ];
  const RADIO = '<span class="radio"><img class="ring" alt="" src="assets/s03-group.svg"><img class="fill" alt="" src="assets/s03-group3.svg"><img class="tick" alt="" src="assets/s03-group4.svg"></span>';
  const bankRow = (name, logo, sub, on) => {
    const b = document.createElement('button');
    b.className = 'bank' + (on ? ' on' : '');
    b.dataset.name = name; b.dataset.logo = logo || ''; b.dataset.sub = sub;
    const mark = logo
      ? `<img class="logo" alt="" src="assets/${logo}">`
      : `<span class="logo ph" aria-hidden="true">${name[0]}</span>`;
    b.innerHTML = `${mark}<span class="nm"><b>${name}</b><span>${sub}</span></span>${RADIO}`;
    return b;
  };

  const picked = new Map(); // 이름 -> { logo, sub }  (고른 순서 유지)
  const pickList = $('[data-picklist]');
  const pickNext = $('[data-pick-next]');
  let pickTab = 'bank';
  const renderPick = () => {
    pickList.replaceChildren();
    const sub = pickTab === 'bank' ? '입출금 통장' : '신용카드';
    for (const [title, items] of pickTab === 'bank' ? BANKS : CARDS) {
      const h = document.createElement('p');
      h.className = 'grp'; h.textContent = title;
      pickList.append(h);
      for (const [name, logo] of items) pickList.append(bankRow(name, logo, sub, picked.has(name)));
    }
  };
  const syncPickNext = () => {
    pickNext.disabled = picked.size === 0;
    pickNext.textContent = picked.size ? `${picked.size}곳 선택하고 다음` : '은행·카드를 선택해주세요';
  };
  pickList.addEventListener('click', (e) => {
    const row = e.target.closest('.bank');
    if (!row) return;
    const { name, logo, sub } = row.dataset;
    if (picked.has(name)) picked.delete(name); else picked.set(name, { logo, sub });
    row.classList.toggle('on', picked.has(name));
    syncPickNext();
  });
  $('[data-pick-tabs]').addEventListener('click', (e) => {
    const tab = e.target.closest('button');
    if (!tab) return;
    pickTab = tab.dataset.tab;
    $$('button', e.currentTarget).forEach((b) => b.classList.toggle('on', b === tab));
    renderPick();
    pickList.scrollTop = 0;
  });
  renderPick();
  syncPickNext();

  /* ───────── 03 동의 시트 (배경은 02-1 에서 고른 곳) ───────── */
  const s03 = $('#s03');
  const sheet = $('[data-sheet]', s03);
  const sheetDim = $('[data-sheet-dim]', s03);
  const setSheet = (open) => { sheet.hidden = sheetDim.hidden = !open; };
  // 목차에서 바로 들어온 경우(고른 곳이 없을 때)만 보여주는 예시
  const DEMO = [['신한카드', 's03-vector1.png', '신용카드'], ['카카오뱅크', 's03-vector4.png', '입출금 통장']];
  const renderConsentList = () => {
    const list = $('[data-banks]', s03);
    list.replaceChildren();
    const rows = picked.size ? [...picked].map(([n, { logo, sub }]) => [n, logo, sub]) : DEMO;
    rows.forEach(([n, logo, sub]) => list.append(bankRow(n, logo, sub, true)));
  };
  $('[data-sheet-close]', s03).addEventListener('click', () => setSheet(false));
  sheetDim.addEventListener('click', () => setSheet(false));
  $('[data-open-sheet]', s03).addEventListener('click', () => setSheet(true));

  const agreeRows = $$('.agree-row', s03);
  const agreeAll = $('[data-agree-all]', s03);
  const agreeGo = $('[data-agree-go]', s03);
  const syncAgree = () => {
    agreeAll.classList.toggle('on', agreeRows.every((r) => r.classList.contains('on')));
    agreeGo.disabled = !agreeRows.filter((r) => r.dataset.req).every((r) => r.classList.contains('on'));
  };
  agreeRows.forEach((r) => r.addEventListener('click', () => { r.classList.toggle('on'); syncAgree(); }));
  agreeAll.addEventListener('click', () => {
    const next = !agreeAll.classList.contains('on');
    agreeRows.forEach((r) => r.classList.toggle('on', next));
    syncAgree();
  });
  onEnter.s03 = () => { renderConsentList(); setSheet(true); };
  syncAgree();

  /* ───────── 04 알림 스위치 ───────── */
  $('[data-switch]').addEventListener('click', (e) => {
    const sw = e.currentTarget;
    sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));
  });

  /* ───────── 05 기록 항목 선택 ───────── */
  let selected = $('#s05 .tx-item.sel');
  $('[data-txlist]').addEventListener('click', (e) => {
    const item = e.target.closest('.tx-item');
    if (!item) return;
    selected?.classList.remove('sel');
    selected = item;
    item.classList.add('sel');
  });
  $('[data-filters]').addEventListener('click', (e) => {
    const chip = e.target.closest('.fchip');
    if (!chip) return;
    $$('.fchip', e.currentTarget).forEach((c) => c.classList.toggle('on', c === chip));
    $$('#s05 .tx').forEach((tx) => { tx.hidden = chip.dataset.f !== 'all' && tx.dataset.cat !== chip.dataset.f; });
  });

  /* ───────── 06 기록하기 ───────── */
  const memo = $('[data-memo]');
  const cnt = $('[data-cnt]');
  memo.addEventListener('input', () => { cnt.textContent = `${memo.value.length}/200자`; });
  let emotion = '스트레스';
  $('[data-emos]').addEventListener('click', (e) => {
    const btn = e.target.closest('.emo');
    if (!btn) return;
    $$('.emo', e.currentTarget).forEach((b) => b.classList.toggle('on', b === btn));
    emotion = btn.dataset.e;
  });
  onEnter.s06 = () => {
    if (!selected) return;
    const d = selected.dataset;
    const cat = selected.closest('.tx').dataset.cat;
    $('[data-tx-name]').textContent = d.name;
    $('[data-tx-meta]').textContent = `${d.time} · ${cat}`;
    $('[data-tx-amount]').textContent = d.amount;
    $('[data-tx-bg]').style.background = d.bg;
    $('[data-tx-icon]').src = d.big || d.icon;
  };
  $('[data-record-done]').addEventListener('click', () => {
    const tag = selected && $('.tx-end em', selected);
    if (tag) tag.textContent = emotion;
    go('s07');
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /* ───────── 07 기록 완료: 아이콘 애니메이션 ───────── */
  const doneBody = $('#s07 .done-body');
  const doneIcon = $('#s07 .done-icon');
  const replay = (el, cls) => { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };
  const iconHost = $('[data-jenga="icon"]', doneIcon);
  let iconTower = null;
  const iconPlay = async () => {
    const t = (iconTower = Jenga.tower(iconHost, { layers: 4, k: 1.5, total: 5 }));
    Jenga.addBlock(t);       // 블록 하나가 탑 위에 떠 있다가 천천히 내려와 얹힌다
  };
  onEnter.s07 = () => { replay(doneBody, 'play'); iconPlay(); };
  doneIcon.addEventListener('click', () => {
    iconPlay();
  });

  /* ───────── 07 확인 → 08 (월말이면 08-1) ───────── */
  const isMonthEnd = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getDate() === 1;
  $('[data-done-ok]').addEventListener('click', () => go(isMonthEnd() ? 's08b' : 's08'));

  /* ───────── 08 / 08-1 / 08-2 젠가 탑 ───────── */
  const jgHost = (id) => $('[data-jenga]', $('#' + id));
  onEnter.s08 = () => { const n = Jenga.layersFor(new Date()); Jenga.build(Jenga.tower(jgHost('s08'), { layers: n, total: n, k: 1.6, sway: .5 })); };
  // 시연용: 시간이 지나 월말이 된 상태(08-1)로 넘어가는 대신, 08의 젠가를 누르면 08-1 로 간다
  $('#s08 .tstage')?.addEventListener('click', () => go('s08b'));
  onEnter.s08b = () => Jenga.build(Jenga.tower(jgHost('s08b'), { layers: 7, total: 7, k: 1.15, sway: 1.1 }), { gap: 90 });

  // 08-2: 살짝 튀어나온 블록을 빼면 탑이 반드시 와르르 무너지고, 그 뒤 09 결과가 뿅 나타난다
  const s08c = $('#s08c'), stage = $('[data-jg-stage]', s08c), jgHint = $('[data-jg-hint]', s08c);
  const JK = 2.1;
  let jgRun = 0, jgFinish = null, popNext = false, jgPull = null;
  onEnter.s08c = () => {
    const run = ++jgRun, h = Jenga.tower($('[data-jenga]', stage), { layers: 7, total: 7, k: JK, pull: true });
    const bk = $('.jbk.pull', h.el); jgPull = { h, bk, amt: 0 };
    stage.classList.add('jg-pullable'); jgHint.hidden = false;
    let done = false;
    const auto = setTimeout(() => finish(), 6500);
    const finish = async () => {
      if (done || run !== jgRun) return;
      done = true; clearTimeout(auto); jgHint.hidden = true; stage.classList.remove('jg-pullable'); jgPull = null;
      await Jenga.pullOut(h, bk);
      await sleep(250);
      await Jenga.collapse(h);
      if (run === jgRun && current === 's08c') { popNext = true; go('s09'); }
    };
    jgFinish = finish;
  };
  let jgDrag = null;
  stage.addEventListener('pointerdown', (e) => {
    const bk = e.target.closest('.jbk.pull'); if (!bk || !jgPull) return;
    jgDrag = { x: e.clientX, dx: 0 }; stage.classList.remove('jg-pullable');
    try { stage.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 */ }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!jgDrag || !jgPull) return;
    jgDrag.dx = e.clientX - jgDrag.x;
    const { h, bk } = jgPull;
    Jenga.setPull(h, bk, Math.max(-8, jgDrag.dx));
  });
  const jgUp = () => {
    if (!jgDrag || !jgPull) return;
    const { dx } = jgDrag; jgDrag = null;
    const { h, bk } = jgPull;
    if (Math.abs(dx) < 6 || dx > Jenga.pullThreshold(h)) jgFinish?.();   // 탭이거나 충분히 당겼을 때
    else { bk.style.transform = ''; stage.classList.add('jg-pullable'); }
  };
  stage.addEventListener('pointerup', jgUp); stage.addEventListener('pointercancel', jgUp);
  const EMO = [...Array(15).fill('po1'), ...Array(4).fill('po2'), ...Array(3).fill('po3'), 'po4', 'pa_bl']; // 부정(주황, 많을수록 진하게) 스트레스 62 · 보상심리 19 · 피곤함 12 · 심심함 4 / 긍정(파랑) 설렘 4 — 24블록
  onEnter.s09 = () => {
    Jenga.tower($('#s09 [data-jenga="emo"]'), { layers: 8, k: 1.35, tones: EMO, sway: .8 }); // 떨어지는 연출 없이 가볍게 흔들리기만
    if (!popNext) return; popNext = false;
    $$('#s09 .ai-sum, #s09 .ecard').forEach((c, i) => { c.classList.remove('pop-in'); void c.offsetWidth; c.style.animationDelay = i * .08 + 's'; c.classList.add('pop-in'); });
  };

  /* ───────── 12 다음 달 목표 시트 ───────── */
  const s12 = $('#s12');
  const goalSheet = $('[data-goal-sheet]', s12);
  const goalDim = $('[data-goal-dim]', s12);
  const setGoal = (open) => { goalSheet.hidden = goalDim.hidden = !open; };
  const s12Input = $('input[type=range]', s12), aiBtn = $('[data-ai-apply]', s12);
  const setAmount = (v) => { s12Input.value = v; s12Input.dispatchEvent(new Event('input')); aiBtn.classList.toggle('applied', Number(v) === Number(aiBtn.dataset.value)); };
  aiBtn.addEventListener('click', () => setAmount(aiBtn.dataset.value));   // AI 추천 금액으로 실제 조정
  s12Input.addEventListener('input', () => aiBtn.classList.toggle('applied', Number(s12Input.value) === Number(aiBtn.dataset.value)));
  onEnter.s12 = () => { gSet(false); setAmount(800000); sum12(); $$('.pchip', s12).forEach((c) => c.classList.remove('on')); setGoal(true); }; // 11월 목표 그대로, 소비 항목은 선택 없음
  const gSet = (done) => { // 목표를 저장하고 나면 뒤 카드도 "목표 완료" 로 바뀐다
    $('[data-g-h]', s12).textContent = done ? '12월 목표를 세웠어요' : '11월 감정을 모두 확인했어요';
    $('[data-g-p]', s12).textContent = done ? '12월도 차곡차곡 쌓아봐요' : '이제 12월을 준비해볼까요?';
    $('[data-g-mark]', s12).textContent = done ? '12월의 첫 감정을 기다려요' : '11월 감정 분석을 마쳤어요';
    $('[data-open-goal]', s12).textContent = done ? '목표 수정하기' : '다음 달 목표 설정하러 가기';
  };
  // 12월은 아직 기록이 없어서: 목표 생활비는 가득(100%), 반복 소비·주의 시간대는 비어 있는 상태로 보여 준다
  const sum12 = () => {
    const s = $('.sum', s12); if (!s) return;
    const amt = $('[data-amount]', s12).textContent + '원';
    $('.big', s).textContent = '100%';
    $('.rem b', s).textContent = amt;
    $('.rem span:last-child', s).textContent = '/ ' + amt;
    $('.gauge i', s).style.height = '100%';
    const v = $$('.col2 .v', s);
    v[0].innerHTML = '<b class="s18 mute">기록 없음</b><span>기록이 쌓이면 보여요</span>';
    v[1].innerHTML = '<b class="s18 mute">기록 없음</b><span>기록이 쌓이면 보여요</span>';
  };
  s12Input.addEventListener('input', sum12);
  $('[data-save-goal]', s12).addEventListener('click', () => { setGoal(false); gSet(true); toast('12월 목표를 저장했어요'); });
  $('[data-open-goal]', s12).addEventListener('click', () => setGoal(true));
  goalDim.addEventListener('click', () => setGoal(false));

  /* ───────── 온보딩: 실제 화면을 복제해 줄여서 보여 준다 (iframe 을 쓰지 않아 어디서든 보인다) ───────── */
  ['ob1', 'ob2'].forEach((id) => {
    const host = $('[data-clone]', document.getElementById(id));
    const src = document.getElementById(host.dataset.clone);
    onEnter[id] = () => {
      host.replaceChildren();
      const c = src.cloneNode(true);
      c.removeAttribute('id'); c.dataset.sid = src.id; c.classList.add('active');
      c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      c.querySelectorAll('[data-go],[data-soon],[data-open-goal],[data-save-goal]').forEach((n) => { n.removeAttribute('data-go'); n.removeAttribute('data-soon'); });
      host.append(c);
      const jg = $('[data-jenga]', c);
      if (jg && src.id === 's08') { const n = Jenga.layersFor(new Date()); Jenga.build(Jenga.tower(jg, { layers: n, total: n, k: 1.6, sway: .5 })); }
    };
  });

  /* ───────── 시작 ───────── */
  // ?bare : 목록·그림자 없이 프레임만 (디자인 대조용), ?h=1077 : 프레임 높이 지정
  const q = new URLSearchParams(location.search);
  if (q.has('bare')) document.body.classList.add('bare');
  if (q.get('h')) $('#device').style.height = q.get('h') + 'px';
  go(location.hash.slice(1) || 'ob1');
})();
