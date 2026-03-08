'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface StoryText {
  victory: string;
  defeat: string;
}

function ResultContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { session } = useGame();
  const [storyText, setStoryText] = useState<StoryText | null>(null);

  useEffect(() => {
    authenticatedFetch(`/api/get-case?caseId=${caseId}`)
      .then((res) => res.json())
      .then((data) => setStoryText(data.storyText))
      .catch(console.error);
  }, [caseId]);

  if (!session) {
    router.push('/play');
    return null;
  }

  const isArrest = session.verdict === 'arrest';

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-8">
        {/* 結果 */}
        <div className={`flex flex-col items-center gap-3 rounded-2xl border p-6 w-full text-center ${
          isArrest
            ? 'border-cyan-500/50 bg-cyan-950/20'
            : 'border-gray-700 bg-gray-900/50'
        }`}>
          <div className="text-5xl">{isArrest ? '⚖️' : '🔍'}</div>
          <h1 className={`text-2xl font-black ${isArrest ? 'text-cyan-400' : 'text-gray-400'}`}>
            {isArrest ? '逮捕成功！' : '証拠不十分...'}
          </h1>
          <div className="flex gap-6 text-sm text-gray-400">
            <div>
              <span className="font-bold text-white">{session.turn}</span>
              <span> / 15 ターン</span>
            </div>
            <div>
              <span className="font-bold text-white">{session.coherence}</span>
              <span> / 100 コヒーレンス</span>
            </div>
          </div>
        </div>

        {/* ストーリーテキスト */}
        {storyText && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 w-full">
            <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">
              {isArrest ? storyText.victory : storyText.defeat}
            </p>
          </div>
        )}

        {/* アクション */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => router.push(`/play/${caseId}/crime-scene`)}
            className="w-full rounded-xl bg-cyan-600 py-4 font-bold text-white transition-colors hover:bg-cyan-500"
          >
            もう一度挑戦する
          </button>
          <button
            onClick={() => router.push('/play')}
            className="w-full rounded-xl border border-gray-700 py-4 font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
          >
            ケース選択に戻る
          </button>
          <button
            onClick={() => router.push('/history')}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            プレイ履歴を見る
          </button>
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
