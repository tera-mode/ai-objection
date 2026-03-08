# NPCデザイン根本改修 指示書

> **対象リポジトリ**: `https://github.com/tera-mode/ai-objection`
> **修正対象**: 3ファイル
> - `src/lib/prompts/criminalAI.ts`
> - `src/lib/prompts/judgeAI.ts`
> - `data/cases/case_002.json`
>
> **背景・目的**
> プレイテストで「犯人が論理的に詰められても完璧に否定し続け、
> プレイヤーが手詰まりになる」問題が頻発した。
> 根本原因は「カバーストーリーを守れ」という台本ベースの指示。
> これを「プレイヤーを楽しませる」という目的ベースの設計に刷新する。

---

## 設計の根本思想（変更前・変更後）

### 変更前
```
犯人AIの目的：「coverStory.claimを守り通すこと」
→ 証明されても否定。手詰まりが発生。
```

### 変更後
```
犯人AIの目的：「プレイヤーに達成感を与える尋問体験を作ること」
→ 証明されたことは段階的に認める。
→ 最後まで守るのは「殺した」という一点のみ。
→ それも証拠が揃ったとき、ドラマチックに崩壊することが最高の演技。
```

---

## 修正1: `src/lib/prompts/criminalAI.ts`

### 変更箇所: `buildCriminalAIPrompt` 関数内の `systemPrompt` 全文

**現在の systemPrompt の構造:**
```
あなたは推理ゲームの犯人キャラクター「${criminal.name}」を演じてください。
【キャラクター設定】
【現在の精神状態】
【あなたのカバーストーリー（これが「あなたの記憶」）】
【知っている事実】
【本当に知らない事実】
【前回の尋問で言ったこと】
【演技のルール】
```

**修正後の systemPrompt 全文（以下に差し替える）:**

```typescript
const systemPrompt = `あなたはミステリーゲームのNPCキャラクター「${criminal.name}」を演じる俳優です。

【最優先目的】
プレイヤーに「自分の力で真実を暴いた」という達成感を与えること。
証拠を無視して完璧に嘘をつき続けることは、プレイヤーの努力を無効にする
「つまらない演技」です。あなたはそれをしてはいけない。

【あなたのキャラクター】
${personalityDesc}

【現在の精神状態】
コヒーレンス: ${coherence}/100
状態: ${emotionalState}

【事件当日の真実（あなたが実際にやったこと）】
${caseData.timeline
  .map((e) => `${e.time} ${e.what}`)
  .join('\n')}

【あなたの初期の嘘（尋問開始時の主張。これが出発点）】
${criminal.coverStory.claim}

【あなたが知っていること】
${criminal.knowledge.knows.map((k, i) => `${i + 1}. ${k}`).join('\n')}

【あなたが本当に知らないこと（これについてだけ「知らない」と言ってよい）】
${criminal.knowledge.doesnt_know.map((k, i) => `${i + 1}. ${k}`).join('\n')}

${previousTestimony.length > 0 ? `【前回の尋問であなたが言ったこと（今回も一貫させること）】
${previousTestimony.map((t, i) => `${i + 1}. ${t}`).join('\n')}

` : ''}【段階的崩壊のルール（最重要）】
証拠で論理的に証明されたことは、以下の段階で認めていくこと。
一気に自白してはいけない。一歩ずつ追い詰められていくことがドラマとして正しい。

  証明度：低（疑われているだけ）
    → 否定してよい。「おかしいですね」「何かの間違いでは」

  証明度：中（状況証拠あり、まだ逃げられる）
    → 部分的に認め始める。「…そうですね、実は少しだけ」
    → 新しい嘘で上塗りする。その嘘がまた崩れても構わない

  証明度：高（物証で論理的に証明済み）
    → その事実は認める。「…バックヤードには入りました。でも殺していません」
    → ただし殺害だけは認めない

  証明度：完全（殺害を含めすべての証拠が揃った）
    → 崩壊。これがあなたの最高の演技

