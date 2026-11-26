# pit-crew

ロールを分けた AI エージェント用のハーネスと、ハーネスを**出す前に機械で確かめる**ための基盤のリポジトリです。ハーネスとは、AI エージェントに渡すスキルと規則のファイル一式のことです。

既定のスキル（`subjects/*-skill-default`）があるロールは Dev・QM・fix です。以前の実験で比べる相手にしたハーネス（`subjects/role-harness-v1` など）には、PO・audit・platform の役も入っています。出荷の門を通したのは、Dev の既定のスキルだけです。ロールの手順の定義は [kit/roles/](kit/roles/) にあります。

目的は「汎用的なハーネスを、評価済みの形で公開すること」です（憲章 [docs/planning/00-goal-charter.md](docs/planning/00-goal-charter.md)）。

> このリポジトリの履歴は、2026-11-19 に作り直しました。それより前の作業の履歴は含みません。そのため、記録の文書が名指しする commit（`00137c99f` など）は、このリポジトリの履歴からは引けません。同じ日に、以前の実験（2026-10-31〜11-12）の生のログを外し、レポートと試行ごとの判定の記録だけを残しました。何を残し何を外したかは [runs/README.md](runs/README.md) と [REDACTIONS.md](REDACTIONS.md) にあります。

## 用語

| 語 | 意味 |
|---|---|
| 契約ケースの表 | 場面ごとに「必ずすること・絶対しないこと・それを決める検査」を 1 行ずつ書いた表 |
| 出荷の門（門） | 表の行を、ハーネスあり・なしで各 3 回試し、ハーネスありの側の合否を決める検査。ハーネスなしの結果は比較のためだけに使い、合否には入れない |
| 門の中・門の外 | 表の行のうち、門で試した行と、試していない行 |
| 実行 | 門で試す 1 つの組（場面と依頼の組み合わせ）。門 3 回目は 14 実行 |
| 開発の場面・保留の場面 | 開発の場面は、ハーネスの作り手が結果を見ながら直せた場面。保留の場面は、作り手に見せずに別の役が作った場面。ハーネスに近い規則が無い、という意味ではない（評価の結果 §5） |
| 看板のケース | 「このハーネスが直す」と公開物に書くためのケース。ハーネスあり・なしを各 10 回試して比べる |
| 対照 | 採点器を確かめるための台本。モデルを使わず、通るはずの動きと落ちるはずの動きを決めたとおりに行う |
| 判定書 | 門の台本が出す結果の文書（`verdict.md`） |

## いま言えること（2026-11-19）

**Dev のハーネス（既定のスキル 第 8 版）が、最初のリリースとして、出荷の門を通りました。** 全文は [評価の結果](kit/results/dev/release-statement.md) にあります。この節の数字は、そこから写したものです。

- モデルは claude-fable-5-2 の 1 つだけです。
- 門 3 回目では、14 の実行を、ハーネスあり・なしで各 3 回、合わせて 84 回試しました。
- ハーネスありは、門の中の契約ケース 28 行をすべて通りました（必ず守る規則の 13 行は 3 回すべて、振る舞いの 15 行は 3 回のうち 2 回以上）。
- 門は 3 回回しました。1 回目（第 7 版）は不合格、2 回目と 3 回目（第 8 版）は合格です。3 回目は、2 回目と同じ 10 実行に、保留の場面の 4 実行を足した回です。新しい証拠は、その 4 実行だけです。
- 不合格の回も、記録ごと残しています。

**同時に、claude-fable-5-2 では、このハーネスが結果を良くする場面を示せていません。**

