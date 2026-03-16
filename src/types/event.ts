export type EventStep =
  | {
      type: 'scene';
      background: string;
      transition?: 'fade' | 'cut';
      duration?: number;
    }
  | {
      type: 'character';
      position: 'left' | 'right';
      image: string | null;
      name?: string;
      transition?: 'fadeIn' | 'fadeOut' | 'cut';
    }
  | {
      type: 'dialogue';
      speaker: string | null;
      text: string;
      speakerStyle?: 'protagonist' | 'companion' | 'npc' | 'narrator';
    }
  | {
      type: 'effect';
      name: 'shake' | 'flash' | 'fadeToBlack' | 'fadeFromBlack';
      duration?: number;
    }
  | {
      type: 'wait';
      duration: number;
    };

export interface EventData {
  id: string;
  steps: EventStep[];
  onComplete: {
    action: 'navigate';
    path: string;
  };
}
