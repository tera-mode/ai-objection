// ゲームセッションの状態
export interface GameSession {
  sessionId: string;
  userId: string;
  caseId: string;
  phase: 'crime_scene' | 'interrogation' | 'result';
  turn: number;
  coherence: number;        // 0〜maxCoherence
  maxCoherence: number;     // 容疑者ごとの動揺度上限（デフォルト100）
  maxTurns: number;         // ケースごとのターン上限（デフォルト15）
  messages: ChatMessage[];
  isCompleted: boolean;
  verdict: 'arrest' | 'escape' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  role: 'player' | 'criminal';
  content: string;
  coherenceAfter?: number;  // 犯人発言後のコヒーレンス値
  contradiction?: string;   // JudgeAIが検出した矛盾の説明（あれば）
  timestamp: Date;
}

// シナリオのワールドステート
export interface CaseData {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  storyText: {
    intro: string;
    criminalIntro: string;
    victory: string;
    defeat: string;
  };
  timeline: TimelineEvent[];
  criminal: CharacterData;
  evidence: Evidence[];
}

export interface TimelineEvent {
  time: string;
  who: string;
  what: string;
}

export interface CharacterData {
  name: string;
  gender: 'male' | 'female';
  personality: {
    surface: string;
    underPressure: string;
    collapsed: string;
  };
  knowledge: {
    knows: string[];
    doesnt_know: string[];
  };
  coverStory: {
    claim: string;
    structural_weaknesses: string[];
  };
}

export interface Evidence {
  id: string;
  name: string;
  content: string;
}

// Firestore保存用（Dateの代わりにstring）
export interface GameSessionData {
  sessionId: string;
  userId: string;
  caseId: string;
  phase: 'crime_scene' | 'interrogation' | 'result';
  turn: number;
  coherence: number;
  maxCoherence: number;
  maxTurns: number;
  messages: ChatMessageData[];
  isCompleted: boolean;
  verdict: 'arrest' | 'escape' | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  role: 'player' | 'criminal';
  content: string;
  coherenceAfter?: number;
  contradiction?: string;
  timestamp: string;
}
