'use client';

import { Tip } from '@/types/tips';

interface TipsModalProps {
  tip: Tip;
  onClose: () => void;
  /** trueのとき独自の暗幕オーバーレイを表示する（TipsHighlightがない場合）。デフォルト true */
  showOverlay?: boolean;
}

export function TipsModal({ tip, onClose, showOverlay = true }: TipsModalProps) {
  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4 ${
        showOverlay ? 'bg-black/70 backdrop-blur-sm' : ''
      }`}
      onClick={showOverlay ? onClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* タイトルと閉じるボタン */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-stone-800">{tip.title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-stone-400 hover:text-stone-700"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* Tips画像（あれば） */}
        {tip.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tip.image}
            alt=""
            className="mb-4 w-full rounded-lg object-contain"
          />
        )}

        {/* 説明テキスト */}
        <p className="mb-5 text-sm leading-relaxed text-stone-700 whitespace-pre-line">
          {tip.text}
        </p>

        {/* 閉じるボタン（下部） */}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white transition-colors hover:bg-amber-400"
        >
          わかった！
        </button>
      </div>
    </div>
  );
}
