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

// コヒーレンスに応じた画像バリアントを返す（パーセンテージ基準）
function getCharacterImage(caseId: string, coherence: number, maxCoherence: number = 100): string | null {
  const pct = maxCoherence > 0 ? coherence / maxCoherence : 0;

  // mini_prologue → ガメ吉（3表情）
  if (caseId === 'mini_prologue') {
    const emotion = pct > 0.5 ? 'smug' : pct > 0.15 ? 'shaken' : 'defeated';
    return `/images/characters/gamekichi/${emotion}.png`;
  }

  const emotion =
    pct > 0.85 ? 'normal' :
    pct >= 0.55 ? 'nervous' :
    pct >= 0.30 ? 'cornered' :
    pct >= 0.10 ? 'breaking' : 'collapsed';

  const available: Record<string, string[]> = {
    case_001: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
    case_002: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
    case_sample_001: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
    case_sample_002: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
    case_sample_003: ['normal', 'nervous', 'cornered', 'breaking', 'collapsed'],
  };

  const list = available[caseId] ?? [];
  if (list.includes(emotion)) return `/images/characters/${caseId}/${emotion}.png`;
  if (list.includes('normal')) return `/images/characters/${caseId}/normal.png`;
  return null;
}

// ケース別の尋問背景画像
function getInterrogationBg(caseId: string): string | null {
  const bgs: Record<string, string> = {
    case_001: '/images/backgrounds/case_001_interrogation.jpg',
    case_002: '/images/backgrounds/case_002_interrogation.jpg',
    case_sample_001: '/images/backgrounds/case_sample_001_interrogation.jpg',
    case_sample_002: '/images/backgrounds/case_sample_002_interrogation.jpg',
    case_sample_003: '/images/backgrounds/case_sample_003_interrogation.jpg',
    mini_prologue: '/images/backgrounds/fantasy_bg.png',
  };
  return bgs[caseId] ?? null;
}

interface CaseMeta {
  criminalName: string;
  criminalGender: 'male' | 'female';
  evidence: Evidence[];
}

// 証拠スロット（?またはアイコン）
function EvidenceSlot({ ev, caseId, unlocked, newlyUnlocked }: {
  ev: Evidence;
  caseId: string;
  unlocked: boolean;
  newlyUnlocked: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!unlocked) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 bg-stone-100 text-stone-400 text-xs font-bold">
        ？
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-amber-600 text-xs font-bold transition-all ${
        newlyUnlocked ? 'animate-pulse ring-2 ring-amber-400' : ''
      }`}
      title={ev.name}
    >
      {!imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/evidence/${caseId}/${ev.id}.png`}
          alt={ev.name}
          className="h-full w-full rounded-lg object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="text-base">🔓</span>
      )}
    </div>
  );
}

