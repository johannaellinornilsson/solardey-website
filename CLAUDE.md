# Solardey — Project Context for Claude

This is the **Solardey** website — a Nordic–Africa solar dialogue platform. Founded by Nze Prosper Emegoakor in Malmö, Sweden. The site hosts the Solardey Podcast, the Solar Stories YouTube series (coming soon), the Solardey Network, and advisory services.

**Live URL:** `https://solardey.com`
**Hosting:** Cloudflare Pages (static site)
**Build:** `node build.js` (only processes blog markdown — site is otherwise static HTML/CSS/JS)

---

## Folder structure

```
solardey-website/
├── index.html              ← Homepage (was home.html, renamed at launch)
├── podcast.html, solar-stories.html, network.html, about.html
├── blog.html               ← Exists but hidden from nav until ready
├── coming-soon.html        ← Old landing page, kept with noindex
├── intake.html             ← Disallowed in robots.txt
├── admin/                  ← Decap CMS, disallowed
├── css/
│   ├── main.css            ← Global: nav, footer, eyebrow, buttons, vars
│   ├── home.css            ← Homepage + shared podcast/stories card styles
│   ├── pages.css           ← podcast.html, solar-stories.html, network.html
│   ├── about.css           ← about.html (has its own page-hero copies!)
│   └── post.css            ← Individual blog posts
├── js/main.js              ← Nav burger, YouTube proxy helpers (proxy disabled)
├── assets/
│   ├── svg/                ← favicon, logo
│   └── images/             ← Hero images, prosper.webp, episode previews
├── _posts/                 ← Blog markdown (processed by build.js)
└── build.js                ← Blog builder only, doesn't touch index/main pages
```

### Key file conventions
- Hero images: `hero-{page}.webp` (hero-podcast.jpg, hero-solar.jpg, hero-about.webp, hero-network.webp) — heavy PNGs converted to WebP for performance
- Episode previews: `{city}.webp` (malmo.webp, arlov.webp, hagestad.webp) — note `arlov.webp` is used for the **Åkarp** episode
- Source video master: `hero-source.mp4` (158MB, should be moved OUT of project to avoid deploy)
- Homepage hero video (Solkullen/RISE trip, Aug 2026, ~19 s seamless loop, no audio, no burned-in text): `hero.mp4` / `hero.webm` (1920×1080) and `hero-mobile.mp4` / `hero-mobile.webm` (1080×1350, served via `<source media="(max-width: 768px)">`), plus `hero-poster.webp` (first frame, a clear sky, used for both). Raw clips live outside the repo.

---

## CSS architecture

**Cache-busting (important):** every `/css/*.css` and `/js/main.js` reference carries `?v=YYYYMMDD` (all HTML files + the post template in `build.js`). Cloudflare and browsers cache CSS/JS for up to a day plus a week of stale-while-revalidate, so **whenever you change any CSS or JS file, bump the `?v=` value everywhere** (e.g. `grep -rl "?v=20261127" --include=*.html . build.js | xargs sed -i "s/?v=20261127/?v=NEWDATE/g"`). Otherwise new HTML ships with old CSS/JS. The same applies to files under `/assets/` that are **replaced under the same name** (cached 30 days): the hero poster and videos are referenced with `?v=` in `index.html` and `sv/index.html` — bump it when you re-export them, or give the new file a new name.

**Important:** about.html does NOT load pages.css — it has its own copies of `.page-hero` and `.page-hero-photo` styles in about.css. When changing photo-hero text styling, update BOTH `pages.css` AND `about.css`.

**Class prefixes:**
- `.s-*` — homepage section classes (s-hero, s-podcast, s-stories, s-pillars, s-network, s-founder)
- `.page-hero-*` — interior page heroes
- `.pod-*` — podcast page specifics
- `.ep-card-*` and `.ep-list-*` — episode card and list components (shared between home + podcast)
- `.cred-*` — credentials/track-record section on about

---

## Brand basics

### Colors (defined in main.css)
```
--green-800: #16381B (primary dark)
--green-700: #268535
--green-500: #64B837 (accent italic in headings)
--green-200: #DBFF99

--yellow-200: #F4EE49 (signature yellow — eyebrows, accents on dark)
--yellow-500: #C29F13
--yellow-800: #422A00 (dark amber for text on yellow bg)

--cream, --gray-100, --gray-700, --gray-900
```

### Typography
- **Body:** Atkinson Hyperlegible
- **Display (headings, italic accents):** Instrument Serif
- **H2 italic pattern:** `<h2>Statement. <em>Italic accent.</em></h2>` — the `<em>` is always lighter green (green-500) or yellow (yellow-200 on dark bg)

