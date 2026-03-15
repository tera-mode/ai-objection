# ai-objection 画像デザイン標準ガイド

> **このドキュメントは画像制作のすべての規格・ワークフローを一元管理します。**
> `evidence_icon_workflow.md` の内容はこのドキュメントに統合されています。

---

## 0. 全体方針

### ⚠️ 最重要：画像生成前チェックリスト

**キャラクター画像を生成する前に必ず確認すること：**

1. `public/images/` 以下に既存画像がないか確認する
2. 既存キャラクターの一覧（以下）と照合する
3. 既存画像がある場合は**絶対に再生成しない**

**既存キャラクター画像マップ（イベントモード用）：**

| キャラクター | パス | 使用可能感情 |
|------------|------|------------|
| なの（南出なの） | `/images/characters/nano/event_normal.png` | normal（上半身トリミング済み） |
| なの（南出なの） | `/images/characters/nano/event_surprise.png` | 驚き（上半身トリミング済み） |
| なの（南出なの） | `/images/characters/nano/event_tsukkomi.png` | ツッコミ（上半身トリミング済み） |
| なの（南出なの） | `/images/characters/nano/event_determined.png` | 決意（上半身トリミング済み） |
| トイマル | `/images/characters/toimaru/event_normal.png` | normal（全身・トリミング不要） |
| トイマル | `/images/characters/toimaru/event_happy.png` | 喜び（全身・トリミング不要） |
| トイマル | `/images/characters/toimaru/event_confused.png` | 困惑（全身・トリミング不要） |

**新規キャラクターの生成先：**
`public/images/characters/{caseId}/{emotion}.png`（例: `characters/case_001/normal.png`）

---

### 画像生成ツール

| 用途 | ツール | 理由 |
|------|--------|------|
| キャラクター normal 画像（初回のみ） | **Stability AI** `generate_image` | 高品質な初期デザイン生成 |
| キャラクター variation（2枚目以降の感情差分） | **Gemini** `edit_image` | normal を下敷きにすることで造詣・衣装・体型を維持できる |
| イントロ画像 | **Stability AI** `generate_image` | 背景シーンの高品質生成 |
| 背景画像（尋問室） | **Stability AI** `generate_image` | 同上 |
| イベント背景画像 | **Stability AI** `generate_image` | 同上 |
| 証拠アイコン | **Stability AI** `generate_image` | 同上 |
| 背景除去 | **Stability AI** `remove_background` | 精度が高くエッジが綺麗 |

**Gemini `edit_image` を variation に使う理由：**
Stability AI で感情ごとに別々にテキスト生成すると毎回顔つき・体型・目の色がブレ、5枚が別人になる。
Gemini `edit_image` は元画像のスタイル・構造を参照して編集するため、同一人物感を維持しやすい。
表情だけでなくポーズ変更も可能（手を上げる、後ずさりする等）。

### スタイル（用途別）

**尋問モード（case_XXX）：逆転裁判風**
- 太い黒縁、セルシェーディング、フラットな鮮やかな色使い
- コミカルで誇張された表情
- ハイコントラスト：縮小表示でも識別できること

**イベントモード（prologue・ストーリー演出）：ライトアニメビジュアルノベル風**
- なの・トイマルの既存画像スタイルに統一すること
- 細い輪郭線、ソフトなセルシェーディング、淡く柔らかい配色
- 全身立ち絵（足元まで描く）
- 白背景で生成（背景除去のため）
- **参照必須**：`nano_event_normal.png`・`toimaru_event_normal.png` を見て同じ画風で作ること

⚠️ **尋問モードとイベントモードで画風を混在させない**

### ⚠️ 重要：文字を絶対に入れない
画像生成 AI は指示なしに謎の文字・ロゴ・ラベルを描き込む場合がある。
**看板・衣装・書類・背景の装飾にも無断で文字を入れる。** すべてのプロンプトに必ず以下を含めること：

```
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana
```

### ⚠️ 重要：キャラクター5感情は「同一人物」として生成する
5つの emotion（normal / nervous / cornered / breaking / collapsed）は、**同一のキャラクター設定文を基盤にして、感情部分だけを変える**こと。
プロンプトを感情ごとにバラバラに書くと、別人が出力される。

**正しい構成：**
```
[共通キャラクター設定] + EMOTION: [感情の説明]
```

