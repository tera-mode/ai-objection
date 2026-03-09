# ai-objection 画像デザイン標準ガイド

> **このドキュメントは画像制作のすべての規格・ワークフローを一元管理します。**
> `evidence_icon_workflow.md` の内容はこのドキュメントに統合されています。

---

## 0. 全体方針

### スタイル
- **逆転裁判風・日本アニメコミック調**：太い黒縁、セルシェーディング、フラットな鮮やかな色使い
- **コミカルで誇張された表情**：リアル寄りではなく、感情が分かりやすい漫画的デフォルメ
- **ハイコントラスト**：縮小表示でも内容が識別できること

### ⚠️ 重要：文字を絶対に入れない
Gemini Image は指示なしに謎の文字・ロゴ・ラベルを描き込む場合がある。
すべてのプロンプトに必ず以下を含めること：

```
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana
```

### UIレイアウトとの対応（スマホ基準）
| 画像種別 | 表示箇所 | 表示サイズ |
|----------|----------|------------|
| キャラクター | 尋問画面上部 `h-[35vh]` | 幅最大448px × 高さ35vh（≒295px） |
| 背景 | 尋問画面・キャラクター背後 | 同上（`object-cover`） |
| 証拠アイコン | 証拠モーダル一覧 | 最大96×96px |
| イントロ | 事件現場ページ | 最大448px幅 |

---

## 1. 画像種別ごとの仕様

### 1-1. キャラクター画像（容疑者）

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/characters/{caseId}_{emotion}.png` |
| 保存先（原画） | `public/images/characters/raw/{caseId}_{emotion}_raw.png` |
| 生成サイズ | **1024 × 1024 px**（正方形） |
| フォーマット | PNG（背景透過） |
| 切り取り範囲 | **上半身のみ**（頭頂〜胸〜腰あたりまで。足は不要） |
| 背景除去 | **必須**：remove.bg で白抜き → PNG透過保存 |
| 感情バリアント | normal / nervous / cornered / breaking / collapsed（5種） |

#### 感情ごとの表情ガイド
| emotion | 状態 | 表情・仕草のヒント |
|---------|------|-------------------|
| `normal` | 冷静（コヒーレンス80〜） | 自信ある表情、笑顔or毅然と |
| `nervous` | やや動揺（55〜79） | 目線が泳ぐ、額に汗、引きつった笑い |
| `cornered` | 動揺（30〜54） | 目が見開かれる、口元が歪む、青ざめ |
| `breaking` | 取り乱し中（10〜29） | 崩れた表情、歯を食いしばる、髪が乱れる |
| `collapsed` | 崩壊寸前（0〜9） | 涙、目が虚ろ、完全な崩壊 |

#### 背景除去ワークフロー

**ステップ1: Gemini edit_image で除去（Claude Code 内で完結）**
```
edit_image prompt: "Remove the white background completely and make it fully transparent. Keep only the character illustration with clean edges. Output as PNG with transparency."
```
- 入力: `characters/raw/{caseId}_{emotion}_raw.png`
- 出力: `characters/{caseId}_{emotion}.png`

⚠️ **edit_image は `hasAlpha:false`（透過なし）の PNG を出力する場合がある。**

**ステップ2: remove-white-bg スクリプトで確実に透過化**
```bash
# 特定ケースの全感情を一括処理
node scripts/remove-white-bg.js --all-case001