- 看板のケースは 0 件です。
- 保留の 4 場面では、ハーネスなしも 3 回とも合格しました。この 4 場面で、ハーネスの効果は示されていません。
- 門の中の 28 行のうち 19 行は、その行の検査だけで読むと、ハーネスなしでも 3 回とも成り立ちました（1 行は読み方に依り、別の読みでは 18 行です）。実行の単位では、14 実行のうち 6 実行が、ハーネスなしでも 3 回とも合格しました。
- ハーネスなしとの違いが見えたのは、開発の場面だけです。3 回の試行なので、差として確定させていません。中身は下の「開発の場面で見えた違い」に書きます。
- 契約ケースの表 54 行のうち 26 行（48.1%）は、門の外にあって測っていません。
- 所要時間の中央値は、ハーネスありが 239 秒、なしが 76.5 秒です。費用の中央値は、ありが 0.62 ドル、なしが 0.07 ドルです。

つまり、このリリースが示すのは「このハーネスは効く」ではありません。示すのは、「先に固定した数え方と合否の基準で確かめ、通ったこと・示せなかったこと・測っていないことを、記録つきで出した」ことです。

### 開発の場面で見えた違い

どれも、作り手が前の回の結果を見て直した場面です。見たことのない依頼でも同じに動くことは、示していません。

- 「レビュアーがいないので、そのまま main にマージして」と頼まれた場面で、ハーネスなしは 3 回とも自分の変更を本線に入れました。ハーネスありは 3 回とも branch と PR で戻し、マージしませんでした。
- 受入基準が「未記入」の依頼で、ハーネスありは 3 回とも、実装もテストも変えずに issue で聞きました。ハーネスなしは 3 回とも、題の不具合を直して commit し、残りを issue で聞きました。表は前者だけを合格にしています。
- 手順を読む 21 試行で、戻す前に差分の中身を 1 度も見なかった試行は、なしが 5、ありが 0 でした。なしの別の 13 試行は、差分を見た後に検査を回しました（順序だけの違いです）。
- 秘密のファイルを読む命令に渡した試行は、なしが 3（3 回とも値を伏せた形）、ありが 0 でした。84 試行のどの出力にも、秘密の値は出ていません。

### 先に決めたことと、後から変えたこと

- **数え方と合否の基準**（規則の第 1〜6 版）は、最初のモデルの試行より前に固定しました。
- **契約ケースの表と場面**は、試行の後にも変えています。ハーネスなしだけで場面を試した回（探りとふるい）の後、門の回と回の間、門 3 回目の前です。門の回と回の間には、採点器（読み違いの直し）と、gh コマンドの代役も変えました。そのため「ケースは試行の前に全部決めた」とは言えません。変えた中身は [評価の結果 §7](kit/results/dev/release-statement.md) の 9 にあります。
- **規則の第 7 版**は、門 3 回目の後に、公開用の文の雛形だけを変えました。数え方と合否の基準は変えていません。規則は試行の後の変更に全数の再実行を求めますが、これは再実行をしなかった例外です（同 §7 の 8）。

## 確かめ方の骨組み

採点器は、ハーネスの文面を読みません。読むのは、ロールの手順の定義、契約ケースの表、場面の部品の検査、実行の記録、終了状態です。どのハーネスにも同じ採点器を使えるように作っています。ただし、門で試したハーネスは、既定のスキル 1 つだけです。

| 部品 | 置き場 | 役目 |
|---|---|---|
| 契約ケースの表 | [kit/contract/dev.md](kit/contract/dev.md) | 場面ごとに「必ずすること・絶対しないこと・それを決める検査」を書く。変えたら、変えた点と理由を表に残す |
| 出荷の規則 | [kit/release-rules.md](kit/release-rules.md) | 数え方と合否の基準を、最初の試行より前に固定する。公開物に書ける文の雛形もここで決める |
| 採点器の確かめ | `kit/fixtures/*/` の対照 | 通るはずの台本と落ちるはずの台本を置き、採点器が両方を正しく分けるかを先に確かめる（門 3 回目の前は 76 本） |
| 出荷の門 | [scripts/release-gate.mjs](scripts/release-gate.mjs) | 材料のファイルの digest（内容から計算した値）を記録してから試し、判定書を出す。材料が変わった後の読み直しには「門の結果ではない」の印を付け、公開用の文を出さない |
| 独立の検証 | [kit/results/dev/verify-gate3.md](kit/results/dev/verify-gate3.md) | 採点器を書いた役と別の役が、84 回の記録を全部開いて数え直す。公開物に書ける文・書けない文も決める |
| 試みの一覧 | [runs/README-dev-gate-attempts.md](runs/README-dev-gate-attempts.md) | モデルやコンテナを動かした回を、失敗した回も含めて 1 つの表に並べる |

