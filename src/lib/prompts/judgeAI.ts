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

【最重要ルール】
- 判定対象は「プレイヤーの発言」のみ。犯人の返答に矛盾が含まれていても、プレイヤーがそれを指摘していなければ has_contradiction: false にすること
- 犯人が自分でボロを出した場合でも、プレイヤーが指摘していなければ矛盾判定しない

【判定基準】
- プレイヤーの発言が「具体的な物証・タイムラインの事実」を根拠に犯人の証言の矛盾を突いている場合のみ矛盾判定する
- 以下はすべて矛盾判定しない（has_contradiction: false, coherence_change: +5）:
  - 普通の質問（「あの日どこにいましたか？」「事件について教えてください」など）
  - 感情的な攻撃（「嘘つき！」「怪しい！」など）
  - あいまいな疑惑（「何か隠していますよね」など）
  - 犯人が否定するだけで済む指摘
  - 証拠と直接つながらない推測
- 矛盾と判定する条件（すべてを満たす場合のみ）:
  1. プレイヤーが具体的な物証・証拠を名指しまたは明確に示唆している
  2. その証拠が犯人の証言と客観的に矛盾している
  3. 犯人の返答がその矛盾を回避できていない
- coherence_changeのルール:
  - 矛盾なし: 必ず +5
  - 軽微な矛盾（言い訳できる余地あり）: -5〜-10
  - 明確な矛盾（証拠で完全に崩れた）: -15〜-25
  - 致命的な矛盾（犯行を直接証明する）: -25〜-30

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

    const hasContradiction = Boolean(parsed.has_contradiction);
    const rawChange = Number(parsed.coherence_change) || 5;
    // 矛盾なしのときは絶対にコヒーレンスを下げない（AIが誤ってマイナスを返しても強制+5）
    const coherenceChange = hasContradiction
      ? Math.max(-30, Math.min(-1, rawChange))
      : 5;

    return {
      hasContradiction,
      contradictionDetail: parsed.detail || null,
      coherenceChange,
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
