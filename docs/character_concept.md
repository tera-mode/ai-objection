# 全ケース キャラクター画像生成設計書

**対象**: case_001 〜 case_008（全8ケース・犯人＋被害者 計16名）
**画風**: 逆転裁判風（太い黒縁・セルシェーディング・フラットな鮮やかな色使い）
**フレーミング**: 上半身のみ（`UPPER BODY ONLY tightly framed from head to chest NO legs NO feet`）
**生成サイズ**: 1024×1024（正方形・aspectRatio `"1:1"`）
**背景**: 白背景で生成→背景除去（Stability AI `remove_background`）

---

## 共通プロンプトテンプレート

```
Anime cel-shaded character portrait, Ace Attorney visual novel style, Japanese comic exaggeration,
bold black outlines, flat vibrant colors,
UPPER BODY ONLY tightly framed from head to chest NO legs NO feet,
[CHARACTER_BASE_DESCRIPTION],
EMOTION: [EMOTION_DESCRIPTION],
plain white background (for background removal),
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
1024x1024, clean illustration
```

### 感情バリアント（犯人5種）

| emotion | コヒーレンス帯 | 表情ガイド |
|---------|--------------|-----------|
| `normal` | 80〜100 | 自信ある表情。キャラの「表の顔」が最も出る |
| `nervous` | 55〜79 | 目線が泳ぐ、額に汗、引きつった笑い |
| `cornered` | 30〜54 | 目が見開く、口元が歪む、青ざめる |
| `breaking` | 10〜29 | 崩れた表情、歯を食いしばる、髪が乱れる |
| `collapsed` | 0〜9 | ギャップの「裏の顔」が完全に露出する |

### 被害者（イベントモード用・1〜2種）

被害者は尋問には登場しないが、イベント演出（事件前回想・intro画像等）で使う可能性がある。
最低限 `normal` の1枚を用意。

---

## case_001「流行通りの色水」——バズ＝真実

### 犯人：モリエル（女）

**名前の由来**: 「盛る（話を盛る）」＋エルフ風語尾

**「そのまんま」な部分**: キラキラのインフルエンサー。派手な服装、大きなアクセサリー、つねに笑顔。街で一番おしゃれで、みんなの憧れ。

**ギャップ**: 自分の部屋は恐ろしく質素。装飾品は全て「商品サンプル」で私物はほぼない。食事は毎日同じ安いパンとスープ。「流行」を売る人間が、自分自身は何一つ「好き」を持っていない空虚さ。崩壊時に「ウチが好きなもの？ ……考えたこと、なかった」。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world young woman age 24, slender and stylish, bright energetic appearance,
large sparkling green eyes with long eyelashes, wavy platinum pink hair in a high side ponytail with decorative ribbons,
wearing an extravagant layered outfit: puffy-sleeved blouse with gold embroidery,
a colorful patchwork vest covered in small pins and brooches (her product samples),
multiple bangles and charm bracelets on both wrists,
a large star-shaped earring on one ear,
rosy cheeks with visible blush
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | dazzling confident smile, one hand raised in an excited gesture, eyes sparkling with enthusiasm, radiating infectious energy |
| `nervous` | smile slightly frozen, eyes darting, one hand fidgeting with bracelets, still trying to maintain sparkly persona but cracks showing |
| `cornered` | smile completely gone, eyes wide, hands gripping her own vest, mascara starting to run from nervous sweat, looking exposed |
| `breaking` | talking rapidly with wild hand gestures, hair coming loose from ponytail, accessories jangling, desperate energy replacing confident energy |
| `collapsed` | completely still and quiet, arms hanging at sides, all sparkle drained from eyes leaving them empty, looking plain and small without her persona, a hollow shell |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髪 | プラチナピンク |
| 目 | スパークリンググリーン |
| ブラウス | 白＋金の刺繍 |
| ベスト | カラフルなパッチワーク（赤・青・黄・紫） |
| アクセサリー | ゴールド |

---

