'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { GameSession, ChatMessage } from '@/types/game';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface PreviousMessage {
  role: 'player' | 'criminal' | 'divider';
  content: string;
}

interface GameContextType {
  session: GameSession | null;
  previousTestimony: string[];
  previousConversation: PreviousMessage[];
  isLoading: boolean;
  isCriminalThinking: boolean;
  startSession: (caseId: string) => Promise<GameSession>;
  sendMessage: (message: string) => Promise<void>;
  arrestChallenge: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  unlockEvidence: (evidenceId: string) => void;
}

const GameContext = createContext<GameContextType>({
  session: null,
  previousTestimony: [],
  previousConversation: [],
  isLoading: false,
  isCriminalThinking: false,
  startSession: async () => { throw new Error('Not initialized'); },
  sendMessage: async () => {},
  arrestChallenge: () => {},
  loadSession: async () => {},
  unlockEvidence: () => {},
});

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [previousTestimony, setPreviousTestimony] = useState<string[]>([]);
  const [previousConversation, setPreviousConversation] = useState<PreviousMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCriminalThinking, setIsCriminalThinking] = useState(false);

  const startSession = useCallback(async (caseId: string): Promise<GameSession> => {
    setIsLoading(true);

    // リトライ時（同ケースで escape 負け）は証拠を引き継ぐ
    const inheritEvidenceIds: string[] =
      session?.caseId === caseId && session?.verdict === 'escape' && session.unlockedEvidenceIds.length > 0
        ? session.unlockedEvidenceIds
        : [];

    try {
      // 過去の完了セッションから犯人の証言を取得
      try {
        const prevRes = await authenticatedFetch(`/api/get-session?caseId=${caseId}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          const prevSessions = prevData.sessions ?? [];
          if (prevSessions.length > 0) {
            // AI用：最新セッションの犯人発言のみ（最初の挨拶を除外、最大10件）
            const latestMessages: { role: string; content: string }[] = prevSessions[0].messages ?? [];
            const criminalMessages: string[] = latestMessages
              .filter((m) => m.role === 'criminal')
              .slice(1)
              .map((m) => m.content)
              .slice(-10);
            setPreviousTestimony(criminalMessages);
            // 表示用：新しい順（prevSessionsはすでに新しい順）でラベルを挿入
            const total = prevSessions.length;
            const conversation: PreviousMessage[] = [];
            prevSessions.forEach((sess: { createdAt: string; messages?: { role: string; content: string }[] }, idx: number) => {
              const msgs: { role: string; content: string }[] = sess.messages ?? [];
              const date = new Date(sess.createdAt).toLocaleDateString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              const label = idx === 0 ? `最新の尋問（${date}）` : `第${total - idx}回目の尋問（${date}）`;
              conversation.push({ role: 'divider', content: label });
              msgs.slice(1).forEach((m) => {
                conversation.push({ role: m.role as 'player' | 'criminal', content: m.content });
              });
            });
            setPreviousConversation(conversation);
          } else {
            setPreviousTestimony([]);
            setPreviousConversation([]);
          }
        }
      } catch {
        // 過去データ取得失敗は無視
        setPreviousTestimony([]);
        setPreviousConversation([]);
      }

      // セッション作成
      const res = await authenticatedFetch('/api/save-session', {
        method: 'POST',
        body: JSON.stringify({ caseId, action: 'create', inheritEvidenceIds }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Failed to create session (${res.status})`);
      }

      const data = await res.json();
      const newSession: GameSession = {
        ...data.session,
        createdAt: new Date(data.session.createdAt),
        updatedAt: new Date(data.session.updatedAt),
        messages: [],
        unlockedEvidenceIds: data.session.unlockedEvidenceIds ?? [],
        exploitedWeaknesses: data.session.exploitedWeaknesses ?? [],
      };
      setSession(newSession);

      // 容疑者の最初の発言を取得（スピナーを出す）
      setIsCriminalThinking(true);
      try {
        const openingRes = await authenticatedFetch('/api/criminal-response', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: newSession.sessionId,
            message: '__opening__',
            caseId,
            coherence: newSession.coherence,
            conversationHistory: [],
          }),
        }, 30000); // 30秒タイムアウト: Vercelコールドスタート対策

        if (openingRes.ok) {
          const { response } = await openingRes.json();
          const openingMsg: ChatMessage = {
            role: 'criminal',
            content: response,
            coherenceAfter: newSession.coherence,
            timestamp: new Date(),
          };
          const sessionWithOpening: GameSession = {
            ...newSession,
            messages: [openingMsg],
          };
          setSession(sessionWithOpening);
          return sessionWithOpening;
        }
      } catch {
        // 最初の発言取得に失敗しても続行
      } finally {
        setIsCriminalThinking(false);
      }

      return newSession;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const sendMessage = useCallback(async (message: string) => {
    if (!session || isCriminalThinking) return;

    setIsCriminalThinking(true);

    // プレイヤーメッセージを即座にUIに追加
    const playerMsg: ChatMessage = {
      role: 'player',
      content: message,
      timestamp: new Date(),
    };

    const updatedMessages = [...session.messages, playerMsg];
    const currentTurn = session.turn + 1;

    setSession((prev) => prev ? {
      ...prev,
      messages: updatedMessages,
      turn: currentTurn,
    } : null);

    try {
      const conversationHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // 1. JudgeAIを先に呼び出してproofLevelを取得
      const judgeRes = await authenticatedFetch('/api/judge', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          caseId: session.caseId,
          playerMessage: message,
          criminalResponse: '',
          conversationHistory,
          previousTestimony,
          exploitedWeaknesses: session.exploitedWeaknesses ?? [],
        }),
      });

      if (!judgeRes.ok) {
        const errData = await judgeRes.json().catch(() => ({}));
        throw new Error(`Judge response failed: ${errData.error ?? judgeRes.status}`);
      }

      const { hasContradiction, contradictionDetail, coherenceChange: rawCoherenceChange, proofLevel, playerReasoning } = await judgeRes.json();

      // 推理度に基づくコヒーレンス減衰（hasContradiction: true のときのみ適用）
      const reasoningMultiplier = ({
        low: 0.33,
        medium: 0.66,
        high: 1.0,
      } as Record<string, number>)[playerReasoning as string] ?? 1.0;

      const coherenceChange = hasContradiction
        ? Math.round(rawCoherenceChange * reasoningMultiplier)
        : rawCoherenceChange;

      // confirmed の矛盾を解決済みリストに追加（リピート防止用）
      let updatedExploitedWeaknesses = [...(session.exploitedWeaknesses ?? [])];
      if (proofLevel === 'confirmed' && contradictionDetail) {
        updatedExploitedWeaknesses = [...updatedExploitedWeaknesses, contradictionDetail];
      }

      // 2. proofLevel + contradictionDetail をCriminalAIに渡して返答を生成
      const criminalRes = await authenticatedFetch('/api/criminal-response', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          message,
          caseId: session.caseId,
          coherence: session.coherence,
          conversationHistory: conversationHistory.slice(0, -1),
          previousTestimony,
          proofLevel: proofLevel ?? 'none',
          contradictionDetail: contradictionDetail ?? null,
          unlockedEvidenceIds: session.unlockedEvidenceIds ?? [],
          playerReasoning: playerReasoning ?? 'high',
        }),
      });

      if (!criminalRes.ok) {
        const errData = await criminalRes.json().catch(() => ({}));
        throw new Error(`Criminal response failed: ${errData.error ?? criminalRes.status}`);
      }

      const { response: criminalResponse } = await criminalRes.json();

      const newCoherence = Math.max(0, Math.min(session.maxCoherence, session.coherence + coherenceChange));

      const criminalMsg: ChatMessage = {
        role: 'criminal',
        content: criminalResponse,
        coherenceAfter: newCoherence,
        contradiction: hasContradiction ? contradictionDetail : undefined,
        playerReasoning: hasContradiction ? (playerReasoning as 'low' | 'medium' | 'high') : undefined,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, criminalMsg];

      // ゲーム終了判定
      const isGameOver = (session.maxTurns != null && currentTurn >= session.maxTurns) || newCoherence <= 0;
      const verdict = isGameOver
        ? (newCoherence <= 0 ? 'arrest' : 'escape')
        : null;

      const updatedSession: GameSession = {
        ...session,
        messages: finalMessages,
        turn: currentTurn,
        coherence: newCoherence,
        exploitedWeaknesses: updatedExploitedWeaknesses,
        phase: isGameOver ? 'result' : 'interrogation',
        isCompleted: isGameOver,
        verdict,
        updatedAt: new Date(),
      };

      setSession(updatedSession);

      // セッションを保存
      await authenticatedFetch('/api/save-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'update',
          session: {
            ...updatedSession,
            createdAt: updatedSession.createdAt.toISOString(),
            updatedAt: updatedSession.updatedAt.toISOString(),
            messages: updatedSession.messages.map((m) => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            })),
          },
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // エラー時はプレイヤーメッセージを戻す
      setSession((prev) => prev ? {
        ...prev,
        messages: prev.messages.slice(0, -1),
        turn: prev.turn - 1,
      } : null);
    } finally {
      setIsCriminalThinking(false);
    }
  }, [session, isCriminalThinking]);

  const arrestChallenge = useCallback(() => {
    if (!session) return;

    const isArrested = session.coherence / session.maxCoherence <= 0.5;
    const verdict = isArrested ? 'arrest' : 'escape';

    const updatedSession: GameSession = {
      ...session,
      phase: 'result',
      isCompleted: true,
      verdict,
      updatedAt: new Date(),
    };

    setSession(updatedSession);

    // セッションを保存
    authenticatedFetch('/api/save-session', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: session.sessionId,
        action: 'update',
        session: {
          ...updatedSession,
          createdAt: updatedSession.createdAt.toISOString(),
          updatedAt: updatedSession.updatedAt.toISOString(),
          messages: updatedSession.messages.map((m) => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })),
        },
      }),
    }).catch(console.error);
  }, [session]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch(`/api/get-session?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to load session');

      const data = await res.json();
      const caseId = data.session.caseId;

      // ケースJSONからmaxCoherence・maxTurnsを取得して上書き（Firebaseの古い値を使わない）
      let maxCoherence = data.session.maxCoherence ?? 100;
      let maxTurns: number | null = data.session.maxTurns ?? null;
      if (caseId) {
        const caseRes = await authenticatedFetch(`/api/get-case?caseId=${caseId}`);
        if (caseRes.ok) {
          const caseData = await caseRes.json();
          maxCoherence = caseData.maxCoherence ?? maxCoherence;
          maxTurns = caseData.maxTurns ?? null;
        }
      }

      setSession({
        ...data.session,
        maxCoherence,
        maxTurns,
        unlockedEvidenceIds: data.session.unlockedEvidenceIds ?? [],
        exploitedWeaknesses: data.session.exploitedWeaknesses ?? [],
        createdAt: new Date(data.session.createdAt),
        updatedAt: new Date(data.session.updatedAt),
        messages: data.session.messages.map((m: { timestamp: string; role: 'player' | 'criminal'; content: string; coherenceAfter?: number; contradiction?: string; playerReasoning?: 'low' | 'medium' | 'high' }) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlockEvidence = useCallback((evidenceId: string) => {
    setSession((prev) => {
      if (!prev) return null;
      if (prev.unlockedEvidenceIds.includes(evidenceId)) return prev;
      const updated: GameSession = {
        ...prev,
        unlockedEvidenceIds: [...prev.unlockedEvidenceIds, evidenceId],
        updatedAt: new Date(),
      };
      // セッションを保存（fire-and-forget）
      authenticatedFetch('/api/save-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: prev.sessionId,
          action: 'update',
          session: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            messages: updated.messages.map((m) => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            })),
          },
        }),
      }).catch(console.error);
      return updated;
    });
  }, []);

  return (
    <GameContext.Provider value={{ session, previousTestimony, previousConversation, isLoading, isCriminalThinking, startSession, sendMessage, arrestChallenge, loadSession, unlockEvidence }}>
      {children}
    </GameContext.Provider>
  );
};