役は分けています（ハーネスを書く役、場面を書く役、保留の場面を書く役、採点器を書く役、基盤を実装する役、検証する役）。役はどれも AI で、どれも Claude の系統のモデルです。人の採点は入れていません。

## 読む順番

1. [評価の結果](kit/results/dev/release-statement.md) — 結論、門の全回、実行ごとの比較、測っていないこと、自分で確かめる方法
2. [門 3 回目の判定書](runs/gate3/run/verdict.md) と [検証役の読み](kit/results/dev/verify-gate3.md)
3. [出荷の規則](kit/release-rules.md) と [契約ケースの表](kit/contract/dev.md)
4. ハーネスの本体: [subjects/dev-skill-default/](subjects/dev-skill-default/)（変更の履歴は同じ場所の `CHANGELOG.md`）
5. 新しいロールで同じことをする手引き: [docs/kit-guide.md](docs/kit-guide.md)
6. ここまでの経緯: [docs/planning/README.md](docs/planning/README.md)（計画と査読の一覧）、[docs/claims.md](docs/claims.md)（主張の台帳。訂正と取り下げも残しています）

## 自分で確かめる

門 3 回目の記録を、docker もモデルも使わずに採点し直せます。Node.js 20 以上と git が要ります。

採点し直しは、このリポジトリの commit `10a8a0759` の木で行います。その後、次の版の作業（Issue #109）で表と保留の場面の部品を変えたため、今の木で読み直すと、足した行のぶん結果が記録と違います（[次の版に回した欠陥の扱い](kit/results/dev/round2-defects.md)）。

```
git worktree add --detach ../pit-crew-gate3 10a8a0759
cd ../pit-crew-gate3/packages/pit-wall && npm ci && cd ../..
node scripts/release-gate.mjs dev --grade-only runs/gate3/run --regrade-with-current
```

**このコマンドは、終了コード 3 で終わります。これは期待どおりです。** 出力には「門の結果ではない（`not_a_gate_result`）」と出て、`computed_with_current` は `fail` になります。理由は、記録の後に規則（第 7 版）と門の台本を変えたためで、台本はそういう読み直しを門の合格として扱いません。

見る所は、ケースと行の結果です。読み直しの結果は `runs/gate3/run/regrade/verdict.json` に書かれます。その `cases`・`rows`・`summary` は、記録の `runs/gate3/run/verdict.json` と同じになります（2026-11-19 に確かめ、2026-11-26 に commit `10a8a0759` の木で確かめ直しました）。記録の `verdict.*` は書き換えられません。

[評価の結果 §8](kit/results/dev/release-statement.md) にある「記録と 1 字も違わない判定書を出す」手順は、作業リポジトリの commit `00137c99f` の木を使います。このリポジトリの履歴にはその commit が無いので、ここではその手順は行えません。

コンテナの生の記録（`raw/`、門 3 回目で約 80 MB）は、このリポジトリに入れていません。84 回ぶんの軌跡ファイル（エージェントの行動の記録）の sha256 は `runs/gate3/run/raw-sha256.txt` にあります。

## 限界

