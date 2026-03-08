import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');

  try {
    if (sessionId) {
      // 特定セッションを取得
      const doc = await adminDb.collection('gameSessions').doc(sessionId).get();

      if (!doc.exists) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const session = doc.data();
      if (session?.userId !== auth.uid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ session });
    } else {
      // ユーザーのセッション一覧を取得
      const uid = userId || auth.uid;
      if (uid !== auth.uid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const snapshot = await adminDb
        .collection('gameSessions')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const sessions = snapshot.docs.map((doc) => doc.data());
      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
