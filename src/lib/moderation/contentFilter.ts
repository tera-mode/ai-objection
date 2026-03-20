/**
 * コンテンツフィルタ
 * プレイヤー入力をAPIに送信する前にチェックする
 */

interface NGWordList {
  sexual: string[];
  violence: string[];
  slurs: string[];
  drugs: string[];
  personal_info: string[];
  prompt_injection: string[];
}

export interface FilterResult {
  passed: boolean;
  category: keyof NGWordList | null;
  toimaruResponse: string | null;
}

let _ngWords: NGWordList | null = null;

/**
 * NGワードリストをロードする（初回のみファイル読み込み、以後はキャッシュ）
 */
export async function loadNGWords(): Promise<NGWordList> {
  if (_ngWords) return _ngWords;
  const fs = await import('fs/promises');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'data', 'moderation', 'ng_words.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  _ngWords = JSON.parse(raw);
  return _ngWords!;
}

/**
 * テキスト正規化
 * - 全角英数→半角
 * - カタカナ→ひらがな
 * - スペース・記号除去（意図的な回避を防ぐ）
 * - 小文字化
 */
function normalizeText(text: string): string {
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    )
    .replace(/[\u30A1-\u30F6]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0x60)
    )
    .replace(/[\s\u3000・.。、,!！?？\-_～〜]/g, '')
    .toLowerCase();
}

/**
 * カテゴリ別トイマルの返答（世界観を壊さないセリフ）
 */
function getToimaruResponse(category: keyof NGWordList): string {
  const responses: Record<keyof NGWordList, string[]> = {
    sexual: [
      'な、なの！？ ボクの耳が変な音を拾ったのだ……！ それは尋問と関係ないのだ！',
      'えっ……？ ボクにはよくわからない言葉なのだ。事件のことを聞いてほしいのだ！',
    ],
    violence: [
      'なの、怖いこと言わないでほしいのだ……！ ボクたちは「問う」ことで解決するのだ！',
      'そ、それは尋問じゃなくて脅迫なのだ……！ なのはそういうことしないのだ！',
    ],
    slurs: [
      'なの……？ その言葉、ボクの耳が痛いのだ。もっと優しい言葉で聞いてほしいのだ',
      'うーん、そういう言い方はマコト界でも良くないのだ。別の聞き方にしてほしいのだ！',
    ],
    drugs: [
      'ボク、その薬草は知らないのだ……。事件に関係ある薬草のことなら聞いてほしいのだ！',
      'なの、それは怪しい薬師の話なのだ？ 今は事件に集中するのだ！',
    ],
    personal_info: [
      'ボクたちは容疑者のことを調べるのだ！ ボクたち自身のことじゃないのだ！',
      'えっ？ そういうことはボクに聞かれてもわからないのだ。事件のことを聞くのだ！',
    ],
    prompt_injection: [
      'な、なの？ ボクの耳がおかしな呪文を拾ったのだ……。それは尋問の言葉じゃないのだ！',
      'うーん？ ボクにはさっぱりわからない呪文なのだ。普通の言葉で質問するのだ！',
    ],
  };

  const options = responses[category];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * プレイヤー入力をフィルタリングする
 * カテゴリ順に重い順でチェック（prompt_injection → sexual → slurs → violence → drugs → personal_info）
 */
export function checkContent(
  input: string,
  ngWords: NGWordList
): FilterResult {
  const normalized = normalizeText(input);

  const categories: (keyof NGWordList)[] = [
    'prompt_injection', 'sexual', 'slurs', 'violence', 'drugs', 'personal_info',
  ];

  for (const category of categories) {
    for (const word of ngWords[category]) {
      const normalizedWord = normalizeText(word);
      if (normalizedWord.length >= 2 && normalized.includes(normalizedWord)) {
        return {
          passed: false,
          category,
          toimaruResponse: getToimaruResponse(category),
        };
      }
    }
  }

  return { passed: true, category: null, toimaruResponse: null };
}
