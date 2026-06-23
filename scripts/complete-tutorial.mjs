import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

// Set tutorial as complete in localStorage
await page.evaluate(() => {
  localStorage.setItem('league17_tutorial', 'complete');
  console.log('localStorage tutorial key set to:', localStorage.getItem('league17_tutorial'));
});

// Reload so the init code picks up the tutorial flag
await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(5000);

const state = await page.evaluate(() => {
  const r = {};
  const t = document.getElementById('tutorial-overlay');
  r.tutorialDisplay = t ? window.getComputedStyle(t).display : 'NOT FOUND';
  const s = document.getElementById('starter-modal');
  r.starterDisplay = s ? window.getComputedStyle(s).display : 'NOT FOUND';
  r.locName = document.getElementById('loc-name')?.innerText || '?';
  r.locDesc = document.getElementById('loc-desc')?.innerText?.substring(0, 100) || '?';
  r.navButtons = document.getElementById('nav-buttons')?.children?.length || 0;
  r.actionButtons = document.getElementById('loc-actions')?.children?.length || 0;
  const li = document.getElementById('loc-image');
  r.locImageBg = li ? (li.style.backgroundImage || 'none') : 'NOT FOUND';
  r.locImageBgComputed = li ? window.getComputedStyle(li).backgroundImage : 'NOT FOUND';
  r.locImageDisplay = li ? window.getComputedStyle(li).display : 'NOT FOUND';
  // Check loc-image style attr
  r.locImageStyle = li ? li.getAttribute('style') : 'NOT FOUND';
  // Check for any background-image property on loc-image
  if (li) {
    r.locImageStyles = {};
    for (let i = 0; i < li.style.length; i++) {
      const prop = li.style[i];
      r.locImageStyles[prop] = li.style.getPropertyValue(prop);
    }
  }
  return r;
});

console.log('\n=== AFTER TUTORIAL MARKED COMPLETE ===');
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: 'test-output/after-tutorial-fix.png', fullPage: true });
console.log('\nScreenshot saved');

await browser.close();
