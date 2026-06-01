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
- Optimized hero: `hero.mp4` (1.7MB, max 1280px, no audio) + `hero-poster.webp` poster frame

---

## CSS architecture

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

**Sitemap:** lists 5 URLs (/, /about, /podcast, /solar-stories, /network). Blog excluded until ready.

**robots.txt:** disallows /intake, /coming-soon, /admin. Sitemap referenced.

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
- [ ] Apple Podcasts link is `#` on several pages — fill in when URL is available
- [ ] Blog hidden from nav (`<a href="/blog.html">Blog</a>` removed from nav-links) — re-enable when blog has content
- [ ] `hero-source.mp4` (158MB master) should be moved out of project folder
- [ ] When podcast has 5+ episodes, consider switching from hardcoded descriptions to a Cloudflare Worker YouTube Data API proxy

---

## Common task recipes

### Adding a new podcast episode
1. Find video ID in YouTube URL (`?v=XXXX`)
2. In `podcast.html`, add to `EPISODE_DESCRIPTIONS` object: `'videoID': 'short summary text'`
3. That's it — RSS feed pulls the rest (title, date, thumbnail)

### Launching Solar Stories episodes
1. Remove `display:none` from the hidden episode-cards section on solar-stories.html
2. Replace Coming Soon section with active cards (use existing structure with real YouTube IDs)
3. Update sitemap `lastmod` dates

### Changing brand text (Nordic-Africa positioning)
- `Nordic–Africa corridor` is the brand/vision phrase — universal
- `starts in Nigeria, expand to other African markets in stages` is the operational framing — use ONLY in Work With Us / services context
- Keep "Nigeria" in personal/statistical references (Prosper's roots, 85M stat, Abuja)
