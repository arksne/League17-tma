import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'ru-RU',
});
const page = await context.newPage();

page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'pageerror')
    console.log('  [ERR]', msg.text().substring(0, 150));
});

console.log('1. Loading game...');
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(3000);

// Step 1: Check for registration screen
const regBtn = await page.$('#btn-register');
if (regBtn) {
  console.log('2. Registration screen found! Filling nickname...');
  // Fill nickname
  await page.fill('#reg-nickname', 'Admin');
  // Click avatar
  await page.click('.reg-avatar-opt');
  await page.waitForTimeout(300);
  // Submit registration
  await page.click('#btn-register');
  console.log('3. Registration submitted, waiting...');
  await page.waitForTimeout(3000);
} else {
  console.log('2. No registration screen (already registered)');
}

// Step 2: Check for starter modal
let starterModal = await page.$('#starter-modal');
if (starterModal) {
  const starterDisplay = await page.evaluate(() => {
    const m = document.getElementById('starter-modal');
    return m ? window.getComputedStyle(m).display : 'none';
  });
  if (starterDisplay !== 'none') {
    console.log('4. Starter modal visible! Clicking first starter option...');
    // Click the first "?" starter option
    const firstStarter = await page.$('.starter-option');
    if (firstStarter) {
      await firstStarter.click();
      console.log('5. Starter selected, waiting for PokeAPI...');
      await page.waitForTimeout(5000);
    }
  }
} else {
  console.log('4. No starter modal');
}

// Step 3: Tutorial - click through it
await page.waitForTimeout(2000);
let tutorial = await page.$('#tutorial-overlay');
let clicks = 0;
while (tutorial && clicks < 10) {
  const display = await page.evaluate(() => {
    const t = document.getElementById('tutorial-overlay');
    return t ? window.getComputedStyle(t).display : 'none';
  });
  if (display === 'none') break;

  // Try clicking "Далее →"
  const nextBtn = await page.$('#tutorial-next');
  if (nextBtn) {
    const text = await nextBtn.innerText();
    console.log(`6. Tutorial step ${clicks + 1}: clicking "${text}"`);
    await nextBtn.click();
    await page.waitForTimeout(1000);
    clicks++;
  } else {
    // Try clicking "Пропустить"
    const skipBtn = await page.$('#tutorial-skip');
    if (skipBtn) {
      console.log('6. Clicking "Пропустить"');
      await skipBtn.click();
      await page.waitForTimeout(1000);
      break;
    } else {
      break;
    }
  }
  tutorial = await page.$('#tutorial-overlay');
}

console.log(`7. Tutorial done after ${clicks} clicks`);

// Step 4: Check final state
await page.waitForTimeout(2000);
const final = await page.evaluate(() => {
  const r = {};
  r.tutorialDisplay = (document.getElementById('tutorial-overlay') ? window.getComputedStyle(document.getElementById('tutorial-overlay')).display : 'notfound');
  r.starterDisplay = (document.getElementById('starter-modal') ? window.getComputedStyle(document.getElementById('starter-modal')).display : 'notfound');
  r.locName = document.getElementById('loc-name')?.innerText || '?';
  r.locDesc = document.getElementById('loc-desc')?.innerText?.substring(0, 80) || '?';
  r.locImageBg = document.getElementById('loc-image')?.style?.backgroundImage || '(none)';
  r.navButtons = document.getElementById('nav-buttons')?.children?.length || 0;
  r.actionButtons = document.getElementById('loc-actions')?.children?.length || 0;
  r.weather = document.getElementById('loc-weather')?.innerText || '?';
  return r;
});
console.log('\n=== FINAL STATE ===');
console.log(JSON.stringify(final, null, 2));

// Take screenshot
await page.screenshot({ path: 'test-output/after-registration.png', fullPage: true });
console.log('\nScreenshot saved to test-output/after-registration.png');

// Print cookies/localStorage summary
const storage = await context.storageState();
console.log('\nStorage saved');

await browser.close();
