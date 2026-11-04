# フェーズ別実務慣行の調査 — Dev / QM / PO / 保守ロールのハーネス設計向け

調査日: 2026-11-02 / 目的: Claude Code 向けの役割分離ハーネスで、各ロールのワークフローをフェーズ単位で細かく規定するための根拠を集める。


## 照合メモ（設計者、2026-11-02）

- Anthropic 公式の feature-dev プラグイン（claude-plugins-official/plugins/feature-dev/commands/feature-dev.md）を原文で確認: Phase 1 Discovery / 2 Codebase Exploration / 3 Clarifying Questions（「CRITICAL … DO NOT SKIP」）/ 4 Architecture Design / 5 Implementation（「DO NOT START WITHOUT USER APPROVAL」）/ 6 Quality Review / 7 Summary
- GitHub Spec Kit の specify テンプレート（templates/commands/specify.md）を原文で確認: 「Use reasonable defaults for unspecified details (document assumptions in Assumptions section)」「LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total」「No [NEEDS CLARIFICATION] markers remain」（次の段に進む条件）
- 文書と実装の食い違いの優先順位は一次資料に無く、本文の扱いは [推論]（本文の記述どおり）。設計書ではこの点を [推論] として扱い、文書の裁定の既存の規則（オーナーの裁定手順、`research-evidence-strength.md`）とつなぐ

## 根拠ラベル

| ラベル | 意味 |
|---|---|
| [一次] | 本人・公式の原文を今回取得して確認した |
| [二次] | 第三者の要約・解説、または検索結果の要約でしか確認できていない |
| [推論] | 上の 2 つから本調査が導いた設計判断。出典の主張ではない |
| [未確認] | 原典を当たれなかった。採用前に確認が必要 |

**注意（取得の限界）**: WebFetch は小型モデルが要約を返す仕組みのため、[一次] とした引用も「原文ページを取得したうえでの抜粋」であり、全文を目視したわけではない。数値や逐語引用をスキルに書き込む前に、該当 URL をもう一度開いて確認すること。

---

## 0. 結論の先出し

1. **フェーズの骨格はどの資料でもほぼ同じ**で、「読む → 不明点を問う → 案を複数出して選ぶ → テストを先に置く → 最小の実装 → 自分以外が検証する → 記録する」に収まる。Anthropic 公式の feature-dev プラグイン（7 フェーズ、125 行）がこの骨格をそのまま持っている [一次]。
2. **不明点の扱いは「全部聞く」でも「全部推測する」でもない**。GitHub Spec Kit は「業界標準で推測し、Assumptions 節に記録する。聞くのはスコープ・セキュリティ・UX に大きく効き、合理的な既定値がないものだけ、最大 3 件」と上限まで決めている [一次]。この規則がエージェント向けに最も転用しやすい。
3. **調査の深さは「可逆性 × 誤ったときのコスト × 新規性」で決める**。Bezos の Type 1 / Type 2 決定 [一次]、Cynefin の領域別の進め方 [二次]、Anthropic の研究エージェントの「質問の複雑さに合わせて工数を変える」規則 [一次] が同じ方向を指す。
4. **エージェント特有の失敗は「やりすぎ」「完了宣言が早い」「検証せずに完了扱い」**の 3 つで、Anthropic の長時間ハーネス記事が実測として報告している [一次]。各フェーズの終了条件は「証拠（実行したコマンドと出力）」で定義すべき。
5. **スキルの長さ**: Anthropic は SKILL.md 本文 500 行未満を推奨 [一次]。公開例は 1 フェーズ 100〜350 行（約 400〜3,000 語）が実勢 [一次: 本調査で行数計測]。

---

## Q1. Dev の各フェーズ

各フェーズで「考え方 / 調査範囲 / 深さ / 背景不明時 / 矛盾時 / 入口・出口 / 成果物」を表にし、その後に候補規則を表で示す。

### 1-1. 調査（Investigation / Research）

| 観点 | 内容 |
|---|---|
| 考え方 | 変更する前に読む。開いていないコードについて推測で語らない [一次: Anthropic prompting best practices]。柵の理由がわからないうちは撤去しない（Chesterton's fence）[二次] |
| 調査範囲 | 対象機能・類似機能・アーキテクチャ・呼び出し元。feature-dev は観点の違う探索エージェントを 2〜3 本並列に出し、各々に「読むべき重要ファイル 5〜10 本」を返させる [一次] |
| 深さ | §Q3 の判定に従う。外部 API・公開挙動を変える場合は、契約外の挙動にも依存者がいる前提で広げる（Hyrum's Law [一次]） |
| 背景不明時 | §Q2 |
| 矛盾時 | §Q2。挙動を変える前に、現在の挙動を特性テスト（characterization test）で固定する [二次: Feathers] |
| 入口 | チケットがあり、何が「完了」かの暫定定義がある |
| 出口 | 調査メモ（読んだファイル・現状挙動・影響範囲・未解決の問い）が書かれ、問いが「質問する / 仮定して進む / スパイクする」のいずれかに振り分け済み |
| 成果物 | 調査メモ（Spec Kit では `research.md` [一次]） |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 開いていないファイルについて主張しない。参照されたファイルは必ず読む | 推測による誤答を防ぐ | [一次] https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| 探索は観点を分けて並列に出し、各探索に「重要ファイル一覧」を返させ、本体がそれを読む | 要約だけで設計すると細部を落とす | [一次] https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/feature-dev/commands/feature-dev.md |
| 検索は短く広い問いから始め、結果を見て絞る | 長く具体的すぎる問いは結果が少ない | [一次] https://www.anthropic.com/engineering/multi-agent-research-system |
| 一次資料を SEO 記事より優先する | 初期の研究エージェントはコンテンツファームを選びがちだった | [一次] 同上 |
| 公開挙動を変える場合は、契約に書かれていない挙動の利用者も影響範囲に数える | 「観測可能な挙動はすべて誰かに依存される」 | [一次] https://www.hyrumslaw.com/ |
| 既存挙動を変える前に、現在の挙動を記録するテストを書く | 意図しない変化を検出する足場 | [二次] https://www.oreilly.com/library/view/working-effectively-with/0131177052/gloss.html |
| 不具合調査は根本原因の調査を先に済ませる。3 回修正に失敗したら設計を疑い、4 回目に進まない | 推測修正の連鎖を止める | [一次] https://github.com/obra/superpowers （systematic-debugging） |
| 答えが不確かな問いは時間を区切ったスパイクに切り出す | 調査が底なしになるのを防ぐ | [二次] https://en.wikipedia.org/wiki/Spike_(software_development) , https://www.mountaingoatsoftware.com/blog/spikes |

