#!/usr/bin/env node
/**
 * 画像圧縮ツール
 *
 * 使い方: node scripts/compress-images.js [--dry-run]
 *
 * 種別ごとの処理:
 *   characters/  PNG 512px圧縮（透過保持）
 *   backgrounds/ raw/の1024x1024 PNG → 16:9センタークロップ → 800x450 JPEG
 *   evidence/    PNG 300px圧縮（case_001/, case_002/ サブディレクトリ対応）
 *   intro/       PNG 480px圧縮 → JPEG変換（raw/からregenerate）
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = path.join(__dirname, '..', 'public', 'images');

function formatKB(bytes) { return (bytes / 1024).toFixed(0) + 'KB'; }
function formatRatio(a, b) { return ((b / a) * 100).toFixed(0) + '%'; }

// ─── 背景: rawから16:9クロップ→JPEG再生成 ───────────────────────────
async function processBackgrounds() {
  const rawDir = path.join(ROOT, 'backgrounds', 'raw');
  const outDir = path.join(ROOT, 'backgrounds');
  if (!fs.existsSync(rawDir)) { console.log('  ⚠️  backgrounds/raw/ なし'); return { count: 0, savedBytes: 0 }; }

  const raws = fs.readdirSync(rawDir).filter(f => /^case_\d{3}_interrogation_raw\.png$/.test(f));
  let count = 0, savedBytes = 0;

  for (const rawFile of raws) {
    const caseId = rawFile.replace('_interrogation_raw.png', '');
    const rawPath = path.join(rawDir, rawFile);
    const outPath = path.join(outDir, `${caseId}_interrogation.jpg`);

    const before = fs.existsSync(outPath) ? fs.statSync(outPath).size : fs.statSync(rawPath).size;
    if (!DRY_RUN) {
      const meta = await sharp(rawPath).metadata();
      const cropH = Math.round(meta.width * 9 / 16);
      const top = Math.round((meta.height - cropH) / 2);
      await sharp(rawPath)
        .extract({ left: 0, top, width: meta.width, height: cropH })
        .resize({ width: 800 })
        .jpeg({ quality: 82 })
        .toFile(outPath);
    }
    const after = DRY_RUN ? before : fs.statSync(outPath).size;
    savedBytes += before - after;
    console.log(`  ✅ ${caseId}_interrogation.jpg: ${formatKB(before)} → ${formatKB(after)} (${formatRatio(before, after)})`);
    count++;
  }
  return { count, savedBytes };
}

// ─── PNG圧縮（characters / evidence / intro）─────────────────────────
async function compressPng(srcPath, width) {
  const tmp = srcPath + '.tmp';
  await sharp(srcPath).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(tmp);
  fs.renameSync(tmp, srcPath);
}

async function processPngDir(srcDir, rawDir, pattern, width, autoBackup, rawSuffix, label) {
  if (!fs.existsSync(srcDir)) return { count: 0, savedBytes: 0 };
  if (autoBackup && rawDir && !DRY_RUN) fs.mkdirSync(rawDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter(f => pattern.test(f));
  let count = 0, savedBytes = 0;

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const before = fs.statSync(srcPath).size;

    if (autoBackup && rawDir) {
      const ext = path.extname(file);
      const rawFile = path.basename(file, ext) + (rawSuffix || '') + ext;
      const rawPath = path.join(rawDir, rawFile);
      if (!fs.existsSync(rawPath) && !DRY_RUN) { fs.copyFileSync(srcPath, rawPath); console.log(`  💾 ${label}/raw/${rawFile}`); }
    }

    if (!DRY_RUN) await compressPng(srcPath, width);
    const after = DRY_RUN ? before : fs.statSync(srcPath).size;
    savedBytes += before - after;
    console.log(`  ✅ ${label}/${file}: ${formatKB(before)} → ${formatKB(after)} (${formatRatio(before, after)})`);
    count++;
  }
  return { count, savedBytes };
}

// ─── intro: raw/から480px JPEG再生成 ─────────────────────────────────
async function processIntros() {
  const rawDir = path.join(ROOT, 'intro', 'raw');
  const outDir = path.join(ROOT, 'intro');
  if (!fs.existsSync(rawDir)) { console.log('  ⚠️  intro/raw/ なし'); return { count: 0, savedBytes: 0 }; }

  const raws = fs.readdirSync(rawDir).filter(f => /^case_\d{3}_intro_raw\.png$/.test(f));
  let count = 0, savedBytes = 0;

  for (const rawFile of raws) {
    const caseId = rawFile.replace('_intro_raw.png', '');
    const rawPath = path.join(rawDir, rawFile);
    const outPath = path.join(outDir, `${caseId}_intro.jpg`);
    const pngPath = path.join(outDir, `${caseId}_intro.png`);

    const refPath = fs.existsSync(outPath) ? outPath : (fs.existsSync(pngPath) ? pngPath : rawPath);
    const before = fs.statSync(refPath).size;
    if (!DRY_RUN) {
      await sharp(rawPath).resize({ width: 480 }).jpeg({ quality: 82 }).toFile(outPath);
      if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath); // 旧PNG削除
    }
    const after = DRY_RUN ? before : fs.statSync(outPath).size;
    savedBytes += before - after;
    console.log(`  ✅ ${caseId}_intro.jpg: ${formatKB(before)} → ${formatKB(after)} (${formatRatio(before, after)})`);
    count++;
  }
  return { count, savedBytes };
}

(async () => {
  console.log(`🖼️  画像圧縮ツール${DRY_RUN ? ' [DRY RUN]' : ''}\n`);
  let total = { count: 0, saved: 0 };

  const run = async (label, fn) => {
    console.log(`📂 ${label}`);
    const r = await fn();
    total.count += r.count;
    total.saved += r.savedBytes;
    if (r.count > 0) console.log(`  📊 小計: ${r.count}ファイル, ${((total.saved)/1024/1024).toFixed(2)}MB削減累計\n`);
    else console.log('  （変更なし）\n');
  };

  await run('characters/ → PNG 512px', () => processPngDir(
    path.join(ROOT, 'characters'), null,
    /^case_\d{3}_(normal|nervous|cornered|breaking|collapsed)\.png$/, 512, false, null, 'characters'
  ));

  await run('backgrounds/ → raw/から16:9 JPEG 800px再生成', processBackgrounds);

  // evidence: case_001/, case_002/ サブディレクトリ
  console.log('📂 evidence/ → PNG 300px (ケース別サブディレクトリ)');
  const evidenceDir = path.join(ROOT, 'evidence');
  const subdirs = fs.existsSync(evidenceDir)
    ? fs.readdirSync(evidenceDir).filter(f => fs.statSync(path.join(evidenceDir, f)).isDirectory() && f !== 'raw')
    : [];
  for (const sub of subdirs) {
    const r = await processPngDir(
      path.join(evidenceDir, sub), path.join(evidenceDir, 'raw', sub),
      /^ev_[\w]+\.png$/, 300, true, '_raw', `evidence/${sub}`
    );
    total.count += r.count; total.saved += r.savedBytes;
  }
  console.log('');

  await run('intro/ → raw/から JPEG 480px再生成', processIntros);

  console.log(`✅ 完了: ${total.count}ファイル処理、合計 ${(total.saved/1024/1024).toFixed(2)}MB 削減`);
  if (DRY_RUN) console.log('\n（--dry-run モード: ファイルは変更されていません）');
})();