### 被害者：メキーラ（女）

**名前の由来**: 「目利き」＋女性名語尾

**外見**: 40代。地味で実直な印象。髪は黒で短く切り揃えたボブ。化粧っ気なし。品質検査人の制服（ダークグレーのエプロン付きローブ、胸に虫眼鏡のエンブレム）。手に小さなルーペを常備。

```
Fantasy world woman age 40, plain and practical appearance, no-nonsense expression,
short neat black bob haircut, no makeup, sharp observant dark eyes,
wearing dark grey inspector robe with magnifying glass emblem on chest,
leather apron with many small pockets for tools,
holding a small brass loupe in one hand
```

---

## case_002「闘技場の不正」——強い奴＝正しい

### 犯人：イバルド（男）

**名前の由来**: 「威張る」＋ファンタジー男性名（-ルド）

**「そのまんま」な部分**: 闘技場の無敗チャンピオン。筋骨隆々。威圧的。声がデカい。いかにも「強い悪役」。

**ギャップ**: 実は繊細な手芸が趣味。控え室のロッカーの中に、自分で編んだ小さな人形が隠してある。不器用な指で一針一針縫った雑な出来。「強くなければ生きていけない」と幼少期に叩き込まれた男が、唯一「強さ」と無関係な時間を持っている。崩壊時に人形がポケットから落ちる。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world male age 30, extremely muscular heavyweight build, tall and imposing,
square jaw, small fierce eyes with thick eyebrows, short-cropped blond hair buzzcut style,
visible battle scars on arms and one across nose bridge,
wearing sleeveless leather gladiator vest with metal shoulder guards,
thick leather wrist guards, a champion belt with a large ornate buckle,
skin is tanned and weathered
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | confident intimidating smirk, arms crossed over chest, chin raised looking down at viewer, radiating dominance and superiority |
| `nervous` | forced confident grin but sweat drops visible on forehead, one hand unconsciously touching champion belt, eyes slightly narrower |
| `cornered` | teeth gritted, veins visible on neck, fists clenched and shaking, eyes wide with anger and panic mixed |
| `breaking` | face contorted in rage, hair disheveled, one fist raised threateningly, mouth open yelling, losing composure completely |
| `collapsed` | hunched shoulders making him look smaller, eyes downcast and hollow, hand unconsciously reaching into vest pocket (for hidden doll), all intimidation gone revealing a tired broken man |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 肌 | 日焼けした褐色 |
| 髪 | 短い金髪 |
| ベスト | ダークブラウンの革 |
| 肩当て | 鈍い銀の金属 |
| チャンピオンベルト | ゴールド |

---

### 被害者：ハカール（女）

**名前の由来**: 「秤（はかる）」＋「ール」

**外見**: 60代。小柄で細身だが背筋がピンと伸びている。白髪を後ろで一本に束ねたポニーテール。鋭い目つきだが、口元には笑い皺。闘技場の審判服（黒と白のストライプのローブ、胸に天秤のエンブレム）。首から銀のホイッスルを下げている。

```
Fantasy world elderly woman age 65, small and thin but perfectly straight posture,
sharp intelligent eyes behind round spectacles, white hair in a tight low ponytail,
wearing black and white striped referee robe with silver scales-of-justice emblem on chest,
silver whistle hanging from neck chain,
expression stern but with smile lines around mouth
```

---

## case_003「伝言ギルドの噂」——友達の噂話

### 犯人：オヒレーナ（女）

**名前の由来**: 「尾鰭をつける」＋女性名語尾（-ナ）

**「そのまんま」な部分**: 親しげで世話焼きな「姉御」タイプ。いつもニコニコ。「ここだけの話」が口癖。情報通で、街の誰もが頼りにする。

