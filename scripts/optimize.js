const fs = require('fs');
const path = require('path');
const https = require('https');

const cssPath = path.join(__dirname, '../src/style.css');
const htmlPath = path.join(__dirname, '../src/template.html');
const buildPath = path.join(__dirname, 'build.js');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' } }, res => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading Orbitron and Material Icons CSS...');
  const orbitronCss = (await fetch('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap')).toString();
  const materialCss = (await fetch('https://fonts.googleapis.com/icon?family=Material+Icons+Round&display=swap')).toString();

  let combinedCss = orbitronCss + '\n' + materialCss;

  // Find all woff2 urls
  const urls = [...combinedCss.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m => m[1]);
  
  for (const url of urls) {
    console.log(`Downloading font: ${url}`);
    const buffer = await fetch(url);
    const base64 = buffer.toString('base64');
    combinedCss = combinedCss.replace(url, `data:font/woff2;base64,${base64}`);
  }

  // Prepend to style.css
  let css = fs.readFileSync(cssPath, 'utf8');
  if (!css.includes('font-family: \'Orbitron\'')) {
    css = `/* INLINED FONTS */\n${combinedCss}\n/* END FONTS */\n` + css;
  }

  // Add touch target fix and a11y improvements
  if (!css.includes('/* Touch target fixes */')) {
    css += `\n/* Touch target fixes */\n`;
    css += `.hud-btn { position: relative; }\n`;
    css += `.hud-btn::after { content: ''; position: absolute; inset: -15px; }\n`;
    css += `input, textarea, select { font-size: 16px; }\n`;
    css += `button, a { touch-action: manipulation; }\n`;
  }
  
  // Fix btn-hold height
  css = css.replace(/#btn-hold { height: 38px; }/g, '#btn-hold { height: 48px; }');
  
  fs.writeFileSync(cssPath, css);
  console.log('Updated style.css with base64 fonts and touch fixes.');

  // Remove font links from template.html
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n/g, '');
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n/g, '');
  html = html.replace(/<link rel="preload" href="https:\/\/fonts\.googleapis\.com[^>]+>\n/g, '');
  html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>\n/g, '');
  fs.writeFileSync(htmlPath, html);
  console.log('Removed external font links from template.html');

  // Enable minify in build.js
  let buildJs = fs.readFileSync(buildPath, 'utf8');
  if (!buildJs.includes('minify:')) {
    buildJs = buildJs.replace(/format:\s*'iife',/, `format:      'iife',\n      minify:      true,`);
    fs.writeFileSync(buildPath, buildJs);
    console.log('Enabled esbuild minification in build.js');
  } else {
    buildJs = buildJs.replace(/minify:\s*false/g, 'minify:      true');
    fs.writeFileSync(buildPath, buildJs);
    console.log('Enabled esbuild minification in build.js (replaced false)');
  }

  console.log('Done!');
}

run().catch(console.error);
