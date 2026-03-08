# project-objection Web版 要件書

> **Claude Code への指示書。本ファイルを読んだ上で実装を開始すること。**
> 参照リポジトリ: `https://github.com/tera-mode/mecraft`（アーキテクチャの流用元）

---

## 0. プロジェクト概要

| 項目 | 内容 |
|---|---|
| サービス名 | ai-objection |
| リポジトリ名 | `ai-objection` |
| URL | `ai-objection.aigame.media` |
| コンセプト | AIが演じる犯人に自由に質問し、矛盾を暴いて逮捕に追い込む推理ゲーム |
| ターゲット | PC/スマホブラウザ |
| ポータル | `aigame.media`（将来複数ゲームを束ねる親ドメイン。今回は後回し） |
| リポジトリ参照 | `mecraft`（以下「参照プロジェクト」）のファイル構成・パターンを積極的に流用する |

---

## 1. 技術スタック

| カテゴリ | 採用技術 | 参照元 |
|---|---|---|
| フレームワーク | Next.js (App Router) | mecraft/next.config.ts |
| 言語 | TypeScript | mecraft 全体 |
| スタイリング | Tailwind CSS | mecraft 全体 |
| データベース | Firebase Firestore | mecraft/src/lib/firebase/ |
| 認証 | Firebase Auth (Anonymous → Google/Email昇格) | mecraft/src/contexts/AuthContext.tsx |
| ホスティング | Vercel | mecraft/vercel設定 |
| AI | Gemini API (gemini-2.5-flash) | mecraft/src/lib/gemini.ts |

---

## 2. 参照プロジェクト（mecraft）からの流用方針

以下のファイルは**ほぼそのまま流用**し、最小限の変更のみ加えること。

| 流用元（mecraft） | 流用先 | 変更点 |
|---|---|---|
| `src/lib/firebase/client.ts` | `src/lib/firebase/client.ts` | 変更なし |
| `src/lib/firebase/admin.ts` | `src/lib/firebase/admin.ts` | 変更なし |
| `src/lib/gemini.ts` | `src/lib/gemini.ts` | モデルID確認のみ |
| `src/contexts/AuthContext.tsx` | `src/contexts/AuthContext.tsx` | 変更なし |
| `src/lib/auth/verifyAuth.ts` | `src/lib/auth/verifyAuth.ts` | 変更なし |
| `src/lib/api/authenticatedFetch.ts` | `src/lib/api/authenticatedFetch.ts` | 変更なし |
| `firestore.rules` | `firestore.rules` | コレクション名の追加のみ |
| `.gitignore` | `.gitignore` | 変更なし |
| `next.config.ts` | `next.config.ts` | プロジェクト名のみ変更 |
| `package.json` | `package.json` | 依存関係の差分のみ更新 |

---

## 3. 環境変数

`.env.local` に以下を設定する。

```
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Gemini API
GEMINI_API_KEY=
```

---

## 4. ゲームの構造（ドメイン知識）

### 4-1. 世界観

「台本ではなく設定集」アーキテクチャ。

- **ワールドステート（固定）**: 誰が・いつ・どこで・何を・なぜ・どうやったかの全事実
- **AI（CriminalAI）**: その設定に基づいて犯人を「演じる」。語り方は自由
- **JudgeAI**: プレイヤーの発言が犯人の矛盾を突いているか判定する

### 4-2. ゲームフロー

```
ゲームスタート
  → 事件概要表示（CrimeSceneフェーズ）
  → 尋問（Interrogationフェーズ）：最大15ターン
      プレイヤー入力
        → CriminalAI が返答（Gemini API）
        → JudgeAI が矛盾判定（Gemini API）
        → コヒーレンス（犯人の動揺度）に反映
  → 逮捕チャレンジ or タイムアップ（Resultフェーズ）
```

### 4-3. ゲームステート型定義（TypeScript）

