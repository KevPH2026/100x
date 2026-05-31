
const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');

async function pipeline() {
  const inputPath = '/tmp/gen2-0-royal-gold.png';
  
  // Step 1: 抠图
  console.log('Step 1: Remove background...');
  const t0 = Date.now();
  const blob = await removeBackground(inputPath, { model: 'medium', output: { format: 'image/png' } });
  const cutoutBuf = Buffer.from(await blob.arrayBuffer());
  console.log(`  Done in ${Date.now()-t0}ms, ${cutoutBuf.length} bytes`);
  
  // Step 2: 拿抠图尺寸
  const cutoutMeta = await sharp(cutoutBuf).metadata();
  console.log(`  Cutout: ${cutoutMeta.width}x${cutoutMeta.height}`);
  
  // Step 3: 缩放抠图到目标尺寸
  const targets = [
    { label: 'studio-1x1', w: 1024, h: 1024, bgPrompt: 'Clean white studio background with soft gradient lighting, minimalist product photography' },
    { label: 'coffee-9x16', w: 768, h: 1376, bgPrompt: 'Warm coffee shop interior with wooden table, afternoon sunlight, cozy atmosphere' },
    { label: 'night-16x9', w: 1376, h: 768, bgPrompt: 'Dark luxury surface with golden spotlight, dramatic jewelry store display' },
  ];
  
  for (const t of targets) {
    console.log(`\nStep: ${t.label} (${t.w}x${t.h})`);
    
    // 创建纯色背景占位（实际会替换成 AI 生成的背景）
    // 这里先用渐变色模拟
    const bgSvg = `<svg width="${t.w}" height="${t.h}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="100%" style="stop-color:#16213e"/>
        </linearGradient>
      </defs>
      <rect width="${t.w}" height="${t.h}" fill="url(#g)"/>
    </svg>`;
    
    // 计算戒指在背景中的位置（居中，缩放到合适大小）
    const ringScale = Math.min(t.w * 0.6 / cutoutMeta.width, t.h * 0.6 / cutoutMeta.height);
    const ringW = Math.round(cutoutMeta.width * ringScale);
    const ringH = Math.round(cutoutMeta.height * ringScale);
    const x = Math.round((t.w - ringW) / 2);
    const y = Math.round((t.h - ringH) / 2);
    
    // 合成
    const resizedCutout = await sharp(cutoutBuf).resize(ringW, ringH, { fit: 'fill' }).png().toBuffer();
    
    const composite = await sharp(Buffer.from(bgSvg))
      .composite([{ input: resizedCutout, left: x, top: y }])
      .jpeg({ quality: 90 })
      .toFile(`/tmp/composite-${t.label}.jpg`);
    
    console.log(`  Composite: ring ${ringW}x${ringH} at (${x},${y}) → saved`);
  }
  
  console.log('\nAll done!');
}

pipeline().catch(e => { console.error('ERR:', e.message); process.exit(1); });
