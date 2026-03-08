'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, signInAsGuest } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/play');
    }
  }, [user, loading, router]);

  const handleGuestPlay = async () => {
    if (!user) {
      await signInAsGuest();
    }
    router.push('/play');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-950 px-4 py-12">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-gray-950 to-gray-950" />

      <main className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 text-center">
        {/* タイトル */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest text-cyan-500 uppercase">
            AI Investigation Game
          </p>
          <h1 className="text-5xl font-black tracking-tight text-white">
            AI<span className="text-cyan-400">Objection</span>
          </h1>
          <p className="text-base text-gray-400">
            AIが演じる犯人に自由に質問し、<br />
            矛盾を暴いて逮捕に追い込め。
          </p>
        </div>

        {/* コンセプト説明 */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <p className="font-semibold text-white">自由に質問する</p>
              <p className="text-sm text-gray-400">犯人AIは設定に基づいて自由に応答する。台本はない。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">⚖️</span>
            <div>
              <p className="font-semibold text-white">矛盾を突く</p>
              <p className="text-sm text-gray-400">証言の矛盾を見つけると動揺メーターが下がる。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-semibold text-white">逮捕に追い込む</p>
              <p className="text-sm text-gray-400">15回以内に証拠を突きつけ、真犯人を追い詰めろ。</p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleGuestPlay}
            className="w-full rounded-xl bg-cyan-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-cyan-500"
          >
            ゲストで試す（無料）
          </button>
          <button
            onClick={handleLogin}
            className="w-full rounded-xl border border-gray-600 py-4 text-base font-semibold text-gray-300 transition-colors hover:border-cyan-500 hover:text-white"
          >
            ログイン / 新規登録
          </button>
        </div>

        <p className="text-xs text-gray-600">
          © 2026 aigame.media
        </p>
      </main>
    </div>
  );
}
