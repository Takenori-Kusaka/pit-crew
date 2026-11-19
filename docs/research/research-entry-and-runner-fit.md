# 入口（役割の振り分け）の測り方と、実行器（runner）の向き不向き — 調査

調査日: 2026-11-01 / 対象: `docs/planning/07-v1-and-cells.md` の入口・受け渡し・境界・移植の各セル / 前提として読んだもの: 07、`docs/log/2026-11-01.md` の末尾（preflight-entry-1: `claude --print` で先頭の `/qm` は Skill ツールの呼び出しではなく、スキル本文の会話への展開になった）、`research-reusable-role-harness.md` §Q2（単一スキルの発火テストの作法。ここでは繰り返さない）、`research-next-steps-small-n.md`（少数の実行での区間・止め方。ここでは繰り返さない）、`research-runners.md`、`research-u1-subscription-auth.md`

**索引（`docs/research/README.md`）への 1 行の追加はしていない**（この調査の作業範囲は本ファイルの作成だけ）。


## 照合メモ（設計者、2026-11-01）

- 「Harbor は実行のたびにスキルだけを写し、エージェント定義を写さない」を実記録で確認: `runs/2026-11-01/stage1-v0-1` のセッション記録の `agent_listing_delta` は組み込みの 5 つ（claude / Explore / general-purpose / Plan / statusline-setup）だけで、po-session などは無い。pit-wall の runner も `--skill` しか渡していない（`harbor.mjs`）
- Harbor v0.25.0 のコードに `trial/multi_step.py` と手順ごとの `min_reward`（`models/task/config.py`）があることを確認。claude-code エージェントは設定を `--settings` で渡す（`_REMOTE_SETTINGS_PATH`）。`{"agent": ...}` がその層で効くかは未確認のまま（preflight が要る）
- エージェント定義を持つ被験体は `subjects/ganbari-quest-v0` だけで、ほかの実行には影響しない

## 根拠水準の凡例

- [一次] 一次資料（公式ドキュメント、論文の要旨・本文、公式リポジトリのコード、インストール済みのコード、pit-crew の実行記録）を自分で開いて読んだ
- [二次] 検索結果の要約・解説記事による
- [推論] 筆者の推論
- [未確認] 確かめられなかった

---

## 要点（先に結論）

1. **N 個の役割から「正しい 1 つ」を選べたかは、二値の発火テストではなく「多クラスの分類」として採点するのが標準。** 各依頼に正解ラベル（役割名、または「どれでもない」）を付け、混同行列（どの役割と取り違えたか）を出す。Google の skill-reach は「競合する説明文があるなかで意図したスキルに振り分けられるか」を測り、取り違えの組（confusion pairs）を記録する [一次]。ツール選択の研究も同じ形（MetaTool「似た選択肢からの選択」、BFCL「2〜4 個の関数から 1 つ」「どれも呼ばない」）[一次]。
2. **似ている役割の取り違えを作るのは「近い相手」の依頼。** agentskills.io は「語や概念が重なるが別のことが要る依頼（ニアミス）」を最も価値ある否定例とし、skill-creator は「このスキルが別のスキルと競合し、勝つべき依頼」を含めよと書く [一次]。役割が複数あるときニアミスは「別の役割の正例」か「どれでもない」になるので、**否定例という区分は要らず、正解ラベルを付ければ済む** [推論]。
3. **規模の相場は「依頼 20 件 × 3 回」（約 60 回）。** agentskills.io・skill-creator ともに約 20 件・各 3 回・閾値 0.5・訓練 6 割 / 検証 4 割（層化、固定）・反復 5 回 [一次]。skill-reach は本番の評価で 5 回、簡易で 3 回、**最大 3 ターン**、**目的のスキルが呼ばれた時点で打ち切り**が既定 [一次]。
4. **いまの計画（15 件 × 2 回 = 30 回）は、件数は相場の下限に近いが、2 回では 1/2 の引き分けが出る・「どれでもない」の類がない・ニアミスが役割ごとに 1 件で混同の方向が偏る、の 3 点が弱い** [推論]。§Q2 で 20 件・2 回 + 割れた依頼だけ 3 回目、の改訂案を出す。
5. **Harbor v0.25.0 は「同じ環境で 2 つのセッションを順に走らせる」を正式に持っている（multi-step タスク）。** 環境（ファイル）は手順間で保たれ、各手順は既定で新しい会話、手順ごとに指示文・事前スクリプト（`setup.sh`）・`workdir`・採点器を持てる [一次: 公式文書とインストール済みコード]。受け渡し（b）・境界（c）・移植（d）は Harbor のままでよい [推論]。
6. **ただし Harbor の claude-code には `--agent` の指定がなく、手順ごとにエージェントの引数を変えられない。また、エージェント定義（`agents/`）はコンテナに入っていない。** Harbor の claude-code が写すのはスキルだけで [一次: コード]、**基準点 v0 の試走（`stage1-v0-1`）の全記録で、セッション開始時に使えるエージェントは組み込みの 5 つだけだった** [一次: 実行記録の init イベント]。ログの「エージェントも使われていない」は「使えなかった」が正しい。
7. **入口（a）は `claude plugin eval` の方が向く。** `tool_used: Skill` / `Agent` の採点器、`min: 0, max: 0` の「呼ばない」検査、`--runs`、並列、サブスク認証が公式に揃う [一次]。ただし実行ごとにプロジェクトの `.claude/` を読まない隔離があるので、役割はプラグインとして配る必要がある（v1 の配布形と一致）[一次]。2 つのセッションを順に走らせる仕組みはない [一次]。
8. **Inspect + inspect_swe はサブスク認証の制約で外れる。** サンドボックス内の Claude Code の API 呼び出しを Inspect のモデル提供元に中継する設計で [一次]、サブスクの資格情報を中継することは規約上認められない [一次: Claude Code の Legal 文書] [推論: 当てはめ]。
9. **役割に入ったかの検出は 4 種類あり、どれも記録の別の場所に出る。** Skill の `tool_use`（stream-json と session JSONL の両方）、`/role` の展開（**session JSONL にだけ出る。`--print` の stream-json の標準出力には出なかった** [一次: 実行記録]）、サブエージェント（`Agent` の `tool_use` と `subagents/agent-*.jsonl`）、`--agent`（起動ヘッダに `@<name>`。非対話の記録に出るかは [未確認]、preflight が要る）。
10. **推奨**: (b)(c)(d) は Harbor の multi-step で続ける。(a) は `claude plugin eval` に移す（pit-wall に既にある runner を使う）。Harbor の runner には「エージェント定義の配置」と「`--settings` による `agent` 指定」を足す。改訂した入口のセル: **E0（決定的な入口の操作確認）10 回 + E1（振り分け）20 件、v0 は 1 回ずつ・v1 は 2 回 + 割れた依頼だけ 3 回目、合計 約 60 回**。