例：霧隠煙太郎の場合、以下をすべての感情で共通して使用する
```
Japanese male age 35 medium build slightly slouched, oval face upward-slanting eyes tsurime,
black hair with bangs peeking out from under black ninja hood cowl,
wearing complete black ninja uniform costume with hood,
special utility belt at waist with three small rectangular metal box devices clipped on
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
| 保存先（ゲーム用） | `public/images/characters/{caseId}/{emotion}.png` |
| 保存先（原画） | `public/images/characters/{caseId}/raw/{caseId}_{emotion}_raw.png` |
| 生成サイズ | **1024 × 1024 px**（正方形） |
| フォーマット | PNG（背景透過） |
| 切り取り範囲 | **上半身のみ**（頭頂〜胸〜腰あたりまで。足は不要） |
| 背景 | **白背景**で生成（透過処理のため） |
| 背景除去 | **必須**：remove-white-bg スクリプト or remove.bg |
| 感情バリアント | normal / nervous / cornered / breaking / collapsed（5種） |

#### ⚠️ 上半身のみ・フレーミング指定
全身（足まで）が出力されるとキャラクターが小さくなり、ゲーム画面での表示インパクトが失われる。
プロンプトに必ず以下を含めること：

```
UPPER BODY ONLY tightly framed from head to chest NO legs NO feet
```

#### 感情ごとの表情ガイド
| emotion | 状態 | 表情・仕草のヒント |
|---------|------|-------------------|
| `normal` | 冷静（コヒーレンス80〜） | 自信ある表情、笑顔or毅然と |
| `nervous` | やや動揺（55〜79） | 目線が泳ぐ、額に汗、引きつった笑い |
| `cornered` | 動揺（30〜54） | 目が見開かれる、口元が歪む、青ざめ |
| `breaking` | 取り乱し中（10〜29） | 崩れた表情、歯を食いしばる、髪が乱れる |
| `collapsed` | 崩壊寸前（0〜9） | 涙、目が虚ろ、完全な崩壊 |

#### 背景除去ワークフロー

**方法A（推奨）: Stability AI `remove_background`**
- Stability AI MCP サーバーの `remove_background` を使う
- 入力: `characters/raw/{caseId}_{emotion}_raw.png`
- 出力先: `characters/{caseId}_{emotion}.png`
- 白背景で生成した raw を渡すだけで OK。精度が高く、エッジが綺麗
- **Gemini の `edit_image` よりも圧倒的に品質が良い**

**方法B: remove-white-bg スクリプト（Stability AI が使えない場合）**
```bash
# characters/ に raw ファイルをコピーしてからスクリプトを適用
cp public/images/characters/raw/case_003_normal_raw.png public/images/characters/case_003_normal.png
# …全感情分コピー後…

# 特定ケースの全感情を一括処理
node scripts/remove-white-bg.js --all-case003

# 単一ファイル
node scripts/remove-white-bg.js public/images/characters/case_001_normal.png
```
- 画像エッジから白・近似白ピクセルをフラッドフィルで検出し透過にする
- キャラクター本体内の白（目・歯など）は端に接触しないため保持される

**方法C: remove.bg（最高精度が必要な場合）**
1. `characters/raw/{caseId}_{emotion}_raw.png` を [remove.bg](https://www.remove.bg/) にアップロード
2. 透過PNGでダウンロード → `characters/{caseId}_{emotion}.png` に配置

> ⛔ **Gemini `edit_image` での背景除去は使用禁止**
> alpha=0 / RGB=0,0,0 変換による残渣が remove-white-bg.js と相性が悪い。

#### キャラクター生成プロンプトテンプレート
```
Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration,
bold black outlines, flat vibrant colors,
UPPER BODY ONLY tightly framed from head to chest NO legs NO feet,
[CHARACTER_BASE_DESCRIPTION（全感情で共通）],
EMOTION: [EMOTION_DESCRIPTION（感情ごとに変える）],
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

#### ⚠️ 透過背景（チェック柄）が出力された場合
ビューワーでグレー/白のチェック柄に見える場合、Gemini が透明背景で出力している。
背景画像は必ず**不透明なソリッドな画像**が必要。以下を対処する：
- プロンプトに `solid opaque background, no transparency` を追加して再生成
- または `edit_image` で `"Fill the transparent/checkered background with the appropriate environment colors. Make the background fully opaque."` と指示して修正

#### 背景生成プロンプトテンプレート
```
Anime Ace Attorney visual novel style, Japanese courtroom drama interior,
bold black outlines, cel-shaded, [CASE_SPECIFIC_SETTING],
moody atmosphere, [LIGHTING_DESCRIPTION],
wide establishing shot, no characters, only environment,
solid opaque background,
full frame edge-to-edge illustration filling entire canvas including all corners and edges,
absolutely NO letterbox NO black bars NO borders NO vignette on edges,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration
```

#### 処理フロー
1. Gemini で 1024×1024 PNG を生成 → `backgrounds/raw/{caseId}_interrogation_raw.png` に保存
2. `node scripts/compress-images.js` を実行 → 自動で 800×450 JPEG に変換・保存

---

### 1-2b. イベントモード キャラクター立ち絵

