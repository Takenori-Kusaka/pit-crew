# テストの実務と実証 — どのテストが費用に見合い、何を書かないか

調査日: 2026-11-02 / 方法: Web 検索、一次資料（論文の PDF 本文・要旨、本人のブログ、公式文書）の取得。論文 PDF とブログ本文の一部は手元で全文をテキスト化して読んだ（下の凡例の「全文」）


> **照合メモ（2026-11-02、設計者）**: ①Trautsch ら 2020（JSS）は ScienceDirect の要旨のハイライトで "Neither unit nor integration tests are better in detecting certain defect types."（一致）②arXiv の 3 本（2606.18168 エージェントのテストのオラクル、2607.22880 LLM 生成テストのカバレッジ追試、2402.09171 Meta TestGen-LLM）は API で実在と要旨を確認。TestGen-LLM の「75% がビルド・57% が安定・25% がカバレッジ増」は要旨と一致。2606.18168 の 80.2% は要旨には無く、本文の値として本書の記載を引く（設計者未照合）③Inozemtseva & Holmes・Gopinath・Kochhar・Labuschagne・Micco の数値は、DOI と題名のみ本書のとおりで、設計者は本文を照合していない。**オーナーの主張との関係**: 「結合のほうが欠陥検出で優れる」を直接支える実証は見つからなかった（Trautsch は差なし）。一方「単体を網羅しても効かない」（カバレッジを上げても検出力はあまり上がらない）、「テストには保守費用がある」、「AI エージェントは中身の薄いテストを量産する」は実証がある。設計ではこの区別を書く。

## 前の調査との関係

- **繰り返さず参照するもの**:
  - `research-phase-practices.md` §1-4〜1-7: Canon TDD のテストリスト、Fowler のピラミッド（下層へ押し下げる）、ISTQB の技法、Hypothesis、Spec Kit の「実 DB 優先」、カバレッジを目標にしない（Fowler TestCoverage）、Google の差分ミューテーション、非決定性の隔離、別エージェントによる確認。
  - `research-dev-quality-bar.md` §1.3〜1.6: t-wada のテストサイズ（Small / Medium / Large）、SMURF の 5 軸（t-wada のスライド）、「リクエスト/レスポンスあたりを狙う」、private をテストしない、アサーションの無いテスト・実測値の貼り付けの禁止、flaky の扱い、オールグリーンの意味。§3.1 の AI 時代の TDD（テストリストの差し戻し、「意味の希薄化」、AI Slop）。
- **新しく調べたこと**: テストの「形」（ピラミッド / トロフィー / ハニカム / SMURF）それぞれの根拠の有無、単体と結合の欠陥検出力の実証、カバレッジと欠陥の相関（賛否両方）、テストの保守費用と flaky の実測、Khorikov の「何を単体テストするか」、モックの使い方、結合・契約テストの作法、TDD の効果の実証、AI エージェントが書くテストの実証研究。
- **前の調査にあって今回扱わなかったもの**: テスト技法（同値分割など）の個別の解説、テストの書き方の細部（アサーションの形、決定性の固定）。これらは前の調査のまま有効で、本調査はその「どこまで当てるか」を絞る側の根拠を足す。

## 問い

オーナーの批判（2026-11-02）: 単体テストを網羅しても実行時間が伸びるだけで意味が薄い。正常系と想定される異常系に絞り、作りすぎない。結合・API など一気通貫のテストのほうが重要（関数単体の保守性よりシステム全体の保守性のほうが効く）。設計書 11 の §4.3〜4.6 は教科書の網羅で、根拠が弱い。

この主張を前提にせず、支持する証拠と反する証拠を同じ熱量で集める。問いは Q1〜Q7（タスクの指示どおり）。

## 結論の要約

1. **テストの「形」はどれも実務家の意見で、実証データに基づくものは見つからなかった。** Kent C. Dodds は自分の 70% という数字を「作った数字」と明言し、Fowler の記事も Spotify の記事もデータを示していない。Google の 70/20/10 は「最初の当て推量」と書かれ、例は「合成スケッチ」である。Fowler は、ピラミッド対ハニカムの争いの多くは「単体テスト」の定義の違い（モックで隔離するか、協力者を実物のまま動かすか）にすぎないと述べる。
2. **形の争いより共通点が大きい。** どの立場も「アイスクリームコーン（E2E 偏重）」と「実装の細部に結びついたテスト（モック偏重）」を避けよと言う。Google 自身も 2024 年に「ピラミッドだけでは足りない、SMURF の 5 軸で両替せよ」と書いている。
3. **カバレッジを目標にすると、テストの効き目は上がらない（実証あり。ただし反対の結果もある）。** スイートの大きさをそろえると、カバレッジと欠陥検出力の相関は「低〜中程度」（Inozemtseva & Holmes 2014）、カバレッジと出荷後の不具合には有意な相関なし（Kochhar ら 2017）。一方で、プロジェクトをまたいで比べると、文カバレッジはミューテーションの検出を R² = 0.94 で予測した（Gopinath ら 2014）。**低いカバレッジは危険の印になるが、高いカバレッジは良さの印にならない**（Khorikov）という読み方が両方の結果と合う。
4. **単体と結合で、見つかる欠陥の種類に差は見つからなかった**（Trautsch ら 2020、38,782 件のテスト）。単体テストは欠陥の場所を特定しやすい（同著者の学位論文の要約、[二次]）。したがって「結合テストのほうが欠陥を多く見つける」という主張は、今回の範囲では実証されていない。
5. **テストには無視できない保守費用がある（実証あり）。** CI のテスト失敗のうち 13% は flaky、flaky でない失敗のうち 26% は壊れた・古くなったテストが原因だった（Labuschagne ら 2017、61 プロジェクト）。Google では全テスト実行の約 1.5% が flaky の結果を出し、テストの 16% に何らかの flaky さがあり、成功から失敗への遷移の 84% に flaky なテストが関わっていた（2016）。
6. **何を単体テストするかの最も具体的な基準は Khorikov**: ドメインのロジックとアルゴリズムは単体テストで厚く、つなぎのコード（コントローラ）は結合テストで、自明なコードはテストしない、複雑すぎるコードは先に分割する。テストは資産ではなく負債で、正味の価値がプラスのものだけを残す。モックは「自分が完全に制御できない外部への依存」（メール送信、メッセージバス）にだけ使い、アプリ専用の DB は実物を使う。ただしこれは実務家の体系であり、実証研究ではない。
7. **「正常系と想定される異常系に絞る」に直接対応する一次資料は見つからなかった。** 近いのは Kent Beck の「テストは少なく、一定の確信に届くまで。自分が普段しない種類の誤りはテストしない」（Stack Overflow の回答）。逆向きの証拠もある: エージェントの PR では**エラー処理が最も一貫してテストされていない**（変更行の未実行率 Java 86.0% / Python 81.0%、2026）。絞るなら、絞った結果として異常系が落ちないことを確かめる必要がある。
8. **AI エージェントはテストを「書かない」より「中身の薄いテストを書く」方向に偏る（実証あり）。** エージェントのテストのパッチの 80.2% は、期待値の検査（オラクル）が弱いか無い（2026、86,156 パッチ）。エージェントの関わる PR は人だけの PR に比べてテスト行の比率が約 2 倍（2026）。Meta は生成したテストを「ビルドできる・安定して通る・カバレッジを増やす」の 3 段の関所でふるい、残ったものだけを人に見せている。Anthropic の Claude Code の指針は「問題を探せと言われたレビュアーは必ず何かを見つけ、全部直すと、起こりえない場合のテストが増える」と明記している。
9. **書き直しの方向（[推論]）**: §4.3 は「技法を全部当てる」から、「完了の条件とリスクごとに、それを最も安く確かめられる層を選び、選ばなかったテストを書かない理由とともに記録する」へ。層の既定はコードの種類で決める（Khorikov の 4 象限）。テストの総量は件数でなく「手元とCI で 10 分以内」（DORA）と「flaky 1% 未満」（Google）を予算にする。§4.5 の「最小の変更」はテストコードにも当てる（テストも負債）。

## 根拠水準の凡例

