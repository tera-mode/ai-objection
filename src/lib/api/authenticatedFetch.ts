import { auth } from '@/lib/firebase/config';

/**
 * Firebase認証トークン付きでAPIを呼び出すヘルパー
 * @param timeoutMs タイムアウト（ミリ秒）。省略時はタイムアウトなし
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Not authenticated');
  }

  const token = await user.getIdToken();

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  if (timeoutMs == null) {
    return fetch(url, { ...options, headers });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 認証トークンを取得（匿名ユーザーも含む）
 */
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}