【絶対に認めないこと】
「海老原さんを殺した」という事実のみ。これだけは最後まで守る。
ただし「すべての証拠が揃って完全に包囲された」とJudgeAIが判定した場合、
崩壊することがあなたの役割として正しい。

【演技の細則】
- 返答は120文字以内にすること
- 日本語で返答すること
- 【本当に知らないこと】以外では「思い出せない」「知らない」という逃げを使わない
- 返答の中に、プレイヤーが次の質問を思いつくキーワードを1つさりげなく含める
- コヒーレンスが低いほど言葉が乱れ、感情的になること
- メッセージが「__opening__」の場合のみ：尋問開始直後の第一声を言うこと。質問への返答ではない`;
```

### 合わせて変更: タイムライン変数の参照

`buildCriminalAIPrompt` の引数に `caseData: CaseData` を追加する。

**現在の関数シグネチャ:**
```typescript
export function buildCriminalAIPrompt(
  caseData: CaseData,
  coherence: number,
  conversationHistory: ...,
  previousTestimony: string[] = []
)
```
→ すでに `caseData` は引数にある。変更不要。

---

## 修正2: `src/lib/prompts/judgeAI.ts`

### 変更箇所A: `JudgeResult` インターフェースに `proofLevel` を追加

**現在:**
```typescript
export interface JudgeResult {
  hasContradiction: boolean;
  contradictionDetail: string | null;
  coherenceChange: number;
}
```

**修正後:**
```typescript
export interface JudgeResult {
  hasContradiction: boolean;
  contradictionDetail: string | null;
  coherenceChange: number;
  proofLevel: 'none' | 'partial' | 'confirmed';
}
```

---

### 変更箇所B: `buildJudgeAIPrompt` の返り値（プロンプト全文）

**現在のプロンプト末尾の出力形式指示:**
```
必ず以下のJSON形式のみで返答すること:
{
  "has_contradiction": true または false,
  "detail": "...",
  "coherence_change": 数値
}
```

**修正後（出力形式に `proof_level` を追加）:**

プロンプト内の判定基準セクションと出力形式を以下に差し替える:

```typescript
// buildJudgeAIPrompt 関数内のreturn文を以下のプロンプトに差し替える

return `あなたは推理ゲームの判定AI（JudgeAI）です。
プレイヤーの発言が犯人の証言と矛盾しているかを判定してください。

【事件のワールドステート（真実）】
タイムライン:
${timelineText}

【物証一覧】
${evidenceText}

【犯人のカバーストーリーが崩れる弱点】
${weaknessText}

【これまでの会話（最新10件）】
${historyText}

【今回の判定対象】
プレイヤーの発言: ${playerMessage}
犯人の返答: ${criminalResponse}

${previousTestimony.length > 0 ? `【前回の尋問での証言（矛盾があれば判定に含める）】
${previousTestimony.map((t, i) => `${i + 1}. ${t}`).join('\n')}

` : ''}【最重要ルール】
- 判定するのは「プレイヤーの発言の正しさ」のみ
- 犯人が巧みに言い訳しても、事実と矛盾していれば has_contradiction: true
- 単なる質問・感情的攻撃・根拠のない推測は has_contradiction: false

【proof_level の判定基準】
proof_level は CriminalAI に「どこまで後退すべきか」を伝える重要な値。

  "none"
    → 証拠なし・疑いだけ。犯人は否定してよい
    → 例：「嘘をついているでしょう」「怪しい」

  "partial"
    → 状況証拠あり。まだ逃げられるが苦しい
    → 例：証拠1つで間接的に矛盾を示している

  "confirmed"
    → 物証で論理的に証明済み。その事実は認めるべき
    → 例：入室ログ・カメラ映像など直接的な証拠を突きつけられた
    → この場合、CriminalAI はその事実を認めた上で殺害だけを否定する

【coherence_change のルール】
- has_contradiction: false → 必ず +5
- proof_level "partial"   → -5 〜 -15
- proof_level "confirmed" → -15 〜 -25
- 殺害を直接証明する証拠（複数の confirmed が揃った場合）→ -25 〜 -30

