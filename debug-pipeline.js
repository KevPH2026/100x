
const sharp = require('sharp');
const fs = require('fs');

async function debug() {
  const refUrl = 'https://cdn.shopify.com/s/files/1/0850/1769/0420/files/RingConn_Smart_Ring_Gen_2-Royal_Gold.png?v=1757058366';
  const dl = await fetch(refUrl);
  const imgBuf = Buffer.from(await dl.arrayBuffer());
  console.log('1. Ref:', imgBuf.length, 'bytes');
  const meta = await sharp(imgBuf).metadata();
  console.log('   ', meta.width, 'x', meta.height, meta.format, meta.channels, 'ch');
  
  // 抠图 - 用 Blob 传
  console.log('2. Remove BG...');
  const { removeBackground } = require('@imgly/background-removal-node');
  const t0 = Date.now();
  const imgBlob = new Blob([imgBuf], { type: 'image/png' });
  const resultBlob = await removeBackground(imgBlob, { model: 'medium', output: { format: 'image/png' } });
  const cutoutBuf = Buffer.from(await resultBlob.arrayBuffer());
  console.log('   ', Date.now()-t0, 'ms,', cutoutBuf.length, 'bytes');
  
  const cutoutMeta = await sharp(cutoutBuf).metadata();
  console.log('   ', cutoutMeta.width, 'x', cutoutMeta.height, cutoutMeta.channels, 'ch');
  
  // 透明度分析
  const { data, info } = await sharp(cutoutBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const total = info.width * info.height;
  let transparent = 0, opaque = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 10) transparent++;
    else opaque++;
  }
  console.log('   Opaque pixels:', opaque, '/', total, '(' + Math.round(opaque*100/total) + '%)');
  
  // 白底预览
  await sharp(cutoutBuf).flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 90 }).toFile('/tmp/debug-cutout.jpg');
  
  // 合成到暗色背景
  const tw = 1024, th = 1024;
  const scale = Math.min(tw * 0.55 / cutoutMeta.width, th * 0.55 / cutoutMeta.height);
  const rw = Math.round(cutoutMeta.width * scale);
  const rh = Math.round(cutoutMeta.height * scale);
  const x = Math.round((tw - rw) / 2);
  const y = Math.round((th - rh) / 2);
  console.log('   Ring at:', rw, 'x', rh, 'pos:', x, y, 'scale:', scale.toFixed(3));
  
  const resized = await sharp(cutoutBuf).resize(rw, rh, { fit: 'fill' }).png().toBuffer();
  const bg = await sharp({ create: { width: tw, height: th, channels: 3, background: { r: 30, g: 30, b: 35 } } }).png().toBuffer();
  await sharp(bg).composite([{ input: resized, left: x, top: y }]).jpeg({ quality: 92 }).toFile('/tmp/debug-comp.jpg');
  console.log('3. Saved cutout + composite');
}

debug().catch(e => { console.error('ERR:', e.message, e.stack?.split('\n')[1]); process.exit(1); });
