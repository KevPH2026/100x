
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const sharp = require('sharp');

async function test() {
  const inputPath = '/tmp/gen2-0-royal-gold.png';
  console.log('Input:', fs.statSync(inputPath).size, 'bytes');
  
  const t0 = Date.now();
  const blob = await removeBackground(inputPath, {
    model: 'medium',
    output: { format: 'image/png' }
  });
  console.log('RemoveBG time:', Date.now() - t0, 'ms');
  
  const buf = Buffer.from(await blob.arrayBuffer());
  console.log('Output PNG:', buf.length, 'bytes');
  
  // 白底预览
  await sharp(buf)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 90 })
    .toFile('/tmp/ringconn-cutout-white.jpg');
  
  fs.writeFileSync('/tmp/ringconn-cutout.png', buf);
  console.log('Done');
}

test().catch(e => { console.error('ERR:', e.message); process.exit(1); });
