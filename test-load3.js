const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => console.log('PAGE ERROR:', error.stack || error));
  page.on('console', msg => console.log('PAGE LOG:', msg.text(), msg.location()));
  
  await page.goto(`file://${__dirname}/index.html`, { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
