以下の手順でプレイテスト検証を実行してください。

## 事前チェック

1. `git diff --name-only HEAD~1` で直近の変更ファイルを確認
2. 変更がドキュメント（.md, docs/）・スタイリングのみの場合 → 「プレイテスト不要」と報告して終了
3. 変更が以下に該当する場合 → プレイテスト実行へ進む：
   - `src/lib/prompts/` （AIプロンプト変更）
   - `data/cases/` （シナリオ変更）
   - `src/contexts/GameContext.tsx` （ゲームフロー変更）
   - `src/app/api/` （APIルート変更）
   - `src/components/game/` （ゲームUI変更）

## テスト実行

1. `data/cases/` から対象ケースの JSON を読み込み、structural_weaknesses・evidence・personality を抽出
2. dev server 確認：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → 200でなければ `npm run dev &` で起動し待機
3. Playwright MCP でブラウザを開き、以下を順に実行：

### Level 1：スモークテスト
- localhost:3000 → ゲストログイン → ケース選択 → crime_scene → interrogation 遷移
- UI要素の存在確認（InputArea, CoherenceMeter, TurnCounter, EvidencePanel）

### Level 2：対話フローテスト
- 一般的な質問を2ターン入力し、犯人応答の生成とUI更新を確認

### Level 3：設計意図検証
- **シナリオA**（一般質問3ターン）：コヒーレンス維持、doesnt_know 漏洩なし、口調がsurfaceに合致
- **シナリオB**（弱点突き込み）：difficulty: easy の弱点を突く → 矛盾検出、コヒーレンス低下、後退パターン確認
- **シナリオC**（証拠突きつけ）：required_evidence ありの弱点を証拠付きで突く → proof_level: confirmed、部分的承認パターン確認

## 結果出力

`docs/playtest_guide.md` のセクション4「検証結果のレポート形式」に従い、Markdownレポートを出力。

## 失敗時

`docs/playtest_guide.md` のセクション8-2「テスト失敗時の自動修正フロー」に従い修正を試みる。修正後、失敗したレベルのみ再テスト。