---

## Q1. 複数の役割（スキル）が競合するときの振り分けの評価

### 1-1 一次資料が示す作法

**agentskills.io「Optimizing skill descriptions」**（単一スキル向け。§Q2 で既出の点は省く）[一次] https://agentskills.io/skill-creation/optimizing-descriptions

- ニアミスについて: "The most valuable negative test cases are **near-misses** — queries that share keywords or concepts with your skill but actually need something different." 無関係な依頼（"Write a fibonacci function"）は "tests nothing" [一次]
- 否定例で誤発火するときの直し方: "Add specificity about what the skill does *not* do, or clarify the boundary between this skill and adjacent capabilities." [一次] — 隣の役割との境界を説明文に書く、が公式の処方
- 早期打ち切り: "you can stop a run early once the outcome is clear — the agent either consulted the skill or started working without it." [一次]
- 反復で行き詰まったら「構造の違う説明文を試す」、5 回で足りることが多い、上達しないなら依頼文の方（易しすぎ・難しすぎ・ラベル誤り）を疑え [一次]
- 最終確認に「最適化に使っていない新しい依頼 5〜10 件」を使え [一次]

**Anthropic skill-creator**（https://github.com/anthropics/skills/tree/main/skills/skill-creator）

- SKILL.md: 依頼 20 件、should と should-not の混合。正例には「このスキルが別のスキルと競合し、勝つべき依頼」を含め、否定例は "genuinely tricky" なニアミスに。"Simple queries like 'read file X' are poor test cases" [一次: SKILL.md を WebFetch で要約、引用句は原文] https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md
- `run_eval.py`: `claude -p` を `--output-format stream-json --verbose --include-partial-messages` で走らせ、**最初に始まったツール呼び出しが `Skill` か `Read` 以外なら即「発火せず」と判定して打ち切る**。`Skill` / `Read` なら入力に対象名が含まれるかで判定。既定は 1 依頼 3 回（CLI）、閾値 0.5、1 回 30 秒、並列 10 [一次: コードの要約] https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/scripts/run_eval.py
  - 試す説明文は、毎回 uuid 付きの一時コマンドファイル（`.claude/commands/<名前>-skill-<uuid>.md`）として置く。**他のスキルは消さない**（利用者の環境に入っているものは競合相手として残る）[一次: 同]
- `run_loop.py`: 反復の上限 5、保留 0.4、**should_trigger で層化して分割、乱数の種 42**、各 3 回、閾値 0.5、最良は検証（test）の合格数で選ぶ（同点なら早い版、という動きはコードからの推論）、訓練の失敗が 0 になったら終了 [一次: コードの要約] https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/scripts/run_loop.py

**Claude Code `claude plugin eval`** [一次] https://code.claude.com/docs/en/plugin-evals

- 採点器 `tool_used`: "The number of calls to `tool` whose JSON-encoded input matches the optional `input_match` regex is between `min`, default 1, and `max`, default unlimited. To assert a tool was never called, set both `min: 0` and `max: 0`" — 「この役割を呼ぶ」「この役割は呼ばない」の両方を同じ形で書ける
- `tool_order`（呼び出しの順序）、`regex`（`target: trace` でセッション全体を正規表現で検査）もある。**任意コードの採点器はない**（"There are no custom-code graders."）
- 既定で 1 件 3 回。"One run of a non-deterministic agent tells you little"。1 回で回すときは "A single run is noisy, so confirm any change at the default three runs before you trust it"
- 最もよくある最初の発見は「`tool_used: Skill` が落ちる＝自然な言い回しでスキルが選ばれない」

**Google skill-reach**（Apache-2.0、★16）[一次: リポジトリの README と公式頁の要約] https://github.com/google/skill-reach / https://google.github.io/skill-reach/

- 「競合する説明文があるなかで、利用者の依頼が意図したスキルに振り分けられるか」を測る。振り分けを誤った先（取り違えの組）を記録し、語彙の重なりで試走前に競合相手を洗い出す
- `reach query --adversarial` で競合スキルからニアミスを合成し誤発火率を測る。`reach eval` は対象スキルをその上位の競合と並べて試す。設定例は `size = 20`、`rivals = 10`
- 試行回数の既定: 正式な評価 5 回、簡易 3 回。差の検定は反復の標準誤差（1 回なら二項の近似）
- **早期打ち切りが既定で有効、`max_turns` の既定は 3**。目的のスキルが呼ばれた時点で止める
- Claude Code は Vertex 経由（`CLAUDE_CODE_USE_VERTEX=1`）で動かす記載。サブスク認証の記載はない [一次: 要約]
- 依頼が 1 スキルあたり何件かは書かれていない [未確認]

### 1-2 研究: ツール選択・スキルの振り分け・意図分類