**ギャップ**: 日記帳を持っている。中身は街の全住人の「弱み」リスト。整然と分類された冷徹な情報管理。「善意の世話焼き」の裏にある、情報で人を支配する計算高さ。崩壊時に日記帳が開き、そこにびっしりと書かれた文字を見て周囲が凍りつく。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world woman age 35, warm and approachable appearance, slightly plump and curvy build,
round friendly face with dimples, warm brown eyes that seem to invite trust,
auburn hair in a messy bun held together with a quill pen stuck through it,
wearing a messenger's outfit: olive green cloak over a cream-colored tunic,
a leather satchel bag overflowing with scrolls and letters slung across body,
a small brass bell attached to the satchel strap
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | warm motherly smile, one hand cupped near mouth as if whispering a secret, leaning slightly forward conspiratorially, eyes twinkling with mischief |
| `nervous` | smile becoming strained, hand clutching satchel strap tightly, eyes flicking sideways as if looking for escape routes, still trying to appear friendly |
| `cornered` | forced laugh frozen on face, both hands gripping satchel protectively (hiding the diary inside), sweat visible, dimples gone |
| `breaking` | pointing finger accusingly at viewer, face flushed red, mouth open in rapid speech, hair falling out of bun, quill pen falling |
| `collapsed` | hugging satchel to chest like a shield, eyes wide and desperate, looking around frantically for someone to agree with her, utterly alone expression |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髪 | オーバーン（赤茶） |
| 目 | ウォームブラウン |
| マント | オリーブグリーン |
| チュニック | クリーム |
| サッチェルバッグ | キャメルの革 |

---

### 被害者：ウラトス（男）

**名前の由来**: 「裏取り」＋ギリシャ風（-トス）

**外見**: 50代。痩せ型で神経質な印象。深い皺。銀縁の角型眼鏡。伝言ギルドの検閲官制服（紺のジャケット、胸に赤い封蝋印のエンブレム）。いつもインク染みのある指。

```
Fantasy world man age 55, thin and wiry build, serious meticulous expression,
deep wrinkles on forehead, silver-rimmed rectangular spectacles,
neat grey hair combed back precisely, ink-stained fingers,
wearing navy blue guild inspector jacket with red wax seal emblem,
a stamp and seal hanging from belt
```

---

## case_004「月夜の唄の歌姫」——推しの表裏

### 犯人：カブリーナ（女）

**名前の由来**: 「猫を被る」＋イタリア女性名風（-ナ）

**「そのまんま」な部分**: 街一番の美しい歌姫。艶やかな黒髪、切れ長の目、白い肌。ドレス姿で舞台に立つ姿は圧巻。みんなの「推し」。

**ギャップ**: 楽屋では完全に別人。髪をぐしゃぐしゃにまとめ、だぼだぼの作業着を着て、床に座って薬草をすり潰している。祖母から受け継いだ薬草師としての「本当の自分」。歌姫の姿が「仮面」で、薬草師が「素顔」。崩壊時に美しい姿勢が崩れ、地べたに座る楽な姿勢に戻る——「……こっちがあたしよ」。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world woman age 28, strikingly beautiful and elegant,
long flowing jet-black hair cascading over one shoulder,
narrow almond-shaped violet eyes with long lashes, porcelain white skin, beauty mark under left eye,
wearing a deep crimson off-shoulder evening dress with black lace trim,
a choker necklace with a small moonstone pendant,
slender fingers with dark nail polish
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | serene beautiful smile, one hand delicately placed on chest, head slightly tilted, eyes glistening with gentle tears (performative sadness), the perfect image of a tragic beauty |
| `nervous` | maintaining composure but hand on choker tightening slightly, smile flickering, a barely perceptible tension in jaw |
| `cornered` | beautiful mask cracking, one eye twitching, fingers digging into her own arm, trying to force tears but they wont come |
| `breaking` | tears stopped completely, eyes suddenly sharp and calculating, hair falling messily across face, the actress dropping the act momentarily before catching herself |
| `collapsed` | completely transformed: slouched posture, hair pushed back carelessly with one hand, cold flat stare, all beauty still there but warmth completely gone, a stranger wearing a familiar face |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髪 | 漆黒 |
| 目 | バイオレット |
| ドレス | ディープクリムゾン |
| レーストリム | 黒 |
| チョーカー | 黒＋ムーンストーン（乳白色） |
| ネイル | ダークパープル |