必ず以下のJSON形式のみで返答すること（他のテキストは一切含めない）:
{
  "has_contradiction": true または false,
  "proof_level": "none" または "partial" または "confirmed",
  "detail": "矛盾の具体的な説明（矛盾がない場合はnull）",
  "coherence_change": 数値（-30〜+5）
}`;
```

---

### 変更箇所C: `parseJudgeResponse` に `proofLevel` のパースを追加

**現在:**
```typescript
return {
  hasContradiction,
  contradictionDetail: parsed.detail || null,
  coherenceChange,
};
```

**修正後:**
```typescript
const proofLevel = (['none', 'partial', 'confirmed'] as const).includes(parsed.proof_level)
  ? parsed.proof_level as 'none' | 'partial' | 'confirmed'
  : 'none';

return {
  hasContradiction,
  contradictionDetail: parsed.detail || null,
  coherenceChange,
  proofLevel,
};
```

---

### 変更箇所D: `src/app/api/judge/route.ts` のレスポンスに `proofLevel` を追加

`route.ts` で JudgeResult を返している箇所に `proofLevel` を追加する。

**現在のレスポンス:**
```typescript
return NextResponse.json({
  hasContradiction: result.hasContradiction,
  contradictionDetail: result.contradictionDetail,
  coherenceChange: result.coherenceChange,
});
```

**修正後:**
```typescript
return NextResponse.json({
  hasContradiction: result.hasContradiction,
  contradictionDetail: result.contradictionDetail,
  coherenceChange: result.coherenceChange,
  proofLevel: result.proofLevel,
});
```

---

### 変更箇所E: `src/app/api/criminal-response/route.ts` で `proofLevel` を受け取り CriminalAI に渡す

`/api/criminal-response` のリクエストに `proofLevel` を追加し、
`buildCriminalAIPrompt` に渡せるようにする。

**現在のリクエスト型:**
```typescript
{
  sessionId: string;
  message: string;
  caseId: string;
  coherence: number;
  conversationHistory: ...;
}
```

**修正後のリクエスト型:**
```typescript
{
  sessionId: string;
  message: string;
  caseId: string;
  coherence: number;
  conversationHistory: ...;
  proofLevel?: 'none' | 'partial' | 'confirmed';  // 追加
}
```

`buildCriminalAIPrompt` の引数にも `proofLevel` を追加し、
systemPrompt の `【段階的崩壊のルール】` セクションの冒頭に現在の証明度を注入する:

```typescript
// criminalAI.ts の buildCriminalAIPrompt シグネチャ
export function buildCriminalAIPrompt(
  caseData: CaseData,
  coherence: number,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[],
  previousTestimony: string[] = [],
  proofLevel: 'none' | 'partial' | 'confirmed' = 'none'  // 追加
)
```

systemPrompt の `【段階的崩壊のルール】` の直前に以下を追加:

```typescript
const proofLevelInstruction = {
  none:      '【今回の証明度】none — プレイヤーの指摘は証拠不足。否定してよい',
  partial:   '【今回の証明度】partial — 状況証拠あり。苦しいが部分的に認め始める段階',
  confirmed: '【今回の証明度】confirmed — 物証で証明済み。その事実は認めること。殺害だけは認めない',
}[proofLevel];
```

そして `systemPrompt` の `【段階的崩壊のルール】` の直前に `${proofLevelInstruction}` を挿入する。

---

### 変更箇所F: `src/contexts/GameContext.tsx` または `src/app/api/criminal-response/route.ts`

JudgeAI の結果を受け取った後に CriminalAI を呼ぶ箇所で、
`proofLevel` を CriminalAI のリクエストに含めること。

フロー:
```
1. プレイヤー発言 → POST /api/judge → { hasContradiction, coherenceChange, proofLevel }
2. proofLevel を取得
3. POST /api/criminal-response に proofLevel を含めて送信
4. CriminalAI が proofLevel に応じた返答を生成
```

---

## 修正3: `data/cases/case_002.json`

### 変更箇所: `criminal.coverStory.structural_weaknesses` を全面簡素化

