# docs/research/ — 調査の記録

評価基盤とハーネスの設計判断は、ここにある調査を根拠にしている。調査はこのリポジトリの資産として残す（オーナー方針、2026-11-01）。設計書や実験ノートから、判断の根拠としてここを参照する。

## 書き方

- 1 つの問いにつき 1 ファイル（`research-<主題>.md`）。冒頭に調査日・対象・結論を書く
- 主張には根拠の水準を付ける: **[一次]**（一次資料の本文を読んだ）/ **[二次]**（要約・検索結果）/ **[推論]**（自分の推論）/ **[未確認]**
- 後で誤りと分かったら、本文を消さずに冒頭へ訂正の注記を足し、実験ノート（`docs/log/`）にも書く
- 調査を足したら、この索引に 1 行足す
- **調査を始める前に、この索引と既存の調査を読み、同じ問いを扱ったものがないか確かめる。** あれば差分だけを調べ、新しいファイルの冒頭に「前の調査との関係」（繰り返した点・新しい点・前の調査にあって今回扱わなかった点）を書く。サブエージェントに調査を頼むときも、読むべき既存の調査を指示に含める（2026-11-02、同じ棚卸しを 2 回行い、1 回目の結論を設計に参照していなかったことへの対策。`docs/log/2026-11-01.md` 末尾）
- 調査をサブエージェントに任せるときは、書き込みができる状態で全文をファイルに残させる（2026-10-31 の棚卸しは全文が残らず、要約だけになった）

## 一覧

