# 証拠アイコン 制作ワークフロー

## ファイル規則

| 項目 | 規則 |
|---|---|
| 保存先 | `public/images/evidence/` |
| ファイル名 | `{evidence_id}.png`（例：`ev_checklist.png`） |
| サイズ | **512 × 512 px**（表示時は96×96に縮小） |
| フォーマット | PNG（透過あり推奨） |
| evidence_id | `case_XXX.json` の `evidence[].id` と一致させること |

---

## スタイルガイド

### 全体トーン
- **アニメ・逆転裁判風**：日本のビジュアルノベル（逆転裁判）スタイル
- **太い黒縁・セルシェーディング**：bold black outlines, cel-shaded
- **フラットな鮮やかな色使い**：flat vibrant colors
- **ハイコントラスト**：96px縮小時でも内容が識別できること

### ⚠️ 重要：文字を絶対に入れない
Gemini Image は指示がなくても謎の文字・ロゴ・ラベルを描き込む場合がある。
プロンプトに必ず以下を含めること：

```
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana
```

### カラーパレット
| 用途 | HEX |
|---|---|
| 背景（デフォルト） | `#1a1f2e` |
| アクセント | `#22d3ee`（シアン） |
| 物体のハイライト | `#e2e8f0` |
| 影・陰影 | `#0f1117` |

### ケース別トーン
| ケース | イメージ |
|---|---|
| case_001（法廷・室内） | 深い茶・照明のある室内 |
| case_002（水族館） | 深海ブルー・水中照明 |

---

## Gemini Image API での生成プロンプトテンプレート

```
証拠アイコン生成プロンプト（英語で入力すること）:

"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines,
flat vibrant colors, [OBJECT DESCRIPTION], [CASE-SPECIFIC ATMOSPHERE], centered object,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
512x512, clean illustration"
```

### case_002（水族館）用テンプレート
```
"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines,
flat vibrant colors, [OBJECT], dark teal aquarium atmosphere background, centered object,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
512x512, clean illustration"
```

### 各証拠のプロンプト例

| evidence_id | プロンプト |
|---|---|
| `ev_checklist` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, handwritten clipboard checklist with pencil check marks on paper, dark teal aquarium atmosphere background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_id_log` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, electronic keycard swipe terminal screen glowing cyan, dark aquarium corridor atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_camera` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, security camera surveillance monitor showing grainy static footage, dark atmosphere, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_director` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, folded official document with large red ink stamp circle, dark moody background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_bribery` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, contract paper with signature handwriting marks and wax seal, partially in shadow, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_autopsy` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, autopsy report clipboard with simple body silhouette outline diagram drawn on paper, dark background, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |
| `ev_emergency_exit` | `"Anime cel-shaded evidence icon, Ace Attorney visual novel style, bold black outlines, flat vibrant colors, emergency exit door sensor panel with glowing red warning light and green indicator, dark aquarium corridor, centered object, absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana, 512x512, clean illustration"` |

---

## 生成手順

1. **プロンプト確認**：上記テンプレートを参考に英語プロンプトを作成（文字禁止フレーズを必ず含める）
2. **生成**：Claude Code の `mcp__gemini-image__generate_image` ツールで生成
3. **注意**: ツールがファイル名に `_1` を付けて保存することがある。その場合はリネーム：
   ```bash
   mv ev_XXX_1.png ev_XXX.png
   ```
4. **保存**：`public/images/evidence/{evidence_id}.png` に配置
5. **動作確認**：ブラウザで `/images/evidence/{evidence_id}.png` に直接アクセスして表示確認
6. **コミット**：`git add public/images/evidence/ && git commit -m "assets: case_XXX 証拠アイコン追加"`

---

## 新ケース追加時のチェックリスト

- [ ] `data/cases/case_XXX.json` の `evidence[].id` を確認
- [ ] 各 `evidence_id` に対応するアイコンを生成
- [ ] `public/images/evidence/` に配置
- [ ] ブラウザで表示確認（画像がなければ自動でプレースホルダーが表示される）

---

## プレースホルダー仕様

アイコン画像が存在しない場合、UIは自動的にドキュメントアイコン（グレー）にフォールバックする。
開発中や未作成のアイコンはそのまま放置してよい。
