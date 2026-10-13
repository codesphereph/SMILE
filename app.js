/* SMILE – See More of Iloilo's Landmarks and Experiences
   Front-end app (vanilla JS, no build step). Talks to the Google Apps Script API in config.js. */
(() => {
  'use strict';
  const CFG = window.SMILE_CONFIG || {};
  const D = window.SMILE_DATA;
  const API = (CFG.API_URL || '').trim();
  const DEMO = !API;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const catById = Object.fromEntries(D.categories.map(c => [c.id, c]));

  /* ---------- Safe storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('smile:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('smile:' + k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- State ---------- */
  const state = {
    userId: store.get('userId') || (crypto.randomUUID ? crypto.randomUUID() : 'u' + Date.now() + Math.random().toString(36).slice(2)),
    name: store.get('name', ''),
    places: store.get('places', D.places),
    profile: store.get('profile', null),
    cat: 'landmarks',
    query: ''
  };
  store.set('userId', state.userId);

  /* ---------- API ---------- */
  async function apiGet(params) {
    const url = API + '?' + new URLSearchParams(params);
    const r = await fetch(url, { method: 'GET', redirect: 'follow' });
    return r.json();
  }
  async function apiPost(body) {
    // text/plain avoids a CORS preflight, which Apps Script does not answer
    const r = await fetch(API, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return r.json();
  }

  /* Demo mode: compute profile locally */
  function localProfile() {
    const log = store.get('checkins', []);
    const s = { total: log.length, points: 0, landmarks: 0, restaurants: 0, shops: 0, experiences: 0 };
    const visited = new Set();
    log.forEach(c => { s.points += c.points; if (!visited.has(c.placeId)) s[c.category]++; visited.add(c.placeId); });
    return { userId: state.userId, name: state.name || 'Explorer', points: s.points, stats: s, visited: [...visited],
      badges: D.badges.filter(b => D.badgeTests[b.id](s)).map(b => b.id) };
  }
  function localCheckIn(place) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const log = store.get('checkins', []);
    if (log.some(c => c.placeId === place.id && c.date === today)) return { ok: false, error: 'Already checked in here today. Come back tomorrow!' };
    const before = localProfile();
    log.push({ placeId: place.id, category: place.category, points: place.points, date: today, ts: Date.now() });
    store.set('checkins', log);
    const after = localProfile();
    return { ok: true, earned: place.points, newBadges: after.badges.filter(b => !before.badges.includes(b)), profile: after };
  }

  async function loadPlaces() {
    if (DEMO) { state.places = D.places; return; }
    try {
      const res = await apiGet({ action: 'places' });
      if (res.ok && res.places?.length) { state.places = res.places; store.set('places', res.places); }
    } catch (e) { console.warn('Places offline, using cache', e); }
  }
  async function loadProfile() {
    if (DEMO) { setProfile(localProfile()); return; }
    try {
      const res = await apiGet({ action: 'profile', userId: state.userId });
      if (res.ok) setProfile(res.profile);
    } catch (e) { if (state.profile) setProfile(state.profile); }
  }
  function setProfile(p) {
    state.profile = p; store.set('profile', p);
    $('#pointsValue').textContent = p ? p.points : 0;
    renderBadges();
  }
  const pointsFor = p => Number(p.points) || D.points[p.category] || 10;
  const visited = id => !!state.profile?.visited?.includes(id);

  /* ---------- Router ---------- */
  function route() {
    const [view, arg] = (location.hash.replace('#', '') || 'home').split('/');
    const v = ['home', 'explore', 'badges'].includes(view) ? view : 'home';
    $$('.view').forEach(s => s.hidden = s.dataset.view !== v);
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === v));
    if (v === 'explore') { if (arg && catById[arg]) state.cat = arg; renderExplore(); }
    if (v === 'badges') { renderBadges(); loadLeaderboard(); }
    if (view === 'place' && arg) openPlace(arg);
    if (!document.body.classList.contains('is-splashing')) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ---------- Renderers ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderCategories() {
    const counts = c => state.places.filter(p => p.category === c).length;
    $('#catGrid').innerHTML = D.categories.map(c => `
      <a class="cat-card" href="#explore/${c.id}" style="--c:${c.color};background-image:url(${c.img})">
        <span class="ico">${c.icon}</span>
        <strong>${esc(c.name)}</strong><small>${esc(c.blurb)} · ${counts(c.id)} spots</small>
      </a>`).join('') + `
      <a class="cat-card" href="#badges" style="--c:var(--c-badges);background:linear-gradient(135deg,#EC2882,#FF7814)">
        <span class="ico">⭐</span><strong>Badges &amp; Points</strong><small>Check in, earn points, collect badges</small>
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
      (!q || [p.name, p.area, p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(q)));
    $('#placeGrid').innerHTML = list.length ? list.map((p, i) => `
      <button class="place card" style="--c:${c.color};animation-delay:${i * 45}ms" data-place="${esc(p.id)}">
        <div class="place-img" style="background-image:url('${esc(p.image || c.img)}')">
          <span class="tag">${c.icon} ${esc(c.name.split(' ')[0])}</span>
          ${visited(p.id) ? '<span class="done">✓ Visited</span>' : ''}
        </div>
        <div class="place-body">
          <strong>${esc(p.name)}</strong>
          <span class="area">📍 ${esc(p.area)}</span>
          <p>${esc(p.description)}</p>
          <div class="place-foot"><span>+${pointsFor(p)} pts</span><span>View →</span></div>
        </div>
      </button>`).join('') : `<div class="empty">No places match “${esc(state.query)}”.</div>`;
  }

  function renderBadges() {
    const p = state.profile || localProfile();
    const s = p.stats || {};
    const initial = (state.name || p.name || 'E').trim().charAt(0).toUpperCase();
    $('#profileCard').innerHTML = `
      <div class="avatar"><span>${esc(initial)}</span></div>
      <div class="profile-info">
        <h3>${esc(state.name || p.name || 'Explorer')}</h3>
        <span class="muted">${p.badges.length} of ${D.badges.length} badges · ${s.total || 0} check-ins</span><br>
        <button class="link" type="button" id="editName">${state.name ? 'Change nickname' : 'Set nickname'}</button>
        ${DEMO ? '<br><small class="muted">Demo mode: points are saved on this device.</small>' : ''}
      </div>
      <div><div class="big-points">${p.points}</div><small class="muted">total points</small></div>
      <div class="stats">${D.categories.map(c => `<div class="stat" style="--c:${c.color}"><b>${s[c.id] || 0}</b><small>${esc(c.name)}</small></div>`).join('')}</div>`;
    $('#badgeGrid').innerHTML = D.badges.map(b => `
      <div class="badge card ${p.badges.includes(b.id) ? 'on' : ''}">
        <div class="b-ico">${b.icon}</div><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small>
      </div>`).join('');
  }

  async function loadLeaderboard() {
    const el = $('#leaderboard');
    if (DEMO) {
      const me = state.profile || localProfile();
      el.innerHTML = `<li><span>${esc(state.name || 'You')}</span><b>${me.points} pts</b></li>
        <li class="muted">Connect the Apps Script backend to see other explorers.</li>`;
      return;
    }
    try {
      const res = await apiGet({ action: 'leaderboard' });
      el.innerHTML = res.ok && res.leaderboard.length
        ? res.leaderboard.map(u => `<li><span>${esc(u.name)}</span><b>${u.points} pts</b></li>`).join('')
        : '<li class="muted">No explorers yet. Be the first!</li>';
    } catch { el.innerHTML = '<li class="muted">Leaderboard unavailable offline.</li>'; }
  }

  /* ---------- Place sheet ---------- */
  function openPlace(id) {
    const p = state.places.find(x => x.id === id); if (!p) return;
    const c = catById[p.category];
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.mapQuery || `${p.name}, ${p.area}, Iloilo`);
    const done = visited(p.id);
    $('#sheetBody').innerHTML = `
      <div class="sheet-hero" style="--c:${c.color};background-image:url('${esc(p.image || c.img)}')"></div>
      <div class="sheet-content">
        <span class="pill" style="background:${c.color};color:#fff">${c.icon} ${esc(c.name)}</span>
        <h3 id="sheetTitle">${esc(p.name)}</h3>
        <span class="muted">📍 ${esc(p.area)}, Iloilo</span>
        <p>${esc(p.description)}</p>
        <div class="chips">${(p.tags || []).map(t => `<span class="chip">#${esc(t)}</span>`).join('')}<span class="chip">★ +${pointsFor(p)} pts</span></div>
        <div class="sheet-actions">
          <a class="btn btn-ghost" href="${maps}" target="_blank" rel="noopener">🗺️ Directions</a>
          <button class="btn btn-primary" type="button" id="checkinBtn" data-id="${esc(p.id)}">${done ? '✓ Check in again' : `Check in +${pointsFor(p)}`}</button>
        </div>
      </div>`;
    $('#sheetBackdrop').hidden = false; $('#placeSheet').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#sheetClose').focus();
  }
  function closeSheet() {
    $('#sheetBackdrop').hidden = true; $('#placeSheet').hidden = true;
    document.body.style.overflow = '';
    if (location.hash.startsWith('#place/')) history.back();
  }

  function getPosition() {
    return new Promise(res => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 });
    });
  }

  async function checkIn(id, btn) {
    if (!state.name) { const ok = await askName(); if (!ok) return; }
    const place = state.places.find(p => p.id === id);
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Checking in…';
    try {
      let res;
      if (DEMO) res = localCheckIn({ ...place, points: pointsFor(place) });
      else {
        const pos = await getPosition();
        res = await apiPost({ action: 'checkin', userId: state.userId, name: state.name, placeId: id, ...(pos || {}) });
      }
      if (res.profile) setProfile(res.profile);
      if (!res.ok) { toast(res.error || 'Could not check in.'); return; }
      celebrate();
      const pill = $('#pointsPill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
      const nb = (res.newBadges || []).map(b => D.badges.find(x => x.id === b)).filter(Boolean);
      toast(`+${res.earned} points at ${place.name}!` + (nb.length ? ` 🏅 New badge: ${nb.map(b => b.icon + ' ' + b.name).join(', ')}` : ''), 3800);
      renderExplore(); renderCategories();
      btn.textContent = '✓ Checked in';
      return;
    } catch (e) {
      toast('You seem to be offline. Try again when connected.');
    } finally { btn.disabled = false; if (btn.textContent === 'Checking in…') btn.textContent = label; }
  }

  /* ---------- Name dialog ---------- */
  function askName() {
    return new Promise(resolve => {
      const dlg = $('#nameDialog'), input = $('#nameInput');
      input.value = state.name;
      const done = ok => { dlg.close(); resolve(ok); };
      $('#nameCancel').onclick = () => done(false);
      $('#nameForm').onsubmit = async ev => {
        ev.preventDefault();
        const v = input.value.trim().slice(0, 40); if (!v) return;
        state.name = v; store.set('name', v);
        if (!DEMO) apiPost({ action: 'register', userId: state.userId, name: v }).then(r => r.ok && setProfile(r.profile)).catch(() => {});
        renderBadges(); done(true);
      };
      if (dlg.showModal) dlg.showModal(); else { const v = prompt('Your nickname'); if (v) { state.name = v; store.set('name', v); } resolve(!!v); }
      setTimeout(() => input.focus(), 50);
    });
  }

  /* ---------- Toast & confetti ---------- */
  let toastT;
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
  }
  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('#confetti'), colors = ['#1D5CC8', '#FFB800', '#22A046', '#FF7814', '#EC2882'];
    for (let i = 0; i < 70; i++) {
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
  let deferredPrompt = null;
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    $('#installLink').hidden = false;
    if (bannerWanted) showInstallBanner();
  });
  window.addEventListener('appinstalled', () => { hideInstallBanner(); store.set('installDismissed', true); $('#installLink').hidden = true; toast('SMILE installed! 🎉'); });

  let bannerWanted = false;
  function maybeShowInstallBanner() {
    if (isStandalone() || store.get('installDismissed', false)) return;
    bannerWanted = true;
    showInstallBanner();
  }
  function showInstallBanner() {
    const b = $('#installBanner'), btn = $('#installBtn'), msg = $('#installMsg');
    if (isIOS) {
      msg.innerHTML = 'Tap <svg class="ios-share" viewBox="0 0 24 24" fill="none" stroke="#1D7FE0" stroke-width="2"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8"/></svg> <b>Share</b>, then <b>Add to Home Screen</b>.';
      btn.textContent = 'Got it';
    } else if (deferredPrompt) {
      msg.textContent = 'Add SMILE to your home screen for faster, offline-ready exploring.';
      btn.textContent = 'Install';
    } else {
      msg.textContent = 'Use your browser menu (⋮) and choose "Install app" or "Add to Home screen".';
      btn.textContent = 'OK';
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
    const tab = e.target.closest('[data-cat]');
    if (tab) { location.hash = '#explore/' + tab.dataset.cat; return; }
    const pl = e.target.closest('[data-place]');
    if (pl) { openPlace(pl.dataset.place); return; }
    if (e.target.closest('#checkinBtn')) { const b = e.target.closest('#checkinBtn'); checkIn(b.dataset.id, b); return; }
    if (e.target.closest('#editName')) { askName(); return; }
    if (e.target.closest('#pointsPill')) { location.hash = '#badges'; return; }
  });
  $('#sheetClose').addEventListener('click', closeSheet);
  $('#sheetBackdrop').addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#placeSheet').hidden) closeSheet(); });
  $('#searchInput').addEventListener('input', e => { state.query = e.target.value; renderExplore(); });
  $('#installBtn').addEventListener('click', doInstall);
  $('#installClose').addEventListener('click', () => hideInstallBanner());
  $('#installLink').addEventListener('click', () => { if (deferredPrompt) doInstall(); else showInstallBanner(); });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', () => { loadPlaces().then(() => { renderCategories(); route(); }); loadProfile(); });

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW failed', err)));
  }

  /* ---------- Boot ---------- */
  runSplash();
  renderCategories();
  setProfile(state.profile || localProfile());
  route();
  Promise.all([loadPlaces(), loadProfile()]).then(() => { renderCategories(); if (location.hash.startsWith('#explore')) renderExplore(); });
})();
