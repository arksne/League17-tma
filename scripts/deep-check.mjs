import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(6000);

// Set tutorial complete
await page.evaluate(() => localStorage.setItem('league17_tutorial', 'complete'));
await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(5000);

const info = await page.evaluate(() => {
  const r = {};
  // @ts-ignore
  const s = window.state || {};
  r.currentLocationId = s.currentLocationId;
  r.currentRegion = s.currentRegion;
  r.teamSize = (s.myTeam || []).length;
  r.money = (s.inventory || {}).credit || 0;
  r.invItems = Object.keys(s.inventory || {}).filter(k => k !== 'credit').length;

  // loc-image analysis
  const li = document.getElementById('loc-image');
  if (li) {
    r.locImageId = li.id;
    r.locImageDisplay = window.getComputedStyle(li).display;
    r.locImageBg = window.getComputedStyle(li).backgroundImage;
    r.locImageStyleAttr = li.getAttribute('style');
    // Check all CSS properties set
    const props = {};
    for (let i = 0; i < li.style.length; i++) {
      const name = li.style[i];
      props[name] = li.style.getPropertyValue(name);
    }
    r.locImageInlineProps = props;
    r.locImageClasses = li.className;
  } else {
    r.locImage = 'NOT FOUND';
  }

  // Check for bg image on any loc-related element
  const els = document.querySelectorAll('#loc-image, [class*="loc"], [id*="loc"]');
  r.allLocEls = Array.from(els).map(el => ({
    id: el.id,
    class: el.className,
    bg: window.getComputedStyle(el).backgroundImage?.substring(0, 80),
  }));

  // Nav buttons
  const nav = document.getElementById('nav-buttons');
  r.navChildCount = nav ? nav.children.length : -1;
  r.navHTML = nav ? nav.innerHTML.substring(0, 500) : 'NOT FOUND';

  // Actions
  const actions = document.getElementById('loc-actions');
  r.actionsChildCount = actions ? actions.children.length : -1;

  // The map/explore views
  r.activeView = document.querySelector('.view.active')?.id || 'none';

  return r;
});

console.log(JSON.stringify(info, null, 2));

// Check if the image file exists via fetch
const imgFetch = await page.evaluate(async () => {
  const urls = [
    '/assets/map/kanto/vermilionCity.png',
    '/assets/map/kanto/vermilionCity.jpg',
    '/assets/map/kanto/vermilion.png',
  ];
  const results = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      results.push({ url, status: res.status, ok: res.ok });
    } catch(e) {
      results.push({ url, error: e.message });
    }
  }
  return results;
});
console.log('\nImage fetch check:', JSON.stringify(imgFetch));

// Check localStorage keys
const ls = await page.evaluate(() => {
  const keys = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    keys[k] = localStorage.getItem(k).substring(0, 50);
  }
  return keys;
});
console.log('\nlocalStorage:', JSON.stringify(ls, null, 2));

await browser.close();