### Brand voice & tone
- Energetic, optimistic, professional but accessible
- Tagline: "Stories that power change."
- Signature phrase: *"Every story begins with the sun."*
- Solardey name etymology: *"dey" = available in Nigerian Pidgin* → solar that's always there

### Visual element
**Skewed parallelogram** is the signature shape: `transform: skewX(-10deg)` with inner content counter-skewed `skewX(10deg)`. Used on buttons, cards, photo frames, badges.

---

## Editorial conventions (CRITICAL)

### Geography framing
- **Brand/vision level:** "Nordic–Africa" (corridor, dialogue, ecosystem)
- **Operational level:** Field verification + on-site support **start in Nigeria, expand to other African nations in stages** — this exact framing appears in About + Home Work With Us sections
- **Keep Nigeria specifically** in: Prosper's "roots in Nigeria", "85 million people in Nigeria" statistic, Abuja references, schema `areaServed`
- **Hero eyebrow on home:** "Nordic × Africa · Solar Dialogue"

### Prosper Emegoakor — bio facts (use these exact details)
- Full title: **Nze Prosper Emegoakor** (Nze is an Igbo honorific)
- Based in Malmö, Sweden, with roots in Nigeria
- **Education:** Solar Installation Engineering at **KYH** (in progress), certified solar installer from **Nercia Academy**, solar energy basics from **New York University**
- **Ventures (in order of recency):**
  - **Solardey** — current
  - **Afro Urban Store** — Founder, Emporia Shopping Centre, Malmö (retail space for Afro diaspora entrepreneurs)
  - **Akụkọ** — Founder, bamboo socks with African-inspired designs (*Akụkọ* = "storytelling" in Igbo)
  - **Kenze** — Co-founder, Swedish construction company (hired foreigners building lives in Sweden)
- **About-page punchline (signature line):** *"see who's missing from the conversation, then build them a seat at the table"* — frames his career arc
- **Signature quote:** *"Energy is dignity. Energy is opportunity. Energy is independence."*

### Solar Stories (Coming Soon state)
Three episodes filmed/planned, all in Sweden:
- EP 01: **Malmö** (`malmo.webp`)
- EP 02: **Åkarp** (`arlov.webp` — file misnamed, intentional)
- EP 03: **Hagestad** (`hagestad.webp`)
On home.html and solar-stories.html they appear as a "filmstrip" with location badges + "Coming soon" italic text.

### Podcast episode descriptions
Hardcoded in `podcast.html` inside the `EPISODE_DESCRIPTIONS` object, keyed by YouTube video ID. **rss2json strips YouTube's `<media:description>`, so RSS-based descriptions don't work** — manual maintenance until a proper Cloudflare Worker proxy is built. Current episodes:
- `eCsMVhDDPTk` — The BIG WHY
- `xdxnpDijuUo` — Solar Gave Me Hope (EP 01)
- `ENrqO1YEliw` — What is Solardey? (mini)

When a new episode launches, add a new key:value pair to `EPISODE_DESCRIPTIONS`.

---

## SEO & GEO setup

All public pages have: canonical, OG tags (with width/height/type/alt), Twitter cards, JSON-LD schema.

**Active schemas:**
- Organization (home, network, solar-stories)
- WebSite (home, with search action)
- PodcastSeries (podcast)
- Blog (blog)
- Person (about — Prosper with `alumniOf`, `founder` array, `homeLocation`, `nationality`)
- FAQPage (about — 8 questions)
- VideoObject (solar-stories)

**OG image:** `/assets/images/og-image.png` (1201×630, ~285KB, PNG). Has width/height/type/alt set in meta tags.

**Sitemap:** lists 7 URLs (/, /about, /podcast, /network, /connect, /blog, + blog posts). Solar Stories excluded while the page is hidden.

**robots.txt:** disallows /intake, /coming-soon, /admin, /solar-stories (hidden). Sitemap referenced.

---

## Swedish page (`/sv/`)

`sv/index.html` is a Swedish version of the homepage, there so the site can rank for Swedish searches. It was created from `index.html` once and is now **maintained by hand**: when you change copy or sections on the homepage, update `sv/index.html` too. It omits the Solar Stories and blog sections, and its podcast date uses `sv-SE`.

- **hreflang:** `index.html` and `sv/index.html` both list `en` → `/`, `sv` → `/sv/`, `x-default` → `/`. `sitemap.xml` repeats this with `xhtml:link`. Only these two pages are a translated pair, so no other page gets hreflang.
- **Language switcher:** `.nav-lang` link at the end of `.nav-links` ("Svenska" on English pages, "English" on `/sv/`). Styled in `main.css`. Blog posts inherit it through the nav that `build.js` copies from `index.html`.
- Inner links on `/sv/` point to the English pages (podcast, about, network) — they are not translated.

