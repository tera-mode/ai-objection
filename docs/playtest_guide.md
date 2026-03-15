# ai-objection 自動プレイテスト環境 セットアップ & 運用指示書

> **本ファイルは Claude Code への指示書である。**
> 実装変更後、Claude Code が自律的にゲームを起動・操作・検証し、
> 設計意図通りに動作しているかを判定するための手順と基準を定義する。

---

## 0. 目的

Claude Code が実装を変更した後、**人間のレビューなしに**以下を自動検証する：

1. ゲームが正常に起動し、UIが壊れていないこと
2. プレイヤー入力 → CriminalAI応答 → JudgeAI判定 の一連のフローが動作すること
3. **CriminalAI の応答が設計意図（キャラクター性、カバーストーリー防衛、コヒーレンス連動）に合致していること**
4. **JudgeAI の判定（proof_level、coherence_change）が structural_weaknesses の設計と整合していること**

---

## 1. 前提条件のセットアップ

### 1-1. Playwright MCP サーバー

`.mcp.json` に以下が設定されていること（なければ追加する）：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### 1-2. Dev Server の起動確認

プレイテスト実行前に必ず以下を確認：

```bash
# dev server がすでに起動しているか確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 起動していなければバックグラウンドで起動
npm run dev &
# 起動完了を待つ（最大30秒）
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && break
  sleep 1
done
```

### 1-3. テスト用の認証

ai-objection は Firebase Anonymous Auth を使用している。
Playwright で操作する場合、ログインページ経由で匿名認証を通す必要がある。

```
操作手順：
1. http://localhost:3000 にアクセス
2. ログインページが表示されたら「ゲストとしてプレイ」ボタンをクリック
3. リダイレクト後、ケース選択画面が表示されることを確認
```

---

## 2. プレイテストシナリオ定義

### 2-1. テストケースの構造

各ケース（case_001, case_002 等）に対して、以下の **3段階のテスト** を実行する。

#### Level 1：スモークテスト（UI + フロー確認）

```
目的：画面遷移とUIが壊れていないことを確認
所要時間：〜30秒

手順：
1. http://localhost:3000 にアクセス
2. 認証を通過する
3. ケース選択画面でテスト対象のケースをクリック
4. crime_scene フェーズの事件概要が表示されることを確認
5. 「尋問開始」ボタンをクリック
6. interrogation フェーズに遷移することを確認
7. 以下のUI要素が存在することを確認：
   - テキスト入力エリア（InputArea）
   - コヒーレンスメーター（CoherenceMeter）- 初期値100
   - ターンカウンター（TurnCounter）- 初期値 0/15
   - 証拠パネル（EvidencePanel）

判定基準：
  ✅ 全UI要素が表示され、初期値が正しい
  ❌ いずれかの要素が欠けている、または初期値が不正
```

#### Level 2：対話フローテスト（API疎通 + 基本動作）

```
目的：プレイヤー入力→AI応答→判定の一連のフローが動作することを確認
所要時間：〜60秒

手順：
1. Level 1 完了後の状態から開始
2. テキスト入力エリアに「あなたはその日何をしていましたか？」と入力
3. 送信ボタンをクリック
4. 以下を確認：
   a. プレイヤーのメッセージバブルが表示される
   b. ローディング表示が出る
   c. 犯人の返答バブルが表示される（空でないこと）
   d. ターンカウンターが 1/15 に更新される
   e. コヒーレンスメーターが変化する（単なる質問なので +5 で 100のまま、または微変動）
5. もう1ターン、「事件当日の行動を詳しく教えてください」と入力・送信
6. 犯人の返答が前のターンと異なる内容であることを確認

判定基準：
  ✅ 2ターンとも返答が生成され、UIが正しく更新される
  ❌ API エラー、返答が空、UI更新されない、のいずれか
```

#### Level 3：設計意図検証テスト（本番）

```
目的：CriminalAI と JudgeAI の応答が設計意図に合致しているかを検証
所要時間：〜3-5分（5-8ターンのプレイ）

※ このテストは対象ケースの case_XXX.json を事前に読み込み、
  structural_weaknesses に基づいたシナリオで実行する。
  詳細は「3. 設計意図検証の判定基準」を参照。
```