# 単一ファイル
node scripts/remove-white-bg.js public/images/characters/case_001_normal.png
```
- 画像エッジから白・近似白ピクセルをフラッドフィルで検出し透過にする
- キャラクター本体内の白（目・歯など）は端に接触しないため保持される
- 処理後に `hasAlpha:true` であることを確認すること

**方法B: remove.bg（最高精度が必要な場合）**
1. `characters/raw/{caseId}_{emotion}_raw.png` を [remove.bg](https://www.remove.bg/) にアップロード
2. 透過PNGでダウンロード → `characters/{caseId}_{emotion}.png` に配置
3. `node scripts/remove-white-bg.js` は不要

#### キャラクター生成プロンプトテンプレート
```
Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration,
bold black outlines, flat vibrant colors, upper body only (head to waist),
[CHARACTER_DESCRIPTION], [EMOTION_DESCRIPTION],
plain white background (for background removal),
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration
```

---

### 1-2. 背景画像（尋問室）

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/backgrounds/{caseId}_interrogation.jpg` |
| 保存先（原画） | `public/images/backgrounds/raw/{caseId}_interrogation_raw.png` |
| 生成サイズ | **1024 × 1024 px**（Gemini の出力サイズ） |
| ゲーム用サイズ | **800 × 450 px JPEG**（compress-images.js が自動生成） |
| フォーマット | 原画: PNG → ゲーム用: **JPEG**（透過不要のため） |
| 用途 | `object-cover object-top`でキャラクター背後に表示 |

#### ⚠️ 黒枠・レターボックス禁止
Gemini は指示がないと映像風の黒枠（レターボックス）を入れる場合がある。
プロンプトに必ず以下を含めること：
```
full frame edge-to-edge illustration filling entire canvas including all corners and edges,
absolutely NO letterbox NO black bars NO borders NO vignette on edges
```

#### 背景生成プロンプトテンプレート
```
Anime Ace Attorney visual novel style, Japanese courtroom drama interior,
bold black outlines, cel-shaded, [CASE_SPECIFIC_SETTING],
moody atmosphere, [LIGHTING_DESCRIPTION],
wide establishing shot, no characters, only environment,
full frame edge-to-edge illustration filling entire canvas including all corners and edges,
absolutely NO letterbox NO black bars NO borders NO vignette on edges,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration
```

#### 処理フロー
1. Gemini で 1024×1024 PNG を生成
2. `backgrounds/raw/{caseId}_interrogation_raw.png` に保存
3. `node scripts/compress-images.js` を実行 → 自動で 800×450 JPEG に変換・保存

---

### 1-3. 証拠アイコン

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/evidence/{caseId}/{evidence_id}.png` |
| 保存先（原画） | `public/images/evidence/raw/{caseId}/{evidence_id}_raw.png` |
| 生成サイズ | **512 × 512 px** |
| フォーマット | PNG（透過推奨） |
| evidence_id | `case_XXX.json` の `evidence[].id` と一致させること |

#### 証拠アイコン生成プロンプトテンプレート
```
Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines,
flat vibrant colors, [OBJECT DESCRIPTION], [CASE-SPECIFIC ATMOSPHERE],
centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
512x512, clean illustration
```

---

### 1-4. イントロ画像（事件現場）

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/intro/{caseId}_intro.jpg` |
| 保存先（原画） | `public/images/intro/raw/{caseId}_intro_raw.png` |
| 生成サイズ | **1024 × 1024 px**（Gemini の出力サイズ） |
| ゲーム用サイズ | **480px幅 JPEG**（compress-images.js が自動生成） |
| フォーマット | 原画: PNG → ゲーム用: **JPEG** |

---

## 2. raw/ フォルダ規則

```
public/images/
├── characters/
│   ├── case_001_normal.png        ← ゲーム用（圧縮済み・背景透過）
│   ├── case_001_nervous.png
│   └── raw/
│       ├── case_001_normal_raw.png    ← remove_bg前の原画（編集禁止）
│       └── case_001_nervous_raw.png
├── backgrounds/
│   ├── case_001_interrogation.png ← ゲーム用（圧縮済み）
│   └── raw/
│       └── case_001_interrogation_raw.png ← 生成原画（編集禁止）
├── evidence/
│   ├── case_001/
│   │   └── ev_diary.png           ← ゲーム用（圧縮済み）
│   ├── case_002/
│   │   └── ev_checklist.png
│   └── raw/
│       ├── case_001/
│       │   └── ev_diary_raw.png   ← 生成原画（編集禁止）
│       └── case_002/
│           └── ev_checklist_raw.png
└── intro/
    ├── case_001_intro.png         ← ゲーム用（圧縮済み）
    └── raw/
        └── case_001_intro_raw.png ← 生成原画（編集禁止）
```

**raw/ フォルダ内のファイルは編集・削除禁止。** 再生成が必要になったときの参照原画。

