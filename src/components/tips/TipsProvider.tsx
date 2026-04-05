'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import tipsData from '../../../data/tips/tips.json';
import { Tip, TipWithStatus, TipsContextValue, TipTriggerEvent } from '@/types/tips';
import { TipsModal } from './TipsModal';
import { TipsHighlight } from './TipsHighlight';

const TipsContext = createContext<TipsContextValue | null>(null);

export function useTips() {
  const ctx = useContext(TipsContext);
  if (!ctx) throw new Error('useTips must be used within TipsProvider');
  return ctx;
}

const tips: Tip[] = tipsData.tips as Tip[];

export function TipsProvider({ children }: { children: ReactNode }) {
  const [activeTip, setActiveTip] = useState<Tip | null>(null);
  // activeTipRef で同期的に「表示中か」を管理（React stateは非同期なので複数イベントが
  // 同一サイクルで発火したときに race condition を防ぐ）
  const activeTipRef = useRef<Tip | null>(null);

  const showTip = useCallback((tipId: string) => {
    const tip = tips.find((t) => t.id === tipId);
    if (tip) {
      activeTipRef.current = tip;
      setActiveTip(tip);
    }
  }, []);

  const dismissTip = useCallback(() => {
    const tip = activeTipRef.current;
    if (tip && typeof window !== 'undefined') {
      localStorage.setItem(`tip_${tip.id}_seen`, '1');
    }
    activeTipRef.current = null;
    setActiveTip(null);
  }, []);

  const checkAndShowTip = useCallback(
    (event: TipTriggerEvent) => {
      if (typeof window === 'undefined') return;
      if (activeTipRef.current) return; // 同期チェックで race condition を防ぐ

      const candidates = tips.filter((tip) => {
        if (tip.trigger.timing === 'manual_only') return false;
        if (localStorage.getItem(`tip_${tip.id}_seen`)) return false;

        if (event.type === 'screen_enter') {
          if (tip.trigger.screen !== event.screen) return false;
          if (tip.trigger.timing === 'on_first_enter') {
            if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
            return !localStorage.getItem(`screen_${event.screen}_first_visited`);
          }
          if (tip.trigger.timing === 'on_first_enter_case') {
            if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
            return !localStorage.getItem(`screen_${event.screen}_${event.caseId}_first_visited`);
          }
          return false;
        }

        if (event.type === 'coherence_drop') {
          if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
          return tip.trigger.timing === 'on_coherence_drop';
        }
        if (event.type === 'evidence_unlock') {
          if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
          return tip.trigger.timing === 'on_first_evidence_unlock';
        }
        if (event.type === 'toimaru_open') {
          if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
          return tip.trigger.timing === 'on_first_toimaru_open';
        }
        if (event.type === 'turn_complete') {
          if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
          return (
            tip.trigger.timing === 'after_turn_N' &&
            Number(tip.trigger.condition) === event.turn
          );
        }
        if (event.type === 'first_message_sent') {
          if (tip.trigger.caseId && tip.trigger.caseId !== event.caseId) return false;
          return tip.trigger.timing === 'on_first_message_sent';
        }
        return false;
      });

      if (candidates.length === 0) return;

      candidates.sort((a, b) => a.order - b.order);
      const tip = candidates[0];

      // Mark first-visit flags so the same tip doesn't retrigger
      if (event.type === 'screen_enter') {
        if (tip.trigger.timing === 'on_first_enter') {
          localStorage.setItem(`screen_${event.screen}_first_visited`, '1');
        } else if (tip.trigger.timing === 'on_first_enter_case') {
          localStorage.setItem(`screen_${event.screen}_${event.caseId}_first_visited`, '1');
        }
      }

      // Mark tip as triggered (for list display) and set ref synchronously
      localStorage.setItem(`tip_${tip.id}_triggered`, '1');
      activeTipRef.current = tip;
      setActiveTip(tip);
    },
    [] // no dependency on activeTip — use ref instead
  );

  const getAllTips = useCallback((): TipWithStatus[] => {
    if (typeof window === 'undefined') {
      return tips
        .sort((a, b) => a.order - b.order)
        .map((t) => ({ ...t, seen: false, unlocked: false }));
    }
    return tips
      .sort((a, b) => a.order - b.order)
      .map((tip) => {
        const seen = !!localStorage.getItem(`tip_${tip.id}_seen`);
        const triggered = !!localStorage.getItem(`tip_${tip.id}_triggered`);
        const unlocked = seen || triggered || tip.trigger.timing === 'manual_only';
        return { ...tip, seen, unlocked };
      });
  }, []);

  const resetAllTips = useCallback(() => {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('tip_') ||
          key.startsWith('screen_') ||
          key.startsWith('first_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setActiveTip(null);
  }, []);

  return (
    <TipsContext.Provider
      value={{ activeTip, showTip, dismissTip, checkAndShowTip, getAllTips, resetAllTips }}
    >
      {children}
      {activeTip?.highlight && (
        <TipsHighlight
          targetTestId={activeTip.highlight.targetTestId}
          style={activeTip.highlight.style ?? 'pulse'}
        />
      )}
      {activeTip && (
        <TipsModal
          tip={activeTip}
          onClose={dismissTip}
          showOverlay={!activeTip.highlight}
        />
      )}
    </TipsContext.Provider>
  );
}
