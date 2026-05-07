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
