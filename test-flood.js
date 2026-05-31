
const sharp = require('sharp');

async function advancedCutout() {
  const refUrl = 'https://cdn.shopify.com/s/files/1/0850/1769/0420/files/RingConn_Smart_Ring_Gen_2-Royal_Gold.png?v=1757058366';
  const dl = await fetch(refUrl);
  const buf = Buffer.from(await dl.arrayBuffer());
  
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  
  console.log('Input:', w, 'x', h);
  
  // Flood fill 从四边开始，标记所有"背景"像素
  // 背景判定：与边缘像素颜色距离 < threshold
  const visited = new Uint8Array(w * h);
  const result = new Uint8Array(w * h); // 0=keep, 1=remove
  const threshold = 30;
  
  // BFS queue
  const queue = [];
  
  // 添加四条边的像素作为种子
  for (let x = 0; x < w; x++) {
    queue.push(x); // top row
    queue.push((h-1)*w + x); // bottom row
  }
  for (let y = 0; y < h; y++) {
    queue.push(y*w); // left col
    queue.push(y*w + w-1); // right col
  }
  
  // 获取种子点的参考色
  let seedR = 0, seedG = 0, seedB = 0, seedCount = 0;
  for (const idx of queue.slice(0, 20)) {
    const px = idx * ch;
    seedR += data[px]; seedG += data[px+1]; seedB += data[px+2];
    seedCount++;
  }
  seedR = Math.round(seedR/seedCount);
  seedG = Math.round(seedG/seedCount);
  seedB = Math.round(seedB/seedCount);
  console.log('Seed color:', seedR, seedG, seedB);
  
  // BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    if (idx < 0 || idx >= w*h || visited[idx]) continue;
    
    const px = idx * ch;
    const r = data[px], g = data[px+1], b = data[px+2];
    const dist = Math.sqrt((r-seedR)**2 + (g-seedG)**2 + (b-seedB)**2);
    
    if (dist > threshold * 2) continue; // 颜色差太远，不是背景
    
    visited[idx] = 1;
    result[idx] = 1; // 标记为背景（要移除）
    
    const x = idx % w, y = Math.floor(idx / w);
    // 用当前像素颜色更新参考色（渐变背景适配）
    // 不更新，保持种子色
    
    if (x > 0) queue.push(idx - 1);
    if (x < w-1) queue.push(idx + 1);
    if (y > 0) queue.push(idx - w);
    if (y < h-1) queue.push(idx + w);
  }
  
  // 生成输出
  const out = Buffer.alloc(data.length);
  let removed = 0, kept = 0;
  
  for (let i = 0; i < w*h; i++) {
    const px = i * ch;
    if (result[i]) {
      // 背景 → 透明
      out[px] = 0; out[px+1] = 0; out[px+2] = 0; out[px+3] = 0;
      removed++;
    } else {
      // 产品 → 原样保留
      out[px] = data[px]; out[px+1] = data[px+1]; out[px+2] = data[px+2]; out[px+3] = data[px+3];
      kept++;
    }
  }
  
  console.log('Removed:', removed, 'Kept:', kept, '(' + Math.round(kept*100/(removed+kept)) + '% kept)');
  
  // 保存抠图
  await sharp(out, {raw:{width:w,height:h,channels:ch}}).png().toFile('/tmp/flood-cutout.png');
  
  // 白底预览
  await sharp('/tmp/flood-cutout.png').flatten({background:{r:255,g:255,b:255}}).jpeg({quality:90}).toFile('/tmp/flood-cutout-white.jpg');
  
  // 合成到 AI 背景
  const tw=1024, th=1024;
  const scale = Math.min(tw*0.7/w, th*0.7/h);
  const rw = Math.round(w*scale), rh = Math.round(h*scale);
  const ox = Math.round((tw-rw)/2), oy = Math.round((th-rh)/2);
  
  const resized = await sharp('/tmp/flood-cutout.png').resize(rw,rh,{fit:'fill'}).png().toBuffer();
  const bg = await sharp({create:{width:tw,height:th,channels:3,background:{r:40,g:35,b:30}}}).png().toBuffer();
  await sharp(bg).composite([{input:resized,left:ox,top:oy}]).jpeg({quality:92}).toFile('/tmp/flood-composite.jpg');
  
  console.log('Done! Ring', rw, 'x', rh, 'at', ox, oy);
}

advancedCutout().catch(e => { console.error('ERR:', e.message); process.exit(1); });