### 1-2. 要件の明確化（調査と設計の間。PO との接点）

| 候補規則 | 理由 | 出典 |
|---|---|---|
| ストーリーは INVEST（独立・交渉可能・価値・見積可能・小さい・テスト可能）で点検する。特に T:「テストを書けるほど理解しているか」 | テストを書けない要件は実装できない | [一次] https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/ |
| ルール（青）と具体例（緑）と未解決の問い（赤）を分けて書き出す。問いが多いならまだ着手しない | 「赤いカードだらけなら、まだ学ぶことが多い」 | [一次] https://cucumber.io/blog/bdd/example-mapping-introduction/ |
| Example Mapping は 1 ストーリー約 25 分で区切る | 時間内に収まらないなら大きすぎるか理解不足 | [一次] 同上 |
| 業務・開発・テストの 3 視点（three amigos）で見る。エージェントでは 1 体に 3 役を順に演じさせるか、別エージェントに分ける | 「何を解くか」「どう作るか」「何が起こりうるか」を落とさない | [二次] https://agilealliance.org/glossary/three-amigos |
| 不明点はまず推測と Assumptions 記録で埋め、聞くのは「スコープ・UX に大きく効く／解釈が複数ある／合理的既定値がない」ものだけ、最大 3 件 | 質問攻めでも無断推測でもない中間 | [一次] https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/specify.md |
| 質問の優先度は スコープ > セキュリティ/プライバシー > UX > 技術詳細 | 影響の大きい順 | [一次] 同上 |
| 明確化の質問は 1 回に 1 問、全体で最大 5 問。各問に「なぜ重要か」を 1 文添え、選択肢と推奨を付ける | 回答者の負担と回答品質 | [一次] https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md |
| 「お任せ」と言われたら推奨を示して明示的な確認を取る | 委任を黙認と混同しない | [一次] feature-dev（上掲） |
| 用語は業務側と開発側で同じ語を使い、コード上の名前と一致させる（ユビキタス言語）。語が変わる境界はコンテキストの境界 | 曖昧な語はソフトウェアが扱えない | [一次] https://martinfowler.com/bliki/UbiquitousLanguage.html , https://martinfowler.com/bliki/BoundedContext.html |
| Definition of Ready を使うなら関門ではなく点検表として扱う | DoR は Scrum Guide に定義されていない（Scrum Guide にあるのは「1 スプリントで Done にできる項目は選択可能」という条件のみ） | [一次] https://scrumguides.org/scrum-guide.html 。DoR を関門化する弊害の論評は [未確認]（Scrum.org 記事は取得失敗） |

### 1-3. 設計

| 観点 | 内容 |
|---|---|
| 考え方 | 根本的に異なる案を 2 つ以上出して比べる（Design it Twice）[二次: Ousterhout 第 11 章の要約]。最も単純な案から始め、必要なときだけ複雑にする [一次: Building effective agents] |
| 入口 | 調査メモと明確化済みの要件（未解決の問いは Assumptions に記録済み） |
| 出口 | 推奨案と却下案の比較が書かれ、承認者（人間または PO ロール）の承認が記録されている |
| 成果物 | 小さな変更: 1〜3 ページのミニ設計書 / 構造・依存・インターフェース・非機能に関わる決定: ADR |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 設計書は「背景と範囲 / ゴールと非ゴール / 設計 / 検討した代替案 / 横断的関心事（セキュリティ・プライバシー・可観測性）」で書く | 代替案の節が最も重要: 選んだ案が最善である理由を示す | [一次] https://www.industrialempathy.com/posts/design-docs-at-google/ |
| 解が曖昧でなくトレードオフが少ないなら設計書を書かない。代替案のない「実装手順書」は書かない | オーバーヘッドだけが残る | [一次] 同上 |
| 小さな変更は 1〜3 ページ、大きな案件は 10〜20 ページが目安 | 読み切れる量 | [一次] 同上 |
| 構造・非機能特性・依存・インターフェース・構築技法に影響する決定は ADR に残す（文脈 / 決定 / 状態 / 結果）。覆すときは古い ADR を消さず superseded にする | 後から「なぜ」を辿れる | [一次] https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions |
| 案は「最小変更」「クリーンな構造」「実用的なバランス」の 3 方向で出し、推奨と理由を付けて選ばせる | 比較の軸を固定すると案がぶれない | [一次] feature-dev（上掲） |
| 計画には簡素性ゲート（将来対応をしない・フレームワークを直接使う・抽象を足さない）を置き、破るなら理由を記録する | 過剰設計の抑止 | [一次] https://raw.githubusercontent.com/github/spec-kit/main/spec-driven.md |
| 実装開始は承認後のみ | 間違った問題を解くことを防ぐ | [一次] feature-dev「DO NOT START WITHOUT USER APPROVAL」、superpowers brainstorming「設計書が承認されるまで何も作らない」 |
| 計画は 2〜5 分で終わる粒度のタスクに分け、各タスクにファイルパスと検証手順を書く | 実行側の解釈の余地を減らす | [一次] https://github.com/obra/superpowers （writing-plans） |

