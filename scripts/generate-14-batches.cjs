const fs = require('fs');
const https = require('https');
const path = require('path');

const locData = JSON.parse(fs.readFileSync('D:\\pokematrix\\league17\\tmp_locations.json', 'utf-8'));
const remaining = locData.remaining;

function buildPrompt(loc) {
  const region = loc.region === 'kanto' ? 'Kanto' : 'Johto';
  return `pixel art ${loc.name} ${region} region ${loc.desc} vibrant 8bit birds eye view no creatures no animals no birds no pokemon no living things deserted empty`.replace(/\s+/g, ' ');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const req = https.get(url, { timeout: 30000 }, (response) => {
      if (response.statusCode !== 200) {
        let body = '';
        response.on('data', c => body += c);
        response.on('end', () => { file.close(); try { fs.unlinkSync(filePath); } catch(_) {} reject(new Error('HTTP ' + response.statusCode + ': ' + body.slice(0,100))); });
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (err) => { file.close(); try { fs.unlinkSync(filePath); } catch(_) {} reject(err); });
    req.on('timeout', () => { req.destroy(); file.close(); try { fs.unlinkSync(filePath); } catch(_) {} reject(new Error('TIMEOUT')); });
  });
}

// Split into 5 batches (~28 each)
const BATCH_COUNT = 5;
const perBatch = Math.ceil(remaining.length / BATCH_COUNT);
const batches = [];
for (let i = 0; i < BATCH_COUNT; i++) {
  const start = i * perBatch;
  const end = Math.min(start + perBatch, remaining.length);
  if (start < remaining.length) batches.push({ idx: i, locs: remaining.slice(start, end) });
}

// Track global stats
let doneCount = 0;
const total = remaining.length;
const lock = { ok: 0, fail: 0 };

// Map location -> its original index for deterministic seed
const locIndexMap = {};
remaining.forEach((l, i) => { locIndexMap[l.id + '_' + l.region] = i; });

async function runBatch(batch) {
  const { idx: batchIdx, locs } = batch;
  let ok = 0, fail = 0;

  for (const loc of locs) {
    const regionDir = path.join('D:\\pokematrix\\league17\\public\\assets\\map', loc.region);
    const filePath = path.join(regionDir, loc.id + '.png');

    if (fs.existsSync(filePath)) {
      ok++;
      lock.ok++; doneCount++;
      continue;
    }

    const prompt = buildPrompt(loc);
    const encoded = encodeURIComponent(prompt);
    const origIdx = locIndexMap[loc.id + '_' + loc.region] || 0;
    const url = 'https://image.pollinations.ai/prompt/' + encoded + '?width=1024&height=1024&model=sana&seed=' + (42 + origIdx);

    let success = false;
    for (let retry = 0; retry <= 3; retry++) {
      try {
        await downloadImage(url, filePath);
        success = true;
        break;
      } catch(e) {
        if (retry < 3) await sleep(5000);
      }
    }

    if (success) { ok++; lock.ok++; }
    else { fail++; lock.fail++; }
    doneCount++;

    const pct = Math.round(doneCount / total * 100);
    process.stdout.write('\r[' + pct + '%] Batch' + batchIdx + (success ? '✓' : '✗') + ' (' + lock.ok + '/' + lock.fail + ')     ');

    await sleep(2500);
  }

  return { ok, fail };
}

async function main() {
  const startTime = Date.now();

  console.log('Generating ' + remaining.length + ' images in ' + batches.length + ' parallel batches\n');

  // Staggered start: each batch starts 300ms apart
  const promises = batches.map((batch, i) =>
    sleep(i * 300).then(() => runBatch(batch))
  );

  const results = await Promise.all(promises);

  const sumOk = results.reduce((s, r) => s + r.ok, 0);
  const sumFail = results.reduce((s, r) => s + r.fail, 0);
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log('\n\n=== ALL DONE in ' + Math.floor(elapsed/60) + 'm ' + (elapsed%60) + 's ===');
  console.log('Success: ' + sumOk + ' | Failed: ' + sumFail + ' | Total: ' + (sumOk + sumFail));

  const kanto = fs.readdirSync('D:\\pokematrix\\league17\\public\\assets\\map\\kanto').filter(f => f.endsWith('.png')).length;
  const johto = fs.readdirSync('D:\\pokematrix\\league17\\public\\assets\\map\\johto').filter(f => f.endsWith('.png')).length;
  console.log('On disk: ' + kanto + ' Kanto + ' + johto + ' Johto = ' + (kanto + johto));

  // Save report
  fs.writeFileSync('D:\\pokematrix\\league17\\generation-report.json', JSON.stringify({
    generated: sumOk,
    failed: sumFail,
    totalOnDisk: kanto + johto,
    elapsed: elapsed,
    timestamp: new Date().toISOString()
  }, null, 2));
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
