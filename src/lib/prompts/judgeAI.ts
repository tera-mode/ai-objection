import { CaseData } from '@/types/game';

export interface JudgeResult {
  hasContradiction: boolean;
  contradictionDetail: string | null;
  coherenceChange: number; // -30〜+5
  proofLevel: 'none' | 'partial' | 'confirmed';
}

/**
 * JudgeAIのプロンプトを構築する
 */
export function buildJudgeAIPrompt(
  caseData: CaseData,
  playerMessage: string,
  criminalResponse: string,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[],
  previousTestimony: string[] = []
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
${criminalResponse ? `犯人の返答: ${criminalResponse}` : ''}

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
- has_contradiction: false → 必ず 0（回復なし）
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

    return {
      hasContradiction,
      contradictionDetail: parsed.detail || null,
      coherenceChange,
      proofLevel,
    };
  } catch (error) {
    console.error('Failed to parse judge response:', error);
    return {
      hasContradiction: false,
      contradictionDetail: null,
      coherenceChange: 0,
      proofLevel: 'none',
    };
  }
}