```typescript
// ゲームセッションの状態
interface GameSession {
  sessionId: string;
  userId: string;
  caseId: string;
  phase: 'crime_scene' | 'interrogation' | 'result';
  turn: number;             // 0〜15
  coherence: number;        // 0〜100（100=完全に冷静、0=完全に崩壊）
  messages: ChatMessage[];
  isCompleted: boolean;
  verdict: 'arrest' | 'escape' | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  role: 'player' | 'criminal';
  content: string;
  coherenceAfter?: number;  // 犯人発言後のコヒーレンス値
  contradiction?: string;   // JudgeAIが検出した矛盾の説明（あれば）
  timestamp: Date;
}

// シナリオのワールドステート
interface CaseData {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  storyText: {
    intro: string;
    criminalIntro: string;
    victory: string;
    defeat: string;
  };
  timeline: TimelineEvent[];
  criminal: CharacterData;
  evidence: Evidence[];
}

interface TimelineEvent {
  time: string;
  who: string;
  what: string;
}

interface CharacterData {
  name: string;
  personality: {
    surface: string;
    underPressure: string;
    collapsed: string;
  };
  knowledge: {
    knows: string[];
    doesnt_know: string[];
  };
  coverStory: {
    claim: string;
    structural_weaknesses: string[];
  };
}

interface Evidence {
  id: string;
  name: string;
  content: string;
}
```

---

## 5. Firestoreデータ構造

```
/users/{userId}
  - uid, email, displayName
  - createdAt, lastLoginAt

/gameSessions/{sessionId}
  - userId, caseId, phase
  - turn, coherence
  - messages: ChatMessage[]
  - isCompleted, verdict
  - createdAt, updatedAt

/cases/{caseId}
  - （CaseDataのうちstoryTextとmetaのみ。timelineや犯人の詳細はサーバーサイドのみ）
  - title, difficulty, intro
```

**セキュリティ原則**: `CaseData`の`timeline`・`criminal`（カバーストーリーの弱点等）はFirestoreに保存しない。サーバーサイドのJSONファイルとして管理し、クライアントには絶対に公開しない。

---

## 6. ディレクトリ構成

```
ai-objection/
├── src/
│   ├── app/
│   │   ├── (game)/                     # 認証必須ルートグループ
│   │   │   ├── layout.tsx              # AuthGuard + BottomNav
│   │   │   ├── play/
│   │   │   │   ├── page.tsx            # ケース選択
│   │   │   │   └── [caseId]/
│   │   │   │       ├── crime-scene/    # 事件概要
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── interrogation/  # 尋問メイン画面
│   │   │   │       │   └── page.tsx
│   │   │   │       └── result/         # 結果
│   │   │   │           └── page.tsx
│   │   │   └── history/                # プレイ履歴
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── criminal-response/      # CriminalAI返答生成
│   │   │   │   └── route.ts
│   │   │   ├── judge/                  # JudgeAI矛盾判定
│   │   │   │   └── route.ts
│   │   │   ├── save-session/           # セッション保存
│   │   │   │   └── route.ts
│   │   │   └── get-session/            # セッション取得
│   │   │       └── route.ts
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── page.tsx                    # LP
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── game/
│   │   │   ├── MessageBubble.tsx       # 会話バブル（プレイヤー/犯人）
│   │   │   ├── CoherenceMeter.tsx      # 動揺メーター
│   │   │   ├── TurnCounter.tsx         # 残りターン数
│   │   │   ├── EvidencePanel.tsx       # 証拠一覧
│   │   │   └── InputArea.tsx           # テキスト入力エリア
│   │   └── navigation/
│   │       └── BottomNav.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx             # mecraft から流用
│   │   └── GameContext.tsx             # ゲームセッション状態管理
│   ├── lib/
│   │   ├── firebase/                   # mecraft から流用
│   │   ├── auth/                       # mecraft から流用
│   │   ├── api/                        # mecraft から流用
│   │   ├── gemini.ts                   # mecraft から流用
│   │   ├── prompts/
│   │   │   ├── criminalAI.ts           # CriminalAI用プロンプト構築関数
│   │   │   └── judgeAI.ts              # JudgeAI用プロンプト構築関数
│   │   └── cases/                      # シナリオJSONの型・ローダー
│   │       └── caseLoader.ts
│   └── types/
│       └── game.ts                     # GameSession等の型定義
├── data/
│   └── cases/                          # シナリオJSON（サーバーサイド専用）
│       ├── case_001.json
│       ├── case_002.json
│       └── case_003.json
├── .env.local
├── .gitignore
├── firestore.rules
├── firebase.json
├── next.config.ts
└── package.json
```

---

## 7. APIルート仕様

### POST `/api/criminal-response`

CriminalAIを呼び出し、犯人の返答を生成する。

**リクエスト**
```typescript
{
  sessionId: string;
  message: string;       // プレイヤーの発言
  caseId: string;
  coherence: number;     // 現在のコヒーレンス値（0〜100）
  conversationHistory: { role: 'player' | 'criminal'; content: string }[];
}
```

