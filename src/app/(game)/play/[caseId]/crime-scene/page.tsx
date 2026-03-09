'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { Evidence } from '@/types/game';

// ケース別イントロ画像
const INTRO_IMAGES: Record<string, string> = {
  case_001: '/images/intro/case_001_intro.jpg',
  case_002: '/images/intro/case_002_intro.jpg',
  case_003: '/images/intro/case_003_intro.jpg',
};

interface CasePageData {
  title: string;
  storyText: {
    intro: string;
    criminalIntro: string;
  };
  evidence: Evidence[];
}

function CrimeSceneContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { startSession, isLoading, previousTestimony } = useGame();
  const [phase, setPhase] = useState<'intro' | 'evidence' | 'criminal' | 'previous'>('intro');
  const [data, setData] = useState<CasePageData | null>(null);

  useEffect(() => {
    authenticatedFetch(`/api/get-case?caseId=${caseId}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error);
  }, [caseId]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const handleStartInterrogation = async () => {
    try {
      await startSession(caseId);
      router.push(`/play/${caseId}/interrogation`);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/play')}
            className="text-gray-400 hover:text-white"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-white">{data.title}</h1>
        </div>

        {/* フェーズ表示 */}
        {phase === 'intro' && (
          <div className="flex flex-col gap-6">
            {INTRO_IMAGES[caseId] && (
              <div className="overflow-hidden rounded-2xl border border-gray-800">
                <Image
                  src={INTRO_IMAGES[caseId]}
                  alt="事件現場"
                  width={800}
                  height={450}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            )}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-3 text-xs font-semibold text-cyan-500 uppercase tracking-wider">事件概要</p>
              <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">{data.storyText.intro}</p>
            </div>
            <button
              onClick={() => setPhase('evidence')}
              className="w-full rounded-xl bg-gray-800 py-4 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              証拠を確認する →
            </button>
          </div>
        )}

        {phase === 'evidence' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-3 text-xs font-semibold text-cyan-500 uppercase tracking-wider">証拠一覧</p>
              <ul className="space-y-2">
                {data.evidence.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-0.5 text-cyan-500">▸</span>
                    <span>{ev.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setPhase('criminal')}
              className="w-full rounded-xl bg-gray-800 py-4 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              容疑者と対峙する →
            </button>
          </div>
        )}

        {phase === 'criminal' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-5">
              <p className="mb-3 text-xs font-semibold text-cyan-500 uppercase tracking-wider">容疑者登場</p>
              <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">{data.storyText.criminalIntro}</p>
            </div>
            <button
              onClick={() => previousTestimony.length > 0 ? setPhase('previous') : handleStartInterrogation()}
              disabled={isLoading}
              className="w-full rounded-xl bg-cyan-600 py-4 font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              {isLoading ? '準備中...' : previousTestimony.length > 0 ? '前回の証言を確認する →' : '尋問を開始する'}
            </button>
          </div>
        )}

        {phase === 'previous' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-yellow-900/50 bg-yellow-950/20 p-5">
              <p className="mb-1 text-xs font-semibold text-yellow-400 uppercase tracking-wider">前回の尋問記録</p>
              <p className="mb-4 text-xs text-gray-500">容疑者が前回の尋問で述べた証言。今回と食い違いがあれば矛盾として突ける。</p>
              <ul className="space-y-2">
                {previousTestimony.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-0.5 shrink-0 text-yellow-500">▸</span>
                    <span>「{t}」</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleStartInterrogation}
              disabled={isLoading}
              className="w-full rounded-xl bg-cyan-600 py-4 font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              {isLoading ? '準備中...' : '尋問を開始する'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrimeScenePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return <CrimeSceneContent caseId={caseId} />;
}