- **MetaTool**（Huang ら, arXiv 2310.03128）[一次: 要旨と本文] https://arxiv.org/abs/2310.03128 / https://arxiv.org/html/2310.03128
  - 「ツールを使うべきか（awareness）」と「どれを使うか（selection）」を分けて測る。selection は 4 種: "tool selection with similar choices" / "in specific scenarios" / "with possible reliability issues" / "multi-tool selection"
  - 「似た選択肢」は、正解ツール + 説明文の埋め込みの余弦類似度で上位の n−1 個、で候補を作る。awareness は正例 515・負例 515 の同数
  - 指標は正しく選んだ割合（CSR）と、awareness の精度・再現率・F1
- **BFCL（Berkeley Function Calling Leaderboard）** [一次] https://gorilla.cs.berkeley.edu/blogs/8_berkeley_function_calling_leaderboard.html
  - "Multiple Function": 2〜4 個の関数説明から 1 つを呼ぶ（200 件）。"Function Relevance Detection": どれも当てはまらないとき関数を呼ばない（240 件）。判定は構文木の照合（決定的）
- **CLINC150 / 範囲外の検出**（Larson ら, EMNLP 2019）[一次: 要旨] https://aclanthology.org/D19-1131/
  - 150 の意図。分類器は範囲内の分類は得意だが、**範囲外（どの意図でもない）の検出が苦手**。役割の振り分けでいう「どれでもない（役割に入らず自分でやる）」の類を独立に測る理由になる [推論]
- **Lost in Implicit Routing**（Liu ら, arXiv 2610.18522, 2026-10）[一次: 要旨] https://arxiv.org/abs/2610.18522
  - 無関係なスキルを 1,000 個足すと、読み込んだスキルの再現率が 73.6% → 27.4%、何も読まない率が 9.3% → 51.6%。事前に選んで渡すと 73.9% を保つ。**無関係なスキルの説明文だけを隠すと大きく回復** → 説明文どうしの干渉が原因。もっともらしい別スキルを読む（取り違え）は少なく、主な失敗は「何も読まない」
- **SkillRouter**（Zheng ら, arXiv 2603.22455）[一次: 要旨] https://arxiv.org/abs/2603.22455
  - 約 8 万スキルの候補から振り分ける。最良の構成で top-1 の的中 74.0%。本文を隠して名前と説明文だけにすると 37〜44pt 落ちる（外部の検索器での話で、Claude Code の内部の振り分けではない点に注意 [推論]）

### 1-3 まとめ: 複数役割の振り分けを測る作法（相場）

| 項目 | 相場 | 出典 |
|---|---|---|
| 依頼の件数 | 約 20（正 8〜10 / 負 8〜10）。役割ごとではなくスキル 1 本あたり | agentskills.io、skill-creator [一次] |
| 1 依頼の回数 | 3（簡易）〜5（正式） | agentskills.io、skill-creator、plugin eval、skill-reach [一次] |
| 合格の判定 | 発火率 0.5 を閾値 | agentskills.io、skill-creator [一次] |
| 打ち切り | 目的のスキルが呼ばれた時点 / 最初に別のツールが始まった時点。最大 3 ターン | skill-reach、skill-creator [一次] |
| 分割 | 訓練 6 割 / 検証 4 割、正誤で層化、固定 | agentskills.io、skill-creator [一次] |
| 反復 | 5 回。最良は検証で選ぶ。最後に新しい 5〜10 件で確認 | 同上 [一次] |
| 多クラスの採点 | 正解ラベル + 混同行列（取り違えの組）+「どれでもない」の類 | skill-reach、MetaTool、BFCL、CLINC150 [一次] |
| ニアミスの作り方 | 語や概念が重なる依頼。競合相手の説明文から作る | agentskills.io、skill-reach、MetaTool（埋め込みの類似度）[一次] |

- 役割の数 N に比例して件数を増やす、という公開の指針は見つからなかった [未確認]。単一スキルの 20 件は「1 本の説明文の良し悪し」を見る規模であり、5 役割それぞれに 20 件（計 100 件 × 3 回）は相場どおりだが pit-crew の予算を超える [推論]

### pit-crew への示唆（Q1）

1. **入口のセルは「6 クラス分類」にする**: 正解ラベルは {po, dev, qm, platform, audit, none}。none は「役割に入らず、汎用セッションのまま済ませるのが正しい依頼」。1 回の実行の予測ラベル = 最初に入った役割（Skill / Agent / 展開のどれか）、入らなければ none [推論]
2. **ニアミスは「隣の役割との境界」に置く**: 取り違えやすい組を先に決め（例: Dev↔QM「直す / 見る」、QM↔Audit「出荷の判定 / 手順の監査」、PO↔Audit、Platform↔Dev「基盤を直す / 機能を直す」）、組ごとに両側から 1 件ずつ作る。正解は片方の役割なので「否定例」ではなく、その役割の正例として数える [推論、agentskills.io・skill-reach に基づく]
3. **Claude Code の組み込みスキルも競合相手になる。** preflight-entry-1 のセッションには `code-review` / `security-review` / `verify` / `debug` などの組み込みスキルが一覧にあった [一次: 実行記録の init イベント]。QM の依頼で `code-review` が呼ばれたら「他（other）」として記録する。消すと現実と違う環境になるので、消さずに記録する [推論]
4. **主な失敗は取り違えより「何も呼ばない」の可能性が高い** [推論、Lost in Implicit Routing と v0 の 0/6 に基づく]。指標は「正しい役割に入った率」と「none 依頼で役割に入らなかった率」を分けて出す

---

## Q2. 15 件の計画（5 役割 × (正 2 + ニアミス 1) × 2 回、3 ターン上限）は足りるか

### 2-1 いまの計画の評価