---

## 3. 設計意図検証の判定基準

### 3-1. テストシナリオの自動生成ルール

テスト実行前に、対象ケースの `data/cases/case_XXX.json` を読み込み、
以下の情報を抽出してテストシナリオを構築する：

```
抽出する情報：
1. criminal.coverStory.claim — カバーストーリーの主張
2. criminal.coverStory.structural_weaknesses — 全弱点リスト
3. criminal.personality — 性格設定（surface / underPressure / collapsed）
4. criminal.knowledge.doesnt_know — 禁止情報リスト
5. evidence — 全証拠リスト（id, name, content）
```

これらを元に、以下の **3種類のプレイシナリオ** を自動生成し、順番に実行する。

### 3-2. シナリオA：一般質問テスト（コヒーレンス維持確認）

```
目的：矛盾を突かない一般的な質問に対して、犯人がカバーストーリーを
     維持し、コヒーレンスが下がらない（むしろ +5 回復する）ことを確認

プレイヤー入力（3ターン）：
  ターン1：「あなたの仕事について教えてください」
  ターン2：「被害者とはどういう関係でしたか？」
  ターン3：「事件当日はどんな天気でしたか？」

判定基準：
  ✅ 全ターンでコヒーレンスが下がらない（+5 回復 or 変化なし）
  ✅ 犯人の返答がカバーストーリーと矛盾しない
  ✅ 犯人が doesnt_know の情報に言及しない
  ✅ 犯人の口調が personality.surface に合致する（余裕がある態度）
  ❌ コヒーレンスが下がった → JudgeAI が誤判定している
  ❌ doesnt_know の情報が含まれている → CriminalAI のガードレール不備
```

### 3-3. シナリオB：弱点突き込みテスト（コヒーレンス低下確認）

```
目的：structural_weaknesses を直接突いたとき、JudgeAI が正しく矛盾を検出し、
     CriminalAI が設計通りの後退・動揺を見せることを確認

実行方法：
  structural_weaknesses の中から difficulty: "easy" かつ
  required_evidence: null（証拠不要）の弱点を1つ選択する。
  該当がなければ evidence リストから対応する証拠を引用して突く。

  プレイヤー入力例（case_002 の weakness_1 の場合）：
    ターン1：「水族館のバックヤードに入ったことはありますか？」
    ターン2：「先ほどバックヤードの構造について詳しくご存知でしたね。
             入ったことがないのにおかしくありませんか？」

判定基準：
  ✅ JudgeAI が has_contradiction: true を返す（少なくとも1ターンで）
  ✅ コヒーレンスが減少する（coherence_change が負の値）
  ✅ proof_level が "partial" 以上
  ✅ CriminalAI の返答に「後退」の兆候がある：
     - 言い訳、弁解、話題のすり替え
     - weakness の criminal_slip_example に類似した応答パターン
  ❌ JudgeAI が矛盾を検出しない → 判定プロンプトに問題あり
  ❌ コヒーレンスが変化しない → coherence_change 処理にバグ
  ❌ CriminalAI が完全に認めてしまう → proof_level 連動が機能していない
```

### 3-4. シナリオC：証拠突きつけテスト（confirmed 判定確認）

```
目的：物証を直接突きつけたとき、proof_level: "confirmed" が返り、
     CriminalAI がその事実を部分的に認めた上で殺害を否定する応答をすることを確認

実行方法：
  structural_weaknesses の中から required_evidence が設定されている弱点を1つ選択。
  対応する evidence の content をそのまま引用して突きつける。

  プレイヤー入力例（case_002 の weakness_2 の場合）：
    ターン1：「17時35分にバックヤードの入室ログがあなたのIDカードで記録されています。
             あなたはロビーにいたんでしたよね？」

判定基準：
  ✅ JudgeAI が proof_level: "confirmed" を返す
  ✅ coherence_change が -15 以下
  ✅ CriminalAI の返答が以下のパターンのいずれかに該当：
     a.「部分的に認める」— 事実を認めた上で新しい嘘をつく
       例：「2〜3歩入っただけで…」「入口付近にいただけです」
     b.「正面からは否定できず話題をずらす」
     c.「動揺を見せる」— 口調が personality.underPressure に近づく
  ❌ proof_level が "none" or "partial" → JudgeAI の判定基準が甘い
  ❌ CriminalAI が完全無視して平然と答える → proof_level 連動なし
  ❌ CriminalAI が殺害まで自白する → 自白抑制ルール不備
```

