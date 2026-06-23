import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(6000);

// Mark tutorial complete
await page.evaluate(() => localStorage.setItem('league17_tutorial', 'complete'));
await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  const r = {};
  // @ts-ignore
  const s = window.state || {};

  r.teamSize = (s.myTeam || []).length;
  r.pokemon = s.myTeam?.[0]?.apiData?.name || 'none';
  r.level = s.myTeam?.[0]?.baseLevel || 0;
  r.location = s.currentLocationId;
  r.region = s.currentRegion;
  r.money = s.inventory?.credit || 0;
  r.invItems = Object.keys(s.inventory || {}).filter(k => k !== 'credit').length;

  // Tutorial
  r.tutorialEl = document.getElementById('tutorial-overlay') ? 'exists' : 'absent';
  r.starterDisplay = document.getElementById('starter-modal') ? window.getComputedStyle(document.getElementById('starter-modal')).display : 'absent';

  // Loc image
  const li = document.getElementById('loc-image');
  r.locBgComputed = li ? window.getComputedStyle(li).backgroundImage : '?';
  r.locBgInline = li ? (li.style.backgroundImage || '(empty)') : '?';
  r.locStyleAttr = li ? li.getAttribute('style') : '?';

  // Nav
  r.navCount = document.getElementById('nav-buttons')?.children?.length || 0;
  r.actionsCount = document.getElementById('loc-actions')?.children?.length || 0;

  // Weather
  r.weather = document.getElementById('loc-weather')?.innerText || '?';

  // Badge display
  r.badges = document.getElementById('badge-display')?.innerText || '?';

  return r;
});

console.log(JSON.stringify(result, null, 2));

await page.screenshot({ path: 'test-output/verify-final.png', fullPage: true });
console.log('Screenshot saved');

// Check that the background image file loads
if (result.locBgComputed && result.locBgComputed !== 'none') {
  const urlMatch = result.locBgComputed.match(/url\(['"]([^'"]+)['"]\)/);
  if (urlMatch) {
    const imgUrl = urlMatch[1];
    const resp = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        return { url, status: res.status, ok: res.ok };
      } catch(e) { return { url, error: e.message }; }
    }, imgUrl);
    console.log('Image check:', JSON.stringify(resp));
  }
} else {
  console.log('No background image set');
}

await browser.close();
