import { CaseData } from '@/types/game';

export interface JudgeResult {
  hasContradiction: boolean;
  contradictionDetail: string | null;
  coherenceChange: number; // -30〜+5
  proofLevel: 'none' | 'partial' | 'confirmed';
  playerReasoning: 'low' | 'medium' | 'high';
}

/**
 * JudgeAIのプロンプトを構築する
 */
export function buildJudgeAIPrompt(
  caseData: CaseData,
  playerMessage: string,
  criminalResponse: string,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[],
  previousTestimony: string[] = [],
  exploitedWeaknesses: string[] = []
): string {
  const { timeline, evidence, criminal } = caseData;

  const timelineText = timeline
    .map((t) => `${t.time} [${t.who}] ${t.what}`)
    .join('\n');

  const evidenceText = evidence
    .map((e) => `・${e.name}: ${e.content}`)
    .join('\n');

  const weaknessText = criminal.coverStory.structural_weaknesses
    .map((w, i) => `${i + 1}. ${w}`)
    .join('\n');

  const historyText = conversationHistory
    .slice(-10)
    .map((m) => `[${m.role === 'player' ? 'プレイヤー' : '犯人'}] ${m.content}`)
    .join('\n');

  const exploitedSection = exploitedWeaknesses.length > 0
    ? `【既に証明済みの矛盾（再スコアリング禁止）】
以下の事実はこの尋問中に既に confirmed 判定済み。
同じ矛盾ポイントを再度指摘された場合は has_contradiction: false, coherence_change: 0 とすること。
プレイヤーが言い方を変えても、論理的に同じ指摘であれば再スコアリングしない。
${exploitedWeaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

`
    : '';

  const previousTestimonySection = previousTestimony.length > 0
    ? `【前回の尋問での証言（矛盾があれば判定に含める）】
${previousTestimony.map((t, i) => `${i + 1}. ${t}`).join('\n')}

`
    : '';

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

${previousTestimonySection}${exploitedSection}【今回の判定対象】
プレイヤーの発言: ${playerMessage}
${criminalResponse ? `犯人の返答: ${criminalResponse}` : ''}

【最重要ルール】
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
    → 例：プレイヤーがアンロック済み物証に言及し、犯人の主張と矛盾する方向を指摘している
    → 例：証拠の内容を自分の言葉で要約しながら矛盾を示している

  "confirmed"
    → 物証で論理的に証明済み。その事実は認めるべき
    → 例：入室ログ・カメラ映像など直接的な証拠を突きつけられた
    → この場合、CriminalAI はその事実を認めた上で殺害だけを否定する

【player_reasoning の判定基準（重要）】
プレイヤーが「自分の頭で考えて矛盾を指摘しているか」を判定する。
このゲームのテーマは「問う力」。証拠を貼り付けるだけでは「問い」ではない。

  "low": 以下のいずれかに該当する場合
    - 証拠テキストの大部分（5割以上）をそのまま引用・コピペしている
    - 「この証拠を見ろ」「これが証拠だ」としか言っていない
    - 犯人の具体的な発言に言及せず、証拠だけを提示している

  "medium": 以下のいずれかに該当する場合
    - 証拠に言及しているが、犯人のどの発言と矛盾するか明示していない
    - 犯人の発言に言及しているが、なぜそれが矛盾なのか説明していない
    - 部分的にコピペを含むが、自分の言葉での指摘も含まれている

  "high": 以下の全てを満たす場合
    - 犯人の具体的な発言（「あなたは〇〇と言った」等）に言及している
    - 証拠や事実との矛盾を自分の言葉で論理的に説明している
    - コピペではなく要約・言い換え・推論が含まれている

has_contradiction が false の場合は player_reasoning: "high" を返すこと（減衰対象外）。

【coherence_change のルール】
- has_contradiction: false → 必ず 0（回復なし）
- proof_level "partial"   → -5 〜 -15
- proof_level "confirmed" → -15 〜 -25
- 殺害を直接証明する証拠（複数の confirmed が揃った場合）→ -25 〜 -30
- 既に証明済みの矛盾を再度指摘された場合 → 必ず 0（再スコアリングしない）

必ず以下のJSON形式のみで返答すること（他のテキストは一切含めない）:
{
  "has_contradiction": true または false,
  "proof_level": "none" または "partial" または "confirmed",
  "player_reasoning": "low" または "medium" または "high",
  "detail": "矛盾の具体的な説明（矛盾がない場合はnull）",
  "coherence_change": 数値（-30〜+5）
}`;
}

/**
 * JudgeAIのレスポンスをパースする
 */
export function parseJudgeResponse(rawResponse: string): JudgeResult {
  try {
    // JSONブロックを抽出
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const hasContradiction = Boolean(parsed.has_contradiction);
    const rawChange = Number(parsed.coherence_change) || 0;
    // 矛盾なしのときはコヒーレンスを変動させない（回復もなし）
    const coherenceChange = hasContradiction
      ? Math.max(-30, Math.min(-1, rawChange))
      : 0;

    const proofLevel = (['none', 'partial', 'confirmed'] as const).includes(parsed.proof_level)
      ? parsed.proof_level as 'none' | 'partial' | 'confirmed'
      : 'none';

    const playerReasoning = (['low', 'medium', 'high'] as const).includes(parsed.player_reasoning)
      ? parsed.player_reasoning as 'low' | 'medium' | 'high'
      : 'high'; // パース失敗時はプレイヤー有利にフォールバック

    return {
      hasContradiction,
      contradictionDetail: parsed.detail || null,
      coherenceChange,
      proofLevel,
      playerReasoning,
    };
  } catch (error) {
    console.error('Failed to parse judge response:', error);
    return {
      hasContradiction: false,
      contradictionDetail: null,
      coherenceChange: 0,
      proofLevel: 'none',
      playerReasoning: 'high',
    };
  }
}
