# 完了できる goal の書き方 — 時間と範囲を区切り、機械で終わりを判定する

調査日: 2026-11-14 / 作業時間の枠: 約 45 分
目的との関係: 汎用ハーネスを評価済みで公開する。とくに憲章 §目的の追記（オーナー 2026-11-14: 新しいハーネスを半日で設計・半日でテスト、採点器はハーネスの文面に依らない）に効く。成果物 2.1・3.1・4
読んだ既存文書: `docs/planning/00-goal-charter.md`、`00-owner-statements.md` 末尾、`35-charter-status-2026-11-13.md`、`research-process-evidence-evaluation.md` §結論と問い 4 の表（615〜630 行）

根拠水準: [一次] = 一次資料を自分で開いて該当箇所を読んだ / [二次] = 二次資料、または一次資料の存在だけ確かめた / [推論] = 自分の推論

## 要点

1. 時間を固定し、範囲を変える。期限内に出せなければ、延長せず止めて問題を立て直す（Shape Up の appetite と circuit breaker）[一次]。Scrum も 1 か月以下の固定長で、範囲は途中で交渉し直せる [一次]
2. 完了は「状態」で書く。Scrum の Definition of Done は増分の状態の定義で、満たさないものは出せない [一次]。OKR の Key Result は「測れて検証できる」もので、達成か未達かの 2 つしかない [一次]
3. `/goal` の判定役は会話しか読まない。道具を呼ばず、ファイルも開かない [一次]。だから goal はそれ自体で完結させ、終わりの判定は「エージェントが会話に出した検査コマンドの出力」で行う。今の goal（憲章のパスだけ）は判定できず、毎ターン「未達」を返し続ける形だった [一次・推論]
4. 評価の仕組みは既製品でかなり賄える。`claude plugin eval` は、ケース + 採点器 + プラグインなしの基線（Δ）+ しきい値で exit 1 + 費用の上限 + CI を最初から持つ。採点器 6 種のうち `regex`・`tool_used`・`tool_order`・`file_exists` は transcript とファイルから計算し、費用ゼロ [一次]。pit-wall を作り込むより、これに乗せるほうが「半日でテスト」に近い [推論]
5. 採点器をハーネスから切り離す先例は確立している。SOPBench は手順をデータ（action graph、And / Or / Chain）で持ち、元のコードを規則ベースの判定器に使う [一次・既存調査]。agentevals は軌跡の一致を strict / unordered / subset / superset で汎用に照合する [一次]。仕様から課題を作る研究（POLARIS、LogiSafetyGen）はあるが、2026 年の研究段階で、道具として使える形ではない [一次・要旨]
6. 長く走るエージェントは「一度に多くをやりすぎる」「途中で完了と言う」で失敗する。対策は機能の一覧（最初は全部 failing）、1 度に 1 機能、進捗ファイル、テストを消さない [一次]

## 問い 1: 時間と範囲を区切った完了できる目標

| 慣行 | 規則（原文） | エージェントへの移し方 [推論] | 水準 |
|---|---|---|---|
| Shape Up appetite | 「Appetites start with a number and end with a design.」見積もりではなく、使いたい時間を先に決める | 部品ごとに時間の上限を先に書く。設計はその中に収める | [一次] https://basecamp.com/shapeup/1.2-chapter-03 |
| Shape Up 固定時間・可変範囲 | 「fixed time, variable scope」。「When you have a deadline, all of a sudden you have to make decisions.」範囲を削って枠内で終える（scope hammering） | 枠を越えそうなら、範囲を削って出す。品質を上げるために枠を伸ばさない | [一次] 同上 |
| Shape Up circuit breaker | 「Cancel projects that don't ship in one cycle by default instead of extending them by default.」「the circuit breaker pushes us to reframe the problem.」 | 枠を越えたら延長せず止め、報告して問題を立て直す | [一次] https://basecamp.com/shapeup/2.2-chapter-08 |
| Scrum Sprint | 「fixed length events of one month or less」「The Sprint Goal is the single objective」「Scope may be clarified and renegotiated」 | 1 つの目的、固定の長さ。範囲は交渉できるが、目的は変えない | [一次] https://scrumguides.org/scrum-guide.html |
| Scrum DoD | 「a formal description of the state of the Increment」「If a Product Backlog item does not meet the Definition of Done, it cannot be released.」 | 完了は状態（ファイル・コマンドの結果）で書く。活動の量で書かない | [一次] 同上 |
| OKR | KR は「specific, time-bound」「measurable and verifiable」。達成か未達かで灰色はない | 終わりの条件は二値で、機械で判定できるものにする | [一次] https://www.whatmatters.com/faqs/okr-meaning-definition-example |
| 目標設定理論（Locke & Latham 2002） | 具体的で難しい目標は「最善を尽くせ」より成績を上げる。「最善を尽くせ」には外の基準がない | 「完璧に」「厳密に」ではなく、数えられる終わりを書く | [二次] 本文は開けなかった（PDF が画像）。存在の確認: https://psycnet.apa.org/record/2002-15790-003 |

