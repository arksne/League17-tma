import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

page.on('console', msg => {
  if (msg.type() === 'error' || msg.text().includes('save') || msg.text().includes('cloud') || msg.text().includes('sync') || msg.text().includes('team'))
    console.log('  [LOG]', msg.text().substring(0, 200));
});

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(8000);

// Set tutorial
await page.evaluate(() => localStorage.setItem('league17_tutorial', 'complete'));

// Check state directly
const stateCheck = await page.evaluate(async () => {
  const r = {};
  // @ts-ignore
  const s = window.state || {};
  r.myTeam = (s.myTeam || []).length;
  r.money = s.inventory?.credit;
  r.location = s.currentLocationId;
  r.region = s.currentRegion;
  r.tgToken = s.tgToken ? 'yes' : 'no';
  r.saveVersion = s.saveVersion;
  r.lastCloudSync = s.lastCloudSync;

  // Try to manually fetch the cloud save
  try {
    const res = await fetch('/api/save');
    const data = await res.json();
    r.cloudDataKeys = data.saveData ? Object.keys(data.saveData) : null;
    r.cloudTeamSize = data.saveData?.myTeam?.length || 0;
    r.cloudPokemon = data.saveData?.myTeam?.[0]?.apiData?.name || 'none';
    r.fetched = 'ok';
  } catch(e) {
    r.fetched = 'error: ' + e.message;
  }
  return r;
});

console.log('\n=== STATE CHECK ===');
console.log(JSON.stringify(stateCheck, null, 2));

await browser.close();
