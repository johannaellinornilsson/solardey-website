// Cloudflare Pages Function — proxies a YouTube playlist RSS feed to JSON.
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

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const playlist = url.searchParams.get('playlist') || DEFAULT_PLAYLIST;

  // Restrict to YouTube-style IDs so this can't be used as an open proxy.
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(playlist)) {
    return json({ status: 'error', items: [] }, 400);
  }

  const feedUrl =
    'https://www.youtube.com/feeds/videos.xml?playlist_id=' + playlist;

  let xml;
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SolardeyBot/1.0)' },
      // Edge-cache the upstream feed for 15 minutes to stay well within limits.
      cf: { cacheTtl: 900, cacheEverything: true },
    });
    if (!res.ok) return json({ status: 'error', items: [] }, 502);
    xml = await res.text();
  } catch (e) {
    return json({ status: 'error', items: [] }, 502);
  }

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

  return json({ status: 'ok', items });
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
