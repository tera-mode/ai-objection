export interface EventScene {
  id: string;
  background?: string;         // 背景画像パス
  character?: {
    image: string;             // キャラクター画像パス
    position: 'left' | 'center' | 'right';
    flip?: boolean;            // 左右反転
  } | null;
  character2?: {               // 2人目キャラクター（右側）
    image: string;
    position: 'left' | 'center' | 'right';
    flip?: boolean;
  } | null;
  speaker?: string | null;     // 話者名（nullはナレーション）
  text: string;                // テキスト
  effect?: 'fade_in' | 'fade_out'; // 演出
}

export interface EventData {
  id: string;
  title: string;
  scenes: EventScene[];
  onComplete: {
    type: 'navigate';
    path: string;
  };
}