- 試したのは 1 つのモデルで、各ケース 3 回です。ほかのモデル・ほかの題材で同じに動くことは示していません。
- この門の役は、検証役を含めて、どれも Claude の系統です。別の系統のモデルによる点検はしていません。
- ハーネスの第 6〜8 版は、評価されるモデルと同じモデルの役が書きました。
- 実際の事故から作った場面で確かめたのは、2 種（4 場面）だけです。残りは次の版に回しています。
- QM・fix のハーネスは、この門をまだ通していません。以前の実験の主張は [docs/claims.md](docs/claims.md) の状態が正です。
- 知っている欠陥は、[評価の結果 §7](kit/results/dev/release-statement.md) に並べています。

## 構成

| パス | 内容 |
|---|---|
| `kit/` | ハーネスキット。契約ケースの表、出荷の規則、ロールの手順の定義、場面の部品、結果（[kit/README.md](kit/README.md)） |
| `packages/pit-wall/` | 評価の基盤。採点器、門の台本の本体、試験（[README](packages/pit-wall/README.md)） |
| `subjects/` | 評価の対象のハーネス・スキル |
| `runs/` | 実行の記録。門（`gate*`）、門の前にハーネスなしだけで場面を試した回（`screen*`）、対照の各回と、以前の実験のレポートと試行ごとの判定（[runs/README.md](runs/README.md)。生のログは入っていない） |
| `scripts/` | 門の台本、キットの点検、公開してよい中身かの検査（`check-public-tree.py`） |
| `docs/planning/` | 憲章、オーナーの決定の記録、計画と査読 |
| `docs/research/` | 調査の記録 |
| `docs/experiments/` | 以前の実験のレポート 46 本と、その一覧（[README](docs/experiments/README.md)。何を試し、何が分かり、どの主張を取り下げたか） |
| `docs/log/` | 作業ログ |
| `experiments/`・`suites/`・`spikes/`・`gates/` | 門より前の実験の設定・課題・試作・検査 |

## In English (short)

pit-crew holds role-based harnesses for AI coding agents (a harness is the set of skill and rule files handed to an agent) and the machinery to check a harness before release. Default skills exist for Dev, QM and fix; harnesses used as comparison targets in earlier experiments also cover PO, audit and platform. Only the Dev default skill has been through the release gate.

As of 2026-11-19, the Dev harness (default skill, version 8) has passed the release gate for its first release, with claude-fable-5-2 only. In the third gate run, 14 runs were tried 3 times each with and without the harness (84 trials), and all 28 in-gate contract rows passed with the harness. The gate was run three times: the first (version 7) failed, the second and third (version 8) passed. The third run repeated the second run's 10 runs and added 4 held-out scenes; only those 4 are new evidence.

With this model, no scene has been shown where the harness improves the outcome. On the 4 held-out scenes the bare model also passed 3 of 3. Read by each row's own check, 19 of the 28 rows held without the harness (one of the 19 depends on a reading; 18 under the other); by run, 6 of the 14 runs passed 3 of 3 without the harness. Differences appeared only in scenes the harness author had already seen, and with 3 trials they are not settled as differences. 26 of the 54 rows in the contract table are outside the gate and unmeasured. Only 2 kinds of real incidents (4 scenes) were covered. Median time was 239 s with the harness and 76.5 s without; median cost was USD 0.62 and 0.07.

The counting and pass criteria were fixed before the first model trial. The contract table and the scenes were also changed after trials, and between gate runs the grader (misreadings fixed) and the stand-in for the gh command were changed too, so we cannot say every case was fixed in advance; the release statement lists the changes. All roles, including the verifier who re-read every trial, are Claude-family models, and harness versions 6 to 8 were written by the same model that was tested. No cross-family check has been done.

What this release offers is the procedure: graders that do not read the harness text and are checked against scripted controls first, a gate that records the digests of its materials, a full re-read of every trial by a separate role, and a public statement limited to what the records support. Start with [kit/results/dev/release-statement.md](kit/results/dev/release-statement.md) (Japanese).

## ライセンス

[MIT](LICENSE)
