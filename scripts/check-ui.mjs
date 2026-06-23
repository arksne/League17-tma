import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push({type: 'console', text: msg.text()}); });
page.on('pageerror', err => errors.push({type: 'page', text: err.message}));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

const title = await page.title();
const text = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || 'NO BODY');
const html = await page.evaluate(() => {
  const info = {
    bodyChildren: document.body?.children.length || 0,
    imgs: document.querySelectorAll('img').length,
    bgImages: 0,
    divs: document.querySelectorAll('div').length,
    buttons: document.querySelectorAll('button').length,
    scripts: document.querySelectorAll('script').length,
  };
  document.querySelectorAll('[style*="background"]').forEach(el => {
    if (el.style.backgroundImage && el.style.backgroundImage !== 'none') info.bgImages++;
  });
  return info;
});

const networkErrors = errors.filter(e => e.type === 'console' && (e.text.includes('404') || e.text.includes('Failed') || e.text.includes('Error') || e.text.includes('ERR')));
const otherErrors = errors.filter(e => e.type === 'page');

console.log('=== UI CHECK ===');
console.log('Title:', title);
console.log('DOM:', JSON.stringify(html));
console.log('');
console.log('=== BODY TEXT ===');
console.log(text);
console.log('');
console.log('=== NETWORK/FETCH ERRORS ===');
networkErrors.forEach(e => console.log('  -', e.text));
console.log('');
console.log('=== PAGE ERRORS ===');
otherErrors.forEach(e => console.log('  -', e.text));

await browser.close();