---

### 被害者：カネモス（男）

**名前の由来**: 「金を守る」＋「-モス」

**外見**: 55歳。太った裕福な商人。赤ら顔。金の指輪を複数。高価そうな毛皮の襟付きコート。にこにこしているが目が笑っていない。

```
Fantasy world man age 55, overweight wealthy merchant, ruddy flushed face,
small greedy eyes, thin mustache, double chin,
wearing expensive dark green coat with fur collar,
multiple gold rings on thick fingers, gold chain necklace,
smiling but eyes not matching the smile
```

---

## case_005「市民裁定広場の多数決」——多数派＝正解

### 犯人：シュガロン（男）

**名前の由来**: 「衆が（みんなが）」＋「-ロン」

**「そのまんま」な部分**: 政治家そのもの。整えた髪。歯が白い。握手が上手い。誰にでも笑顔を向ける。名前を覚えるのが得意。完璧な「みんなの代表」。

**ギャップ**: 一人になると完全に無表情になる。鏡の前で「笑顔の練習」をしている。人の名前は暗記カードで覚えている。「みんなのため」と言いながら、「みんな」に対して何の感情も持っていない空っぽさ。崩壊時に笑顔が凍りついたまま外れなくなり、泣いているのに笑顔のままという恐怖の表情。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world man age 45, tall and well-groomed, classic politician appearance,
perfectly styled swept-back silver-streaked dark hair, unnaturally white teeth,
warm-looking hazel eyes (practiced warmth), clean-shaven strong jawline,
wearing a pristine navy blue ceremonial robe with white fur-trimmed collar,
a golden brooch shaped like clasped hands (symbol of unity) on chest,
always one hand extended as if ready to shake hands
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | perfect practiced politician smile, one hand open in welcoming gesture, head nodding slightly as if agreeing with everything, trustworthy facade |
| `nervous` | smile still perfect but eyes have gone slightly blank, hand gestures becoming repetitive and mechanical, like a puppet |
| `cornered` | smile frozen and rigid, cannot drop it, eyes starting to show panic behind the fixed grin, hands gripping podium-like gesture |
| `breaking` | smile cracking asymmetrically, one half of face smiling while other half contorts in rage, grotesque half-mask expression, completely unsettling |
| `collapsed` | crying but still smiling, tears streaming down face while mouth remains locked in grin, the most disturbing expression — he literally cannot stop performing |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髪 | ダークブラウン＋シルバーの筋 |
| 目 | ヘーゼル |
| ローブ | ネイビーブルー |
| 毛皮の襟 | 白 |
| ブローチ | ゴールド |
| 歯 | 不自然に白い |

---

### 被害者：イロンダ（女）

**名前の由来**: 「異論」＋女性名語尾（-ダ）

**外見**: 45歳。がっしりした体格の女性鍛冶師。日焼けした肌。ショートカットの赤毛。そばかすだらけ。作業着の袖をまくっていて、腕には火傷の跡。強い意志を感じる目。

```
Fantasy world woman age 45, stocky muscular build of a blacksmith,
deeply tanned and freckled skin, short cropped fiery red hair,
strong determined eyes, burn scars on forearms,
wearing leather blacksmith apron over simple work tunic,
sleeves rolled up, soot smudges on face and hands
```

---

## case_006「格付け塔の星」——数字＝絶対

### 犯人：カクスター（女）

**名前の由来**: 「格」＋「スター（星）」

**「そのまんま」な部分**: 冷徹で知的。眼鏡。常に手元の格付け帳を持ち、数字を読み上げる。感情を見せない。完璧に管理された外見。一分の隙もない。

