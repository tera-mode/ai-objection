# 実装指示書：ハブ画面＋ケース間ストーリーイベント

## 概要

現在の「ケース選択」画面（`/play`）を、**「イベント」と「ケース」を統合したハブ画面**に改修する。
加えて、プロローグから各ケースをつなぐ**ストーリーイベントシーン**を全て作成する。

### ゴール
- プレイヤーがゲームを起動すると**ハブ画面からスタート**する
- ハブ画面から**イベント（ストーリーシーン）**と**ケース（尋問パート）**の両方にアクセスできる
- ストーリーの進行順序が視覚的にわかり、既読/未読が区別できる
- 各ケースの選択肢が**犯人キャラ画像＋背景**でビジュアル化されている
- ケース間のストーリーが途切れず、縦軸のナラティブが自然につながる

---

## Part 1：ハブ画面（`/play` の改修）

### 1-1. 現状の構造

```
現在のフロー：
  LP → ログイン → /play（ケース選択。プロローグ未視聴なら /event/prologue_a へリダイレクト）

現在の /play/page.tsx：
  - テキストのみのケースカード（タイトル・難易度・説明文）
  - cases と sampleCases を API（/api/list-cases）から取得
  - プロローグ未視聴チェック（localStorage の event_prologue_b_seen）
```

### 1-2. 新しいハブ画面の設計

#### ルーティング変更
- `/play` をハブ画面にする（URLはそのまま）
- 「はじめから」スタート時は `/play` に遷移（プロローグ未視聴リダイレクトは**削除**）
- プロローグはハブ画面から選んで見る形にする

#### 画面レイアウト

```
┌──────────────────────┐
│  ⚙ 問わない異世界の探偵少女  │  ← ヘッダー（設定ボタン付き）
├──────────────────────┤
│                      │
│  ストーリー             │  ← セクション見出し
│                      │
│  ┌──────────────┐    │
│  │🔵 プロローグ    │ NEW │  ← イベントカード（NEW or ✓済）
│  └──────────────┘    │
│          ↓            │
│  ┌──────────────┐    │
│  │🗡️ [犯人画像]    │    │  ← ケースカード（ビジュアル）
│  │ ケース1 市場の..  │ ✓  │
│  │ ★☆☆ 初級      │    │
│  └──────────────┘    │
│          ↓            │
│  ┌──────────────┐    │
│  │🔵 ケース1後日談  │ NEW │  ← 間のイベント
│  └──────────────┘    │
│          ↓            │
│  ┌──────────────┐    │
│  │🗡️ [犯人画像]    │    │  ← ケース2
│  │ ケース2 闘技場.. │ 🔒 │  ← ロック表示（前のイベント未視聴）
│  └──────────────┘    │
│          ↓            │
│  （以下繰り返し）       │
│                      │
├──────────────────────┤
│  サンプルシナリオ        │  ← 折りたたみセクション
│  （テキストリンクのまま） │
└──────────────────────┘
```

#### ストーリーアイテムの順序定義

ハブ画面に表示するアイテムの順序は **設定ファイルで一元管理** する。

**新規ファイル: `data/story-flow.json`**

```jsonc
{
  "items": [
    { "type": "event",  "id": "prologue",        "title": "プロローグ：はじまりの問い" },
    { "type": "case",   "id": "case_001",        "title": "ケース1：市場の毒殺事件" },
    { "type": "event",  "id": "after_case_001",  "title": "ケース1 後日談" },
    { "type": "case",   "id": "case_002",        "title": "ケース2：闘技場の惨劇" },
    { "type": "event",  "id": "after_case_002",  "title": "ケース2 後日談" },
    { "type": "case",   "id": "case_003",        "title": "ケース3：噂と真実の間" },
    { "type": "event",  "id": "after_case_003",  "title": "ケース3 後日談" },
    { "type": "case",   "id": "case_004",        "title": "ケース4：仮面の歌姫" },
    { "type": "event",  "id": "after_case_004",  "title": "ケース4 後日談" }
  ]
}
```

- イベントやケースを追加するときは、このJSONに1行追加するだけ
- 表示順序はこの配列の順序そのまま

#### 進行管理（ロック/アンロック）

**localStorage で管理する。キー命名規則：**

| キー | 意味 | セットタイミング |
|------|------|----------------|
| `event_{eventId}_seen` | イベント視聴済み | イベント完了時（既存のまま） |
| `case_{caseId}_cleared` | ケースクリア済み | result画面で逮捕成功時 |