### 1-4. テスト設計

| 観点 | 内容 |
|---|---|
| 考え方 | 実装構造ではなく観測可能な挙動をテストする。テストはピラミッドの下層へ寄せる [一次: Fowler] |
| 技法 | ブラックボックス（同値分割・境界値・デシジョンテーブル・状態遷移・ユースケース）、ホワイトボックス、経験ベースの 3 分類 [二次: ISTQB CTFL v4.0 の解説。シラバス原本は未取得]。入力空間が広い場合は性質ベーステスト [一次: Hypothesis] |
| 入口 | 受け入れ条件が「テスト可能」な形になっている |
| 出口 | テストリスト（シナリオの一覧）が書かれ、各受け入れ条件がどのテストで確かめられるか対応が取れている |
| 成果物 | テストリスト、受け入れ条件 × テストの対応表 |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 最初に「カバーしたいシナリオの一覧」を書く。一覧に実装上の判断を混ぜない | Canon TDD の第 1 段階。一覧は挙動に限る | [一次] https://newsletter.kentbeck.com/p/canon-tdd |
| 粒度の違うテストを書き、上位ほど本数を減らす | テストピラミッドの 2 原則 | [一次] https://martinfowler.com/articles/practical-test-pyramid.html |
| 上位テストだけが失敗したら、同じ欠陥を捕まえる下位テストを足す | テストを可能な限り下層へ押し下げる | [一次] 同上 |
| 内部構造をユニットテストに写さない。観測可能な挙動を検証する | 実装変更で壊れる脆いテストを避ける | [一次] 同上 |
| 各入力について同値クラスと境界を列挙し、境界の両側を 1 件ずつ取る | 既知の欠陥集中箇所 | [二次] ISTQB CTFL v4.0 解説（例: https://study.astqb.org/?p=22 ） |
| 「すべての入力で成り立つ性質」が書ける箇所（変換の往復、不変条件）は性質ベーステストを使う | 想定外の端のケースを機械に探させる | [一次] https://hypothesis.readthedocs.io/en/latest/ |
| DB を使う統合テストはモックより実 DB を優先する | モックは実環境との差を隠す | [一次] Spec Kit Article IX（spec-driven.md） |

### 1-5. テスト実装（Red）

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 一覧から 1 件だけ具体的なテストにする。一覧を先に全部テスト化しない | 途中で分かったことが後のテストを無効にする | [一次] Canon TDD |
| テストを走らせ、期待した理由で失敗することを確認してから実装に移る | 最初から通るテストは何も検証していない | [一次] Cursor https://cursor.com/blog/agent-best-practices 、superpowers TDD「Watch it fail」 |
| テストを先にコミットし、実装時は「テストを変更しない」と指示する | エージェントがテストを書き換えて通すのを防ぐ | [一次] Cursor（上掲） |
| アサーションのないテストを書かない。実測値を期待値に貼り付けない | TDD の二重確認が無効になる | [一次] Canon TDD |
| テストより先に書いたコードは消して書き直す | 後付けテストは実装に合わせてしまう | [一次] superpowers TDD「Delete means delete」（強い流派の規則。採否は要判断 [推論]） |

### 1-6. 実装（Green → Refactor）

| 観点 | 内容 |
|---|---|
| 考え方 | テストを通す最小の変更。グリーンになってから整える [一次: Canon TDD]。依頼された以上の変更・抽象・防御コードを足さない [一次: Anthropic] |
| 入口 | 失敗するテストがあり、承認済みの設計がある |
| 出口 | 全テスト・型検査・lint が通り、その実行コマンドと出力が記録されている |
| 成果物 | 小さく自己完結した差分（目安 100 行、1,000 行は大きすぎ [一次: Google]）、関連テストを同じ差分に含める |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 要求された変更と明らかに必要な変更だけを行う。バグ修正で周辺を掃除しない。1 回限りの処理に helper を作らない。起こりえない状況の防御コードを書かない（検証は外部境界でのみ） | 現行モデルは過剰設計に寄りやすい | [一次] Anthropic prompting best practices（overengineering 節） |
| テストケースに合わせて値をハードコードしない。テストが誤っていると思ったら回避せず報告する | テストは正しさの検証であって解の定義ではない | [一次] 同上 |
| 緑にする作業と整理を混ぜない。整理は今のセッションに必要な範囲だけ。重複は「ヒントであって命令ではない」 | 早すぎる抽象化を避ける | [一次] Canon TDD |
| 1 度に 1 機能だけ進め、終わるたびにコミットと進捗記録を残す | 一度に全部作ろうとして途中でコンテキストが尽きる失敗が観測された | [一次] https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| 10 行を超えそうな独自実装の前に既存 OSS / 標準機能を探す。フレームワーク機能はラップせず直接使う | 車輪の再発明と抽象の増殖を防ぐ | [一次] Spec Kit Article VIII。10 行という閾値は本リポジトリの運用値で外部根拠ではない [推論] |
| 1 差分は 1 つの自己完結した変更。関連テストを同じ差分に入れる | レビューが速く、バグが入りにくく、戻しやすい | [一次] https://google.github.io/eng-practices/review/developer/small-cls.html |

