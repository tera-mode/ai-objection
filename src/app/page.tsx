'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, signInAsGuest } = useAuth();

  const handleGuestPlay = async () => {
    if (!user) {
      await signInAsGuest();
    }
    router.push('/play');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-amber-50 px-4 pb-12">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/60 via-amber-50 to-amber-100" />

      <main className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6">
        {/* キービジュアル */}
        <div className="w-full">
          <Image
            src="/images/key_visual.webp"
            alt="問わない異世界の探偵少女"
            width={800}
            height={800}
            className="w-full object-cover"
            priority
          />
        </div>

        {/* タイトル */}
        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase">
            AI Investigation Game
          </p>
          <p className="text-base text-stone-600">
            AIが演じる犯人に自由に質問し、<br />
            矛盾を暴いて逮捕に追い込め。
          </p>
        </div>

        {/* コンセプト説明 */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-amber-200 bg-white/70 p-5 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <p className="font-semibold text-stone-800">自由に質問する</p>
              <p className="text-sm text-stone-500">犯人AIは設定に基づいて自由に応答する。台本はない。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">⚖️</span>
            <div>
              <p className="font-semibold text-stone-800">矛盾を突く</p>
              <p className="text-sm text-stone-500">証言の矛盾を見つけると動揺メーターが下がる。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-semibold text-stone-800">逮捕に追い込む</p>
              <p className="text-sm text-stone-500">15回以内に証拠を突きつけ、真犯人を追い詰めろ。</p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleGuestPlay}
            className="w-full rounded-xl bg-amber-500 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-amber-400"
          >
            ゲストで試す（無料）
          </button>
          <button
            onClick={handleLogin}
            className="w-full rounded-xl border border-stone-300 bg-white/80 py-4 text-base font-semibold text-stone-600 transition-colors hover:border-amber-400 hover:text-stone-800"
          >
            ログイン / 新規登録
          </button>
        </div>

        <p className="text-xs text-stone-400">
          © 2026 aigame.media
        </p>
      </main>
    </div>
  );
}