| ファイル | 問い | 調査日 | 主に使った場所 |
|---|---|---|---|
| [research-market.md](research-market.md) | Agensi.io と役割分離ハーネスの配布先・競合はどうなっているか | 2026-10-31 | 出品の見送り判断 |
| [research-inventory.md](research-inventory.md) | がんばりクエストのハーネスに何があるか（1 回目の棚卸しの要約。全文は残っていない）。汎用 / 準汎用 / 専用の分類、process-compass との対応、会社で詰まった 3 点（Dev の進め方・QM の前提・設計書の矛盾ループ）への対応状況、核とアダプタの分け方 | 2026-10-31 | 汎用化の範囲。2 回目の棚卸し `research-ganbari-role-process-inventory.md` と対で読む |
| [research-blueprint.md](research-blueprint.md) | genai-evaluation-blueprint と既存資産から何が使えるか | 2026-10-31 | 評価の成熟度の段階 |
| [research-eval.md](research-eval.md) | スキル / プラグインを定量評価する設計はどうあるべきか | 2026-10-31 | pit-wall の設計 |
| [research-prior-art.md](research-prior-art.md) | 役割分離ハーネスの配布とスキル評価の先行事例 | 2026-10-31 | 差別化の確認 |
| [research-runners.md](research-runners.md) | 評価の実行器（runner）に何を使うか | 2026-10-31 | Harbor の採用（冒頭に訂正 2 点） |
| [research-synthesis.md](research-synthesis.md) | 上の調査の統合 | 2026-10-31 | 企画書 |
| [research-u1-subscription-auth.md](research-u1-subscription-auth.md) | サブスクの認証で評価を回せるか（従量課金なし） | 2026-10-31 | 実行環境 |
| [research-judge-models.md](research-judge-models.md) | LLM judge にどのモデルを使うか | 2026-10-31 | judge の選定 |
| [research-typesafe.md](research-typesafe.md) | TypeSafe は judge 候補になるか（調査のみ、導入していない） | 2026-10-31 | 不採用 |
| [research-human-labels-for-judges.md](research-human-labels-for-judges.md) | 人手ラベルで LLM judge を検証する作法と、30 件ラベルの扱い | 2026-10-31 | ラベルを探索用に格下げ |
| [research-context-dependent-escalation.md](research-context-dependent-escalation.md) | 文脈で正解が変わるエスカレーションをどう評価するか | 2026-10-31 | 04 設計（型 P / 型 E） |
| [research-evidence-strength.md](research-evidence-strength.md) | 文書が矛盾したとき、根拠の強さをどう順位づけるか | 2026-10-31 | 裁定の規則（冒頭に出典の注記） |
| [research-design-convergence.md](research-design-convergence.md) | 評価設計の反復レビューが収束しないのはなぜか、どう収束させるか | 2026-10-31 | walking skeleton への切り替え |
| [research-shortcut-and-overfitting.md](research-shortcut-and-overfitting.md) | 近道でも当たる正解と、評価セット・具体例へのハーネスの過適合をどう防ぐか | 2026-11-01 | `docs/planning/05-shortcut-resistance.md`（冒頭に照合メモ） |
| [research-next-steps-small-n.md](research-next-steps-small-n.md) | 少数回の試走で arm の差をどう判定するか。LLM に保留セルを作らせる作法、識別力、指示の効果、記録の書き換え、評価づくりの順序 | 2026-11-01 | `docs/planning/06-where-we-are.md` §6（冒頭に照合メモ） |
| [research-reusable-role-harness.md](research-reusable-role-harness.md) | 使い回せる役割分離ハーネスをどう作り、どう測るか（核と案件の差分、スキルの発火、役割分離の評価、移植の手間） | 2026-11-01 | `docs/planning/07-v1-and-cells.md`（冒頭に照合メモ） |
| [research-entry-and-runner-fit.md](research-entry-and-runner-fit.md) | 複数の役割から正しい 1 つに入るかをどう測るか。Harbor はこれからのセルに合うか、代わりは何か | 2026-11-01 | `docs/planning/07-v1-and-cells.md`（冒頭に照合メモ） |
| [research-experimental-method.md](research-experimental-method.md) | 小さく高価な反復実験を科学的に進める作法と、pit-crew の前提の棚卸し（14 個、それぞれの最も安い反証） | 2026-11-01 | `docs/planning/08-experiment-plan.md`（冒頭に照合メモ） |
| [research-when-separation-helps.md](research-when-separation-helps.md) | エージェントが実際に越境するのはどんな条件か。独立したレビューが効く条件と、識別力のあるセルの作り方 | 2026-11-01 | `docs/experiments/` EXP-06 以降（冒頭に照合メモと訂正） |
| [research-conventions-and-self-review.md](research-conventions-and-self-review.md) | 案件の約束は指示ファイルでどこまで守られるか（種類・長さ・規則の数）。同じ文脈の自己レビューは甘くなるか | 2026-11-01 | `docs/planning/09-direction-after-ceiling.md`（冒頭に照合メモ） |
| [research-override-cause.md](research-override-cause.md) | 委任で決まりごとが上書きされた原因（既定の git の指示、読む前の委任、言い方）と、それを見分ける実験、保留セルの作り方 | 2026-11-01 | EXP-14 以降（冒頭に照合メモ） |
| [research-ganbari-incidents.md](research-ganbari-incidents.md) | がんばりクエストでロールの規則が作られるきっかけになった実際の事故（28 件）と、その条件・再現できるか | 2026-11-02 | `docs/planning/11-dev-role-design.md`、評価計画 |
| [research-ecological-validity.md](research-ecological-validity.md) | 評価の課題を抽象化しすぎないには。実際の失敗から課題を作る作法、規則から外れやすい条件、実験室と現場の差 | 2026-11-02 | 評価計画（冒頭に照合メモ） |
| [research-phase-practices.md](research-phase-practices.md) | Dev・QM・PO・保守の各工程で、確立した作法は何を規定しているか（背景が不明なとき、調べる深さ、食い違い、公開スキルの粒度） | 2026-11-02 | `docs/planning/11-dev-role-design.md`（冒頭に照合メモ） |
| [research-ganbari-role-process-inventory.md](research-ganbari-role-process-inventory.md) | がんばりクエストの各ロール（Dev・QM・PO・Platform・監査）の工程ごとに、何が規定され何が欠けているか（考え方・調査の深さ・背景不明時・矛盾時）。文書どうしの食い違い 20 件 | 2026-11-02 | `docs/planning/11-dev-role-design.md`（冒頭に照合メモ） |
| [research-dev-quality-bar.md](research-dev-quality-bar.md) | Dev ロールの品質基準を、和田卓人さん・宮川達彦さんの公開された主張に根拠づける（工程ごとの原則、AI エージェントについての発言、足りない所と補う資料）。宮川さんの発言内容は音声のみで [未確認] が多い | 2026-11-02 | `docs/planning/11-dev-role-design.md`（冒頭に照合メモ） |
| [research-investigation-substeps.md](research-investigation-substeps.md) | 調査工程の内部の段階（問いの設計・調査計画・収集・整理・評価・統合・記録）、食い違うインプットの重み付け（競合仮説・三角測量・外部資料の格付け）、品質特性のトレードオフを調査で洗い出して順位を付ける作法（ATAM の効用木、AWS・SRE・性能予算の既定値、脅威モデリング） | 2026-11-02 | `docs/planning/11-dev-role-design.md` §4.1（冒頭に照合メモ） |
| [research-process-structure-for-agents.md](research-process-structure-for-agents.md) | 工程の定義をエージェントに渡す構造: フラットに工程を並べるか、大工程を判定してから詳細を読む階層か、混合か。大きな指示の害（文脈の圧迫・読み落とし、詳しく書いて良かった反証も）。1 スキルか工程別スキル（dev-research 等）か、核＋工程別の参照か、サブエージェントか | 2026-11-02 | 設計書 11 の構造、評価計画 12 §3（冒頭に照合メモ） |
| [research-testing-practice-evidence.md](research-testing-practice-evidence.md) | テストの現在の実務を実証で: 形（ピラミッド・トロフィー等）に比率の実証は無い、カバレッジと効き目、単体と結合の欠陥検出（差なし）、テストの保守費用、何を単体テストし何をしないか、AI エージェントのテストの薄さ。書き直し用の規則候補（層の選び方・書かないテスト・予算） | 2026-11-02 | 設計書 11 §4.3〜4.6（冒頭に照合メモ） |
| [research-proportional-process.md](research-proportional-process.md) | 規模・リスクに応じて工程を軽くする根拠（DORA・Google・JIT 品質保証）、t-wada のリスクマッピングと伴走 / 委託、TDD を当てる範囲、コード調査とデバッグの実証研究、レビュー層の費用と独立の確認の条件、道具の雛形の前提、ATAM の適用単位。書き直しの規則（軌道 T0〜T2 と工程 × 軌道の表） | 2026-11-02 | 設計書 11 の全工程（冒頭に照合メモ） |
| [research-variant-search-and-base.md](research-variant-search-and-base.md) | 同じ型の欠陥を探す手順（意味・構造・履歴で探す。補足修正の実証 Park MSR 2012、code peers、CP-Miner、誤った修正 Yin FSE 2011、variant analysis、git log -S/-G/-L）と、土台の比べ方（three-dot は merge-base からの差、two-dot は端点の比較。git 公式） | 2026-11-02 | 設計書 11 第 3 版の候補、EXP-25 |
| [research-eval-parallelism.md](research-eval-parallelism.md) | 評価の時間はどこで使われているか（実測: エージェントの実行の 98% はモデル API 待ち、Harbor はすでに `-n 3` で並行、ジョブの前置きが `/mnt/e` 上の課題のファイル数に比例）、並列化すべきか（Harbor・SWE-bench・Inspect の同時実行の設定、資源が得点を変える Anthropic の調査、PSI・Docker のメモリ上限・WSL のメモリ）。推奨: まず置き場所を ext4 へ移しメモリを実測、`-n` の引き上げは受け入れ制御と A/A 比較を通してから | 2026-11-03 | 評価の実行の段取り |
| [research-role-task-difficulty.md](research-role-task-difficulty.md) | ロール（PO・Dev・QM・review・maintenance）ごとの仕事の難易度をどう定義するか。7 軸（入力の粒度・広さ・解き方の確立・外部の制約・判断の重さ・モデルの視野の外の情報・長さと受け渡し）、ロールごとの 4 段と GQ の実例、process-compass の席との対応、既存セル（t1〜t9・s1・s2・h5-*）は Dev の D1〜D2 だけを覆うこと、上の段を決定的に採点する型と危険。付録にサブエージェント 3 本の全文 | 2026-11-03 | 成果物 1.0、1.1 の課題づくり |
| [research-process-evidence-evaluation.md](research-process-evidence-evaluation.md) | 主な量を「工程への準拠と根拠の裏付け」に変えたとき何をどう測るか。「結果で採点」は原文では条件つき（Anthropic）、順序は存在と先行関係だけを硬く見る（SOPBench・Declare）、工程 × 測る項目の表、出典を開いたかの決定的な判定（O/P/M/N/X/U と支持 S0〜S3、言い換えは段階化）、判断の理由と命名の項目（Zimmermann の ADR の誤り、Feitelson の命名）、judge のバイアスの数値と両方向の検証・摂動群・arm の書式の入れ替え、構成概念の混同（行動の事実と根拠の表明を分ける）、最初の実験の形。付録にサブエージェント 4 本の全文 | 2026-11-03 | 成果物 1.1 の主な量、2.1・2.3 |
| [research-role-task-catalog.md](research-role-task-catalog.md) | ロール（PO・技術判断（新設）・Dev・review・QM 出荷判定・maintenance）の仕事を一覧にし、状況から仕事を選ぶ規則をどう書き、選び間違いをどう測るか。仕事 43 件（入力 → 出力 → 渡す先、GQ・process-compass の実例）、宛先 → 仕事 → 深さの 3 段の規則（DACI・process-compass の `/pit` と ADR-0008/0014/0054/0066・ITIL の記録の種類・Cynefin）、選び間違いの 5 型（越境・取りこぼし・過剰な上げ・浅すぎ・重すぎ）と実例、セルの述語・台本の対照・危険 | 2026-11-04 | 成果物 1.2 |
| [research-machine-only-rationale-evaluation.md](research-machine-only-rationale-evaluation.md) | 判断の理由・工程の中身の質を、人の判定も人のラベルも使わずに測り検証するには（オーナー 2026-11-04「人間が評価しなければならなくなった時点で評価基盤としては破綻」）。人無しの正解は 3 種（構成で決まるラベル・植え込んだ正解・不変 / 単調の関係）、judge の多数決・一致は検証に使えない（条件付き独立の破れ）、SEURAT 型の構造推論・Dung の受理可能性・非劣性、PRM 型の MC 再実行で理由の因果の寄与、読み手モデルの simulatability 差分、PMI / 規則依存の差 / Vendi / 被覆の欠陥検出器、方法 26 件の順位表、判断の点ごとの出力（correct / coherent / communicable Δ / causal Δ）、最初に作る 6 段、人無しでできないこと 9 件 | 2026-11-04 | E 系列の測り方の置き換え（設計書 23 §3.3・§4・§5 の改訂の材料） |
| [research-qm-review-role.md](research-qm-review-role.md) | review（独立レビュー、G-6）と QM（出荷判定、G-7）のロールをどう設計し測るか。設計書 11 の書式に落とした工程案（review V0〜V6 / QM S0〜S5、深さ R1〜R4 / S1〜S3 × 工程）と原則 Y1〜Y14（読んでから判定し開いた証拠を残す・主張ではなく実物・権限外に答えず回す・作成者 ≠ 承認者・CI は最後・止める範囲の限定・未確認の一覧）、QM / review 固有の B 系列 16 本と既存の採点器（`read-before` / `grounding` / `phases` / `state.gh`）との対応と新規に要るもの、セルの構成要素 8 種・段別の型・台本の対照 7 種・3 つの比べる相手（v1 に review 専用 skill は無い）、外部の実証（コードレビューの効き目・AI レビュアの失敗の型・出荷判定の作法・独立性の規格）、オーナーに聞くこと 9 件と決定（§7.1: 独立レビューと出荷判定は両方 QM でスキル 2 本 + 共通原則 / AI の判定の扱いは事業フェーズで選ぶアダプタの値 / 「review」は修正役 fix = 会社の rereview、QM は修正を書かない） | 2026-11-04 | 設計書 `docs/planning/26-qm-role-design.md` |
| [research-enterprise-harness-thoughtworks-radar-35.md](research-enterprise-harness-thoughtworks-radar-35.md) | Thoughtworks Technology Radar Vol. 35 と連動ブログ「The harness is a product」から、「エンタープライズハーネス」の体系と原則（ハーネスのプロダクト化・生きた資産・評価なき変更の禁止・自己改善ループのガバナンス・マーケットプレイス流通）をどう捉え、pit-crew / pit-wall の ADR に落とし込むか | 2026-11-08 | ADR-0001 策定（Issue #4）および設計方針の根拠 |
