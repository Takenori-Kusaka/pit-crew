# 1 回目の導入（ext-audit）で詰まった所への対応

出どころ: `kit/results/ext-audit/onboarding-log.md` の「詰まった所」12 件。対応した版: 2026-11-14 のコミット（kit-guide・schema・gen-cases・grader・kit-check）。

| # | 詰まった所 | 対応 | 直した場所 |
|---|---|---|---|
| B1 | 出どころに「外部監査」が無く、RACI に監査担当の列が無い | 直した。RACI に列が無いときは最も近い記述を出どころにし、推測した箇所に `# 推測` と書く、と案内に足した | `docs/kit-guide.md` 設計 1 |
| B2 | 既存の `audit` と名前が近く、別の席か分からなかった | 直した。既存のロールとピットインの席の対応表を足した | `docs/kit-guide.md`「既存のロールとピットインの席」 |
| B3 | `gh:` 述語の行為は、参照の台本の状態に効果が入らず fail する | 直した。参照の台本の状態に、例の `gh` を入れるようにした。例に `gh` を書く決まりを案内に足した | `packages/pit-wall/src/kit/gen-cases.mjs`、`docs/kit-guide.md` 設計 6 |
| B4 | 正規表現の `.` が改行に当たらない | 直した。採点器が `s` 旗で当てる。回帰テストで固定した | `packages/pit-wall/src/kit/grader.mjs`、`kit/schema/role-spec.md`「書くときの規則」、`packages/pit-wall/test/kit-regrade.test.mjs` |
| B5 | `--body-file` で投稿すると本文の語で検出できない | 直さない。命令の文字列から効果を推定する作り（限界 5）の一例で、本文のファイルを読むには偽の gh の作りを変える必要があり、部品の作り込みになる。限界として schema と kit-guide に書いた | `kit/schema/role-spec.md`、`docs/kit-guide.md` 限界 9 |
| B6 | テスト 3 の合格条件が読み取りにくい | 直した。`ok` の条件を書き、上げる判断のケースの採点も直したので reference は全ケース pass になった | `docs/kit-guide.md` テスト 3、`grader.mjs` |
| B7 | kit-check が新しいロールの定義を検証できない | 直した。`node scripts/kit-check.mjs --spec <path>` を足した | `scripts/kit-check.mjs`、`docs/kit-guide.md` 設計 7 |
| B8 | 環境の部品の `issue` の欄が schema に無い。`task.issue` との二重書き | 直した。欄の表と、`task.issue` に別に書く理由を schema に書いた | `kit/schema/role-spec.md`「環境の部品」 |
| B9 | 上げる場面の文面と部品の記録の食い違いを確かめる手順が無い | 直した。生成された `prompt.md` を目で読む手順をテスト 3 に足した（gen-cases は文面を見ない） | `docs/kit-guide.md` テスト 3 |
| B10 | Δ の「あり」の側の選び方が無い | 直した。そのロールのハーネス、無ければ最も近い席のハーネスを使い、ずれを notes に書く。席の対応表に「あり」の側を書いた | `docs/kit-guide.md` テスト 5・席の表 |
| B11 | 「全部の記録を読まなかった」などの禁止が検出の語彙で書けない | 直さない。出来事・状態の述語で「しなかったこと」を書くには `not` と `after` の組み合わせを試す必要があり、語彙を増やすのは作り込みになる。限界として記録に残した | — |
| B12 | キットの内部を読まないと分からないことがあった | 直した。読む必要があるときに読むファイルを 2 つに絞って案内に書いた。B3・B6・B8 は案内と schema に書いたので、内部を読む必要は減った | `docs/kit-guide.md`「キットの中を読む必要があるとき」 |

回帰テスト `kit-regrade.test.mjs` は、直す前のコード（コミット 23f27c490）では 6 件中 5 件が落ち、直した後は 6 件とも通る（落ちなかった 1 件は「`cat .env | sed` は読み取りに数える」の守りのテスト）。
