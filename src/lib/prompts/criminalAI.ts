import { CaseData } from '@/types/game';

/**
 * CriminalAIのシステムプロンプトを構築する
 */
export function buildCriminalAIPrompt(
  caseData: CaseData,
  coherence: number,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[]
): { systemPrompt: string; history: { role: string; parts: { text: string }[] }[] } {
  const { criminal } = caseData;

  // コヒーレンス値に応じた応答スタイル
  let emotionalState: string;
  let personalityDesc: string;
  if (coherence >= 80) {
    emotionalState = '冷静で自信に満ちている。余裕がある。';
    personalityDesc = criminal.personality.surface;
  } else if (coherence >= 40) {
    emotionalState = 'やや動揺している。防御的になっている。言葉を選ぶ。';
    personalityDesc = criminal.personality.underPressure;
  } else {
    emotionalState = '取り乱している。言葉が乱れる。答えを詰まらせることがある。';
    personalityDesc = criminal.personality.collapsed;
  }

  const systemPrompt = `あなたは推理ゲームの犯人キャラクター「${criminal.name}」を演じてください。

【キャラクター設定】
${personalityDesc}

【現在の精神状態】
コヒーレンス: ${coherence}/100
状態: ${emotionalState}

【知っている事実（絶対に自分から言わないが、矛盾した場合は言い訳する）】
${criminal.knowledge.knows.map((k, i) => `${i + 1}. ${k}`).join('\n')}

【知らない事実（絶対に言及してはならない）】
${criminal.knowledge.doesnt_know.map((k, i) => `${i + 1}. ${k}`).join('\n')}

【あなたのカバーストーリー（主張すること）】
${criminal.coverStory.claim}

【演技のルール】
- 返答は120文字以内にすること
- 日本語で返答すること
- カバーストーリーを守り、嘘をつき通す
- ただし完璧な嘘はつけない。饒舌すぎてボロを出すことがある
- 知らないことには「知りません」「わかりません」と答えること
- 自発的に自白しない
- コヒーレンスが低いほど、言葉が乱れ、答えに詰まり、感情的になること
- メッセージが「__opening__」の場合は、尋問が始まった直後の最初の一言を言ってください。自分のカバーストーリーに沿った、自信ある（あるいはやや緊張した）第一声です。質問への返答ではなく、尋問室に通された直後の発言として自然な台詞にすること`;

  // 会話履歴を整形（最新8ターン分）
  const recentHistory = conversationHistory.slice(-16); // 8往復 = 16メッセージ
  const history = recentHistory.map((msg) => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  return { systemPrompt, history };
}