**ギャップ**: 格付け帳の最後のページだけ、数字ではなく花の押し花が挟んである。幼い頃に亡くなった妹がくれた野の花。「数字では測れないもの」を実は知っている——だからこそ、数字で全てを測る世界に固執した。崩壊時に格付け帳を落とし、押し花が舞い散る。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world woman age 38, tall and impeccably composed, cold intellectual beauty,
sharp angular face with high cheekbones, narrow ice-blue eyes behind thin silver-framed glasses,
platinum blonde hair in a severe tight bun with not a single strand out of place,
wearing a high-collared charcoal grey uniform jacket with silver star-shaped rank pins (five stars) on collar,
always holding an open leather-bound ledger book in one hand,
a silver fountain pen tucked behind one ear
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | cold composed expression, looking down at viewer over glasses, one eyebrow slightly raised in judgment, pen poised over ledger as if scoring |
| `nervous` | pushing glasses up with trembling finger, eyes darting to ledger for reassurance, lips pressed tightly together, composure cracking at edges |
| `cornered` | glasses slightly askew, grip on ledger tightening making knuckles white, eyes wide behind lenses, mathematical certainty crumbling |
| `breaking` | frantically flipping through ledger pages, hair coming loose from bun in wisps, muttering numbers, eyes unfocused and panicked |
| `collapsed` | ledger dropped or clutched to chest, glasses removed revealing vulnerable tired eyes underneath, hair half-fallen from bun, looking suddenly much older and fragile, a dried flower petal caught in her hair |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髪 | プラチナブロンド |
| 目 | アイスブルー |
| 眼鏡 | シルバーフレーム |
| ジャケット | チャコールグレー |
| 星ピン | シルバー |
| 格付け帳 | ダークブラウンの革 |

---

### 被害者：ボクール（男）

**名前の由来**: 「朴（素朴）」＋「-ール」

**外見**: 60代。穏やかな老人。白いもじゃもじゃの髭と眉毛。丸い鼻。大きなごつい手（木工職人の手）。木屑がついた作業着。優しい目。

```
Fantasy world elderly man age 65, gentle appearance, round nose,
bushy white beard and eyebrows, kind crinkled eyes,
large rough hands of a woodworker with calluses,
wearing simple brown work clothes dusted with wood shavings,
a small hand-carved wooden bird visible in breast pocket
```

---

## case_007「マコト堂の恩師」——先生＝正しい

### 犯人：ジオーネ（男）

**名前の由来**: 「慈恩」のイタリア風変換

**「そのまんま」な部分**: 理想の先生。穏やかな声。温かい笑顔。生徒を包み込むような包容力。「マコト堂のお父さん」。誰もが信頼する。大柄だが威圧感はなく、むしろ安心感を与える体格。

**ギャップ**: 右手の薬指に古い傷跡がある。若い頃、自分も「なんで？」と問いかけた時期があった。そのとき上層部に呼び出され、指を切られた（「問う指を折る」という旧い罰則）。以来、「問わないことが生きること」と学び、「優しさ」で問いを封じる側に回った。崩壊時に右手を隠す——「……この傷を見せたら、君も問うのをやめるかな？」

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world man age 52, tall and broad-shouldered but gentle and non-threatening,
warm round face with deep laugh lines, kind dark brown eyes that seem to embrace,
short chestnut brown hair with grey streaks neatly combed, a well-trimmed short beard also greying,
wearing cream-colored teacher robe of Makoto Church with gold trim and a book-shaped brooch,
a pair of reading glasses pushed up on forehead,
right hand always partially hidden in robe sleeve or behind back (hiding a scar on ring finger)
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | warm fatherly smile, hands clasped gently in front, head tilted with caring expression, the picture of a kind trustworthy teacher |
| `nervous` | smile unchanged but right hand moving behind back, eyes maintaining warmth but a micro-tension in forehead, still perfectly composed |
| `cornered` | smile still present but eyes have gone cold — warmth drained while mouth stays curved, an uncanny valley effect, right hand now visibly hidden in sleeve |
| `breaking` | the exact same kind expression but tears rolling down cheeks — not sad tears but frustrated ones, the mask cannot be removed because it has fused with his face |
| `collapsed` | finally the smile drops revealing exhaustion and old pain, right hand raised revealing scarred ring finger, eyes hollow but somehow relieved, decades of performance ending |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髪・髭 | チェスナットブラウン＋グレーの筋 |
| 目 | ダークブラウン |
| ローブ | クリーム＋金のトリム |
| ブローチ | ゴールドの本型 |
| 老眼鏡 | ゴールドフレーム |