**尋問モードのキャラとは別物。** 以下の仕様で管理する。

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/characters/{characterId}/{emotion}.png` |
| 保存先（原画） | `public/images/characters/{characterId}/raw/{characterId}_{emotion}_raw.png` |
| 生成サイズ | **768×1024px**（縦長 3:4。全身が入るサイズ） |
| フォーマット | PNG（背景透過） |
| 切り取り範囲 | **上半身**（お腹から上。トイマルのみ全身OK） |
| 背景 | **白背景**で生成（透過処理のため） |
| 背景除去 | 必須：Stability AI `remove_background` |
| 画風 | なの・トイマルの既存画像スタイルに合わせること |
| アスペクト比指定 | Stability AI の `aspectRatio: "3:4"` または `"2:3"` を使う |

#### ⚠️ 上半身トリミング手順
全身で生成→背景除去→Sharpでピクセルクロップ の順で行う。Geminiでのクロップは不正確なため使わない。

```bash
# Node.js (sharp) でクロップ例
node -e "
const sharp = require('sharp');
sharp('src.png').metadata().then(m =>
  sharp('src.png').extract({ left: 0, top: 0, width: m.width, height: Math.floor(m.height * 0.62) }).toFile('dst.png')
);
"
```

**クロップ比率の目安（上から何%を残すか）：**
| キャラクター種別 | 目安 |
|----------------|------|
| 人間・標準体型 | 約58〜62% |
| 手が画面内に見えてしまうキャラ | 手が見えなくなるまで下げる（60%以下） |
| トイマル（全身OK） | クロップ不要 |

> クロップ後に背景除去済みの場合は再除去不要。rawからクロップした場合は再度 `remove_background` を実行すること。

#### 感情バリアント（イベントキャラ）
| emotion | 説明 |
|---------|------|
| `normal` | 通常・デフォルト（Stability AIで生成） |
| `surprised` / `happy` / `sad` 等 | Gemini `edit_image` で normal から作る |

#### ⚠️ イベントキャラ生成プロンプトテンプレート
```
Soft anime visual novel character sprite style, light cel-shading, thin clean outlines,
pastel vibrant colors, full body standing pose head to toe visible,
[CHARACTER_DESCRIPTION],
EMOTION: [EMOTION],
plain white background (for background removal),
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
clean anime illustration
```

#### キャラクター別設定

**ガメ吉（がめきち）— ミニケース犯人**
- 30代。ガタイがいい。ヒゲ面。目つきが悪い悪そうな顔つき
- **かっこよくしない。完全な悪役面。主人公的な整った顔立ちは絶対に使わない**
- 中世ファンタジー風の粗末な革ベスト、汚れた麻のシャツ、腕まくり
- 手に果汁のシミ（茶色いシミ）

ガメ吉プロンプト（共通ベース）:
```
Soft anime visual novel character sprite style, light cel-shading, thin clean outlines,
flat vibrant colors, full body standing pose head to toe visible,
rough villainous man in his 30s, stocky muscular build, stubble beard, intimidating narrow squinting eyes,
ugly menacing face (NOT handsome), worn leather vest over dirty cream linen shirt with rolled up sleeves,
brown fruit juice stains on both hands, medieval fantasy setting,
plain white background (for background removal),
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
clean anime illustration
```

| emotion | 追記するEMOTION部分 |
|---------|-------------------|
| `smug` | `EMOTION: smug crooked grin, arms crossed, smug self-satisfied expression, narrowed eyes showing contempt` |
| `shaken` | `EMOTION: nervous sweating profusely, eyes wide open in panic, defensive posture, clearly caught` |
| `defeated` | `EMOTION: head hanging down in defeat, slouched shoulders, completely dejected, busted expression` |

**老婆モモばあ（果物商）**
- 60代の小柄な老婆。白髪をお団子にまとめている。エプロン姿
- 中世ファンタジー風の店主服
- **悪役ではない。おばあちゃんらしい温かみのある外見**

モモばあプロンプト（共通ベース）:
```
Soft anime visual novel character sprite style, light cel-shading, thin clean outlines,
flat vibrant colors, full body standing pose head to toe visible,
elderly woman in her 60s, short stature, white hair tied in a bun on top of head,
kind grandmother face, wearing apron over simple medieval peasant dress, market vendor appearance,
plain white background (for background removal),
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
clean anime illustration
```

| emotion | 追記するEMOTION部分 |
|---------|-------------------|
| `distressed` | `EMOTION: worried tearful face, eyebrows raised in distress, hands clasped together, about to cry` |

**衛兵（名無し）**
- 中世風の軽装鎧、槍を持つ。真面目そうだが困惑した顔

衛兵プロンプト（共通ベース）:
```
Soft anime visual novel character sprite style, light cel-shading, thin clean outlines,
flat vibrant colors, full body standing pose head to toe visible,
medieval fantasy guard soldier, young man, wearing simple light chainmail armor with open-face helmet,
holding a long spear, dutiful serious expression,
plain white background (for background removal),
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
clean anime illustration
```

| emotion | 追記するEMOTION部分 |
|---------|-------------------|
| `neutral` | `EMOTION: neutral serious expression, standing at attention, slightly confused look` |

#### イベント背景画像

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/events/{scene_name}.webp` |
| 保存先（原画） | `public/images/events/raw/{scene_name}_raw.png` |
| 生成サイズ・アスペクト比 | `aspectRatio: "9:16"`（スマホ縦長） |
| フォーマット | WebP（ゲーム用）、PNG（原画） |
| 変換方法 | `sharp` で PNG → WebP, 540×960px に縮小 |

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