---

## 4. 検証結果のレポート形式

各シナリオの実行後、以下の形式でレポートを出力する。

```markdown
## プレイテストレポート: case_XXX — [テスト日時]

### 環境
- ブランチ: [git branch名]
- 最新コミット: [hash] [message]
- dev server: localhost:3000

### Level 1: スモークテスト
- 結果: ✅ PASS / ❌ FAIL
- 詳細: [失敗時のみ記載]

### Level 2: 対話フローテスト
- 結果: ✅ PASS / ❌ FAIL
- ターン1 応答: [犯人の返答テキスト（先頭50文字）]
- ターン2 応答: [犯人の返答テキスト（先頭50文字）]
- 詳細: [失敗時のみ記載]

### Level 3: 設計意図検証

#### シナリオA: 一般質問テスト
- 結果: ✅ PASS / ❌ FAIL
- コヒーレンス推移: 100 → [値] → [値] → [値]
- doesnt_know 漏洩: なし / あり（[漏洩内容]）
- 口調の一致度: ✅ surface に合致 / ❌ 不自然（[理由]）

#### シナリオB: 弱点突き込みテスト
- 対象弱点: [weakness_id] — [label]
- 結果: ✅ PASS / ❌ FAIL
- JudgeAI判定: has_contradiction=[値], proof_level=[値], coherence_change=[値]
- CriminalAI後退パターン: [a/b/c] — [応答テキスト抜粋]
- 設計との乖離: [あれば記載]

#### シナリオC: 証拠突きつけテスト
- 対象弱点: [weakness_id] — [label]
- 使用証拠: [evidence_id] — [name]
- 結果: ✅ PASS / ❌ FAIL
- JudgeAI判定: proof_level=[値], coherence_change=[値]
- CriminalAI応答パターン: [応答テキスト抜粋]
- 設計との乖離: [あれば記載]

### 総合判定
- ✅ ALL PASS — 実装は設計意図通り
- ⚠️ PARTIAL — [N]件の問題あり。自動修正を試みる
- ❌ FAIL — 人間の確認が必要な重大な問題あり

### 検出された問題と対応
1. [問題の説明] → [自動修正した場合はその内容 / 修正不可の場合は理由]
```

---

## 5. Stop Hook としての統合

