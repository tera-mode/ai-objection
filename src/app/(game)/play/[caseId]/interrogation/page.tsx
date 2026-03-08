'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';
import { MessageBubble } from '@/components/game/MessageBubble';
import { CoherenceMeter } from '@/components/game/CoherenceMeter';
import { TurnCounter } from '@/components/game/TurnCounter';
import { InputArea } from '@/components/game/InputArea';
import { Evidence } from '@/types/game';

// コヒーレンスに応じた画像バリアントを返す
// 画像ファイル命名規則: public/images/characters/{caseId}_{emotion}.png
// emotion: normal | nervous | cornered | breaking
function getCharacterImage(caseId: string, coherence: number): string | null {
  const emotion =
    coherence >= 60 ? 'normal' :
    coherence >= 40 ? 'nervous' :
    coherence >= 20 ? 'cornered' : 'breaking';

  // 存在する画像だけを返す（未定義のものはnull → プレースホルダー表示）
  const available: Record<string, string[]> = {
    case_001: [],
    case_002: ['normal'],
  };

  const list = available[caseId] ?? [];
  if (list.includes(emotion)) return `/images/characters/${caseId}_${emotion}.png`;
  if (list.includes('normal')) return `/images/characters/${caseId}_normal.png`;
  return null;
}

// ケース別データ（証拠・容疑者名）
const CASE_META: Record<string, {
  criminalName: string;
  evidence: Evidence[];
}> = {
  case_001: {
    criminalName: '山城 星也',
    evidence: [
      { id: 'ev_autopsy', name: '司法解剖報告書', content: '死亡推定時刻：午後4時〜5時。死因：後頭部への鈍器による強打。即死と推定。' },
      { id: 'ev_clock_statue', name: '「考える人」の置物', content: '凶器。高さ約25cm。被害者の血痕付着。首を傾けると内蔵スピーカーから現在時刻を読み上げる。外見からは時計とわからない。' },
      { id: 'ev_blackout', name: '停電の記録', content: '事件当日、午前11時〜午後3時まで計画停電。電力会社発行の公式記録。' },
      { id: 'ev_passport', name: '被害者のパスポート', content: '先週ニューヨークから帰国。日本との時差は-14時間。置物の時計はNY時刻に設定されていた。' },
      { id: 'ev_receipt', name: 'コンビニのレシート', content: '矢上が午後4時30分にコンビニで買い物をした記録。マンションから徒歩15分の場所。' },
    ],
  },
  case_002: {
    criminalName: '永瀬 達也',
    evidence: [
      { id: 'ev_checklist', name: '夜間給餌チェックリスト', content: '海老原浩二の手書きチェックリスト。A水槽（イワシ）とB水槽（サメ・エイ）の確認欄に記入あり。C水槽（熱帯魚）以降は空白。B〜C水槽間の通路床に落ちた状態で発見された' },
      { id: 'ev_id_log', name: 'バックヤード入退室記録', content: 'バックヤード入口電子錠の入退室ログ。17:35：海老原浩二のIDカードで開錠の記録。17:35以降の永瀬の退館ログは存在しない' },
      { id: 'ev_director', name: '館長・富岡の証言記録', content: '館長・富岡義明の証言：「永瀬氏からバックヤード見学や面会の許可申請は受けていない。昨日は17時から18時30分まで施工会社の担当者と会議室で打ち合わせをしており、その間は誰とも会っていない」' },
      { id: 'ev_bribery', name: '収賄関連書類コピー', content: '永瀬達也と館長・富岡義明の不正契約書コピー。新館建設費42億円のうち3000万円を水増しし、富岡個人口座に振り込む内容。永瀬の直筆サインと押印あり。' },
      { id: 'ev_autopsy', name: '司法解剖報告書', content: '死亡推定時刻18:00〜19:00。後頭部左側に鈍器による打撲痕（転落による傷とは角度が一致しない）。遺体発見時の体の向きは入口方向（北向き）。' },
    ],
  },
};

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