**ロック判定ルール：**
- `story-flow.json` の配列を上から順に見る
- あるアイテムがアンロックされる条件は「**直前のアイテムが完了済み**」
- ただし**最初のアイテム（プロローグ）は常にアンロック**
- ケースは「クリア済み」でなくても**アンロックされていればプレイ可能**（クリアしていなければ次はロック）

**重要：プロローグ未視聴時のリダイレクト処理は削除する。** ハブ画面は常に表示し、プロローグが未視聴の場合はプロローグに「NEW」バッジを付けて誘導するだけ。

### 1-3. ケースカードのビジュアル化

現在テキストのみのケースカードに、犯人キャラ画像と背景を追加する。

#### カード構造

```
┌─────────────────────────────┐
│ [背景画像（暗めオーバーレイ）]  │
│                             │
│   [犯人キャラ画像]            │  ← 右寄せ、縦幅いっぱい
│                             │
│ ケースタイトル         ★☆☆  │  ← 左下にテキスト
│ 一行あらすじ                  │
│                     ✓済/🔒  │
└─────────────────────────────┘
```

#### 画像ソース

各ケースの画像パスは **`data/story-flow.json` に追加フィールドとして持たせる**：

```jsonc
{
  "type": "case",
  "id": "case_001",
  "title": "ケース1：市場の毒殺事件",
  "card": {
    "characterImage": "/images/characters/case_001/normal.png",
    "backgroundImage": "/images/backgrounds/case_001_interrogation.jpg"
  }
}
```

- `characterImage`：犯人の `normal` 表情。既に全ケースに存在する
- `backgroundImage`：尋問背景。既に全ケースに存在する
- `mini_prologue` は通常のハブには表示しない（プロローグイベントの中から遷移する既存のフロー維持）

#### イベントカードのスタイル

イベントカードはケースカードより控えめに。

```
┌─────────────────────────────┐
│ 📖  プロローグ：はじまりの問い  │  ← アイコン＋タイトル
│                        NEW  │  ← バッジ
└─────────────────────────────┘
```

- 背景色はケースカードと区別（ケース: 画像付き / イベント: 単色＋アイコン）
- アイコンは📖（ストーリー）で統一

### 1-4. API/データ変更

#### `/api/list-cases` の拡張（または新API `/api/story-flow`）

新しい API エンドポイント `/api/story-flow` を追加する：

```typescript
// src/app/api/story-flow/route.ts
// data/story-flow.json を読み込んで返す
// ケースの場合は cases/*.json から title, difficulty, description も付与
// イベントの場合は events/*.json から title も付与
```

レスポンス例：
```jsonc
{
  "items": [
    {
      "type": "event",
      "id": "prologue",
      "title": "プロローグ：はじまりの問い",
      "card": null
    },
    {
      "type": "case",
      "id": "case_001",
      "title": "市場の毒殺事件",
      "difficulty": "easy",
      "description": "一行あらすじ",
      "card": {
        "characterImage": "/images/characters/case_001/normal.png",
        "backgroundImage": "/images/backgrounds/case_001_interrogation.jpg"
      }
    }
    // ...
  ],
  "sampleCases": [ /* 既存のサンプルケースリスト */ ]
}
```

#### next.config.ts の outputFileTracingIncludes に追加

```typescript
'/api/story-flow': ['./data/**/*'],
```

### 1-5. 既読/未読のUI表現

| 状態 | 表示 |
|------|------|
| 未到達（ロック中） | カード全体がグレーアウト＋🔒アイコン。タップ不可 |
| アンロック済み・未プレイ | 通常表示＋**「NEW」バッジ**（目立つ色） |
| イベント視聴済み | ✓チェックマーク。カードはやや暗く |
| ケースクリア済み | ✓チェックマーク＋「クリア済み」。再プレイ可能 |
| ケース途中 | 通常表示（特別な表示なし。タップで再開） |

### 1-6. ケースクリア記録の追加

現在の result 画面（`/play/[caseId]/result/page.tsx`）に、逮捕成功時に localStorage へ記録する処理を追加する。

```typescript
// result/page.tsx の逮捕成功時
if (isArrest) {
  localStorage.setItem(`case_${caseId}_cleared`, '1');
}
```

