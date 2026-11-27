/* =====================================================
   SOLARDEY — Main JavaScript
   Nav, YouTube via proxy, Decap CMS helpers
   ===================================================== */

// ── NAV BURGER TOGGLE ──
(function () {
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  if (!burger || !links) return;

  burger.addEventListener('click', () => {
    links.classList.toggle('open');
    burger.setAttribute('aria-expanded', links.classList.contains('open'));
    document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

// ── YOUTUBE PROXY ──
// All YouTube API calls go through /youtube-proxy (Cloudflare Worker)
// The API key lives server-side and never appears in frontend code

const PROXY_URL = '/youtube-proxy';

async function fetchFromProxy(playlistId, maxResults = 6) {
  const url = `${PROXY_URL}?playlistId=${playlistId}&maxResults=${maxResults}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  return res.json();
}

async function loadYouTubeVideos(containerId, playlistId, maxResults = 6) {
  const container = document.getElementById(containerId);
  if (!container || !playlistId) return;

  try {
    const data = await fetchFromProxy(playlistId, maxResults);

    if (!data.items || data.items.length === 0) {
      console.log('Playlist empty — placeholders remain');
      return;
    }

    container.innerHTML = '';

    data.items.forEach(item => {
      const s       = item.snippet;
      const videoId = s.resourceId?.videoId;
      if (!videoId) return;

      const title     = s.title;
      const thumb     = s.thumbnails?.high?.url || s.thumbnails?.medium?.url || s.thumbnails?.default?.url || '';
      const published = new Date(s.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const desc      = s.description ? s.description.substring(0, 120) + '…' : '';

      const card = document.createElement('div');
      card.className = 'yt-card carousel-item';
      card.innerHTML = `
        <a href="https://youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">
          <div class="yt-thumb" style="background-image:url('${thumb}');background-color:var(--green-700);">
            <div class="yt-play"><span class="sym yt-play-icon"></span></div>
          </div>
          <div class="yt-body">
            <div class="yt-meta">${published}</div>
            <h3>${title}</h3>
            ${desc ? `<p>${desc}</p>` : ''}
          </div>
        </a>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.log('YouTube unavailable — placeholders shown');
  }
}

async function loadLatestEpisode(containerId, playlistId) {
  const container = document.getElementById(containerId);
  if (!container || !playlistId) return;

  try {
    const data = await fetchFromProxy(playlistId, 1);

    if (!data.items || !data.items[0]) return;

    const s       = data.items[0].snippet;
    const videoId = s.resourceId?.videoId;
    const title   = s.title;
    const date    = new Date(s.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const titleEl = container.querySelector('.ep-title');
    const dateEl  = container.querySelector('.ep-date');
    const linkEl  = container.querySelector('.ep-link');

    if (titleEl) titleEl.textContent = title;
    if (dateEl)  dateEl.textContent  = date;
    if (linkEl && videoId) linkEl.href = `https://youtube.com/watch?v=${videoId}`;

  } catch (err) {
    console.log('Latest episode unavailable');
  }
}

// ── FIELD REPORTS (YouTube Shorts) ──
// Weekly field reports are published as YouTube Shorts (and Instagram Reels).
// Every Shorts upload on the channel shows up here automatically: the channel's
// auto-generated Shorts playlist ("UUSH" + channel ID without "UC") is read
// through the same /api/episodes Pages Function the podcast card uses.
// Markup: <div class="s-field-grid" data-field-reports data-count="4">…</div>
// The grid starts with placeholder cards; if the feed can't be read, the grid is
// removed and only the YouTube / Instagram links remain.
(function () {
  const SHORTS_PLAYLIST = 'UUSHYveJNvrEWk6CMoP-FHArXQ';
  const grids = document.querySelectorAll('[data-field-reports]');
  if (!grids.length) return;

  const lang   = document.documentElement.lang === 'sv' ? 'sv-SE' : 'en-GB';
  const label  = lang === 'sv-SE' ? 'Se på YouTube' : 'Watch on YouTube';

  // Titles carry hashtags for reach (#solardey #nigeria …); drop them for display.
  const cleanTitle = t => t.replace(/#[\p{L}\p{N}_]+/gu, '')
                           .replace(/\s{2,}/g, ' ')
                           .replace(/[\s\-–—|:]+$/, '')
                           .trim();

  let feed; // one request shared by every grid on the page
  const getFeed = () => feed || (feed = fetch('/api/episodes?playlist=' + SHORTS_PLAYLIST)
    .then(r => r.json())
    .then(d => (d.status === 'ok' && d.items) ? d.items : []));

  function render(grid) {
    const count = parseInt(grid.dataset.count, 10) || 4;
    getFeed().then(items => {
      if (!items.length) { grid.remove(); return; }
      grid.textContent = '';
      items.slice(0, count).forEach(item => {
        const vid = new URL(item.link).searchParams.get('v');
        if (!vid) return;
        const title = cleanTitle(item.title) || item.title;

        const a = document.createElement('a');
        a.className = 's-field-card';
        a.href = 'https://www.youtube.com/shorts/' + vid;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', title + ' — ' + label);

        const thumb = document.createElement('div');
        thumb.className = 's-field-thumb';
        const img = document.createElement('img');
        img.src = 'https://i.ytimg.com/vi/' + vid + '/oardefault.jpg'; // 9:16 Shorts frame
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 720; img.height = 1280;
        img.onerror = () => { img.onerror = null; img.src = 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg'; };
        thumb.appendChild(img);
        const play = document.createElement('span');
        play.className = 's-field-play';
        play.setAttribute('aria-hidden', 'true');
        thumb.appendChild(play);

        const date = document.createElement('span');
        date.className = 's-field-date';
        date.textContent = new Date(item.pubDate).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });

        const h = document.createElement('h3');
        h.className = 's-field-title';
        h.textContent = title;

        a.append(thumb, date, h);
        grid.appendChild(a);
      });
    }).catch(() => grid.remove());
  }

  // Thumbnails are heavy (~150 KB each), so wait until the section is near view.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { obs.unobserve(e.target); render(e.target); } });
    }, { rootMargin: '400px 0px' });
    grids.forEach(g => io.observe(g));
  } else {
    grids.forEach(render);
  }
})();
