'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { GameSessionData } from '@/types/game';

const verdictLabel: Record<string, string> = {
  arrest: '逮捕成功',
  escape: '証拠不十分',
};

const verdictColor: Record<string, string> = {
  arrest: 'text-cyan-400',
  escape: 'text-gray-500',
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSessionData[]>([]);
  const [caseTitles, setCaseTitles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [sessionRes, caseRes] = await Promise.all([
          authenticatedFetch('/api/get-session'),
          authenticatedFetch('/api/list-cases'),
        ]);
        if (!sessionRes.ok) throw new Error('Failed to fetch');
        const sessionData = await sessionRes.json();
        setSessions(sessionData.sessions ?? []);
        if (caseRes.ok) {
          const caseData = await caseRes.json();
          const titles: Record<string, string> = {};
          for (const c of caseData.cases ?? []) {
            titles[c.id] = c.title;
          }
          setCaseTitles(titles);
        }
      } catch {
        setError('履歴の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-black text-white">プレイ履歴</h1>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-gray-500">まだプレイ履歴がありません</p>
            <button
              onClick={() => router.push('/play')}
              className="rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-500"
            >
              ゲームをプレイする
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="rounded-2xl border border-gray-800 bg-gray-900 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">
                    {caseTitles[session.caseId] ?? session.caseId}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {session.verdict && (
                  <span className={`text-sm font-bold ${verdictColor[session.verdict]}`}>
                    {verdictLabel[session.verdict]}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-gray-400">
                <span>{session.turn} ターン</span>
                <span>コヒーレンス {session.coherence}</span>
                <span>{session.messages.length} メッセージ</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
