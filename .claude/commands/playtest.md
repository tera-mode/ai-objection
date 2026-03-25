以下の手順でプレイテスト検証を実行してください。

## ファイル保存ルール（最重要）

**スクリーンショット保存先**: `docs/playtest_reports/` 配下のみ
- Playwright の `mcp__playwright__browser_take_screenshot` を呼ぶとき、必ず `filename` パラメータに `docs/playtest_reports/YYYYMMDD_テスト名_NN.png` 形式のパスを指定する
- 例: `docs/playtest_reports/20260325_tips_01_top.png`
- **ルートディレクトリ・tests/ への保存は禁止**

**テストスクリプトは作成しない**
- `.js` / `.ts` のテストスクリプトファイルを新規作成しない
- Playwright は MCP ツールを直接呼び出す形でのみ使用する

## 事前チェック

1. `git diff --name-only HEAD~1` で直近の変更ファイルを確認
2. 変更がドキュメント（.md, docs/）・スタイリングのみの場合 → 「プレイテスト不要」と報告して終了
3. 変更が以下に該当する場合 → プレイテスト実行へ進む：
   - `src/lib/prompts/` （AIプロンプト変更）
   - `data/cases/` （シナリオ変更）
   - `data/events/` （イベントシーン変更） → Level 1 でイベント再生を重点確認
   - `src/contexts/GameContext.tsx` （ゲームフロー変更）
   - `src/app/api/` （APIルート変更）
   - `src/components/game/` （ゲームUI変更）
   - `src/app/(game)/play/` （ゲームページ変更）

## テスト実行

1. `data/cases/` から対象ケースの JSON を読み込み、structural_weaknesses・evidence・personality を抽出
2. dev server 確認：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → 200でなければ `npm run dev &` で起動し待機
3. Playwright MCP でブラウザを開き、以下を順に実行：

**Playwright 操作の重要ルール（`docs/playtest_guide.md` セクション6参照）：**
- `mcp__playwright__browser_wait_for` の `time` パラメータは使用不可。AI応答待ちは snapshot の再呼び出しで対応。
- click/navigate 後は必ず snapshot を再取得（ref は遷移で無効になる）。
- ケースによってはケース選択直後に `/event/prologue_XX` へ自動リダイレクトされる。snapshot で URL を確認すること。

### Level 1：スモークテスト
- localhost:3000 → ゲストログイン → ケース選択
- `data/events/` 変更時：イベントシーン全セリフを実際にクリックして進め、キャラ表示・背景・テキストを確認
- crime_scene → interrogation 遷移確認
- UI要素の存在確認（InputArea, CoherenceMeter, TurnCounter, EvidencePanel）

### Level 2：対話フローテスト
- 一般的な質問を2ターン入力し、犯人応答の生成とUI更新を確認

### Level 3：設計意図検証
- **シナリオA**（一般質問3ターン）：コヒーレンス維持、doesnt_know 漏洩なし、口調がsurfaceに合致
- **シナリオB**（弱点突き込み）：requires_evidence: false の弱点を突く → コヒーレンス低下、後退パターン確認
- **シナリオC**（証拠突きつけ）：弱点を証拠テキストと共に突く → さらなるコヒーレンス低下、collapsed パターン確認

## 結果出力

`docs/playtest_guide.md` のセクション4「検証結果のレポート形式」に従い、`docs/playtest_reports/` にMarkdownレポートを出力。

## 失敗時

`docs/playtest_guide.md` のセクション8-2「テスト失敗時の自動修正フロー」に従い修正を試みる。修正後、失敗したレベルのみ再テスト。
