'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { MessageBubble } from '@/components/game/MessageBubble';
import { CoherenceMeter } from '@/components/game/CoherenceMeter';
import { TurnCounter } from '@/components/game/TurnCounter';
import { InputArea } from '@/components/game/InputArea';
import { VoiceButton } from '@/components/game/VoiceButton';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Evidence } from '@/types/game';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

// コヒーレンスに応じた画像バリアントを返す
// 画像ファイル命名規則: public/images/characters/{caseId}_{emotion}.png
// emotion: normal | nervous | cornered | breaking | collapsed
function getCharacterImage(caseId: string, coherence: number): string | null {
  const emotion =
    coherence > 85 ? 'normal' :
    coherence >= 55 ? 'nervous' :
    coherence >= 30 ? 'cornered' :
    coherence >= 10 ? 'breaking' : 'collapsed';

  const available: Record<string, string[]> = {
    case_001: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
    case_002: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
    case_003: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
  };

  const list = available[caseId] ?? [];
  if (list.includes(emotion)) return `/images/characters/${caseId}_${emotion}.png`;
  if (list.includes('normal')) return `/images/characters/${caseId}_normal.png`;
  return null;
}

// ケース別の尋問背景画像
function getInterrogationBg(caseId: string): string | null {
  const bgs: Record<string, string> = {
    case_001: '/images/backgrounds/case_001_interrogation.jpg',
    case_002: '/images/backgrounds/case_002_interrogation.jpg',
    case_003: '/images/backgrounds/case_003_interrogation.jpg',
  };
  return bgs[caseId] ?? null;
}

interface CaseMeta {
  criminalName: string;
  criminalGender: 'male' | 'female';
  evidence: Evidence[];
}

