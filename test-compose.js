
const sharp = require('sharp');
const fs = require('fs');

async function compose() {
  const cutoutBuf = fs.readFileSync('/tmp/ringconn-cutout.png');
  const cutoutMeta = await sharp(cutoutBuf).metadata();
  
  const targets = [
    { bg: '/tmp/bg-studio.jpg', out: '/tmp/final-studio.jpg' },
    { bg: '/tmp/bg-coffee.jpg', out: '/tmp/final-coffee.jpg' },
    { bg: '/tmp/bg-dark.jpg', out: '/tmp/final-dark.jpg' },
  ];
  
  for (const t of targets) {
    const bgMeta = await sharp(t.bg).metadata();
    const scale = Math.min(bgMeta.width * 0.55 / cutoutMeta.width, bgMeta.height * 0.55 / cutoutMeta.height);
    const ringW = Math.round(cutoutMeta.width * scale);
    const ringH = Math.round(cutoutMeta.height * scale);
    const x = Math.round((bgMeta.width - ringW) / 2);
    const y = Math.round((bgMeta.height - ringH) / 2);
    
    const resizedCutout = await sharp(cutoutBuf).resize(ringW, ringH, { fit: 'fill' }).png().toBuffer();
    
    await sharp(t.bg)
      .composite([{ input: resizedCutout, left: x, top: y }])
      .jpeg({ quality: 92 })
      .toFile(t.out);
    
    console.log(`OK: ring ${ringW}x${ringH} at (${x},${y}) on ${bgMeta.width}x${bgMeta.height}`);
  }
}

compose().catch(e => { console.error(e.message); process.exit(1); });