---

## Field reports (weekly YouTube Shorts / Instagram Reels)

Prosper publishes weekly "field reports" as YouTube Shorts and Instagram Reels; the podcast itself is monthly. A `.s-field` section shows the 4 latest Shorts on `index.html`, `sv/index.html` (both dark green, after the podcast section) and `podcast.html` (light `.s-field--light` variant, before "Be a guest").

- **Automatic:** `js/main.js` fills every `[data-field-reports]` grid from `/api/episodes?playlist=UUSHYveJNvrEWk6CMoP-FHArXQ` — the channel's auto-generated Shorts playlist ("UUSH" + channel ID without "UC"). So **every** Short on the channel appears, not only field reports; titles are shown without hashtags.
- **Instagram** is a link to `/reels/` only. Auto-fetching Reels needs Meta's Graph API (Business/Creator account + a token renewed every 60 days) — not set up.
- If the feed fails, the grid is removed and only the YouTube/Instagram buttons remain.
- `functions/api/episodes.js` reads the **YouTube Data API** when the Cloudflare Pages variable `YOUTUBE_API_KEY` is set (production + preview). Without it, it falls back to the videos.xml RSS feed, which YouTube answers with 403 from Cloudflare since Nov 2026, so the key is effectively required. The last good result is kept in the edge cache for a week; on total failure the API returns 503 with `upstream` statuses for debugging.
- Testing locally needs the Pages Functions: `npx wrangler pages dev .` (plain `npx serve` returns 404 for `/api/*`).

---

## Social handles (use these exact ones)
- Instagram: `https://www.instagram.com/solardey.podcast/`
- LinkedIn (Prosper): `https://se.linkedin.com/in/arinze-prosper-emegoakor`
- X/Twitter: `https://x.com/NzePEmego`
- YouTube: `https://www.youtube.com/@SolardeyPodcast`
- Spotify: `https://open.spotify.com/show/76hVYPuRJlF3wS2tYg7qUW`
- RSS feed (technical, not linked publicly): `https://anchor.fm/s/10ebebae0/podcast/rss`

---

## Hero design pattern

All hero sections currently have:
- **No overlay** — photo/video shown clean
- **Text shadows** on h1/eyebrow/p for readability (defined in pages.css, about.css, home.css)
- **Tall padding** — pages.css `.page-hero` is `120px 0 132px`, about.css is `124px 0 136px`, home.css `.s-hero` is full viewport height

If a hero text becomes hard to read on a bright image, **don't add a full overlay** — strengthen the text-shadow or add a local scrim behind just the text block.

---

## Known open items (not blocking launch)
- [ ] Solar Stories temporarily hidden — see "Un-hiding Solar Stories" below
- [ ] `hero-source.mp4` (158MB master) should be moved out of project folder
- [ ] When podcast has 5+ episodes, consider switching from hardcoded descriptions to a Cloudflare Worker YouTube Data API proxy

---

## Common task recipes

### Adding a new podcast episode
1. Find video ID in YouTube URL (`?v=XXXX`)
2. In `podcast.html`, add to `EPISODE_DESCRIPTIONS` object: `'videoID': 'short summary text'`
3. That's it — RSS feed pulls the rest (title, date, thumbnail)

### Un-hiding Solar Stories
1. Restore the nav link (`<a href="/solar-stories">Solar Stories</a>`) and the footer "Explore" list item on all pages, plus the explore card on connect.html (set `.cn-explore-grid` back to `repeat(4, 1fr)`)
2. On index.html: remove `style="display:none" aria-hidden="true"` from `section.s-stories`, and point the hero ghost-link back to `/solar-stories` ("Watch Solar Stories")
3. Remove the `noindex` meta from solar-stories.html, drop `Disallow: /solar-stories` from robots.txt, re-add the URL to sitemap.xml, and delete the `/solar-stories` rules from `_redirects`

### Launching Solar Stories episodes
1. Remove `display:none` from the hidden episode-cards section on solar-stories.html
2. Replace Coming Soon section with active cards (use existing structure with real YouTube IDs)
3. Update sitemap `lastmod` dates

### Changing brand text (Nordic-Africa positioning)
- `Nordic–Africa corridor` is the brand/vision phrase — universal
- `starts in Nigeria, expand to other African markets in stages` is the operational framing — use ONLY in Work With Us / services context
- Keep "Nigeria" in personal/statistical references (Prosper's roots, 85M stat, Abuja)
