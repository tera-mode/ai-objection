'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { GameSession, ChatMessage } from '@/types/game';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface GameContextType {
  session: GameSession | null;
  previousTestimony: string[];
  isLoading: boolean;
  isCriminalThinking: boolean;
  startSession: (caseId: string) => Promise<GameSession>;
  sendMessage: (message: string) => Promise<void>;
  arrestChallenge: () => void;
  loadSession: (sessionId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType>({
  session: null,
  previousTestimony: [],
  isLoading: false,
  isCriminalThinking: false,
  startSession: async () => { throw new Error('Not initialized'); },
  sendMessage: async () => {},
  arrestChallenge: () => {},
  loadSession: async () => {},
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
  const [isLoading, setIsLoading] = useState(false);
  const [isCriminalThinking, setIsCriminalThinking] = useState(false);

  const startSession = useCallback(async (caseId: string): Promise<GameSession> => {
    setIsLoading(true);
    try {
      // 過去の完了セッションから犯人の証言を取得
      try {
        const prevRes = await authenticatedFetch(`/api/get-session?caseId=${caseId}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          const prevSessions = prevData.sessions ?? [];
          if (prevSessions.length > 0) {
            // 最新の失敗セッションから犯人発言を抽出（最大10件）
            const criminalMessages: string[] = (prevSessions[0].messages ?? [])
              .filter((m: { role: string }) => m.role === 'criminal')
              .slice(1) // 最初の挨拶は除外
              .map((m: { content: string }) => m.content)
              .slice(-10);
            setPreviousTestimony(criminalMessages);
          } else {
            setPreviousTestimony([]);
          }
        }
      } catch {
        // 過去データ取得失敗は無視
        setPreviousTestimony([]);
      }

      // セッション作成
      const res = await authenticatedFetch('/api/save-session', {
        method: 'POST',
        body: JSON.stringify({ caseId, action: 'create' }),
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
            coherence: 100,
            conversationHistory: [],
          }),
        });

        if (openingRes.ok) {
          const { response } = await openingRes.json();
          const openingMsg: ChatMessage = {
            role: 'criminal',
            content: response,
            coherenceAfter: 100,
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
  }, []);

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

      // CriminalAIを呼び出す
      const criminalRes = await authenticatedFetch('/api/criminal-response', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          message,
          caseId: session.caseId,
          coherence: session.coherence,
          conversationHistory: conversationHistory.slice(0, -1),
          previousTestimony,
        }),
      });

      if (!criminalRes.ok) {
        const errData = await criminalRes.json().catch(() => ({}));
        throw new Error(`Criminal response failed: ${errData.error ?? criminalRes.status}`);
      }

      const { response: criminalResponse } = await criminalRes.json();

      // JudgeAIを呼び出す
      const judgeRes = await authenticatedFetch('/api/judge', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          caseId: session.caseId,
          playerMessage: message,
          criminalResponse,
          conversationHistory,
          previousTestimony,
        }),
      });

      if (!judgeRes.ok) {
        const errData = await judgeRes.json().catch(() => ({}));
        throw new Error(`Judge response failed: ${errData.error ?? judgeRes.status}`);
      }

      const { hasContradiction, contradictionDetail, coherenceChange } = await judgeRes.json();

      const newCoherence = Math.max(0, Math.min(100, session.coherence + coherenceChange));

      const criminalMsg: ChatMessage = {
        role: 'criminal',
        content: criminalResponse,
        coherenceAfter: newCoherence,
        contradiction: hasContradiction ? contradictionDetail : undefined,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, criminalMsg];

      // ゲーム終了判定
      const isGameOver = currentTurn >= 15 || newCoherence <= 0;
      const verdict = isGameOver
        ? (newCoherence <= 0 ? 'arrest' : 'escape')
        : null;

      const updatedSession: GameSession = {
        ...session,
        messages: finalMessages,
        turn: currentTurn,
        coherence: newCoherence,
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

    const isArrested = session.coherence <= 50;
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
      setSession({
        ...data.session,
        createdAt: new Date(data.session.createdAt),
        updatedAt: new Date(data.session.updatedAt),
        messages: data.session.messages.map((m: { timestamp: string; role: 'player' | 'criminal'; content: string; coherenceAfter?: number; contradiction?: string }) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <GameContext.Provider value={{ session, previousTestimony, isLoading, isCriminalThinking, startSession, sendMessage, arrestChallenge, loadSession }}>
      {children}
    </GameContext.Provider>
  );
};
