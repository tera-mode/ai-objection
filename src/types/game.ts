// ゲームセッションの状態
export interface GameSession {
  sessionId: string;
  userId: string;
  caseId: string;
  phase: 'crime_scene' | 'interrogation' | 'result';
  turn: number;
  coherence: number;        // 0〜maxCoherence
  maxCoherence: number;     // 容疑者ごとの動揺度上限（デフォルト100）
  maxTurns: number | null;  // ケースごとのターン上限（null = 無制限）
  messages: ChatMessage[];
  isCompleted: boolean;
  verdict: 'arrest' | 'escape' | null;
  unlockedEvidenceIds: string[];
  exploitedWeaknesses: string[];  // confirmed で解決済みの矛盾detail（リピート防止用）
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  role: 'player' | 'criminal';
  content: string;
  coherenceAfter?: number;  // 犯人発言後のコヒーレンス値
  contradiction?: string;   // JudgeAIが検出した矛盾の説明（あれば）
  playerReasoning?: 'low' | 'medium' | 'high';  // プレイヤーの推理度
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
  companionMemory?: CompanionMemory[];
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

export interface CompanionMemory {
  id: string;
  unlocks_evidence: string;
  trigger_keywords: string[];
  toimaru_recall: string;
  source_description: string;
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
  maxTurns: number | null;
  messages: ChatMessageData[];
  isCompleted: boolean;
  verdict: 'arrest' | 'escape' | null;
  unlockedEvidenceIds: string[];
  exploitedWeaknesses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  role: 'player' | 'criminal';
  content: string;
  coherenceAfter?: number;
  contradiction?: string;
  playerReasoning?: 'low' | 'medium' | 'high';
  timestamp: string;
}