---

### 被害者：トイーダ（男）

**名前の由来**: 「問いだ（問いを発する者）」

**外見**: 35歳。痩せ型。目の下にクマ（夜遅くまで研究している）。髪はボサボサの黒髪。マコト堂の教師服を着ているが、袖口がインク染みだらけ。穏やかだが、目の奥に静かな炎がある。

```
Fantasy world man age 35, thin and slightly disheveled intellectual appearance,
dark circles under eyes from late nights studying, messy unkempt black hair,
quiet but intense dark eyes with an inner fire,
wearing Makoto Church teacher robe (cream with gold trim) but sleeves ink-stained and rumpled,
always carrying a worn leather notebook
```

---

## case_008「大裁定官の書庫」——昔からそうだった

### 犯人：フルモーン（男）

**名前の由来**: 「古守（ふるもり）」＋「-ン」。「フル＝古い」＋「ムーン＝守る」の二重読み

**「そのまんま」な部分**: 白い長い髭。杖をついた老人。穏やかで博識。「昔からそうじゃ」が口癖。まさに「伝統の守護者」。

**ギャップ**: 書庫の奥の自分の部屋に、「問いの書」のオリジナルの写しを大切に保管している。改竄されたことを知っていて、しかも原本を守り続けてきた。「変えてはならない」と言いながら「変える前」を捨てられなかった矛盾。自分自身が「問う力」を最も恐れ、かつ最も敬っている人間。崩壊時に「……わしが守ってきたのは、秩序ではなく——嘘じゃった」。

#### 共通キャラクター設定（全5感情で使用）

```
Fantasy world elderly man age 80, frail and ancient but dignified,
long flowing white beard reaching mid-chest, deeply wrinkled kind face,
milky pale blue eyes that have seen everything, bushy white eyebrows,
bald head with a few wisps of white hair,
wearing a deep burgundy archivist robe with ancient gold embroidery depicting books and keys,
leaning on a gnarled wooden staff topped with an amber crystal,
a heavy iron key ring hanging from belt
```

#### 感情別

| emotion | EMOTION 記述 |
|---------|-------------|
| `normal` | serene wise old man expression, gentle half-smile, one hand resting on staff, eyes half-closed as if remembering something distant, grandfatherly warmth |
| `nervous` | eyes opening wider, hand gripping staff tighter, slight stiffness in posture, the gentleness becoming guarded |
| `cornered` | jaw set firm, eyes sharp and suddenly very alert despite age, free hand reaching protectively toward key ring, ancient authority radiating |
| `breaking` | trembling, staff shaking, eyes glistening with unshed tears, face contorting between anger and grief, decades of suppressed emotion surfacing |
| `collapsed` | staff dropped, shoulders sagging under invisible weight, tears flowing freely into white beard, eyes looking upward as if apologizing to someone no longer alive, profound sorrow and relief mixed |

#### カラーパレット
| 部位 | 色 |
|------|-----|
| 髭・眉 | 白 |
| 目 | 淡いペールブルー（老人の薄い色） |
| ローブ | ディープバーガンディ＋金の刺繍 |
| 杖 | ダークブラウンの木＋琥珀のクリスタル |
| 鍵束 | 鉄の黒 |

---

### 被害者：カイゲーナ（女）

**名前の由来**: 「開眼（真実に目覚める）」＋女性名語尾（-ナ）

