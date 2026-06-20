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
