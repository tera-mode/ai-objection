# ai-objection — Claude Code 指示書

## プロジェクト概要

AIが演じる犯人に自由に質問し、矛盾を暴いて逮捕に追い込む推理ゲーム。
技術スタック: **Next.js (App Router) + TypeScript + Tailwind CSS + Firebase + Gemini API**

---

## 作業ルール

- TypeScript の型エラーはビルド前に必ず解消すること
- 環境変数は `.env.local` で管理。コードにハードコードしない
- セキュアな情報が公開されないように細心の注意を払うこと
- `docs/` 配下には開発用ドキュメントを設置し、これらは公開しない
- シナリオJSONは `data/cases/` に置き、APIルート以外からは絶対にアクセスしない
- **`git push` は必ずユーザーの明示的な同意を得てから実行する**（commit は自由に行ってよい）
- コミットメッセージは日本語でよい
- Vercel カスタムドメインは `ai-objection.aigame.media`

---

## 画像生成・画像管理ルール

**画像生成・編集・整理を行う場合は、必ず最初に `docs/design_skills.md` を読むこと。**

### 最重要チェック事項

1. **既存画像を絶対に再生成しない**
   生成前に `public/images/` を確認し、`design_skills.md` の既存キャラクター画像マップと照合する。

2. **ツール使い分け**
   | 用途 | ツール |
   |------|--------|
   | キャラクターの最初のベース画像 | **Stability AI** `generate_image` |
   | 2枚目以降の感情バリアント | **Gemini** `edit_image`（ベース画像から編集） |
   | 背景除去 | **Stability AI** `remove_background` |
   | 背景画像・イベント背景 | **Stability AI** `generate_image` |

3. **スタイル分離**
   - 尋問モード（case_XXX）: 逆転裁判風（太い黒縁・フラット鮮やか）
   - イベントモード（prologue/story）: ライトアニメVN風（細輪郭・ソフト配色）
   ⚠️ 両スタイルを同一シーンに混在させない

4. **プロンプトの詳細・キャラクター設定・サイズ仕様はすべて `docs/design_skills.md` を参照すること**

5. **はじめてデザイン生成するキャラクターや背景は、必ずサンプルを作成し私の承認を得てから、その後の作業を進めること**

---

## 既知の落とし穴（再発防止）

### 新しいケース（caseId）を追加したとき
`src/app/(game)/play/[caseId]/interrogation/page.tsx` の以下2箇所に必ず登録すること：
- `getCharacterImage()` 内の `available` マップ（または特別分岐）
- `getInterrogationBg()` 内の `bgs` マップ

登録しないと画像エリアが「画像準備中」プレースホルダーになる。

### coherence の閾値はパーセンテージ基準で書く
`maxCoherence` はケースごとに異なる（例: ガメ吉は40）。
表情切り替えや判定ロジックは `coherence / maxCoherence` で正規化してから閾値と比較すること。
絶対値で比較すると、maxCoherence < 100 のケースで最初から「追い詰められた」表情になる。

### useRef の型初期化
`useRef<(i: number) => void>()` は引数なしだと TypeScript エラーになる。
以下のパターンで初期化する：
```typescript
const ref = useRef<(i: number) => void>(null as unknown as (i: number) => void);
```

---

## 承認不要で実行してよいコマンド・ツール

以下は許可を取らずに実行してよい。

- **Next.js ビルド確認**: `cd "C:/Users/User/Documents/ai-objection"` で移動後、`NODE_OPTIONS='' node node_modules/next/dist/bin/next build` を実行する形であれば、`tail` のオプションや `2>&1` の有無に関わらず承認不要。
- **Playwright MCP 全ツール**: プレイテスト中の `mcp__playwright__*` ツール（navigate, snapshot, click, type, screenshot 等）はすべて承認不要。`.claude/settings.json` の `permissions.allow` にも登録済み。