---

## 3. 画像圧縮ワークフロー

### 圧縮ツールの実行
```bash
node scripts/compress-images.js
```

圧縮ターゲット（現状の約1/3サイズ）：

| 種別 | 出力形式 | 出力サイズ | 実測ファイルサイズ |
|------|----------|-----------|------------------|
| キャラクター | PNG透過 512px | 512×512 | 約250〜330KB |
| 背景 | **JPEG** 800px | 800×450（16:9） | **約60〜70KB** |
| 証拠アイコン | PNG 300px | 300×300 | 約60〜160KB |
| イントロ | **JPEG** 480px | 480px幅 | **約30〜45KB** |

### 手順
1. 画像を生成・加工してゲーム用フォルダに配置
2. `node scripts/compress-images.js` を実行
3. raw/ へのバックアップと圧縮が自動で行われる
4. ブラウザで確認
5. `git add public/images/ && git commit -m "assets: ..."` でコミット

---

## 4. ケース別プロンプト集

### case_001「ひだまり動物病院の夜」

#### 容疑者：遊上 蓮（ゆがみ れん）27歳

**キャラクター基本設定：**
- 細身・175cm、**ダークネイビーのスクラブ（獣医助手の作業着・Vネック）**、黒髪マッシュショート（前髪が眉にかかる）
- 整った顔立ち、切れ長の目、通った鼻筋、薄い唇
- 笑顔は好印象だが、目の奥が暗い
- ⚠️ 白衣は使わない（白背景で背景除去処理すると服ごと抜けるため）
- ⚠️ プロンプトに必ず `UPPER BODY ONLY tightly framed from head to chest NO legs NO feet` を含める

**各感情のプロンプト：**

| emotion | プロンプト |
|---------|-----------|
| `normal` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), young Japanese male age 27, lean build, dark navy blue veterinary scrubs top (V-neck medical scrub shirt), short black hair with soft fringe covering eyebrows (messy undercut style), sharp almond eyes, clean handsome face, confident gentle smile with slight unease deep in eyes, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `nervous` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), young Japanese male age 27, lean build, dark navy blue veterinary scrubs top (V-neck medical scrub shirt), short black hair with soft fringe, sharp eyes slightly averted and darting, sweat drop on forehead, forced smile starting to crack, slight blush on cheeks, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `cornered` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), young Japanese male age 27, lean build, dark navy blue veterinary scrubs top (V-neck medical scrub shirt), short black hair, wide alarmed eyes pupils dilated, jaw clenched, face visibly paler, mouth twisted, clearly shaken expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `breaking` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), young Japanese male age 27, lean build, dark navy blue veterinary scrubs top wrinkled and disheveled, short black hair messy and disheveled, eyes wild and unhinged, teeth gritted, red scratch mark on left forearm visible, emotional breakdown expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `collapsed` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), young Japanese male age 27, lean build, dark navy blue veterinary scrubs top completely disheveled, short black hair very messy, tears streaming down face, eyes hollow and distant, mouth open in anguish, complete mental collapse expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |

**背景（尋問室）プロンプト：**
```
"Anime Ace Attorney visual novel style, Japanese courtroom drama, bold black outlines, cel-shaded,
animal hospital waiting room repurposed as interrogation space,
warm orange practical lamp light, wooden furniture, pet drawings on wall visible,
moody night atmosphere, dark shadows with orange warm light accents,
wide establishing shot, no characters, only environment,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x640, clean illustration"
```

**証拠アイコン（case_001）：**