// 証拠モーダル
function EvidenceModal({
  evidence,
  onClose,
}: {
  evidence: Evidence[];
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
            <p className="text-sm leading-relaxed text-gray-300">{selected.content}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {evidence.map((ev) => (
              <li key={ev.id}>
                <button
                  onClick={() => setSelected(ev)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:border-cyan-500 hover:text-white"
                >
                  {ev.name}
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
  previousTestimony,
  onClose,
}: {
  messages: { role: string; content: string }[];
  previousTestimony: string[];
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
            {previousTestimony.length > 0 && (
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
                      {m.role === 'player' ? 'あなた' : '容疑者'}
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
            <div className="space-y-2">
              <p className="mb-3 text-xs text-gray-500">前回の尋問で容疑者が述べた証言。今回と食い違いがあれば矛盾として突ける。</p>
              {previousTestimony.map((t, i) => (
                <div key={i} className="rounded-xl bg-yellow-950/30 border border-yellow-900/40 px-3 py-2">
                  <p className="text-sm text-gray-300">「{t}」</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InterrogationContent({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { session, previousTestimony, isCriminalThinking, sendMessage, arrestChallenge } = useGame();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showObjection, setShowObjection] = useState(false);
  const prevMessageCountRef = useRef(0);

  const meta = CASE_META[caseId];

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
      {/* 異議あり！オーバーレイ */}
      {showObjection && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <p
            className="select-none text-6xl font-black tracking-tight text-red-500 drop-shadow-[0_0_24px_rgba(239,68,68,0.8)]"
            style={{ animation: 'objection 1.8s ease-out forwards' }}
          >
            異議あり！
          </p>
          <style>{`
            @keyframes objection {
              0%   { opacity: 0; transform: scale(0.4) rotate(-6deg); }
              15%  { opacity: 1; transform: scale(1.15) rotate(2deg); }
              30%  { transform: scale(1.0) rotate(0deg); }
              70%  { opacity: 1; }
              100% { opacity: 0; transform: scale(1.05); }
            }
          `}</style>
        </div>
      )}

      {/* ヘッダー: ターン数・コヒーレンス */}
      <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-2">
        <div className="mx-auto flex max-w-md flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <TurnCounter turn={session.turn} />
            <span className="text-xs text-gray-500">コヒーレンス</span>
          </div>
          <CoherenceMeter coherence={session.coherence} />
        </div>
      </div>

      {/* 容疑者エリア */}
      <div className="relative shrink-0 bg-gray-950">
        {/* キャラクター画像: 横幅いっぱい */}
        {(() => {
          const imgSrc = getCharacterImage(caseId, session.coherence);
          return imgSrc ? (
            <div className="relative mx-auto w-full max-w-md">
              <Image
                src={imgSrc}
                alt={meta.criminalName}
                width={1024}
                height={1024}
                className="w-full h-auto"
                priority
              />
              {/* 下部グラデーション: 白背景をダーク背景に馴染ませる */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-950 to-transparent" />
              {/* 思考中スピナー */}
              {isCriminalThinking && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40">
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

        {/* 名前・状態: 画像の下に縦並び */}
        <div className="border-b border-gray-800 px-4 py-2">
          <p className="font-bold text-white">{meta.criminalName}</p>
          <p className="text-xs text-gray-400">
            {session.coherence >= 80 ? '冷静' :
             session.coherence >= 60 ? 'やや動揺' :
             session.coherence >= 40 ? '動揺' :
             session.coherence >= 20 ? '取り乱し中' : '崩壊寸前'}
          </p>
        </div>
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
            <MessageBubble key={i} message={msg} />
          ))}
          {isCriminalThinking && (
            <div className="flex items-start gap-2">
              <div className="rounded-2xl rounded-bl-sm border border-gray-700 bg-gray-800 px-4 py-3">
                <p className="mb-1 text-xs font-semibold text-cyan-400">容疑者</p>
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
          <InputArea
            onSend={sendMessage}
            disabled={isCriminalThinking || isGameOver}
            placeholder={isGameOver ? 'ゲーム終了' : '容疑者に質問する...'}
          />
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
        <EvidenceModal evidence={meta.evidence} onClose={() => setShowEvidence(false)} />
      )}
      {showLog && (
        <LogModal
          messages={session.messages.map((m) => ({ role: m.role, content: m.content }))}
          previousTestimony={previousTestimony}
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
