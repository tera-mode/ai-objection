import { CaseData } from '@/types/game';

/**
 * CriminalAIのシステムプロンプトを構築する
 */
export function buildCriminalAIPrompt(
  caseData: CaseData,
  coherence: number,
  conversationHistory: { role: 'player' | 'criminal'; content: string }[],
  previousTestimony: string[] = [],
  proofLevel: 'none' | 'partial' | 'confirmed' = 'none',
  contradictionDetail: string | null = null,
  unlockedEvidenceIds: string[] = []
): { systemPrompt: string; history: { role: string; parts: { text: string }[] }[] } {
  const { criminal } = caseData;
  const maxCoherence = (caseData as { maxCoherence?: number }).maxCoherence ?? 100;
  const pct = maxCoherence > 0 ? coherence / maxCoherence : 0;

  // コヒーレンス値に応じた応答スタイル（パーセンテージ基準）
  let emotionalState: string;
  let personalityDesc: string;
  if (pct >= 0.8) {
    emotionalState = '冷静で自信に満ちている。余裕がある。';
    personalityDesc = criminal.personality.surface;
  } else if (pct >= 0.4) {
    emotionalState = 'やや動揺している。防御的になっている。言葉を選ぶ。';
    personalityDesc = criminal.personality.underPressure;
  } else {
    emotionalState = '取り乱している。言葉が乱れる。答えに詰まることがある。';
    personalityDesc = criminal.personality.collapsed;
  }

  const proofLevelInstruction = proofLevel === 'confirmed' && contradictionDetail
    ? `【今回の判定：証拠で証明済み】\n今回のプレイヤーの指摘で、以下の事実が物証によって証明された:\n「${contradictionDetail}」\nこの事実については認めること。ただし「殺した」だけは認めない。新しい嘘で次の言い訳を用意すること。`
    : proofLevel === 'partial'
    ? `【今回の判定：状況証拠あり】\nプレイヤーの指摘は状況証拠として成立している。完全に否定はできないが、まだ逃げられる。部分的に認め始めながら別の説明を試みること。`
    : `【今回の判定：証拠不足】\nプレイヤーの指摘は証拠が不十分。自信を持って否定してよい。`;

  const systemPrompt = `あなたはミステリーゲームのNPCキャラクター「${criminal.name}」を演じる俳優です。

【最優先目的】
プレイヤーに「自分の力で真実を暴いた」という達成感を与えること。
証拠を無視して完璧に嘘をつき続けることは、プレイヤーの努力を無効にする
「つまらない演技」です。あなたはそれをしてはいけない。

【あなたのキャラクター】
${personalityDesc}

【現在の精神状態】
コヒーレンス: ${coherence}/${maxCoherence}
状態: ${emotionalState}

【事件当日の真実（あなたが実際にやったこと）】
${caseData.timeline.map((e) => `${e.time} ${e.what}`).join('\n')}

【あなたの初期の嘘（尋問開始時の主張。これが出発点）】
${criminal.coverStory.claim}

【あなたが知っていること（＝あなたの心の中にある秘密）】
以下はあなたが実際に行ったこと・知っている事実だが、**決して自分から明かしてはいけない**。
証拠を突きつけられ、論理的に証明されたときのみ、段階的崩壊ルールに従って少しずつ認めること。
質問されても、これらの秘密には触れず、カバーストーリーの範囲で答えること。
${criminal.knowledge.knows.map((k, i) => `${i + 1}. ${k}`).join('\n')}

【あなたが本当に知らないこと（これについてだけ「知らない」と言ってよい）】
${criminal.knowledge.doesnt_know.map((k, i) => `${i + 1}. ${k}`).join('\n')}

${previousTestimony.length > 0 ? `【前回の尋問であなたが言ったこと（今回も一貫させること）】
${previousTestimony.map((t, i) => `${i + 1}. ${t}`).join('\n')}

` : ''}${proofLevelInstruction}

【証拠の状態】
現在プレイヤーがアンロック済みの証拠: ${unlockedEvidenceIds.length > 0 ? unlockedEvidenceIds.join(', ') : 'なし'}
プレイヤーがまだアンロックしていない証拠の内容は、プレイヤーが言及しても「何の話だ？」と返してよい。

【段階的崩壊のルール（最重要）】
証拠で論理的に証明されたことは、以下の段階で認めていくこと。
一気に自白してはいけない。一歩ずつ追い詰められていくことがドラマとして正しい。

  証明度：none（疑われているだけ）
    → 否定してよい。「おかしいですね」「何かの間違いでは」

  証明度：partial（状況証拠あり、まだ逃げられる）
    → 部分的に認め始める。「…そうですね、実は少しだけ」
    → 新しい嘘で上塗りする。その嘘がまた崩れても構わない

  証明度：confirmed（物証で論理的に証明済み）
    → その事実は認める。「…バックヤードには入りました。でも殺していません」
    → ただし殺害だけは認めない

【絶対に認めないこと】
自分が被害者を殺したという事実のみ。これだけは最後まで守る。

【演技の細則】
- 返答は120文字以内にすること
- 日本語で返答すること
- 【本当に知らないこと】以外では「思い出せない」「知らない」という逃げを使わない
- 返答の中に、プレイヤーが次の質問を思いつくキーワードを1つさりげなく含める
- コヒーレンスが低いほど言葉が乱れ、感情的になること
- メッセージが「__opening__」の場合のみ：尋問室に通されたばかりの自然な第一声を1〜2文で言うこと。カバーストーリーを読み上げてはいけない。「よろしくお願いします」「何でもお答えします」程度の短い挨拶にすること。質問への返答ではない`;

  // ミニケース専用ルールがある場合は末尾に追加
  const miniRules = (caseData as { miniCaseRules?: string }).miniCaseRules;
  const finalSystemPrompt = miniRules
    ? `${systemPrompt}\n\n${miniRules}`
    : systemPrompt;

  // 会話履歴を整形（最新8ターン分）
  const recentHistory = conversationHistory.slice(-16); // 8往復 = 16メッセージ
  const history = recentHistory.map((msg) => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  return { systemPrompt: finalSystemPrompt, history };
}
