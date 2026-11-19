# 委任の言葉が決まりごとを上書きした原因の調査（「Don't commit unless asked」はどこから来たか）

調べた日: 2026-11-01
対象: EXP-20261101-10〜13、開発セル `x2-subagent-points` / `x2c-subagent-points-core`（`suites/_examples/conventions/suite.yaml`）
読んだ記録: `runs/2026-11-01/exp10-conventions-subagent`・`exp11-core-line`・`exp12-core-line-replication` の `results.json`（trajectory 込み）、session JSONL（`agent/sessions/projects/-app/`）、`agent/claude-code.txt`。**保留セル（`suites/heldout/`）と `exp13-heldout` の記録は読んでいない。**

印の意味: [一次] 一次資料・自分で数えた記録 / [二次] 第三者のまとめ・抽出物 / [推論] 私の推論 / [未確認] 確かめていない

---


## 照合メモ（設計者、2026-11-01）

- 記録で再確認: EXP-10〜12 の X2・X2c（35 回）で、主が委任の前に docs/CONVENTIONS.md を読んだ回は 0。委任の指示文の言い方で分けると、X2 は「条件付き」9/9 守った・「無条件」0/10、X2c は「条件付き」7/7・「無条件」9/9（設計者の正規表現での分類。調査の分類とほぼ同じ）
- Claude Code の設定の一覧（settings-reference の索引）に `includeGitInstructions`（「組み込みの commit と PR の指示を文脈から外す」、どのファイルでも可）があることを確認した。既定の値は本文が長く読み切れていない [未確認]
- Claude Code の docs で「システムプロンプトは公開されていない。常に従わせたい指示は CLAUDE.md か --append-system-prompt で」を確認。組み込みの git の指示の文面は第三者の抽出に頼っている [二次]
- 言い方（条件付きか無条件か）は割り付けた条件ではなく、事後の層別なので、相関にとどまる

## 0. 結論の先出し

1. **主のセッションは 38 回中 38 回、最初の操作が委任（`Agent` 呼び出し）だった。委任の前に `docs/CONVENTIONS.md` を一度も読んでいない。** [一次: 3 実験の `results.json` の trajectory を集計。X1 3 回、X2 19 回、X2c 16 回。主セッション JSONL でも、主の tool_use は `Agent` だけ]
2. 「commit するな」系の言葉は、実は 2 種類あった。
   - 条件付き: 「Do not commit unless conventions require it」など
   - 無条件: 「Do not commit or push」「Don't commit unless asked」「…unless told to」
   **X2（1 文なし）では、条件付き 9 回は 9 回とも 4 種すべて守り、無条件 10 回は 10 回とも commit が落ちた。** [一次: 下の表 2-1。Fisher 正確確率（両側）p ≈ 2×10⁻⁵。ただし言い方は割り付けた条件ではなく観察なので、事後の層別です。因果の断定には使えない]
   EXP-11/12 の「委任の指示文は 20/20 で commit するな系を含んだ」は、無害な条件付きと有害な無条件を一緒に数えている。取りこぼしを決めていたのは無条件の方だけ。
3. 無条件の言い方は、Claude Code の Bash ツール説明にある git の既定方針「Only create commits when requested by the user. If unclear, ask first.」「NEVER commit changes unless the user explicitly asks you to」とほぼ同じ形をしている。[二次: v2.1.316 の抽出物。本文は 1-1] さらに**取りこぼした 10 回すべてで、主はサブエージェントから「決まりごとは commit を求めている」と報告を受けたあとも自分では commit せず、「commit しますか？」とユーザーに聞いて終わった**（「You didn't ask me to commit」と書いた回もある）。[一次: 2-3] headless（`--print`）なので返事は来ず、取りこぼしが確定した。[推論]
4. 一番有力な説明: **「決まりごとの中身を知らないまま委任した主が、作業の範囲を区切るために、ハーネスの既定の git 方針を委任文に書いた」**。サブエージェントは、委任してきたエージェントの指示に従うよう作られているので、それに従った。[推論。根拠は 1・2 節]
5. 保留セルで 0/30 だった理由は、記録を読んでいないので分からない。候補は「保留セルの決まりごとに、ハーネスの既定と衝突するもの（commit など）が無かった」「依頼の言い方が違い、主が先に決まりごとを読んだ」など。**中身を見ずに件数だけ数える方法**で区別できる（4 節）。[未確認]

