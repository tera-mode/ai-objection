'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EventData, EventScene } from '@/types/event';

interface EventPlayerProps {
  eventData: EventData;
  onComplete?: () => void;
}

const TYPEWRITER_INTERVAL_MS = 40;

function getCharacterPositionClass(position: 'left' | 'center' | 'right'): string {
  switch (position) {
    case 'left':
      return 'left-[5%]';
    case 'right':
      return 'right-[5%]';
    case 'center':
    default:
      return 'left-1/2 -translate-x-1/2';
  }
}

export default function EventPlayer({ eventData, onComplete }: EventPlayerProps) {
  const router = useRouter();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0); // 0=transparent, 1=black
  const [bgOpacity, setBgOpacity] = useState(1);
  const [charOpacity, setCharOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentScene: EventScene = eventData.scenes[sceneIndex];

  const clearTypewriter = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTypewriter = useCallback((text: string) => {
    clearTypewriter();
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const fullText = text;

    intervalRef.current = setInterval(() => {
      index += 1;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearTypewriter();
        setIsTyping(false);
      }
    }, TYPEWRITER_INTERVAL_MS);
  }, [clearTypewriter]);

  const skipTypewriter = useCallback((text: string) => {
    clearTypewriter();
    setDisplayedText(text);
    setIsTyping(false);
  }, [clearTypewriter]);

  // シーン変更時にタイプライター開始
  useEffect(() => {
    startTypewriter(currentScene.text);
    return () => clearTypewriter();
  }, [sceneIndex, currentScene.text, startTypewriter, clearTypewriter]);

  // フェードイン/アウト処理
  useEffect(() => {
    const effect = currentScene.effect;
    if (!effect) {
      setBgOpacity(1);
      setCharOpacity(1);
      setOverlayOpacity(0);
      return;
    }

    if (effect === 'fade_in') {
      setOverlayOpacity(1);
      setBgOpacity(0);
      setCharOpacity(0);
      const t1 = setTimeout(() => {
        setOverlayOpacity(0);
        setBgOpacity(1);
        setCharOpacity(1);
      }, 100);
      return () => clearTimeout(t1);
    }

    if (effect === 'fade_out') {
      // テキスト表示後にフェードアウト（クリック後に次へ進む前に発火させる）
      // フェードアウトは次シーンへ進む際に処理するのでここでは何もしない
    }
  }, [sceneIndex, currentScene.effect]);

  const goToNextScene = useCallback(async () => {
    if (isTyping) {
      skipTypewriter(currentScene.text);
      return;
    }

    if (isTransitioning) return;

    const isLastScene = sceneIndex >= eventData.scenes.length - 1;

    // fade_out エフェクトがある場合はフェードアウトしてから次へ
    if (currentScene.effect === 'fade_out') {
      setIsTransitioning(true);
      setOverlayOpacity(1);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    if (isLastScene) {
      if (onComplete) {
        onComplete();
      } else if (eventData.onComplete.type === 'navigate') {
        router.push(eventData.onComplete.path);
      }
      return;
    }

    const nextScene = eventData.scenes[sceneIndex + 1];
    // 次のシーンが fade_in の場合は即座にオーバーレイを黒くする
    if (nextScene?.effect === 'fade_in') {
      setOverlayOpacity(1);
    }

    setSceneIndex((prev) => prev + 1);
    setIsTransitioning(false);
  }, [isTyping, isTransitioning, sceneIndex, eventData, currentScene, router, onComplete, skipTypewriter]);

  // キーボード対応
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        goToNextScene();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToNextScene]);

  return (
    <div
      className="relative h-screen w-full overflow-hidden cursor-pointer select-none"
      style={{ fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif' }}
      onClick={goToNextScene}
    >
      {/* 背景 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: bgOpacity }}
      >
        {currentScene.background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentScene.background}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-stone-900" />
        )}
      </div>

      {/* フェードオーバーレイ */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-500 z-10"
        style={{ opacity: overlayOpacity }}
      />

      {/* キャラクタースプライト（左/中央） */}
      {currentScene.character && (
        <div
          className={`absolute bottom-[180px] transition-opacity duration-500 z-20 ${getCharacterPositionClass(currentScene.character.position)}`}
          style={{
            opacity: charOpacity,
            transform: currentScene.character.position === 'center'
              ? `translateX(-50%) ${currentScene.character.flip ? 'scaleX(-1)' : ''}`
              : currentScene.character.flip ? 'scaleX(-1)' : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentScene.character.image}
            alt=""
            className="h-[55vh] max-h-[420px] w-auto object-contain drop-shadow-xl"
            draggable={false}
          />
        </div>
      )}

      {/* キャラクタースプライト2（右側） */}
      {currentScene.character2 && (
        <div
          className={`absolute bottom-[180px] transition-opacity duration-500 z-20 ${getCharacterPositionClass(currentScene.character2.position)}`}
          style={{
            opacity: charOpacity,
            transform: currentScene.character2.position === 'center'
              ? `translateX(-50%) ${currentScene.character2.flip ? 'scaleX(-1)' : ''}`
              : currentScene.character2.flip ? 'scaleX(-1)' : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentScene.character2.image}
            alt=""
            className="h-[55vh] max-h-[420px] w-auto object-contain drop-shadow-xl"
            draggable={false}
          />
        </div>
      )}

      {/* テキストボックス */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
        <div className="mx-auto max-w-2xl rounded-2xl bg-stone-900/85 p-5 shadow-2xl ring-1 ring-stone-700/50 backdrop-blur-sm">
          {/* 話者名 */}
          {currentScene.speaker && (
            <div className="mb-2">
              <span className="inline-block rounded-md bg-amber-500/20 px-3 py-0.5 text-sm font-bold text-amber-300 ring-1 ring-amber-500/30">
                {currentScene.speaker}
              </span>
            </div>
          )}

          {/* テキスト本文 */}
          <p
            className={`min-h-[4rem] whitespace-pre-wrap text-base leading-relaxed ${
              currentScene.speaker === null || currentScene.speaker === undefined
                ? 'italic text-stone-400'
                : 'text-stone-100'
            }`}
          >
            {displayedText}
            {isTyping && (
              <span className="ml-0.5 inline-block animate-pulse text-amber-400">▌</span>
            )}
          </p>

          {/* 進む矢印（タイプライター完了時のみ表示） */}
          {!isTyping && (
            <div className="mt-2 flex justify-end">
              <span className="animate-bounce text-amber-400 text-lg">▼</span>
            </div>
          )}
        </div>
      </div>

      {/* シーン番号（デバッグ用、必要なら削除） */}
      <div className="absolute top-2 right-3 z-40 text-xs text-stone-500/50 pointer-events-none">
        {sceneIndex + 1}/{eventData.scenes.length}
      </div>
    </div>
  );
}