範囲の膨張と作り込み（gold-plating）をどう防ぐか: Shape Up は時間を先に決めて設計を後にし、枠を越えたら既定で打ち切る。Scrum は目的を 1 つに絞り、DoD を満たしたものだけを出す。どちらも「もっと良くする」は枠の中でしか許さない [一次・推論]。

## 問い 2: エージェント・ハーネスを CI で継続評価する慣行

| 出典 | 規則 | 水準 |
|---|---|---|
| Anthropic「Demystifying evals for AI agents」（2026-01-09） | 「20-50 simple tasks drawn from real failures is a great start.」「choosing deterministic graders where possible, LLM graders where necessary」。LLM 判定は人の専門家と校正する。回帰の評価は 100% 近くを保つ。CI で「running on each agent change and model upgrade」 | [一次] https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents |
| Claude Code `claude plugin eval` | ケース = 現実的なプロンプト + 採点器。各ケース既定 3 回。プラグインなしの基線で Δ を出す。`--threshold` 未満で exit 1、`--max-cost-usd` で上限、CI では `--json`・`--trust-plugin`・モデルの固定。`regex`・`tool_used`・`tool_order`・`file_exists` は費用ゼロ、`llm`・`baseline` は判定モデルを呼ぶ。Bash を許すと OS の sandbox で動き、ネイティブ Windows には sandbox が無いので WSL2 で回す | [一次] https://code.claude.com/docs/en/plugin-evals.md |
| Inspect AI（UK AISI） | 評価 = Dataset + Solver + Scorer。Claude Code などの外部エージェントも回せる。Docker などの sandbox | [一次] https://inspect.aisi.org.uk/ |
| promptfoo | 「Fail the build when quality thresholds aren't met」。合格率 95% 未満で落とす例 | [一次] https://www.promptfoo.dev/docs/integrations/ci-cd/ |
| Hamel Husain「Your AI Product Needs Evals」（2024-03-29） | Level 1（単体テスト・アサーション）は安いので「on every code change」。「Keep it simple. Don't buy fancy LLM tools.」LLM 判定は人と合わせる | [一次] https://hamel.dev/blog/posts/evals/ |

最小の変更ごとの回帰評価の形 [推論、上の出典の合成]:
- 実際の失敗から作った固定のケース 20〜50 件
- 決定的な採点器を先に（道具を呼んだか・順序・ファイルの有無・正規表現）。LLM 判定は短い出力にだけ使う
- ハーネスなしの基線と並べて Δ を出す
- モデルを固定し、しきい値と費用の上限で CI を落とす
- 結果の JSON を残し、前回と比べる

食い違う点: オーナーは「人の校正を入れない」（11-04）。Anthropic と Hamel は LLM 判定を人と校正せよと言う。→ 決定的な採点器だけで主の判定を組み、LLM 判定は補助にとどめれば、この食い違いを避けられる [推論]。

## 問い 3: 被験エージェントから独立した採点器と、仕様からの課題づくり

