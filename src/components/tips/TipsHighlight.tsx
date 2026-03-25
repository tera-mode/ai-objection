'use client';

import { useEffect, useState } from 'react';

interface TipsHighlightProps {
  targetTestId: string;
  style?: 'pulse' | 'glow' | 'arrow';
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TipsHighlight({ targetTestId, style = 'pulse' }: TipsHighlightProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let removeListeners: (() => void) | null = null;

    const attachToElement = (el: Element) => {
      const update = () => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      };
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      removeListeners = () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    };

    const el = document.querySelector(`[data-testid="${targetTestId}"]`);
    if (el) {
      attachToElement(el);
    } else {
      // DOM にまだ存在しない場合は MutationObserver で出現を待つ
      observer = new MutationObserver(() => {
        const found = document.querySelector(`[data-testid="${targetTestId}"]`);
        if (found) {
          observer?.disconnect();
          observer = null;
          attachToElement(found);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      removeListeners?.();
    };
  }, [targetTestId]);

  if (!rect) return null;

  const padding = 6;

  return (
    <>
      {/* 暗幕オーバーレイ（4分割で対象要素を「穴抜き」） */}
      <div className="pointer-events-none fixed inset-0 z-[55]">
        {/* 上 */}
        <div
          className="absolute bg-black/60"
          style={{ top: 0, left: 0, right: 0, height: rect.top - padding }}
        />
        {/* 下 */}
        <div
          className="absolute bg-black/60"
          style={{
            top: rect.top + rect.height + padding,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        {/* 左 */}
        <div
          className="absolute bg-black/60"
          style={{
            top: rect.top - padding,
            left: 0,
            width: rect.left - padding,
            height: rect.height + padding * 2,
          }}
        />
        {/* 右 */}
        <div
          className="absolute bg-black/60"
          style={{
            top: rect.top - padding,
            left: rect.left + rect.width + padding,
            right: 0,
            height: rect.height + padding * 2,
          }}
        />
      </div>

      {/* ハイライトボーダー */}
      <div
        className="pointer-events-none fixed z-[56]"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: '12px',
          border: '3px solid #f59e0b',
          animation:
            style === 'pulse' ? 'tipsHighlightPulse 1.2s ease-in-out infinite' : undefined,
          boxShadow: '0 0 0 0 rgba(245,158,11,0.7)',
        }}
      />

      <style>{`
        @keyframes tipsHighlightPulse {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
      `}</style>
    </>
  );
}