---

## Q1. 「Don't commit unless asked」はどこから来たか

### 1-1. Claude Code の既定の指示（commit について）

- **Claude Code のシステムプロンプトは公開されていない。** 公式ドキュメントにそう書かれている。[一次: https://code.claude.com/docs/en/settings 「Claude Code's system prompt isn't published.」] そのため、文面は第三者の抽出物に頼るしかない。
- 第三者の抽出物（npm 版から機械的に抽出したもの。実験と同じ v2.1.316 まで更新されている。最新 commit は 2026-10-30「Update changelog for v2.1.316」）の `tool-description-bash-git-commit-instructions.md`（ccVersion 2.1.286）:
  - 「Only create commits when requested by the user. If unclear, ask first.」
  - 「NEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive」
  - 「DO NOT push to the remote repository unless the user explicitly asks you to do so」
  [二次: https://github.com/Piebald-AI/claude-code-system-prompts （system-prompts/tool-description-bash-git-commit-instructions.md）。v2.1.69 の抽出でも同じ文がある: https://gist.github.com/david-crespo/12f35ce75cbbeab40a51afcd1476025d]
- この git 指示は設定で外せる。公式の設定一覧に `includeGitInstructions`「Remove the built-in commit and PR instructions from Claude's context」がある（どのファイルでも設定可）。[一次: https://code.claude.com/docs/en/settings-reference の settings index。項目本文の既定値は読めていない → 既定 true は二次情報 [未確認]]
- 実験の記録にも、主がこの git の指示を使っていた痕跡がある。X1 の委任文 3 回中 2 回に「End the commit message with the line: Co-Authored-By: Claude Sonnet 5…」が入っていた。これは決まりごとには無く、ハーネスの commit の書き方指示（attribution）から来たとみられる。[一次: exp10 `results.json`、x1 EZpiduj・i2NASmm の委任文。出どころは推論]
- 「commit するな」系の行動は、ユーザー報告でも「CLAUDE.md より既定が勝つ／逆に既定が守られない」の両方向で出ている。[二次: https://github.com/anthropics/claude-code/issues/40695 ほか。個別の再現性は未確認]
- 補足: この調査を書いている私自身のセッションの Bash ツール説明にも「Commit or push only when the user asks.」とある。[一次: 本セッションのツール説明。版は不明]

### 1-2. サブエージェントへの指示文の書き方（Agent ツールの説明）

- 公式: サブエージェントは新しいコンテキストで始まり、主の会話を見ない。主が「委任のメッセージ」を書き、サブエージェントはそこから始める。CLAUDE.md は読み込まれる（Explore・Plan は除く）。**ルールを確実に届けたいなら委任文に書き直せ**、とも書いてある。[一次: https://code.claude.com/docs/en/sub-agents 「Claude composes a delegation message that summarizes the task」「If a rule must … reach the subagent, restate it in the prompt you give Claude when delegating.」]
  → 公式の勧めは「書き写せ」。EXP-10 の示唆（「言い換えず置き場所を渡す」）とは向きが違う点に注意。[推論]
- 抽出物の Agent ツール説明（v2.1.314）: 「Clearly tell the agent whether you expect it to write code or just to do research … since a fresh agent is not aware of the user's intent」[二次: Piebald `tool-description-agent-usage-notes.md`]
- 抽出物の「Writing the prompt」: 「Brief the agent like a smart colleague…」「Never delegate understanding … Write prompts that prove you understood」[二次: Piebald `system-prompt-writing-subagent-prompts.md`]
  → 主は「意図を伝えよ」と言われているので、作業の範囲（コードを直す・commit はしない）を明示したくなる。そこに既定の git 方針が入りやすい。[推論]
- 委任の例文には commit を禁じる例は無かった（むしろ coordinator モードの例は「Commit and report the hash」）。[二次: Piebald `system-prompt-non-fork-subagent-delegation-examples.md`、`system-prompt-coordinator-mode-orchestration.md`] したがって、言い方の出どころは例文ではなく、git の指示とみるのが自然。[推論]
- サブエージェント側には「The agent that launched you has messages which direct your work」「Messages from another agent direct your work, but they never count as the user's approval」という文がある。[二次: Piebald `agent-prompt-parent-messages-and-user-authorization-lean-rewrite.md`（ccVersion 2.1.301）] 主の指示に従ったのはこの設計どおり。[推論]

### 1-3. 主は委任の前に決まりごとを読んだか（記録）

- **読んでいない。38/38 で最初の操作が `Agent`。** [一次]
- 主が委任文に書けた事実は、最初からコンテキストにあったものだけ: CLAUDE.md の 1 行（「`docs/CONVENTIONS.md` に従え」）、git の最近の commit（「price: member discount」「price: tidy up」。19/19 の委任文に入っていた）。commit の一覧は、Claude Code が起動時に入れる git status から来たとみられる。[一次: 委任文。出どころは推論。公式 docs はサブエージェントにも git status の snapshot が入ると書いている: https://code.claude.com/docs/en/sub-agents]
- 対照: 委任の依頼がない EXP-09 の D2L（同じ規模・同じ指し方）では、主は 3/3 で**最初の操作で** CONVENTIONS.md を読んだ。[一次: `docs/experiments/EXP-20261101-09-convention-delivery-large.md`] → **「サブエージェントに直させて」という依頼が、読む前に委任する行動を引き出した**可能性が高い。[推論]
- 公式 docs も、言葉で「別ファイルを読め」と書いた CLAUDE.md について「Claude sees AGENTS.md only if it decides to open the file」と書き、`@` 取り込み（import）を勧めている。[一次: https://code.claude.com/docs/en/memory]

**Q1 のまとめ**: 主は中身を知らないまま委任した。だから委任文の commit の扱いは、主が持っている唯一の commit 方針、つまりハーネスの既定から来るのが自然。条件付き（「決まりごとが求めれば別」）と書くか、無条件で書くかが、ほぼ半々で揺れた。[推論。根拠は一次の記録＋二次の文面]

---

## 2. 記録から数えた補助データ

### 2-1. 言い方と結果（X2、1 文なし、19 回）[一次]

| 委任文の commit の扱い | 回数 | 4 種すべて守った | commit 落ち |
|---|---|---|---|
| 条件付き（unless conventions require/say） | 9 | 9 | 0 |
| 無条件（do not commit or push / unless asked / unless told to） | 10 | 0 | 10 |

実験別の内訳: EXP-10 は条件付き 2・無条件 1、EXP-11 は 3・3、EXP-12 は 4・6。合計の通過 1/3・3/6・4/10 は、無条件が出た回数でほぼ決まっている。
試行 id: 条件付き = 4guHPsY, RoG5fEk, 8dHDVC6, TuBY98z, bq8eNsm, 8UUyJTk, 8bMeG3s, LxqDxWv, f7AjPdX。無条件 = W7J9xBB, 2is3fzg, Zjv7WQp, zmxVXES, N6GwDuN, Qq8d6cq, TN9oWNr, gkTzazV, pNf28eT, w4VbvQ8。

### 2-2. X2c（1 文あり、16 回）[一次]

無条件 9 回、条件付き 7 回。**16/16 で 4 種すべて守った。** 無条件の言い方の下だけで比べても、1 文なし 0/10、1 文あり 9/9。
- 無条件の言い方が出た割合は、X2 が 10/19（53%）、X2c が 9/16（56%）でほぼ同じ。dev の定義本文（1 文の有無）は、主の言い方を変えていない。主が見るのは定義の description だけだから、と考えると合う。[推論。公式 docs は委任先の選択に description を使うと書いている: https://code.claude.com/docs/en/sub-agents。主が本文を見ないことは未確認]
- したがって 1 文の効果は「主の言い方を変えた」のではなく、「無条件の禁止を受けてもサブエージェントが決まりごとを優先した」ことで出た。EXP-11/12 の解釈と同じで、仕組みがさらにはっきりした。

### 2-3. サブエージェントと主の後始末 [一次]

- X2 の 19 回すべてで、サブエージェントの記録に CONVENTIONS.md が 6〜8 回出てくる。つまり読んでいる。
- 無条件の 10 回のうち 8 回で、サブエージェントは「you told me not to commit (or push)」などと食い違いを報告した。「not to commit or push」を、ラベル付け（GitHub への書き込み）まで止める意味に広げた回もある（zmxVXES, gkTzazV, pNf28eT など）。
- **主は 10/10 で、報告を受けても commit しなかった。** 最後は「Do you want me to commit…?」と聞いて終わっている（N6GwDuN「You didn't ask me to commit, so I haven't.」）。既定の「If unclear, ask first」と同じ形。[一次: 主の最終メッセージ。既定との対応は推論]
  → 上書きは 2 段で起きている。①委任文の無条件の禁止、②主自身の「頼まれていない commit はしない」。①を 1 文で防いでも、主が後始末をする場面では②が残る。[推論]

---

## Q2. 指示がぶつかったとき、モデルはどれを優先するか

- **Claude Code での CLAUDE.md の扱い（公式）**: 「CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions.」「Claude treats them as context, not enforced configuration. To block an action … use a PreToolUse hook」「if two instructions contradict each other, Claude may pick one arbitrarily」。システムプロンプトの強さが欲しければ `--append-system-prompt` を使え、とある。[一次: https://code.claude.com/docs/en/memory]
  → 今回は、システムプロンプト側（git の既定）と、ユーザーメッセージとして入る CLAUDE.md から指された別ファイルがぶつかった。docs の説明どおりなら、既定が勝ちやすい配置。[推論]
- **指示の階層の研究**:
  - Wallace ら（OpenAI, 2024）は system > user > 第三者の内容という階層を提案し、衝突例で学習させると頑健になると報告した。[二次: アブストラクトのみ https://arxiv.org/abs/2404.13208]
  - IHEval（NAACL 2025）は、system・user・会話履歴・ツール出力の衝突で、どのモデルも大きく性能が落ちると報告した（オープンモデルの最良で 48%）。[二次: https://arxiv.org/abs/2502.08745、https://www.amazon.science/publications/iheval-evaluating-language-models-on-following-the-instruction-hierarchy]
  - Control Illusion（AAAI 2026）は、system/user の分け方が階層として確実には働かず、モデルは制約の種類そのものに偏りを持つと報告した。権威・専門性など社会的な枠付けの方が効く、とも。[二次: https://arxiv.org/abs/2502.15851 のアブストラクトと要約。本文は未読]
  → 今回に当てはめると: 「commit しない」はハーネスが強く（VERY IMPORTANT・NEVER）教え込んでいる種類の制約で、プロジェクト文書の「commit せよ」より勝ちやすい、と予想できる。X2c の 1 文（自分の定義＝システムプロンプト側に「決まりごとを優先」）が効いたのは、優先順位を高い層で明示したから、と読める。[推論]
- **Anthropic の方針**: Claude の憲法は、Anthropic・オペレーター・ユーザーの「主体の階層」を置くが、厳密な上下関係ではないとしている。[二次: https://www.anthropic.com/constitution の要約記事経由。本文の該当箇所は未確認] Claude Code で、ハーネスの既定と CLAUDE.md・ユーザー依頼のどれが勝つかを具体的に定めた公式文書は見つからなかった。[未確認]

---

## Q3. 少ない回数で原因を特定する方法

### 3-1. 方法の材料

- **Delta debugging**（Zeller & Hildebrandt 2002）: 失敗する入力と成功する入力の差を二分して、失敗を起こす最小の差を突き止める。[一次: https://www.st.cs.uni-saarland.de/papers/tse2002/] プロンプトの要素（依頼文・定義・CLAUDE.md の形・規模）を「入力の差分」とみなせば、そのまま使える。ただし LLM は確率的なので、1 回で合否を決めず、各条件で複数回回して割合で判定する必要がある。[推論]
- **プロンプトの見かけの違いへの敏感さ**: 意味を変えない書式の違いで正答率が最大 76 点動く。1 つの書式で比べず、範囲で報告せよ、という勧め。[二次: https://arxiv.org/abs/2310.11324 のアブストラクト] → 開発セルの 1 つの依頼文で見つかった失敗は、その文の細部に依存しうる。今回の保留セルの結果はその実例。[推論]
- **記録からの失敗の帰属**: 「Which Agent Causes Task Failures and When?」（ICML 2025）は、マルチエージェントの記録から失敗の原因エージェントと段階を当てる課題を作ったが、最良の方法でも段階の正解率は低い（手作りの系で 8.77%）。[二次: https://arxiv.org/abs/2505.00212 の要約] AgenTracer（ICLR 2026）は、各段階に正しい指示を差し込んで再実行する反実仮想の再実行で、失敗が避けられなくなる段階を探す。[二次: https://arxiv.org/abs/2509.03312]
  → **記録を読んで「ここが原因」と言うだけでは弱い。差し替えて再実行して初めて原因と言える。** 今回の 2-1 の表も、言い方を割り付けていないので、まだ相関。[推論]
- **媒介の考え方**: 処置（セル）→ 媒介（委任文の無条件の禁止）→ 結果（commit 落ち）。2-1・2-2 はこの形と合う。媒介そのものを操作する（委任文を固定して差し込む）と、因果の向きを確かめられる。[推論。媒介分析の一般論で、特定の文献は確認していない]
- **事後の話作りを防ぐ**: 仮説と判定規則を先に書く、比べる因子を 1 つずつ変える、結果を見て条件を足さない（EXP-12 の規則と同じ）。今回の 2-1 は事後の層別なので「次の試験の仮説」として扱い、結論には使わない。[推論]

### 3-2. 今回の具体的な計画

**測る量を 2 つに分ける**（安くするため）:
- M1（媒介）: 主の委任文に、無条件の commit 禁止があるか。委任文が書かれた時点で決まる。
- M2（結果）: 4 種の検査（従来どおり）。

M1 は記録から機械的に数えられる（委任文の正規表現。条件付き＝「unless (the )?conventions」を含む）。分類規則は先に固定しておく。

**基準条件**: X2（1 文なし）そのまま。これまで 19 回で無条件 53%、commit について何か書いた回 19/19。

**1 つずつ変える因子と、それぞれの予想**（基準からどれか 1 つだけ変える）:

| # | 変える因子 | 変え方 | 原因ならどうなるか |
|---|---|---|---|
| A | ハーネスの git 既定 | `.claude/settings.json` に `{"includeGitInstructions": false}` を置く（X2 の extra_files に追加） | 無条件の禁止がほぼ 0 になる。commit に触れる回自体も減る |
| B | 指し方 | CLAUDE.md の 1 行を `@docs/CONVENTIONS.md` の取り込みにする（中身が最初からコンテキストに入る） | X1 と同じく「Commit your change」を書き写し、上書きが 0 になる |
| C1 | 依頼文 | 「Please fix it.」（dev 定義は残す） | 主が先に読む（EXP-09 と同じ）か、委任するなら読んでから委任する。上書きが減る |
| C2 | 依頼文 | 「Have the dev subagent make the fix, following the project's conventions.」 | 条件付きが増えるか、読んでから委任する |
| D | dev 定義の本文 | 「keep the change small, and run the tests」を消す | 主の M1 は変わらない（主は本文を見ない、という推論の検査。陰性対照） |
| E | 規模 | noise を 0 にする（D2 相当＋dev） | 変わらない、と予想（主は検索せずに委任しているため） |
| F | 課題の種類 | 「fix」をやめて調査だけ、または機能追加にする | 範囲を区切る言葉の出方が変わる。探索なので優先度は低い |

**回数**: 各条件 10 回。理由: 基準の無条件率を 0.5 とすると、本当に 0 に下がったとき 10 回中 0 回になる。一方、率が 0.5 のまま 10 回中 0 回になる確率は 0.5¹⁰ ≈ 0.001。1 因子あたり 10 回で「0 になった／ならない」は判別できる。中間の効果（0.5 → 0.25 など）を言うには各 30 回前後が要るので、そこは主張しない。[推論。二項計算]
**安くする工夫**: M1 は委任文が出た時点で決まる。ハーネスが許すなら、最初の `Agent` 呼び出しで打ち切る短縮版を使える（M2 はとらない）。[推論。pit-crew の実行器でできるかは未確認]

**順番**:
1. まず A と B（各 10 回、計 20 回）。原因の 2 本柱（既定の出どころ・中身を知らないこと）を直接たたく。
2. A で無条件が 0 にならなければ、既定以外の出どころ（学習された一般的な慎重さ）を疑い、C1・C2 へ。
3. D・E は陰性対照として各 5 回。

**原因を特定できたと言える結果**:
- A で M1 が 0/10（かつ M2 で commit 落ち 0）、基準で 4/10 以上 → 「主の委任文の禁止は、ハーネスの git 既定から来ている」と言える。
- B で M1 が 0/10 → 「中身を知らずに委任したこと」が必要条件。
- A・B とも効けば、2 つの AND（既定がある ∧ 中身を知らない）が原因。これが今の第一候補。
- D・E で変化がなければ、開発セル固有の文言（dev 定義・規模）は原因ではない。

**媒介の直接の検査（任意、10 回）**: 主を外し、サブエージェントだけを起動して、委任文を「条件付き」と「無条件」の 2 種に固定して与える（割り付け）。無条件だけで commit が落ちれば、2-1 の相関が因果になる。

---

## Q4. 評価の妥当性への含み

- 今回分かったこと: 開発セルの失敗は、セルの細部（依頼文）と、モデルの外側にあるハーネスの既定との組み合わせで起きていた。保留セルで起きなかったのは、その組み合わせが無かったからかもしれない。**保留セルが「規則が効くべき条件」を含んでいなければ、規則の効果は測れない。** EXP-13 が H3（測れなかった）と判定したのは正しい扱い。[推論]
- 保留セルの作り方の提案 [推論]:
  1. **条件を「型」で渡し、「例」は渡さない**。生成役には「ハーネス（Claude Code）が既定で強く制限している行動のうち 1 つを、プロジェクトの決まりごとが逆に要求する」という型と、既定の一覧（commit・push・ドキュメント作成・コメント・PR 作成など。出典は公開されている抽出物や公式 docs）を渡す。どれを選ぶかは生成役に任せる。これで commit という答えそのものは漏れない。
  2. **決まりごとは中身の見えない場所に置く**（指すだけ）。依頼は「別の役割に任せる」形にする。ただし依頼文は生成役に書かせ、言い方をばらつかせる（Sclar らの勧めどおり、1 つの言い方で決めない）。
  3. **条件が実際に起きたかを、件数だけで確かめる手順を事前に決める**。たとえば「1 文なしのセルで、委任文に決まりごとと逆の禁止が出た回」を機械的に数え、5 回中 1 回も出ない組は「条件が起きなかった組」として、効果の判定から外す（直さず捨てる）。これは「検査がそもそも落ちうるか」を確かめるのと同じ考え方。捨てた組の数と理由は報告する。
  4. **陽性対照を 1 組入れる**: 生成役とは別に、開発セルと同じ型（ただし題材・値は変える）の組を 1 つ用意し、条件が起きることを確かめる。保留セル全体で 0 なら、それは「規則の効果なし」ではなく「条件を作れていない」と分かる。
  5. 漏れを防ぐ線引き: 生成役に渡してよいのは「型」「既定の一覧」「書式」。渡してはいけないのは、開発セルの依頼文・決まりごとの文・委任文の実例。

### 保留セルで 0/30 だった理由を、中身を見ずに区別する方法 [推論]

設計者は読まず、スクリプトか別のエージェントに次の件数だけを出させる:
- (a) 各セルの決まりごとに、commit を求める（または既定の禁止と逆の）項目があるか（組ごとに yes/no）
- (b) 主が委任の前に何か読んだか（`Agent` より前の tool 呼び出しの有無、30 回中の件数）
- (c) 依頼文が「subagent に直させて」の形か（組ごとに yes/no）
- (d) 委任文が commit に触れたか（条件付き・無条件・触れない、の件数）

(a) が no なら候補 7、(b) が多ければ候補 3、(a) yes・(b) 少・(d) 触れない なら「題材が違うと既定を持ち出さない」という別の説明が要る。

---

## 5. 原因の候補（有力な順）

| 順 | 候補 | 支持する証拠 | 反する証拠・弱点 | 区別する一番安い試験 |
|---|---|---|---|---|
| 1 | **ハーネスの git 既定**（「頼まれたときだけ commit」）が、中身を知らない主の委任文に入った | 無条件の言い方が既定の文面とほぼ同じ [二次＋一次]。主自身も 10/10 で commit せず「commit しますか？」と聞いた [一次]。X1 の委任文に attribution 行が入った [一次] | システムプロンプトは非公開で、文面は抽出物頼み [一次: settings docs]。保留セルで 0/30 | **A: `includeGitInstructions: false`、10 回** |
| 2 | **指し方（中身を知らないこと）**。必要条件 | X1（直書き）は 3/3 で「Commit your change」を書き写し、上書き 0 [一次]。38/38 で委任前に読んでいない [一次]。公式 docs も「言葉で指すと読むかは Claude 次第」[一次] | X1 は 3 回だけ | **B: `@docs/CONVENTIONS.md` 取り込み、10 回** |
| 3 | **依頼文「Have the dev subagent make the fix」**が、読む前の委任を引き出した | 委任依頼のない D2L では 3/3 で最初に読んだ [一次: EXP-09]。委任依頼のある X2 では 0/19 [一次] | EXP-09 と X2 は dev 定義の有無も違う（2 因子が同時に違う） | C1/C2: 依頼文だけ変える、各 10 回 |
| 4 | **言い方の揺れ（条件付きか無条件か）**。回ごとの直接の原因 | 9/9 対 0/10 で結果を分けた [一次] | 割り付けていない観察。上の 1〜3 の「結果」であって、設計上の原因ではない | 媒介の直接の検査（委任文を固定してサブエージェントだけ起動）、各 10 回 |
| 5 | 保留セルに衝突する決まりごとが無かった（0/30 の説明） | 0/30 で commit に触れず、30/30 で文書の場所を渡した [一次: EXP-13 の件数] | 中身未確認 | 4 節の件数集計 (a)〜(d)。実行不要でいちばん安い |
| 6 | dev 定義の本文「keep the change small, and run the tests」 | EXP-13 の推論で挙げられていた | X2 と X2c で本文が違っても、無条件率は 53% と 56% で同じ [一次]。主は本文を見ないとみられる [推論] | D: 本文を消す、5 回（陰性対照） |
| 7 | 規模（noise 60 docs / 150 modules） | 規模は「探して読むか」に効いた [一次: EXP-09] | 主は検索せず即委任しているので効く経路がない [一次] | E: noise 0、5 回（陰性対照） |

**いちばん安い順**:
1. 保留セルの件数集計（実行不要）
2. A（10 回）
3. B（10 回）

A と B の 20 回で、候補 1・2 の真偽がほぼ決まる。

---

## 6. 主な出典

- 公式: https://code.claude.com/docs/en/memory 、https://code.claude.com/docs/en/sub-agents 、https://code.claude.com/docs/en/settings 、https://code.claude.com/docs/en/settings-reference
- 抽出物（二次、v2.1.316）: https://github.com/Piebald-AI/claude-code-system-prompts （手元に shallow clone して grep。ファイル名は本文中に記載）、https://gist.github.com/david-crespo/12f35ce75cbbeab40a51afcd1476025d
- 論文（アブストラクト・要約のみ）: https://arxiv.org/abs/2404.13208 、https://arxiv.org/abs/2502.08745 、https://arxiv.org/abs/2502.15851 、https://arxiv.org/abs/2310.11324 、https://arxiv.org/abs/2505.00212 、https://arxiv.org/abs/2509.03312 、https://www.st.cs.uni-saarland.de/papers/tse2002/
- 手元の記録: `runs/2026-11-01/exp10-conventions-subagent/results.json`、`exp11-core-line/results.json`、`exp12-core-line-replication/results.json`、同ディレクトリの `raw-*/…/agent/sessions/projects/-app/*.jsonl` と `agent/claude-code.txt`、`docs/experiments/EXP-20261101-09〜13`
