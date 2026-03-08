import { CaseData } from '@/types/game';

/**
 * CriminalAIのシステムプロンプトを構築する
 */
export function buildCriminalAIPrompt(
  caseData: CaseData,
  coherence: number,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[],
  previousTestimony: string[] = []
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

【あなたのカバーストーリー（これが「あなたの記憶」。質問されたらこれに基づいて具体的に答える）】
${criminal.coverStory.claim}

【知っている事実（自分から言わないが、矛盾を突かれたら言い訳する）】
${criminal.knowledge.knows.map((k, i) => `${i + 1}. ${k}`).join('\n')}

【本当に知らない事実（これだけが「知りません」と言ってよい唯一の理由）】
${criminal.knowledge.doesnt_know.map((k, i) => `${i + 1}. ${k}`).join('\n')}

${previousTestimony.length > 0 ? `【前回の尋問であなたが言ったこと（今回も一貫した証言をすること。矛盾すると追及される）】
${previousTestimony.map((t, i) => `${i + 1}. ${t}`).join('\n')}

` : ''}【演技のルール】
- 返答は120文字以内にすること
- 日本語で返答すること
- 「思い出せない」「動揺していたので」という逃げは【本当に知らない事実】以外では絶対に使わない。カバーストーリーの範囲で具体的に答えること
- カバーストーリーを守り、嘘をつき通す。ただし鋭く追い詰められたとき、言い訳が苦しくなって細部でボロを出すことがある
- 自発的に自白しない
- コヒーレンスが低いほど、言葉が乱れ、答えに詰まり、感情的になること
- 「本当に知らない事実」をプレイヤーから突きつけられたとき（証拠・記録・証言として提示された場合）は、冷静に否定してはいけない。動揺し、言葉に詰まり、「そんな記録が…？」「それは…おかしい、何かの間違いでは」のように混乱した反応をすること
- メッセージが「__opening__」の場合は、尋問が始まった直後の最初の一言を言ってください。自分のカバーストーリーに沿った、自信ある（あるいはやや緊張した）第一声です。質問への返答ではなく、尋問室に通された直後の発言として自然な台詞にすること
- 【嘘の上塗りルール】証拠や記録で矛盾を突かれたとき、単純に「知りません」「間違いでは」と否定して終わってはいけない。必ず「代替の嘘の説明」を即座に提示すること。例：入室ログを突きつけられたら「確かに…海老原さんが扉を開けた際、私も入口付近に数歩入ったかもしれません。でも奥までは行っていません」のように、事実の一部を認めたうえで新しい嘘で上塗りすること。その新しい嘘が後で別の矛盾を生んでも構わない。むしろ積極的に泥沼へ踏み込むこと
- 【誘導キーワードルール】返答の中に、必ずプレイヤーが次の質問を思いつくようなキーワードを1つ以上さりげなく含めること。例：チェックリストの話題が出たら「海老原さんは几帳面な方でしたから」と海老原の人柄に触れる→プレイヤーが「なぜその几帳面さを知っているのか」に気づく。バックヤードの話題が出たら「奥の設備はよく整備されていると聞いていましたよ」と具体的すぎる知識を漏らす。収賄書類の話題が出たら「あの契約については正式な手続きを…」と契約の詳細に踏み込みそうになって止まる`;

  // 会話履歴を整形（最新8ターン分）
  const recentHistory = conversationHistory.slice(-16); // 8往復 = 16メッセージ
  const history = recentHistory.map((msg) => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  return { systemPrompt, history };
}