**注意：** `mini_prologue` のクリアはイベントフローの中で処理されるため、既存の `eventAfter` の仕組みと併存する。`mini_prologue` のクリア記録は不要（プロローグイベント全体の完了フラグで管理）。

---

## Part 2：ケース間ストーリーイベントの作成

### 2-1. 作成するイベント一覧

既存のプロローグ（`data/events/prologue.json`）の他に、以下のイベントを新規作成する。

| イベントID | タイミング | 内容概要 | 縦軸ストーリー層 |
|-----------|----------|---------|--------------|
| `prologue` | ゲーム開始時 | **既存**。転生→ミニケース→トイマル登場→case_001導入 | — |
| `after_case_001` | case_001クリア後 | 事件解決の余韻、第0層の手がかり、case_002への導線 | 第0層 |
| `after_case_002` | case_002クリア後 | イバルド事件の余波、第0層→第1層の移行、case_003への導線 | 第0→1層 |
| `after_case_003` | case_003クリア後 | 噂の事件の余韻、第1層の深化、case_004への導線 | 第1層 |
| `after_case_004` | case_004クリア後 | カブリーナ事件後のトイマルの成長、第1→2層への橋渡し | 第1→2層 |

### 2-2. 既存プロローグの修正

現在の `prologue.json` は1つのファイルに全てが入っている。以下の点を修正する：

**修正点：**
- `onComplete` を `{ "type": "navigate", "path": "/play" }` に変更（現在は `/play` だが、ハブ画面の改修後はこれで正しい）
- プロローグの最終シーン（scene 024）がcase_001の導入になっているので、ハブ画面に戻る形でOK
- プロローグ完了後はハブ画面に戻り、case_001 がアンロックされた状態になる

**プロローグの完了フラグの変更：**
- 現在は `event_prologue_b_seen` をキーにしているが、新しい仕組みでは `event_prologue_seen` に統一する
- `src/app/(game)/event/[eventId]/page.tsx` の `handleComplete` で `event_{eventId}_seen` を立てる既存のロジックをそのまま活用

### 2-3. 各イベントの内容

---

#### `after_case_001.json`：ケース1後日談

**設定コンテキスト：**
- case_001 はモリエル（饒舌な香辛料商人）による毒殺事件
- 縦軸第0層：「流行通りの端に、古い看板が塗りつぶされた跡。うっすら『真を問え』と読める」
- モリエルの崩壊時台詞「みんなが信じれば本物になる」がマコト界全体の構造と呼応

**シーン構成：**

```
シーン1：解決直後の市場広場（3ステップ）
  背景：市場広場（夕方）
  キャラ：なの（left）、トイマル（right）
  
  1. トイマル「なの、すごかったのだ！ モリエルの嘘、全部見破ったのだ！」
  2. なの「……ねぇトイマル。あの人、最後に言ってたよね。『みんなが信じれば本物になる』って」
  3. トイマル「うん。……でもそれ、嘘なのだ？ なのが証明したのだ」

シーン2：消された看板（4ステップ）
  背景：流行通りの路地（夕暮れ）
  キャラ：なの（center）→ なの（left）、トイマル（right）
  
  4. （ナレーション）「帰り道。通りの端で、なのの目が古い看板に止まった。」
  5. なの「……この看板、何か塗りつぶされてる。うっすら……『真を問え』？」
  6. トイマル「……？ ボク、その言葉、知らないのだ」
  7. なの「（……『問うな、信じよ』の世界に、『真を問え』って書いてあった。誰が書いたんだろう）」

シーン3：次への導線（3ステップ）
  背景：コトハの街・夕暮れの石畳通り
  キャラ：なの（left）、トイマル（right）
  
  8.  トイマル「なの！ 大変なのだ！ 闘技場で……人が死んだらしいのだ！」
  9.  なの「闘技場……？」
  10. トイマル「すごく強い戦士が関わってるらしいのだ。……なの、怖いのだ……」
```

**onComplete:** `{ "type": "navigate", "path": "/play" }`

**必要な画像：**
- 背景：`/images/events/market_evening.webp`（市場広場の夕方バージョン）
- 背景：`/images/events/street_evening.webp`（流行通りの夕暮れ）
- キャラ：既存のなの・トイマル画像で対応可能

---

#### `after_case_002.json`：ケース2後日談

