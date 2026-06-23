import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // mobile size

const errors = [];
page.on('console', msg => errors.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => errors.push({ type: 'pageerror', text: err.message }));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(5000);

// Full DOM analysis
const analysis = await page.evaluate(() => {
  const result = {
    title: document.title,
    body: document.body ? document.body.innerHTML.substring(0, 100) : 'NO BODY',
    visible: [],
    hidden: [],
    brokenImages: [],
    modals: [],
    errors: [],
    styles: {},
  };

  // Check all elements with computed style
  const allEls = document.querySelectorAll('*');
  let hiddenCount = 0, visibleCount = 0;
  allEls.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      if (el.id) result.hidden.push(el.id);
      if (el.className && typeof el.className === 'string' && el.className.length > 0) hiddenCount++;
    } else {
      if (el.id) result.visible.push(el.id);
      if (el.className && typeof el.className === 'string' && el.className.length > 0) visibleCount++;
    }
  });
  result.hiddenCount = hiddenCount;
  result.visibleCount = visibleCount;

  // Check images
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      result.brokenImages.push({ src: img.src, alt: img.alt });
    }
  });

  // Check background images
  document.querySelectorAll('[style*="background"]').forEach(el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') {
      const url = bg.replace(/url\(["']?/, '').replace(/["']?\)/, '');
      const img = new Image();
      img.onerror = () => result.brokenImages.push({ src: url, type: 'background' });
      img.src = url;
    }
  });

  // Check for modals/overlays
  document.querySelectorAll('[class*="modal"], [class*="overlay"], [class*="Modal"], [class*="Overlay"]').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.display !== 'none') {
      result.modals.push({
        tag: el.tagName,
        id: el.id,
        class: el.className?.substring(0, 60),
        text: el.innerText?.substring(0, 100),
      });
    }
  });

  // Check localStorage
  result.localStorage = {};
  for (let i = 0; i < localStorage.length; i++) {
    result.localStorage[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)).substring(0, 50);
  }

  return result;
});

console.log('=== TITLE ===');
console.log(analysis.title);
console.log('');

console.log('=== DOM COUNTS ===');
console.log('Visible els with id/class:', analysis.visibleCount);
console.log('Hidden els with id/class:', analysis.hiddenCount);
console.log('');

console.log('=== VISIBLE IDs (first 50) ===');
analysis.visible.forEach((id, i) => { if (i < 50) console.log('  -', id); });
console.log('');

console.log('=== BROKEN IMAGES ===');
analysis.brokenImages.forEach(img => console.log('  -', img.src, '(' + (img.type || 'img') + ')', img.alt || ''));
console.log('');

console.log('=== MODALS/OVERLAYS ===');
analysis.modals.forEach(m => {
  console.log('  [' + m.tag + '#' + m.id + '] class=' + m.class);
  console.log('    text:', m.text?.substring(0, 200));
});
console.log('');

console.log('=== CONSOLE ERRORS (first 20) ===');
errors.filter(e => e.type === 'error' || e.type === 'pageerror').slice(0, 20).forEach(e => {
  console.log('  [' + e.type + ']', e.text?.substring(0, 300));
});
console.log('');

console.log('=== WARNINGS (first 10) ===');
errors.filter(e => e.type === 'warning').slice(0, 10).forEach(e => {
  console.log('  [warn]', e.text?.substring(0, 200));
});

await browser.close();
