'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function LoginContent() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !loading && !user.isAnonymous) {
      router.push('/play');
    }
  }, [user, loading, router]);

  const handleGoogle = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await signInWithGoogle(user?.isAnonymous);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Googleログインに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setError('ニックネームを入力してください');
          return;
        }
        await signUpWithEmail(email, password, displayName);
      }
      router.push('/play');
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'auth/email-already-in-use' || e.code === 'auth/credential-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (e.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で設定してください');
      } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError('認証に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-stone-900">
            AI<span className="text-amber-500">Objection</span>
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </p>
        </div>

        {/* タブ */}
        <div className="mb-6 flex gap-1 rounded-xl bg-stone-200 p-1">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {m === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">ニックネーム</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:outline-none"
                placeholder="探偵"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:outline-none"
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:outline-none"
              placeholder="6文字以上"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-300" />
          <span className="text-xs text-stone-400">または</span>
          <div className="h-px flex-1 bg-stone-300" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={isProcessing}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-amber-400 hover:text-stone-900 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Googleでログイン
        </button>

        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full text-center text-sm text-stone-400 hover:text-stone-700"
        >
          ← トップに戻る
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
