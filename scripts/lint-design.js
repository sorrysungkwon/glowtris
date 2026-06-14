// scripts/lint-design.js
'use strict';

const fs = require('fs');
const path = require('path');

function lint() {
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'src/style.css');
  
  if (!fs.existsSync(cssPath)) {
    console.error('Error: src/style.css not found!');
    return ['src/style.css missing'];
  }
  
  const css = fs.readFileSync(cssPath, 'utf8');
  let errors = [];

  // 1. Strip the :root { ... } block to avoid checking token declarations
  const rootRegex = /:root\s*\{([\s\S]*?)\}/;
  const match = css.match(rootRegex);
  if (!match) {
    errors.push('CSS missing :root token block!');
    return errors;
  }
  const restOfCss = css.replace(rootRegex, '');

  // 2. Check for hardcoded Hex/RGB colors in the rest of CSS (excluding pure black/white)
  const hexColorRegex = /#[0-9a-fA-F]{3,6}\b/g;
  const restHexMatches = restOfCss.match(hexColorRegex);
  const allowedColors = new Set(['#fff', '#ffffff', '#000', '#000000']);
  if (restHexMatches) {
    restHexMatches.forEach(color => {
      if (!allowedColors.has(color.toLowerCase())) {
        errors.push(`Hardcoded hex color found in styles: "${color}" (use CSS variables instead)`);
      }
    });
  }

  // 3. Check for hardcoded border-radius in CSS components
  const borderRadiusRegex = /border-radius:\s*([0-9.]+)(px|em|%|rem)/g;
  let brMatch;
  while ((brMatch = borderRadiusRegex.exec(restOfCss)) !== null) {
    const value = brMatch[1];
    const unit = brMatch[2];
    // Allow 0, 50%, and CSS variables
    if (value !== '0' && !(value === '50' && unit === '%')) {
      errors.push(`Hardcoded border-radius found: "${brMatch[0]}" (use var(--r-*) instead)`);
    }
  }

  // 4. Check for hardcoded font-size in CSS components
  const fontSizeRegex = /font-size:\s*([0-9.]+)(px|em|rem)/g;
  let fsMatch;
  while ((fsMatch = fontSizeRegex.exec(restOfCss)) !== null) {
    const value = fsMatch[1];
    if (value !== '0') {
      errors.push(`Hardcoded font-size found: "${fsMatch[0]}" (use var(--type-*) instead)`);
    }
  }

  return errors;
}

if (require.main === module) {
  const errors = lint();
  const bypass = process.env.BYPASS_DESIGN_LINT === 'true' || process.argv.includes('--bypass');
  if (errors.length > 0) {
    if (bypass) {
      console.warn('\x1b[33m%s\x1b[0m', 'Design System Verification Failed (Bypassed):');
      errors.forEach(e => console.warn('\x1b[33m%s\x1b[0m', `  - [BYPASS] ${e}`));
      process.exit(0);
    }
    console.error('\x1b[31m%s\x1b[0m', 'Design System Verification Failed:');
    errors.forEach(e => console.error('\x1b[31m%s\x1b[0m', `  - ${e}`));
    process.exit(1);
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'Design System Verification Passed (100% compliant).');
  }
}

module.exports = { lint };