// 証拠アイコン（/images/evidence/{caseId}/{evId}.png、なければプレースホルダー）
function EvidenceIcon({ evId, caseId, size }: { evId: string; caseId: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="shrink-0 flex items-center justify-center rounded-lg bg-stone-200 text-stone-400"
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

// 証拠モーダル（アンロック済みのみ表示）
function EvidenceModal({
  evidence,
  caseId,
  unlockedEvidenceIds,
  onClose,
}: {
  evidence: Evidence[];
  caseId: string;
  unlockedEvidenceIds: string[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Evidence | null>(null);
  const unlockedEvidence = evidence.filter((ev) => unlockedEvidenceIds.includes(ev.id));
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-stone-200 bg-white p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-amber-600">
            {selected ? selected.name : '証拠一覧'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">✕</button>
        </div>
        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} className="mb-3 text-xs text-amber-600 hover:underline">← 一覧に戻る</button>
            <div className="mb-4 flex items-center gap-4">
              <EvidenceIcon evId={selected.id} caseId={caseId} size={64} />
              <p className="font-semibold text-stone-900">{selected.name}</p>
            </div>
            <p className="text-sm leading-relaxed text-stone-700">{selected.content}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {evidence.map((ev) => {
              const isUnlocked = unlockedEvidenceIds.includes(ev.id);
              return (
                <li key={ev.id}>
                  {isUnlocked ? (
                    <button
                      onClick={() => setSelected(ev)}
                      className="flex w-full items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left transition-colors hover:border-amber-400 hover:text-stone-900"
                    >
                      <EvidenceIcon evId={ev.id} caseId={caseId} size={48} />
                      <span className="text-sm text-stone-700">{ev.name}</span>
                    </button>
                  ) : (
                    <div className="flex w-full items-center gap-3 rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2 opacity-40">
                      <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-200 text-stone-400 text-lg">🔒</div>
                      <span className="text-sm text-stone-400">？？？</span>
                    </div>
                  )}
                </li>
              );
            })}
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
        className="flex w-full max-w-md flex-col rounded-t-2xl border border-stone-200 bg-white sm:rounded-2xl"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex gap-3">
            <button
              onClick={() => setTab('current')}
              className={`text-sm font-semibold ${tab === 'current' ? 'text-amber-600' : 'text-stone-400'}`}
            >
              今回の証言
            </button>
            {previousConversation.length > 0 && (
              <button
                onClick={() => setTab('previous')}
                className={`text-sm font-semibold ${tab === 'previous' ? 'text-yellow-600' : 'text-stone-400'}`}
              >
                前回の証言
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">✕</button>
        </div>
        <div className="overflow-y-auto p-4">
          {tab === 'current' && (
            messages.length === 0 ? (
              <p className="text-center text-sm text-stone-400">まだ発言はありません</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === 'player' ? 'text-right' : 'text-left'}`}>
                    <span className={`text-xs font-semibold ${m.role === 'player' ? 'text-amber-600' : 'text-stone-500'}`}>
                      {m.role === 'player' ? 'あなた' : criminalName}
                    </span>
                    <p className={`mt-0.5 rounded-xl px-3 py-2 inline-block max-w-[85%] ${
                      m.role === 'player' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-800'
                    }`}>{m.content}</p>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'previous' && (
            <div className="space-y-3">
              <p className="mb-1 text-xs text-stone-400">過去の尋問の記録。今回と食い違いがあれば矛盾として突ける。</p>
              {previousConversation.map((m, i) =>
                m.role === 'divider' ? (
                  <div key={i} className="sticky top-0 z-10 py-2">
                    <div className="rounded-lg bg-yellow-50 border border-yellow-300 px-3 py-1.5 text-center backdrop-blur-sm">
                      <span className="text-xs font-bold text-yellow-600 tracking-wide">{m.content}</span>
                    </div>
                  </div>
                ) : (
                  <div key={i} className={`text-sm ${m.role === 'player' ? 'text-right' : 'text-left'}`}>
                    <span className={`text-xs font-semibold ${m.role === 'player' ? 'text-amber-600' : 'text-yellow-600'}`}>
                      {m.role === 'player' ? 'あなた' : '容疑者'}
                    </span>
                    <p className={`mt-0.5 rounded-xl px-3 py-2 inline-block max-w-[85%] ${
                      m.role === 'player' ? 'bg-amber-500/20 text-stone-800' : 'bg-yellow-50 border border-yellow-200 text-stone-800'
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

// トイマルパネル（ボトムシート）
function ToimaruPanel({
  onClose,
  chips,
  evidence,
  caseId,
  unlockedEvidenceIds,
  onKeywordSubmit,
  isTriggering,
}: {
  onClose: () => void;
  chips: string[];
  evidence: Evidence[];
  caseId: string;
  unlockedEvidenceIds: string[];
  onKeywordSubmit: (keyword: string) => void;
  isTriggering: boolean;
}) {
  const [freeText, setFreeText] = useState('');
  const [showFreeInput, setShowFreeInput] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-stone-200 bg-white p-4"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-amber-600 hover:underline">← 戻る</button>
          <span className="font-semibold text-stone-700">🐾 トイマル</span>
          <div className="w-12" />
        </div>

        {/* トイマルアイコンとセリフ */}
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src="/images/characters/toimaru/event_normal.png"
              alt="トイマル"
              width={48}
              height={48}
              className="rounded-full object-cover"
              onError={() => {}}
            />
          </div>
          <p className="text-sm text-stone-700">
            「なにか気になったことがあったら教えるのだ！」
          </p>
        </div>

        {/* キーワードチップ */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-stone-500">💬 気になる言葉は？</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => !isTriggering && onKeywordSubmit(chip)}
                disabled={isTriggering}
                className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-sm text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
            <button
              onClick={() => setShowFreeInput(!showFreeInput)}
              className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-sm text-stone-500 transition-colors hover:bg-stone-100"
            >
              + 自分で入力
            </button>
          </div>
          {showFreeInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="キーワードを入力..."
                className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && freeText.trim() && !isTriggering) {
                    onKeywordSubmit(freeText.trim());
                    setFreeText('');
                    setShowFreeInput(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (freeText.trim() && !isTriggering) {
                    onKeywordSubmit(freeText.trim());
                    setFreeText('');
                    setShowFreeInput(false);
                  }
                }}
                disabled={!freeText.trim() || isTriggering}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                渡す
              </button>
            </div>
          )}
          {isTriggering && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
              <div className="h-3 w-3 animate-spin rounded-full border border-amber-500 border-t-transparent" />
              トイマルが思い出し中…
            </div>
          )}
        </div>

        {/* トイマルの記録 */}
        <div>
          <p className="mb-2 text-xs font-semibold text-stone-500">── トイマルの記録 ──</p>
          <ul className="space-y-2">
            {evidence.map((ev) => {
              const isUnlocked = unlockedEvidenceIds.includes(ev.id);
              return (
                <li key={ev.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isUnlocked
                    ? 'border border-amber-200 bg-amber-50 text-stone-700'
                    : 'border border-stone-100 bg-stone-50 text-stone-400 opacity-60'
                }`}>
                  <span>{isUnlocked ? '🔓' : '🔒'}</span>
                  <span>{isUnlocked ? ev.name : '？？？'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ゲーム専用フッター（逮捕ボタン削除、トイマルボタン追加）
function GameFooter({
  onEvidenceOpen,
  onLogOpen,
  onToimaruOpen,
  disabled,
}: {
  onEvidenceOpen: () => void;
  onLogOpen: () => void;
  onToimaruOpen: () => void;
  disabled: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-md items-center">
        <button
          onClick={onLogOpen}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-stone-500 transition-colors hover:text-amber-600"
        >
          <span className="text-lg">📜</span>
          <span>証言記録</span>
        </button>
        <button
          onClick={onEvidenceOpen}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-stone-500 transition-colors hover:text-amber-600"
        >
          <span className="text-lg">📁</span>
          <span>証拠</span>
        </button>
        <button
          onClick={onToimaruOpen}
          disabled={disabled}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-amber-600 transition-colors hover:text-amber-500 disabled:text-stone-300"
        >
          <span className="text-lg">🐾</span>
          <span>トイマル</span>
        </button>
      </div>
    </div>
  );
}

// 証拠アンロック通知バナー
function UnlockBanner({ evidenceName, onDismiss }: { evidenceName: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-none fixed top-16 left-0 right-0 z-50 flex justify-center px-4">
      <div className="animate-bounce rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 shadow-lg">
        <p className="text-center text-sm font-semibold text-amber-700">
          🔓 証拠アンロック！「{evidenceName}」
        </p>
      </div>
    </div>
  );
}

function InterrogationContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { session, previousTestimony, previousConversation, isCriminalThinking, sendMessage, arrestChallenge, startSession, unlockEvidence } = useGame();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showToimaru, setShowToimaru] = useState(false);
  const [showObjection, setShowObjection] = useState(false);
  const prevMessageCountRef = useRef(0);
  const [meta, setMeta] = useState<CaseMeta | null>(null);

  // Toimaru state
  const [chips, setChips] = useState<string[]>([]);
  const [toimaruComment, setToimaruComment] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [unlockBanner, setUnlockBanner] = useState<{ evId: string; name: string } | null>(null);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<string[]>([]);

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

  // コヒーレンス0で自動逮捕
  useEffect(() => {
    if (!session) return;
    if (session.coherence <= 0 && !session.isCompleted && !isCriminalThinking) {
      // 少しディレイを置いて自然な流れに
      const timer = setTimeout(() => {
        arrestChallenge();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [session?.coherence, session?.isCompleted, isCriminalThinking, arrestChallenge]);

  // 犯人の新しいメッセージ → TTS再生 + チップ生成
  useEffect(() => {
    if (!session || !isVoiceModeOn) return;
    const messages = session.messages;
    const latest = messages[messages.length - 1];
    if (latest?.role === 'criminal') {
      speakText(latest.content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.messages.length, isVoiceModeOn]);

  // 犯人の新しいメッセージ → チップ生成
  useEffect(() => {
    if (!session) return;
    const messages = session.messages;
    const latest = messages[messages.length - 1];
    if (latest?.role !== 'criminal') return;
    if (messages.length <= prevMessageCountRef.current) return;

    // チップ生成API呼び出し
    const recentContext = messages.slice(-6).map((m) => `${m.role === 'player' ? 'プレイヤー' : '犯人'}: ${m.content}`).join('\n');
    authenticatedFetch('/api/companion-chips', {
      method: 'POST',
      body: JSON.stringify({
        caseId,
        criminalResponse: latest.content,
        unlockedEvidenceIds: session.unlockedEvidenceIds ?? [],
        conversationContext: recentContext,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.chips) setChips(data.chips);
        if (data.toimaruComment) setToimaruComment(data.toimaruComment);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.messages.length]);

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

  // キーワードをトイマルに渡してトリガー判定
  const handleKeywordSubmit = useCallback(async (keyword: string) => {
    if (!session || isTriggering) return;
    setIsTriggering(true);

    try {
      const conversationHistory = session.messages
        .filter((m) => m.role === 'criminal')
        .map((m) => m.content)
        .join('\n');

      const res = await authenticatedFetch('/api/companion-trigger', {
        method: 'POST',
        body: JSON.stringify({
          caseId,
          playerKeyword: keyword,
          unlockedEvidenceIds: session.unlockedEvidenceIds ?? [],
          conversationHistory,
        }),
      });

      const data = await res.json();

      if (data.hit && data.unlockedEvidenceId) {
        // 証拠アンロック
        unlockEvidence(data.unlockedEvidenceId);
        const ev = meta?.evidence.find((e) => e.id === data.unlockedEvidenceId);
        if (ev) {
          setUnlockBanner({ evId: data.unlockedEvidenceId, name: ev.name });
          setNewlyUnlockedIds((prev) => [...prev, data.unlockedEvidenceId]);
          // 3秒後に新着マーク消す
          setTimeout(() => {
            setNewlyUnlockedIds((prev) => prev.filter((id) => id !== data.unlockedEvidenceId));
          }, 3000);
        }
        // トイマルの発言をチャットに反映（コメントとして表示）
        if (data.toimaruLine) {
          setToimaruComment(data.toimaruLine);
        }
      } else {
        // ミス
        if (data.toimaruLine) {
          setToimaruComment(data.toimaruLine);
        }
      }
    } catch (err) {
      console.error('Companion trigger error:', err);
    } finally {
      setIsTriggering(false);
    }
  }, [session, caseId, isTriggering, unlockEvidence, meta]);

  if (!session || !meta) return null;

  const isGameOver = session.isCompleted || (session.maxTurns !== null && session.turn >= (session.maxTurns ?? 15));
  const unlockedEvidenceIds = session.unlockedEvidenceIds ?? [];

  return (
    <div className="flex h-dvh flex-col bg-amber-50">
      {/* 「なんで？」カットイン演出 */}
      {showObjection && (
        <>
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute left-0 right-0"
              style={{
                top: '38%',
                height: '28%',
                animation: 'cutinPanel 1.8s ease-out forwards',
                clipPath: 'polygon(0 8%, 100% 0%, 100% 92%, 0% 100%)',
                backgroundImage: 'url(/images/ui/cutin_nande.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#ddd8cc',
              }}
            />
          </div>
          <div
            className="pointer-events-none fixed z-51 flex items-center justify-end pr-5"
            style={{
              top: '38%',
              left: 0,
              right: 0,
              height: '28%',
              animation: 'cutinText 1.8s ease-out forwards',
            }}
          >
            <p
              className="select-none font-black leading-none"
              style={{
                fontSize: 'clamp(2rem, 10vw, 4rem)',
                color: '#fff',
                textShadow: '3px 3px 0 #dc2626, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                transform: 'rotate(-3deg)',
              }}
            >
              なんで？
            </p>
          </div>
          <style>{`
            @keyframes cutinPanel {
              0%   { transform: translateX(105%); opacity: 1; }
              12%  { transform: translateX(0); opacity: 1; }
              68%  { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(-5%); opacity: 0; }
            }
            @keyframes cutinText {
              0%   { opacity: 0; transform: scale(1.3) rotate(-3deg); }
              22%  { opacity: 1; transform: scale(1.0) rotate(-3deg); }
              68%  { opacity: 1; transform: scale(1.0) rotate(-3deg); }
              100% { opacity: 0; transform: scale(0.95) rotate(-3deg); }
            }
          `}</style>
        </>
      )}

      {/* 証拠アンロックバナー */}
      {unlockBanner && (
        <UnlockBanner
          evidenceName={unlockBanner.name}
          onDismiss={() => setUnlockBanner(null)}
        />
      )}

      {/* ヘッダー: ターン数・コヒーレンス */}
      <div className="shrink-0 border-b border-stone-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-md flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <TurnCounter turn={session.turn} maxTurns={session.maxTurns} />
            <div className="flex items-center gap-2">
              {/* はじめからボタン */}
              <button
                onClick={() => {
                  if (confirm('尋問をはじめからやり直しますか？')) {
                    startSession(caseId);
                  }
                }}
                disabled={isCriminalThinking}
                className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700 disabled:opacity-40"
              >
                ↩ はじめから
              </button>
              {/* 音声モードトグル */}
              <button
                onClick={() => setIsVoiceModeOn(!isVoiceModeOn)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isVoiceModeOn
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-stone-100 text-stone-400 hover:text-stone-600'
                }`}
              >
                {isVoiceModeOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                {isVoiceModeOn ? '音声ON' : '音声OFF'}
              </button>
            </div>
          </div>
          <CoherenceMeter coherence={session.coherence} maxCoherence={session.maxCoherence} />
        </div>
      </div>

      {/* 容疑者エリア */}
      <div className="relative shrink-0 bg-amber-50">
        {(() => {
          const imgSrc = getCharacterImage(caseId, session.coherence, session.maxCoherence);
          const bgSrc = getInterrogationBg(caseId);
          return imgSrc ? (
            <div className="relative mx-auto w-full max-w-md overflow-hidden h-[30vh]">
              {bgSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bgSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              )}
              {bgSrc && <div className="absolute inset-0 bg-stone-900/40" />}
              <Image
                key={imgSrc}
                src={imgSrc}
                alt={meta.criminalName}
                width={1024}
                height={1024}
                className="relative z-10 w-full h-auto"
                priority
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-20 bg-gradient-to-t from-amber-50 to-transparent" />
              {isCriminalThinking && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-900/40">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2 border-b border-stone-200">
              <svg className="h-16 w-16 text-stone-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              <p className="text-xs text-stone-400">画像準備中</p>
            </div>
          );
        })()}

        {/* 証拠スロット（犯人立ち絵の下） */}
        {meta.evidence.length > 0 && (
          <div className="mx-auto max-w-md px-4 py-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-stone-400 shrink-0">証拠:</p>
              <div className="flex gap-1.5 flex-wrap">
                {meta.evidence.map((ev) => (
                  <EvidenceSlot
                    key={ev.id}
                    ev={ev}
                    caseId={caseId}
                    unlocked={unlockedEvidenceIds.includes(ev.id)}
                    newlyUnlocked={newlyUnlockedIds.includes(ev.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {session.messages.length === 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center text-sm text-stone-500">
              容疑者が目の前にいる。質問してみよう。
            </div>
          )}
          {session.messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} criminalName={meta.criminalName} />
          ))}
          {/* トイマルのコメント（最新の犯人メッセージの後に表示） */}
          {toimaruComment && session.messages.length > 0 && session.messages[session.messages.length - 1]?.role === 'criminal' && (
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-xs">
                🐾
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-amber-200 bg-amber-50 px-3 py-2 max-w-[75%]">
                <p className="mb-0.5 text-xs font-semibold text-amber-600">トイマル</p>
                <p className="text-xs text-stone-600">{toimaruComment}</p>
              </div>
            </div>
          )}
          {isCriminalThinking && (
            <div className="flex items-start gap-2">
              <div className="rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-4 py-3">
                <p className="mb-1 text-xs font-semibold text-amber-600">{meta.criminalName}</p>
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"
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
      <div className="shrink-0 border-t border-stone-200">
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

      {/* ゲーム専用フッター（逮捕ボタンなし、トイマルボタンあり） */}
      <GameFooter
        onEvidenceOpen={() => setShowEvidence(true)}
        onLogOpen={() => setShowLog(true)}
        onToimaruOpen={() => setShowToimaru(true)}
        disabled={isCriminalThinking}
      />

      {/* モーダル */}
      {showEvidence && (
        <EvidenceModal
          evidence={meta.evidence}
          caseId={caseId}
          unlockedEvidenceIds={unlockedEvidenceIds}
          onClose={() => setShowEvidence(false)}
        />
      )}
      {showLog && (
        <LogModal
          messages={session.messages.map((m) => ({ role: m.role, content: m.content }))}
          previousConversation={previousConversation}
          criminalName={meta.criminalName}
          onClose={() => setShowLog(false)}
        />
      )}
      {showToimaru && (
        <ToimaruPanel
          onClose={() => setShowToimaru(false)}
          chips={chips}
          evidence={meta.evidence}
          caseId={caseId}
          unlockedEvidenceIds={unlockedEvidenceIds}
          onKeywordSubmit={handleKeywordSubmit}
          isTriggering={isTriggering}
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
