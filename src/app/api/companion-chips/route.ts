import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { getGenAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized', detail: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseId, criminalResponse, unlockedEvidenceIds, conversationContext, playerReasoning } = body;

    if (!caseId || !criminalResponse) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const unlockedIds: string[] = unlockedEvidenceIds ?? [];

    const prompt = `あなたはファンタジー推理ゲームの相棒キャラ「トイマル」の思考を担当するAIです。

【あなたの役割】
犯人の返答テキストから、プレイヤーが「気になるかもしれない」キーワードやフレーズを
2〜3個抽出してください。

【抽出ルール】
- 名詞、場所名、時間、具体的な行動を含むフレーズを優先する
- 犯人が「否定した事実」は有力な候補（例：「近づいていない」「知らない」）
- 犯人が具体的すぎる情報を漏らした箇所も有力な候補
- 全てのチップがトリガーにヒットする必要はない（ハズレも混ぜてよい）
${unlockedIds.length > 0 ? `- すでにアンロック済みの証拠（${unlockedIds.join(', ')}）に関連するキーワードはchipsから除外する\n- toimaruCommentはアンロック済み証拠の内容を言及せず、犯人の感情状態のみに集中する` : ''}

【犯人の直近の発言】
"${criminalResponse}"

${conversationContext ? `【直近の会話の流れ】\n${conversationContext}\n` : ''}

【出力形式】
以下のJSON形式のみで返答してください。説明文は不要です。
{
  "chips": ["フレーズ1", "フレーズ2", "フレーズ3"],
  "toimaruComment": "トイマルの短いコメント（1〜2文、一人称「ボク」、語尾「〜なのだ」）"
}

トイマルのコメントは以下の状況に応じて書いてください：
- 犯人が余裕で否定している → 「この人、すごく自信があるのだ……」
- 犯人がやや動揺している → 「なんか今、声が変わったのだ……？」
- 犯人が怒鳴った・威圧的 → 「な、なの……この人、怖いのだ……」
- 犯人が的外れな話をした → 「今の話、聞かれてないことまで話してるのだ？」${playerReasoning === 'low'
  ? `\n\n【プレイヤーの質問の質: low】\nトイマルのコメントで、プレイヤーにもっと自分の言葉で考えるよう優しく促してください。\n以下のいずれかのパターンで書いてください：\n- 「なの、声を見せるだけじゃなくて、この人の言ったこととどう違うか言ってほしいのだ！」\n- 「うーん……証拠はあるのに、なんでおかしいかをもっと言葉にしてほしいのだ」\n- 「なの、もうちょっと自分の言葉で説明したら、もっと効くと思うのだ！」\n犯人の状態コメントより、このフィードバックを優先してください。`
  : playerReasoning === 'medium'
  ? `\n\n【プレイヤーの質問の質: medium】\nトイマルのコメントで、あと一歩踏み込めば良いことをほのめかしてください。\n- 「おっ、いい線なのだ！ この人が何て言ってたか、もうちょっと具体的に突っ込めそうなのだ」\n- 「もうちょっとなのだ……この人の言い分のどこがおかしいか、ズバッと言ってほしいのだ！」\n犯人の状態コメントと組み合わせてOKです。`
  : ''}`;

    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const rawText = result.text ?? '';
    // JSONブロックを抽出
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ chips: [], toimaruComment: 'うーん……ボク、何を聞いたらいいかわからないのだ……' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const chips: string[] = Array.isArray(parsed.chips) ? parsed.chips.slice(0, 3) : [];
    const toimaruComment: string = typeof parsed.toimaruComment === 'string' ? parsed.toimaruComment : '';

    return NextResponse.json({ chips, toimaruComment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Companion chips error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