| 先例 | 何が独立しているか | 成熟度 | 水準 |
|---|---|---|---|
| SOPBench | 手順を action graph のデータで持ち、元のコードを規則ベースの判定器に使う。And（任意順）/ Or（代替経路）/ Chain（厳密順） | 論文 + 公開リポジトリ。ベンチマークとして使われている | [一次・既存調査] https://arxiv.org/html/2503.08669v2 |
| ST-WebAgentBench | 方針を守ったときだけ完了と数える（CuP）。照合器は決定的（`is_sequence_match` は非連続も可） | 同上 | [一次・既存調査] https://arxiv.org/html/2410.06703v2 |
| τ²-bench | 方針と DB 状態で採点し、action matching は必要な呼び出しの存在だけを見る。課題は「atomic components」から合成する生成器で作る | 同上 | [一次] https://arxiv.org/abs/2506.07982 、採点の詳細は既存調査 §2-3 |
| agentevals（LangChain） | 参照の軌跡との一致を strict / unordered / subset / superset、引数は exact / ignore / subset / superset で照合。規則ベース | 使えるライブラリ | [一次] https://github.com/langchain-ai/agentevals |
| POLARIS（arXiv 2605.24883） | 自然文の方針を一階述語論理に変換し、方針のグラフから試験の問いを作る。規則と試験の対応を追える | 研究段階（安全性の問い向け。工程の評価ではない） | [一次・要旨] https://huggingface.co/papers/2605.24883.md |
| LogiSafetyGen（arXiv 2601.08196） | 規則を線形時相論理の判定器に変換し、fuzzing で軌跡を作る。課題 240 件は人が確かめた | 研究段階（道具の呼び出しの安全性向け） | [一次・要旨] https://arxiv.org/abs/2601.08196 |

足りないもの [推論]:
- 役割の手順の仕様から、エージェントの工程の課題を自動で作る既製の道具は見つからなかった。POLARIS と LogiSafetyGen は安全性の規則が対象で、しかも LogiSafetyGen は人の確認を使う
- 一方、「手順はデータ、照合器は汎用」の形は確立している。pit-crew で作るべきは、ロールの手順を And / Or / Chain のデータで書く書式と、それを `claude plugin eval` のケース（`tool_used`・`tool_order`・`file_exists`）に変換する小さな台本である。ハーネスの文面を読む採点器は作らない

## 問い 4: エージェントの作業の規律と止め方

| 出典 | 規則 | 水準 |
|---|---|---|
| Anthropic「Effective harnesses for long-running agents」（2025-11-26） | 機能の一覧を最初に書き、全部「failing」から始める。`passes` の欄だけを変える。「It is unacceptable to remove or edit tests」。「work on only one feature at a time」。進捗ファイルを書く。git に commit する。失敗の型は「tended to try to do too much at once」と、途中で「declare the job done」 | [一次] https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| Anthropic「Building effective agents」（2024-12-19） | 「stopping conditions (such as a maximum number of iterations)」。「finding the simplest solution possible」「only increasing complexity when needed」。各段で環境から「ground truth」を得る | [一次] https://www.anthropic.com/engineering/building-effective-agents |
| Claude Code `/goal` | session 限りの prompt 型 Stop hook。各ターンの後、小さく速いモデルが会話だけを見て判定する。道具を呼ばず、ファイルも開かない。勧め: 測れる終わりの状態 1 つ、確かめ方（例「`npm test` exits 0」）、変えてはいけない制約、時間・ターンの句（例「or stop after 20 turns」）。上限 4,000 字。判定は met / not yet met / impossible。impossible なら goal は消え、理由が残る | [一次] https://code.claude.com/docs/en/goal |

止め方の規則 [推論]: 終わりの条件を 1 本の検査コマンドの PASS/FAIL に落とし、毎ターン会話に出す。時間の句を入れる。「この枠では出せない」と分かった時点で、範囲を削るか、限界を書いて出すか、impossible として報告する。