### 1-7. テスト評価

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 「通った」と言う前に、その主張を証明するコマンドを特定し、今そのメッセージ内で実行し、出力を読む。出力を報告に添える | 証拠なしの完了宣言が最頻の失敗 | [一次] superpowers verification-before-completion、Claude Code best practices「ask Claude for evidence」 https://code.claude.com/docs/en/best-practices |
| カバレッジは未テスト箇所を探す道具として使い、数値目標にしない | 目標化すると水増しされる。80 台後半〜90 台は丁寧なテストの結果として出る数字 | [一次] https://martinfowler.com/bliki/TestCoverage.html |
| テストの効き目を疑う場合は差分に限ったミューテーションテストを使う。カバーされていない行や「乾いた行」は対象から外す | Google は差分ベースで変異体を絞り、コードレビューに表示している | [一次] https://research.google/pubs/state-of-mutation-testing-at-google/ |
| 不安定なテストは隔離し、速やかに直すか削除する。無視され始めたテストは無価値 | 非決定性はスイート全体の信頼を壊す | [一次] https://martinfowler.com/articles/nonDeterminism.html |
| ユニットテスト・型検査で終えず、アプリを起動して結果を見る（E2E / ブラウザ） | ブラウザ自動化を明示的に使わせると E2E 検証の質が大きく上がった | [一次] effective-harnesses 記事、Claude Code best practices（/verify） |
| 自己評価だけで終えず、作った文脈を見ていない別エージェントに仕様と照合させる。「スタイルは無視」を明示する | 問題を探せと言われたレビュアーは必ず何かを見つけ、全部直すと過剰な抽象とありえないケースのテストが増える | [一次] Claude Code best practices |

### 1-8. 手戻り（レビュー指摘への対応）

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 最初に「指摘の意図を理解したか」を問う。不明な項目があれば、着手前にまとめて質問する | 部分理解のまま直すと別の誤りを生む | [一次] https://google.github.io/eng-practices/review/developer/handling-comments.html 、superpowers receiving-code-review |
| 説明はレビューツールでなくコードに書く（コードを明確にし、それでも足りなければコメント） | 将来の読み手はレビューのやり取りを見ない | [一次] Google handling-comments |
| 指摘は鵜呑みにせずコードベースの実態と照合する。誤っていれば技術的根拠で反論する。迎合表現（「素晴らしい指摘です」）を使わない | 技術的正しさを社交より優先 | [一次] superpowers receiving-code-review |
| 検証できない指摘は「X がないと確認できない。調査/質問/続行のどれにするか」と明示する | 推測で直さない | [一次] 同上 |
| 合意できなければ技術的事実で議論し、なお割れるならエスカレーションする。差分を放置しない | 事実とデータは意見に優先する | [一次] https://google.github.io/eng-practices/review/reviewer/standard.html |
| 進行中のエージェントを直し続けるより、変更を戻して計画を直して再実行するほうが速いことが多い | 汚れた文脈を引きずらない | [一次] Cursor agent best practices |

### 1-9. エージェント向けワークフロー資料の扱い

| 資料 | 内容 | 状態 |
|---|---|---|
| Claude Code best practices（現行版） | 「Claude ができないことを伝える」「実行できるチェックを渡す」「例外を許さない規則は hook で強制する」の 3 本柱。仕様が固まらないときは「仕様が書けるまで私にインタビューして SPEC.md に書いて」と頼む | [一次] https://code.claude.com/docs/en/best-practices |
| Explore → Plan → Code → Commit | 旧版の Anthropic 記事にあった 4 段の流れ | **現行ページには見当たらない**（2026-11-02 取得版で「explore」は Explore サブエージェントの説明 1 箇所のみ）。旧版の内容は二次資料でのみ確認 [二次] |
| 「think hard」等の語 | 現行版は「普通のプロンプト文で、思考量の主な制御は effort 設定」と明記。`ultrathink` は 1 ターン限りで有効 | [一次] 同上。**ハーネスに「think hard と書け」と規定しない** [推論] |
| Anthropic feature-dev プラグイン | Discovery → Codebase Exploration → Clarifying Questions（「DO NOT SKIP」）→ Architecture Design → Implementation（承認必須）→ Quality Review → Summary。125 行・約 700 語 | [一次] 上掲 URL |
| GitHub Spec Kit | constitution → specify → clarify → plan → tasks → analyze → implement。成果物 spec.md / plan.md / research.md / data-model.md / contracts/ / quickstart.md / tasks.md。曖昧点は `[NEEDS CLARIFICATION: 問い]` で埋め込み、残っていれば spec 未完 | [一次] https://github.com/github/spec-kit , spec-driven.md |
| Kiro specs | requirements.md（不具合は bugfix.md: 現状・期待・変えない挙動）→ design.md → tasks.md。各段でレビュー可能。Quick Spec は承認段階なし | [一次] https://kiro.dev/docs/specs/ （EARS 記法はこのページでは確認できず [未確認]） |
| BMAD Method | 現行サイトは Clarify → Plan → Build and verify → Learn and adjust のループ。「小さな変更は直接 build、複雑な仕事は必要な深さを」 | [一次] https://docs.bmad-method.org/ 。旧版の Analyst / PM / Architect / SM / Dev / QA 役割と 4 フェーズは現行トップページでは確認できず [未確認] |
| OpenAI Codex | 複雑・曖昧・説明しにくいタスクは先に計画させる。AGENTS.md は短く正確に、繰り返し起きた誤りを見てから規則を足す。「完了」の定義を書く | [一次] https://learn.chatgpt.com/guides/best-practices |
| Cursor | 「最も効く変更はコーディング前の計画」。小さな変更や慣れた作業には詳細計画は不要 | [一次] https://cursor.com/blog/agent-best-practices |

