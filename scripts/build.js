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
      title: 'GLOWTRIS',
      desc: 'A free neon block-stacking game in your browser. No downloads, no ads. Just pure stacking action.',
    },
    {
      file: 'sprint.html',
      title: 'Play Tetris Sprint Online — 40 Lines Fast — GLOWTRIS',
      desc: 'Test your speed in 40-line sprint mode. Free online block puzzle game with no ads and instant browser play.',
    },
    {
      file: 'unblocked.html',
      title: 'Tetris Unblocked — Play Free Online — GLOWTRIS',
      desc: 'Play Glowtris unblocked at school or work. No downloads, 100% free neon puzzle game.',
    },
    {
      file: 'tetris-online.html',
      title: 'Free Tetris Online — Neon Puzzle Game — GLOWTRIS',
      desc: 'The best free online Tetris alternative. Beautiful neon graphics, smooth controls, and no ads.',
    }
  ];

  for (const p of pages) {
    const pageHtml = baseHtml
      .replace('<title>GLOWTRIS</title>', `<title>${p.title}</title>`)
      .replace('<meta name="description" content="A free neon block-stacking game in your browser. No downloads, no ads. Just pure stacking action.">', `<meta name="description" content="${p.desc}">`)
      .replace('<link rel="canonical" href="https://glowtris.com">', `<link rel="canonical" href="https://glowtris.com/${p.file === 'index.html' ? '' : p.file}">`);
    
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
