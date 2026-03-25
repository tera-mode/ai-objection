export interface TipTrigger {
  screen: 'interrogation' | 'crime-scene' | 'play' | 'event' | 'result';
  timing:
    | 'on_first_enter'
    | 'on_first_enter_case'
    | 'after_turn_N'
    | 'on_first_evidence_unlock'
    | 'on_coherence_drop'
    | 'on_first_toimaru_open'
    | 'manual_only';
  caseId?: string | null;
  condition?: string | null;
}

export interface TipHighlight {
  targetTestId: string;
  style?: 'pulse' | 'glow' | 'arrow';
}

export interface Tip {
  id: string;
  title: string;
  text: string;
  image: string | null;
  trigger: TipTrigger;
  highlight?: TipHighlight | null;
  order: number;
}

export interface TipWithStatus extends Tip {
  seen: boolean;
  unlocked: boolean;
}

export type TipTriggerEvent =
  | { type: 'screen_enter'; screen: string; caseId?: string }
  | { type: 'turn_complete'; turn: number; caseId?: string }
  | { type: 'evidence_unlock'; caseId?: string }
  | { type: 'coherence_drop'; caseId?: string }
  | { type: 'toimaru_open'; caseId?: string };

export interface TipsContextValue {
  activeTip: Tip | null;
  showTip: (tipId: string) => void;
  dismissTip: () => void;
  checkAndShowTip: (event: TipTriggerEvent) => void;
  getAllTips: () => TipWithStatus[];
  resetAllTips: () => void;
}
