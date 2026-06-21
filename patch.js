const fs = require('fs');
const buildJs = fs.readFileSync('scripts/build.js', 'utf8');
const fixed = buildJs.replace(
  /\.replace\('<!--BUILD_CSS-->', `<style>\\n\$\{css\.trimEnd\(\)\}\\n<\/style>`\)/,
  `.replace('<!--BUILD_CSS-->', () => \`<style>\\n\$\{css.trimEnd()\}\\n</style>\`)`
).replace(
  /\.replace\('<!--BUILD_JS-->', `<script>\\n\$\{js\.trimEnd\(\)\}\\n<\/script>`\)/,
  `.replace('<!--BUILD_JS-->', () => \`<script>\\n\$\{js.trimEnd()\}\\n</script>\`)`
);
fs.writeFileSync('scripts/build.js', fixed);
