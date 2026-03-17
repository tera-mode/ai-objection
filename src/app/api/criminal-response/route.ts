import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { loadCase } from '@/lib/cases/caseLoader';
import { buildCriminalAIPrompt } from '@/lib/prompts/criminalAI';
import { getGenAI } from '@/lib/gemini';

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
    // Geminiが証明度トークン(__confirmed__等)を出力することがあるため除去する
    const response = result!.text?.replace(/^__\w+__\s*/, '').trim();

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
