
const sharp = require('sharp');
const fs = require('fs');

async function test() {
  const refUrl = 'https://cdn.shopify.com/s/files/1/0850/1769/0420/files/RingConn_Smart_Ring_Gen_2-Royal_Gold.png?v=1757058366';
  const dl = await fetch(refUrl);
  const buf = Buffer.from(await dl.arrayBuffer());
  console.log('Input:', buf.length, 'bytes');
  
  const img = sharp(buf);
  const meta = await img.metadata();
  console.log('Size:', meta.width, 'x', meta.height);
  
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  
  // 采样角
  const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1],
    [Math.floor(w*0.1), Math.floor(h*0.1)],
    [Math.floor(w*0.9), Math.floor(h*0.1)],
    [Math.floor(w*0.1), Math.floor(h*0.9)],
    [Math.floor(w*0.9), Math.floor(h*0.9)]];
  
  let bgR=0,bgG=0,bgB=0;
  for (const [cx,cy] of corners) {
    const idx = (cy*w+cx)*ch;
    bgR += data[idx]; bgG += data[idx+1]; bgB += data[idx+2];
  }
  bgR = Math.round(bgR/corners.length);
  bgG = Math.round(bgG/corners.length);
  bgB = Math.round(bgB/corners.length);
  console.log('Background color:', bgR, bgG, bgB);
  
  const threshold = 45;
  const out = Buffer.alloc(data.length);
  let transparent = 0, opaque = 0;
  
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
    if (dist < threshold) {
      out[i]=0; out[i+1]=0; out[i+2]=0; out[i+3]=0;
      transparent++;
    } else if (dist < threshold + 20) {
      const alpha = Math.round(((dist - threshold) / 20) * 255);
      out[i]=r; out[i+1]=g; out[i+2]=b; out[i+3]=Math.min(a, alpha);
      opaque++;
    } else {
      out[i]=r; out[i+1]=g; out[i+2]=b; out[i+3]=a;
      opaque++;
    }
  }
  
  console.log('Transparent:', transparent, 'Opaque:', opaque);
  console.log('Ratio:', Math.round(opaque*100/(transparent+opaque)) + '% opaque');
  
  await sharp(out, {raw:{width:w,height:h,channels:ch}}).png().toFile('/tmp/chroma-cutout.png');
  
  // 白底预览
  await sharp('/tmp/chroma-cutout.png').flatten({background:{r:255,g:255,b:255}}).jpeg({quality:90}).toFile('/tmp/chroma-cutout-white.jpg');
  
  // 合成到暗色背景
  const tw=1024, th=1024;
  const scale = Math.min(tw*0.7/w, th*0.7/h);
  const rw = Math.round(w*scale), rh = Math.round(h*scale);
  const x = Math.round((tw-rw)/2), y = Math.round((th-rh)/2);
  console.log('Ring on 1024x1024:', rw, 'x', rh, 'at', x, y);
  
  const resized = await sharp('/tmp/chroma-cutout.png').resize(rw,rh,{fit:'fill'}).png().toBuffer();
  const bg = await sharp({create:{width:tw,height:th,channels:3,background:{r:30,g:30,b:35}}}).png().toBuffer();
  await sharp(bg).composite([{input:resized,left:x,top:y}]).jpeg({quality:92}).toFile('/tmp/chroma-composite.jpg');
  
  console.log('Done! Saved /tmp/chroma-cutout-white.jpg and /tmp/chroma-composite.jpg');
}

test().catch(e => { console.error('ERR:', e.message); process.exit(1); });