**設定コンテキスト：**
- case_002 はイバルド（寡黙で威圧的な闘技場の戦士）による殴打殺人
- 縦軸第0層：「闘技場の壁に古い碑文『力なき言葉にも——』（途中で削られている）」
- トイマルがなのに「怖くないのだ？」と聞くシーン
- イバルドの崩壊時に「強い奴が正しい」の論理が崩れる

**シーン構成：**

```
シーン1：闘技場の外（3ステップ）
  背景：闘技場の外壁（夜）
  キャラ：なの（left）、トイマル（right）
  
  1. トイマル「な、なの……怖くなかったのだ？ イバルド、すごく怖かったのだ……」
  2. なの「怖かったよ。でも、怖いからって黙ったら——ハカール先生と同じことが繰り返される」
  3. トイマル「……なの、カッコいいのだ」

シーン2：壁の碑文（4ステップ）
  背景：闘技場の壁（碑文のクローズアップ的な背景）
  キャラ：なの（left）、トイマル（right）
  
  4. （ナレーション）「闘技場の壁に、削られた碑文があった。」
  5. なの「『力なき言葉にも——』……続き、消されてるね」
  6. トイマル「……この字、古いのだ。誰かがわざと削ったように見えるのだ」
  7. なの「（また見つけた。誰かが『問う』ことに関する言葉を消している……）」

シーン3：次への導線（3ステップ）
  背景：コトハの街・夜の石畳通り
  キャラ：なの（left）、トイマル（right）
  
  8.  （ナレーション）「数日後——街で不穏な噂が広がり始めた。」
  9.  トイマル「なの、聞いたのだ？ 職人街で怖い事件があったらしいのだ」
  10. なの「職人街……鍛冶工房のあたりだっけ」
```

**onComplete:** `{ "type": "navigate", "path": "/play" }`

**必要な画像：**
- 背景：`/images/events/arena_exterior_night.webp`（闘技場外壁・夜）
- 背景：`/images/events/arena_wall_inscription.webp`（碑文のある壁）
- 背景：`/images/events/street_night.webp`（夜の石畳通り）
- キャラ：既存画像で対応可能

---

#### `after_case_003.json`：ケース3後日談

**設定コンテキスト：**
- case_003 はオヒレーナによる噂を使った殺人
- 縦軸第1層：「古い書庫の奥に『問いの書』という封印された本。中身は空白だが、ページの端に消されかけた文字『問え。考えよ。自らの——』」
- なのが気づく：「質問するだけで周りが凍りつく。これは普通じゃない」

**シーン構成：**

```
シーン1：事件解決後の職人街（3ステップ）
  背景：職人街の夕暮れ
  キャラ：なの（left）、トイマル（right）
  
  1. なの「……ねぇトイマル。あたしが質問するたびに、周りの人が凍りつくの、気づいてる？」
  2. トイマル「え？ ……そう言われれば、みんなビックリした顔するのだ」
  3. なの「ビックリじゃなくて……怖がってるんだよ。『質問する』こと自体を」

シーン2：書庫の発見（5ステップ）
  背景：古い書庫の内部（薄暗い、蝋燭の灯り）
  キャラ：なの（left）、トイマル（right）
  
  4. （ナレーション）「事件の調べの途中で見つけた、古い書庫の奥の部屋——」
  5. なの「この本……『問いの書』？ 封印されてる」
  6. トイマル「なの、それ、触っちゃダメなのだ！ 禁書なのだ！」
  7. なの「中身……ほとんど空白。でもページの端に——『問え。考えよ。自らの——』」
  8. トイマル「……ボク、この文字……知ってる気がするのだ。でも思い出せないのだ」

シーン3：次への導線（3ステップ）
  背景：コトハの街・夜
  キャラ：なの（left）、トイマル（right）
  
  9.  なの「（この世界には『問うこと』を封じた何かがある。看板も、碑文も、この本も——全部消されてる）」
  10. トイマル「なの……。今度は酒場で事件が起きたらしいのだ。有名な歌姫が関わってるって」
  11. なの「歌姫……。行こう、トイマル」
```

**onComplete:** `{ "type": "navigate", "path": "/play" }`

**必要な画像：**
- 背景：`/images/events/craftsmen_district_evening.webp`（職人街の夕暮れ）
- 背景：`/images/events/old_library_interior.webp`（古い書庫内部）
- キャラ：既存画像で対応可能

---

#### `after_case_004.json`：ケース4後日談

