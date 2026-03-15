import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { loadCase } from '@/lib/cases/caseLoader';
import { getGenAI } from '@/lib/gemini';
import type { CompanionMemory } from '@/types/game';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized', detail: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseId, playerKeyword, unlockedEvidenceIds, conversationHistory } = body;

    if (!caseId || !playerKeyword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rawCaseData = loadCase(caseId);
    const companionMemory: CompanionMemory[] = (rawCaseData as unknown as { companionMemory?: CompanionMemory[] }).companionMemory ?? [];

    if (companionMemory.length === 0) {
      return NextResponse.json({
        hit: false,
        toimaruLine: 'うーん……それについてはボクの耳に残ってないのだ',
      });
    }

    const unlockedIds: string[] = unlockedEvidenceIds ?? [];
    // すでにアンロック済みの証拠を除外
    const unlockedMemoryIds = unlockedIds.map((evId) =>
      companionMemory.find((m) => m.unlocks_evidence === evId)?.id
    ).filter(Boolean);

    const unlockedMemories = companionMemory.filter(
      (m) => unlockedMemoryIds.includes(m.id)
    );
    const lockedMemories = companionMemory.filter(
      (m) => !unlockedIds.includes(m.unlocks_evidence)
    );

    if (lockedMemories.length === 0) {
      return NextResponse.json({
        hit: false,
        toimaruLine: 'うーん……もうボクの記憶は全部話したのだ',
      });
    }

    const memoryListJson = JSON.stringify(
      lockedMemories.map((m) => ({
        id: m.id,
        trigger_keywords: m.trigger_keywords,
      })),
      null,
      2
    );

    const prompt = `あなたはファンタジー推理ゲームの証拠アンロック判定を行うAIです。

【ルール】
プレイヤーが渡したキーワードが、以下の未アンロック証拠のトリガーキーワードと
意味的に関連しているかを判定してください。

完全一致は不要です。以下の基準で判定してください：
- プレイヤーのキーワードがトリガーキーワードの同義語・類語・関連語であればヒット
- プレイヤーのキーワードがトリガーキーワードの上位概念・下位概念であればヒット
- 全く無関係な場合のみミス

【重要】
- 迷ったらヒットにする（プレイヤーの努力を報いる方向に倒す）
- ただし、犯人がまだ関連する話題に一切触れていない場合はミスにする
  （犯人の発言がトリガーの文脈を含んでいることが前提条件）

【未アンロック証拠のトリガー一覧】
${memoryListJson}

【プレイヤーが渡したキーワード】
"${playerKeyword}"

【犯人がこれまでに話した内容】
${conversationHistory ?? '（なし）'}

【出力形式】
以下のJSONのみで返答してください。説明文は不要です。
ヒットした場合: { "hit": true, "matched_memory_id": "mem_xxx" }
ミスの場合: { "hit": false }`;

    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const rawText = result.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        hit: false,
        toimaruLine: 'うーん……それについてはボクの耳に残ってないのだ',
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.hit === true && parsed.matched_memory_id) {
      const matchedMemory = lockedMemories.find((m) => m.id === parsed.matched_memory_id);
      if (matchedMemory) {
        return NextResponse.json({
          hit: true,
          unlockedEvidenceId: matchedMemory.unlocks_evidence,
          toimaruLine: matchedMemory.toimaru_recall,
          sourceDescription: matchedMemory.source_description,
        });
      }
    }

    return NextResponse.json({
      hit: false,
      toimaruLine: 'うーん……それについてはボクの耳に残ってないのだ',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Companion trigger error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