| 印 | 意味 |
|---|---|
| **[一次]** | 一次資料（論文の本文・要旨、本人のブログ、公式文書）を取得して読んだ。うち **（全文）** は PDF・HTML を手元でテキスト化し、該当箇所を目で読んだもの。それ以外は取得ツール（要約を返す）経由の抜粋で、逐語引用を設計書に写す前にもう一度開いて確かめること（`research-phase-practices.md` の「取得の限界」と同じ） |
| **[二次]** | 第三者の要約・検索結果・書籍の目次や読書メモでしか確かめていない |
| **[推論]** | 本調査が導いた設計判断。出典の主張ではない |
| **[未確認]** | 存在は分かるが内容を確かめられなかった |
| **実証なし（実務家の意見）** | 出典は実在し本文も読めたが、主張がデータでなく経験と推論に基づくもの。[一次] と併記する |

---

## Q1. テストの組み合わせの「形」と、その根拠

### 1-1. 形ごとの主張と根拠の有無

| 形 | 主張（要旨・引用） | 根拠として示しているもの | 実証データ | 出典・印 |
|---|---|---|---|---|
| テストピラミッド（Google 2015） | 「As a good first guess, Google often suggests a 70/20/10 split: 70% unit tests, 20% integration tests, and 10% end-to-end tests」。比率はチームごとに違うが、ピラミッドの形は保つ。理想のフィードバックは速い・信頼できる・失敗を局所化する | 文書編集サービスのチームの例。本文は「a composite sketch based on a collection of real experiences」と明記（実例の合成） | なし（合成した事例） | Mike Wacker, Google Testing Blog, 2015-04-22 https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html [一次（全文）] |
| テストのサイズと範囲（『Software Engineering at Google』11 章） | サイズ（小 = 1 プロセス / 中 = 1 台 / 大 = どこでも）と範囲（狭い・中・広い）を分ける。範囲の目安は狭い 80% / 中 15% / 広い 5%。アンチパターンはアイスクリームコーン（E2E 多・単体少）と砂時計（E2E と単体が多く、結合が少ない） | Google の規模（20 億行超、週 2,500 万行の変更、週に数十億のテストケース実行） | 比率そのものを支えるデータは本調査では確認できなかった | https://abseil.io/resources/swe-book/html/ch11.html [一次] |
| Testing Trophy（Kent C. Dodds） | 「Write tests. Not too many. Mostly integration.」（Guillermo Rauch のツイート 2016-12-10 の引用）。結合テストは確信と速さ・費用の釣り合いが良い。モックを減らすのが結合テストを増やす最大の一歩。「The more your tests resemble the way your software is used, the more confidence they can give you.」。下から Static / Unit / Integration / End to End | 本人の経験、受講者の反応。カバレッジ 70% を超えると収穫逓減と書くが「I made that number up... no science there」と自ら認める | **なし**（本人が明言） | https://kentcdodds.com/blog/write-tests （2019-07-13）, https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications （2021-06-03）[一次] 実証なし（実務家の意見） |
| Testing Honeycomb（Spotify） | マイクロサービスでは「focus on Integration Tests, have a few Implementation Detail Tests and even fewer Integrated Tests」（Integrated Test = 他システムの正しさで成否が変わるテスト。理想はゼロ）。複雑さはサービスの内部より他との相互作用にある。単体テストが多すぎると、テストも変えずにはコードを変えられなくなる | 自チームの経験。「内部をテストに触れずにリファクタリングできる」「DB を PostgreSQL から NoSQL に替えてもテストメソッドを変えずに済む」 | ほぼなし。数字は「スイートがミリ秒から数秒になった」だけ。代償として失敗時の原因特定が難しくなることも認めている | André Schaffer & Rickard Dybeck, Spotify Engineering, 2018-01-11 https://engineering.atspotify.com/2018/01/testing-of-microservices [一次] 実証なし（実務家の意見） |
| 形の争いへの論評（Fowler） | ピラミッド派とハニカム派は「単体テスト」の意味が違う。モック批判者の言う単体テストは solitary（協力者をテストダブルに置き換える）、彼らの結合テストは sociable（協力者を実物で動かす）に近い。「This makes the pyramid versus honeycomb discussion moot.」。Justin Searls を引いて、比率の議論は「a distraction」。大事なのは、境界がはっきりし、速く確実に走り、有益な理由でだけ失敗する表現力のあるテスト | Tim Bray、Kent Beck『XP』、Searls のツイート | なし | Martin Fowler, 2021-06-02 https://martinfowler.com/articles/2021-test-shapes.html [一次] 実証なし（実務家の意見） |
| SMURF（Google 2024） | 「The test pyramid is the canonical heuristic … While useful, the test pyramid lacks the details you need as your test suite grows」。Speed / Maintainability（大きい SUT ほど依存の変動と要件のずれにさらされ保守が増える）/ Utilization / Reliability（大きくなるほど非決定性が忍び込む）/ Fidelity（結合・E2E のほうが現実に近く、単体は環境を模すので期待と現実がずれうる）。5 軸は互いに緊張関係にあり、他を損なわずに 1 軸を改善できるならそうせよ | Testing on the Toilet の記事。軸の説明のみ | なし | Adam Bender, Google Testing Blog, 2024-10-15 https://testing.googleblog.com/2024/10/smurf-beyond-test-pyramid.html [一次（全文）] |
| t-wada「ピラミッド、アイスクリームコーン、SMURF」・テストサイズ | 範囲や粒度による分類は現場を混乱させる。サイズで分ける。SMURF で比べる | （既存調査で確認済み） | なし | `research-dev-quality-bar.md` §1.3（TW-size、TW-smurf） |

### 1-2. Q1 の読み取り

- **どの形にも、比率を決める実証データは無い。** 形は「どこに投資するか」の経験則であり、出典の書き手自身が経験則だと言っている（Dodds の 70%、Google の「first guess」、Fowler の「distraction」）[一次]。
- **形の違いの大部分は、言葉の定義の違い。** Fowler の指摘どおり、トロフィーやハニカムの「結合テスト」は、モックを使わずに協力者を実物で動かす「単体テスト（sociable）」とほぼ重なる [一次]。だから「単体か結合か」と問うより、「何を実物で動かし、何を置き換えるか」「テストの境界をどこに引くか」と問うほうが判断に使える [推論]。
- **全員が一致している点**: ①E2E 偏重（アイスクリームコーン）を避ける、②実装の細部に結びついたテストを避ける、③テストは速く確実でなければならない。この 3 点は規則にしてよい水準の合意がある [推論: 上の 7 資料の共通部分]。
- **どの層を主にするかは、製品の性質で変わると明言している資料がある**: Spotify は「マイクロサービスでは」と条件を付けている（複雑さが相互作用にあるから）[一次]。Khorikov は「ほとんどのアプリケーションで最も重要なのはドメインモデル」と条件を付けている（後述 Q3）[一次]。

---

## Q2. テストの費用対効果の実証

### 2-1. カバレッジと欠陥検出力（賛否両方）