#### イントロ画像プロンプトのポイント
- 背景と同様に `full frame edge-to-edge` と `solid opaque background` を含めること
- 看板・のぼり・掲示物に文字が入りやすいので NO text フレーズを必ず入れること

---

## 2. フォルダ構造規則

```
public/images/
│
├── ui/                            ← LP・共通UI素材
│   ├── key_visual.webp
│   └── cutin_nande.webp
│
├── backgrounds/                   ← 尋問・イベント背景
│   ├── fantasy_bg.png
│   ├── case_001_interrogation.jpg
│   └── raw/
│
├── characters/
│   │  ※ 全キャラ共通：{characterId}/{emotion}.png 形式
│   │
│   ├── nano/                      ← イベントキャラ（変更禁止）
│   │   ├── event_normal.png
│   │   ├── event_surprise.png
│   │   ├── event_tsukkomi.png
│   │   ├── event_determined.png
│   │   └── raw/
│   ├── toimaru/                   ← イベントキャラ（変更禁止）
│   │   ├── event_normal.png
│   │   ├── event_happy.png
│   │   ├── event_confused.png
│   │   └── raw/
│   ├── gamekichi/                 ← ミニケースキャラ
│   │   ├── smug.png
│   │   ├── shaken.png
│   │   ├── defeated.png
│   │   └── raw/
│   ├── case_001/                  ← 尋問モードキャラ（caseId単位）
│   │   ├── normal.png
│   │   ├── nervous.png
│   │   ├── cornered.png
│   │   ├── breaking.png
│   │   ├── collapsed.png
│   │   └── raw/
│   │       └── case_001_normal_raw.png  ← 原画（変更禁止）
│   └── case_XXX/                  ← 以降同じ構造
│
├── backgrounds/
│   ├── case_001_interrogation.jpg ← 尋問背景（圧縮済み）
│   └── raw/
│       └── case_001_interrogation_raw.png
│
├── events/
│   ├── dark_alley.webp            ← イベント背景（圧縮済み）
│   ├── market_square.webp
│   └── raw/
│       ├── dark_alley_raw.png
│       └── market_square_raw.png
│
├── evidence/
│   ├── case_001/
│   └── raw/
│
└── intro/
    ├── case_001_intro.jpg
    └── raw/
```

**raw/ フォルダ内のファイルは編集・削除禁止。** 再生成が必要になったときの参照原画。

---

## 3. 画像圧縮ワークフロー

### 圧縮ツールの実行
```bash
node scripts/compress-images.js
```

圧縮ターゲット：

| 種別 | 出力形式 | 出力サイズ | 実測ファイルサイズ |
|------|----------|-----------|------------------|
| キャラクター | PNG透過 512px | 512×512 | 約160〜400KB |
| 背景 | **JPEG** 800px | 800×450（16:9） | **約30〜70KB** |
| 証拠アイコン | PNG 300px | 300×300 | 約60〜160KB |
| イントロ | **JPEG** 480px | 480px幅 | **約30〜55KB** |

### 手順
1. 画像を生成・背景除去してゲーム用フォルダに配置
2. 証拠画像は `raw/case_XXX/` から `evidence/case_XXX/` にコピー
3. `node scripts/compress-images.js` を実行
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

**各感情のプロンプト：**

| emotion | プロンプト |
|---------|-----------|
| `normal` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, young Japanese male age 27, lean build, dark navy blue veterinary scrubs top (V-neck medical scrub shirt), short black hair with soft fringe covering eyebrows (messy undercut style), sharp almond eyes, clean handsome face, EMOTION: confident gentle smile with slight unease deep in eyes, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `nervous` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, young Japanese male age 27, lean build, dark navy blue veterinary scrubs top (V-neck medical scrub shirt), short black hair with soft fringe covering eyebrows, sharp almond eyes, EMOTION: eyes slightly averted and darting, sweat drop on forehead, forced smile starting to crack, slight blush on cheeks, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `cornered` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, young Japanese male age 27, lean build, dark navy blue veterinary scrubs top (V-neck medical scrub shirt), short black hair, EMOTION: wide alarmed eyes pupils dilated, jaw clenched, face visibly paler, mouth twisted, clearly shaken expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `breaking` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, young Japanese male age 27, lean build, dark navy blue veterinary scrubs top wrinkled and disheveled, short black hair messy and disheveled, EMOTION: eyes wild and unhinged, teeth gritted, red scratch mark on left forearm visible, emotional breakdown expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `collapsed` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, young Japanese male age 27, lean build, dark navy blue veterinary scrubs top completely disheveled, short black hair very messy, EMOTION: tears streaming down face, eyes hollow and distant, mouth open in anguish, complete mental collapse expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |

