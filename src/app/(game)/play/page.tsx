'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

const PROLOGUE_SEEN_KEY = 'event_prologue_b_seen';

interface CaseItem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
}

const difficultyLabel: Record<string, string> = {
  easy: '初級',
  medium: '中級',
  hard: '上級',
};

const difficultyColor: Record<string, string> = {
  easy: 'text-green-600 border-green-300 bg-green-50',
  medium: 'text-yellow-600 border-yellow-300 bg-yellow-50',
  hard: 'text-red-600 border-red-300 bg-red-50',
};

export default function PlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [sampleCases, setSampleCases] = useState<CaseItem[]>([]);

  // プロローグ未視聴の場合はリダイレクト
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(PROLOGUE_SEEN_KEY);
      if (!seen) {
        router.push('/event/prologue_a');
      }
    }
  }, [router]);

  useEffect(() => {
    authenticatedFetch('/api/list-cases')
      .then((res) => res.json())
      .then((data) => {
        setCases(data.cases ?? []);
        setSampleCases(data.sampleCases ?? []);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-stone-900">ケース選択</h1>
            <p className="mt-1 text-sm text-stone-500">
              {user?.isAnonymous ? 'ゲストプレイ中' : user?.displayName ?? user?.email}
            </p>
          </div>
          <button
            onClick={() => router.push('/settings')}
            aria-label="設定"
            className="mt-1 rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/play/${c.id}/crime-scene`)}
              data-testid={`case-select-${c.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-stone-900 group-hover:text-amber-600">
                  {c.title}
                </h2>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${difficultyColor[c.difficulty] ?? ''}`}>
                  {difficultyLabel[c.difficulty] ?? c.difficulty}
                </span>
              </div>
              <p className="text-sm text-stone-500">{c.description}</p>
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <span>プレイする</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>

        {sampleCases.length > 0 && (
          <div className="mt-8 border-t border-stone-200 pt-6">
            <p className="mb-3 text-xs text-stone-400">サンプルシナリオ</p>
            <div className="flex flex-col gap-2">
              {sampleCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/play/${c.id}/crime-scene`)}
                  data-testid={`case-select-${c.id}`}
                  className="text-left text-xs text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
                >
                  {c.title}（{difficultyLabel[c.difficulty] ?? c.difficulty}）→
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
