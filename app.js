/* SMILE – See More of Iloilo's Landmarks and Events
   Front-end app (vanilla JS, no build step). Talks to the Google Apps Script API set in config.js. */
(() => {
  'use strict';
  const CFG = window.SMILE_CONFIG || {};
  const D = window.SMILE_DATA;
  const API = (CFG.API_URL || '').trim();
  const DEMO = !API;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const catById = Object.fromEntries(D.categories.map(c => [c.id, c]));
  const TAGLINE = "SMILE · See More of Iloilo's Landmarks and Events";

  /* ---------- Safe storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('smile:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('smile:' + k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- State ---------- */
  const normCat = c => (String(c || '').toLowerCase() === 'experiences' ? 'events' : String(c || '').toLowerCase());
  const state = {
    userId: store.get('userId') || (crypto.randomUUID ? crypto.randomUUID() : 'u' + Date.now() + Math.random().toString(36).slice(2)),
    name: store.get('name', ''),
    places: (store.get('places', null) || D.places).map(p => ({ ...p, category: normCat(p.category) })).filter(p => catById[p.category]),
    challenges: store.get('challenges', null) || D.challenges,
    ranks: store.get('ranks', null) || D.ranks,
    profile: null,
    cat: 'landmarks',
    query: '',
    lastPlace: ''
  };
  store.set('userId', state.userId);
  // carry over demo progress from v1 (key "checkins" → "log")
  if (!store.get('log', null) && store.get('checkins', null)) store.set('log', store.get('checkins', []).map(c => ({ ...c, type: 'checkin', category: normCat(c.category) })));

  /* ---------- API ---------- */
  async function apiGet(params) {
    const r = await fetch(API + '?' + new URLSearchParams(params), { redirect: 'follow' });
    return r.json();
  }
  async function apiPost(body) {
    // text/plain avoids a CORS preflight, which Apps Script does not answer
    const r = await fetch(API, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return r.json();
  }

  /* ---------- Scoring (mirror of computeProfile_ in Code.gs) ---------- */
  function computeProfile(log) {
    const s = { total: 0, checkins: 0, photos: 0, points: 0, landmarks: 0, restaurants: 0, shops: 0, events: 0 };
    const visited = {}, photographed = {};
    let base = 0;
    log.forEach(r => {
      const type = r.type || 'checkin', cat = normCat(r.category);
      base += Number(r.points) || 0;
      if (type === 'photo') { s.photos++; photographed[r.placeId] = true; return; }
      s.checkins++;
      if (!visited[r.placeId]) { visited[r.placeId] = true; s.total++; if (s[cat] !== undefined) s[cat]++; }
    });
    let bonus = 0;
    const ch = state.challenges.map(c => {
      let progress = 0, target = Number(c.count) || 1;
      if (c.type === 'places') {
        const ids = String(c.target).split(',').map(x => x.trim()).filter(Boolean);
        target = Math.min(target || ids.length, ids.length);
        progress = ids.filter(id => visited[id]).length;
      } else if (c.type === 'category') progress = s[normCat(c.target)] || 0;
      else if (c.type === 'photos') progress = s.photos;
      else if (c.type === 'checkins') progress = s.total;
      const done = progress >= target;
      if (done) bonus += Number(c.bonus) || 0;
      return { id: c.id, progress: Math.min(progress, target), target, done };
    });
    s.points = base + bonus;
    const ranks = [...state.ranks].sort((a, b) => a.minPoints - b.minPoints);
    let rank = ranks[0], next = ranks[1] || null;
    ranks.forEach((r, i) => { if (s.points >= r.minPoints) { rank = r; next = ranks[i + 1] || null; } });
    return {
      userId: state.userId, name: state.name || 'Explorer',
      points: s.points, basePoints: base, bonusPoints: bonus, stats: s,
      visited: Object.keys(visited), photographed: Object.keys(photographed),
      badges: D.badges.filter(b => D.badgeTests[b.id] && D.badgeTests[b.id](s)).map(b => b.id),
      challenges: ch, rank, nextRank: next
    };
  }
  const localProfile = () => computeProfile(store.get('log', []));

  function localRecord(place, type) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const log = store.get('log', []);
    if (log.some(c => c.placeId === place.id && c.date === today && (c.type || 'checkin') === type)) {
      return { ok: false, error: type === 'photo' ? 'Photo points already claimed here today. Your photo is still saved!' : 'Already checked in here today. Come back tomorrow!' };
    }
    const before = localProfile();
    const pts = type === 'photo' ? D.photoPoints : pointsFor(place);
    log.push({ placeId: place.id, category: place.category, points: pts, date: today, type, ts: Date.now() });
    store.set('log', log);
    const after = localProfile();
    return diffResult(before, after, pts, type);
  }
  function diffResult(before, after, pts, type) {
    return {
      ok: true, earned: pts, type,
      newBadges: after.badges.filter(b => !before.badges.includes(b)),
      newChallenges: after.challenges.filter(c => c.done && !before.challenges.find(x => x.id === c.id && x.done)).map(c => c.id),
      rankUp: after.rank.id !== before.rank.id ? after.rank : null,
      profile: after
    };
  }

  async function loadPlaces() {
    if (DEMO) return;
    try {
      const res = await apiGet({ action: 'places' });
      if (res.ok && res.places?.length) {
        state.places = res.places.map(p => ({ ...p, category: normCat(p.category) })).filter(p => catById[p.category]);
        store.set('places', state.places);
        if (res.challenges?.length) { state.challenges = res.challenges; store.set('challenges', res.challenges); }
        if (res.ranks?.length) { state.ranks = res.ranks; store.set('ranks', res.ranks); }
      }
    } catch (e) { console.warn('Offline: using cached places', e); }
  }
  async function loadProfile() {
    if (DEMO) { setProfile(localProfile()); return; }
    try {
      const res = await apiGet({ action: 'profile', userId: state.userId });
      if (res.ok) setProfile(res.profile);
    } catch { const p = store.get('profile', null); setProfile(p && p.rank ? p : localProfile()); }
  }
  function setProfile(p) {
    state.profile = p; store.set('profile', p);
    $('#pointsValue').textContent = p.points;
    const chip = $('#rankChip'); chip.textContent = p.rank.id; chip.style.setProperty('--rc', p.rank.color);
    chip.classList.toggle('sss', p.rank.id === 'SSS');
    renderHomeRank(); renderRank(); renderChallenges();
  }
  const pointsFor = p => Number(p.points) || D.points[p.category] || 10;
  const visited = id => !!state.profile?.visited?.includes(id);
  const placeById = id => state.places.find(p => p.id === id);

  /* ---------- Router ---------- */
  const VIEWS = ['home', 'explore', 'challenges', 'rank'];
  function route(noScroll) {
    let [view, arg] = (location.hash.replace('#', '') || 'home').split('/');
    if (view === 'badges') view = 'rank';
    const v = VIEWS.includes(view) ? view : 'home';
    $$('.view').forEach(s => s.hidden = s.dataset.view !== v);
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === v));
    if (v === 'explore') { if (arg === 'experiences') arg = 'events'; if (arg && catById[arg]) state.cat = arg; renderExplore(); }
    if (v === 'challenges') renderChallenges();
    if (v === 'rank') { renderRank(); loadLeaderboard(); }
    if (noScroll !== true && !document.body.classList.contains('is-splashing')) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ---------- Render helpers ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const emblem = (r, cls = '') => `<span class="rank-emblem ${cls} ${r.id === 'SSS' ? 'sss' : ''}" style="--rc:${esc(r.color)}">${esc(r.id)}</span>`;
  const pct = (a, b) => Math.max(0, Math.min(100, b ? (a / b) * 100 : 100));

  function rankProgress(p) {
    if (!p.nextRank) return { pct: 100, text: 'Highest rank reached! 🌟' };
    const span = p.nextRank.minPoints - p.rank.minPoints;
    return { pct: pct(p.points - p.rank.minPoints, span), text: `${p.nextRank.minPoints - p.points} pts to ${p.nextRank.name}` };
  }

  function renderHomeRank() {
    const p = state.profile; if (!p) return;
    const pr = rankProgress(p);
    $('#homeRank').innerHTML = `${emblem(p.rank)}
      <div class="rs-body"><strong>${esc(p.rank.name)} · ${esc(p.rank.title || '')}</strong>
        <div class="bar"><i style="width:${pr.pct}%;--rc:${esc(p.rank.color)}"></i></div>
        <small class="muted">${p.points} pts · ${esc(pr.text)}</small></div>
      <span class="rs-go">→</span>`;
  }

  function renderCategories() {
    const count = c => state.places.filter(p => p.category === c).length;
    $('#catGrid').innerHTML = D.categories.map(c => `
      <a class="cat-card" href="#explore/${c.id}" style="--c:${c.color};background-image:url(${c.img})">
        <span class="ico">${c.icon}</span>
        <strong>${esc(c.name)}</strong><small>${esc(c.blurb)} · ${count(c.id)} ${c.id === 'events' ? 'events' : 'spots'}</small>
      </a>`).join('') + `
      <a class="cat-card" href="#challenges" style="--c:var(--c-badges);background:linear-gradient(135deg,#EC2882,#FF7814)">
        <span class="ico">🏁</span><strong>Challenges</strong><small>${state.challenges.length} challenges · bonus points</small>
      </a>`;
  }

  function renderTabs() {
    $('#catTabs').innerHTML = D.categories.map(c => `
      <button class="tab" role="tab" style="--c:${c.color}" aria-selected="${c.id === state.cat}" data-cat="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('');
  }

  function renderExplore() {
    const c = catById[state.cat];
    $('#exploreTitle').textContent = c.name;
    renderTabs();
    const q = state.query.toLowerCase();
    const list = state.places.filter(p => p.category === state.cat &&
      (!q || [p.name, p.area, p.description, p.schedule, ...(p.tags || [])].join(' ').toLowerCase().includes(q)));
    $('#placeGrid').innerHTML = list.length ? list.map((p, i) => `
      <button class="place card" style="--c:${c.color};animation-delay:${i * 45}ms" data-place="${esc(p.id)}">
        <div class="place-img" style="background-image:url('${esc(p.image || c.img)}')">
          <span class="tag">${c.icon} ${esc(c.id === 'restaurants' ? 'Food' : c.name)}</span>
          ${visited(p.id) ? '<span class="done">✓ Visited</span>' : ''}
        </div>
        <div class="place-body">
          <strong>${esc(p.name)}</strong>
          <span class="area">📍 ${esc(p.area)}${p.schedule ? ` · 📅 ${esc(p.schedule)}` : ''}</span>
          <p>${esc(p.description)}</p>
          <div class="place-foot"><span>+${pointsFor(p)} pts · 📸 +${D.photoPoints}</span><span>View →</span></div>
        </div>
      </button>`).join('') : `<div class="empty">Nothing matches “${esc(state.query)}”.</div>`;
  }

  function challengeCard(c, prog, compact) {
    const ids = c.type === 'places' ? String(c.target).split(',').map(x => x.trim()).filter(Boolean) : [];
    const steps = ids.length && !compact ? `<div class="ch-steps">${ids.map(id => {
      const pl = placeById(id); if (!pl) return '';
      return `<button type="button" class="ch-step ${visited(id) ? 'ok' : ''}" data-place="${esc(id)}">${visited(id) ? '✓' : '○'} ${esc(pl.name)}</button>`;
    }).join('')}</div>` : '';
    const hint = { category: `Check in at ${catById[normCat(c.target)]?.name || c.target}.`, photos: 'Tap 📸 Take Photo at any tagged place.', checkins: 'Every new place counts.' }[c.type] || '';
    return `<div class="challenge card ${prog.done ? 'done' : ''}">
      <div class="ch-head"><span class="ch-ico">${esc(c.icon)}</span>
        <div><strong>${esc(c.name)}</strong><small class="muted">${esc(c.description)}</small></div>
        <span class="ch-bonus">${prog.done ? '✓ ' : '+'}${c.bonus}</span></div>
      <div class="bar"><i style="width:${pct(prog.progress, prog.target)}%"></i></div>
      <div class="ch-meta"><span>${prog.progress} / ${prog.target}</span><span>${prog.done ? 'Completed! Bonus earned' : esc(hint)}</span></div>
      ${steps}
    </div>`;
  }

  function renderChallenges() {
    const p = state.profile; if (!p) return;
    const progOf = id => p.challenges.find(x => x.id === id) || { progress: 0, target: 1, done: false };
    const sorted = [...state.challenges].sort((a, b) => progOf(a.id).done - progOf(b.id).done);
    $('#challengeGrid').innerHTML = sorted.map(c => challengeCard(c, progOf(c.id), false)).join('');
    $('#homeChallenges').innerHTML = sorted.slice(0, 3).map(c => challengeCard(c, progOf(c.id), true)).join('');
  }

  function renderRank() {
    const p = state.profile; if (!p) return;
    const s = p.stats || {};
    const pr = rankProgress(p);
    const nick = state.name || p.name || 'Explorer';
    $('#rankHero').innerHTML = `
      <div class="rh-top">
        ${emblem(p.rank, 'lg')}
        <div class="rh-info">
          <span class="eyebrow" style="color:${esc(p.rank.color)}">${esc(p.rank.title || '')}</span>
          <h3>${esc(p.rank.name)}</h3>
          <span class="muted">${esc(nick)} · <button class="link" type="button" id="editName">${state.name ? 'Change nickname' : 'Set nickname'}</button></span>
        </div>
        <div class="rh-pts"><div class="big-points">${p.points}</div><small class="muted">points</small></div>
      </div>
      <div class="bar lg"><i style="width:${pr.pct}%;--rc:${esc(p.rank.color)}"></i></div>
      <div class="ch-meta"><span>${esc(pr.text)}</span><span>${p.bonusPoints} bonus pts from challenges</span></div>
      <div class="stats">
        ${D.categories.map(c => `<div class="stat" style="--c:${c.color}"><b>${s[c.id] || 0}</b><small>${esc(c.name)}</small></div>`).join('')}
        <div class="stat" style="--c:var(--c-badges)"><b>${s.photos || 0}</b><small>Photos</small></div>
        <div class="stat" style="--c:var(--green)"><b>${p.challenges.filter(c => c.done).length}/${p.challenges.length}</b><small>Challenges</small></div>
      </div>
      ${DEMO ? '<small class="muted">Demo mode: progress is saved on this device.</small>' : ''}`;
    const ranks = [...state.ranks].sort((a, b) => a.minPoints - b.minPoints);
    $('#rankLadder').innerHTML = ranks.map(r => {
      const got = p.points >= r.minPoints, cur = r.id === p.rank.id;
      return `<div class="rung ${got ? 'got' : ''} ${cur ? 'cur' : ''}">${emblem(r, 'sm')}
        <div><strong>${esc(r.name)}</strong><small>${esc(r.title || '')}</small></div><span>${r.minPoints}+</span></div>`;
    }).reverse().join('');
    $('#badgeGrid').innerHTML = D.badges.map(b => `
      <div class="badge card ${p.badges.includes(b.id) ? 'on' : ''}">
        <div class="b-ico">${b.icon}</div><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small>
      </div>`).join('');
  }

  async function loadLeaderboard() {
    const el = $('#leaderboard');
    const row = u => `<li>${emblem({ id: u.rank, color: u.color || '#999' }, 'xs')}<span>${esc(u.name)}</span><b>${u.points} pts</b></li>`;
    if (DEMO) {
      const me = state.profile;
      el.innerHTML = row({ name: state.name || 'You', points: me.points, rank: me.rank.id, color: me.rank.color }) +
        '<li class="muted">Connect the Apps Script backend to see other explorers.</li>';
      return;
    }
    try {
      const res = await apiGet({ action: 'leaderboard' });
      el.innerHTML = res.ok && res.leaderboard.length ? res.leaderboard.map(row).join('') : '<li class="muted">No explorers yet. Be the first!</li>';
    } catch { el.innerHTML = '<li class="muted">Leaderboard unavailable offline.</li>'; }
  }

  /* ---------- Place sheet ---------- */
  function openPlace(id) {
    const p = placeById(id); if (!p) return;
    state.lastPlace = id;
    const c = catById[p.category];
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.mapQuery || `${p.name}, ${p.area}, Iloilo`);
    const inCh = state.challenges.filter(ch => ch.type === 'places' && String(ch.target).split(',').map(x => x.trim()).includes(id));
    $('#sheetBody').innerHTML = `
      <div class="sheet-hero" style="--c:${c.color};background-image:url('${esc(p.image || c.img)}')"></div>
      <div class="sheet-content">
        <span class="pill" style="background:${c.color};color:#fff">${c.icon} ${esc(c.name)}</span>
        <h3 id="sheetTitle">${esc(p.name)}</h3>
        <span class="muted">📍 ${esc(p.area)}, Iloilo</span>
        ${p.schedule ? `<div class="when">📅 ${esc(p.schedule)}</div>` : ''}
        <p>${esc(p.description)}</p>
        <div class="chips">${(p.tags || []).map(t => `<span class="chip">#${esc(t)}</span>`).join('')}
          <span class="chip">★ Check in +${pointsFor(p)}</span><span class="chip">📸 Photo +${D.photoPoints}</span></div>
        ${inCh.length ? `<div class="in-ch">🏁 Part of: ${inCh.map(ch => `<a href="#challenges">${esc(ch.name)}</a>`).join(', ')}</div>` : ''}
        <div class="sheet-actions">
          <a class="btn btn-ghost" href="${maps}" target="_blank" rel="noopener">🗺️ Directions</a>
          <button class="btn btn-ghost" type="button" data-camera="${esc(p.id)}">📸 Take Photo</button>
          <button class="btn btn-primary span2" type="button" id="checkinBtn" data-id="${esc(p.id)}">${visited(p.id) ? '✓ Check in again' : `Check in +${pointsFor(p)} pts`}</button>
        </div>
      </div>`;
    $('#sheetBackdrop').hidden = false; $('#placeSheet').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    $('#sheetBackdrop').hidden = true; $('#placeSheet').hidden = true;
    document.body.style.overflow = '';
  }

  function getPosition() {
    return new Promise(res => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 });
    });
  }

  /** Records a check-in or photo and celebrates the result. */
  async function record(placeId, type) {
    if (!state.name) { const ok = await askName(); if (!ok) return null; }
    const place = placeById(placeId); if (!place) return null;
    let res;
    try {
      if (DEMO) res = localRecord(place, type);
      else {
        const pos = type === 'checkin' ? await getPosition() : null;
        res = await apiPost({ action: type, userId: state.userId, name: state.name, placeId, ...(pos || {}) });
      }
    } catch { toast('You seem to be offline. Try again when connected.'); return null; }
    if (res.profile) setProfile(res.profile);
    if (!res.ok) { toast(res.error || 'Something went wrong.'); return res; }
    celebrate();
    const pill = $('#pointsPill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    const extras = [];
    (res.newChallenges || []).forEach(id => { const c = state.challenges.find(x => x.id === id); if (c) extras.push(`🏁 ${c.name} complete! +${c.bonus}`); });
    (res.newBadges || []).forEach(id => { const b = D.badges.find(x => x.id === id); if (b) extras.push(`${b.icon} ${b.name}`); });
    toast(`+${res.earned} pts ${type === 'photo' ? 'for your photo' : 'at ' + place.name}!` + (extras.length ? ' · ' + extras.join(' · ') : ''), 4200);
    if (res.rankUp) setTimeout(() => showRankUp(res.rankUp), 900);
    renderCategories(); if (!$('#view-explore').hidden) renderExplore();
    return res;
  }

  async function checkIn(id, btn) {
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Checking in…';
    const res = await record(id, 'checkin');
    btn.disabled = false;
    btn.textContent = res && res.ok ? '✓ Checked in' : label;
  }

  function showRankUp(r) {
    const box = $('#rankup'), em = $('#rankupEmblem');
    em.textContent = r.id; em.style.setProperty('--rc', r.color); em.classList.toggle('sss', r.id === 'SSS');
    $('#rankupTitle').textContent = r.name; $('#rankupSub').textContent = `You are now ${r.title ? 'a ' + r.title : r.name}!`;
    box.hidden = false; celebrate(140);
  }

  /* ---------- Camera ---------- */
  const cam = { stream: null, facing: 'environment', blob: null, logo: null, url: null };
  const logoImg = new Image(); logoImg.src = 'assets/logo-circle.png';

  function fillPlaceSelect(selected) {
    const sel = $('#camPlace');
    sel.innerHTML = '<option value="">No place tagged</option>' + D.categories.map(c =>
      `<optgroup label="${esc(c.icon + ' ' + c.name)}">${state.places.filter(p => p.category === c.id)
        .map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
    sel.value = selected || '';
    updateGuide();
  }
  function updateGuide() {
    const p = placeById($('#camPlace').value);
    $('#camGuidePlace').textContent = p ? p.name : 'Iloilo';
    $('#camPts').textContent = p ? `+${D.photoPoints}` : '';
  }

  async function openCamera(placeId) {
    closeSheet();
    fillPlaceSelect(placeId || state.lastPlace);
    $('#camera').hidden = false; document.body.style.overflow = 'hidden';
    showShoot();
    await startStream();
  }
  async function startStream() {
    stopStream();
    const msg = $('#camMsg'); msg.hidden = true;
    if (!navigator.mediaDevices?.getUserMedia) return cameraFallback('Live camera is not available in this browser.');
    try {
      cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cam.facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      const v = $('#camVideo'); v.srcObject = cam.stream; v.classList.toggle('mirror', cam.facing === 'user');
      await v.play().catch(() => {});
    } catch (e) {
      cameraFallback(e && e.name === 'NotAllowedError' ? 'Camera permission was blocked.' : 'Could not start the camera.');
    }
  }
  function cameraFallback(reason) {
    const msg = $('#camMsg');
    msg.innerHTML = `<p>${esc(reason)}</p><button type="button" class="btn btn-primary" id="camNative">📷 Open phone camera</button>
      <small>or tap 🖼️ to choose a photo</small>`;
    msg.hidden = false;
  }
  function stopStream() { if (cam.stream) { cam.stream.getTracks().forEach(t => t.stop()); cam.stream = null; } }
  function closeCamera() {
    stopStream(); $('#camera').hidden = true; document.body.style.overflow = '';
    if (cam.url) { URL.revokeObjectURL(cam.url); cam.url = null; }
  }
  function showShoot() {
    $('#camResult').hidden = true; $('#camVideo').hidden = false;
    $('.cam-frame-guide').hidden = false;
    $('#camShootControls').hidden = false; $('#camResultControls').hidden = true;
  }

  function drawCover(ctx, src, sw, sh, W, H, mirror) {
    const s = Math.max(W / sw, H / sh), dw = sw * s, dh = sh * s;
    ctx.save();
    if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  }
  function wrapLines(ctx, text, maxW, maxLines) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…'); }
    return lines;
  }

  /** Draws the photo plus the SMILE frame, then shows the result. */
  async function composePhoto(src, sw, sh, mirror) {
    try { await document.fonts.ready; } catch {}
    const W = 1080, H = 1350, cv = $('#camCanvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    drawCover(ctx, src, sw, sh, W, H, mirror);
    const place = placeById($('#camPlace').value);
    const font = (w, s) => `${w} ${s}px Poppins, system-ui, sans-serif`;
    // top shade
    let g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260);
    // logo
    if (logoImg.complete && logoImg.naturalWidth) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.drawImage(logoImg, 40, 40, 190, 190); ctx.restore();
    }
    // hashtag pill
    ctx.font = font(700, 34); const tag = '#SMILEIloilo', tw = ctx.measureText(tag).width;
    ctx.fillStyle = 'rgba(255,255,255,.92)'; roundRect(ctx, W - tw - 96, 70, tw + 56, 64, 32); ctx.fill();
    ctx.fillStyle = '#C2410C'; ctx.fillText(tag, W - tw - 68, 114);
    // bottom band
    g = ctx.createLinearGradient(0, H - 420, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.45, 'rgba(20,10,0,.55)'); g.addColorStop(1, 'rgba(20,10,0,.85)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 420, W, 420);
    ctx.fillStyle = '#fff'; ctx.font = font(800, 64);
    const title = place ? place.name : 'Iloilo City';
    const lines = wrapLines(ctx, title, W - 120, 2);
    let y = H - 70 - 54 - 50 - (lines.length - 1) * 74;
    lines.forEach(l => { ctx.fillText(l, 56, y); y += 74; });
    ctx.font = font(600, 34); ctx.fillStyle = '#FFD889';
    const c = place ? catById[place.category] : null;
    ctx.fillText(place ? `${c.icon} ${place.area}, Iloilo` : '📍 Iloilo, Philippines', 56, y + 2);
    ctx.font = font(500, 26); ctx.fillStyle = 'rgba(255,255,255,.9)';
    const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`${date} · ${TAGLINE}`, 56, H - 52);
    // rank chip
    const r = state.profile?.rank;
    if (r) {
      ctx.font = font(800, 30); const rt = r.name, rw = ctx.measureText(rt).width;
      ctx.fillStyle = r.color; roundRect(ctx, W - rw - 96, H - 160, rw + 48, 56, 28); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(rt, W - rw - 72, H - 121);
    }
    // rainbow strip
    ['#1D5CC8', '#FFB800', '#22A046', '#FF7814', '#EC2882'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(i * W / 5, H - 18, W / 5 + 1, 18); });

    cam.blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92));
    if (cam.url) URL.revokeObjectURL(cam.url);
    cam.url = URL.createObjectURL(cam.blob);
    const img = $('#camResult'); img.src = cam.url; img.hidden = false;
    $('#camVideo').hidden = true; $('.cam-frame-guide').hidden = true; $('#camMsg').hidden = true;
    $('#camShootControls').hidden = true; $('#camResultControls').hidden = false;
    stopStream();
    if (place) record(place.id, 'photo');
    else toast('Photo ready! Tag a place next time to earn points.');
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function shoot() {
    const v = $('#camVideo');
    if (!cam.stream || !v.videoWidth) { $('#camCapture').click(); return; }
    const flash = document.createElement('div'); flash.className = 'flash'; $('.cam-stage').appendChild(flash); setTimeout(() => flash.remove(), 400);
    composePhoto(v, v.videoWidth, v.videoHeight, cam.facing === 'user');
  }
  function fromFile(file) {
    if (!file) return;
    const img = new Image();
    img.onload = () => { composePhoto(img, img.naturalWidth, img.naturalHeight, false); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  }
  function fileName() {
    const p = placeById($('#camPlace').value);
    return `SMILE-${(p ? p.name : 'Iloilo').replace(/[^\w]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.jpg`;
  }
  function savePhoto() {
    if (!cam.url) return;
    const a = document.createElement('a'); a.href = cam.url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
    toast('Photo saved! 📸');
  }
  async function sharePhoto() {
    if (!cam.blob) return;
    const p = placeById($('#camPlace').value);
    const file = new File([cam.blob], fileName(), { type: 'image/jpeg' });
    const text = `${p ? p.name + ', ' + p.area + ', Iloilo. ' : ''}${TAGLINE} #SMILEIloilo #Iloilo`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'SMILE Iloilo', text }); } catch {}
    } else { savePhoto(); toast('Saved! Share it from your gallery with #SMILEIloilo'); }
  }

  /* ---------- Name dialog ---------- */
  function askName() {
    return new Promise(resolve => {
      const dlg = $('#nameDialog'), input = $('#nameInput');
      input.value = state.name;
      const done = ok => { if (dlg.open) dlg.close(); resolve(ok); };
      $('#nameCancel').onclick = () => done(false);
      $('#nameForm').onsubmit = ev => {
        ev.preventDefault();
        const v = input.value.trim().slice(0, 40); if (!v) return;
        state.name = v; store.set('name', v);
        if (!DEMO) apiPost({ action: 'register', userId: state.userId, name: v }).then(r => r.ok && setProfile(r.profile)).catch(() => {});
        renderRank(); done(true);
      };
      if (dlg.showModal) dlg.showModal(); else { const v = prompt('Your nickname'); if (v) { state.name = v; store.set('name', v); } resolve(!!v); }
      setTimeout(() => input.focus(), 50);
    });
  }

  /* ---------- Toast & confetti ---------- */
  let toastT;
  function toast(msg, ms = 2800) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
  }
  function celebrate(n = 70) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('#confetti'), colors = ['#1D5CC8', '#FFB800', '#22A046', '#FF7814', '#EC2882'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[i % colors.length];
      el.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      el.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      el.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
      el.style.animationDelay = Math.random() * .3 + 's';
      box.appendChild(el);
      setTimeout(() => el.remove(), 3600);
    }
  }

  /* ---------- Install banner (first open) ---------- */
  let deferredPrompt = null, bannerWanted = false;
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    $('#installLink').hidden = false;
    if (bannerWanted) showInstallBanner();
  });
  window.addEventListener('appinstalled', () => { hideInstallBanner(); store.set('installDismissed', true); $('#installLink').hidden = true; toast('SMILE installed! 🎉'); });

  function maybeShowInstallBanner() {
    if (isStandalone() || store.get('installDismissed', false)) return;
    bannerWanted = true; showInstallBanner();
  }
  function showInstallBanner() {
    const b = $('#installBanner'), btn = $('#installBtn'), msg = $('#installMsg');
    if (isIOS) {
      msg.innerHTML = 'Tap <svg class="ios-share" viewBox="0 0 24 24" fill="none" stroke="#1D7FE0" stroke-width="2"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8"/></svg> <b>Share</b>, then <b>Add to Home Screen</b>.';
      btn.textContent = 'Got it';
    } else if (deferredPrompt) {
      msg.textContent = 'Add SMILE to your home screen for faster, offline-ready exploring.'; btn.textContent = 'Install';
    } else {
      msg.textContent = 'Use your browser menu (⋮) and choose "Install app" or "Add to Home screen".'; btn.textContent = 'OK';
    }
    b.classList.remove('out'); b.hidden = false;
  }
  function hideInstallBanner(remember = true) {
    const b = $('#installBanner'); if (b.hidden) return;
    b.classList.add('out'); setTimeout(() => { b.hidden = true; }, 300);
    if (remember) store.set('installDismissed', true);
    bannerWanted = false;
  }
  async function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') $('#installLink').hidden = true;
    }
    hideInstallBanner();
  }

  /* ---------- Splash ---------- */
  function runSplash() {
    const splash = $('#splash');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('is-splashing');
    let ended = false;
    const end = () => {
      if (ended) return; ended = true;
      splash.classList.add('leave');
      document.body.classList.remove('is-splashing');
      document.body.classList.add('reveal');
      setTimeout(() => splash.remove(), 800);
      setTimeout(maybeShowInstallBanner, 1400);
    };
    splash.addEventListener('click', end);
    setTimeout(end, reduce ? 300 : (CFG.SPLASH_MS || 2300));
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', e => {
    const t = e.target;
    const camBtn = t.closest('[data-camera]');
    if (camBtn) { openCamera(camBtn.dataset.camera || ''); return; }
    const tab = t.closest('[data-cat]');
    if (tab) { location.hash = '#explore/' + tab.dataset.cat; return; }
    const pl = t.closest('[data-place]');
    if (pl) { openPlace(pl.dataset.place); return; }
    const ck = t.closest('#checkinBtn');
    if (ck) { checkIn(ck.dataset.id, ck); return; }
    if (t.closest('#editName')) { askName(); return; }
    if (t.closest('#pointsPill')) { location.hash = '#rank'; return; }
    if (t.closest('#camNative')) { $('#camCapture').click(); return; }
  });
  $('#sheetClose').addEventListener('click', closeSheet);
  $('#sheetBackdrop').addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#camera').hidden) closeCamera(); else if (!$('#placeSheet').hidden) closeSheet();
  });
  $('#searchInput').addEventListener('input', e => { state.query = e.target.value; renderExplore(); });
  $('#installBtn').addEventListener('click', doInstall);
  $('#installClose').addEventListener('click', () => hideInstallBanner());
  $('#installLink').addEventListener('click', () => { if (deferredPrompt) doInstall(); else showInstallBanner(); });
  $('#camClose').addEventListener('click', closeCamera);
  $('#camFlip').addEventListener('click', () => { cam.facing = cam.facing === 'user' ? 'environment' : 'user'; showShoot(); startStream(); });
  $('#camShutter').addEventListener('click', shoot);
  $('#camPlace').addEventListener('change', updateGuide);
  $('#camFile').addEventListener('change', e => { fromFile(e.target.files[0]); e.target.value = ''; });
  $('#camCapture').addEventListener('change', e => { fromFile(e.target.files[0]); e.target.value = ''; });
  $('#camRetake').addEventListener('click', () => { showShoot(); startStream(); });
  $('#camSave').addEventListener('click', savePhoto);
  $('#camShare').addEventListener('click', sharePhoto);
  $('#rankupClose').addEventListener('click', () => { $('#rankup').hidden = true; });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', () => { loadPlaces().then(() => { renderCategories(); route(); }); loadProfile(); });

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW failed', err)));
  }

  /* ---------- Boot ---------- */
  runSplash();
  renderCategories();
  setProfile(DEMO ? localProfile() : ((p => (p && p.rank ? p : localProfile()))(store.get('profile', null))));
  route();
  Promise.all([loadPlaces(), loadProfile()]).then(() => { renderCategories(); route(true); });
})();
