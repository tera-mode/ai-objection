#!/usr/bin/env node
/**
 * 白背景除去ツール（フラッドフィル方式）
 *
 * 使い方: node scripts/remove-white-bg.js <input.png> [output.png]
 *         node scripts/remove-white-bg.js --all-case001
 *
 * 画像の端（エッジ）から白色・近似白色領域をフラッドフィルで検出し透過にする。
 * キャラクター本体の白（目の白目・歯など）は端に接していないため保持される。
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const THRESHOLD = 230; // この値以上のRGB = 白とみなす

async function removeWhiteBg(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const channels = 4;
  const visited = new Uint8Array(width * height);

  const isWhite = (x, y) => {
    const i = (y * width + x) * channels;
    return data[i] >= THRESHOLD && data[i+1] >= THRESHOLD && data[i+2] >= THRESHOLD;
  };

  // エッジピクセルをシードとしてキューに積む
  const queue = new Int32Array(width * height * 2);
  let head = 0, tail = 0;

  const enqueue = (x, y) => {
    const idx = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    if (visited[idx]) return;
    if (!isWhite(x, y)) return;
    visited[idx] = 1;
    data[idx * channels + 3] = 0; // 透明化
    queue[tail++] = x;
    queue[tail++] = y;
  };

  // 4辺をシードに
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

  // BFS
  while (head < tail) {
    const x = queue[head++];
    const y = queue[head++];
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  const out = outputPath || inputPath;
  await sharp(Buffer.from(data), { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(out + '.tmp');
  fs.renameSync(out + '.tmp', out);

  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`✅ ${path.basename(out)}: ${kb}KB (透過PNG)`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--all-case001')) {
    const dir = path.join(__dirname, '..', 'public', 'images', 'characters');
    const emotions = ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'];
    for (const e of emotions) {
      const p = path.join(dir, `case_001_${e}.png`);
      if (fs.existsSync(p)) await removeWhiteBg(p, p);
      else console.log(`⚠️  見つかりません: case_001_${e}.png`);
    }
    return;
  }

  if (args.length === 0) {
    console.log('使い方: node scripts/remove-white-bg.js <input.png> [output.png]');
    console.log('        node scripts/remove-white-bg.js --all-case001');
    process.exit(1);
  }

  await removeWhiteBg(args[0], args[1]);
}

main().catch(console.error);