**背景（尋問室）プロンプト：**
```
"Anime Ace Attorney visual novel style, bold black outlines, cel-shaded,
animal hospital waiting room repurposed as interrogation space,
warm orange practical lamp light, wooden furniture, dark shadowy corners,
moody night atmosphere, dark shadows with orange warm light accents,
wide establishing shot, no characters, only environment, solid opaque background,
full frame edge-to-edge illustration filling entire canvas including all corners and edges,
absolutely NO letterbox NO black bars NO borders NO vignette on edges,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration"
```

**証拠アイコン（case_001）：**

| evidence_id | プロンプト |
|-------------|-----------|
| `ev_camera` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, security camera surveillance monitor showing grainy footage, dark hospital night atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_diary` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, old brown leather diary journal with worn corners, warm amber interior lighting atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_letters` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, stack of anonymous white envelopes sealed and tied together, mysterious threatening atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_scratch` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, close-up of a forearm with red claw scratch marks, forensic medical illustration style, plain background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_neighbor` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, residential house window at night with warm interior light silhouette of elderly person looking out, witness testimony theme, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |

---

### case_002「碧海水族館の夜」

#### 容疑者：永瀬 達也（ながせ たつや）40代

**キャラクター基本設定：**
- ネイビースーツ、黒縁眼鏡、清潔感のあるビジネスマン
- 丁寧で信頼できる見た目、実は内側に秘密を持つ

**各感情のプロンプト：**

| emotion | プロンプト |
|---------|-----------|
| `normal` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male businessman in his 40s, neat navy blue suit with white shirt and dark tie, black-framed rectangular glasses, short tidy dark hair, EMOTION: composed polite expression with confident businessman smile, slightly too smooth and rehearsed manner, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `nervous` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male businessman in his 40s, navy blue suit with white shirt and dark tie, black-framed rectangular glasses, short tidy dark hair, EMOTION: hand raised to adjust glasses on nose, slight nervous sweat, maintaining overly formal smile that is starting to crack, eyes avoiding direct gaze, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `cornered` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male businessman in his 40s, disheveled navy suit, glasses askew, short dark hair, EMOTION: visible flop sweat, clenched teeth behind maintained professional facade, eyes darting nervously, pale face, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `breaking` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male businessman in his 40s, very disheveled suit tie loosened, glasses cracked or hanging off, dark hair slightly messed, EMOTION: wild desperate eyes, trembling shoulders, mask slipping showing rage underneath, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `collapsed` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male businessman in his 40s, suit jacket open and wrinkled, glasses removed and holding them limply, dark hair disheveled, EMOTION: dead hollow eyes with dark circles, jaw slack, defeated broken expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |

**背景（尋問室）プロンプト：**
```
"Anime Ace Attorney visual novel style, bold black outlines, cel-shaded,
police interrogation room with dark teal aquarium-like glass panel in background,
deep blue atmospheric lighting reminiscent of aquarium depths,
steel desk and chair visible, minimal sparse setting, oppressive atmosphere,
wide establishing shot, no characters, only environment, solid opaque background,
full frame edge-to-edge illustration filling entire canvas including all corners and edges,
absolutely NO letterbox NO black bars NO borders NO vignette on edges,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration"
```

**証拠アイコン（case_002）：**

| evidence_id | プロンプト |
|-------------|-----------|
| `ev_checklist` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, handwritten clipboard checklist with pencil check marks on paper, dark teal aquarium atmosphere background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_id_log` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, electronic keycard swipe terminal screen glowing cyan, dark aquarium corridor atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_camera` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, security camera surveillance monitor showing grainy static footage, dark atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_director` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, folded official document with large red ink stamp circle, dark moody background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_bribery` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, contract paper with handwriting marks and wax seal, partially in shadow, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_autopsy` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, autopsy report clipboard with simple body silhouette outline diagram drawn on paper, dark background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_emergency_exit` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, emergency exit door sensor panel with glowing red warning light and green indicator, dark aquarium corridor, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |

---

### case_003「忍びの里の閉園後に」

