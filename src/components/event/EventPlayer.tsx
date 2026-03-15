'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EventData } from '@/types/event';

const TYPEWRITER_MS = 30;

export default function EventPlayer({
  eventData,
  onComplete,
}: {
  eventData: EventData;
  onComplete?: () => void;
}) {
  const [background, setBackground] = useState<string | null>(null);
  const [leftChar, setLeftChar] = useState<string | null>(null);
  const [rightChar, setRightChar] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(1); // start black
  const [currentDialogue, setCurrentDialogue] = useState<{ speaker: string | null; text: string } | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dialogueStepIndex, setDialogueStepIndex] = useState(-1);

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const stepsRef = useRef(eventData.steps);
  stepsRef.current = eventData.steps;

  const clearTypewriter = useCallback(() => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, []);

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(() => {
      timeoutsRef.current.delete(t);
      fn();
    }, delay);
    timeoutsRef.current.add(t);
  }, []);

  const startTypewriterImpl = useCallback(
    (text: string) => {
      clearTypewriter();
      setDisplayedText('');
      setIsTyping(true);
      let idx = 0;
      typewriterRef.current = setInterval(() => {
        idx++;
        setDisplayedText(text.slice(0, idx));
        if (idx >= text.length) {
          clearTypewriter();
          setIsTyping(false);
        }
      }, TYPEWRITER_MS);
    },
    [clearTypewriter],
  );

  const startTypewriterRef = useRef(startTypewriterImpl);
  startTypewriterRef.current = startTypewriterImpl;

  const addTimeoutRef = useRef(addTimeout);
  addTimeoutRef.current = addTimeout;

  const processFromRef = useRef<(i: number) => void>(null as unknown as (i: number) => void);

  processFromRef.current = (startIndex: number) => {
    const steps = stepsRef.current;
    let i = startIndex;

    while (i < steps.length) {
      const step = steps[i];

      if (step.type === 'dialogue') {
        setCurrentDialogue({ speaker: step.speaker ?? null, text: step.text });
        setDialogueStepIndex(i);
        startTypewriterRef.current(step.text);
        return;
      }

      if (step.type === 'scene') {
        const bg = step.background;
        if (step.transition === 'fade') {
          const duration = step.duration ?? 700;
          setOverlayOpacity(1);
          addTimeoutRef.current(() => {
            setBackground(bg);
            setOverlayOpacity(0);
          }, 350);
          addTimeoutRef.current(() => processFromRef.current?.(i + 1), duration);
          return;
        } else {
          setBackground(bg);
        }
      } else if (step.type === 'character') {
        const img = step.image ?? null;
        if (step.position === 'left') setLeftChar(img);
        else setRightChar(img);
      } else if (step.type === 'effect') {
        const dur = step.duration ?? 500;
        if (step.name === 'fadeToBlack') {
          setOverlayOpacity(1);
          addTimeoutRef.current(() => processFromRef.current?.(i + 1), dur + 500);
          return;
        } else if (step.name === 'fadeFromBlack') {
          setOverlayOpacity(1);
          addTimeoutRef.current(() => setOverlayOpacity(0), 50);
          addTimeoutRef.current(() => processFromRef.current?.(i + 1), 600);
          return;
        } else if (step.name === 'flash') {
          setOverlayOpacity(0.8);
          addTimeoutRef.current(() => setOverlayOpacity(0), dur);
          addTimeoutRef.current(() => processFromRef.current?.(i + 1), dur + 300);
          return;
        } else {
          // shake and others: just wait duration
          addTimeoutRef.current(() => processFromRef.current?.(i + 1), dur);
          return;
        }
      } else if (step.type === 'wait') {
        addTimeoutRef.current(() => processFromRef.current?.(i + 1), step.duration);
        return;
      }

      i++;
    }

    // All steps done
    onCompleteRef.current?.();
  };

  // Start processing on mount
  useEffect(() => {
    processFromRef.current?.(0);
    return () => {
      clearTypewriter();
      clearAllTimeouts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = useCallback(() => {
    if (isTyping) {
      clearTypewriter();
      setIsTyping(false);
      if (currentDialogue) setDisplayedText(currentDialogue.text);
      return;
    }
    if (dialogueStepIndex >= 0) {
      const nextIndex = dialogueStepIndex + 1;
      setDialogueStepIndex(-1);
      processFromRef.current?.(nextIndex);
    }
  }, [isTyping, currentDialogue, dialogueStepIndex, clearTypewriter]);

  const handleSkip = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearTypewriter();
      clearAllTimeouts();
      onCompleteRef.current?.();
    },
    [clearTypewriter, clearAllTimeouts],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleTap]);

  const hasBothChars = !!(leftChar && rightChar);
  const singleChar = leftChar || rightChar;

  return (
    <div
      className="relative h-screen w-full overflow-hidden cursor-pointer select-none"
      style={{ fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif' }}
      onClick={handleTap}
    >
      {/* 背景 */}
      <div className="absolute inset-0">
        {background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="h-full w-full bg-stone-900" />
        )}
      </div>

      {/* フェードオーバーレイ */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-500 z-10"
        style={{ opacity: overlayOpacity }}
      />

      {/* キャラクター（2人） */}
      {hasBothChars && (
        <>
          <div className="absolute bottom-[180px] left-[3%] z-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={leftChar!}
              alt=""
              className="h-[50vh] max-h-[360px] max-w-[42vw] w-auto object-contain drop-shadow-xl"
              draggable={false}
            />
          </div>
          <div className="absolute bottom-[180px] right-[3%] z-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rightChar!}
              alt=""
              className="h-[50vh] max-h-[360px] max-w-[42vw] w-auto object-contain drop-shadow-xl"
              draggable={false}
            />
          </div>
        </>
      )}

      {/* キャラクター（1人・中央大きめ） */}
      {!hasBothChars && singleChar && (
        <div className="absolute bottom-[180px] left-1/2 -translate-x-1/2 z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={singleChar}
            alt=""
            className="h-[65vh] max-h-[500px] w-auto object-contain drop-shadow-xl"
            draggable={false}
          />
        </div>
      )}

      {/* テキストボックス */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-3">
        <div className="mx-auto max-w-2xl rounded-2xl bg-stone-900/85 px-5 pt-4 pb-2 shadow-2xl ring-1 ring-stone-700/50 backdrop-blur-sm">
          {/* 話者名 */}
          {currentDialogue?.speaker && (
            <div className="mb-2">
              <span className="inline-block rounded-md bg-amber-500/20 px-3 py-0.5 text-sm font-bold text-amber-300 ring-1 ring-amber-500/30">
                {currentDialogue.speaker}
              </span>
            </div>
          )}

          {/* テキスト本文 - 固定高さ */}
          <div className="h-24 overflow-hidden">
            <p
              className={`whitespace-pre-wrap text-base leading-relaxed ${
                !currentDialogue?.speaker ? 'italic text-stone-400' : 'text-stone-100'
              }`}
            >
              {displayedText}
              {isTyping && <span className="ml-0.5 inline-block animate-pulse text-amber-400">▌</span>}
            </p>
          </div>

          {/* 進む矢印 */}
          <div className="h-5 flex justify-end">
            {!isTyping && currentDialogue && (
              <span className="animate-bounce text-amber-400 text-sm leading-none">▼</span>
            )}
          </div>
        </div>
      </div>

      {/* スキップボタン */}
      <button
        onClick={handleSkip}
        className="absolute top-3 right-3 z-40 rounded-full bg-stone-900/60 px-3 py-1.5 text-xs font-semibold text-stone-300 backdrop-blur-sm transition-colors hover:bg-stone-900/80 hover:text-white"
      >
        SKIP ▶▶
      </button>
    </div>
  );
}