// ゲーム専用フッター
function GameFooter({
  onEvidenceOpen,
  onLogOpen,
  onArrest,
  canArrest,
  disabled,
}: {
  onEvidenceOpen: () => void;
  onLogOpen: () => void;
  onArrest: () => void;
  canArrest: boolean;
  disabled: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-md items-center">
        <button
          onClick={onLogOpen}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-gray-400 transition-colors hover:text-cyan-400"
        >
          <span className="text-lg">📜</span>
          <span>証言記録</span>
        </button>
        <button
          onClick={onEvidenceOpen}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-gray-400 transition-colors hover:text-cyan-400"
        >
          <span className="text-lg">📁</span>
          <span>証拠</span>
        </button>
        <button
          onClick={onArrest}
          disabled={disabled || !canArrest}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
            canArrest && !disabled
              ? 'text-red-400 hover:text-red-300'
              : 'text-gray-600'
          }`}
        >
          <span className="text-lg">⚖️</span>
          <span>逮捕</span>
        </button>
      </div>
    </div>
  );
}

// 証拠アイコン（/images/evidence/{caseId}/{evId}.png、なければプレースホルダー）
function EvidenceIcon({ evId, caseId, size }: { evId: string; caseId: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="shrink-0 flex items-center justify-center rounded-lg bg-gray-700 text-gray-400"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/evidence/${caseId}/${evId}.png`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

// 証拠モーダル
function EvidenceModal({
  evidence,
  caseId,
  onClose,
}: {
  evidence: Evidence[];
  caseId: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Evidence | null>(null);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-gray-700 bg-gray-900 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-cyan-400">
            {selected ? selected.name : '証拠一覧'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} className="mb-3 text-xs text-cyan-400 hover:underline">← 一覧に戻る</button>
            <div className="mb-4 flex items-center gap-4">
              <EvidenceIcon evId={selected.id} caseId={caseId} size={64} />
              <p className="font-semibold text-white">{selected.name}</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{selected.content}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {evidence.map((ev) => (
              <li key={ev.id}>
                <button
                  onClick={() => setSelected(ev)}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-left transition-colors hover:border-cyan-500 hover:text-white"
                >
                  <EvidenceIcon evId={ev.id} caseId={caseId} size={96} />
                  <span className="text-sm text-gray-300">{ev.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// 証言記録モーダル
function LogModal({
  messages,
  previousConversation,
  criminalName,
  onClose,
}: {
  messages: { role: string; content: string }[];
  previousConversation: { role: 'player' | 'criminal' | 'divider'; content: string }[];
  criminalName: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'current' | 'previous'>('current');
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-t-2xl border border-gray-700 bg-gray-900 sm:rounded-2xl"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <div className="flex gap-3">
            <button
              onClick={() => setTab('current')}
              className={`text-sm font-semibold ${tab === 'current' ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              今回の証言
            </button>
            {previousConversation.length > 0 && (
              <button
                onClick={() => setTab('previous')}
                className={`text-sm font-semibold ${tab === 'previous' ? 'text-yellow-400' : 'text-gray-500'}`}
              >
                前回の証言
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="overflow-y-auto p-4">
          {tab === 'current' && (
            messages.length === 0 ? (
              <p className="text-center text-sm text-gray-500">まだ発言はありません</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === 'player' ? 'text-right' : 'text-left'}`}>
                    <span className={`text-xs font-semibold ${m.role === 'player' ? 'text-cyan-400' : 'text-gray-400'}`}>
                      {m.role === 'player' ? 'あなた' : criminalName}
                    </span>
                    <p className={`mt-0.5 rounded-xl px-3 py-2 text-gray-200 inline-block max-w-[85%] ${
                      m.role === 'player' ? 'bg-cyan-900/50' : 'bg-gray-800'
                    }`}>{m.content}</p>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'previous' && (
            <div className="space-y-3">
              <p className="mb-1 text-xs text-gray-500">過去の尋問の記録。今回と食い違いがあれば矛盾として突ける。</p>
              {previousConversation.map((m, i) =>
                m.role === 'divider' ? (
                  <div key={i} className="sticky top-0 z-10 py-2">
                    <div className="rounded-lg bg-yellow-950/80 border border-yellow-700/60 px-3 py-1.5 text-center backdrop-blur-sm">
                      <span className="text-xs font-bold text-yellow-400 tracking-wide">{m.content}</span>
                    </div>
                  </div>
                ) : (
                  <div key={i} className={`text-sm ${m.role === 'player' ? 'text-right' : 'text-left'}`}>
                    <span className={`text-xs font-semibold ${m.role === 'player' ? 'text-cyan-400' : 'text-yellow-500'}`}>
                      {m.role === 'player' ? 'あなた' : '容疑者'}
                    </span>
                    <p className={`mt-0.5 rounded-xl px-3 py-2 text-gray-200 inline-block max-w-[85%] ${
                      m.role === 'player' ? 'bg-cyan-900/30' : 'bg-yellow-950/40 border border-yellow-900/40'
                    }`}>{m.content}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InterrogationContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { session, previousTestimony, previousConversation, isCriminalThinking, sendMessage, arrestChallenge } = useGame();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showObjection, setShowObjection] = useState(false);
  const prevMessageCountRef = useRef(0);
  const [meta, setMeta] = useState<CaseMeta | null>(null);

  const handleTranscript = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const { voiceState, isVoiceModeOn, setIsVoiceModeOn, startRecording, stopRecording, cancelRecording, speakText } =
    useVoiceChat({
      criminalGender: meta?.criminalGender ?? 'male',
      onTranscript: handleTranscript,
    });

  useEffect(() => {
    authenticatedFetch(`/api/get-case?caseId=${caseId}`)
      .then((res) => res.json())
      .then((data) => setMeta({ criminalName: data.criminalName, criminalGender: data.criminalGender ?? 'male', evidence: data.evidence }))
      .catch(console.error);
  }, [caseId]);

  useEffect(() => {
    if (!session) {
      router.push(`/play/${caseId}/crime-scene`);
    }
  }, [session, caseId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    if (session?.phase === 'result') {
      router.push(`/play/${caseId}/result`);
    }
  }, [session?.phase, caseId, router]);

  // 犯人の新しいメッセージ → TTS再生
  useEffect(() => {
    if (!session || !isVoiceModeOn) return;
    const messages = session.messages;
    const latest = messages[messages.length - 1];
    if (latest?.role === 'criminal') {
      speakText(latest.content);
    }
  // speakTextはメモ化済みだが無限ループ防止のため session.messages の長さで検知
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.messages.length, isVoiceModeOn]);

  // 矛盾検知 → 「異議あり！」演出
  useEffect(() => {
    if (!session) return;
    const messages = session.messages;
    if (messages.length <= prevMessageCountRef.current) return;
    prevMessageCountRef.current = messages.length;

    const latest = messages[messages.length - 1];
    if (latest?.role === 'criminal' && latest.contradiction) {
      setShowObjection(true);
      const timer = setTimeout(() => setShowObjection(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [session?.messages]);

  if (!session || !meta) return null;

  const isGameOver = session.isCompleted || session.turn >= 15;
  const canArrest = session.turn >= 3 && !isGameOver;

  return (
    <div className="flex h-dvh flex-col bg-gray-950">
      {/* 「なんで？」カットイン演出 */}
      {showObjection && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {/* 背景フラッシュ */}
          <div
            className="absolute inset-0 bg-black"
            style={{ animation: 'cutinBg 1.8s ease-out forwards' }}
          />
          {/* 斜め切りパネル：なのの顔アップ */}
          <div
            className="absolute inset-0"
            style={{
              animation: 'cutinPanel 1.8s ease-out forwards',
              clipPath: 'polygon(0 10%, 100% 0%, 100% 90%, 0% 100%)',
              backgroundImage: 'url(/images/nano_base.png)',
              backgroundSize: '320%',
              backgroundPosition: '48% 4%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#e8e0d0',
            }}
          />
          {/* 集中線オーバーレイ */}
          <div
            className="absolute inset-0"
            style={{
              animation: 'cutinPanel 1.8s ease-out forwards',
              clipPath: 'polygon(0 10%, 100% 0%, 100% 90%, 0% 100%)',
              background: 'radial-gradient(ellipse 60% 50% at 45% 40%, transparent 25%, rgba(0,0,0,0.25) 100%)',
            }}
          />
          {/* 「なんで？」テキスト */}
          <div
            className="absolute inset-0 flex items-center justify-end pr-8"
            style={{ animation: 'cutinText 1.8s ease-out forwards' }}
          >
            <p
              className="select-none font-black leading-none tracking-tight"
              style={{
                fontSize: 'clamp(3.5rem, 18vw, 8rem)',
                color: '#fff',
                textShadow: '4px 4px 0 #dc2626, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                transform: 'rotate(-4deg)',
              }}
            >
              なんで？
            </p>
          </div>
          <style>{`
            @keyframes cutinBg {
              0%   { opacity: 0; }
              8%   { opacity: 0.75; }
              65%  { opacity: 0.75; }
              100% { opacity: 0; }
            }
            @keyframes cutinPanel {
              0%   { transform: translateX(110%); opacity: 1; }
              12%  { transform: translateX(0); opacity: 1; }
              68%  { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(-8%); opacity: 0; }
            }
            @keyframes cutinText {
              0%   { opacity: 0; transform: scale(1.4) rotate(-4deg); }
              20%  { opacity: 1; transform: scale(1.0) rotate(-4deg); }
              68%  { opacity: 1; transform: scale(1.0) rotate(-4deg); }
              100% { opacity: 0; transform: scale(0.95) rotate(-4deg); }
            }
          `}</style>
        </div>
      )}

      {/* ヘッダー: ターン数・コヒーレンス */}
      <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-2">
        <div className="mx-auto flex max-w-md flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <TurnCounter turn={session.turn} />
            <div className="flex items-center gap-2">
              {/* 音声モードトグル */}
              <button
                onClick={() => setIsVoiceModeOn(!isVoiceModeOn)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isVoiceModeOn
                    ? 'bg-cyan-900/60 text-cyan-400'
                    : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                {isVoiceModeOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                {isVoiceModeOn ? '音声ON' : '音声OFF'}
              </button>
              <span className="text-xs text-gray-500">コヒーレンス</span>
            </div>
          </div>
          <CoherenceMeter coherence={session.coherence} />
        </div>
      </div>

      {/* 容疑者エリア */}
      <div className="relative shrink-0 bg-gray-950">
        {/* キャラクター画像: 横幅いっぱい */}
        {(() => {
          const imgSrc = getCharacterImage(caseId, session.coherence);
          const bgSrc = getInterrogationBg(caseId);
          return imgSrc ? (
            <div className="relative mx-auto w-full max-w-md overflow-hidden h-[35vh]">
              {/* 背景画像 */}
              {bgSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bgSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              )}
              {/* 背景オーバーレイ（暗め） */}
              {bgSrc && <div className="absolute inset-0 bg-gray-950/40" />}
              <Image
                key={imgSrc}
                src={imgSrc}
                alt={meta.criminalName}
                width={1024}
                height={1024}
                className="relative z-10 w-full h-auto"
                priority
              />
              {/* 下部グラデーション */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-20 bg-gradient-to-t from-gray-950 to-transparent" />
              {/* 思考中スピナー */}
              {isCriminalThinking && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/40">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            /* 画像未定義時のプレースホルダー */
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2 border-b border-gray-800">
              <svg className="h-16 w-16 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              <p className="text-xs text-gray-600">画像準備中</p>
            </div>
          );
        })()}

      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {session.messages.length === 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 text-center text-sm text-gray-500">
              容疑者が目の前にいる。質問してみよう。
            </div>
          )}
          {session.messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} criminalName={meta.criminalName} />
          ))}
          {isCriminalThinking && (
            <div className="flex items-start gap-2">
              <div className="rounded-2xl rounded-bl-sm border border-gray-700 bg-gray-800 px-4 py-3">
                <p className="mb-1 text-xs font-semibold text-cyan-400">{meta.criminalName}</p>
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="shrink-0 border-t border-gray-800">
        <div className="mx-auto max-w-md">
          <div className="flex items-end gap-2 px-2 py-2">
            <div className="flex-1">
              <InputArea
                onSend={sendMessage}
                disabled={isCriminalThinking || isGameOver || voiceState === 'recording' || voiceState === 'processing'}
                placeholder={isGameOver ? 'ゲーム終了' : '容疑者に質問する...'}
              />
            </div>
            {isVoiceModeOn && (
              <div className="mb-3 shrink-0">
                <VoiceButton
                  voiceState={voiceState}
                  onStart={startRecording}
                  onStop={stopRecording}
                  onCancel={cancelRecording}
                  disabled={isCriminalThinking || isGameOver}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ゲーム専用フッター */}
      <GameFooter
        onEvidenceOpen={() => setShowEvidence(true)}
        onLogOpen={() => setShowLog(true)}
        onArrest={arrestChallenge}
        canArrest={canArrest}
        disabled={isCriminalThinking}
      />

      {/* モーダル */}
      {showEvidence && (
        <EvidenceModal evidence={meta.evidence} caseId={caseId} onClose={() => setShowEvidence(false)} />
      )}
      {showLog && (
        <LogModal
          messages={session.messages.map((m) => ({ role: m.role, content: m.content }))}
          previousConversation={previousConversation}
          criminalName={meta.criminalName}
          onClose={() => setShowLog(false)}
        />
      )}
    </div>
  );
}

export default function InterrogationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return <InterrogationContent caseId={caseId} />;
}
