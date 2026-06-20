#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const { lint } = require('./lint-design');

const root = path.resolve(__dirname, '..');

async function build() {
  console.log('Verifying Design System compliance...');
  const designErrors = lint();
  const bypass = process.env.BYPASS_DESIGN_LINT === 'true' || process.argv.includes('--bypass');
  if (designErrors.length > 0) {
    if (bypass) {
      console.warn('\x1b[33m%s\x1b[0m', 'Design System Verification Failed (Bypassed):');
      designErrors.forEach(e => console.warn('\x1b[33m%s\x1b[0m', `  - [BYPASS] ${e}`));
    } else {
      console.error('\x1b[31m%s\x1b[0m', 'Design System Verification Failed:');
      designErrors.forEach(e => console.error('\x1b[31m%s\x1b[0m', `  - ${e}`));
      process.exit(1);
    }
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'Design System compliant.');
  }

  const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
  const css      = fs.readFileSync(path.join(root, 'src/style.css'),     'utf8');

  let js;
  const gameJs = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
  const usesModules = /^import\s/m.test(gameJs);

  if (usesModules) {
    // ES modules mode: esbuild bundles src/game.js (entry) + all imports
    const esbuild = require('esbuild');
    const result = await esbuild.build({
      entryPoints: [path.join(root, 'src/game.js')],
      bundle:      true,
      write:       false,
      format:      'iife',
      platform:    'browser',
      target:      'es2018',
    });
    js = Buffer.from(result.outputFiles[0].contents).toString();
    console.log('Mode: esbuild bundle (ES modules detected)');
  } else {
    // Plain concatenation mode: no imports yet
    js = gameJs;
    console.log('Mode: direct concat (no imports in game.js)');
  }

  const html = template
    .replace('<!--BUILD_CSS-->', `<style>\n${css.trimEnd()}\n</style>`)
    .replace('<!--BUILD_JS-->',  `<script>\n${js.trimEnd()}\n</script>`);

  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log(`Built index.html  ${(html.length / 1024).toFixed(1)} KB`);

  // --- Programmatic SEO Generation ---
  const seoPages = [
    {
      filename: 'sprint.html',
      title: 'Glowtris Sprint Mode — Fast Neon Block Stacking Game',
      desc: 'Play Glowtris Sprint Mode. Clear 40 lines as fast as you can in this neon block stacking game. No download required.',
      url: 'https://glowtris.com/sprint.html'
    },
    {
      filename: 'zen.html',
      title: 'Glowtris Zen Mode — Relaxing Neon Block Game',
      desc: 'Relax with Glowtris Zen Mode. No timer, no pressure, just endless neon block stacking. Free browser game.',
      url: 'https://glowtris.com/zen.html'
    },
    {
      filename: 'unblocked.html',
      title: '학교에서 뚫리는 테트리스 무설치 — 글로우트리스 (Unblocked)',
      desc: '학교나 회사에서 막히지 않고 뚫리는 무설치 네온 블록 퍼즐 게임. 웹 브라우저에서 바로 즐기는 글로우트리스입니다.',
      url: 'https://glowtris.com/unblocked.html'
    },
    {
      filename: 'multiplayer.html',
      title: 'Glowtris Async Multiplayer — Compete in Neon Blocks',
      desc: 'Challenge your friends in Glowtris async multiplayer. Compare scores and speed in this neon block stacking game.',
      url: 'https://glowtris.com/multiplayer.html'
    }
  ];

  seoPages.forEach(page => {
    let pageHtml = html;
    
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/g, `<title>${page.title}</title>`);
    pageHtml = pageHtml.replace(/<meta property="og:title" content=".*?">/g, `<meta property="og:title" content="${page.title}">`);
    pageHtml = pageHtml.replace(/<meta name="twitter:title" content=".*?">/g, `<meta name="twitter:title" content="${page.title}">`);
    
    pageHtml = pageHtml.replace(/<meta name="description" content=".*?">/g, `<meta name="description" content="${page.desc}">`);
    pageHtml = pageHtml.replace(/<meta property="og:description" content=".*?">/g, `<meta property="og:description" content="${page.desc}">`);
    pageHtml = pageHtml.replace(/<meta name="twitter:description" content=".*?">/g, `<meta name="twitter:description" content="${page.desc}">`);
    
    pageHtml = pageHtml.replace(/<meta property="og:url" content=".*?">/g, `<meta property="og:url" content="${page.url}">`);
    pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?">/g, `<link rel="canonical" href="${page.url}">`);
    
    fs.writeFileSync(path.join(root, page.filename), pageHtml);
    console.log(`Built ${page.filename} ${(pageHtml.length / 1024).toFixed(1)} KB`);
  });

  const sitemapPath = path.join(root, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    seoPages.forEach(page => {
      if (!sitemap.includes(`<loc>${page.url}</loc>`)) {
        const urlBlock = `  <url>\n    <loc>${page.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        sitemap = sitemap.replace('</urlset>', `${urlBlock}</urlset>`);
      }
    });
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('Updated sitemap.xml with SEO landing pages');
  }

  // Auto-bump Service Worker cache version
  const swPath = path.join(root, 'sw.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    const hash = require('crypto').randomBytes(3).toString('hex');
    swContent = swContent.replace(/const CACHE\s*=\s*['"]glowtris-[^'"]+['"];/, `const CACHE      = 'glowtris-${hash}';`);
    fs.writeFileSync(swPath, swContent);
    console.log(`Updated sw.js cache version to glowtris-${hash}`);
  }
}

build().catch(e => { console.error(e); process.exit(1); });