**設定コンテキスト：**
- case_004 はカブリーナ（仮面の歌姫）による絞殺事件
- トイマルの転機：「見た目で信じちゃダメ」「涙を流しているから正しいとは限らない」を体験
- 縦軸第1層：酒場の地下に古い楽譜「問いの歌」。聴き役族の古い紋章
- 第1→2層への橋渡し：「マコトの誓い」の公式説明への伏線

**シーン構成：**

```
シーン1：酒場の外（4ステップ）
  背景：酒場「月夜の唄」の外・夜
  キャラ：なの（left）、トイマル（right）
  
  1. トイマル「……なの」
  2. なの「ん？」
  3. トイマル「ボク……カブリーナのこと、完全に信じちゃったのだ。泣いてて、きれいで、かわいそうだったから。……でもそれは、理由にならないんだよね？」
  4. なの「ならない。事実を見なきゃ。……でもトイマル、気づけたじゃん。それが大事なんだよ」

シーン2：楽譜の記憶（4ステップ）
  背景：酒場の地下室（薄暗い倉庫）
  キャラ：トイマル（center）→ なの（left）、トイマル（right）
  
  5. （ナレーション）「事件の後、地下室で見つけた古い楽譜のことが、トイマルの頭から離れなかった。」
  6. トイマル「あの楽譜……『問いの歌』。ボク、あの旋律、知ってる気がするのだ。ずっと昔に聴いたような……」
  7. なの「楽譜の端に変な記号があったよね。トイマルの耳の模様に似てた」
  8. トイマル「……ボクの種族と関係があるのだ？ でも……思い出せないのだ」

シーン3：疑問の蓄積（3ステップ）
  背景：コトハの街・明け方の通り
  キャラ：なの（left）、トイマル（right）
  
  9.  なの「（消された看板、削られた碑文、封印された本、消された歌詞——全部つながってる気がする。この世界で『問うこと』を消したのは、一体誰？）」
  10. トイマル「なの、マコト堂の長老さまが、ボクたちに話があるって言ってたのだ」
  11. なの「マコト堂の長老……。いよいよ、この世界の秘密に近づいてるのかもね」
```

**onComplete:** `{ "type": "navigate", "path": "/play" }`

**必要な画像：**
- 背景：`/images/events/tavern_exterior_night.webp`（酒場の外・夜）
- 背景：`/images/events/tavern_cellar.webp`（酒場の地下室）
- 背景：`/images/events/street_dawn.webp`（明け方の街）
- キャラ：既存画像で対応可能

---

### 2-4. イベントJSON作成時の共通ルール

1. **既存の prologue.json のフォーマットに従う**（scenes配列、character/character2、speaker、text、effect）
2. **onComplete は全て `{ "type": "navigate", "path": "/play" }`**（ハブ画面に戻る）
3. **画像は既存キャラ画像（nano, toimaru）を使い回す**。新規キャラ画像は不要
4. **背景画像はAI画像生成で新規作成**する。`docs/design_skills.md` のイベント背景の生成ルールに従う
5. **1イベントあたり10〜11ステップ（台詞数）以内**。長すぎない
6. **縦軸ストーリーの手がかりは必ず含める**が、説明しすぎない。プレイヤーが後で「あれはそういう意味だったのか」と気づくレベル

### 2-5. 画像生成の必要リスト

| 背景画像ファイル名 | 使用イベント | プロンプトキーワード |
|------------------|-----------|-----------------|
| `market_evening.webp` | after_case_001 | medieval fantasy market square at sunset, warm orange light, half-timber buildings, empty stalls closing for the day |
| `street_evening.webp` | after_case_001 | fantasy cobblestone street at dusk, old painted-over signboard on wall, half-timber buildings, lantern light |
| `arena_exterior_night.webp` | after_case_002 | medieval fantasy arena colosseum exterior at night, stone walls, torch light, imposing architecture |
| `arena_wall_inscription.webp` | after_case_002 | close-up of ancient stone wall with partially chiseled inscription, fantasy medieval, torchlight, mysterious |
| `street_night.webp` | after_case_002 | fantasy medieval cobblestone street at night, moonlight, half-timber buildings, quiet atmosphere |
| `craftsmen_district_evening.webp` | after_case_003 | medieval fantasy craftsmen district at evening, forge glow, workshops, cobblestone |
| `old_library_interior.webp` | after_case_003 | ancient dark library interior, candlelight, dusty bookshelves, sealed books, medieval fantasy |
| `tavern_exterior_night.webp` | after_case_004 | medieval fantasy tavern exterior at night, hanging sign, warm light from windows, cobblestone street |
| `tavern_cellar.webp` | after_case_004 | dark medieval cellar storage room, barrels, dusty shelves, single candle, old sheet music on table |
| `street_dawn.webp` | after_case_004 | fantasy medieval street at dawn, first light, quiet, half-timber buildings, hopeful atmosphere |

