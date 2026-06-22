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
      minify:      true,
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

  const baseHtml = template
    .replace('<!--BUILD_CSS-->', () => `<style>\n${css.trimEnd()}\n</style>`)
    .replace('<!--BUILD_JS-->',  () => `<script>\n${js.trimEnd()}\n</script>`);

  const pages = [
    {
      file: 'index.html',
      title: 'Glowtris — Free Neon Block Puzzle Game Online',
      desc: 'Free neon block-stacking puzzle game. Daily challenges, global leaderboard, sprint & blitz modes. No download, no ads. Play in any browser.',
      ogTitle: 'Glowtris — Free Neon Block Puzzle Game',
      ogDesc: 'Daily challenges, global leaderboard, sprint & blitz modes. Free, no ads, no download.',
    },
    {
      file: 'sprint.html',
      title: 'Tetris Sprint Online — Clear 40 Lines Fast — Glowtris',
      desc: 'Race to clear 40 lines as fast as possible. Free online sprint mode block puzzle game — no download, no ads.',
      ogTitle: 'Tetris Sprint Online — Glowtris',
      ogDesc: 'Clear 40 lines as fast as possible. Free sprint mode block puzzle, no download.',
    },
    {
      file: 'unblocked.html',
      title: 'Tetris Unblocked — Free Online Block Game — Glowtris',
      desc: 'Play Glowtris unblocked at school or work. Free neon block puzzle game, no download, no ads, works anywhere.',
      ogTitle: 'Tetris Unblocked — Glowtris',
      ogDesc: 'Free neon block puzzle game, unblocked. No download, no ads, works anywhere.',
    },
    {
      file: 'tetris-online.html',
      title: 'Play Tetris Online Free — No Download — Glowtris',
      desc: 'Play Tetris-style block puzzle game online for free. Daily challenges, global leaderboard, sprint mode. No ads, no download, works in any browser.',
      ogTitle: 'Play Tetris Online Free — Glowtris',
      ogDesc: 'Free Tetris-style game online. Daily challenges, global leaderboard. No download, no ads.',
    },
  ];

  for (const p of pages) {
    const canonical = `https://glowtris.com/${p.file === 'index.html' ? '' : p.file}`;
    const pageHtml = baseHtml
      .replace('<title>GLOWTRIS</title>', `<title>${p.title}</title>`)
      .replace('content="A free neon block-stacking game in your browser. No downloads, no ads. Just pure stacking action."', `content="${p.desc}"`)
      .replaceAll('content="BUILD_OG_TITLE"', `content="${p.ogTitle}"`)
      .replaceAll('content="BUILD_OG_DESC"', `content="${p.ogDesc}"`)
      .replace('<link rel="canonical" href="https://glowtris.com">', `<link rel="canonical" href="${canonical}">`);

    fs.writeFileSync(path.join(root, p.file), pageHtml);
    console.log(`Built ${p.file.padEnd(20)} ${(pageHtml.length / 1024).toFixed(1)} KB`);
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
