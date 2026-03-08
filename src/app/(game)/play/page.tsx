'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const CASES = [
  {
    id: 'case_001',
    title: '最初の逆転',
    difficulty: 'easy',
    description: '親友の無実を証明せよ。証言の矛盾を突いて真犯人を暴け。',
  },
  {
    id: 'case_002',
    title: '水族館の閉館後に',
    difficulty: 'hard',
    description: '水族館の飼育員が死んだ。転落事故か、殺人か。証人の嘘を見抜け。',
  },
];

const difficultyLabel: Record<string, string> = {
  easy: '初級',
  medium: '中級',
  hard: '上級',
};

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400 border-green-400/30 bg-green-400/10',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  hard: 'text-red-400 border-red-400/30 bg-red-400/10',
};

export default function PlayPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">ケース選択</h1>
          <p className="mt-1 text-sm text-gray-400">
            {user?.isAnonymous ? 'ゲストプレイ中' : user?.displayName ?? user?.email}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/play/${c.id}/crime-scene`)}
              className="group flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-5 text-left transition-all hover:border-cyan-500/50 hover:bg-gray-900/80"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-white group-hover:text-cyan-300">
                  {c.title}
                </h2>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${difficultyColor[c.difficulty]}`}>
                  {difficultyLabel[c.difficulty]}
                </span>
              </div>
              <p className="text-sm text-gray-400">{c.description}</p>
              <div className="flex items-center gap-2 text-xs text-cyan-500">
                <span>プレイする</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
