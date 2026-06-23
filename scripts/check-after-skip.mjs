import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

// Click "Пропустить" to dismiss tutorial
const skipBtn = await page.$('#tutorial-skip');
if (skipBtn) {
  console.log('Found "Пропустить" button, clicking...');
  await skipBtn.click();
  await page.waitForTimeout(1000);
} else {
  console.log('Skip button not found');
}

// Now check the state
const after = await page.evaluate(() => {
  const r = {};

  // Check if tutorial is still visible
  const t = document.getElementById('tutorial-overlay');
  r.tutorialDisplay = t ? window.getComputedStyle(t).display : 'NOT FOUND';

  // Check if starter modal is visible
  const s = document.getElementById('starter-modal');
  r.starterDisplay = s ? window.getComputedStyle(s).display : 'NOT FOUND';

  // Location image
  const li = document.getElementById('loc-image');
  r.locImageBg = li ? window.getComputedStyle(li).backgroundImage : 'NOT FOUND';
  r.locImageEl = li ? (li.style.backgroundImage || '(none set)') : 'NOT FOUND';

  // Current location
  const lname = document.getElementById('loc-name');
  r.locName = lname ? lname.innerText : 'NOT FOUND';
  const ldesc = document.getElementById('loc-desc');
  r.locDesc = ldesc ? ldesc.innerText.substring(0, 100) : 'NOT FOUND';

  // Weather
  const lw = document.getElementById('loc-weather');
  r.weather = lw ? lw.innerText : 'NOT FOUND';

  // Nav buttons - how many?
  const nav = document.getElementById('nav-buttons');
  r.navButtons = nav ? nav.children.length : 'NOT FOUND';

  // Actions
  const actions = document.getElementById('loc-actions');
  r.actionButtons = actions ? actions.children.length : 'NOT FOUND';

  // Check for any error messages in visible text
  const bodyText = document.body.innerText;
  const errorLines = bodyText.split('\n').filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('ошибк') || l.toLowerCase().includes('fail'));
  r.errorMessages = errorLines.slice(0, 5);

  // Check background-image on loc-image div in style attribute
  r.locImageStyleAttr = li ? li.getAttribute('style') : 'NOT FOUND';

  // Check all inline styles that reference background
  const allBg = [];
  document.querySelectorAll('[style*="background"]').forEach(el => {
    const bg = el.style.backgroundImage || el.style.background;
    if (bg && bg !== 'none' && bg !== '') {
      allBg.push({ id: el.id || el.className?.substring(0, 20), bg: bg.substring(0, 100) });
    }
  });
  r.backgroundImages = allBg;

  return r;
});

console.log('=== AFTER SKIP ===');
console.log(JSON.stringify(after, null, 2));

// Take screenshot after
await page.screenshot({ path: 'test-output/game-after-skip.png', fullPage: true });
console.log('\nScreenshot saved');

await browser.close();
