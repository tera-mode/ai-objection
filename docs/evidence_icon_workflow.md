# 証拠アイコン 制作ワークフロー

## ファイル規則

| 項目 | 規則 |
|---|---|
| 保存先 | `public/images/evidence/` |
| ファイル名 | `{evidence_id}.png`（例：`ev_checklist.png`） |
| サイズ | **512 × 512 px**（表示時は48×48に縮小） |
| フォーマット | PNG（透過あり推奨） |
| evidence_id | `case_002.json` の `evidence[].id` と一致させること |

---

## スタイルガイド

### 全体トーン
- **暗め・ミステリー調**：背景は濃いグレー系またはダークシアン系
- **写実的ではなくイラスト風**：フラットデザインと写実の中間
- **ハイコントラスト**：48px縮小時でも内容が識別できること

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

"[OBJECT DESCRIPTION], evidence photograph style, dark moody background (#1a1f2e),
high contrast, flat icon style, 512x512, no text, centered object,
[CASE-SPECIFIC ATMOSPHERE]"
```

### case_002（水族館）用テンプレート
```
"[OBJECT], dimly lit aquarium backroom, dark teal atmosphere,
moisture on surfaces, forensic evidence style, centered, no text, 512x512"
```

### 各証拠のプロンプト例

| evidence_id | プロンプト |
|---|---|
| `ev_checklist` | `"handwritten clipboard checklist with some items checked, dimly lit aquarium backroom, dark teal atmosphere, forensic evidence style, centered, no text, 512x512"` |
| `ev_id_log` | `"electronic keycard access log terminal screen glowing, dark aquarium corridor, forensic evidence style, centered, no text, 512x512"` |
| `ev_camera` | `"security camera footage still frame, dark grainy monitor screen, surveillance footage aesthetic, forensic evidence style, centered, no text, 512x512"` |
| `ev_director` | `"folded testimony document with official stamp, dark moody background, forensic evidence style, centered, no text, 512x512"` |
| `ev_bribery` | `"contract document with signature and seal, partially shadowed, dark moody background, forensic evidence style, centered, no text, 512x512"` |
| `ev_autopsy` | `"autopsy report document with medical diagram, dark moody background, forensic evidence style, centered, no text, 512x512"` |
| `ev_emergency_exit` | `"emergency exit door sensor log panel glowing red, dark aquarium corridor, forensic evidence style, centered, no text, 512x512"` |

---

## 生成手順

1. **プロンプト確認**：上記テンプレートを参考に英語プロンプトを作成
2. **生成**：Claude Code の `mcp__gemini-image__generate_image` ツールで生成
3. **保存**：`public/images/evidence/{evidence_id}.png` に配置
4. **動作確認**：ブラウザで `/images/evidence/{evidence_id}.png` に直接アクセスして表示確認
5. **コミット**：`git add public/images/evidence/ && git commit -m "assets: case_XXX 証拠アイコン追加"`

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
