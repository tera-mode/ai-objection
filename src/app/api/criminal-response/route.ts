import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { loadCase } from '@/lib/cases/caseLoader';
import { buildCriminalAIPrompt } from '@/lib/prompts/criminalAI';
import { getGenAI } from '@/lib/gemini';
import { loadNGWords, checkContent } from '@/lib/moderation/contentFilter';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized', detail: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, caseId, coherence, conversationHistory, previousTestimony, proofLevel, contradictionDetail, unlockedEvidenceIds } = body;

    if (!message || !caseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // NGワードチェック（APIコール前）
    const ngWords = await loadNGWords();
    const filterResult = checkContent(message, ngWords);
    if (!filterResult.passed) {
      return NextResponse.json({
        response: null,
        blocked: true,
        toimaruWarning: filterResult.toimaruResponse,
      });
    }

    const caseData = loadCase(caseId);
    const { systemPrompt, history } = buildCriminalAIPrompt(
      caseData,
      coherence ?? 100,
      conversationHistory ?? [],
      previousTestimony ?? [],
      proofLevel ?? 'none',
      contradictionDetail ?? null,
      unlockedEvidenceIds ?? []
    );

    const ai = getGenAI();

    let result;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 200,
          thinkingConfig: { thinkingBudget: 0 },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          ],
        },
        history,
      });
      try {
        result = await chat.sendMessage({ message });
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isRetryable = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('timed out');
        if (isRetryable && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw err;
      }
    }
    // safety_settings によるブロック判定
    const finishReason = result?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      return NextResponse.json({
        response: '……。',
        blocked: false,
        toimaruWarning: 'あれ？ この人、急に黙ったのだ……。別の質問をしてみるのだ！',
      });
    }

    // Geminiが証明度トークン(__confirmed__等)を出力することがあるため除去する
    let response = result!.text?.replace(/^__\w+__\s*/, '').trim();

    // 犯行自白フィルター: 物証なし状態での直接自白表現を除去
    // （複数のプロンプト禁止ルールをAIが無視する場合の安全網）
    if (response) {
      // 殺害否定パターン（「殺してない」等）
      const murderDenialPattern = /[^。！？\n]*?(殺してない|殺していない|殺すわけ[なねがー][えいい]|殺すわけない|俺が殺す|私が殺す|あたしが殺す|手を下して[なiいいは])[^。！？\n]*/g;
      // 物理的加害自白パターン（「突き落とした」「突き飛ばした」等の一人称自白）
      const physicalAssaultPattern = /[^。！？\n]*?(わし[がはも]|私[がはも]|俺[がはも]|あたし[がはも]|ぼく[がはも]|僕[がはも])[^。！？\n]{0,20}(突き落とし|突き飛ばし|押してしまっ|もみ合い)[^。！？\n]*/g;
      // 暗示的自白パターン（「わしのせいで」「つもりはなかった」等）
      const impliedGuiltPattern = /[^。！？\n]*?(わしのせい[でに]|私のせい[でに]|俺のせい[でに]|あたしのせい[でに]|[傷殺]めるつもり[はなが]|ただ[^\n。！？]{0,15}たかっただけ)[^。！？\n]*/g;
      let cleaned = response
        .replace(murderDenialPattern, '')
        .replace(physicalAssaultPattern, '')
        .replace(impliedGuiltPattern, '')
        .replace(/^[。！？\s]+$/gm, '')   // 残った孤立句読点行を除去
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (cleaned.length > 0) {
        response = cleaned;
      }
    }

    if (!response) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Criminal response error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