**外見**: 25歳。若い女性の古文書研究者。知的だが活発な印象。セミロングの栗色の髪を無造作にまとめている。丸眼鏡。インクの染みた指。マコト堂の研究者ローブを着ているが、あちこちに古文書の紙片をメモ代わりに挟んでいる。なのと年齢は離れているが、「問う力」を持つ同志として共鳴する存在。

```
Fantasy world young woman age 25, energetic intellectual appearance,
bright curious amber eyes behind round wire-rimmed glasses,
medium-length chestnut hair messily tied up with a pencil stuck through the bun,
ink-stained fingers, rosy cheeks from excitement,
wearing Makoto Church researcher robe (lighter cream color) with countless paper scraps and bookmarks sticking out of every pocket and fold,
a magnifying glass on a chain around neck
```

---

## 全キャラ カラーパレット一覧

| ケース | 犯人 | メインカラー | 被害者 | メインカラー |
|--------|------|-------------|--------|-------------|
| 1 | モリエル | プラチナピンク＋カラフル | メキーラ | ダークグレー＋黒 |
| 2 | イバルド | ダークブラウン革＋ゴールド | ハカール | 白黒ストライプ＋シルバー |
| 3 | オヒレーナ | オリーブグリーン＋クリーム | ウラトス | ネイビー＋赤封蝋 |
| 4 | カブリーナ | クリムゾン＋黒レース | カネモス | ダークグリーン＋ゴールド |
| 5 | シュガロン | ネイビー＋白毛皮＋ゴールド | イロンダ | ブラウン革＋赤毛 |
| 6 | カクスター | チャコールグレー＋シルバー | ボクール | ブラウン作業着＋白髭 |
| 7 | ジオーネ | クリーム＋ゴールド | トイーダ | クリーム（汚れ）＋黒髪 |
| 8 | フルモーン | バーガンディ＋ゴールド刺繍 | カイゲーナ | ライトクリーム＋栗色 |

全キャラのメインカラーが被らないように配色。ケース内で犯人と被害者のコントラストが出るよう設計。

---

## ギャップ設計一覧

| ケース | 犯人 | 「そのまんま」 | ギャップ | 崩壊時に露出するもの |
|--------|------|---------------|---------|-------------------|
| 1 | モリエル | キラキラインフルエンサー | 自分自身の「好き」が何もない空虚 | 全ての輝きが消えた空の目 |
| 2 | イバルド | 筋肉ムキムキの暴力チャンピオン | 繊細な手芸趣味。手作り人形 | ポケットから落ちる人形 |
| 3 | オヒレーナ | 世話焼きの姉御 | 全住人の弱みリスト日記帳 | 日記帳のびっしりの文字 |
| 4 | カブリーナ | 美しく儚い歌姫 | 地べたに座る薬草師の素顔 | 崩れた姿勢と冷たい目 |
| 5 | シュガロン | 完璧な笑顔の政治家 | 感情がない空っぽ。笑顔は練習の産物 | 泣きながら笑う凍った顔 |
| 6 | カクスター | 冷徹な数字の権化 | 妹の押し花を帳簿に挟んでいる | 舞い散る押し花 |
| 7 | ジオーネ | 温かい理想の先生 | 自身も「問い」を封じられた被害者 | 右手の指の傷跡 |
| 8 | フルモーン | 伝統の守護者の老人 | 改竄前の原本を密かに守ってきた | 「守ったのは嘘だった」の告白 |

---

## 性別一覧

| ケース | 犯人 | 性別 | 被害者 | 性別 |
|--------|------|------|--------|------|
| 1 | モリエル | 女 | メキーラ | 女 |
| 2 | イバルド | 男 | ハカール | 女 |
| 3 | オヒレーナ | 女 | ウラトス | 男 |
| 4 | カブリーナ | 女 | カネモス | 男 |
| 5 | シュガロン | 男 | イロンダ | 女 |
| 6 | カクスター | 女 | ボクール | 男 |
| 7 | ジオーネ | 男 | トイーダ | 男 |
| 8 | フルモーン | 男 | カイゲーナ | 女 |

**女性8 / 男性8（50%）**