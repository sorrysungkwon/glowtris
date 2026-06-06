#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

async function build() {
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
      target:           'es2018',
      minifyWhitespace:  true,
      minifyIdentifiers: true,
      minifySyntax:      false, // disabled: esbuild regex optimisation produces invalid ranges in Safari/WebKit
      charset:           'utf8',
      treeShaking:       true,
    });
    js = Buffer.from(result.outputFiles[0].contents).toString();

    // Patch pixi.js isDataUrl regex: character classes with '-' between ranges are
    // invalid in Safari/WebKit (treated as range rather than literal hyphen).
    // Move the hyphen to the end of each class so it is unambiguously literal.
    const before = js.length;
    js = js
      .replace(/\[a-z0-9-\+\.\]/g,                              '[a-z0-9+.-]')
      .replace(/\[a-z0-9-\.!#\$%\*\+\.\{\}\|~`\]/g,            '[a-z0-9.!#$%*+.{}|~`-]')
      .replace(/\[a-z0-9-\.!#\$%\*\+\.\{\}\(\)_\|~`\]/g,       '[a-z0-9.!#$%*+.{}()_|~`-]');
    const patched = before - js.length; // negative = chars added (same length expected)
    console.log(`Patched pixi.js Safari regex (${Math.abs(patched)} chars delta)`);

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