| 研究 | 対象と方法 | 結果（数字は取得した本文・要旨から） | 印 |
|---|---|---|---|
| Inozemtseva & Holmes, "Coverage Is Not Strongly Correlated with Test Suite Effectiveness", ICSE 2014, DOI 10.1145/2568225.2568271 | Java 5 システム（最大 72.4 万行）で 31,000 のテストスイートを生成。文・決定・修正条件のカバレッジと、ミューテーションによる検出力を測る | スイートのテスト数をそろえると、カバレッジと検出力の相関は「low to moderate」。カバレッジの種類を強くしても洞察は増えない。結論「coverage, while useful for identifying under-tested parts of a program, should not be used as a quality target」。妥当性の脅威として、生成したスイートはカバレッジが非常に高い値に達することが少なく、高い域でだけ現れる関係を見逃した可能性を自ら挙げている | [一次（全文）] https://cs.ubc.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf |
| Gopinath, Jensen, Groce, "Code Coverage for Suite Evaluation by Developers", ICSE 2014, DOI 10.1145/2568225.2568278 | GitHub の Java（Maven）1,254 プロジェクトから、テストを持つ 729 件ほか。人が書いたスイートと Randoop の生成スイート。**同じプログラムのスイートを比べるのではなく、プロジェクトをまたいで 1 つのスイートを評価する**問いを立てた | 文カバレッジがミューテーションの検出を最もよく予測した（人のスイートで R² = 0.94、分岐 0.93、パス 0.75。生成スイートでは文 0.72）。文カバレッジ 80% 以上のスイート（41 件）に絞っても文カバレッジの R² はわずかに上がった | [一次（全文）] https://www.cefns.nau.edu/~adg326/icse14.pdf |
| Kochhar, Lo, Lawall, Nagappan, "Code Coverage and Postrelease Defects", IEEE Trans. Reliability 66(4), 2017, DOI 10.1109/TR.2017.2727062 | Java の大規模 OSS 100 件。出荷後に起票された**実際の不具合**とカバレッジの相関。行数・循環的複雑度で正規化 | プロジェクト単位では有意でない相関、ファイル単位では相関なし | [一次: 要旨] https://hal.science/hal-01653728/document |
| Papadakis, Shin, Yoo, Bae, "Are Mutation Scores Correlated with Real Fault Detection?", ICSE 2018 | CoreBench と Defects4J の実際の欠陥 | ミューテーションスコアと実際の欠陥検出の相関は、主にスイートの大きさによる交絡。大きさをそろえると弱い。ただしミューテーションは検出力を高める手引きとしては良い | [二次: 検索結果の要旨] https://conf.researchr.org/details/icse-2018/icse-2018-Technical-Papers/78/ |
| Just ら, "Are Mutants a Valid Substitute for Real Faults in Software Testing?", FSE 2014 | 5 アプリの実際の欠陥 357 件 | カバレッジを制御しても、ミューテーションの検出と実際の欠陥の検出に有意な相関 | [二次] https://homes.cs.washington.edu/~mernst/pubs/mutation-effectiveness-fse2014-abstract.html |
| Zhao, Zhou, Cohen, LLM が生成したテストでの追試, ISSTA 2026, arXiv:2607.22880 | 多数の LLM が生成したスイートで Inozemtseva / Papadakis を追試 | 先行研究と大きく異なる結果。LLM 生成のテストでは、スイートの大きさが主な交絡とは言えない。カバレッジとミューテーションは「渡したコードは正しい」前提の回帰の場面では使えるが、既に不具合を含むコードの不具合を暴く目的では信頼できない指標 | [一次: 要旨] https://arxiv.org/abs/2607.22880 |