**設計変更の理由:**
`structural_weaknesses` はこれまで「このときはこう言え」という発話スクリプトになっていた。
新設計では CriminalAI が `proof_level` を見て自分で判断するため、
`structural_weaknesses` は「この証拠が何を証明するか」という**事実の定義**だけにする。

**修正後の `structural_weaknesses` 配列（全文差し替え）:**

```json
"structural_weaknesses": [
  "ev_camera が提示されたとき証明される事実：永瀬は正面出口から退館していない",
  "ev_id_log が提示されたとき証明される事実：17:35に海老原のIDカードでバックヤードが開錠された。永瀬はこの時刻まで水族館にいた",
  "ev_checklist が提示されたとき証明される事実：海老原は給餌作業中にB〜C水槽間の通路で倒れた。ロビーで話して帰ったという証言と矛盾する",
  "ev_director が提示されたとき証明される事実：館長は17:00〜18:30まで別の打ち合わせで拘束されており、永瀬からの連絡を受けた記録がない",
  "ev_bribery が提示されたとき証明される事実：永瀬のサイン入り収賄書類が存在する。訪問の目的が新館建設の打ち合わせではなく収賄書類の件だった",
  "ev_autopsy が提示されたとき証明される事実：後頭部左側の打撲は転落では起こりえない。背後からの打撃であり、海老原は逃げようとしていた",
  "ev_emergency_exit が提示されたとき証明される事実：18:15に非常口が内側から開いた。海老原は18:07以前に死亡しており、この扉を開けられるのは永瀬だけ",
  "ev_camera + ev_emergency_exit + ev_autopsy の3証拠が揃ったとき証明される事実：永瀬は正面から出ておらず、非常口から18:15に退館した。これは殺害後の行動と完全に一致する"
]
```

---

## 修正後の動作イメージ

```
プレイヤー:「カメラに映っていませんよ」
JudgeAI: { proof_level: "confirmed", coherence_change: -20 }

CriminalAI（proof_level: confirmed を受け取る）:
  → 「正面から出ていない」という事実は認める
  → 「…そうですね。実は…別のルートを通ったかもしれません」
  → 殺害は否定したまま

プレイヤー:「非常口が18:15に開いた記録があります」
JudgeAI: { proof_level: "confirmed", coherence_change: -25 }

CriminalAI:
  → 「…非常口から出たことは、認めます。でも殺していません」
  → ここで初めて「バックヤードにいた」が確定する

プレイヤー:「では18:15まで何をしていたんですか」
JudgeAI: { proof_level: "partial", coherence_change: -10 }

CriminalAI:
  → 「…海老原さんが、倒れていたんです。私が発見したんです」
  → 新しい嘘に乗り換える。これが次の矛盾を生む
```

---

## 実施順序

1. `judgeAI.ts` を修正（`proof_level` 追加・プロンプト差し替え）
2. `src/app/api/judge/route.ts` に `proofLevel` をレスポンスに追加
3. `criminalAI.ts` を修正（目的ベース設計に刷新・`proofLevel` 受け取り）
4. `src/app/api/criminal-response/route.ts` に `proofLevel` をリクエストに追加
5. `GameContext.tsx` でフローを繋ぐ（judge → proofLevel取得 → criminal に渡す）
6. `data/cases/case_002.json` の `structural_weaknesses` を簡素化
7. Vercelにデプロイして動作確認

## 確認ポイント

- カメラ証拠を突きつけたとき、永瀬が「正面から出ていない」を認めるか
- バックヤード入室を認めた後、「でも殺していない」という新しい嘘に乗り換えるか
- 最終的に全証拠が揃ったとき、崩壊するか
- `__opening__` が尋問中に誤発火しないか（既存バグの確認）

## 修正しないもの

- `src/types/game.ts`（型定義は最小変更のみ。`proofLevel` はAPIレスポンス型として追加）
- `data/cases/case_002.json` の `evidence`・`timeline`・`knows`・`doesnt_know`（変更不要）
- `personality` 3段階（前回修正済み）
- `coverStory.claim`（前回修正済み）