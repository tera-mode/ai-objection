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
    const { message, caseId, coherence, conversationHistory, previousTestimony, proofLevel } = body;

    if (!message || !caseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const caseData = loadCase(caseId);
    const { systemPrompt, history } = buildCriminalAIPrompt(
      caseData,
      coherence ?? 100,
      conversationHistory ?? [],
      previousTestimony ?? [],
      proofLevel ?? 'none'
    );

    const ai = getGenAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 0 },
      },
      history,
    });

    const result = await chat.sendMessage({ message });
    const response = result.text;

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