**読み方**: 二つの結果は矛盾しない。Gopinath はプロジェクトどうし（テストがほとんど無いものと厚いもの）を比べており、カバレッジは「テストが足りない」を見分けられる。Inozemtseva と Kochhar は、ある程度テストのあるスイートの中で「カバレッジを上げれば良くなるか」を見ており、答えは「あまり」。Khorikov の要約「coverage metrics are a good negative indicator but a bad positive one」（低い数字は確かに問題の印、高い数字は何も意味しない）が両方の結果と合う [一次: Khorikov 第 1 章抜粋（全文）、https://enterprisecraftsmanship.com/files/Unit-Testing-Chapter-1-Excerpt.pdf ][推論: 両研究の調停]。

### 2-2. 単体テストと結合テストの欠陥検出力

| 研究 | 結果 | 印 |
|---|---|---|
| Trautsch, Herbold, Grabowski, "Are Unit and Integration Test Definitions Still Valid for Modern Java Projects?", JSS 2020, DOI 10.1016/j.jss.2019.110421 | Java OSS の 38,782 件のテストを IEEE の定義で単体と結合に分け、ミューテーションを 5 種の欠陥型に分類。「We could not find any evidence that one test type is more capable of detecting certain defect types than the other one.」。今の定義は現代の開発に合わず、性質による定義から使われ方による定義に変えるべきと提案 | [一次: 要旨] https://conf.researchr.org/details/icst-2020/icst-2020-journal-first-papers/4/ |
| Trautsch の学位論文 "An Analysis of the Differences between Unit and Integration Tests" | 検出する欠陥の型は変わらないが、単体テストのほうが欠陥の発生源を特定しやすい | [二次: 検索結果の要旨] https://www.swe.informatik.uni-goettingen.de/node/2889 |
| Google SWE 14 章 | 単体テストでは見つからない欠陥の種類: 設定（「configuration changes are the number one reason for our major outages」）、負荷、利用者が見つける想定外の挙動（「mostly unanticipated」）、実物から離れたテストダブル、創発的な挙動 | [一次] https://abseil.io/resources/swe-book/html/ch14.html |

**読み方**: ミューテーション（小さな人工の欠陥）で測る限り、単体と結合の差は見えない。結合テストの優位は「人工の小さな欠陥を見つける力」ではなく、設定・つなぎ目・想定外の使われ方のような、単体テストの外にある欠陥にある（Google 14 章）[推論]。**「結合テストのほうが欠陥を多く見つける」という一般的な主張を支える実証は、今回の範囲では見つからなかった** [未確認]。

### 2-3. テストの保守費用と flaky

| 研究 | 結果 | 印 |
|---|---|---|
| Labuschagne, Inozemtseva, Holmes, "Measuring the Cost of Regression Testing in Practice", ESEC/FSE 2017, DOI 10.1145/3106237.3106288 | Travis CI を使う 61 プロジェクトの実際のテスト失敗を、開発者の直し方で分類。テストスイートの実行の 18% が失敗。その失敗の 13% が flaky。flaky でない失敗のうちテスト対象の不具合が原因は 74% で、**残り 26% は誤った・古くなったテスト**（著者はこれを保守費用と数える）。失敗したビルドでもテストケース実行の失敗は 0.38% で、完全な予言があればテストケース実行の 99% 超を省けた | [一次（全文: 要旨）] https://www.cs.ubc.ca/~rtholmes/papers/fse_2017_labuschange.pdf |
| John Micco, "Flaky Tests at Google and How We Mitigate Them", 2016-05-27 | 全テスト実行の約 1.5% が flaky の結果。テストの 16% に何らかの flaky さ。成功から失敗への遷移の 84% に flaky なテストが関わる。本文は「1.5% of test results are flaky, 15 tests will likely fail」と書き（母数の書き方は本文の該当箇所で確かめていない）、ビルド係か開発者の高価な調査が要る | [一次（全文）] https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html |
| Google SWE 11 章 | 「as you approach 1% flakiness, the tests begin to lose value」。Google の flaky 率は約 0.15%で、それでも毎日数千件。0.1% でも 1 万件なら 1 日 10 件の調査 | [一次] https://abseil.io/resources/swe-book/html/ch11.html |
| Google SWE 12 章 | 理想のテストは変わらない（要件が変わったときだけ変える）。公開 API 経由でテストし、相互作用でなく状態を、メソッドでなく振る舞いをテストする。1 人が 1 日に数千のテストを回し、大規模変更は数十万のテストを動かすので、偽の失敗は大きな時間の浪費になる（費用の数値は無し） | [一次] https://abseil.io/resources/swe-book/html/ch12.html |

### 2-4. 実行時間と開発の速さ

| 資料 | 内容 | 印 |
|---|---|---|
| Memon ら, "Taming Google-Scale Continuous Testing", ICSE-SEIP 2017, DOI 10.1109/ICSE-SEIP.2017.16 | Google の TAP は 1 日に 13K 超のプロジェクト、80 万ビルド、1.5 億テスト実行。変更 1 件ずつは試験できず、ピーク時は約 45 分ごとにまとめて試験。遅延は最大 9 時間を観測。分析した期間に影響を受けた 550 万テストのうち、一度でも失敗したのは 6.3 万。失敗するテストは対象コードに「近い」 | [一次（全文: 要旨と序論）] https://huang.isis.vanderbilt.edu/cs8395-f23/paper/google-testing-icse-seip-17.pdf |
| DORA "Test automation" | 「Developers should be able to get feedback from automated tests in less than ten minutes」（手元と CI の両方）。flaky を許容しない。落とし穴に「テストスイートを手入れしない」（変更のたびに複数の単体テストを直すなら、モックへの依存か剪定不足）、「単体と受け入れの比率が誤っている」（誤りは最も速い種類のテストで見つける）。「If you have a test suite that is expensive to maintain and unreliable, don't be afraid to prune it down.」「A test suite of ten tests that is reliable, fast, and trustworthy is much better than a test suite of hundreds of tests that is hard to maintain and that nobody trusts.」。開発者に TDD を勧める | [一次] https://dora.dev/capabilities/test-automation/ 。研究の方法（調査票）はページに書かれていない。各年の State of DevOps レポートが元 [未確認] |
| Beller ら（FSE 2015 / TSE 2019, WatchDog） | 開発者は作業時間の約 4 分の 1 をテストに使うが、半分だと思っている。2,433 人規模の追跡では半数の開発者がまったくテストしていない | [二次: 検索結果の要旨] https://cs.unibg.it/esecfse_proceedings/fse15/p179-beller.pdf |

### 2-5. ミューテーションテスト（Google の実務）

- Petrović, Ivanković, Fraser, Just, "Practical Mutation Testing at Scale"（arXiv:2102.11378）: 1 日 5 億超のテストを回す規模では全体のミューテーションは無理。コードレビューで変わった行だけを変異させ、無関係な変異を除き、行ごと・レビューごとに上限を置き、過去の成績で演算子を選ぶ。1,000 超のプロジェクト、24,000 人超で評価 [一次: 要旨] https://arxiv.org/abs/2102.11378
- 同著者, "Does Mutation Testing Improve Testing Practices?", ICSE 2021（arXiv:2103.07189）: 約 1,500 万の変異体を分析。ミューテーションを使う開発者はテストを多く書き、スイートを改善する。変異体は重要度の高い過去の実際の欠陥と結びついている [一次: 要旨] https://arxiv.org/abs/2103.07189
- 含意 [推論]: カバレッジが「どこを実行したか」しか言わないのに対し、ミューテーションは「壊したら気づくか」を言う。テストの効き目を確かめる道具として、カバレッジより直接的。ただし Papadakis（2018）の指摘どおり、スコアを数値目標にすると大きさの交絡に引きずられる。差分に限って使い、生き残った変異体を「足りないテストの候補」として読むのが Google の使い方である。

### 2-6. TDD の効果の実証

| 研究 | 結果 | 印 |
|---|---|---|
| Nagappan, Maximilien, Bhat, Williams, "Realizing quality improvement through test driven development", EMSE 13(3), 2008 | Microsoft 3 チームと IBM 1 チームの事例。TDD を使わない類似プロジェクトに比べ出荷前の欠陥密度が 40〜90% 低下、初期の開発時間は 15〜35% 増（後者は主観的な見積もり）。60〜90% と書く資料もあり食い違う。事例研究なので統計的な一般化はできないという批判がある | [二次] https://neverworkintheory.org/2012/01/25/realizing-quality-improvement-through-test-driven-development.html |
| Fucci, Erdogmus, Turhan, Oivo, Juristo, "A Dissection of the Test-Driven Development Process", TSE 2017（arXiv:1611.05994） | 専門家 39 人・82 データ点。品質と生産性の改善は主に**歩幅の細かさ（granularity）と一定さ（uniformity）**と関連し、**テストを先に書くかどうか（sequencing）は重要な影響を持たなかった**。リファクタリングの量は両方と負の関連。「The claimed benefits of TDD may not be due to its distinctive test-first dynamic, but rather due to the fact that TDD-like processes encourage fine-grained, steady steps」 | [一次（全文: 要旨）] https://arxiv.org/abs/1611.05994 |

### 2-7. Q2 の読み取り（オーナーの主張との照合）

| オーナーの主張 | 支持する証拠 | 反する・限定する証拠 |
|---|---|---|
| 単体テストを網羅しても意味が薄い | カバレッジを上げても検出力はあまり上がらない（Inozemtseva、Kochhar）。テストの 26% の失敗はテスト自体の保守費用（Labuschagne） | プロジェクトをまたぐとカバレッジは検出力を強く予測する（Gopinath）。ミューテーションで導くとテストは実際の欠陥と結びつく（Google）。網羅が無意味なのではなく「網羅を目標にする」のが効かない |
| テスト時間が伸びるだけ | 実行時間は Google 規模で深刻（45 分〜9 時間の遅延）。DORA は 10 分以内を求める | 時間を伸ばすのは主に大きいテスト。単体テストは最も速い（SMURF の S、DORA「最も速い種類で見つける」） |
| 結合・一気通貫のほうが重要 | 設定・つなぎ目・想定外の使われ方は単体で見つからない（Google 14 章）。実装の細部に結びついた単体テストはリファクタリングを妨げる（Spotify、Google 12 章） | 単体と結合で検出する欠陥の型に差なし（Trautsch）。単体のほうが欠陥の場所を特定しやすい [二次]。大きいテストほど flaky・遅い・持ち主不在になりやすい（Google 14 章、SMURF の R）。Google と DORA は今も単体を多めに勧める |
| システム全体の保守性のほうが効く | Khorikov「単体テストの目的はプロジェクトの持続的な成長」（後述）。テストが変更を妨げないことが要（Google「unchanging tests」） | 「結合主体のほうが保守費用が低い」ことを測った研究は見つからなかった [未確認] |

---

## Q3. 何を単体テストし、何をしないか

### 3-1. Khorikov『Unit Testing Principles, Practices, and Patterns』（Manning 2020）

- **単体テストの目的** [一次（全文: 著者公開の第 1 章抜粋）]: 「The goal is to enable sustainable growth of the software project.」。「Code is a liability, not an asset.」「It's always better to solve problems with as little code as possible.」。テストにはそれぞれ費用と便益があり、「Keep only tests of positive net value in the suite, and get rid of all others. Both the application code and the test code are liabilities, not assets.」 https://enterprisecraftsmanship.com/files/Unit-Testing-Chapter-1-Excerpt.pdf
- **成功するテストスイートの 3 条件** [一次（同）]: 開発の流れに組み込まれている / コードベースの最も重要な部分だけを狙う / 最小の保守費用で最大の価値を出す。2 つ目について「It's important to direct your unit testing efforts to the most critical parts of the system and verify the others only briefly or indirectly. In most applications, the most important part is the part that contains business logic--the domain model.」。インフラのコードにも重要なアルゴリズムがあれば厚くテストしてよい。結合テストがドメインモデル以外を確かめるのは構わないが、焦点はドメインモデルに置く。そのためにドメインモデルを他から切り離しておく。
- **カバレッジ** [一次（同）]: 「Low coverage numbers--say, below 60%--are a certain sign of trouble.」「But high numbers don't mean anything.」。特定の数値を課すと歪んだ動機を生む。
- **良いテストの 4 本柱**（退行の防止・リファクタリング耐性・速いフィードバック・保守のしやすさ）[二次]: 第 4 章の題と節の見出しは確認できた（https://livebook.manning.com/book/unit-testing/chapter-4 ）が、本文は読めていない。「4 つの積で価値を評価する」「リファクタリング耐性は譲れない」は二次資料の要約による [二次]。
- **コードの 4 象限**（ドメインモデル・アルゴリズム / 自明なコード / コントローラ / 複雑すぎるコード）[二次]: 第 7 章の内容。ドメインとアルゴリズムは単体テスト、コントローラは結合テスト、自明なコードはテストしない、複雑すぎるコードは Humble Object などで分割してから前の 2 つに振り分ける、という対応は読書メモ・二次資料で確認（例: https://scrapbox.io/mrsekut-p/%E3%80%8E%E5%8D%98%E4%BD%93%E3%83%86%E3%82%B9%E3%83%88%E3%81%AE%E8%80%83%E3%81%88%E6%96%B9%2F%E4%BD%BF%E3%81%84%E6%96%B9%E3%80%8F 、第 7 章の見出し https://livebook.manning.com/book/unit-testing/chapter-7/v-3 ）。同じ考えは著者のブログ「How to do painless TDD」（ドメインを表す、外部依存の無いコードだけを単体テストする）にもある [二次: 検索結果の要旨] https://enterprisecraftsmanship.com/posts/painless-tdd/
- **モックの使いどころ** [一次]: 管理下の依存（自分のアプリだけが触る DB）と、管理外の依存（SMTP、メッセージバスなど他から観測される）を分ける。「Only unmanaged dependencies should be replaced with mocks.」。管理下の依存はテストでも実物を使い、アプリと DB を「1 つのシステム」として扱う。"When to Mock", 2020-04-15 https://enterprisecraftsmanship.com/posts/when-to-mock/
- **結合テストの本数** [未確認]: 「エッジケースはできるだけ単体テストで、結合テストは代表的な正常系 1 本と単体で確かめられないエッジケースを」という第 8 章の記述は、本文を取得できず確認できなかった（第 8 章の冒頭「You can never be sure your system works as a whole if you rely on unit tests exclusively.」のみ [一次] https://livebook.manning.com/book/unit-testing/chapter-8 ）。
- 位置づけ: 体系だった実務家の主張で、**実証研究ではない**（実証なし（実務家の意見））。オーナーの主張とは「つなぎのコードは結合テストで」「自明なコードはテストしない」で一致し、「ドメインのロジックは単体テストで厚く」で異なる。

### 3-2. Kent Beck

- **Test Desiderata**（12 の性質）[一次]: Isolated / Composable / Deterministic / Fast / Writable（「tests should be cheap to write relative to the cost of the code being tested」）/ Readable / Behavioral（振る舞いの変化に敏感）/ Structure-insensitive（「tests should not change their result if the structure of the code changes」）/ Automated / Specific（失敗の原因が明らか）/ Predictive（全部通れば本番に出せる）/ Inspiring。性質どうしは支え合うものと邪魔し合うもの（例: 本番の予測力を上げると遅くなる）がある。https://testdesiderata.com/ 実証なし（実務家の意見）
- **「少なくテストする」** [一次: 回答本文。回答者が Kent Beck であることは広く引かれているが、取得した抜粋に名前が出ていないため帰属は [二次]]: 「I get paid for code that works, not for tests, so my philosophy is to test as little as possible to reach a given level of confidence」「If I don't typically make a kind of mistake (like setting the wrong variables in a constructor), I don't test for it.」「I'm extra careful when I have logic with complicated conditionals.」「When coding on a team, I modify my strategy to carefully test code that we, collectively, tend to get wrong.」 Stack Overflow "How deep are your unit tests?"（2008） https://stackoverflow.com/questions/153234/how-deep-are-your-unit-tests
- **Canon TDD はテストの粒度を規定しない** [一次]: テストは「A really truly automated test, with setup & invocation & assertions」とだけ書く。「What follows is NOT how you should do TDD.」「Picking the next test is an important skill, & one that only comes with experience.」 2023-12-11 https://newsletter.kentbeck.com/p/canon-tdd

### 3-3. 振る舞いをテストする / モックの使いすぎ（ロンドン学派と古典学派）

| 資料 | 主張 | 印 |
|---|---|---|
| Fowler "Mocks Aren't Stubs" | 古典派は「use real objects if possible and a double if it's awkward」、モック派は振る舞いのある協力者を常にモックにする。「Mockist tests are thus more coupled to the implementation of a method.」。Fowler 自身は古典派 | [一次] https://martinfowler.com/articles/mocksArentStubs.html 実証なし（実務家の意見） |
| Google SWE 13 章 | 「Prefer Realism Over Isolation」。実物（速く決定的で依存が単純なら）> フェイク > スタブ・モック。モックの使いすぎは、意図が読みにくい・実装の変更で壊れる・本物の API とずれても誰も気づかない、を招く。Google は `@DoNotMock` を導入した。相互作用の検証は状態を変える呼び出しだけに | [一次] https://abseil.io/resources/swe-book/html/ch13.html |
| Spadini, Aniche, Bruntink, Bacchelli, "To Mock or Not to Mock?", MSR 2017 | 2,000 超のテストの依存を手で分析し、開発者と議論、100 人超の調査。開発者はテストを難しくする依存をモックし、ドメインの概念や規則を表すクラスはモックしたがらない。課題はモックの振る舞いを実物と一致させ続けることと、テストと本番コードの結合が強まること | [二次: 要旨の要約] https://serg.ewi.tudelft.nl/publications/to-mock-or-not-to-mock-an-empirical-study-on-mocking-practices |
| DHH "Test-induced design damage" | テストのしやすさ（テスト先行・速いテスト・単体テスト）のために、不要な間接層を足してコードを歪めること。「Controllers are meant to be integration tested, not unit tested.」。モデルは DB から切り離さずにテストし、フィクスチャとトランザクションで速くする | [一次] https://dhh.dk/2014/test-induced-design-damage.html （2014-04-29）実証なし（実務家の意見） |
| t-wada（既存調査） | テスト容易性のための設計変更で責務が単純になれば良い設計、複雑になれば「やりすぎ」。DHH の主張と同じ線引きを肯定側から述べている | `research-dev-quality-bar.md` §1.2（TW-dft）[一次] |

### 3-4. 「正常系と想定される異常系に絞る」の出典

- **直接の一次資料は見つからなかった** [未確認]。近いもの:
  - Beck の「自分が普段しない種類の誤りはテストしない。複雑な条件分岐には特に注意する。チームが集団で間違えやすいところを注意深くテストする」[一次（帰属は [二次]）]。これは「正常系に絞る」ではなく「**誤りやすい所に絞る**」である。
  - Khorikov の「最も重要な部分（ドメイン）に集中し、他は簡単に、または間接的に確かめる」[一次]。
  - Google 14 章「利用者が見つける問題はほとんどが想定外」[一次]。想定した異常系だけに絞ると、想定外の異常は別の手段（大きいテスト、本番の監視）に任せることになる。
- **反する証拠**: エージェントの PR で、エラー処理が最も一貫してテストされていない（変更されたエラー処理の行の未実行率 Java 86.0%、Python 81.0%）[一次: 要旨] Dipongkor ら arXiv:2607.18057 https://arxiv.org/abs/2607.18057 。エージェントに「絞れ」と指示すると、最初に落ちるのは異常系になりやすい [推論]。
- 読み取り [推論]: 「絞る」の基準は、正常系か異常系かではなく、①完了の条件に書かれた振る舞い（正常系と、仕様が定める失敗の扱い）、②誤ったときの損失が大きい所（お金・データ・権限）、③複雑な分岐、④過去に壊れた所、の 4 つで決めるのが出典と整合する。

---

## Q4. 結合・API・契約テストの作法

| 論点 | 作法 | 出典・印 |
|---|---|---|
| テストの境界を決める | 外から観測できる振る舞いを、公開 API（HTTP のリクエストと応答、モジュールの公開関数）で確かめる。境界の内側は実物、外側の「自分が制御できない依存」だけを置き換える | Google SWE 12 章（公開 API 経由）[一次]、Khorikov "When to Mock" [一次]、Spotify（サービスの端からテスト）[一次]、t-wada（リクエスト/レスポンスあたりを狙う）`research-dev-quality-bar.md` §1.3 [一次] |
| 実 DB を使う | アプリ専用の DB は管理下の依存なので実物を使う。インメモリの代用品（H2 など）は本番の DB の機能を持たず、本番でだけ失敗するクエリを通してしまう | Khorikov [一次]、Testcontainers 公式（「In-memory services may not have all the features of your production service」「In-memory services delay the feedback cycle」）https://testcontainers.com/guides/introducing-testcontainers/ [一次: ベンダーの文書]、Spec Kit Article IX（`research-phase-practices.md` §1-4）[一次] |
| 共有環境の汚染を避ける | 並行するパイプラインが共有の DB を使うと flaky とテスト汚染が起きる。パイプラインごとに隔離したサービスを立てる | Testcontainers [一次]。Google 14 章「An SUT with high hermeticity will have the least exposure to sources of concurrency and infrastructure flakiness」（ただし密閉性が高いほど本番との近さは下がる）[一次] |
| サービス間の互換性 | 契約テスト（Pact）: 「a technique for testing an integration point by checking each application in isolation」。消費者のテストから契約を作り、提供者を契約に照らして検証する。全サービスを配備して回す「expensive and brittle integration tests」の代わり。消費者が実際に使う部分だけを検証するので、使われていない挙動は自由に変えられる | https://docs.pact.io/ [一次]。契約テストが向かない場面（消費者を制御できない公開 API など）は公式ページで確認できなかった [未確認] |
| 遅さへの対処 | 大きいテストは「a handful of large tests is preferable to an enormous one」。忠実性を保てる範囲で小さく保つ。Spotify はミリ秒→数秒の遅さを受け入れ、書く速さと保守のしやすさで取り返せると判断した | Google 14 章 [一次]、Spotify [一次] |
| 不安定さへの対処 | flaky を許容しない（DORA）。1% に近づくとテストの価値が失われる（Google 11 章）。大きいテストは持ち主をはっきりさせないと腐る | DORA [一次]、Google 11・14 章 [一次] |
| 大きいテストでしか見つからないもの | 設定、負荷、想定外の使われ方、テストダブルのずれ、創発的な挙動。ここに大きいテストを使う | Google 14 章 [一次] |
| 大きいテストが見つけた欠陥 | 同じ欠陥を捕まえる速いテストを足す（DORA「add a unit test to make sure this error is caught faster, earlier, and cheaper next time」）。既存設計書の手順 8（下に降ろす）と同じ | DORA [一次]、`research-phase-practices.md` §1-4（Fowler）[一次] |

読み取り [推論]: 「一気通貫を主にする」ことと「速いフィードバック」を両立させる要は、**テストの境界をプロセスの内側（アプリ + 実 DB を 1 台で立てる、Google の「中」サイズ）に置き、ネットワーク越しの他システムは契約テストか置き換えで切る**ことにある。これは Fowler の言う sociable な単体テスト、Spotify の Integration Test（Integrated Test ではない）、Dodds の Integration、t-wada の Medium にほぼ重なる。

---

## Q5. TDD と「最小化」

| 論点 | 内容 | 出典・印 |
|---|---|---|
| TDD はテストの粒度を決めていない | Canon TDD はテストの層を規定しない。「次のテストを選ぶのは経験でしか身につかない技能」 | Beck Canon TDD [一次] |
| TDD の効き目は「先に書く」より「小さく一定の歩幅」 | 歩幅の細かさと一定さが品質・生産性と関連し、テストの先後は重要な影響を持たなかった | Fucci ら 2017 [一次] |
| 外側から内側へ | 機能ごとに受け入れテスト（外側のループ）から始め、内側で単体テストを回す。最初に「歩くスケルトン」（本番と同じ形で組み立て・配備・テストできる最小の切れ端）を作る | Freeman & Pryce『Growing Object-Oriented Software, Guided by Tests』（2009）第 4〜5 章の題と書評 [二次] https://growing-object-oriented-software.com/toc.html |
| エージェントでの TDD（Beck） | システムプロンプトに「Write the simplest failing test first」「Write just enough code to make the test pass - no more」「Always write one test at a time」「Always run all the tests (except long-running tests) each time」。次のテストは Beck が指定し、結果を確かめた。後でカバレッジ測定を走らせ、信頼性を上げるテストを提案させた。危険信号は「Loops」「頼んでいない機能」「テストを無効化・削除するなどのごまかし」 | Kent Beck "Augmented Coding: Beyond the Vibes", 2025-06-25 https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes [一次] |
| t-wada の見解 | テストサイズで分け、Medium・Large を足すなら理由を書く。リクエスト/レスポンスの層を狙う。AI にもテストリストを先に出させ、人が足りないと押し返す | `research-dev-quality-bar.md` §1.3、§3.1 [一次] |
| 「実装を最小化」をテストにも当てる | テストコードも負債（Khorikov）。一定の確信に届くまでで止める（Beck）。「Not too many」（Dodds、実証なし）。信頼できない高価なスイートは剪定してよい（DORA） | 各上掲 [一次] |

**「YAGNI のテスト版」という呼び名の一次資料は見つからなかった** [未確認]。考え方としては Beck・Khorikov・DORA の上記で根拠づけられる。

読み取り [推論]:
- 結合寄りのテストと TDD は両立する。外側のループ（完了の条件を確かめる API・受け入れのテスト）を 1 本ずつ赤にし、中で必要になった複雑なロジックだけを小さいテストで刻む。外側のテストで十分に確かめられる単純な処理には、内側のテストを足さない。
- Fucci の結果から、TDD の価値を守るのに必要なのは「1 件ずつ、小さく、一定の歩幅で」であり、「すべての関数に単体テストを先に書く」ではない。

---

## Q6. AI コーディングエージェント時代のテスト

### 6-1. エージェントが書くテストの実証研究（いずれも AIDev データセット系、2026 年）

| 研究 | 結果 | 印 |
|---|---|---|
| Banik, Chowdhury, Shamim, "All Smoke, No Alarm: Oracle Signals in Agent-Authored Test Code", arXiv:2606.18168 | 5 種のエージェント（Codex、Copilot、Devin、Cursor、Claude Code）の PR 33,596 件・テストのパッチ 86,156 件。**80.2% は期待値の検査が弱いか無い**。強い検査を持つ PR は、条件をそろえるとマージされやすい（OR = 1.28, p < 0.001）。テストファイルの数を数えると検証の強さを過大評価する | [一次: 要旨] https://arxiv.org/abs/2606.18168 |
| Milanese ら, "Human-Agent versus Human Pull Requests: A Testing-Focused Characterization", arXiv:2601.21194 | エージェントが関わる PR 6,582 件と人だけの PR 3,122 件。テストを含む率は 42.9% 対 40.0% で同程度。**テスト行と本体行の比はほぼ 2 倍**。エージェント側は新しいテストを足しやすく（OR = 1.79）、人は既存のテストを直しやすい。テストの臭い（test smell）の差は効果量が無視できるほど小さい | [一次: 要旨] https://arxiv.org/abs/2601.21194 |
| Yoshimoto ら, "Testing with AI Agents", arXiv:2603.13724 | テスト関連のコミット 2,232 件。テストを足すコミットの 16.4% を AI が書いた。AI のテストメソッドは長く、アサーションの密度が高く、分岐は少ない。カバレッジへの寄与は人と同程度 | [一次: 要旨] https://arxiv.org/abs/2603.13724 |
| Dipongkor, Baral, Lam, Moran, "Test Coverage Analysis of Agentic Pull Requests", arXiv:2607.18057 | エージェントの PR 4,882 件。テスト対象のコードを変えた PR のうちテストも変えたのは 49.6%。64.8% の PR で、変更行がどの既存テストにも実行されない。エージェントのテストがカバレッジを上げたのは少数（Java 35.9%、Python 22.5%）。**エラー処理が最もテストされない**（未実行率 86.0% / 81.0%） | [一次: 要旨] https://arxiv.org/abs/2607.18057 |
| Haque, Ingale, Csallner, "Do Autonomous Agents Contribute Test Code?", arXiv:2601.03556 | テストを含むエージェントの PR は増えており、大きく、完了まで長くかかる。マージ率はほぼ同じ | [一次: 要旨（数値なし）] https://arxiv.org/abs/2601.03556 |
| Claude Code の PR 567 件（arXiv:2509.14745） | 未テストのコード経路を覆う包括的なテストを足すことがある | [二次: 検索結果の要約] |

読み取り [推論]: エージェントの典型的な失敗は「テストを書かない」ではなく、**量は多いが、何も確かめていないテスト**と、**異常系の抜け**の組み合わせである。テストの件数・カバレッジでエージェントの仕事を評価すると、この失敗を見逃す。レビューの負担も増える（テストを含む PR は大きく、長くかかる）。

### 6-2. 企業の実務

- **Meta TestGen-LLM**（FSE 2024, arXiv:2402.09171）[一次: 要旨]: 生成したテストを、改善が測れたものだけ残す関所に通す。Instagram の Reels と Stories で、生成したテストの 75% がビルドでき、57% が安定して通り、25% がカバレッジを増やした。適用したクラスの 11.5% を改善し、提案の 73% を技術者が本番に採用した。https://arxiv.org/abs/2402.09171
- **Meta ACH**（arXiv:2501.12862）[一次: 要旨]: 既存テストが捕まえない少数の欠陥（変異）を先に作り、それを捕まえるテストを生成する。10,795 クラスで 9,095 の変異と 571 のテスト。技術者の採用率 73%。https://arxiv.org/abs/2501.12862
- 読み取り [推論]: 両社とも「生成したテストをそのまま入れる」ことはしていない。**テストが何を足すか（カバレッジの増分、捕まえる欠陥）を機械で確かめてから人に見せる**。

### 6-3. 公式の指針

- **Claude Code best practices** [一次] https://code.claude.com/docs/en/best-practices :
  - バグ修正の例として「write a failing test that reproduces it, then fix it」。
  - 完了の証拠を求める: 「"All tests pass" on its own tells you very little」（実行したコマンドと出力を求める）。
  - 別のサブエージェントに仕様と照らしてレビューさせる例で「report gaps that affect correctness and skip style」。「A reviewer that's asked to find problems will always find *something*. If you fix every finding, you end up with extra abstraction layers and tests for cases that can't happen.」 — **起こりえない場合のテストを作りすぎる失敗を、公式が名指ししている**。
- **Claude prompting best practices** [一次] https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices :
  - 長い作業では作業前にテストを作らせ、構造化して記録させる。「It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality.」
  - 「Avoid focusing on passing tests and hardcoding」: テストを通すことに偏り一般的でない解にならないよう、テストケースに合わせた値の埋め込みをさせない。
- **Kent Beck**（Q5 の表を参照）[一次]: 次のテストは人が指定し、テストの無効化・削除をごまかしの信号として監視する。
- **t-wada**（既存調査）: テストリストを人が承認する、「意味の希薄化」、AI Slop によるレビュー負担の押し付け、「仕組みで気づける」に [一次 / 二次]。`research-dev-quality-bar.md` §3.1。

### 6-4. テストを先に人が承認する運用

- 支持: t-wada は Claude Code にテストリストを出させ、足りないと差し戻した [一次: TW-cc]。Beck は次のテストを自分で指定した [一次]。Cursor の指針はテストを先にコミットし、実装でテストを変えないと指示する（`research-phase-practices.md` §1-5）[一次]。
- 限定: 承認の対象はテストの**一覧（何を確かめるか）**であって、テストコードの全行ではない。80.2% の弱いオラクル（6-1）は一覧では見えず、コードを見るか機械で確かめる必要がある [推論]。

---

## Q7. §4.3・§4.4・§4.6 を書き直すための規則の候補

各規則は [推論]（エージェント向けの言い換え）。「根拠」列の出典の水準をそのまま付ける。

### 7-1. 層の選び方（§4.3 テスト設計の中心）

| # | 規則の候補 | 根拠 | 根拠の水準 |
|---|---|---|---|
| L1 | テストの層は比率でなく、**確かめたいものごとに「それを最も安く確実に確かめられる層」**で選ぶ。比率（70/20/10 など）は規定しない | どの形にも実証データが無い（Q1）。Fowler・Searls「比率の議論は a distraction」。SMURF は 5 軸の両替を求める | [一次] ただし各出典は実証なし（実務家の意見） |
| L2 | 既定の割り振りはコードの種類で決める: ①ドメインのロジック・アルゴリズム（分岐が多い・計算する）→ プロセス内の小さいテストで厚く / ②つなぎのコード（コントローラ、ハンドラ、CRUD）→ 公開 API の層で、実 DB を使う中サイズのテスト / ③自明なコード（getter、DTO、委譲だけ）→ 書かない / ④分岐が多く外部依存も多いコード → テストの前に分割を提案する | Khorikov の 4 象限 [二次]、「最も重要な部分に集中」[一次]、DHH [一次] | [二次]〜[一次] 実証なし（実務家の意見） |
| L3 | **製品の性質で主になる層が変わる**: 複雑さがドメインの計算にある製品（料金計算、規則エンジン）は小さいテストが主。複雑さがサービス間・外部とのつなぎ目にある製品（マイクロサービス、CRUD 中心の Web アプリ）は中サイズの API テストが主。判断の根拠（どこに複雑さと過去の不具合があるか）を設計に 1 行書く | Spotify（マイクロサービスという条件付き）[一次]、Khorikov（「ほとんどのアプリで」という条件付き）[一次]、Memon（失敗するテストは対象に近い）[一次] | [一次] 実証なし（実務家の意見） |
| L4 | テストの境界は「アプリ + 自分専用の DB」までを実物にし、自分が制御できない外部（他チームのサービス、メール、決済）だけを置き換えるか契約テストにする | Khorikov "When to Mock" [一次]、Google 13 章 [一次]、Testcontainers [一次]、Pact [一次] | [一次] |
| L5 | 大きいテスト（実ネットワーク・ブラウザ・複数サービス）は、設定・つなぎ目・利用者の主要な経路など、**中サイズでは原理的に確かめられないもの**にだけ使い、1 本ずつ理由を書く | Google 14 章 [一次]、既存設計書 §4.3 手順 6 | [一次] |
| L6 | 変更の種類で最初の 1 本を決める: 不具合 → それを再現できる最も小さい層で再現テスト / 新機能 → 完了の条件を確かめる外側（API・受け入れ）のテストを先に 1 本 / 振る舞いを変えないリファクタリング → **新しいテストを書かず**、既存の振る舞いのテストが通り続けることで確かめる（無ければ先に特性テストで固定） | t-wada「不具合にテストを書いて立ち向かう」[一次]、GOOS [二次]、Google 12 章「unchanging tests」[一次]、Feathers（既存調査）[二次] | [一次]〜[二次] |

### 7-2. 書かないテスト（§4.3 に新しく足す）

| # | 書かないもの | 根拠 | 根拠の水準 |
|---|---|---|---|
| N1 | 自明なコード（ロジックの無い getter・DTO・1 行の委譲）のテスト | Khorikov [二次]、Dodds（「実際のロジックの無いコードのテスト」で遅くなる）[一次] | [二次]〜[一次] 実証なし |
| N2 | フレームワーク・ライブラリ自体の挙動を確かめるテスト | [推論] Khorikov の「最も重要な部分」から | [推論] |
| N3 | private な関数・内部の構造・呼び出し順を確かめるテスト（状態を変える外部への呼び出しを除く） | Google 12・13 章 [一次]、Beck Test Desiderata（Structure-insensitive）[一次]、t-wada [一次]、Fowler [一次] | [一次] |
| N4 | 自分のアプリ専用の DB をモックするテスト（実物を使う） | Khorikov [一次]、Testcontainers [一次] | [一次] 実証なし |
| N5 | 上の層のテストが既に同じ振る舞いを確かめていて、下の層で足しても「失敗の場所の特定」も「速さ」も増えないテスト | Khorikov（正味の価値がプラスのものだけ残す）[一次]、Trautsch（単体の利点は局所化）[二次] | [一次]〜[二次] |
| N6 | 起こりえない状況のテスト（型・入力の検査で既に排除されている状況） | Claude Code best practices（「tests for cases that can't happen」）[一次]、Anthropic prompting（起こりえない状況の防御を書かない、既存設計書 §4.5 手順 3）[一次] | [一次] |
| N7 | カバレッジの数字を上げるためだけのテスト、期待値の検査が弱いテスト（例外が出ないことだけ、真偽だけ、件数だけ） | t-wada 訳 Canon TDD [一次]、Banik ら（80.2% が弱い）[一次]、Inozemtseva [一次] | [一次] |
| N8 | 現在の出力をそのまま期待値として固定するテスト（スナップショットの丸写し）。挙動を変えないための特性テストとして意図して書く場合を除く | t-wada 訳 Canon TDD [一次] | [一次] |

各テストには「どの完了の条件か、どのリスク（L7）を確かめるか」を 1 行で付け、付けられないテストは書かない [推論]（Khorikov の正味の価値の考えを、エージェントが判定できる形にしたもの）。

### 7-3. 何を厚くテストするか（絞った結果、落としてはいけないもの）

| # | 規則の候補 | 根拠 | 根拠の水準 |
|---|---|---|---|
| R1 | 完了の条件に書かれた振る舞い（正常系と、仕様が定める失敗の扱い）は必ず確かめる | 既存設計書 §4.3 手順 2（Spec Kit）[一次] | [一次] |
| R2 | 誤ったときの損失が大きい所（お金・データの消失・権限・個人情報）と、分岐の多いロジックは厚くする | Beck（複雑な条件分岐に特に注意）[一次（帰属 [二次]）]、Google 11 章（Beyoncé Rule: 壊したくないものにはテストを）[一次] | [一次] |
| R3 | 異常系のうち、外部の失敗（タイムアウト、相手の 4xx/5xx、DB の制約違反）への応答は、少なくとも代表 1 件ずつ確かめる。エージェントは異常系を最も落としやすい | Dipongkor ら（エラー処理の未実行率 86.0% / 81.0%）[一次: 要旨] | [一次] |
| R4 | 過去に壊れた所・チームが間違えやすい所は厚くする（不具合の再現テストを回帰テストとして残す） | Beck [一次（帰属 [二次]）]、t-wada「不具合にテストを書いて立ち向かう」[一次] | [一次] |
| R5 | 技法（同値分割・境界値・決定表・状態遷移）は R2〜R4 に当たる所にだけ当て、それ以外には当てない。既存設計書 §4.3「調査の範囲と深さ」の「深なら全部当てる」は、深さではなくリスクで決めるように改める | Khorikov（重要な部分に集中）[一次]、Beck [一次] | [推論] |

### 7-4. テストの総量と実行時間の予算

| # | 規則の候補 | 根拠 | 根拠の水準 |
|---|---|---|---|
| B1 | 予算はテストの件数でなく時間で持つ: 開発者が手元で回す範囲と CI の必須検査は、それぞれ 10 分以内にフィードバックを返す。超えそうなら、足す前に遅いテストを速くする・統合する・消す | DORA（「less than ten minutes」）[一次]。研究の方法は未確認 | [一次] |
| B2 | flaky の予算: スイートの flaky 率が 1% に近づいたら新しいテストの追加より安定化を優先する。flaky なテストは再実行で済ませず隔離し、原因を記録する | Google 11 章（1% で価値を失う）[一次]、Micco（1.5% / 16% / 84%）[一次]、Labuschagne（失敗の 13%）[一次] | [一次] |
| B3 | 新しいテストを足すときは、そのテストの実行時間（目安の桁）と、遅い層を選んだ理由を書く | SMURF [一次]、t-wada（Large を足す理由）[一次] | [推論] |
| B4 | 変更 1 回でテストを複数直す必要が出たら、テストが実装に結びつきすぎている信号として報告する（モックの使いすぎか剪定不足） | DORA（落とし穴「テストスイートを手入れしない」）[一次]、Labuschagne（失敗の 26% が古いテスト）[一次] | [一次] |
| B5 | 高価で信頼されていないテストは、消す・置き換えることを提案してよい（アサーションの弱体化とは区別し、理由と代わりの確かめ方を書いて承認を得る） | DORA（「don't be afraid to prune it down」）[一次]、既存設計書 §4.4 の ADR-0006 系の規則 | [一次] |

### 7-5. テスト実装（§4.4）への追加

| # | 規則の候補 | 根拠 | 根拠の水準 |
|---|---|---|---|
| U1 | 1 件ずつ書き、期待した理由で失敗するのを見る（既存のまま）。加えて、**外側のテストで赤にした振る舞いの中で、複雑なロジックが要ると分かったときにだけ**内側の小さいテストを足す | Canon TDD [一次]、GOOS [二次]、Fucci（歩幅が効く）[一次] | [一次]〜[二次] |
| U2 | すべてのテストに、仕様から導いた具体的な期待値の検査を入れる（例外が出ないこと・件数だけで済ませない） | Banik ら [一次]、t-wada [一次] | [一次] |
| U3 | テストコードの量も「最小の変更」の対象にする。重複したセットアップは読みやすさを損なわない範囲で共有し、1 つの振る舞いに 1 つのテスト | Khorikov（テストも負債）[一次]、Google 12 章（振る舞いごとに 1 テスト、DAMP）[一次] | [一次] |

### 7-6. テスト評価（§4.6）への追加

| # | 規則の候補 | 根拠 | 根拠の水準 |
|---|---|---|---|
| V1 | カバレッジは「テストの無い変更行」を探す道具として差分に対して使う。変更行が 1 行も実行されていない、エラー処理が未実行、を報告する。全体の数字を目標にしない | Inozemtseva [一次]、Kochhar [一次]、Khorikov（悪い印としては有効）[一次]、Dipongkor（64.8% の PR で変更行が未実行）[一次] | [一次] |
| V2 | テストの効き目を疑うときは、差分に限ったミューテーション（または変更行を 1 か所壊してテストが落ちるかの手動確認）を使う。生き残った変異を「足りないテストの候補」として読む | Google（Petrović ら 2021）[一次]、Papadakis（スコアの目標化は大きさの交絡）[二次] | [一次]〜[二次] |
| V3 | 報告にテストの件数を成果として書かない。何を確かめたか（完了の条件 × テスト）、何を確かめていないか、どのテストを書かなかったかとその理由を書く | Banik ら（数を数えると過大評価）[一次]、既存設計書 §4.6 手順 5・10 | [一次] |
| V4 | 独立の確認を頼むときは、正しさに関わる欠落だけを報告させる（スタイルと「念のため」のテスト追加の提案を除く）。指摘を全部採用しない | Claude Code best practices [一次] | [一次] |
| V5 | テストの実行時間と flaky の状況（B1・B2 の予算に対して）を報告に含める | DORA [一次]、Google 11 章 [一次] | [推論] |

### 7-7. §4.5 実装の「最小化」とテストの関係

- 現在の §4.5 手順 3（範囲を守る、1 回しか使わない処理に補助関数を作らない、起こりえない状況の防御を書かない）は本番コードにだけ掛かっている。**同じ規則をテストコードに掛ける**: 頼まれていない振る舞いのテストを足さない、起こりえない状況のテストを書かない（N6）、テストのためだけの間接層（テスト専用のインターフェースやフック）を足さない [推論]。根拠: Khorikov「Code is a liability」「Both the application code and the test code are liabilities」[一次]、DHH（テストのための設計の歪み）[一次]、Claude Code best practices（起こりえない場合のテスト）[一次]、Beck の危険信号「頼んでいない機能」[一次]。
- 逆向きの制約: テストを減らすことで異常系（R3）と損失の大きい所（R2）を落とさない。最小化の対象は「何も足さないテスト」であり、「確かめる範囲」ではない [推論]。
- t-wada の言う「テストのための設計変更で責務が単純になれば良し、複雑になればやりすぎ」を、テストの層の選択の判定にも使う（小さいテストを書くために構造が複雑になるなら、外側のテストで確かめる）[一次: TW-dft の言い換え]。

### 7-8. 既存の §4.3〜4.6 のどこを変えるか（対応表）

| 既存の箇所 | 変える方向 | 規則 |
|---|---|---|
| §4.3 手順 3「技法で漏れを探す」 | 全部に当てるのをやめ、R2〜R4 に当たる所にだけ当てる | R5 |
| §4.3 手順 6「小を多く、大を少なく」 | 比率の規定をやめ、確かめたいものごとに層を選ぶ。既定はコードの種類（L2）と製品の性質（L3）で決める | L1〜L3 |
| §4.3「調査の範囲と深さ」の「深なら全部当てる」 | 深さでなくリスクで決める | R5 |
| §4.3 出る条件 | 「書かなかったテストとその理由」「各テストの対応する完了の条件またはリスク」を足す | N1〜N8 |
| §4.4 | 期待値の検査の強さ、テストコードも最小に | U1〜U3 |
| §4.6 手順 9「カバレッジは穴を探す道具」 | 差分の未実行行・未実行のエラー処理を報告する形に具体化。ミューテーションを足す | V1、V2 |
| §4.6 V4「独立に確かめる」 | 正しさに関わる欠落だけを報告させる | V4 |
| 新規（§4.3 か §3 原則） | 時間と flaky の予算 | B1〜B5 |

---

## 確かめられなかったこと

- 「結合テスト主体のスイートは単体主体より欠陥を多く見つける / 保守費用が低い」ことを直接比べた実証研究。見つからなかった [未確認]。ピラミッド・トロフィー・ハニカムのいずれにも比率を支えるデータは無かった。
- Khorikov の本の第 4 章（4 本柱の定義と「積で評価」）、第 7 章（4 象限）、第 8 章（結合テストの本数）の本文。目次・読書メモ・二次資料でのみ確認 [二次]。
- 『Software Engineering at Google』11 章の 80/15/5 の比率を支えるデータの有無。本調査では見つけられなかった。
- Trautsch らの論文の本文（統計の詳細）と、学位論文の「単体のほうが欠陥の発生源を特定しやすい」の根拠 [二次]。
- Papadakis ら 2018、Just ら 2014 の要旨の原文（検索結果の要約のみ）[二次]。
- Nagappan ら 2008 の数値（40〜90% と 60〜90% の食い違い）[二次]。
- Kent Beck の Stack Overflow の回答が本人のものであることの、取得した本文上での確認（広く引かれているが、取得した抜粋に回答者名が出ていない）。
- 「正常系と想定される異常系に絞る」「YAGNI のテスト版」という言い方の一次資料。
- 契約テスト（Pact）が向かない場面の公式の記述。
- DORA の「10 分以内」がどの調査（設問・標本）に基づくか。
- Google Testing Blog の 2016 年の flaky の記事の「1.5%」が、どの期間・どの範囲のテストの数字か（記事本文に期間の記載は見当たらなかった）。
- エージェントのテストの研究（2026 年の arXiv）はいずれも査読前を含み、本文の手法の詳細は読んでいない（要旨のみ）。
