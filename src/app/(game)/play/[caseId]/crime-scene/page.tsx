'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { useTips } from '@/components/tips/TipsProvider';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

// ケース別イントロ画像
const INTRO_IMAGES: Record<string, string> = {
  case_001: '/images/intro/case_001_intro.jpg',
  case_002: '/images/intro/case_002_intro.jpg',
  case_003: '/images/intro/case_003_intro.jpg',
  case_004: '/images/intro/case_004_intro.jpg',
  case_005: '/images/intro/case_005_intro.jpg',
  case_006: '/images/intro/case_006_intro.jpg',
  case_007: '/images/intro/case_007_intro.jpg',
  case_008: '/images/intro/case_008_intro.jpg',
  case_sample_001: '/images/intro/case_sample_001_intro.jpg',
  case_sample_002: '/images/intro/case_sample_002_intro.jpg',
  case_sample_003: '/images/intro/case_sample_003_intro.jpg',
};

// ケース別・容疑者登場用画像
const CRIMINAL_BG: Record<string, string> = {
  mini_prologue: '/images/backgrounds/fantasy_bg.jpg',
  case_001: '/images/backgrounds/case_001_interrogation.jpg',
  case_002: '/images/backgrounds/case_002_interrogation.jpg',
  case_003: '/images/backgrounds/case_003_interrogation.jpg',
  case_004: '/images/backgrounds/case_004_interrogation.jpg',
  case_005: '/images/backgrounds/case_005_interrogation.jpg',
  case_006: '/images/backgrounds/case_006_interrogation.jpg',
  case_007: '/images/backgrounds/case_007_interrogation.jpg',
  case_008: '/images/backgrounds/case_008_interrogation.jpg',
};

const CRIMINAL_CHAR: Record<string, string> = {
  mini_prologue: '/images/characters/gamekichi/smug.png',
  case_001: '/images/characters/case_001/normal.png',
  case_002: '/images/characters/case_002/normal.png',
  case_003: '/images/characters/case_003/normal.png',
  case_004: '/images/characters/case_004/normal.png',
  case_005: '/images/characters/case_005/normal.png',
  case_006: '/images/characters/case_006/normal.png',
  case_007: '/images/characters/case_007/normal.png',
  case_008: '/images/characters/case_008/normal.png',
};

interface CasePageData {
  title: string;
  storyText: {
    intro: string;
    criminalIntro: string;
  };
}

function CrimeSceneContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { startSession, isLoading, previousTestimony } = useGame();
  const { checkAndShowTip } = useTips();
  const [phase, setPhase] = useState<'intro' | 'criminal' | 'previous'>('intro');
  const [data, setData] = useState<CasePageData | null>(null);

  // 初回マウント時に screen_enter トリガー
  useEffect(() => {
    checkAndShowTip({ type: 'screen_enter', screen: 'crime-scene', caseId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    authenticatedFetch(`/api/get-case?caseId=${caseId}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error);
  }, [caseId]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
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
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/play')}
            className="text-stone-400 hover:text-stone-700"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-stone-900">{data.title}</h1>
        </div>

        {/* フェーズ表示 */}
        {phase === 'intro' && (
          <div className="flex flex-col gap-6">
            {INTRO_IMAGES[caseId] && (
              <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
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
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">事件概要</p>
              <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-line">{data.storyText.intro}</p>
            </div>
            <button
              onClick={() => setPhase('criminal')}
              className="w-full rounded-xl bg-stone-200 py-4 font-semibold text-stone-800 transition-colors hover:bg-stone-300"
            >
              容疑者と対峙する →
            </button>
          </div>
        )}

        {phase === 'criminal' && (
          <div className="flex flex-col gap-6">
            {/* 犯人キャラ＋背景カード */}
            {(CRIMINAL_BG[caseId] || CRIMINAL_CHAR[caseId]) && (
              <div className="relative overflow-hidden rounded-2xl shadow-sm" style={{ height: '300px' }}>
                {CRIMINAL_BG[caseId] && (
                  <Image
                    src={CRIMINAL_BG[caseId]}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="448px"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10" />
                {CRIMINAL_CHAR[caseId] && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <Image
                      src={CRIMINAL_CHAR[caseId]}
                      alt="容疑者"
                      width={260}
                      height={300}
                      className="object-contain object-bottom drop-shadow-2xl"
                      priority
                    />
                  </div>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5">
              <p className="mb-3 text-xs font-semibold text-amber-600 uppercase tracking-wider">容疑者登場</p>
              <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-line">{data.storyText.criminalIntro}</p>
            </div>
            <button
              onClick={() => previousTestimony.length > 0 ? setPhase('previous') : handleStartInterrogation()}
              disabled={isLoading}
              data-testid="start-interrogation"
              className="w-full rounded-xl bg-amber-500 py-4 font-bold text-white transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {isLoading ? '準備中...' : previousTestimony.length > 0 ? '前回の証言を確認する →' : '尋問を開始する'}
            </button>
          </div>
        )}

        {phase === 'previous' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-5">
              <p className="mb-1 text-xs font-semibold text-yellow-600 uppercase tracking-wider">前回の尋問記録</p>
              <p className="mb-4 text-xs text-stone-500">容疑者が前回の尋問で述べた証言。今回と食い違いがあれば矛盾として突ける。</p>
              <ul className="space-y-2">
                {previousTestimony.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="mt-0.5 shrink-0 text-yellow-500">▸</span>
                    <span>「{t}」</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleStartInterrogation}
              disabled={isLoading}
              data-testid="start-interrogation"
              className="w-full rounded-xl bg-amber-500 py-4 font-bold text-white transition-colors hover:bg-amber-400 disabled:opacity-50"
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
