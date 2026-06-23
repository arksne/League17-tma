const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://image.pollinations.ai/prompt';
const WIDTH = 1024;
const HEIGHT = 1024;
const MODEL = 'sana';
const DELAY_MS = 2000;   // 2 sec between requests

// Load locations
const locData = JSON.parse(fs.readFileSync('D:\\pokematrix\\league17\\tmp_locations.json', 'utf-8'));
const remaining = locData.remaining;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(filePath); } catch (_) {}
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(filePath); } catch (_) {}
      reject(err);
    });
  });
}

function buildPrompt(loc) {
  const region = loc.region === 'kanto' ? 'Kanto' : 'Johto';
  return `pixel art ${loc.name} ${region} region ${loc.desc} vibrant 8bit birds eye view no creatures no animals no birds no pokemon no living things deserted empty`.replace(/\s+/g, ' ');
}

async function generateAll() {
  const startTime = Date.now();
  let success = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`Starting generation of ${remaining.length} images...`);
  console.log(`Model: ${MODEL}, Size: ${WIDTH}x${HEIGHT}, Delay: ${DELAY_MS}ms\n`);

  for (let i = 0; i < remaining.length; i++) {
    const loc = remaining[i];
    const regionDir = path.join('D:\\pokematrix\\league17\\public\\assets\\map', loc.region);
    const filePath = path.join(regionDir, loc.id + '.png');

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      skipped++;
      continue;
    }

    const prompt = buildPrompt(loc);
    const encoded = encodeURIComponent(prompt);
    const url = `${BASE_URL}/${encoded}?width=${WIDTH}&height=${HEIGHT}&model=${MODEL}&seed=${42 + i}`;

    // Truncate prompt for display
    const shortPrompt = prompt.length > 80 ? prompt.substring(0, 77) + '...' : prompt;

    process.stdout.write(`[${i + 1}/${remaining.length}] ${loc.id} (${loc.region})... `);

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const dlStart = Date.now();
        await downloadImage(url, filePath);
        const dlTime = Date.now() - dlStart;
        console.log(`OK ${dlTime}ms`);
        success++;
        break;
      } catch (err) {
        retries++;
        if (retries <= maxRetries) {
          console.log(`RETRY${retries} (${err.message})`);
          await sleep(3000);
        } else {
          console.log(`FAILED (${err.message})`);
          failed++;
        }
      }
    }

    // Delay between requests
    if (i < remaining.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  console.log(`\n=== DONE in ${mins}m ${secs}s ===`);
  console.log(`Success: ${success} | Failed: ${failed} | Skipped: ${skipped} | Total: ${success + failed + skipped}`);

  // Final count
  const kanto = fs.readdirSync('D:\\pokematrix\\league17\\public\\assets\\map\\kanto').filter(f => f.endsWith('.png')).length;
  const johto = fs.readdirSync('D:\\pokematrix\\league17\\public\\assets\\map\\johto').filter(f => f.endsWith('.png')).length;
  console.log(`Images on disk: ${kanto} Kanto + ${johto} Johto = ${kanto + johto}`);
}

generateAll().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