---

## Q2. 背景・目的が不明なとき、文書と実装が矛盾するとき

### 2-1. 「聞く / 調べる / 仮定して決める」の判定

| 状況 | 行動 | 根拠 |
|---|---|---|
| 答えがリポジトリ・チケット・既存文書から得られる | 調べる。聞かない | Claude Code best practices は「リポジトリを読めば分かることは書くな」と言う。裏返せば、読めば分かることを人に聞くのは無駄 [一次→推論] |
| 合理的な既定値があり、外れても戻せる（Type 2） | 仮定して進み、Assumptions に記録する | Spec Kit specify「業界標準で推測し、Assumptions 節に記録」[一次]、Bezos「Type 2 は素早く決めてよい」[一次] |
| スコープ・セキュリティ/プライバシー・UX に大きく効き、解釈が複数あり、既定値がない | 聞く（上限 3〜5 問、1 問ずつ、選択肢と推奨付き） | Spec Kit specify / clarify [一次] |
| 不可逆・高コスト（Type 1: データ削除、課金、公開 API、スキーマ） | 聞く。承認を記録してから進む | Bezos「Type 1 は慎重に、熟慮と相談をもって」[一次] |
| 答えが誰にも分からない（技術的に未知） | 時間を区切ったスパイクで調べる | Example Mapping の赤カード [一次]、スパイク [二次] |
| 人間が「お任せ」と言った | 推奨を示し、明示的な確認を取る | feature-dev [一次] |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 推測で埋めた箇所は必ず仮定一覧（assumption log）に「仮定・根拠・外れたときの影響・確認方法」で残す | 推測そのものより、推測が見えないことが問題 | Spec Kit の Assumptions 節 [一次]。4 列の形式は本調査の提案 [推論]。PMBOK の assumption log は [未確認] |
| 未解決の問いは本文に埋め込んだマーカーで残し、マーカーが残っている間は次フェーズに進めない | 機械的に検出できる関門になる | Spec Kit「No [NEEDS CLARIFICATION] markers remain」[一次] |
| 質問が上限を超えるなら、影響 × 不確実性の上位だけ聞き、残りは「保留」と理由を書く | 質問攻めを避ける | Spec Kit clarify [一次] |
| 決定は会話でなく残る場所（ADR / チケット / PR）に書く | 会話は消える。ADR は覆しても残す | Nygard ADR [一次] |

### 2-2. 文書と実装（とチケット）が食い違うときの証拠の序列

確立した単一の序列は見つからなかった [未確認]。以下は確認済みの原則からの組み立て [推論]。

| 問い | 何を正とするか | 根拠 |
|---|---|---|
| 「今システムは何をしているか」 | 実装（実行して観測した挙動 > コードを読んだ解釈 > 文書） | Hyrum's Law: 観測可能な挙動には依存者がいる [一次]。特性テストは「あるべき挙動」でなく「実際の挙動」を記録する [二次] |
| 「システムは何をすべきか」 | 意図を記録した文書（承認済みの ADR / 設計書 / 受け入れ条件）。ただし日付と状態（superseded か）を確認する | ADR は状態と superseded を持つ [一次] |
| 両者が食い違う | どちらかを黙って直さない。(1) 現在の挙動を特性テストで固定 (2) 食い違いを記録 (3) どちらが正かを PO / 設計責任者に判定してもらう。チケットの範囲外なら別チケットに切り出す | [推論]。Google review「チケットの範囲を超えた改善を混ぜない」の趣旨は small CLs [一次] から |
| チケットが既存設計と矛盾する | 実装前に止めて PO に返す。Type 2 で明白な誤記なら仮定を記録して進む | [推論] Bezos の区分を適用 |

### 2-3. エスカレーション基準（候補）

| 条件 | 根拠 |
|---|---|
| 不可逆な操作、または誤ったときのコストが大きい | Bezos Type 1 [一次] |
| 同じ問題で 3 回修正に失敗した | superpowers systematic-debugging [一次] |
| レビューで合意できない | Google eng-practices: TL / メンテナ / マネージャへ [一次] |
| テストや要件自体が誤っている、または実現不能と判断した | Anthropic「回避せず知らせよ」[一次] |
| 自動モードで連続して拒否された（Claude Code は 3 連続 / 計 20 回で人間に戻す） | Claude Code best practices [一次]。ハーネスの停止条件の参考値 [推論] |

---

## Q3. 調査の深さ