| 観点 | いまの計画 | 相場 | 判定 [推論] |
|---|---|---|---|
| 件数 | 15 | 約 20 | 下限に近い。全体の正答率の区間は広い（下の計算） |
| 回数 | 2 | 3〜5 | **2 回だと 1/2 の引き分けが出て、閾値 0.5 で判定できない** |
| ニアミス | 役割ごとに 1 | 境界ごとに両側 | 混同の方向が片側だけになる |
| none の類 | なし | 必要（BFCL の関連性検出、CLINC150 の範囲外）| 「役割に入りすぎる」を測れない |
| 3 ターン上限 | あり | skill-reach の既定と同じ | 妥当。ただし Harbor には「呼ばれた時点で打ち切り」がない |
| 訓練 / 検証 | 07 では「役割ごとに約 20 件、6:4」 | 6:4、層化 | **07 の「役割ごとに約 20 件」と 15 件の計画が食い違っている**。どちらかに揃える必要がある |

- 区間の目安（Wilson 95%、依頼単位）[推論・計算]: 15 件中 12 件合格 → 約 55〜93%。20 件中 16 件 → 約 58〜92%。**役割ごと（3〜4 件）の合格率は 1 件で 25〜33pt 動くので、役割別の数字は記述にとどめ、主張は全体と none 類に限る**
- 同じ依頼の繰り返しは独立ではないので、区間は「依頼」を単位にとる（Miller の、まとまり単位の誤差の議論。既出 `research-next-steps-small-n.md`）[一次: 既出]

### 2-2 改訂案（予算 30〜60 回）

**E1: 汎用セッションからの振り分け（確率的な入口）**

- 依頼 20 件: 5 役割 × 3 件（1 件は役割名も領域名も出さない暗黙の依頼、1 件は隣の役割との境界の依頼）= 15 件 + none 5 件（役割の語彙を含むが役割は要らない依頼。例「この関数の型エラーを直して」）
- 分割: 訓練 12 / 検証 8、ラベルで層化、種を固定（説明文を調整する段階でだけ使う。v0 と v1 の比較は全 20 件で行う）
- 回数: **v1 は 2 回 → 割れた依頼（1/2）だけ 3 回目**（事前に決めておく止め方）。見込み 40〜46 回。v0 は基準点として 1 回ずつ 20 回（v0 の説明文は受信箱の見回りなので、ほぼ全件 none になる見込み。床の確認に多くは使わない）
- 打ち切り: 3 ターン。可能なら最初の Skill / Agent の呼び出し、または最初の別ツールの開始で止める（skill-creator と同じ定義）
- 採点（決定的）: 予測ラベル（§Q4 の検出）と正解ラベルの一致。報告は ① 全体の依頼単位の合格率（Wilson 区間）、② none 類の誤発火率、③ 6×6 の混同行列（取り違えの組）、④ 役割別は件数つきの記述のみ
- 最後に、調整に使っていない新しい依頼 5〜10 件で 1 回ずつ確認（agentskills.io）

**E0: 決定的な入口の操作確認（測定ではなく前提の確認）**

- 5 役割 × 2 方式（先頭の `/role`、`--agent <role>` 相当）× 1 回 = 10 回。期待は 10/10 で役割に入る。入らなければ配線の不具合として直し、E1 には進まない
- 理由: 07 の v1 は「役割セッションは役割として起動する」を約束にしている。ハーネスの中身の効果（受け渡し・境界）はこの入口の上で測るので、入口そのものが確実に効くことを先に固定する（`research-reusable-role-harness.md` §Q2 示唆 2）[推論]

合計: E0 10 + E1（v0 20 + v1 40〜46）= **約 70〜76 回**。予算 60 に収めるなら v0 を 10 件（各役割 1 + none 5）に絞って **約 60〜66 回**。どちらも 1 回は短い（3 ターン）[推論]。

### pit-crew への示唆（Q2）

1. 2 回は避ける（引き分け）。「2 回 + 割れたら 3 回目」を事前に書いて固定する
2. none 類を足す。足さないと「何でも役割に入る説明文」が満点になる
3. 07 §4 の「役割ごとに約 20 件」は、予算の範囲では「全体で 20 件」に読み替えるのが現実的。読み替えは 07 に記録してから走らせる
4. 役割別の合格率で v0 と v1 の差を主張しない。主張は全体の合格率と none の誤発火率まで

---

## Q3. 実行器の向き不向き: (a) 振り分け (b) 2 段の受け渡し (c) 境界 (d) 移植

### 3-1 Harbor v0.25.0（現行）

インストール済みのコード（`harbor/agents/installed/claude_code.py`、`harbor/trial/multi_step.py`、`harbor/models/task/config.py`）と公式文書を読んだ。

- **multi-step タスク** [一次] https://docs.harborframework.com/tasks/multi-step.md
  - 構成: `steps/<name>/` ごとに `instruction.md`（必須）・`tests/`・`solution/`・`workdir/`
  - "Filesystem changes persist between steps." 環境は手順間で保たれる
  - 各手順は既定で新しい会話。`resume_trajectory: true` で前の手順のセッションを続ける（claude-code は対応、`--continue` を付ける）[一次: コード `resume_flag = "--continue "`]
  - 手順ごとに `workdir/` の上書きコピーと `setup.sh` の実行、採点器、`min_reward`（下回れば残りの手順を打ち切る）、報酬のまとめ方（`mean` / `final`）
  - 手順ごとの `[steps.agent]` は `timeout_sec` / `user` / ネットワークの方針だけ（`AgentConfig` のフィールド）[一次: コード]。**手順ごとにエージェントの種類や引数（kwargs）は変えられない** [一次: コード。公式文書も「手順ごとのエージェントの切り替えは記載なし」]
  - 「特定の手順から始める」は "coming soon" [一次]