**処理フロー**
1. `verifyAuth()` で認証検証（mecraft の `src/lib/auth/verifyAuth.ts` を流用）
2. `caseLoader.ts` でサーバーサイドのシナリオJSONをロード
3. CriminalAIプロンプト構築（`lib/prompts/criminalAI.ts`）
4. `getGeminiModel()` で Gemini API 呼び出し（mecraft の `src/lib/gemini.ts` を流用）
5. 返答テキストを返す

**レスポンス**
```typescript
{ response: string }
```

---

### POST `/api/judge`

JudgeAIを呼び出し、矛盾の有無と強度を判定する。

**リクエスト**
```typescript
{
  sessionId: string;
  caseId: string;
  playerMessage: string;
  criminalResponse: string;
  conversationHistory: { role: 'player' | 'criminal'; content: string }[];
}
```

**処理フロー**
1. `verifyAuth()` で認証検証
2. シナリオJSONのワールドステートをロード
3. JudgeAIプロンプト構築（`lib/prompts/judgeAI.ts`）
4. Gemini API 呼び出し → JSON形式で判定結果を受け取る
5. コヒーレンス変化量を計算して返す

**レスポンス**
```typescript
{
  hasContradiction: boolean;
  contradictionDetail: string | null;  // 内部ログ用（UIには表示しない）
  coherenceChange: number;              // -30〜+5（矛盾なしは+5回復）
}
```

---

## 8. AIプロンプト設計

### 8-1. CriminalAI プロンプト構造（`lib/prompts/criminalAI.ts`）

```
システムプロンプト（Layer1）:
  - キャラクター設定（性格・話し方）
  - 知っている事実のリスト（knows）
  - 知らない事実のリスト（doesnt_know）← 絶対に言及しない
  - カバーストーリー（主張内容）
  - 現在のコヒーレンス値に応じた応答スタイル指示
    ・coherence 80〜100: 冷静・自信あり
    ・coherence 40〜79: やや動揺・防御的
    ・coherence 0〜39: 取り乱し・言葉が乱れる
  - 返答は120文字以内

会話履歴（最新8ターン分）

プレイヤーの最新発言
```

### 8-2. JudgeAI プロンプト構造（`lib/prompts/judgeAI.ts`）

```
システムプロンプト:
  - ワールドステートの全事実（timeline + 物証）
  - 判定基準：
    ・プレイヤーの指摘が事実と犯人の証言の矛盾を突いているか
    ・単なる感情的な攻撃は矛盾ではない
  - 必ずJSON形式で返答すること

入力: プレイヤー発言 + 犯人の直前の返答

出力形式（JSON）:
{
  "has_contradiction": true/false,
  "detail": "矛盾の具体的な説明（プレイヤーに見せる文章）",
  "coherence_change": -5〜-30
}
```

---

## 9. シナリオJSONフォーマット（`data/cases/case_XXX.json`）

```json
{
  "id": "case_001",
  "title": "深夜のアリバイ",
  "difficulty": "easy",
  "storyText": {
    "intro": "...",
    "criminalIntro": "...",
    "victory": "...",
    "defeat": "..."
  },
  "timeline": [
    { "time": "23:10", "who": "criminal", "what": "..." },
    { "time": "23:47", "who": "victim", "what": "..." }
  ],
  "criminal": {
    "name": "田中 誠",
    "personality": {
      "surface": "礼儀正しく冷静な中年男性。言葉を選ぶ。",
      "underPressure": "口数が減り、目を合わせなくなる。",
      "collapsed": "怒鳴り出す。話が矛盾し始める。"
    },
    "knowledge": {
      "knows": ["..."],
      "doesnt_know": ["..."]
    },
    "coverStory": {
      "claim": "その時間帯は自宅にいた",
      "structural_weaknesses": [
        "防犯カメラに23:30頃の姿が映っている",
        "隣人が深夜に車の音を聞いている"
      ]
    }
  },
  "evidence": [
    { "id": "e01", "name": "防犯カメラ映像", "content": "23:28、容疑者の車が現場近くを通過" },
    { "id": "e02", "name": "隣人の証言", "content": "深夜に車のエンジン音を聞いた" }
  ]
}
```

---

## 10. UIデザイン方針

