#!/usr/bin/env node
/**
 * Solardey Blog Builder
 * Reads markdown files from _posts/ and generates:
 * - Individual blog post HTML pages in /blog/
 * - Updates blog.html with latest posts
 * - Generates blog/index.json for dynamic loading
 *
 * Run: node build.js
 * Cloudflare Pages build command: node build.js
 */

const fs   = require('fs');
const path = require('path');

// ── Simple markdown parser (no dependencies) ──
function parseMarkdown(md) {
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let frontmatter = {};
  let body = md;

  if (fmMatch) {
    body = fmMatch[2];
    fmMatch[1].split('\n').forEach(line => {
      const [key, ...val] = line.split(':');
      if (key && val.length) {
        let value = val.join(':').trim().replace(/^["']|["']$/g, '');
        if (value.startsWith('[')) {
          value = value.slice(1,-1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        }
        frontmatter[key.trim()] = value;
      }
    });
  }

  let html = body
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="post-image">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^---$/gm, '<hr>')
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.match(/^<(h[1-6]|ul|ol|blockquote|hr)/)) return block;
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  return { frontmatter, html };
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch(e) { return dateStr; }
}

function readingTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function build() {
  const postsDir = '_posts';
  const outDir   = 'blog';

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
    console.log('Created _posts/ directory');
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} post(s) in _posts/`);

  const posts = [];

  files.forEach(file => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const { frontmatter, html } = parseMarkdown(raw);

    const slug    = frontmatter.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
    const title   = frontmatter.title   || 'Untitled';
    const date    = frontmatter.date    || new Date().toISOString();
    const tags    = Array.isArray(frontmatter.tags)
      ? frontmatter.tags
      : (frontmatter.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const excerpt = frontmatter.excerpt || '';
    const mins    = readingTime(html);

    posts.push({ slug, title, date, tags, excerpt, mins });

    const postHTML = generatePostPage({ slug, title, date, tags, excerpt, mins, html });
    fs.writeFileSync(path.join(outDir, `${slug}.html`), postHTML);
    console.log(`  ✓ blog/${slug}.html`);
  });

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(posts, null, 2));
  console.log('  ✓ blog/index.json');

  updateBlogPage(posts);
  console.log('  ✓ blog.html updated');

  updateHomeBlogPreview(posts.slice(0, 3));
  console.log('  ✓ index.html blog preview updated');

  console.log(`\nBuild complete — ${posts.length} post(s) processed`);
}

function generatePostPage({ slug, title, date, tags, excerpt, mins, html }) {
  const formattedDate = formatDate(date);
  const tagHTML = (Array.isArray(tags) ? tags : [tags])
    .filter(Boolean)
    .map(t => `<span class="blog-post-tag">#${t}</span>`)
    .join('');

  let nav = '', footer = '';
  try {
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const navMatch    = indexHTML.match(/<header class="site-nav"[\s\S]*?<\/header>/);
    const footerMatch = indexHTML.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    if (navMatch)    nav    = navMatch[0];
    if (footerMatch) footer = footerMatch[0];
  } catch(e) {}

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Solardey</title>
  <meta name="description" content="${excerpt}">
  <meta property="og:title" content="${title} — Solardey">
  <meta property="og:description" content="${excerpt}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://solardey.com/blog/${slug}">
  <meta property="og:image" content="https://solardey.com/assets/images/og-image.png">
  <link rel="canonical" href="https://solardey.com/blog/${slug}">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/pages.css">
  <link rel="stylesheet" href="/css/post.css">
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
${nav}
<article class="post-article">
  <div class="post-hero bg-dark-green">
    <div class="inner">
      <div class="post-tags-row">${tagHTML}</div>
      <h1>${title}</h1>
      <div class="post-meta-row">
        <span>${formattedDate}</span>
        <span>${mins} min read</span>
      </div>
    </div>
  </div>
  <div class="post-body">
    <div class="inner">
      <div class="post-content">${html}</div>
      <a href="/blog.html" class="arrow-link post-back">← Back to all posts</a>
    </div>
  </div>
</article>
${footer}
<script src="/js/main.js"></script>
</body>
</html>`;
}

function updateBlogPage(posts) {
  if (!fs.existsSync('blog.html') || posts.length === 0) return;
  let blogHTML = fs.readFileSync('blog.html', 'utf8');

  const postsHTML = posts.map(p => {
    const tags = (Array.isArray(p.tags) ? p.tags : [p.tags])
      .filter(Boolean).map(t => `<span class="blog-post-tag">#${t}</span>`).join('');
    return `
      <article class="blog-post-card" data-tags="${Array.isArray(p.tags) ? p.tags.join(' ') : ''}">
        <div class="blog-post-tags">${tags}</div>
        <h2><a href="/blog/${p.slug}.html">${p.title}</a></h2>
        <p>${p.excerpt}</p>
        <div class="blog-post-meta"><span>${p.mins} min read</span><span>${formatDate(p.date)}</span></div>
      </article>`;
  }).join('\n');

  if (blogHTML.includes('<!-- POSTS START -->')) {
    blogHTML = blogHTML.replace(
      /<!-- POSTS START -->[\s\S]*?<!-- POSTS END -->/,
      `<!-- POSTS START -->\n${postsHTML}\n      <!-- POSTS END -->`
    );
  } else {
    blogHTML = blogHTML.replace(
      /<div class="blog-list">/,
      `<div class="blog-list">\n<!-- POSTS START -->`
    );
  }
  fs.writeFileSync('blog.html', blogHTML);
}

function updateHomeBlogPreview(posts) {
  if (!fs.existsSync('index.html') || posts.length === 0) return;
  let indexHTML = fs.readFileSync('index.html', 'utf8');

  const previewHTML = posts.map(p => {
    const tags = (Array.isArray(p.tags) ? p.tags : [p.tags])
      .filter(Boolean).map(t => `<span class="s-blog-tag">#${t}</span>`).join('');
    return `
      <article class="s-blog-card">
        <div class="s-blog-tags">${tags}</div>
        <h3><a href="/blog/${p.slug}.html">${p.title}</a></h3>
        <p>${p.excerpt}</p>
        <div class="s-blog-meta">${p.mins} min read · ${formatDate(p.date)}</div>
      </article>`;
  }).join('\n');

  if (indexHTML.includes('<!-- BLOG PREVIEW START -->')) {
    indexHTML = indexHTML.replace(
      /<!-- BLOG PREVIEW START -->[\s\S]*?<!-- BLOG PREVIEW END -->/,
      `<!-- BLOG PREVIEW START -->\n${previewHTML}\n    <!-- BLOG PREVIEW END -->`
    );
    fs.writeFileSync('index.html', indexHTML);
  }
}

build();
