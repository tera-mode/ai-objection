'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface StoryFlowItem {
  type: 'event' | 'case';
  id: string;
  title: string;
  difficulty?: string;
  description?: string;
  card?: {
    characterImage: string;
    backgroundImage: string;
  } | null;
}

interface CaseSummary {
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

const difficultyStars: Record<string, string> = {
  easy: '★☆☆',
  medium: '★★☆',
  hard: '★★★',
};

function isItemCompleted(item: StoryFlowItem): boolean {
  if (typeof window === 'undefined') return false;
  if (item.type === 'event') {
    // 互換: 旧キー event_prologue_b_seen も prologue の完了として扱う
    if (item.id === 'prologue') {
      return (
        localStorage.getItem('event_prologue_seen') === '1' ||
        !!localStorage.getItem('event_prologue_b_seen')
      );
    }
    return localStorage.getItem(`event_${item.id}_seen`) === '1';
  } else {
    return localStorage.getItem(`case_${item.id}_cleared`) === '1';
  }
}

function isItemUnlocked(items: StoryFlowItem[], index: number): boolean {
  if (index === 0) return true;
  const prev = items[index - 1];
  return isItemCompleted(prev);
}

export default function PlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<StoryFlowItem[]>([]);
  const [sampleCases, setSampleCases] = useState<CaseSummary[]>([]);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const firstUnlockedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authenticatedFetch('/api/story-flow')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? []);
        setSampleCases(data.sampleCases ?? []);
        forceUpdate((n) => n + 1);
      })
      .catch(console.error);
  }, []);

  // 最初のアンロック済み・未完了アイテムに自動スクロール
  useEffect(() => {
    if (items.length === 0) return;
    const firstUnlockedNotDone = items.findIndex(
      (item, i) => isItemUnlocked(items, i) && !isItemCompleted(item)
    );
    if (firstUnlockedNotDone >= 0) {
      firstUnlockedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [items]);

  function handleItemClick(item: StoryFlowItem, _index: number) {
    if (item.type === 'event') {
      // prologue は prologue_a → mini_prologue → prologue_b のフロー
      const eventRoute = item.id === 'prologue' ? 'prologue_a' : item.id;
      router.push(`/event/${eventRoute}`);
    } else {
      router.push(`/play/${item.id}/crime-scene`);
    }
  }

  const firstUnlockedNotDoneIndex = items.findIndex(
    (item, i) => isItemUnlocked(items, i) && !isItemCompleted(item)
  );

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* ヘッダー */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-stone-900">問わない異世界の探偵少女</h1>
            <p className="mt-1 text-sm text-stone-500">
              {user?.isAnonymous ? 'ゲストプレイ中' : (user?.displayName ?? user?.email)}
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

        {/* ストーリーセクション */}
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          ストーリー
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const unlocked = isItemUnlocked(items, index);
            const completed = isItemCompleted(item);
            const isFirstTarget = index === firstUnlockedNotDoneIndex;

            if (item.type === 'event') {
              return (
                <div key={item.id} ref={isFirstTarget ? firstUnlockedRef : null}>
                  <button
                    onClick={() => handleItemClick(item, index)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      !unlocked
                        ? 'border-stone-200 bg-stone-100 opacity-60'
                        : completed
                        ? 'border-stone-200 bg-stone-50 hover:border-stone-300'
                        : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100'
                    }`}
                  >
                    <span className="text-lg">📖</span>
                    <span className={`flex-1 text-sm font-semibold ${completed ? 'text-stone-400' : 'text-stone-700'}`}>
                      {item.title}
                    </span>
                    {!unlocked && <span className="text-base">🔒</span>}
                    {unlocked && !completed && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                        NEW
                      </span>
                    )}
                    {completed && <span className="text-green-500 text-sm font-bold">✓</span>}
                  </button>
                </div>
              );
            }

            // ケースカード
            const card = item.card;
            return (
              <div key={item.id} ref={isFirstTarget ? firstUnlockedRef : null}>
                <button
                  onClick={() => handleItemClick(item, index)}
                  data-testid={`case-select-${item.id}`}
                  className={`w-full relative overflow-hidden rounded-2xl text-left transition-all ${
                    !unlocked
                      ? 'opacity-60'
                      : 'hover:scale-[1.01] active:scale-100'
                  }`}
                  style={{ height: '200px' }}
                >
                  {/* 背景画像 */}
                  {card?.backgroundImage ? (
                    <Image
                      src={card.backgroundImage}
                      alt=""
                      fill
                      className="object-cover object-top"
                      sizes="448px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-stone-700" />
                  )}

                  {/* 暗めオーバーレイ（下側を強く） */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                  {/* キャラ画像 */}
                  {card?.characterImage && (
                    <div className="absolute bottom-0 right-2 h-full flex items-end">
                      <Image
                        src={card.characterImage}
                        alt=""
                        width={160}
                        height={200}
                        className="object-contain object-bottom drop-shadow-2xl"
                      />
                    </div>
                  )}

                  {/* テキスト（左下） */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-amber-300 font-semibold mb-0.5">
                          {difficultyStars[item.difficulty ?? 'easy']} {difficultyLabel[item.difficulty ?? 'easy']}
                        </p>
                        <h2 className="text-base font-bold text-white leading-tight">
                          {item.title}
                        </h2>
                        {item.description && (
                          <p className="text-xs text-stone-300 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 ml-2">
                        {!unlocked && <span className="text-xl">🔒</span>}
                        {unlocked && !completed && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                            NEW
                          </span>
                        )}
                        {completed && (
                          <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                            ✓ クリア
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* サンプルシナリオ */}
        {sampleCases.length > 0 && (
          <div className="mt-8 border-t border-stone-200 pt-6">
            <button
              onClick={() => setSampleOpen((v) => !v)}
              className="flex w-full items-center justify-between text-xs text-stone-400 hover:text-stone-600"
            >
              <span>サンプルシナリオ</span>
              <span>{sampleOpen ? '▲' : '▼'}</span>
            </button>
            {sampleOpen && (
              <div className="mt-3 flex flex-col gap-2">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
