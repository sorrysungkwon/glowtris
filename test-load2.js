const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on("pageerror", err => console.log("PAGE ERROR:", err.stack));
  page.on("pageerror", err => console.log("PAGE ERROR:", err.stack));
  
  await page.goto(`file://${__dirname}/index.html`, { waitUntil: 'networkidle0' });
  
  const hasGameCanvas = await page.evaluate(() => {
    return !!document.getElementById('game-canvas');
  });
  
  console.log('Game Canvas Exists:', hasGameCanvas);
  
  const isLoadingVisible = await page.evaluate(() => {
    const el = document.getElementById('loading');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  
  console.log('Loading Screen Visible:', isLoadingVisible);
  
  await browser.close();
})();