| 判定軸 | 浅くてよい | 深い調査（deep research）が要る | 出典 |
|---|---|---|---|
| 可逆性 | 戻せる（Type 2） | 戻せない（Type 1） | [一次] Bezos 2015 年株主書簡 https://www.sec.gov/Archives/edgar/data/1018724/000119312516530910/d168744dex991.htm |
| 因果の見通し | 既知の手順で解ける（Cynefin の Clear: 感知→分類→対応） | 専門的分析が要る（Complicated: 感知→分析→対応）／やってみないと分からない（Complex: 探査→感知→対応、失敗してよい小実験） | [二次] https://en.wikipedia.org/wiki/Cynefin_framework |
| 新規性 | リポジトリ内に類似実装がある | 初めての技術・外部仕様・法令 | [推論] |
| 影響範囲 | 1 モジュール内 | 公開 API・スキーマ・課金・認証・データ | [推論]、Hyrum's Law [一次] |
| 問いの種類 | 単純な事実確認 | 比較・横断調査 | Anthropic: 単純な事実確認は 1 エージェント・ツール呼び出し 3〜10 回、直接比較は 2〜4 サブエージェント・各 10〜15 回、複雑な研究は 10 体以上 [一次] |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| 調査の前に「この問いはどの深さか」を宣言し、上の表で判定した理由を 1 行残す | 単純な問いへの過剰投資が初期の典型的失敗 | [一次] multi-agent research system |
| スパイクには必ず時間枠を付ける（最大 1 スプリント、エージェントならツール呼び出し回数や時間で） | 時間枠がないと底なしになる | [二次] mountaingoatsoftware / Wikipedia（上掲） |
| 停止規則: 問いに答える証拠が揃った時点で止める。存在しない資料を探し続けない。見つからないなら「見つからなかった範囲」を書いて止める | 研究エージェントは結果が揃った後も探し続けた | [一次] multi-agent research system。「探した範囲を書く」は本リポジトリの OSS 先調査ルールと同型 [推論] |
| 深さを上げる手段は effort 設定または `ultrathink` で、プロンプトの「よく考えて」ではない | 現行 Claude Code の仕様 | [一次] Claude Code best practices |
| 他人が書いたコードのバグ・不安定テスト・スキーマ変更（旧形の読み手を全部探す）は深い側に倒す | 見落としやすいケースの例として公式が挙げている | [一次] 同上（effort を上げる場面として） |
| 不安定な状況（障害中）は先に止血し、その後で分析する | Cynefin の Chaotic（行動→感知→対応）、SRE の「十分なデータで動きつつ仮定を疑う」 | [二次] Cynefin、[一次] https://sre.google/sre-book/being-on-call/ |

---

## Q4. QM / PO / 保守

### 4-1. QM（レビュー・品質ゲート）

| フェーズ | 内容 | 出典 |
|---|---|---|
| 受付 | 1 営業日以内に応答する。小さな差分を求める（100 行目安、1,000 行は大きすぎ） | [一次] https://google.github.io/eng-practices/review/reviewer/speed.html , small-cls.html |
| 文脈把握 | 差分だけでなく広い文脈で見る。仕様（チケット・SPEC）と照合する | [一次] looking-for.html、Claude Code best practices |
| 観点 | 設計（最重要）→ 機能 → 複雑さ → テスト → 命名 → コメント → スタイル → 一貫性 → 文書 → 全行 → 文脈 → 良い点 | [一次] https://google.github.io/eng-practices/review/reviewer/looking-for.html |
| 判定 | コード全体の健全性を確実に改善するなら、完璧でなくても承認する。悪化させる変更は緊急時以外通さない | [一次] standard.html |
| 指摘 | 必須と任意を分ける（任意は「Nit:」）。事実とデータは意見に優先。スタイルはスタイルガイドが決める | [一次] standard.html |
| 独立性 | 実装の推論を見ていない別のレビュアー（新しいサブエージェント、編集権限なし）に見させる | [一次] Claude Code best practices（tools を Read/Grep/Glob に限定すれば強制できる） |
| 出口 | 承認 / 条件付き承認（LGTM with comments: 作者が直すと信頼できる・任意の指摘のみ）/ 差し戻し | [一次] speed.html |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| レビュアーに「正しさに関わる欠落だけ報告、スタイルは無視」と範囲を指定する | 全指摘対応は過剰な抽象を生む | [一次] Claude Code best practices |
| 「全テスト通過」の申告を信じず、実行コマンドと出力（または SS）を要求する | 申告は証拠ではない | [一次] 同上 |
| 決定的に守らせたい規則はレビューでなく hook / CI で強制する。prompt / agent 型 hook は決定的でない | レビューは確率的 | [一次] 同上 |
| 品質ゲートは Definition of Done（増分が満たすべき品質基準の正式な記述）として明文化する | Scrum の必須要素 | [一次] Scrum Guide |
| カバレッジ数値をゲートにせず、未カバー行をレビューで確認する | 数値目標は水増しを招く | [一次] Fowler TestCoverage |

### 4-2. PO（バックログ・要求・受け入れ）