| evidence_id | プロンプト |
|-------------|-----------|
| `ev_diary` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, old brown leather diary journal with worn corners, warm amber interior lighting atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_letters` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, stack of anonymous white envelopes sealed and tied together, mysterious threatening atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_scratch` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, close-up of a forearm with red claw scratch marks, forensic medical illustration style, plain background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_neighbor` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, residential house window at night with warm interior light silhouette of elderly person looking out, witness testimony theme, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |

---

### case_002「碧海水族館の夜」

#### 容疑者：永瀬 達也（ながせ たつや）

**キャラクター基本設定：**
- ネイビースーツ、黒縁眼鏡、清潔感のあるビジネスマン
- 丁寧で信頼できる見た目、実は内側に秘密を持つ

**各感情のプロンプト：**

| emotion | プロンプト |
|---------|-----------|
| `normal` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), Japanese male businessman in his 40s, neat navy blue suit with white shirt and dark tie, black-framed rectangular glasses, short tidy dark hair, composed polite expression with confident businessman smile, slightly too smooth and rehearsed manner, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `nervous` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), Japanese businessman in navy suit and black-framed glasses, hand raised to adjust glasses on nose, slight nervous sweat, maintaining overly formal smile that is starting to crack, eyes avoiding direct gaze, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `cornered` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), Japanese businessman in disheveled navy suit, glasses askew, visible flop sweat, clenched teeth behind maintained professional facade, eyes darting nervously, pale face, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `breaking` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), Japanese businessman in very disheveled suit tie loosened, glasses cracked or hanging off, wild desperate eyes, trembling shoulders, mask slipping showing rage underneath, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `collapsed` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, upper body only (head to waist), Japanese businessman completely fallen apart, suit jacket open and wrinkled, glasses removed and holding them limply, dead hollow eyes with dark circles, jaw slack, defeated broken expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |

**背景（尋問室）プロンプト：**
```
"Anime Ace Attorney visual novel style, Japanese courtroom drama, bold black outlines, cel-shaded,
police interrogation room with dark teal aquarium-like glass panel in background,
deep blue atmospheric lighting reminiscent of aquarium depths,
steel desk chair visible, minimal sparse setting, oppressive atmosphere,
wide establishing shot, no characters, only environment,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x640, clean illustration"
```

**証拠アイコン（case_002）：**

| evidence_id | プロンプト |
|-------------|-----------|
| `ev_checklist` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, handwritten clipboard checklist with pencil check marks on paper, dark teal aquarium atmosphere background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_id_log` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, electronic keycard swipe terminal screen glowing cyan, dark aquarium corridor atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_camera` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, security camera surveillance monitor showing grainy static footage, dark atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_director` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, folded official document with large red ink stamp circle, dark moody background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_bribery` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, contract paper with signature handwriting marks and wax seal, partially in shadow, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_autopsy` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, autopsy report clipboard with simple body silhouette outline diagram drawn on paper, dark background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_emergency_exit` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, emergency exit door sensor panel with glowing red warning light and green indicator, dark aquarium corridor, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |

---

## 5. 生成手順（標準フロー）

### キャラクター画像
1. 上記プロンプトで `mcp__gemini-image__generate_image` を実行
2. `public/images/characters/raw/{caseId}_{emotion}_raw.png` に保存
3. [remove.bg](https://www.remove.bg/) で背景除去
4. `public/images/characters/{caseId}_{emotion}.png` に保存
5. `node scripts/compress-images.js` で圧縮

### 背景・証拠・イントロ画像
1. 上記プロンプトで `mcp__gemini-image__generate_image` を実行
2. 該当フォルダに配置
3. `node scripts/compress-images.js` で圧縮（自動で raw/ バックアップ作成）

### ツールのファイル名注意
Gemini Image ツールが `_1` サフィックスを付けて保存することがある：
```bash
mv public/images/characters/case_001_normal_1.png public/images/characters/raw/case_001_normal_raw.png
```

---

## 6. カラーパレット

| 用途 | HEX |
|------|-----|
| UI背景 | `#030712`（gray-950） |
| アクセント | `#22d3ee`（cyan-400） |
| 証拠背景（デフォルト） | `#1a1f2e` |
| case_001（病院・夜） | 暗いオレンジ、ブルーグレー、黒 |
| case_002（水族館） | 深海ブルー、水中照明シアン |

---

## 7. プレースホルダー仕様

画像が存在しない場合：
- **キャラクター**: 人型シルエット（グレー）が自動表示
- **証拠アイコン**: ドキュメントアイコン（グレー）が自動表示
- **背景**: なし（UI背景色のみ）

開発中・未作成の画像はそのまま放置してよい。
