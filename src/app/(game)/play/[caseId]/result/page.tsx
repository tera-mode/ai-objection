'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface StoryText {
  victory: string;
  defeat: string;
}

interface EventAfter {
  victory?: string;
  defeat?: string;
}

function ResultContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { session } = useGame();
  const [storyText, setStoryText] = useState<StoryText | null>(null);
  const [eventAfter, setEventAfter] = useState<EventAfter | null>(null);

  useEffect(() => {
    authenticatedFetch(`/api/get-case?caseId=${caseId}`)
      .then((res) => res.json())
      .then((data) => {
        setStoryText(data.storyText);
        setEventAfter(data.eventAfter ?? null);
      })
      .catch(console.error);
  }, [caseId]);

  useEffect(() => {
    if (!session) {
      router.push('/play');
    }
  }, [session, router]);

  if (!session) return null;

  const isArrest = session.verdict === 'arrest';

  // 逮捕成功時にクリア記録をlocalStorageに保存
  useEffect(() => {
    if (isArrest && typeof window !== 'undefined') {
      localStorage.setItem(`case_${caseId}_cleared`, '1');
    }
  }, [isArrest, caseId]);

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-8">
        {/* 結果 */}
        <div className={`flex flex-col items-center gap-3 rounded-2xl border p-6 w-full text-center shadow-sm ${
          isArrest
            ? 'border-amber-300 bg-amber-100'
            : 'border-stone-200 bg-white'
        }`}>
          <div className="text-5xl">{isArrest ? '⚖️' : '🔍'}</div>
          <h1 className={`text-2xl font-black ${isArrest ? 'text-amber-600' : 'text-stone-500'}`}>
            {isArrest ? '逮捕成功！' : '証拠不十分...'}
          </h1>
          <div className="flex gap-6 text-sm text-stone-500">
            <div>
              <span className="font-bold text-stone-900">{session.turn}</span>
              <span> ターン</span>
            </div>
            <div>
              <span className="font-bold text-stone-900">{session.coherence}</span>
              <span> / {session.maxCoherence} 動揺度</span>
            </div>
          </div>
        </div>

        {/* ストーリーテキスト */}
        {storyText && (
          <div className="rounded-2xl border border-stone-200 bg-white p-5 w-full shadow-sm">
            <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-line">
              {isArrest ? storyText.victory : storyText.defeat}
            </p>
          </div>
        )}

        {/* 負け時：リトライ訴求カード */}
        {!isArrest && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 w-full">
            <p className="mb-3 text-sm font-bold text-amber-700">💡 もう一度挑戦できます</p>
            <ul className="space-y-2 text-sm text-stone-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-amber-500">📜</span>
                <span>前回の会話は尋問画面の<span className="font-semibold">「証言」ログ</span>でいつでも確認できます</span>
              </li>
              {(session.unlockedEvidenceIds?.length ?? 0) > 0 && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-amber-500">🔓</span>
                  <span>
                    アンロック済みの証拠
                    <span className="font-semibold text-amber-600"> {session.unlockedEvidenceIds.length}件</span>
                    はそのまま引き継がれます
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* アクション */}
        <div className="flex w-full flex-col gap-3">
          {/* eventAfter がある場合（mini_prologue 等）は専用ボタン */}
          {eventAfter ? (
            <>
              {isArrest && eventAfter.victory && (
                <button
                  onClick={() => router.push(eventAfter.victory!)}
                  className="w-full rounded-xl bg-amber-500 py-4 font-bold text-white transition-colors hover:bg-amber-400"
                >
                  つづきへ →
                </button>
              )}
              {!isArrest && (
                <button
                  onClick={() => router.push(`/play/${caseId}/crime-scene`)}
                  className="w-full rounded-xl bg-amber-500 py-4 font-bold text-white transition-colors hover:bg-amber-400"
                >
                  🔄 前回の証言を活かして再挑戦する
                </button>
              )}
              <button
                onClick={() => router.push('/play')}
                className="w-full rounded-xl border border-stone-300 bg-white py-4 font-semibold text-stone-700 transition-colors hover:border-amber-400 hover:text-stone-900"
              >
                ケース選択に戻る
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push(`/play/${caseId}/crime-scene`)}
                className="w-full rounded-xl bg-amber-500 py-4 font-bold text-white transition-colors hover:bg-amber-400"
              >
                {isArrest ? 'もう一度挑戦する' : '🔄 前回の証言を活かして再挑戦する'}
              </button>
              <button
                onClick={() => router.push('/play')}
                className="w-full rounded-xl border border-stone-300 bg-white py-4 font-semibold text-stone-700 transition-colors hover:border-amber-400 hover:text-stone-900"
              >
                ケース選択に戻る
              </button>
              <button
                onClick={() => router.push('/history')}
                className="text-sm text-stone-400 hover:text-stone-600"
              >
                プレイ履歴を見る
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return <ResultContent caseId={caseId} />;
}
