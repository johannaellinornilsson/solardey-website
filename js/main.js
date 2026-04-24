/* =====================================================
   SOLARDEY — Main JavaScript
   Nav, YouTube API, Decap CMS helpers
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

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

// ── YOUTUBE API ──
// Usage: call loadYouTubeVideos(containerId, playlistId, maxResults)
// Requires: window.YOUTUBE_API_KEY set in a <script> tag on the page
//           (injected via Cloudflare Pages environment variable)

async function loadYouTubeVideos(containerId, playlistId, maxResults = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const apiKey = window.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not set — showing placeholder cards');
    return;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return;

    container.innerHTML = '';

    data.items.forEach(item => {
      const s         = item.snippet;
      const videoId   = s.resourceId.videoId;
      const title     = s.title;
      const thumb     = s.thumbnails?.high?.url || s.thumbnails?.medium?.url || '';
      const published = new Date(s.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const desc      = s.description ? s.description.substring(0, 100) + '…' : '';

      const card = document.createElement('div');
      card.className = 'yt-card carousel-item';
      card.innerHTML = `
        <a href="https://youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">
          <div class="yt-thumb" style="background-image:url('${thumb}')">
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
    console.error('YouTube API error:', err);
  }
}

// ── LATEST PODCAST EPISODE (single video from playlist) ──
async function loadLatestEpisode(containerId, playlistId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const apiKey = window.YOUTUBE_API_KEY;
  if (!apiKey) return;

  try {
    const url  = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${apiKey}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.items || !data.items[0]) return;

    const s       = data.items[0].snippet;
    const videoId = s.resourceId.videoId;
    const title   = s.title;
    const thumb   = s.thumbnails?.high?.url || '';
    const date    = new Date(s.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    container.querySelector('.ep-title').textContent = title;
    container.querySelector('.ep-date').textContent  = date;
    if (container.querySelector('.ep-link')) {
      container.querySelector('.ep-link').href = `https://youtube.com/watch?v=${videoId}`;
    }
    if (thumb && container.querySelector('.ep-thumb')) {
      container.querySelector('.ep-thumb').style.backgroundImage = `url('${thumb}')`;
    }
  } catch (err) {
    console.error('Latest episode error:', err);
  }
}
