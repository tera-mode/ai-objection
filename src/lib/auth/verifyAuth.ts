import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export interface AuthResult {
  authenticated: boolean;
  uid: string | null;
  email?: string | null;
  isAnonymous?: boolean;
  error?: string;
}

/**
 * リクエストからFirebase認証トークンを検証
 * Authorizationヘッダーから Bearer トークンを取得して検証する
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        uid: null,
        error: 'Missing or invalid Authorization header',
      };
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return {
        authenticated: false,
        uid: null,
        error: 'No token provided',
      };
    }

    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous';

    return {
      authenticated: true,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      isAnonymous,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Auth verification error:', message);
    return {
      authenticated: false,
      uid: null,
      error: message,
    };
  }
}