| フェーズ | 内容 | 出典 |
|---|---|---|
| 目的 | プロダクトの価値の最大化に責任を持つ。PO は 1 人で、委員会ではない | [一次] Scrum Guide |
| バックログ管理 | プロダクトゴールを定め、項目を並べ、透明にする | [一次] 同上 |
| リファインメント | 項目をより小さく精密に分解し定義する | [一次] 同上 |
| 準備完了 | 1 スプリントで Done にできる項目が選択可能 | [一次] 同上 |
| 受け入れ条件 | INVEST の T を満たす。ルールと具体例に分ける（Example Mapping）。Gherkin 等の実行可能な例にできる | [一次] xp123 / cucumber.io |
| 受け入れ | スプリントレビューで成果を検査し、次の適応を決める | [一次] Scrum Guide |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| チケットに「解決する問題（なぜ）」「受け入れ条件（ルール＋具体例）」「非ゴール」「未解決の問い」を必須欄として置く | 背景不明の手戻りを入口で止める | INVEST / Example Mapping / Google design docs の非ゴール [一次] の組み合わせ [推論] |
| 受け入れ条件はそれぞれテストで確認できる形にする。曖昧な語（「改善」「適切に」）を使わない | テスト不能な条件は検収できない | [一次] Spec Kit「Each requirement must be testable」、SRE workbook の action item も同じ規則 |
| 受け入れはチケットのクローズでなく、動く成果物の確認で行う | Sprint Review は成果の検査 | [一次] Scrum Guide |
| 判断を委ねる問いは、選択肢・推奨・理由を添えて 1 問ずつ出す | 回答者の負担を下げる | [一次] Spec Kit clarify |

### 4-3. 保守（運用・トイル削減・障害フォロー）

| フェーズ | 内容 | 出典 |
|---|---|---|
| トイルの識別 | 手作業・反復・自動化可能・戦術的・持続的価値なし・サービス成長に比例して増える作業 | [一次] https://sre.google/sre-book/eliminating-toil/ |
| 上限 | 運用作業（トイル）を各 SRE の時間の 50% 未満に保つ | [一次] 同上 |
| 計測 | 人の労力を表す単位を決め、削減の前・中・後で継続計測する。勘に頼らない | [一次] https://sre.google/workbook/eliminating-toil/ |
| 優先順位 | 修正コストと節約時間でランク付けし、バグとして追跡する | [一次] 同上 |
| 対策の順 | ①そのトイル自体を断る ②発生源で取り除く ③小さく始めて自動化 ④ SLO で無視してよい作業を決める | [一次] 同上 |
| ポストモーテム起票条件 | 利用者に見える停止・劣化が閾値超え / あらゆるデータ損失 / オンコールの介入（ロールバック等）/ 解決時間が閾値超え / 監視の失敗（手動で発見）。条件は事前に決める | [一次] https://sre.google/sre-book/postmortem-culture/ |
| ポストモーテムの原則 | 非難しない（個人やチームを責めず寄与要因を特定）。レビューされないポストモーテムは存在しないのと同じ | [一次] 同上 |
| アクションアイテム | 単一の責任者・優先度・バグとして追跡・測定可能な終了状態。「改善する」等の曖昧な語を使わない | [一次] https://sre.google/workbook/postmortem-culture/ |
| オンコール | 対応可能なアラートだけ鳴らす。症状（SLO を脅かすもの）で鳴らす。複雑な障害では直感より熟慮型の判断 | [一次] https://sre.google/sre-book/being-on-call/ |

| 候補規則 | 理由 | 出典 |
|---|---|---|
| トイル削減の提案は「単位・現状値・削減見込み・修正コスト」を書いてから着手する | 客観的な計測で投資を比較する | [一次] SRE workbook |
| 装置（チェック・スクリプト）を足す前に、作業自体を断れないかを検討する | 断ることが第一の選択肢 | [一次] 同上 |
| 障害フォローの成果物は「影響の定量化・根本原因と引き金・再発防止策（緩和策だけでなく）・責任者付きアクション」 | ワークブックの良いポストモーテムの条件 | [一次] 同上 |
| アクションアイテムがクローズされたかを定期的に追う | 追跡しないと忘れられ、次の障害に寄与する | [一次] 同上 |
| ランブックは手順を「そのまま実行できる」粒度で書き、エージェント向けにはスクリプト化する | 脆い操作は自由度を下げる | Anthropic skills best practices（低自由度）[一次]。SRE 本の当該章ではランブック自体の記述は確認できず（インシデント管理手順への言及のみ）[一次] |

---

## Q5. 公開されているハーネス・スキルの粒度と長さ

### 5-1. 実例と長さ（2026-11-02 に raw ファイルを取得して計測）[一次]

| 資料 | 単位 | 行数 | 語数 | 形式の特徴 |
|---|---|---|---|---|
| Anthropic feature-dev コマンド | 7 フェーズを 1 ファイルで | 125 | 707 | フェーズごとに Goal / Actions。重要関門は太字（「DO NOT SKIP」「DO NOT START WITHOUT USER APPROVAL」） |
| superpowers brainstorming | 1 フェーズ | 294 | 2,359 | ハードゲート、1 問ずつ、2〜3 案提示、設計書の保存先固定 |
| superpowers writing-plans | 1 フェーズ | 204 | 1,639 | 2〜5 分のタスク粒度、パスと検証手順必須 |
| superpowers executing-plans | 1 フェーズ | 321 | 2,941 | |
| superpowers test-driven-development | 1 フェーズ | 330 | 1,475 | 「Iron Law」＋言い訳（rationalization）と反論の表＋危険信号 |
| superpowers systematic-debugging | 1 フェーズ | 283 | 1,454 | 4 段階、3 回失敗で設計を疑う |
| superpowers verification-before-completion | 1 フェーズ | 120 | 580 | 「新しい検証証拠なしに完了を主張しない」 |
| superpowers requesting-code-review | 1 フェーズ | 95 | 425 | 重大度別、Critical は進行を止める |
| superpowers receiving-code-review | 1 フェーズ | 205 | 913 | 禁止応答の列挙、不明点は先に質問 |
| Spec Kit /specify コマンド | 1 フェーズ | 349 | 2,545 | 推測＋Assumptions、マーカー最大 3、自己検証は最大 3 周 |
| Spec Kit /clarify コマンド | 1 フェーズ | 291 | 2,729 | 分類表で Clear/Partial/Missing を判定、最大 5 問 |
| Spec Kit /plan コマンド | 1 フェーズ | 170 | 1,120 | |
| Spec Kit /analyze コマンド | 1 フェーズ | 255 | 1,584 | 成果物間の整合検査 |
| Spec Kit spec / plan / tasks テンプレート | 成果物の雛形 | 131 / 113 / 252 | 629 / 463 / 1,383 | |

