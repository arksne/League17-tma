import { chromium } from 'playwright';
import { setTimeout as sleep } from 'timers/promises';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'pageerror')
    console.log('  [ERR]', msg.text().substring(0, 150));
});

console.log('1. Loading game...');
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
await sleep(4000);

// Step 1: Check for registration overlay
let regBtn = await page.$('#btn-register');
let step = 2;
while (regBtn) {
  console.log(`${step}. Registration screen found`);
  // Fill nickname
  const nickInput = await page.$('#reg-nickname');
  if (nickInput) {
    await nickInput.fill('');
    await nickInput.type('Admin');
  }
  // Pick an avatar
  const avatarOpts = await page.$$('.reg-avatar-opt');
  if (avatarOpts.length > 0) {
    await avatarOpts[1].click(); // second avatar
  }
  await sleep(500);
  // Submit
  await regBtn.click();
  console.log(`${step}a. Registration submitted, waiting...`);
  await sleep(4000);
  regBtn = await page.$('#btn-register');
  step++;
}

// Step 2: Check for starter modal
let starterModal = await page.$('#starter-modal');
if (starterModal) {
  const display = await starterModal.evaluate(el => window.getComputedStyle(el).display);
  console.log(`${step}. Starter modal visible (display:${display})`);

  if (display !== 'none') {
    // Check for tutorial overlay blocking clicks
    const tutorialOverlay = await page.$('#tutorial-overlay');
    if (tutorialOverlay) {
      const tutDisplay = await tutorialOverlay.evaluate(el => window.getComputedStyle(el).display);
      console.log(`${step}a. Tutorial overlay is blocking! (display:${tutDisplay}) - removing it`);
      // Remove the tutorial overlay from DOM so starter modal is clickable
      await page.evaluate(() => {
        const el = document.getElementById('tutorial-overlay');
        if (el) el.remove();
      });
      await sleep(500);
    }

    // Now click a starter option
    // Make sure starter modal is visible
    await page.evaluate(() => {
      const modal = document.getElementById('starter-modal');
      if (modal) modal.style.display = 'flex';
    });
    await sleep(300);
    const starterOpts = await page.$$('.starter-option');
    if (starterOpts.length > 0) {
      console.log(`${step}b. Clicking starter option 1...`);
      await starterOpts[0].click();
      console.log(`${step}c. Starter selected, waiting for PokeAPI...`);
      await sleep(8000);
    } else {
      console.log(`${step}b. No starter options found!`);
    }
  }
} else {
  console.log(`${step}. No starter modal found`);
}

// Step 3: Wait for team + possible tutorial
await sleep(3000);

// Check if tutorial has started (team is now populated)
const tutorialOverlay = await page.$('#tutorial-overlay');
if (tutorialOverlay) {
  console.log('3. Tutorial started - clicking through...');
  for (let i = 0; i < 10; i++) {
    const nextBtn = await page.$('#tutorial-next');
    if (!nextBtn) {
      const skipBtn = await page.$('#tutorial-skip');
      if (skipBtn) {
        console.log('  -> clicking Пропустить');
        await skipBtn.click({ force: true });
        await sleep(1000);
      }
      break;
    }
    const text = await nextBtn.innerText();
    console.log(`  ${i+1}. clicking "${text}"`);
    await nextBtn.click({ force: true });
    await sleep(1500);

    const still = await page.$('#tutorial-overlay');
    if (!still) { console.log('  -> tutorial done!'); break; }
    const d = await still.evaluate(el => window.getComputedStyle(el).display);
    if (d === 'none') { console.log('  -> tutorial hidden!'); break; }
  }
} else {
  console.log('3. No tutorial (user already completed or no team)');
}

// Step 4: Mark tutorial complete in localStorage
await page.evaluate(() => {
  localStorage.setItem('league17_tutorial', 'complete');
});

// Step 5: Reload and check
console.log('4. Reloading with tutorial complete...');
await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
await sleep(5000);

const final = await page.evaluate(() => {
  const r = {};
  r.tutorialEl = document.getElementById('tutorial-overlay') ? 'exists' : 'absent';
  const s = document.getElementById('starter-modal');
  r.starterDisplay = s ? window.getComputedStyle(s).display : 'absent';
  r.locName = document.getElementById('loc-name')?.innerText || '?';
  r.locDesc = document.getElementById('loc-desc')?.innerText?.substring(0, 80) || '?';
  r.navCount = document.getElementById('nav-buttons')?.children?.length || 0;
  r.actionCount = document.getElementById('loc-actions')?.children?.length || 0;
  // @ts-ignore
  const state = window.state || {};
  r.currentLocationId = state.currentLocationId;
  r.teamSize = (state.myTeam || []).length;
  r.money = (state.inventory || {}).credit || 0;
  // loc-image background
  const li = document.getElementById('loc-image');
  if (li) {
    r.locBg = window.getComputedStyle(li).backgroundImage.substring(0, 80);
    r.locBgStyle = li.style.backgroundImage || '(empty)';
  }
  // Error checking
  r.errors = Array.from(document.querySelectorAll('.error, [class*="error"]')).map(e => e.innerText.substring(0, 100));
  return r;
});

console.log('\n=== FINAL STATE ===');
console.log(JSON.stringify(final, null, 2));

await page.screenshot({ path: 'test-output/final-game.png', fullPage: true });
console.log('\nScreenshot saved');

await browser.close();