#### 容疑者：霧隠 煙太郎（きりがくれ えんたろう）35歳

**キャラクター基本設定（全感情共通）：**
- 35歳、中肉中背・やや猫背
- 面長、つり目（tsurime）、口元がよく動く
- 黒髪やや長め、前髪が目にかかる（頭巾からはみ出す）
- 黒の忍者装束（頭巾つき）、腰に煙幕装置ベルト（金属製小型ボックス3つ）
- ⚠️ 衣装に「霧」の一文字などを描かせないよう NO text を必ず入れること

**各感情のプロンプト：**

| emotion | プロンプト |
|---------|-----------|
| `normal` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male age 35 medium build slightly slouched, oval face upward-slanting eyes tsurime, black hair with bangs peeking out from under black ninja hood cowl, wearing complete black ninja uniform costume with hood, special utility belt at waist with three small rectangular metal box devices clipped on, EMOTION: confident smug grin showing visible canine teeth, relaxed self-assured mischievous look, eyes narrowed in pleased expression, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `nervous` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male age 35 medium build slightly slouched, oval face upward-slanting eyes tsurime, black hair with bangs peeking out from under black ninja hood cowl, wearing complete black ninja uniform costume with hood, special utility belt at waist with three small rectangular metal box devices clipped on, EMOTION: forced strained smile starting to crack, eyes darting sideways avoiding direct gaze, small sweat drop on forehead, visible nervousness behind maintained composure, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `cornered` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male age 35 medium build slightly slouched, oval face upward-slanting eyes tsurime, black hair with bangs peeking out from under black ninja hood cowl, wearing complete black ninja uniform costume with hood, special utility belt at waist with three small rectangular metal box devices clipped on, EMOTION: cornered alarmed wide eyes pupils dilated, smile completely gone, jaw clenched, face visibly paler, mouth twisted in distress, clearly shaken and panicked, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `breaking` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male age 35 medium build slightly slouched, oval face upward-slanting eyes tsurime, black hair with bangs now more visible as ninja hood is askew and partially fallen back, wearing disheveled black ninja uniform costume with hood pushed back revealing more hair, special utility belt at waist with three small rectangular metal box devices, EMOTION: breaking down wild desperate eyes gritted teeth emotional turmoil mask slipping, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |
| `collapsed` | `"Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration, bold black outlines, flat vibrant colors, UPPER BODY ONLY tightly framed from head to chest NO legs NO feet, Japanese male age 35 medium build slightly slouched, oval face upward-slanting eyes tsurime, messy black hair with bangs fully exposed as ninja hood is completely off and hanging, wearing very disheveled black ninja uniform costume with right sleeve showing reddish-brown dirt stain, special utility belt at waist with three small rectangular metal box devices, EMOTION: completely collapsed hollow vacant stare dark circles under eyes jaw slack total defeat tears in eyes all pretense gone exhausted broken, plain white background (for background removal), absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 1024x1024, clean illustration"` |

**背景（尋問室）プロンプト：**
```
"Anime Ace Attorney visual novel style, bold black outlines, cel-shaded,
interior of a dark wooden Japanese ninja theme park secret passage corridor after closing hours,
wooden plank walls and ceiling, rubber mat floor,
unlit paper lantern torches on walls, dim eerie atmosphere with deep shadows,
wooden suspension bridge structure visible in mid-background,
display of decorative ninja prop weapons on wall,
moody dark shadows with faint purple and red color tint from unlit spotlights,
wide establishing shot, no characters, only environment, solid opaque background,
full frame edge-to-edge illustration filling entire canvas including all corners and edges,
absolutely NO letterbox NO black bars NO borders NO vignette on edges,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration"
```

**イントロ画像プロンプト：**
```
"Anime cel-shaded scene illustration, Ace Attorney visual novel style,
bold black outlines, flat vibrant colors,
Japanese ninja theme park stone courtyard at early morning dawn,
wooden torii-style gate arch entrance, paving stones,
center of plaza stands a large 2-meter wooden karakuri automaton puppet
in chibi cute ninja style with big round cheerful carved eyes smiling wooden face,
red cloth headband tied around its head, gold ornament on chest,
right wooden arm raised holding wooden shuriken star frozen stuck mid-throw pose, lonely melancholy mood,
young male staff member in black ninja uniform stands nearby looking up at the frozen puppet
holding an open notebook manual,
soft warm golden dawn light long dramatic shadows,
solid opaque background, full frame edge-to-edge filling entire canvas,
absolutely NO letterbox NO black bars NO borders,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean anime illustration"
```

**証拠アイコン（case_003）：**