## A. 提案する /goal の文（12 行）

```
/goal 2026-11-21 23:59 JST までに、新しいロールのハーネスを半日で設計・半日でテストできる「ハーネスキット」を出す。
完了 = `node scripts/kit-check.mjs` を実行し、その出力が会話に出ていて、次の 6 項目すべてが PASS:
(1) templates/role-spec に手順をデータで書く書式（And/Or/Chain）と記入例がある
(2) 汎用の採点器が手順のデータと transcript だけを読み、ハーネスの文面を読まない（import と読むファイルの検査で確かめる）
(3) 手順のデータから `claude plugin eval` のケースを作る台本があり、新しいロールで 1 回動いた
(4) CI が kit の自己テスト（採点器の通る場合と落ちる場合）を回して緑
(5) 既存のロールのうち、オーナーが決めた分がキットに載り、ハーネスなしの基線との Δ が 1 回出ている
(6) docs/kit-guide.md に「半日で設計・半日でテスト」の手順と、測れなかったことの一覧がある。
範囲外: 採点器の妥当性の追加研究、統計の作り直し、過去の結果の導き直し、EXP-48 の続き、新しいロールの追加、公開の push。
部品ごとの時間の上限: (1)(2) 各 1 日、(3)(4) 各 1 日、(5) 2 日、(6) 半日。上限を越えそうなら、範囲を削るか、限界を (6) に書いて出す。作り込みはしない。
測り方の問題が見つかったら、直さずに限界として (6) に書いて進む。直すべきだと思っても、オーナーに聞くまで手を付けない。
毎ターン、経過日数と kit-check の出力を会話に出す。期限を過ぎたか、条件が満たせないと分かったら、未達の項目と理由を書いて止まる（impossible）。
優先順: キット (1)〜(4) → 既存のロールの移行 (5) → 文書 (6)。公開は次の goal。
```

注: `/goal` の判定役は会話しか読まない [一次]。そのため完了は「kit-check の出力が会話に出ていること」で判定させ、ファイルのパスだけを指す書き方はしない。`scripts/kit-check.mjs` は (1)〜(6) を 1 行ずつ PASS/FAIL で出す台本で、キットの最初の作業として作る [推論]。

## B. 各句の根拠

| 句 | 規則 | 出典 | 水準 |
|---|---|---|---|
| 期限 1 週間（11-21） | 時間を先に決める。固定長は 1 か月以下 | Shape Up ch.3・ch.8 / Scrum Guide | [一次] |
| 期限 1 週間の長さ | 1 週間を超えるものは古くなる | オーナー 2026-11-14（依頼文に記載） | オーナーの発言 |
| 完了 = 1 本の検査コマンドの PASS | 測れる終わりの状態 1 つと確かめ方を書く。判定役は会話しか読まない | Claude Code `/goal` | [一次] |
| 6 項目すべて PASS（二値） | DoD は状態の定義。KR は測れて検証でき、達成か未達か | Scrum Guide / whatmatters | [一次] |
| (1) 手順をデータで書く | 手順を action graph で持ち、And / Or / Chain で順序を表す | SOPBench（既存調査 問い 4） | [一次・既存調査] |
| (2) 採点器はハーネスの文面を読まない | 手順はデータ、照合器は汎用。採点器は文面に結び付けない | SOPBench・agentevals / オーナー 2026-11-14 | [一次] / オーナー |
| (3) `claude plugin eval` のケースを作る | ケース + 決定的な採点器（費用ゼロ）+ 基線 + しきい値 + CI | plugin-evals | [一次] |
| (4) 自己テストで通る場合と落ちる場合 | 検査は両方向で確かめる | 憲章 §規律 | 憲章 |
| (4) CI で回す | 変更ごとに CI で回す。Level 1 は毎回 | Demystifying evals / Hamel | [一次] |
| (5) 基線との Δ | プラグインなしの基線と比べて寄与を出す | plugin-evals | [一次] |
| (5) は 1 回だけ | 実際の失敗から 20〜50 件で始める。小さく始める | Demystifying evals | [一次] |
| (6) 測れなかったことの一覧 | 枠を越えたら延長せず問題を立て直す | Shape Up circuit breaker | [一次] |
| 範囲外の一覧 | 目的は 1 つ。範囲は削って枠に収める（scope hammering） | Scrum Guide / Shape Up | [一次] |
| 部品ごとの上限 | appetite は部品の設計より先 | Shape Up ch.3 | [一次] |
| 作り込みをしない | 最も簡単な解を探し、必要なときだけ複雑にする | Building effective agents | [一次] |
| 測り方の問題は限界として書く | 回帰の評価と能力の評価を分ける。完璧な採点を待たない | Demystifying evals / [推論] | [一次]・[推論] |
| 毎ターン経過と kit-check を出す | 判定役は会話しか読まない。時間の句は毎ターン報告させる | Claude Code `/goal` | [一次] |
| 期限・不可能なら止まる | 止める条件を入れる。impossible の判定がある | Building effective agents / `/goal` | [一次] |
| 1 度に 1 部品の優先順 | 1 度に 1 機能、一度に多くをやりすぎない | Effective harnesses | [一次] |
| 公開は次の goal | 目的を 1 つにする | Scrum Guide | [一次] |