- **カラースキーム**: ダーク基調（尋問室のイメージ）。メインアクセントは青〜シアン
- **UIスタイル**: mecraft のグラスモーフィズムとは異なり、シャープで緊張感のあるデザイン
- **会話UI**: チャット形式（プレイヤー=右、犯人=左）
- **コヒーレンスメーター**: 画面上部に常時表示。値が下がるとメーターが赤く点滅
- **モバイル対応**: mecraft と同様にスマホ縦持ちで快適に操作できること

---

## 11. 認証フロー

mecraft の認証フロー（`AuthContext.tsx`）をそのまま流用する。

```
LP（/）
  ├─ ゲストで試す → Firebase匿名認証 → ケース選択
  ├─ 新規登録 → /login → メール or Google → ケース選択
  └─ ログイン → /login → ケース選択

プレイ履歴の保存: 匿名ユーザーも可能（sessionはFirestoreに保存）
本登録後: ゲスト時のプレイ履歴は引き継ぎ可能（linkWithCredential）
```

---

## 12. 実装フェーズ

### Phase 0: 環境構築（1〜2日）

- [ ] mecraft リポジトリをクローンし、不要なファイルを削除してベースを作成
- [ ] Firebase プロジェクトの設定・環境変数の設定
- [ ] `AuthContext`, `firebase/client`, `firebase/admin`, `gemini.ts` を流用配置
- [ ] シナリオJSON（case_001）を1本作成

### Phase 1: コアループ実装（3〜5日）

- [ ] `GameContext.tsx` の実装（セッション状態管理）
- [ ] `/api/criminal-response` の実装
- [ ] `/api/judge` の実装
- [ ] 尋問画面（`/play/[caseId]/interrogation`）の実装
- [ ] コヒーレンスメーター・ターンカウンターの表示
- [ ] **ゴール: 1シナリオを最初から最後まで遊べること**

### Phase 2: 画面整備（2〜3日）

- [ ] LP（/）の実装
- [ ] 事件概要画面（crime-scene）の実装
- [ ] 結果画面（result）の実装
- [ ] ケース選択画面（play）の実装
- [ ] プレイ履歴画面（history）の実装

### Phase 3: コンテンツ・調整（3〜5日）

- [ ] シナリオJSON を3本に増やす（case_001〜003）
- [ ] コヒーレンスの変動量バランス調整
- [ ] プレイテストとプロンプトの改善

---

## 13. 作業ルール

- TypeScript の型エラーはビルド前に必ず解消すること
- 環境変数は `.env.local` で管理。コードにハードコードしない
- セキュアな情報が公開されないように細心の注意を行うこと
- docs配下には開発用ドキュメントを設置し、これらは公開しない
- シナリオJSONは `data/cases/` に置き、APIルート以外からは絶対にアクセスしない
- `git push` は必ずユーザーの明示的な同意を得てから実行する
- mecraft から流用したファイルを変更する場合は、差分が最小になるよう意識すること
- コミットメッセージは日本語でよい
- Vercelのカスタムドメインは `ai-objection.aigame.media`（サブドメイン型）。Vercelプロジェクト設定の Domains に追加し、DNSに CNAME レコードを設定する

---

## 付録A: 参考リポジトリ

| リポジトリ | URL | 用途 |
|---|---|---|
| **ai-objection**（本リポジトリ） | `https://github.com/tera-mode/ai-objection` | Web版の実装先 |
| **project-objection**（Godot版） | `https://github.com/tera-mode/project-objection` | ゲームロジック・シナリオJSONの流用元 |
| **mecraft** | `https://github.com/tera-mode/mecraft` | Next.js/Firebase/Vercel構成の流用元 |

### project-objection から流用するもの

| 流用元 | 流用先 | 備考 |
|---|---|---|
| `data/cases/*.json` | `data/cases/*.json` | シナリオJSONをそのまま使用 |
| `scripts/CriminalAI.gd` | `src/lib/prompts/criminalAI.ts` | プロンプト構造を TypeScript に移植 |
| `scripts/JudgeAI.gd` | `src/lib/prompts/judgeAI.ts` | プロンプト構造を TypeScript に移植 |

**重要**: `data/cases/` のシナリオJSONは project-objection と ai-objection の両方で共通フォーマットを維持すること。

---

## 付録B: 参考設計書

- `AI対話ゲーム設計ナレッジ.md`（「台本ではなく設定集」アーキテクチャの詳細）
- `project-objection 要件書 v5`（Godot版の現行設計。Web版の設計参照元）
