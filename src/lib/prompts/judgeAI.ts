import { CaseData } from '@/types/game';

export interface JudgeResult {
  hasContradiction: boolean;
  contradictionDetail: string | null;
  coherenceChange: number; // -30〜+5
}

/**
 * JudgeAIのプロンプトを構築する
 */
export function buildJudgeAIPrompt(
  caseData: CaseData,
  playerMessage: string,
  criminalResponse: string,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[]
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

【犯人のカバーストーリーの弱点】
${weaknessText}

【これまでの会話（最新10件）】
${historyText}

【今回の判定対象】
プレイヤーの発言: ${playerMessage}
犯人の返答: ${criminalResponse}

【判定基準】
- プレイヤーの指摘が、事実（タイムライン・物証）と犯人の証言の矛盾を突いているか判定する
- 単なる感情的な攻撃（「嘘つき！」など）は矛盾判定しない
- 矛盾がない場合はcoherence_changeを+5（回復）にする
- 矛盾の強さに応じてcoherence_changeを-5〜-30にする

必ず以下のJSON形式のみで返答すること（他のテキストは一切含めない）:
{
  "has_contradiction": true または false,
  "detail": "矛盾の具体的な説明（プレイヤーに見せる文章。矛盾がない場合はnull）",
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

    return {
      hasContradiction: Boolean(parsed.has_contradiction),
      contradictionDetail: parsed.detail || null,
      coherenceChange: Math.max(-30, Math.min(5, Number(parsed.coherence_change) || 5)),
    };
  } catch (error) {
    console.error('Failed to parse judge response:', error);
    return {
      hasContradiction: false,
      contradictionDetail: null,
      coherenceChange: 5,
    };
  }
}
