(() => {
  const EMOJI = {
    arcade:'🕹️', puzzle:'🧩', shooter:'🎯', racing:'🏎️', casual:'🎈',
    platformer:'🏃', sports:'⚽', board:'♟️', '3d':'🌐', 'word-quiz':'📝'
  };

  let GAMES = [];
  let bannerTimer = null;
  let bannerIdx = 0;

  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  function formatHot(n){
    if (n >= 10000) return (n/1000).toFixed(1).replace(/\.0$/,'') + 'K';
    return String(n);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function thumbSrc(g){
    if (g.thumb) return g.thumb;
    return `icons/${encodeURIComponent(g.id)}.svg`;
  }

  function thumbHTML(g, cls=''){
    const src = thumbSrc(g);
    const em = EMOJI[g.category] || '🎮';
    return `<img class="thumb-img ${cls}" src="${escapeHtml(src)}" alt="" width="72" height="72" loading="lazy" decoding="async" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${em}',className:'thumb-fallback'}))">`;
  }

  function cardHTML(g){
    return `<article class="game-card" data-id="${escapeHtml(g.id)}">
      <a class="thumb" href="#/play/${encodeURIComponent(g.id)}" aria-label="Play ${escapeHtml(g.title)}">${thumbHTML(g)}</a>
      <div class="g-info">
        <h4 class="g-title"><a href="#/play/${encodeURIComponent(g.id)}">${escapeHtml(g.title)}</a></h4>
        <div class="g-meta">
          <span class="hot">🔥 ${formatHot(g.hot)}</span>
          <span>📦 ${escapeHtml(g.size)}</span>
          <span>${escapeHtml(g.uiCategory)}</span>
        </div>
      </div>
      <div class="g-actions">
        <a class="btn btn-play btn-sm" href="#/play/${encodeURIComponent(g.id)}">Play</a>
      </div>
    </article>`;
  }

  function renderGrid(el, list){
    el.innerHTML = list.map(cardHTML).join('');
  }

  function featured(){
    const f = GAMES.filter(g => g.featured);
    return f.length ? f.slice(2,6).concat(f.slice(0,2)).slice(0,4) : GAMES.slice(2,6);
  }

  function renderBanner(){
    const items = featured();
    const track = $('#banner-track');
    const dots = $('#banner-dots');
    track.innerHTML = items.map(g => {
      return `<div class="banner-slide">
        <div class="banner-art">${thumbHTML(g, 'banner-thumb')}</div>
        <div class="banner-meta">
          <h2>${escapeHtml(g.title)}</h2>
          <p>${escapeHtml(g.description || g.uiCategory)}</p>
          <a class="btn btn-play btn-sm" href="#/play/${encodeURIComponent(g.id)}">Play Now</a>
        </div>
      </div>`;
    }).join('');
    dots.innerHTML = items.map((_,i) => `<button type="button" data-i="${i}" aria-label="Slide ${i+1}"></button>`).join('');
    bannerIdx = 0;
    updateBanner();
    dots.onclick = (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      bannerIdx = +b.dataset.i;
      updateBanner();
      restartBanner();
    };
    restartBanner();
  }

  function updateBanner(){
    const track = $('#banner-track');
    const n = track.children.length || 1;
    track.style.transform = `translateX(-${bannerIdx * 100}%)`;
    $$('#banner-dots button').forEach((b,i) => b.classList.toggle('on', i===bannerIdx));
  }

  function restartBanner(){
    clearInterval(bannerTimer);
    bannerTimer = setInterval(() => {
      const n = $('#banner-track').children.length || 1;
      bannerIdx = (bannerIdx + 1) % n;
      updateBanner();
    }, 4200);
  }

  function renderHome(){
    const ranked = [...GAMES].sort((a,b)=>b.hot-a.hot); const hot = ranked.slice(6).concat(ranked.slice(0,6)).slice(0,12);
    const latest = [...GAMES].slice().reverse().slice(0,12);
    const more = [...GAMES].sort((a,b)=>a.title.localeCompare(b.title)).slice(0,20);
    renderGrid($('#hot-grid'), hot);
    renderGrid($('#latest-grid'), latest);
    renderGrid($('#more-grid'), more);
  }

  function filterGames({cat, q}={}){
    let list = GAMES.slice();
    if (cat) list = list.filter(g => g.uiCategory === cat);
    if (q) {
      const s = q.trim().toLowerCase();
      list = list.filter(g =>
        g.title.toLowerCase().includes(s) ||
        (g.description||'').toLowerCase().includes(s) ||
        (g.tags||[]).some(t => String(t).toLowerCase().includes(s)) ||
        g.uiCategory.toLowerCase().includes(s) ||
        g.category.toLowerCase().includes(s)
      );
    }
    return list;
  }

  function showViews(which){
    $('#home-view').classList.toggle('hidden', which !== 'home');
    $('#list-view').classList.toggle('hidden', which !== 'list');
    $('#play-view').classList.toggle('hidden', which !== 'play');
  }

  function setNav(active){
    $$('#main-nav .nav-link').forEach(a => {
      const key = a.dataset.nav;
      a.classList.toggle('active', key === active || (active==='home' && key==='home'));
    });
    $$('.qcat').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('active', active !== 'home' && href.includes('/cat/'+active));
    });
  }

  function route(){
    const hash = location.hash || '#/';
    const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const q = ($('#search').value || '').trim();

    if (parts[0] === 'play' && parts[1]) {
      const id = decodeURIComponent(parts[1]);
      const g = GAMES.find(x => x.id === id);
      showViews('play');
      setNav('home');
      if (!g) {
        $('#play-title').textContent = 'Game not found';
        $('#play-desc').textContent = 'This game is not in the catalog.';
        $('#play-frame').src = 'about:blank';
        return;
      }
      $('#play-title').textContent = g.title;
      $('#play-title-mini').textContent = g.title;
      $('#play-desc').textContent = g.description || '';
      $('#play-meta').innerHTML = `<span class="hot">🔥 ${formatHot(g.hot)}</span><span>📦 ${escapeHtml(g.size)}</span><span>${escapeHtml(g.uiCategory)}</span>`;
      $('#play-frame').src = g.playUrl;
      const ext = $('#open-ext');
      ext.href = g.playUrl;
      return;
    }

    if (parts[0] === 'cat' && parts[1]) {
      const cat = decodeURIComponent(parts[1]);
      const list = filterGames({cat, q});
      showViews('list');
      setNav(cat);
      $('#list-title').textContent = cat + ' Games';
      $('#list-count').textContent = list.length + ' games';
      renderGrid($('#list-grid'), list);
      $('#list-empty').classList.toggle('hidden', list.length > 0);
      return;
    }

    if (q) {
      const list = filterGames({q});
      showViews('list');
      setNav('home');
      $('#list-title').textContent = 'Search results';
      $('#list-count').textContent = list.length + ' games';
      renderGrid($('#list-grid'), list);
      $('#list-empty').classList.toggle('hidden', list.length > 0);
      return;
    }

    showViews('home');
    setNav('home');
    renderHome();
  }

  $('#back-btn').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  let searchTimer;
  $('#search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if ((location.hash || '').includes('/play/')) location.hash = '#/';
      route();
    }, 180);
  });

  window.addEventListener('hashchange', route);

  fetch('games.json')
    .then(r => r.json())
    .then(data => {
      GAMES = data;
      renderBanner();
      route();
    })
    .catch(err => {
      console.error(err);
      $('#home-view').innerHTML = '<p class="empty">Failed to load games catalog.</p>';
    });
})();