すべてのプロンプトに共通で追加：
```
anime style, fantasy game illustration, vertical 9:16 aspect ratio, 
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana
```

---

## Part 3：実装手順（優先順）

### Phase 1：ハブ画面の基盤

1. **`data/story-flow.json` を作成**
2. **`/api/story-flow` API を新規作成**
3. **`/play/page.tsx` をハブ画面に改修**
   - story-flow API からデータ取得
   - イベントカード＋ケースカードを縦並びで表示
   - ロック判定ロジック（localStorage参照）
   - 既読/未読バッジ表示
4. **プロローグ未視聴時のリダイレクト処理を削除**
5. **result 画面に `case_{caseId}_cleared` のセット処理を追加**

### Phase 2：ケースカードのビジュアル化

6. **ケースカードに犯人画像＋背景を組み込む**
   - Image コンポーネントで背景を表示（暗めオーバーレイ）
   - 犯人キャラ画像を右寄せで重ねる
   - タイトル・難易度・あらすじを左下に配置

### Phase 3：ケース間ストーリーイベント

7. **背景画像をAI生成**（`docs/design_skills.md` のルールに従う）
8. **4つのイベントJSONを作成**
   - `data/events/after_case_001.json`
   - `data/events/after_case_002.json`
   - `data/events/after_case_003.json`
   - `data/events/after_case_004.json`
9. **`data/story-flow.json` にイベントを登録**

### Phase 4：仕上げ

10. **next.config.ts の outputFileTracingIncludes に `/api/story-flow` を追加**
11. **設定画面の「はじめから」機能を更新**：全ての `event_*_seen` と `case_*_cleared` をクリアしてハブ画面に戻す
12. **既存の PROLOGUE_SEEN_KEY 依存箇所を全て洗い出して更新**
    - `src/app/(game)/play/page.tsx` のリダイレクト削除
    - `src/app/(game)/event/[eventId]/page.tsx` の PROLOGUE_SEEN_KEY 処理を汎用化
13. **動作確認**
    - 初回起動→ハブ画面→プロローグ選択→完了→ハブに戻る→case_001アンロック
    - case_001クリア→ハブに戻る→after_case_001アンロック
    - 全フロー通しでのロック/アンロック確認

---

## Part 4：技術的注意事項

### localStorage のキー一覧（新旧対照）

| 旧キー | 新キー | 備考 |
|--------|--------|------|
| `event_prologue_b_seen` | `event_prologue_seen` | プロローグ完了。旧キーも互換のため読み取り対象にする |
| （なし） | `event_after_case_001_seen` | イベント完了 |
| （なし） | `event_after_case_002_seen` | 同上 |
| （なし） | `event_after_case_003_seen` | 同上 |
| （なし） | `event_after_case_004_seen` | 同上 |
| （なし） | `case_case_001_cleared` | ケースクリア |
| （なし） | `case_case_002_cleared` | 同上 |
| （なし） | `case_case_003_cleared` | 同上 |
| （なし） | `case_case_004_cleared` | 同上 |

### イベントの追加容易性

新しいイベントを追加する手順：
1. `data/events/{eventId}.json` を作成
2. `data/story-flow.json` の `items` 配列に追加
3. 必要な画像をAI生成して配置

**コード変更は不要。** これが既存のイベントシステムの設計思想（JSONだけでイベントを定義）を維持する。

### ハブ画面のスクロール

ストーリーアイテムが増えるとスクロールが必要になる。
- 未プレイの最新アイテムに**自動スクロール**する（初回表示時）
- スクロールバーは非表示にし、通常のタッチスクロールで操作

### サンプルシナリオの扱い

サンプルシナリオ（`case_sample_*`）はストーリーフローとは独立。
- ハブ画面の最下部に折りたたみセクションとして残す
- ロック/アンロックの対象外
- 既存のテキストリンク形式のまま