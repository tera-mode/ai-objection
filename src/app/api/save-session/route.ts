import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { adminDb } from '@/lib/firebase/admin';
import { loadCase } from '@/lib/cases/caseLoader';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, caseId, sessionId, session } = body;

    if (action === 'create') {
      // 新規セッション作成
      if (!caseId) {
        return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
      }

      const newSessionId = uuidv4();
      const now = new Date().toISOString();

      // ケースデータから初期値を取得（なければデフォルト100）
      let initialCoherence = 100;
      let maxCoherence = 100;
      let maxTurns: number | null = null;
      try {
        const caseData = loadCase(caseId) as { initialCoherence?: number; maxCoherence?: number; maxTurns?: number };
        maxCoherence = caseData.maxCoherence ?? 100;
        initialCoherence = caseData.initialCoherence ?? maxCoherence;
        maxTurns = caseData.maxTurns ?? null;
      } catch { /* ケースが見つからなくてもセッション作成は続行 */ }

      const newSession = {
        sessionId: newSessionId,
        userId: auth.uid,
        caseId,
        phase: 'crime_scene',
        turn: 0,
        coherence: initialCoherence,
        maxCoherence,
        maxTurns,
        messages: [],
        isCompleted: false,
        verdict: null,
        createdAt: now,
        updatedAt: now,
      };

      await adminDb.collection('gameSessions').doc(newSessionId).set(newSession);

      return NextResponse.json({ session: newSession });
    } else if (action === 'update') {
      // セッション更新
      if (!sessionId || !session) {
        return NextResponse.json({ error: 'sessionId and session are required' }, { status: 400 });
      }

      // 自分のセッションのみ更新可能
      const docRef = adminDb.collection('gameSessions').doc(sessionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const existingSession = doc.data();
      if (existingSession?.userId !== auth.uid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await docRef.update({
        ...session,
        userId: auth.uid, // userIdは変更不可
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Save session error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