| evidence_id | プロンプト |
|-------------|-----------|
| `ev_camera` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, security surveillance CCTV monitor screen showing grainy night-vision footage of a wooden gate entrance with a dark figure in ninja costume exiting, dark ninja theme park atmosphere background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_witness` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, small child's crayon drawing style artwork showing a stick figure with white smoke puffs coming from their waist running towards a dark building, innocent childlike illustration on white paper, dark ninja theme park atmosphere border, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_weapon` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, ornate Japanese replica katana sword with bamboo sheath resting on a display stand, glowing dramatic lighting revealing a cross-section cut showing the hollow interior filled with a dark iron metal rod insert, dark atmospheric background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_repair_log` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, open spiral-bound maintenance work log notebook lying flat, pages showing handwritten wavy lines as entries with a pen resting across it, small ink signature mark at bottom of page, warm desk lamp light illuminating the notebook, dark background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |

---

## 5. 生成手順（標準フロー）

### キャラクター画像（全感情セット）

**Step 1: normal を Stability AI で生成**
```
stability-ai: generate_image
→ 保存先: public/images/characters/raw/case_XXX_normal_raw.png
```

> ⚠️ **生成後はかならずユーザーにサンプルを提示し、承認を得てから次のステップへ進むこと。**
> 承認前に raw コピー・バリアント生成・背景除去を実行してはいけない。

**Step 2: variation 4枚を Gemini edit_image で生成**
normal_raw.png を入力画像として、表情・ポーズだけ変えて生成。
```
gemini: edit_image
  image.path: public/images/characters/{caseId}/raw/{caseId}_normal_raw.png
  prompt: "Keep character design identical. Change ONLY expression/pose: [感情の説明]"
  saveToFilePath: public/images/characters/{caseId}/raw/{caseId}_{emotion}_raw.png
```
⚠️ **Gemini の `saveToFilePath` は `C:/Windows/Temp/` など Temp フォルダ不可。プロジェクト内パスのみ有効。**
⚠️ Gemini はファイル名に `_1` サフィックスを付ける場合があるのでリネームすること

---

### Gemini 出力の正方形化ワークフロー（必読）

Gemini は出力サイズを制御できず、**常に非正方形（例: 1344×768 の横長）で出力される。**
1024×1024 に変換する際は以下の手順を厳守すること。

**❌ NG：`fit: 'fill'` を非正方形に適用**
→ 縦横比が異なる場合に歪みが発生する。非正方形→正方形に `fit: 'fill'` を使ってはいけない。

**✅ 正しい手順（sharp を使う場合）：**
```js
// Step A: trim（白余白を除去）→ 中間ファイルに書き出す
sharp(src).trim({ background: '#ffffff', threshold: 15 }).toFile(tmp)

// Step B: 短辺を長辺に合わせてパディング（正方形化）＋マージン追加
const size = Math.max(info.width, info.height);
const padV = size - info.height;  // 縦の差分
const padH = size - info.width;   // 横の差分
sharp(tmp).extend({
  top: Math.floor(padV/2) + margin,
  bottom: Math.ceil(padV/2) + margin,
  left: Math.floor(padH/2) + margin,
  right: Math.ceil(padH/2) + margin,
  background: { r:255, g:255, b:255, alpha:1 }
}).toFile(dst)

// Step C: 1024×1024 リサイズ（この時点で正方形→歪みなし）
sharp(dst).resize(1024, 1024).toFile(tmp)  // ← fit 指定不要
```

**⚠️ 重要：処理はステップごとにファイルに書き出すこと**
sharp の `.trim().extend().resize()` チェーンは中間サイズの計算がズレることがある。
必ず `toFile()` で中間ファイルに書き出し、`sharp(file).metadata()` で寸法を確認してから次のステップに進むこと。

**⚠️ 処理後は必ず寸法確認してから報告すること**
```js
sharp(dst).metadata().then(m => console.log(m.width, 'x', m.height))
// + Read ツールで目視確認も必ず行う
```

---

**Step 3: 全5枚の背景除去**
```
stability-ai: remove_background
  imageFileUri: file://...{caseId}/raw/{caseId}_{emotion}_raw.png
→ Temp に出力されるので手動コピー:
  cp "C:/Windows/Temp/mcp-server-stability-ai/{emotion}.png"
     "public/images/characters/{caseId}/{emotion}.png"
```

**Step 4: 圧縮**
```
node scripts/compress-images.js
```

### 背景・証拠・イントロ画像 — Stability AI 版

```
1. stability-ai: generate_image で生成
   → 背景: public/images/backgrounds/raw/case_003_interrogation_raw.png
   → イントロ: public/images/intro/raw/case_003_intro_raw.png
   → 証拠: public/images/evidence/raw/case_003/{ev_id}_raw.png

2. 証拠画像を evidence/case_003/ にコピー（背景・イントロはコピー不要）
   for ev in ev_camera ev_witness ev_weapon ev_repair_log; do
     cp "public/images/evidence/raw/case_003/${ev}_raw.png" \
        "public/images/evidence/case_003/${ev}.png"
   done