URL: https://github.com/obra/superpowers/tree/main/skills , https://github.com/github/spec-kit/tree/main/templates , https://github.com/anthropics/claude-plugins-official/tree/main/plugins/feature-dev

**読み取り [推論]**: 1 フェーズ 1 スキルなら 100〜350 行が実勢で、Anthropic の上限 500 行に収まる。全フェーズを 1 ファイルに詰めた feature-dev は 125 行で、各フェーズは 10〜15 行しかない。オーナーの言う「細かく」をそのまま 1 ファイルに書くと 500 行を超えるため、**フェーズ別ファイル＋1 枚の目次**（progressive disclosure）が妥当。

### 5-2. エージェントに効く書き方

| 知見 | 出典 |
|---|---|
| 複雑な手順はチェックリストを応答にコピーさせ、消し込ませる。検証→修正→再検証のループを明記する | [一次] https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices |
| 自由度は作業の脆さで決める: 判断が文脈依存なら散文（高自由度）、脆い操作・順序が決まっているならスクリプト（低自由度） | [一次] 同上 |
| SKILL.md 本文は 500 行未満。参照は 1 階層まで。100 行超の参照ファイルには目次を付ける | [一次] 同上 |
| 中間成果物（計画ファイル）を機械検証してから実行する（plan-validate-execute） | [一次] 同上 |
| スキルを書く前に評価（3 シナリオ以上）を作り、スキルなしのベースラインと比べる | [一次] 同上 |
| 「Claude は既に賢い」前提で、Claude が知らないことだけ書く | [一次] 同上 |
| 機械が書き換えてはいけない状態は Markdown でなく JSON に置く（モデルが不適切に書き換えにくい） | [一次] effective-harnesses 記事 |
| 例外を許さない規則はプロンプトでなく command / http hook で強制する | [一次] Claude Code best practices |
| 「CRITICAL: MUST」等の強い語は現行モデルでは過剰発火を招くことがある。普通の言い方に和らげる | [一次] Anthropic prompting best practices |
| 規則は最初少なく、同じ誤りが繰り返されてから足す | [一次] Cursor、OpenAI Codex best practices |
| エージェントが自分に言い聞かせる「言い訳」を列挙し、それぞれに反論を書く形式（superpowers の rationalization 表）は広く使われている | [一次] superpowers TDD。効果の定量評価は見つからず [未確認] |

---

## 付録 A. フェーズ横断の入口・出口・成果物（ハーネス用の雛形案）[推論]

上の出典から組み立てた案。出典の主張ではない。

| フェーズ | 入口 | 出口（証拠） | 成果物 |
|---|---|---|---|
| 調査 | チケット | 影響範囲と未解決の問いの振り分けが済んでいる | 調査メモ |
| 明確化 | 調査メモ | 未解決マーカー 0、仮定一覧が記録済み | 受け入れ条件（ルール＋例）、仮定一覧 |
| 設計 | 明確化済み要件 | 承認記録 | 設計メモ or ADR（代替案の節を含む） |
| テスト設計 | 承認済み設計 | 受け入れ条件 × テストの対応が全件埋まる | テストリスト |
| テスト実装 | テストリスト | 期待した理由で失敗した実行ログ | 失敗するテスト（先にコミット） |
| 実装 | 失敗するテスト | テスト・型・lint の実行ログ | 小さな差分 |
| テスト評価 | 実装差分 | 実行ログ、E2E / 画面確認、独立レビューの結果 | 検証レポート |
| 手戻り | レビュー指摘 | 各指摘に「対応 / 反論＋根拠 / 質問」が付く | 修正差分と返信 |

## 付録 B. 確認できなかった事項

- Definition of Ready を関門化する弊害についての Scrum.org の論評（ページ取得失敗）[未確認]
- ISTQB CTFL v4.0 シラバス原本（第三者の解説のみ）[二次]
- Ousterhout『A Philosophy of Software Design』第 11 章原文（要約と訳のみ）[二次]
- Google Testing Blog の「Code Coverage Best Practices」「Flaky Tests at Google」本文（取得結果に本文が含まれず）[未確認]
- Uber 型 RFC プロセスの一次資料（未調査）[未確認]
- 旧版 Claude Code best practices の Explore → Plan → Code → Commit 原文（現行ページへリダイレクトされ、Web Archive も取得不可）[二次]
- BMAD 旧版の役割別エージェントとフェーズ定義（現行トップページに記載なし）[未確認]
- PMBOK の assumption log の定義 [未確認]
