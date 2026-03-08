'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';

const CASE_DATA: Record<string, {
  title: string;
  intro: string;
  criminalIntro: string;
  evidenceSummary: string[];
}> = {
  case_001: {
    title: '最初の逆転',
    intro: '被告人・矢上正人は、あなたの幼馴染だ。子どもの頃、転校してきたあなたがいじめられていたとき、唯一味方になってくれた親友。その矢上が、元恋人・高梨美咲の殺害容疑で逮捕された。「オレはやってない。信じてくれ。」あなたは親友の無実を証明しなければならない。',
    criminalIntro: '証人として法廷に現れたのは、山城星也。にこやかな笑顔。もみ手。「私はあの日、たまたま現場の前を通りかかりまして。」「矢上さんが部屋から飛び出してくるのを、この目でハッキリ見ましたよ。」自信たっぷりの態度──だが、何かがおかしい。',
    evidenceSummary: [
      '司法解剖報告書：死亡推定時刻 午後4〜5時',
      '「考える人」の置物：時刻を読み上げる内蔵時計つき',
      '停電の記録：事件当日 午前11時〜午後3時',
      '被害者のパスポート：先週NYから帰国',
      'コンビニのレシート：矢上が午後4時30分に購入',
    ],
  },
  case_002: {
    title: '水族館の閉館後に',
    intro: '翌朝。バックヤードの奥で、カムが一人でいる。海老原さんが死んだ。警察は「事故」と言っている。暗いバックヤードで足を滑らせた転落事故、と。何かが、おかしい。',
    criminalIntro: '証人として現れたのは、永瀬達也。清潔感のあるネイビースーツ。黒縁眼鏡。「私はあの日、海老原さんとロビーでお話ししただけです。バックヤードには入っていません。」丁寧で信頼できそうな態度──だが、何かがおかしい。',
    evidenceSummary: [
      '夜間給餌チェックリスト：A・B水槽のみ記入済み',
      'バックヤード入退室記録：17:35に入室ログあり',
      '館長・富岡の証言：17〜18:30は別の打ち合わせ',
      '収賄関連書類コピー：永瀬のサインあり',
      '司法解剖報告書：死亡推定時刻 18〜19時',
    ],
  },
};

function CrimeSceneContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { startSession, isLoading, previousTestimony } = useGame();
  const [phase, setPhase] = useState<'intro' | 'evidence' | 'criminal' | 'previous'>('intro');

  const data = CASE_DATA[caseId];
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-red-400">
        ケースが見つかりません
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
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-3 text-xs font-semibold text-cyan-500 uppercase tracking-wider">事件概要</p>
              <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">{data.intro}</p>
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
                {data.evidenceSummary.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-0.5 text-cyan-500">▸</span>
                    <span>{ev}</span>
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
              <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">{data.criminalIntro}</p>
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
