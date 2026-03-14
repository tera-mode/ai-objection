import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { loadCase } from '@/lib/cases/caseLoader';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('caseId');

  if (!caseId) {
    return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
  }

  try {
    const caseData = loadCase(caseId);
    // クライアントに渡してよい情報のみ返す（解答・内部プロンプト情報は除く）
    return NextResponse.json({
      id: caseData.id,
      title: caseData.title,
      difficulty: caseData.difficulty,
      description: caseData.description,
      storyText: caseData.storyText,
      evidence: caseData.evidence,
      criminalName: caseData.criminal.name,
      criminalGender: caseData.criminal.gender,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