3. node scripts/compress-images.js（背景→JPEG 800×450、イントロ→JPEG 480px）
```

### ⚠️ 画像生成ツールのよくある罠

| 現象 | 原因 | 対処 |
|------|------|------|
| キャラに謎の文字・漢字が入る | NO text フレーズ不足 | `absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana` を追加 |
| 感情5枚が別人に見える | キャラ設定が感情ごとにバラバラ | 共通キャラ設定文を5枚すべてに入れる |
| 全身（足まで）が出力される | フレーミング指定不足 **or プロンプトに `full body` が含まれている** | `UPPER BODY ONLY tightly framed from head to chest NO legs NO feet` を追加し、**プロンプト中に `full body` を絶対に書かない** |
| 縦横比が意図と異なる（横長・縦長） | プロンプト内の `1024x1024` はヒントにすぎない | **MCP ツールの `aspectRatio` パラメータを必ず明示する**（例: `"1:1"`）。プロンプト内サイズ記述は参考にならない |
| 看板・衣装に漢字が描かれる | NO text フレーズは入れても看板・記号は別扱いされる場合がある | 再生成 |
| 【Gemini限定】ファイルが `_raw_1.png` で保存される | ツールが自動でサフィックスを付ける | 上記リネームコマンドを実行 |
| 【Gemini限定】背景がグレー/白のチェック柄に見える | Gemini が透明背景で出力した | プロンプトに `solid opaque background` を追加して再生成 |
| 【Gemini限定】出力が常に横長（1344×768 等）になる | Gemini はサイズ制御不可 | 上記「Gemini出力の正方形化ワークフロー」に従い変換する |
| 【Gemini限定】`saveToFilePath` に Temp パスを指定するとエラー | パストラバーサル制限 | `C:/Users/User/Documents/ai-objection/` 以下のプロジェクトパスのみ使用可能 |
| sharp で trim→extend→resize をチェーンすると寸法がズレる | チェーン内の中間計算が不正確 | ステップごとに `toFile()` で書き出し、`metadata()` で寸法を確認してから次のステップへ |
| `fit: 'fill'` で画像が歪む | 入力が非正方形なのに強制リサイズした | `fit: 'fill'` は入力が既に正方形の場合のみ使用。非正方形は先に正方形化してからリサイズ |
| control-style でキャラ外見まで参照元に引き寄せられる | control-style はスタイルだけでなくコンテンツ（色・形）も引き継ぐ | 別キャラのスタイル参照には `control-style` を使わず、**Gemini `edit_image` でスタイル参照元を入力画像として使う**（fidelity 問題を避けられる） |
| 【Stability AI】出力先が固定される | MCP サーバーが `C:/Windows/Temp/mcp-server-stability-ai/` に保存する仕様 | 生成後に `cp` でプロジェクトの所定パスへ手動コピーが必要 |

### Stability AI MCP ツール使用時の必須ルール

1. **`aspectRatio` を必ず指定する**
   - キャラクター・証拠・イントロ: `"1:1"`
   - 背景（尋問室）: `"1:1"`（compress-images.js が 16:9 にトリミング）
   - プロンプト内の `1024x1024` は無視されることがある — ツールパラメータが最優先

2. **キャラクタープロンプトに `full body` を書かない**
   - `full body` が1箇所でもあると `UPPER BODY ONLY` が無効化される
   - 正: `UPPER BODY ONLY tightly framed from head to chest NO legs NO feet`
   - 誤: `full body portrait, UPPER BODY ONLY ...`（矛盾→全身が優先される）

3. **モデル選択とクレジット消費**
   - `sd3.5-large`: 高品質・高コスト（本番用）
   - `sd3.5-large-turbo`: やや低品質・低コスト（プロトタイプ・確認用）
   - `sd3.5-medium`: バランス型
   - 複数枚を並列生成するとクレジットを一気に消費するため、試し生成は `turbo` で行い本番のみ `large` を使う

4. **出力ファイルのコピーフロー**
   ```bash
   # 生成後は必ずプロジェクトへコピー
   cp "C:/Windows/Temp/mcp-server-stability-ai/{filename}.png" \
      "C:/Users/User/Documents/ai-objection/public/images/{dest}/{filename}.png"
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
| case_003（忍者テーマパーク） | 朱赤・木の茶色・夏の緑（昼）／灰がかった茶・深い影（閉園後） |

---

## 7. プレースホルダー仕様

画像が存在しない場合：
- **キャラクター**: 人型シルエット（グレー）が自動表示
- **証拠アイコン**: ドキュメントアイコン（グレー）が自動表示
- **背景**: なし（UI背景色のみ）

開発中・未作成の画像はそのまま放置してよい。
