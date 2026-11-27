// Cloudflare Pages Function — returns a YouTube playlist's latest videos as JSON.
//
// Source: the YouTube Data API (playlistItems) when the YOUTUBE_API_KEY
// variable is set in Cloudflare Pages, otherwise the public videos.xml RSS
// feed. Since late 2026 YouTube answers the RSS feed with 403 when it is
// fetched from Cloudflare, so in practice the API key is required.
//
// Replaces the unreliable third-party rss2json.com dependency that the site
// used to fetch episodes from the browser. YouTube's videos.xml feed has no
// CORS headers, so the browser cannot fetch it directly; this function runs
// server-side (no CORS) and returns the data the front-end already expects.
//
// Route:    GET /api/episodes?playlist=PLxxxxxxxx
// Response: { "status": "ok", "items": [ { title, link, pubDate }, ... ] }
//           link is https://www.youtube.com/watch?v=VIDEO_ID
//
// The shape matches what rss2json returned, so the page scripts only had to
// swap the request URL.

const DEFAULT_PLAYLIST = 'PLt2q5BNHsCB4CUvbBRu5D5ythhycwFcvO';

// The last good result per playlist is kept in the edge cache for a week, so
// when YouTube is briefly unavailable visitors still get episodes.
const STALE_TTL = 7 * 24 * 3600;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const playlist = url.searchParams.get('playlist') || DEFAULT_PLAYLIST;

  // Restrict to YouTube-style IDs so this can't be used as an open proxy.
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(playlist)) {
    return json({ status: 'error', items: [] }, 400, 'no-store');
  }

  const cache = caches.default;
  const staleKey = new Request('https://solardey-cache.internal/episodes/' + playlist);

  const tried = [];
  const key = context.env && context.env.YOUTUBE_API_KEY;
  const items = (key && await fetchApi(playlist, key, tried))
    || await fetchFeed(playlist, tried);

  if (items) {
    const fresh = json({ status: 'ok', items });
    const copy = json({ status: 'ok', items, stale: true }, 200,
      'public, max-age=' + STALE_TTL);
    context.waitUntil(cache.put(staleKey, copy));
    return fresh;
  }

  // Upstream failed: serve the last good copy if there is one.
  const stale = await cache.match(staleKey);
  if (stale) {
    const data = await stale.json();
    return json(data, 200, 'public, max-age=300');
  }

  // 503, not 502: Cloudflare replaces a Function's 502 body with its own
  // "error code: 502" page. no-store so browsers don't keep the failure.
  return json({ status: 'error', items: [], upstream: tried }, 503, 'no-store');
}

// YouTube Data API v3. Costs 1 quota unit per call (10,000/day free); the
// 15-minute edge cache keeps usage far below that. The Referer header lets a
// key restricted to "HTTP referrers: solardey.com/*" work from the server.
async function fetchApi(playlist, key, tried) {
  const api = 'https://www.googleapis.com/youtube/v3/playlistItems'
    + '?part=snippet,contentDetails&maxResults=15&playlistId=' + playlist
    + '&key=' + encodeURIComponent(key);
  try {
    const res = await fetch(api, {
      headers: { 'Referer': 'https://solardey.com/' },
      cf: { cacheTtlByStatus: { '200-299': 900, '300-599': 0 } },
    });
    if (!res.ok) {
      let reason = '';
      try { reason = (await res.json()).error.errors[0].reason; } catch (_) {}
      tried.push('api-' + res.status + (reason ? '-' + reason : ''));
      return null;
    }
    const data = await res.json();
    const items = (data.items || [])
      .filter(it => it.snippet && it.snippet.resourceId
        && it.snippet.title !== 'Private video' && it.snippet.title !== 'Deleted video')
      .map(it => ({
        title: it.snippet.title,
        link: 'https://www.youtube.com/watch?v=' + it.snippet.resourceId.videoId,
        pubDate: (it.contentDetails && it.contentDetails.videoPublishedAt) || it.snippet.publishedAt,
      }))
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    if (items.length) return items;
    tried.push('api-empty');
  } catch (e) {
    tried.push('api-fetch-error');
  }
  return null;
}

// YouTube's videos.xml feed. The browser-like User-Agent matters: YouTube
// answers some bot-looking requests from datacenter IPs with 404/5xx.
async function fetchFeed(playlist, tried) {
  const feedUrl = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + playlist;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
          'Accept': 'application/atom+xml, application/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        // Cache good feeds for 15 minutes; never cache upstream errors.
        cf: { cacheTtlByStatus: { '200-299': 900, '300-599': 0 } },
      });
      tried.push(res.status);
      if (!res.ok) continue;
      const items = parseFeed(await res.text());
      if (items.length) return items;
      tried.push('empty');
    } catch (e) {
      tried.push('fetch-error');
    }
  }
  return null;
}

function parseFeed(xml) {
  const items = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml)) !== null) {
    const entry = m[1];
    const vid = (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
    if (!vid) continue;
    const title = decodeXml((entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const pub = (entry.match(/<published>([^<]+)<\/published>/) || [])[1] || '';
    items.push({
      title,
      link: 'https://www.youtube.com/watch?v=' + vid,
      pubDate: pub,
    });
  }
  return items;
}

// Decode the handful of XML entities YouTube uses in titles.
// &amp; is decoded last so we never double-decode.
function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function json(obj, status = 200, cacheControl = 'public, max-age=900, s-maxage=900') {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
    },
  });
}