- **claude-code エージェントの引数** [一次: コード]: `max_turns` / `reasoning_effort` / `append_system_prompt` / `allowed_tools` / `disallowed_tools` / `permission_mode`（既定 `bypassPermissions`）/ `max_budget_usd` など。**`--agent` はない**
  - ただし `config`（native config、ファイルか JSON）を渡すと `--settings /tmp/claude-code-settings/settings.json` として毎回付ける [一次: コード]。`--settings` は「ユーザー設定で書けるキーは何でも書ける」 [一次: https://code.claude.com/docs/en/settings]。設定の `agent` キーはセッションを指定のサブエージェントとして起動する [一次: https://code.claude.com/docs/en/sub-agents]。**`--settings` の `agent` が `--agent` と同じに効くかは [未確認]**（preflight で確かめる）
  - 指示文は標準入力から `claude --verbose --output-format=stream-json ... --print` に渡す。先頭に `/qm` を置けば展開になる（preflight-entry-1）[一次]
- **スキルとエージェント定義の配置** [一次: コード]: 実行のたびに `CLAUDE_CONFIG_DIR` を `/logs/agent/sessions` に変え、`~/.claude/skills` と `--skill` で渡したディレクトリを `$CLAUDE_CONFIG_DIR/skills/` に写す。**`agents/` は写さない**。pit-wall の runner も `--skill <arm>/skills` だけを渡している [一次: `packages/pit-wall/src/runners/harbor.mjs`]
  - 結果: `stage1-v0-1` の各実行の init イベントは `"agents": ["claude", "Explore", "general-purpose", "Plan", "statusline-setup"]` で、v0 の 5 エージェントは無かった [一次: 実行記録]。エージェントを使うセルの前に直す必要がある。方法は、arm の `agents/` を課題の作業ディレクトリ（`/app/.claude/agents/`、プロジェクトのスコープ）に置くか、`setup.sh` で `$CLAUDE_CONFIG_DIR/agents/` に写す [推論]。前者はセルの材料に arm が混ざるので、セルのハッシュの扱いを決めてから
- **サブスク認証** [一次: コード]: `CLAUDE_CODE_OAUTH_TOKEN` を渡し、`CLAUDE_FORCE_OAUTH` で API キーを落とせる。コンテナ内で無改変の `claude` を本人の資格情報で動かす形で、規約の「本人が無改変の Claude Code に自分のサブスクでサインインする」に当たる [一次: Legal 文書] [推論: 当てはめ]
- **記録** [一次: 実行記録]: `agent/claude-code.txt`（stream-json の標準出力）、`agent/sessions/projects/-app/<id>.jsonl`（session JSONL）、`agent/trajectory.json`（ATIF、session JSONL から作る。スキル本文の展開も入る）。サブエージェントの記録は別ファイルで、Harbor は `extra.agent_id` を付けて合流させる [一次: コードのコメント]
- 打ち切り: stream のイベントで止める仕組みはない。`max_turns` で代用する [一次: コード、推論]
- ライセンス: Apache-2.0 [一次: 既出 `research-runners.md`]

**(a)〜(d) への当てはめ** [推論]

| セル | 向き | 理由 |
|---|---|---|
| (a) 振り分け | △ | 動くが、1 回ごとにコンテナを起動、早期打ち切りなし、Skill 以外の検出（展開・Agent）は自前の採点器。20〜60 回なら許容範囲 |
| (b) 2 段の受け渡し | ○ | multi-step がそのまま合う。手順 1 の指示文の先頭に `/dev`、手順 2 に `/qm`。手順 1 の採点器で「印と成果物」を、手順 2 で「受け手の判断」を測り、`min_reward` で手順 1 が失敗したら手順 2 を走らせない（受け渡しの成否と受け手の成否を分けられる）。`--agent` 方式にするなら手順ごとの `setup.sh` で `.claude/settings.json` に `agent` を書く（手順 1 のエージェントがこのファイルを書き換えないかは採点で見張る） |
| (c) 境界 | ○ | 既存の状態採点（state-capture）がそのまま使える |
| (d) 移植 | ○ | 2 つ目の案件は別の環境（Dockerfile / 作業ディレクトリ）と別の課題として作る。核は同じ、アダプタは arm の側 |

### 3-2 `claude plugin eval`（Claude Code 組み込み）

[一次] https://code.claude.com/docs/en/plugin-evals

- 実行: 各実行は一時的な HOME・作業ディレクトリ・設定で、`claude -p` の子プロセス。**"Nothing personal or project-level loads."** プロジェクトの `.claude/`・`CLAUDE.md` は、scaffold が書いたものでも読まない。スキル・エージェント・フックは評価対象のプラグインに入れて配る
- `prompt.md` の本文は "exactly as you wrote it" で渡す。先頭に `/qm` を書いた場合の扱いは書かれていない [未確認]（スキル文書は「`claude -p` では先頭のスキル 1 つを読み込み、残りを引数にする」と書く [一次: https://code.claude.com/docs/en/skills]）
- 採点器: `regex`（`target: trace` / ファイルの内容）、`tool_used`（`min` / `max`）、`tool_order`、`file_exists`、`llm`、`baseline`。任意コードはない
- 状態: `context.scaffold_script`（`--scaffold` を付けたときだけ、ファイルと git の状態だけ、120 秒）、`context.history_file`（記録した会話の続き）、`context.add_dirs`（読み取りのみ）
- 回数・並列: `--runs`（1〜50、既定 3）、`-j`（1〜8、レート制限は共有）、`--ablation none` で比較なし
- 認証: 普段の Claude Code と同じ認証。プランの枠を使う [一次]。既出の U1 調査で WSL2 のサブスクで OK と判定済み
- Bash / Write を許すと OS のサンドボックス（bubblewrap + socat）。Ubuntu 24.04 の AppArmor の注意は U1 調査で既出
- `--agent` に当たる case のフィールドはない（`append_system_prompt` はある）[一次: フィールド表]。プラグインのエージェントは `Agent` の呼び出しで `my-plugin:code-reviewer` のように使える [一次]
- 2 つのセッションを順に走らせる仕組みはない。最も近いのは「1 段目の結果を scaffold で再現し、2 段目だけを走らせる」 [推論]

**(a)〜(d) への当てはめ** [推論]

| セル | 向き | 理由 |
|---|---|---|
| (a) 振り分け | ◎ | `tool_used: Skill` / `Agent` の `input_match`、`min: 0, max: 0` で 6 クラスの正誤を書ける。展開は `regex` の `target: trace` で `<command-name>` を探す（trace に session の user 発言が入るかは preflight で確認 [未確認]）。コンテナ不要で速い。隔離が強いので「組み込みスキル以外の雑音」が無い |
| (b) 2 段の受け渡し | × / △ | 同じ環境での 2 セッションはできない。受け手だけを測る「固定した受け渡し物を scaffold で置き、受け手が読んでから判断するか」は書ける（これは受け手の単体試験として有用） |
| (c) 境界 | △ | 書けるが、git の状態や `gh` の呼び出し記録の検査は正規表現でしか書けない。pit-wall の状態採点は使えない |
| (d) 移植 | △ | 案件ごとに scaffold を作れば可能。プロジェクトの `CLAUDE.md` が読まれないので「既存プロダクトへの導入」（案件の CLAUDE.md・文書の配置をアダプタに写す）の現実味が下がる |

- ライセンス: Claude Code の一部（Anthropic の規約）。保守は Anthropic 側。仕様の変更（例: v2.1.299 で API エラーの扱いが変わった）を追う必要がある [一次]

### 3-3 UK AISI Inspect + inspect_swe

- Claude Code を Inspect のエージェントとして動かす。"Model API calls that occur in the sandbox are proxied back to Inspect" [一次: https://meridianlabs-ai.github.io/inspect_swe/claude_code.html]。認証・サブスクについての記載はない [一次: 同頁に無い]
- Claude Code の Legal 文書: OAuth（サブスク）は "designed to support ordinary use of Claude Code and other native Anthropic applications"。開発者は "route requests through Free, Pro, Max, or Ultra plan credentials on behalf of their users" をしてはならず、資格情報やセッショントークンを "collect, store, or intermediate" してはならない [一次] https://code.claude.com/docs/en/legal-and-compliance
- Messages API が OAuth トークンを "OAuth authentication is currently not supported." で拒む、という利用者の報告がある [二次: https://claudeissues.com/issue/37205-feature-allow-oauth-tokens-for-anthropic-messages-api-enable-subscription-based]
- 当てはめ [推論]: 中継（proxy）の上でサブスクを使うには、Inspect がサブスクの資格情報で API を呼ぶ必要があり、規約の「中継」に当たる可能性が高く、技術的にも通らない可能性がある。**pit-crew の制約（サブスクの OAuth のみ）では採れない**
- 機能面では、ソルバーを並べて同じサンドボックスで 2 つのエージェントを順に動かすことはできそうだが、文書の該当頁には記載がない [未確認]。MIT

### 3-4 その他（OpenAI 系・promptfoo など）

- promptfoo の Claude Agent SDK provider: Agent SDK を使う開発者は API キーを使え、と Legal 文書にある [一次]。サブスクで使えるかは文書上あいまい（"Advertised usage limits ... assume ordinary, individual usage of Claude Code and the Agent SDK" という文もある）[一次] [推論: グレー]。既出 `research-runners.md` の比較以上の新しい材料はない
- OpenAI 系の評価器（Evals 等）は Claude Code をそのまま動かす前提ではないので、今回の (a)〜(d) には当てはめていない [推論]

### 3-5 薄い自前の runner（`claude -p --output-format stream-json` を自前のコンテナで）

- 形: pit-wall の既存の Docker イメージ（`packages/pit-wall/docker/agent-claude-code/Dockerfile`）で、`docker run` → `claude -p --output-format stream-json --verbose [--agent X] [--include-partial-messages]` → 同じボリュームで 2 つ目のセッション、を順に呼ぶ。正規化は既存の `normalize/claude-stream.mjs` を使う [一次: pit-wall のファイル一覧] [推論: 形]
- 長所: `--agent` をそのまま渡せる。手順ごとに引数を変えられる。skill-creator と同じ早期打ち切り（最初の Skill / Agent / 別ツールで kill）ができる。サブスク認証は Harbor と同じ形（本人の資格情報で無改変の CLI）
- 短所: 環境の起動・後片付け・並列・タイムアウト・記録の回収・再採点を自分で保守する。Harbor が既にやっていることの作り直しになる
- 注意: **stream-json の標準出力には `/role` の展開が出なかった**（preflight-entry-1 の `claude-code.txt` に `command-name` は 0 件。session JSONL と、それから作った ATIF の `trajectory.json` にはある）[一次: 実行記録]。自前で作るなら session JSONL も回収する

### 3-6 比較の一覧

| 実行器 | (a) | (b) | (c) | (d) | サブスク OAuth | 採点の決定性 | 費用 | 保守 | ライセンス |
|---|---|---|---|---|---|---|---|---|---|
| Harbor v0.25.0 | △ | ○（multi-step） | ○ | ○ | ○ [一次: コード] | 自前の採点器（決定的）| コンテナ起動 / 回 | pit-wall 側で `agents` 配置と `agent` 指定を足す | Apache-2.0 |
| `claude plugin eval` | ◎ | ×（受け手の単体なら △） | △ | △ | ○ [一次] | regex / tool_used は決定的 | 軽い | Anthropic が保守、仕様変更を追う | Claude Code の規約 |
| Inspect + inspect_swe | ○ | ○? [未確認] | ○ | ○ | **×** [推論] | 任意の Python | — | — | MIT |
| 自前の薄い runner | ◎ | ○ | ○ | ○ | ○ [推論] | 自前（決定的）| 軽い | すべて自前 | — |

### pit-crew への示唆（Q3）

1. (b)(c)(d) は Harbor の multi-step に乗せる。受け渡しの 2 段は「1 trial = 2 step」、手順 1 の `min_reward` で受け渡しの失敗と受け手の失敗を分ける
2. Harbor の runner に 2 つ足す: ① arm の `agents/` を配置する（今は 0 件入っている）、② `config`（`--settings`）で `{"agent": "<role>"}` を渡す方式の preflight。② が効かなければ入口は `/role` の展開に固定する（07 §3 は「`--agent` または最初に `/<role>`」なので約束の範囲内）
3. (a) は `claude plugin eval` に移す。v1 はもともと配布物（プラグイン）なので隔離の制約と合う。pit-wall には既に `runners/claude-plugin-eval.mjs` がある [一次: ファイル一覧]
4. 自前の runner は、Harbor の②が通らず、かつ `--agent` で測ることが必須になった場合の予備にとどめる

---

## Q4. Claude Code で役割（スキル / エージェント）に入ったことを検出する方法

| 入り方 | 記録に何が出るか | どこに出るか | 出典 |
|---|---|---|---|
| モデルが自分でスキルを呼ぶ | `tool_use` で `name == "Skill"`、`input.skill` に名前（プラグインなら `plugin:skill`） | stream-json の標準出力、session JSONL、ATIF | [一次] agentskills.io の検出例、plugin eval の `input_match` 例 |
| モデルが SKILL.md を直接読む | `Read` の `file_path` にスキルのパス | 同上 | [一次] skill-creator `run_eval.py` は Read も発火に数える |
| 利用者が `/role` で呼ぶ（展開） | user 発言に `<command-message>qm</command-message>` `<command-name>/qm</command-name>` `<command-args>…`、続いて `isMeta: true` の user 発言に "Base directory for this skill: …" とスキル本文。**Skill の `tool_use` は出ない** | **session JSONL と ATIF だけ**。`--print` の stream-json の標準出力には出なかった | [一次] preflight-entry-1 の記録。スキル文書は「呼ばれると SKILL.md の内容が 1 つのメッセージとして会話に入る」と書く https://code.claude.com/docs/en/skills |
| サブエージェントへの委譲 | `tool_use` で `name == "Agent"`（v2.1.63 で Task から改名、旧名も有効）、`subagent_type` に名前 | 本体の記録 + `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` | [一次] https://code.claude.com/docs/en/sub-agents。記録の入力キー名 `subagent_type` は [二次: 一般の記録例からの推論、本調査では未照合] |
| `--agent <name>` / 設定の `agent` | 起動ヘッダに `@<name>`（対話時）。本体のシステムプロンプトが置き換わる。非対話の記録（init イベント等）に出るかは不明 | — | [一次] sub-agents 文書。記録上の印は [未確認] |
| （前提の確認）使える役割 | init イベントの `skills` / `agents` / `slash_commands` | stream-json の最初の行 | [一次] 実行記録 |

- 公式の発火の検査は、どれも Skill の `tool_use` だけを見る（agentskills.io の例、plugin eval の `tool_used: Skill`）[一次]。**展開による入り方は、これらの検査では「発火していない」と数えられる** [推論]。pit-wall の `skill-fired` も同じ（Skill の呼び出しだけ）[一次: `graders/index.mjs`]
- `--agent` の印が記録に出ない場合の代わり: 役割カードの冒頭に固有の宣言（例: 最初の発言で役割名を名乗る規則）を入れると決定的に検出できるが、これは規則を足すことになり、07 §3 の「規則は足さない」と衝突する [推論]。まず preflight で init イベントや system 行に印があるかを確かめる

### pit-crew への示唆（Q4）

1. 採点器 `role-entered` を作り、Skill の `tool_use`・Read の SKILL.md・`<command-name>` の展開・Agent の `subagent_type` の 4 つをまとめて「入った役割」を返す。入力は ATIF（Harbor の `trajectory.json`）か session JSONL。stream-json の標準出力だけでは展開を見落とす
2. 各実行で init イベントの `agents` / `skills` を記録し、「使える役割が揃っていたか」を前提の検査（故障の判定）にする。今回のように agents が 0 件なら、その実行は「入口の失敗」ではなく「配線の故障」として集計から外す
3. `--agent` の印は preflight で決める（下の推奨 E0）

---

## 推奨

### 実行器の分担

| セル | 実行器 | 変更 |
|---|---|---|
| 入口 E0（決定的な入口の操作確認） | Harbor（現行の runner） | arm の `agents/` を配置する。`config`（`--settings`）で `agent` を渡す方式を足す |
| 入口 E1（汎用セッションからの振り分け） | `claude plugin eval`（pit-wall の既存 runner） | v1 をプラグインとして読み込む。採点器: `tool_used`（Skill / Agent、`input_match`、`min/max`）+ `regex`（trace の `<command-name>`）。`--ablation none` |
| 受け渡し（2 段） | Harbor multi-step | 1 trial = 2 step。手順ごとの指示文の先頭に `/role`（または `setup.sh` で `agent` 設定）。手順 1 に `min_reward` |
| 境界 | Harbor（現行） | なし（状態採点を流用） |
| 移植 | Harbor | 2 つ目の案件の環境と課題を足す |
| 単一セッションの基準 | Harbor | なし |

- Inspect はサブスク認証の制約で採らない。自前の runner は予備
- 予備の判断条件: E0 で `--settings` の `agent` が効かず、かつ `--agent` 起動の測定が必須とオーナーが判断した場合だけ、自前の runner を作る

### 改訂した入口のセル

**E0: 決定的な入口（前提の確認、Harbor）**
- 5 役割 × 2 方式（先頭 `/role` の展開、`--settings` の `agent`）× 1 回 = **10 回**、v1 だけ
- 採点: `role-entered`（§Q4）が期待の役割を返すか。期待 10/10。init の `agents` / `skills` に 5 役割が揃っていない実行は故障
- `--settings` 方式で記録に印が出ない場合、セッションの最初のアシスタント発言とシステムプロンプトの差（役割カードの内容に沿って動いたか）を目視で 1 回確かめ、方式の採否を決める（集計には使わない）

**E1: 振り分け（確率的な入口、`claude plugin eval`）**
- 依頼 20 件: 5 役割 × 3（明示 1・暗黙 1・隣との境界 1）+ none 5。ラベルは {po, dev, qm, platform, audit, none}、組み込みスキルが呼ばれたら other
- 境界の組（例）: Dev↔QM、QM↔Audit、PO↔Audit、Platform↔Dev、PO↔Dev。組ごとに両側から 1 件
- 分割: 訓練 12 / 検証 8（ラベルで層化、種固定）。説明文を直すときだけ使い、最良の版は検証で選ぶ。最後に新しい依頼 5 件で各 1 回
- 回数: v0 は 1 回ずつ（20 回、床の確認）。v1 は 2 回、割れた依頼だけ 3 回目（40〜46 回）。予算 60 に収めるなら v0 は 10 件（役割ごと 1 + none 5）
- 上限: `max_turns: 3`、`allowed_tools: [Read, Glob, Grep, Skill, Agent]`（書き込みを許さないので、入口の判断だけを測る）
- 採点（決定的）: 予測ラベル = 最初に入った役割。依頼の合格 = 過半の回で予測が正解と一致（2 回なら 2/2、3 回なら 2/3）
- 報告: 全体の依頼単位の合格率（Wilson 区間）、none の誤発火率、6×6 の混同行列、役割別は件数つきの記述。v0 と v1 の差は全体と none に限って述べる

**合計**: E0 10 + E1 60〜66 = **約 70〜76 回**（v0 を 10 件に絞ると 約 60〜66 回）。E1 の 1 回は 3 ターンで短い。

**07 との整合**: 07 §4 の「役割ごとに依頼文 約 20 件」は「全体で 20 件」に読み替える。読み替えと理由（予算、相場は「スキル 1 本につき 20 件」で役割ごとの合格率は区間が広すぎて主張に使えない）を 07 に記録してから走らせる。

---

## 確かめられなかったこと（次の preflight で確かめる）

- `--settings` に `{"agent": "<role>"}` を書いて `--print` で起動したとき、役割として起動するか。記録に印が出るか
- `claude plugin eval` の `prompt.md` の先頭に `/role` を書いたとき展開になるか。`regex` の `target: trace` に展開の user 発言が含まれるか
- サブエージェント呼び出しの記録の入力キー名（`subagent_type`）を pit-crew の記録で照合
- skill-reach の 1 スキルあたりの依頼件数の既定値
- 役割の数 N に応じて依頼を増やす公開の指針（見つからなかった）
- Inspect のソルバーで 2 つの Claude Code セッションを同じサンドボックスで順に動かす公式の例（認証の制約で採らないので深追いしていない）

## 出典

| 資料 | 種類 | URL / 場所 |
|---|---|---|
| Optimizing skill descriptions | 一次 | https://agentskills.io/skill-creation/optimizing-descriptions |
| skill-creator SKILL.md / run_eval.py / run_loop.py | 一次（コード） | https://github.com/anthropics/skills/tree/main/skills/skill-creator |
| Test plugins with evals | 一次 | https://code.claude.com/docs/en/plugin-evals |
| Skills | 一次 | https://code.claude.com/docs/en/skills |
| Subagents | 一次 | https://code.claude.com/docs/en/sub-agents |
| Settings | 一次 | https://code.claude.com/docs/en/settings |
| Legal and compliance | 一次 | https://code.claude.com/docs/en/legal-and-compliance |
| skill-reach | 一次（README・公式頁の要約） | https://github.com/google/skill-reach / https://google.github.io/skill-reach/ |
| MetaTool（Huang ら） | 一次 | https://arxiv.org/abs/2310.03128 |
| BFCL | 一次 | https://gorilla.cs.berkeley.edu/blogs/8_berkeley_function_calling_leaderboard.html |
| CLINC150（Larson ら, EMNLP 2019） | 一次（要旨） | https://aclanthology.org/D19-1131/ |
| Lost in Implicit Routing（Liu ら, 2026-10） | 一次（要旨） | https://arxiv.org/abs/2610.18522 |
| SkillRouter（Zheng ら） | 一次（要旨） | https://arxiv.org/abs/2603.22455 |
| Adding Error Bars to Evals（Miller） | 一次（既出） | https://arxiv.org/abs/2411.00640 |
| Harbor multi-step tasks | 一次 | https://docs.harborframework.com/tasks/multi-step.md |
| Harbor v0.25.0 インストール済みコード | 一次 | WSL `~/.local/share/uv/tools/harbor/lib/python3.12/site-packages/harbor/`（`agents/installed/claude_code.py`、`trial/multi_step.py`、`models/task/config.py`、`models/trial/config.py`） |
| inspect_swe claude_code | 一次 | https://meridianlabs-ai.github.io/inspect_swe/claude_code.html |
| Messages API が OAuth を拒む報告 | 二次 | https://claudeissues.com/issue/37205-feature-allow-oauth-tokens-for-anthropic-messages-api-enable-subscription-based |
| pit-crew の実行記録 | 一次 | `runs/2026-11-01/preflight-entry-1/…/agent/`（`claude-code.txt`、`sessions/projects/-app/*.jsonl`、`trajectory.json`）、`runs/2026-11-01/stage1-v0-1/`（init イベントの `agents`） |
| pit-wall のコード | 一次 | `packages/pit-wall/src/runners/harbor.mjs`、`graders/index.mjs`、`runners/claude-plugin-eval.mjs` |