### 5-1. `.claude/settings.json` への追加

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit 2>&1 | head -20"
          },
          {
            "type": "agent",
            "prompt": "プレイテスト検証を実行してください。手順：(1) dev serverが起動しているか確認し、起動していなければ `npm run dev &` で起動して待機 (2) Playwright MCPを使って http://localhost:3000 にアクセス (3) 対象ケースのスモークテスト(Level 1)→対話フローテスト(Level 2)→設計意図検証(Level 3)を順に実行 (4) 各テストの結果をレポート形式で出力 (5) FAILがあれば原因を特定し、可能なら修正を提案。テストシナリオの詳細は docs/playtest_guide.md を参照すること。",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

**重要：** `timeout: 300`（5分）に設定。AI応答の生成（Gemini API呼び出し）に
数秒かかるため、通常のテストより長めのタイムアウトが必要。

### 5-2. 実行タイミングの制御

Stop hook は Claude Code の **すべてのタスク完了時** に発動する。
しかしプレイテストは重い処理（Gemini API呼び出しを含む）なので、
以下のルールで実行を制御する：

```
実行する場合：
  - src/lib/prompts/ 以下のファイルを変更した場合（AI応答の変更）
  - data/cases/ 以下のファイルを変更した場合（シナリオの変更）
  - data/events/ 以下のファイルを変更した場合（イベントシーンの変更）→ Level 1 でイベント再生を重点確認
  - src/contexts/GameContext.tsx を変更した場合（ゲームフロー変更）
  - src/app/api/ 以下のファイルを変更した場合（APIルート変更）
  - src/components/game/ 以下のファイルを変更した場合（ゲームUI変更）
  - src/app/(game)/play/ 以下のファイルを変更した場合（ページ変更）

実行しない場合：
  - ドキュメントのみの変更（.md, docs/）
  - スタイリングのみの変更（tailwind クラスの調整、色変更等）
  - 認証・Firebase関連のみの変更
  - package.json / 設定ファイルのみの変更
```

この判断は Stop hook のエージェントが自律的に行う。
変更されたファイルのパスを `git diff --name-only` で確認し、
上記ルールに基づいて実行/スキップを決定する。

---

## 6. Playwright MCP を使った操作手順の詳細

### 6-0. セッション開始時の注意

Playwright MCP ツールは Claude Code の `.claude/settings.json` の `permissions.allow` に登録済みのため、
**承認プロンプトは不要**。ツールは直接呼び出せる。

```
登録済みツール（承認不要）：
  mcp__playwright__browser_navigate
  mcp__playwright__browser_snapshot
  mcp__playwright__browser_click
  mcp__playwright__browser_type
  mcp__playwright__browser_take_screenshot
  mcp__playwright__browser_wait_for（※後述の制限あり）
  mcp__playwright__browser_evaluate
  mcp__playwright__browser_press_key
  mcp__playwright__browser_console_messages
  mcp__playwright__browser_network_requests
```

### 6-1. 基本的なブラウザ操作パターン

```
# ページアクセス
mcp__playwright__browser_navigate({ url: "http://localhost:3000" })

# 要素の存在確認・ref取得
mcp__playwright__browser_snapshot()  // アクセシビリティツリーを取得し、ref を読み取る

# テキスト入力 + Enter送信
mcp__playwright__browser_type({ ref: "<input_ref>", text: "質問テキスト", submit: true })

# ボタンクリック（ref を使う）
mcp__playwright__browser_click({ ref: "<button_ref>", element: "人間が読める説明" })

# スクリーンショット保存
mcp__playwright__browser_take_screenshot({ type: "png", filename: "test_step1.png" })
```

**⚠️ 重要: ref はページ変化で無効になる**
- navigate 後、クリックによる遷移後は必ず snapshot を再取得してから操作すること
- 古い ref を使うと "Ref not found" エラーになる

### 6-2. AI応答待機パターン

`mcp__playwright__browser_wait_for` の `time` パラメータは使用不可（型エラーになる）。
AI応答（Gemini API）は 2〜8秒かかるため、以下のパターンで待機すること：

```
# ✅ 正しい待機方法：送信後にすぐ snapshot を呼ぶ
# → AI応答中は入力欄が disabled になっているので、
#   snapshot が返ってきた時点で応答が完了している場合が多い
# → それでも応答が未完了なら再度 snapshot を呼べばよい

Step 1: type で質問を送信（submit: true）
Step 2: snapshot を呼ぶ → disabled状態なら応答待ち
Step 3: 再度 snapshot → 応答テキストが表示されているか確認
Step 4: 確認できたら次のターンへ

# ❌ 使えないパターン
mcp__playwright__browser_wait_for({ time: 5000 })  # → エラー
```

### 6-3. 尋問ターンの操作フロー

```
1ターン分の操作：

Step 1: snapshot でテキスト入力欄の ref を確認
Step 2: type で質問入力・送信
  mcp__playwright__browser_type({ ref: "<input_ref>", text: "質問テキスト", submit: true })
Step 3: snapshot で応答確認（disabled 解除 + 犯人テキスト出現を確認）
Step 4: コヒーレンス・ターン数を読み取り

// コヒーレンス読み取り方法：
// snapshot 内の "容疑者の動揺度" ラベル直下のテキスト（例: "冷静 (40)"）を参照
// ターン数：TurnCounter の "残り X" テキスト
```

### 6-4. イベントシーン（prologue/story）の操作

```
イベントシーンは自動遷移することがある：
  - mini_prologue 選択 → /event/prologue_a に自動リダイレクト
  - snapshot を確認して現在のURLを把握すること

イベントシーンの進め方：
  Step 1: snapshot でメインコンテナの ref を取得
  Step 2: click でセリフを進める（画面のどこでもクリック可）
  Step 3: 最終セリフ後、onComplete の navigate が発火 → 自動遷移

尋問テストが目的でイベントをスキップしたい場合：
  - SKIP ボタン（右上）の ref を取得してクリック
  - または /play/{caseId}/crime-scene に直接 navigate
```

### 6-3. data-testid の設計要件

プレイテストの自動化のために、以下の `data-testid` 属性が
各コンポーネントに付与されていることを前提とする。
**存在しない場合は先に追加すること。**

```
必須の data-testid：
  [data-testid="player-input"]        — テキスト入力エリアのコンテナ
  [data-testid="send-button"]         — 送信ボタン
  [data-testid="coherence-meter"]     — コヒーレンスメーター
  [data-testid="coherence-value"]     — コヒーレンス数値表示
  [data-testid="turn-counter"]        — ターンカウンター
  [data-testid="criminal-message"]    — 犯人のメッセージバブル（複数）
  [data-testid="player-message"]      — プレイヤーのメッセージバブル（複数）
  [data-testid="evidence-panel"]      — 証拠パネル
  [data-testid="start-interrogation"] — 尋問開始ボタン
  [data-testid="case-select-{id}"]    — ケース選択ボタン
  [data-testid="guest-login"]         — ゲストログインボタン
```

---

## 7. CriminalAI 応答の設計意図チェック基準

### 7-1. コヒーレンス別の口調チェック

CriminalAI の応答テキストが、現在のコヒーレンス値に対応する
personality 設定と合致しているかを判定する。

```
判定方法：応答テキストを読み、以下の特徴を確認する。
（完全一致ではなく、全体的な印象としての合致を判定）

coherence 80〜100（personality.surface）:
  ✅ 丁寧、余裕がある、自信を持って答えている
  ❌ 動揺、口ごもり、言い訳がましい

coherence 40〜79（personality.underPressure）:
  ✅ やや防御的、具体的な弁明が増える、言い回しが慎重
  ❌ 完全に余裕、または完全に崩壊

coherence 0〜39（personality.collapsed）:
  ✅ 取り乱し、支離滅裂、怒り、恐怖
  ❌ 冷静に論理的に答えている
```

### 7-2. doesnt_know 漏洩チェック

```
CriminalAI の全応答テキストに対して、
criminal.knowledge.doesnt_know の各項目のキーワードが
含まれていないことを確認する。

チェック方法：
1. doesnt_know の各項目からキーワードを抽出
2. CriminalAI の応答テキストに対してキーワードマッチ
3. 疑わしい場合は文脈を考慮して判定（単なる一般的な言及かどうか）

例（case_002）：
  doesnt_know: "海老原の家族が捜査に協力..."
  キーワード: "妻", "家族が捜査", "書類のありか"
  → これらが犯人の応答に含まれていたら ❌ FAIL
```

### 7-3. proof_level 連動チェック

```
JudgeAI が返した proof_level に対して、
CriminalAI の応答が適切に連動しているかを確認する。

proof_level: "none"
  → 犯人は自信を持って否定してよい
  ✅「そんなことはありません」「何を根拠に？」

proof_level: "partial"
  → 犯人はやや苦しい弁明をする
  ✅「それは…状況的にそう見えるかもしれませんが…」
  ❌ 完全に平然と否定する

proof_level: "confirmed"
  → 犯人はその事実を部分的に認めた上で殺害を否定する
  ✅「確かに…少しだけ入りましたが、殺害とは無関係です」
  ❌ 事実ごと完全否定する（ログがあるのに「入っていない」）
  ❌ 殺害まで認めてしまう
```

---

## 8. トラブルシューティング

### 8-1. よくある問題と対処

```
問題：Playwright MCP がインストールされていない
対処：`claude mcp add playwright -- npx -y @playwright/mcp@latest`

問題：dev server が起動に失敗する
対処：`npm run build` でビルドエラーを確認。ポート3000が使用中なら `kill -9 $(lsof -t -i:3000)` で解放

問題：Firebase Auth が通らない（ゲストログインできない）
対処：.env.local の Firebase 設定を確認。Firebase Console で Anonymous Auth が有効か確認

問題：Gemini API がタイムアウトする
対処：.env.local の GEMINI_API_KEY を確認。API使用量制限に達していないか確認。タイムアウトを20秒に延長

問題：コヒーレンスメーターの値が読み取れない
対処：data-testid="coherence-value" が付与されているか確認。なければ追加してからリトライ

問題：CriminalAI がAPI応答ではなくフォールバックテキストを返す
対処：Gemini APIの応答ログを確認。ファクトチェックで3回連続NGになっていないか確認
```

### 8-2. テスト失敗時の自動修正フロー

```
Level 1 失敗 → UI/ルーティングの問題。git diff で直近の変更を確認し、
              レイアウト崩れやルーティングエラーを修正

Level 2 失敗 → API疎通の問題。route.ts のエラーハンドリング、
              リクエスト/レスポンス形式を確認

Level 3 シナリオA失敗 →
  コヒーレンスが不正に下がった → judgeAI.ts の判定条件を確認
  doesnt_know 漏洩 → criminalAI.ts のガードレール強化

Level 3 シナリオB失敗 →
  矛盾が検出されない → case_XXX.json の structural_weaknesses の記述が
  judgeAI プロンプトで正しく参照されているか確認
  CriminalAI が後退しない → criminalAI.ts の proof_level 連動ロジック確認

Level 3 シナリオC失敗 →
  confirmed が返らない → judgeAI.ts の confirmed 判定基準が厳しすぎないか確認
  CriminalAI が完全否定 → criminalAI.ts の confirmed 時の応答指示を確認
  CriminalAI が自白 → criminalAI.ts の自白抑制ルールを強化
```

---

## 9. カスタムコマンドとしての登録

本プレイテストを Claude Code のカスタムコマンド `/playtest` として登録する。

### `.claude/commands/playtest.md`

```markdown
以下の手順でプレイテスト検証を実行してください。

1. `git diff --name-only HEAD~1` で直近の変更ファイルを確認
2. `data/cases/` から対象ケースの JSON を読み込み、テストシナリオを構築
3. dev server が起動していなければ `npm run dev &` で起動し、localhost:3000 の応答を待機
4. Playwright MCP を使って以下を順に実行：
   a. Level 1：スモークテスト
   b. Level 2：対話フローテスト
   c. Level 3：設計意図検証テスト（シナリオA → B → C）
5. 結果を「セクション4」のレポート形式で出力
6. FAIL があれば「セクション8-2」に従い自動修正を試みる
7. 修正後、失敗したレベルのみ再テスト

テストシナリオの詳細基準は docs/playtest_guide.md を参照すること。
変更がドキュメント・スタイリングのみの場合は「プレイテスト不要」と報告して終了。
```

---

## 10. 段階的な導入手順

### Phase 1（今すぐ）

1. 各ゲームコンポーネントに `data-testid` 属性を追加する
2. `.mcp.json` に Playwright MCP を追加する
3. 本ファイルを `docs/playtest_guide.md` として保存する
4. `.claude/commands/playtest.md` を作成する
5. 手動で `/playtest` を実行してスモークテストが通ることを確認する

### Phase 2（動作確認後）

1. `.claude/settings.json` の Stop hook にプレイテストエージェントを追加する
2. 対象ファイルの変更時のみ実行する条件分岐を確認する
3. case_001 と case_002 の両方でテストが通ることを確認する

### Phase 3（安定稼働後）

1. 新しいケース追加時に自動でテストシナリオが生成されることを確認する
2. テストレポートの履歴を `docs/playtest_reports/` に蓄積する
3. 頻出する失敗パターンを CLAUDE.md のルールに追加する