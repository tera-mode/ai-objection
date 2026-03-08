import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { loadCase } from '@/lib/cases/caseLoader';
import { buildJudgeAIPrompt, parseJudgeResponse } from '@/lib/prompts/judgeAI';
import { getGenAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized', detail: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseId, playerMessage, criminalResponse, conversationHistory, previousTestimony } = body;

    if (!caseId || !playerMessage || !criminalResponse) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const caseData = loadCase(caseId);
    const prompt = buildJudgeAIPrompt(
      caseData,
      playerMessage,
      criminalResponse,
      conversationHistory ?? [],
      previousTestimony ?? []
    );

    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const rawResponse = result.text ?? '';
    const judgeResult = parseJudgeResponse(rawResponse);

    return NextResponse.json(judgeResult);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Judge error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
