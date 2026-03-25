'use client';

import { useState } from 'react';
import { useTips } from './TipsProvider';
import { TipWithStatus } from '@/types/tips';
import { TipsModal } from './TipsModal';

interface TipsListModalProps {
  onClose: () => void;
}

export function TipsListModal({ onClose }: TipsListModalProps) {
  const { getAllTips, showTip, activeTip, dismissTip } = useTips();
  const [previewTip, setPreviewTip] = useState<TipWithStatus | null>(null);

  const allTips = getAllTips();

  const handleTipClick = (tip: TipWithStatus) => {
    if (!tip.unlocked) return;
    setPreviewTip(tip);
  };

  const handlePreviewClose = () => {
    // 一覧から開いたTipsも既読にする
    if (previewTip && typeof window !== 'undefined') {
      localStorage.setItem(`tip_${previewTip.id}_seen`, '1');
    }
    setPreviewTip(null);
  };

  if (previewTip) {
    return (
      <div
        className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={handlePreviewClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <TipsModal tip={previewTip} onClose={handlePreviewClose} showOverlay={false} />
        </div>
      </div>
    );
  }

  // activeTip はプレビューとは別に管理されているが、リスト表示中は非表示にしない
  // （TipsProvider 側で表示されるため）
  void activeTip;
  void dismissTip;
  void showTip;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-stone-200 bg-white sm:rounded-2xl"
        style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <button onClick={onClose} className="text-sm text-amber-600 hover:underline">
            ← 戻る
          </button>
          <span className="font-semibold text-stone-700">❓ Tips</span>
          <div className="w-12" />
        </div>

        {/* Tips一覧 */}
        <div className="overflow-y-auto flex-1 p-3">
          <ul className="space-y-2">
            {allTips.map((tip) => (
              <li key={tip.id}>
                {tip.unlocked ? (
                  <button
                    onClick={() => handleTipClick(tip)}
                    className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition-colors hover:border-amber-400 hover:bg-amber-50"
                  >
                    <span className="text-base">{tip.seen ? '✅' : '🆕'}</span>
                    <span className="text-sm font-medium text-stone-700">{tip.title}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-4 py-3 opacity-50">
                    <span className="text-base">🔒</span>
                    <span className="text-sm text-stone-400">{tip.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