## C. オーナーが決めること

1. 時間の枠の長さ
   - (a) 1 週間（推奨。11-21 まで。オーナーの「1 週間を超えると古くなる」に合う）
   - (b) 3 日（キット (1)〜(4) だけ。移行は次の枠）
   - (c) 2 週間（Scrum の範囲内。ただし発言と食い違う）
2. この回で載せる既存のロール（(5) の範囲）
   - (a) Dev だけ（推奨。手順の定義と実際の失敗が最も揃っている）
   - (b) Dev と QM
   - (c) Dev・QM・fix の 3 つ（上限 2 日では足りない見込み [推論]）
3. 公開の基準（次の goal の完了条件）
   - (a) kit-check が CI で緑 + 秘密情報の検査 0 件 + オーナー承認（推奨）
   - (b) (a) に加え、第三者の環境（GitHub Actions）で 1 ロールの評価を再現
   - (c) (b) に加え、2 ロール以上で基線との Δ を記載

## D. この goal が直近 2 週間の失敗をどう止めるか

| 失敗 | 止める句 |
|---|---|
| 評価の厳密さの作り込み（採点器の妥当性・統計・導き直し）に流れた | 範囲外の一覧 / 「測り方の問題は直さず限界として書く」 |
| 採点器がハーネスの文面に結び付いていた | (2) 採点器は手順のデータと transcript だけを読む。import と読むファイルを kit-check で検査 |
| 範囲に時間の上限も止める規則もなかった | 期限 11-21 / 部品ごとの上限 / 期限を過ぎたら止まる |
| 進捗を活動の量で測っていた | 完了 = kit-check の 6 項目の PASS。ファイルとコマンドの結果だけで判定 |
| ハーネスと再利用できるテストの仕組みを出さなかった | 優先順の先頭がキット (1)〜(4)。新しいロールで 1 回動くことを (3) で要求 |
| 既製の道具を見ずに pit-wall を作り込んだ | (3) `claude plugin eval` のケースを作る（費用ゼロの決定的採点器・基線・CI が既にある） |
| goal が憲章のファイルのパスだけ → 判定役が読めない → Stop hook が毎ターン作業を求め続けた | goal 自体に完了の条件を書く / 完了の判定は会話に出した kit-check の出力 / 毎ターン出力を出す / impossible で止まる道 |

## 残る懸念 [推論]

- `claude plugin eval` で Bash を許すと sandbox が要り、ネイティブ Windows では動かない。評価は WSL2 で回す（憲章の WSL の Docker 方針と合う）
- 決定的な採点器で見られるのは「道具を呼んだか・順序・ファイル」まで。根拠の質は見られない。これは (6) の限界の一覧に書く
- Locke & Latham の本文は開けていない。B 表の根拠には使っていない
