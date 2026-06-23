import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const errors = [];
page.on('console', msg => errors.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => errors.push({ type: 'pageerror', text: err.message }));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

// Check state before
const before = await page.evaluate(() => {
  // Check if store is loaded
  if (typeof window !== 'undefined') {
    // Try to access the state from window or globalThis
    return {
      stateExists: typeof window.__STATE__ !== 'undefined',
      documentReady: document.readyState,
    };
  }
  return { error: 'no window' };
});
console.log('Before:', JSON.stringify(before));

// Try to close the modals and check the underlying game
const afterClose = await page.evaluate(() => {
  const result = {};

  // Check tutorial overlay
  const tutorialOverlay = document.getElementById('tutorial-overlay');
  if (tutorialOverlay) {
    result.tutorialVisible = tutorialOverlay.style.display !== 'none' && window.getComputedStyle(tutorialOverlay).display !== 'none';
    result.tutorialOverlayStyle = tutorialOverlay.style.display;
    result.tutorialOverlayClass = tutorialOverlay.className;
    result.tutorialOverlayZIndex = window.getComputedStyle(tutorialOverlay).zIndex;
    // Check if it has pointer-events blocking
    result.tutorialPointerEvents = window.getComputedStyle(tutorialOverlay).pointerEvents;
    // Check visibility
    result.tutorialVisibility = window.getComputedStyle(tutorialOverlay).visibility;
    // Check opacity
    result.tutorialOpacity = window.getComputedStyle(tutorialOverlay).opacity;
    // Get text
    result.tutorialText = tutorialOverlay.innerText.substring(0, 300);
  } else {
    result.tutorialOverlay = 'NOT FOUND';
  }

  // Check starter modal
  const starterModal = document.getElementById('starter-modal');
  if (starterModal) {
    result.starterVisible = starterModal.style.display !== 'none';
    result.starterStyle = starterModal.style.display;
    result.starterClass = starterModal.className;
    result.starterZIndex = window.getComputedStyle(starterModal).zIndex;
    result.starterText = starterModal.innerText.substring(0, 300);
    result.starterPointerEvents = window.getComputedStyle(starterModal).pointerEvents;
  } else {
    result.starterModal = 'NOT FOUND';
  }

  // Check main game content
  const locImage = document.getElementById('loc-image');
  if (locImage) {
    result.locImage = {
      backgroundImage: window.getComputedStyle(locImage).backgroundImage?.substring(0, 100),
      display: window.getComputedStyle(locImage).display,
    };
  } else {
    result.locImage = 'NOT FOUND';
  }

  // Try clicking buttons
  const btnClose = document.querySelector('.tutorial-close, .btn-close, [onclick*="close"], [onclick*="skip"]');
  if (btnClose) {
    result.skipButton = {
      text: btnClose.innerText,
      tag: btnClose.tagName,
      class: btnClose.className,
      onclick: btnClose.getAttribute('onclick')?.substring(0, 100),
    };
  } else {
    result.skipButton = 'NOT FOUND';
  }

  // Check for "next" or "skip" buttons
  const buttons = Array.from(document.querySelectorAll('button'));
  result.buttons = buttons.map(b => ({
    text: b.innerText.substring(0, 50),
    display: window.getComputedStyle(b).display,
    class: b.className?.substring(0, 40),
  }));

  // Check loc-image div more closely
  result.bodyInnerHTML = document.body.innerHTML.substring(0, 500);

  return result;
});

console.log('\n=== TUTORIAL OVERLAY ===');
console.log(JSON.stringify(afterClose, null, 2));

// Try to click the "Далее" or "Пропустить" button to dismiss tutorial
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(b => ({
    text: b.innerText.trim().substring(0, 30),
    display: window.getComputedStyle(b).display,
    visible: b.offsetParent !== null,
    rect: b.getBoundingClientRect(),
    id: b.id,
    class: b.className?.substring(0, 40),
  }));
});
console.log('\n=== ALL BUTTONS ===');
buttons.filter(b => b.visible).forEach(b => console.log('  "' + b.text + '" id=' + b.id + ' class=' + b.class));

// Take a screenshot
await page.screenshot({ path: 'test-output/game-screenshot.png', fullPage: true });
console.log('\nScreenshot saved to test-output/game-screenshot.png');

await browser.close();
