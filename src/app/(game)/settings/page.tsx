'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// localStorageに保存されているすべての進行フラグキー
const PROGRESS_KEYS = [
  'event_prologue_a_seen',
  'event_prologue_b_seen',
  'event_prologue_seen',
  'event_after_case_001_seen',
  'event_after_case_002_seen',
  'event_after_case_003_seen',
  'event_after_case_004_seen',
  'event_after_case_005_seen',
  'event_after_case_006_seen',
  'event_after_case_007_seen',
  'event_after_case_008_seen',
  'event_ending_seen',
  'event_credits_seen',
  'case_case_001_cleared',
  'case_case_002_cleared',
  'case_case_003_cleared',
  'case_case_004_cleared',
  'case_case_005_cleared',
  'case_case_006_cleared',
  'case_case_007_cleared',
  'case_case_008_cleared',
];

export default function SettingsPage() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      PROGRESS_KEYS.forEach((key) => localStorage.removeItem(key));
    }
    router.replace('/play');
  };

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
            aria-label="戻る"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-black text-stone-900">設定</h1>
        </div>

        {/* 設定項目 */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">ゲームの進行</p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-stone-50"
            >
              <div>
                <p className="font-semibold text-stone-900">はじめから</p>
                <p className="mt-0.5 text-xs text-stone-400">プロローグから再スタートします</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-stone-900">はじめからスタート</h2>
            <p className="mt-2 text-sm text-stone-500">
              進行フラグをすべてリセットし、プロローグから再スタートします。
              プレイ履歴は削除されません。
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleReset}
                className="w-full rounded-xl bg-red-500 py-3 font-bold text-white transition-colors hover:bg-red-400"
              >
                リセットしてはじめから
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-xl border border-stone-200 py-3 font-semibold text-stone-600 transition-colors hover:bg-stone-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
