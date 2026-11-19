# 公開前の検証: README・主張の台帳「Dev — 出荷の門」・計画文書の一覧

書いた役: 公開前の検証役。対象の 3 文書と材料は読んだだけで、変えていない（書いたのはこのファイルだけ）。commit はしていない。
2026-11-19。

- 対象: `README.md`（作業木にあり、未追跡）、`docs/claims.md` の節「Dev — 出荷の門」（未 commit の変更を含む作業木の版）、`docs/planning/README.md`（未追跡）。
- 材料（自分で開いたもの）: `kit/results/dev/release-statement.md`、`kit/results/dev/verify-gate3.md`（全文）、`runs/gate3/run/verdict.md`・`verdict.json`、
  `kit/results/gate/dev/ledger.json`、`kit/release-rules.md`（第 7 版、全文）、`docs/planning/00-goal-charter.md`（1〜64 行）、
  `kit/results/dev/infra-scenes.md` §16.3、`scripts/release-gate.mjs`（使い方の注釈と終了コード）、`scripts/publish-snapshot.py`、
  `packages/pit-wall/package.json`、`gates/exp48/jev-ledger.json`、`docs/planning/` の各文書の見出しと日付、`origin/main` の木と log。
- 手で確かめたこと:
  - README と計画の一覧のリンク先を `git ls-files` と `test -e` で 1 つずつ確かめた（§3）。
  - `git archive HEAD scripts packages` を scratchpad に展開し（依存を入れない、新しい clone と同じ状態）、README の「自分で確かめる」のコマンドを走らせた。結果は所見 2。
  - 依存を入れた状態での読み直し（終了コード 3 になること）は走らせていない。`infra-scenes.md` §16.3 と台本の注釈で読んだ。

## 1. 所見の表（重い順）

| # | 対象・行 | 文書の文 | 材料の文と場所 | 重さ | 直し方の案 |
|---|---|---|---|---|---|
| 1 | README 25 行、33 行（表の「契約ケースの表」の行）、92 行（英語） | 「試す前に決めた約束の表と規則で確かめ」／「…を、試す前に決める」／"a contract table and release rules fixed before the trials" | `release-statement.md` §7.9: 看板の探りとふるい（ハーネスなしの試行）の後に表と場面を 13 点変えた。門 1 回目と 2 回目の間に表（下書き 7）・採点器・場面を変えた。門 3 回目の前に、ふるい 7 回目の結果を見た後で保留の場面の範囲に `CHANGELOG.md` を足した。「**そのため、『ケースは試行の前に全部決めた』とは言えない。**」。§7.8・`release-rules.md` 冒頭: 規則 第 7 版は試行の後（門 3 回目の後）に雛形を変えた | **誤り**（材料が「言えない」とした文を書いている。このリリースの主張の芯に当たる） | 「数え方と合否の基準は最初のモデルの試行より前に固定した。表と場面は、ハーネスなしの探り・ふるいの後と門の回の間にも変えた（中身は評価の結果 §7 の 9）。規則 第 7 版は試行の後に公開用の文だけを変えた例外」と書く。33 行は「試す前に決める（決めた後の変更は記録に残す）」。英語も同じに直す |
| 2 | README 51〜57 行「自分で確かめる」 | 「門 3 回目の採点は、docker もモデルも使わずにやり直せます」＋コマンド 1 行 | `packages/pit-wall/package.json` は `yaml` に依存し、`node_modules/` は追跡しない（`.gitignore` 2 行）。`release-gate.mjs` は `harbor-cases.mjs` を静的に読み、そこが `yaml` を読む。**依存を入れていない展開でコマンドを走らせると `ERR_MODULE_NOT_FOUND: Cannot find package 'yaml'` で止まった**（手で確かめた）。`release-statement.md` §8 は、依存を入れる手順を「記録の時点の木」の場合にだけ書いている | **誤り**（書いたとおりに打つと、新しい clone では必ず失敗する） | コマンドの前に `(cd packages/pit-wall && npm ci)` を置く。Node の版（`engines` は 20 以上）も書く |
| 3 | README 53 行・56 行 | 「手順と、やり直したときに出る終了コードの意味は、評価の結果 §8 にあります」＋ `--regrade-with-current` のコマンド | `release-statement.md` §8: このコマンドは印つきの読み直しで、判定は `not_a_gate_result`、**終了コードは 3**、結果は `regrade/` に書かれる。`infra-scenes.md` §16.3: `computed_with_current` は **`fail`** になる（理由は規則の版の違いだけで、ケースと行の結果は同じ）。台本 113 行: 合格 0・`not_a_gate_result` 3・ほか 1。§8 の「記録と 1 字も違わない」再現は commit `00137c99f` の木を使うが、**この commit は公開の `origin/main` に無い**（`git merge-base --is-ancestor` で否。公開は非公開の履歴を含まない） | **誤り**（読者を誤らせる。終了コード 3・「NOT A GATE RESULT」・`fail` を見た読者は、門が落ちたと読みうる。§8 へ送っても、§8 の主な手順は公開の木では実行できない） | README に直接書く:「このコマンドは終了コード 3 で終わり、判定は `not_a_gate_result` と出る。これは記録の後に規則（第 7 版）と門の台本が変わったための印で、期待どおり。ケースと行の結果は `regrade/verdict.json` で記録と同じ。`computed_with_current` が fail になるのも同じ理由」。§8 の commit `00137c99f` での再現は、公開の木では行えないと明記する（release-statement 側の直しが要る） |
| 4 | README 15 行、88 行（英語） | 「門は 3 回回しました。1 回目（第 7 版）は不合格、2 回目と 3 回目（第 8 版）は合格です」 | `verify-gate3.md` §7.4 の書ける文 1 つ目は、続けて「3 回目は、2 回目と同じ 10 実行に、ハーネスの作り手が見ていない保留の場面 4 実行を足した回」まで書く。§0 の 2:「3 回目は『新しいことを示した合格』ではない」。§7.2:「2 回目の合格が試行の運だけによるものではない、という程度の再現」 | **強すぎ**（2 回の合格が 2 つの独立した証拠に読める） | §7.4 の文の後半をそのまま足す。英語にも "the third run repeated the second run's 10 runs and added 4 held-out scenes" を足す |
| 5 | README 21 行 | 「ハーネスなしとの差が出たのは、作り手が前の回の結果を見て直した場面だけです」 | `release-statement.md` §4: 8 実行の状態の語は「差あり・未確定」で、「3 試行では、差を確定させない（規則 §3）」。`verify-gate3.md` §7.2: 差のうち「順序だけ 13 試行は依頼者への害は無い」、受入基準の場面は合格の形が 1 つだけ（§7.5 の 5） | **強すぎ**（「差が出た」だけだと、開発の場面ではハーネスが効いた、と読める。前の 17 行と合わせても、未確定であることが書かれていない） | 「差が出た（3 試行なので、差として確定させていない）のは…場面だけです」。できれば中身の 4 つ（自分でマージ 3/3 対 0/3 ほか）を §7.4 の文のまま並べる |
| 6 | claims.md DG-5 | 「受入基準が未記入の依頼で先に直す 3/3」 | `verify-gate3.md` §7.4 書ける文:「ハーネスなしは 3 回とも、題の不具合を直して commit し、残りを issue で聞いた。表は前者だけを合格にしている」。書けない文:「ハーネスなしは、受入基準が無いのに聞かずに実装した」。§7.5 の 5（合格の形が 1 つだけ） | **強すぎ**（「先に直す」だけでは、聞かずに直したと読める。書けない文に近い） | 「受入基準が未記入の依頼で、題の不具合を直して commit し、残りを issue で聞いた 3/3（表は、変えずに聞く形だけを合格にする）」 |
| 7 | README 29 行 | 「採点器は、ハーネスの文面を読みません。読むのは、ロールの手順の定義（データ）と、実行の記録と、終了状態だけです。そのため、どのハーネスにも同じ採点器を使えます」 | 前半は裏づく: 憲章 10 行（「採点器はハーネスの文面に結び付けない」）、規則 §8（採点器を書く役は `subjects/` を開かない）、`packages/pit-wall/src/kit/*.mjs` に `subjects`・`SKILL` の参照は 0（grep）。ただし採点器は契約ケースの表（`kit/contract/dev.json`）と部品の定義・検査（`kit_facts`）も読むので「だけ」は狭い。**「どのハーネスにも使えます」は、門で試したハーネスが既定のスキル 1 つ（となし）だけで、材料に裏づけが無い**（設計の意図） | **裏づけなし**（一般化に読める） | 「どのハーネスにも同じ採点器を使えるように作っています（門で試したハーネスは、既定のスキル 1 つです）」。読むものに「契約ケースの表と、場面の部品の検査」を足す |
| 8 | README 92 行（英語の節全体） | 英語の 3 段落 | 日本語の本文 23 行（所要時間 約 3 倍・費用 約 9 倍）、21 行（差は作り手が直した場面だけ）、63〜66 行（役はどれも Claude の系統、ハーネスの第 6〜8 版は評価されるモデルと同じモデルが書いた、実際の事故の場面は 2 種だけ）が、英語には無い。"an independent full re-read" は、同じ系統であることを書かずに "independent" と言う | **強すぎ**（英語だけを読む人には、不利な事実が 4 つ欠ける） | 英語に 1 段落足す: "Cost: median 239 s vs 76.5 s and USD 0.62 vs 0.07 per trial. Differences appeared only in scenes the harness author had seen. All roles, including the verifier, are Claude-family models, and harness versions 6–8 were written by the same model that was tested. Only 2 kinds (4 scenes) of real incidents were measured." |
| 9 | README 7 行・47〜49 行・`release-statement.md` 全体（README から送る先） | 「履歴は含みません」、リンク先の記録 | 公開の `origin/main` には、スナップショットの commit が 9 本ある（2026-11-04〜11-14）。`release-statement.md` と `runs/README-dev-gate-attempts.md` は、材料を commit（`ecf980066`・`1994ce9a1`・`00137c99f` ほか）で名指しするが、どれも公開の履歴に無い | **分かりにくい**（「履歴は含みません」は「非公開の作業の履歴」の意味だが、公開側には履歴がある。読者は名指しの commit を引けない） | 「非公開の作業リポジトリの履歴は含みません（記録が名指しする commit は、公開の履歴には無い）」と書く |
| 10 | README 20 行、claims.md DG-4 | 「門の中の 28 行のうち 19 行は、ハーネスなしでも 3 回とも成り立ちました」 | `release-rules.md` §7 の雛形「もともと満点が大半」: 「その行の検査だけで読むと」と、実行の単位（14 実行のうち 6 実行）の 2 つを並べ、「混ぜて 1 つの数にしない」。`verify-gate3.md` §7.4: 19 行のうち 1 行は §7.5 の 2 の読みに依る（注記どおりなら 18） | **分かりにくい**（規則 §7「下の雛形の〈 〉だけを埋める」からの逸脱。向きはハーネスに不利なので、強すぎではない） | 雛形の文をそのまま使う（README）。DG-4 にも「その行の検査だけで読むと」を足す。README に 18 の注を 1 句足す |
| 11 | README 17 行 | 「このハーネスが結果を良くする場面は、1 つも示せていません」 | 規則 §7 の雛形:「〈モデルの id〉では、このハーネスが結果を良くする場面を示せていない」 | **分かりにくい**（雛形からモデルの限定が落ちている） | 「claude-fable-5-2 では、」を頭に足す |
| 12 | README 13 行、88 行（英語） | 「14 の場面を、ハーネスあり・なしで各 3 回、合わせて 84 回試しました」／"14 scenes … (84 trials)" | `verdict.md`・`release-statement.md` §2: 84 試行は**門 3 回目**の数（門 1・2 回目は各 60 試行）。単位は「14 実行」（`dev-basic` の 7 実行は同じ部品の別のケース） | **分かりにくい**（直後の行で門を 3 回回したと言うので、84 が全回の合計に読める） | 「門 3 回目では、14 の実行を…84 回試しました」 |
| 13 | README 11 行、88 行（英語） | 「最初の『出荷の門』を通りました」／"passed its first release gate" | `release-statement.md` 表題「最初のリリース」、§3: 合格は 2 回目から | **分かりにくい**（「1 回目で通った」とも「門が何種類もある中の最初」とも読める） | 「最初のリリースとして、出荷の門を通りました」／"passed the release gate for its first release" |
| 14 | README 全体（用語） | 「出荷の門」（11 行で初出。定義が無い。36 行の表は台本の役目を書くだけ）、「契約ケース」「行」「門の中・外」（14・20・22 行）、「保留の場面」（40 行。19 行の「作り手が見ていない場面」と同じものだと書いていない）、「ふるい」（77 行）、「対照」（35 行）、「判定書」（36・45 行）、「digest」「印」（36 行）、「軌跡ファイル」（59 行）、「既定のスキル」「ハーネス」（3・11 行） | `release-statement.md` §2「用語」は、門・あり / なし・開発 / 保留・看板・状態の語を定義している。README には同等の節が無い | **分かりにくい**（文脈を知らない読者が、結論の節を読み下せない） | 「いま言えること」の前に 5〜6 行の用語の節を置く（門 = 試行の前に決めた表の行を、ハーネスあり・なしで各 3 回試し、ありの側の合否を決める検査、ほか。release-statement §2 から写す）。「ハーネス」は「AI エージェントに渡すスキル・規則のファイル一式」程度の 1 文 |
| 15 | README 全体・`docs/planning/README.md`（公開の手順との関係） | — | `README.md`・`docs/planning/README.md`・`LICENSE` は未追跡、`docs/claims.md`・`release-statement.md`・`00-goal-charter.md`・`00-owner-statements.md` は未 commit の変更あり（`git status`）。`publish-snapshot.py` は `--source HEAD` の **commit** から木を作り、`README.md` が source に無ければ公開側の古い README を使う（141 行） | **分かりにくい**（文の誤りではなく、出す前の条件） | 公開の台本を回す前に、対象の文書を commit する。`REDACTIONS.md` は作業木に無いが、台本が公開側から引き継いで足すので、リンクは公開の木で解決する（§3） |
| 16 | `docs/planning/README.md` 47 行（節 3 の時期）・51・52 行 | 「3. QM・fix ロール（2026-11-05〜11-12）」に 26・27 を置く | `26-qm-role-design.md`・`27-qm-role-evaluation-plan.md` は本文の日付も、git で足した日も 2026-11-04 | **誤り**（小さい） | 節 3 の時期を「2026-11-04〜11-12」にする（節 2 と 1 日重なることを許す） |
| 17 | `docs/planning/README.md` 42 行 | 「14〜22-status-summary-*.md ｜ 構造・規定の中身・届け方の実験の現状サマリー 9 本」 | 9 本は合う。ただし 21 の見出しは「D1 を確かめ切る」、22 は「Dev の評価（評価計画 12 の段 3・段 5）」で、構造・中身・届け方の実験ではない | **分かりにくい** | 「構造・規定の中身・届け方の実験（14〜20）と、D1 の確認・Dev の評価の段（21・22）の現状サマリー 9 本」 |
| 18 | `docs/planning/README.md` 87 行 | 「45-review-wbs/ ｜ 作業の木への査読 8 人ぶんと統合、目的に照らした監査、計画 48 の査読」 | ディレクトリには `09-v4-review.md`（計画 34 第 4 版と WBS 案の査読）もある。ほかに `issues-snapshot.md`・`tree.txt`・`wbs2-spec.mjs` | **分かりにくい**（挙げた中身が実物より少ない） | 「…、計画 34 第 4 版の査読、…」を足す |
| 19 | `docs/planning/README.md` 91 行 | 「番号の 37・44・47 は欠番」 | 正しい（37・44・47 のファイルは作業木にも git の履歴にも無い）。ただし `43-autonomous-plan.md` 71 行は `docs/planning/44-dev-agentops-eval.md` を作ると書き、`45-review-wbs/08-compliance.md` 31 行も「計画 44」を名指しする | **分かりにくい**（43 から 44 を探した読者が迷う） | 「44 は計画 43 が作ると書いたカードで、作らなかった」を足す |
| 20 | `docs/planning/README.md` 71 行（節 5 の前置き） | 「強いモデルがハーネスなしでも満点になり、差を測れなかった回が続いた（主張の台帳 DK-13〜17）」 | DK-14・15・17 は「成り立たない」だが、DK-13 と DK-16 は「弱まる」（DK-16 は「draft の PR で戻す」で 1/3・2/3 の差を出せた） | **強すぎ**（小さい。差がまったく無かったように読める） | 「…満点になることが多く、差を測れる場面をほとんど作れなかった」 |
| 21 | `docs/planning/README.md` 54 行 | 29 を「3. QM・fix ロール」に置く | 29 の目的の行:「成果物 1.1（ロール設計の評価）の E 系列」。QM に限った文書ではない | **分かりにくい**（小さい） | 置き場は変えずに、説明に「（ロールに共通）」と足す |
| 22 | README 3 行、86 行（英語） | 「ロールを分けた AI エージェント用のハーネス（Dev・QM・PO など）」／"a set of role-based harnesses" | `subjects/` にあるハーネスは Dev・QM・fix（と比較の相手）だけ。PO は `kit/roles/po.yaml`（手順の定義）だけで、ハーネスは無い | **裏づけなし**（小さい） | 「（Dev・QM・fix。PO などは手順の定義だけ）」 |
| 23 | README 64 行 | 「別の系統のモデルによる点検は、まだしていません」 | 裏づく: `docs/claims.md` 7 行（「未実施」）・101 行（「この門でもしていない」）。ただし以前の実験では、別系統のモデル（qwen3・Jev）を抽出・対応づけに使っている（`29-status-summary-e-series.md` の表、`gates/exp48/jev-ledger.json`）。点検ではないので矛盾ではない | **分かりにくい**（小さい） | 「この門の役（検証役を含む）はどれも Claude の系統で、別の系統のモデルによる点検はしていません」 |
| 24 | claims.md 節の前の 1 段落目 | 「下の行は、その形での結果である。別系統のモデルによる点検は、この門でもしていない」 | 同じ文書の 7 行:「これが済むまで、どの主張も『評価済み』とは書かない」。憲章 68 行は「成果物 1.1 の 6 つは Dev について形が揃った」 | **分かりにくい**（7 行の制限がこの節に効くのか解けたのか、書いていない。README 5 行の「評価済みの形で公開」と並べると、読者は Dev が評価済みかを決められない） | 「7 行の但し書きは、この節にも効く（別系統の点検が済むまで『評価済み』とは書かない）」か、その逆かを 1 文で書く |
| 25 | claims.md 節の前の 2 段落目 | 「公開の文は、そこに無い主張を書かない」 | README は、§7.4 と release-statement に無い主張を含む（所見 1・7 の文）。規則 §7「公開物の文は、門の台本の出力より強く書かない」 | **分かりにくい**（台帳の規則と README が食い違う。所見 1・7 を直せば解ける） | 所見 1・7 を直す |

## 2. 観点ごとのまとめ

- (a) 数字・版・回数・日付の食い違い: **無し**（文として材料と字が違う数は無い）。照合した値: モデル claude-fable-5-2、14 実行・84 試行、28 行（規則 13・振る舞い 15）、54 行のうち 26 行（48.1%）、19 行、3 回の門（1 回目 第 7 版 不合格、2・3 回目 第 8 版 合格。台帳の `gate`・`harness_version` と一致）、239 秒・76.5 秒、0.62 ドル・0.07 ドル、対照 76 本（通るはず 37・落ちるはず 39）、2 種（4 場面）、DG-7 の 318 秒 対 70 秒、`raw-sha256.txt` の 84 行。単位と範囲の書き方の問題は所見 10・12。
- (b) 材料より強く読める文: 所見 1・4・5・6・7・8・20。
- (c) 材料に無い主張: 「どのハーネスにも同じ採点器を使えます」（所見 7）、PO のハーネス（所見 22）。次は**裏づいた**:
  - 役の分け方（6 つの役）: `release-rules.md` §8 の役の表、`release-statement.md` §2「役の分け方」。
  - 「役はどれも AI です」・「役はどれも Claude の系統」: `release-statement.md` §2（「役は、どれも Claude のモデルが務めた」）、§7 の 10。ただし同 §2 は、一部の役はモデルを確かめていない（記録なし）とも書く。
  - 「人の採点は入れていません」: `docs/claims.md` 7 行（「人による校正は無い」）、憲章 74 行（2026-11-13「人の校正は入れない」）・83 行。
  - 「対照 76 本」: `verify-gate3.md` §5、`release-statement.md` §2。
  - 「約 80 MB」: `release-statement.md` §8。作業木の `runs/gate3/run/raw` も `du -sh` で 80M。
  - 「ハーネスの第 6〜8 版は、評価されるモデルと同じモデルの役が書きました」: `release-statement.md` §2。
  - 「残りは次の版に回しています」: 憲章 68 行。
  - 「不合格の回も記録ごと残しています」: `runs/gate1/run/` は 187 ファイルが追跡されている（`raw/` は除く）。
- (d) 文脈の無い読者に分かりにくい語: 所見 14（README の用語）、9、13。claims.md の節は「看板のケース」「保留の 4 場面」「開発の場面」を定義なしで使うが、`release-statement.md` §2 の用語へ送る 1 句があれば足りる。
- (e) 英語の節が日本語より強い・違う所: 所見 1（英語にも同じ誤り）、4、8、12、13。英語の "roles … never read the harness text" に当たる記述は日本語と同じで、問題は無い。
- (f) リンク切れ: **無し（公開の木で）**。README の 17 のリンク先と、計画の一覧の 5 つのリンクと、計画の一覧に挙げた 00〜48 のファイル（37・44・47 を除く）・`45-review-wbs/` は、すべて実在する。条件は所見 15（未追跡・未 commit の文書を commit してから台本を回すこと）。`REDACTIONS.md` は作業木に無いが、`origin/main` にあり、公開の台本が引き継いで足す。

## 3. リンクの確かめ（README）

`docs/claims.md`・`docs/kit-guide.md`・`docs/planning/00-goal-charter.md`・`kit/contract/dev.md`・`kit/README.md`・`kit/release-rules.md`・
`kit/results/dev/release-statement.md`・`kit/results/dev/verify-gate3.md`・`packages/pit-wall/README.md`・`runs/gate3/run/verdict.md`・`runs/README.md`・
`runs/README-dev-gate-attempts.md`・`scripts/release-gate.mjs`・`subjects/dev-skill-default/`（`CHANGELOG.md` も）は追跡済み。
`docs/planning/README.md`・`LICENSE` は作業木にあり未追跡（`LICENSE` は `origin/main` にもある）。`REDACTIONS.md` は `origin/main` だけにある。
本文で名指しする `runs/gate3/run/raw-sha256.txt` は追跡済みで 84 行。

## 5. 設計者の処置（2026-11-19、検証役の文ではない）

25 件を全部採った。直した先:

- 所見 1・4・5・7・8・9・10・11・12・13・14・22・23: `README.md` を書き直した（用語の節、「先に決めたことと、後から変えたこと」の節、開発の場面で見えた違いを §7.4 の文で並べた節、英語の節の不利な事実）。
- 所見 2・3: README の「自分で確かめる」に `npm ci` と Node の版を足し、終了コード 3・`not_a_gate_result`・`computed_with_current: fail` が期待どおりであることを書いた。設計者が今の木で実際に回し、終了コード 3 と、読み直しの `cases`・`rows`・`summary` が記録の `verdict.json` と同じであることを確かめた（出力の `regrade/` は確かめた後に消した）。`release-statement.md` §8 にも、公開のリポジトリでは commit `00137c99f` の手順を行えないことを足した。
- 所見 6・10・24・25: `docs/claims.md` の DG-4・DG-5 と、節の前の段落。
- 所見 15: 対象の文書を commit してから公開の台本を回す。
- 所見 16〜21: `docs/planning/README.md`。

## 4. 結論

**直さずに出してはいけない。** 所見 1（材料自身が「言えない」とした「試す前に決めた」を、日本語と英語の両方で、このリリースの主張の芯として書いている）と、所見 2・3（「自分で確かめる」が新しい clone では依存の欠けで必ず止まり、止まらなくても終了コード 3・`not_a_gate_result`・`fail` を説明していないので、読者が門の不合格と読みうる）を直してから出す。所見 4〜8 も、公開の前に直すことを勧める。

## 6. 2 回目の確かめ（2026-11-19）

書いた役: 公開前の検証役（2 回目）。ファイルはこの節の追記のほかは変えていない。commit はしていない。

- 開いたもの: `README.md`（全文）、`docs/claims.md` 1〜123 行、`docs/planning/README.md`（全文）、`kit/results/dev/release-statement.md`（全文）、
  `kit/results/dev/verify-gate3.md` 1〜240 行（§0〜§7.5 の 8）、`runs/gate3/run/verdict.md`（全文）・`verdict.json`、`kit/release-rules.md`（全文）、
  `kit/results/gate/dev/ledger.json`、`packages/pit-wall/package.json` の `engines`、`subjects/` と `kit/roles/` の一覧、`subjects/role-harness-v1/` の `agents/`・`skills/`・`SOURCE.md` 冒頭。
- 手で確かめたこと:
  - README のリンク先 21 個を `test -e` と `git ls-files` で確かめた。`REDACTIONS.md` だけが作業木に無い（`origin/main` にはあり、台本が引き継ぐ。1 回目 §3 と同じ）。ほかは追跡済み（`README.md`・`LICENSE`・`docs/planning/README.md` は index に足された状態 `A`）。
  - 依存が入った今の木（Node v26.13.0）で `node scripts/release-gate.mjs dev --grade-only runs/gate3/run --regrade-with-current` を回した。**終了コード 3**。
    最後の行は `NOT A GATE RESULT — 記録の時点と違う版で採点した`（違う digest は 3 つ: `kit/release-rules.json`、`release-gate.mjs`、`gate-run.mjs`）。
    `regrade/verdict.json` の `gate` は `not_a_gate_result`、`computed_with_current` は `fail`、`mark` は「記録の時点と違う版で採点した」。
    **`cases`・`rows`・`summary` は、記録の `verdict.json` と JSON の文字列として同じ**だった（違うのは `rules_version` 6→7・`gate`・`reasons`・`conditions`・`digest_check` と、足された `computed_with_current`・`mark`）。
    `regrade/verdict.md` は「公開物に書ける文も出さない」と書く（README の表「出荷の門」の行と合う）。確かめた後、自分が作った `runs/gate3/run/regrade/` だけを消した（`git status` で残りが無いことを確かめた）。
  - `npm ci` そのものは回していない（依存は既に入っていた）。`package-lock.json` があり、`engines` は `node >=20` で、README の「Node.js 20 以上」と合う。

### 6.1 25 件の所見

| # | 解けたか | 残り |
|---|---|---|
| 1 | 解けた | README 56〜58 行・英語 132 行が §7.9・§7.8 の中身で書かれている。ただし変えたものの列挙から採点器と gh の代役が落ちている（新しい所見 N3） |
| 2 | 解けた | — |
| 3 | 解けた | 終了コード 3・`not_a_gate_result`・`fail` と、`cases`・`rows`・`summary` が同じことを、今回も回して確かめた。`release-statement.md` §8（232 行）にも追記がある |
| 4 | 解けた | — |
| 5 | 解けた | — |
| 6 | 解けた | — |
| 7 | 解けた | — |
| 8 | 解けた | 英語の 19 行の文には、実行の単位（6/14）と 18 の注が無い（新しい所見 N5） |
| 9 | 解けた | — |
| 10 | 解けた | — |
| 11 | 解けた | — |
| 12 | 解けた | — |
| 13 | 解けた | — |
| 14 | 解けた | 用語の表ができた。「既定のスキル」（名前として使う）と「探り」（57 行）は定義が無いが、読み下すのを妨げるほどではない |
| 15 | 一部 | `README.md`・`LICENSE`・`docs/planning/README.md` は index に足されただけで、まだ commit されていない。`docs/claims.md`・`release-statement.md` は未 commit の変更のまま。公開の台本を回す前に commit する条件は残っている |
| 16 | 解けた | — |
| 17 | 解けた | — |
| 18 | 解けた | — |
| 19 | 解けた | — |
| 20 | 解けた | — |
| 21 | 解けた | — |
| 22 | **解けていない（1 回目の所見そのものが誤り）** | 1 回目は「PO は手順の定義だけで、ハーネスは無い」と書いたが、`subjects/role-harness-v1/` には `agents/po.md`・`skills/po/`（ほかに audit・platform）がある。案のとおりに直した README 5 行・英語 126 行は誤りになった（新しい所見 N1） |
| 23 | 解けた | — |
| 24 | 解けた | — |
| 25 | 解けた | 所見 1・7 が解けたので、README の文はどれも `release-statement.md` か §7.4 に出どころがある（N1・N2 は数でも主張でもなく、事実の誤り） |

### 6.2 新しい所見

| # | 対象・行 | 文書の文 | 材料の文と場所 | 重さ | 直し方の案 |
|---|---|---|---|---|---|
| N1 | README 5 行、126 行（英語） | 「ハーネスがあるロールは Dev・QM・fix です（subjects/）。PO などは、手順の定義（kit/roles/）だけがあります」／"Harnesses exist for Dev, QM and fix; other roles have only a procedure definition." | `subjects/` には `dev-skill-default`・`qm-skill-default`・`fix-skill-default` のほかに、`role-harness-v1`（`agents/` に audit・dev・platform・po・qm、`skills/` に同じ 5 つ）・`role-harness-v1.1`・`role-harness-v1-shop`・`ganbari-quest-v0`（`SOURCE.md`: po / dev / qm / platform / audit の役のスキル）がある | **誤り**（1 回目の所見 22 の案が誤っていた。PO のハーネスは比較の相手としてある） | 「既定のスキル（`*-skill-default`）があるのは Dev・QM・fix です。比較の相手のハーネス（`role-harness-v1` など）には、PO・audit・platform の役もあります。門を通したのは Dev の既定のスキルだけです」。英語も "Default skills exist for Dev, QM and fix; the comparison harnesses (role-harness-v1 and others) also cover PO, audit and platform." |
| N2 | README 128 行（英語） | "On 2026-11-19 the Dev harness (default skill, version 8) passed the release gate for its first release" | `ledger.json`: 合格した回の開始は 2 回目 2026-11-16T12:17、3 回目 2026-11-18T08:37。`release-statement.md` §3 の表も同じ。2026-11-19 は下書きの印を外した日（同 3 行） | **誤り**（小さい。門を通った日が 11-19 と読める。日本語は見出し「いま言えること（2026-11-19）」で、通った日とは書いていない） | "As of 2026-11-19, the Dev harness … has passed the release gate …" |
| N3 | README 57 行、132 行（英語） | 「契約ケースの表と場面は、試行の後にも変えています。ハーネスなしの探りの後、門の回と回の間、門 3 回目の前です」／"The contract table and the scenes were also changed after trials" | `release-statement.md` §7 の 9: 門 1 回目と 2 回目の間に「採点器（読み違いの直し）・通信の誘いの場面・gh の代役・表（下書き 7）」を、2 回目と 3 回目の間に「保留の 4 場面を足し、採点器を直した（`1994ce9a1`）」。変えたきっかけには、探りのほかに「ふるい」も挙がる | **強すぎ**（小さい。後から変えたものの列挙から採点器と gh の代役が落ちている。直前の 56 行「数え方と合否の基準は…固定」と並ぶと、採点器も試行の前のままだと読める） | 「契約ケースの表・場面・採点器（読み違いの直し）・gh の代役は、試行の後にも変えています。ハーネスなしの探りとふるいの後、…」。英語も "The contract table, the scenes, the grader (fixes for misreadings) and the gh stand-in were also changed after trials" |
| N4 | README 19 行（用語の表「開発の場面・保留の場面」） | 「保留の場面は、作り手に見せずに別の役が作った場面」 | `release-statement.md` §2 の用語と §5:「ハーネスに近い規則が無い、という意味ではない」。h-0022 には L1、h-0061 には「同じ型を探す」が別の出典から入っている（`verify-gate3.md` §7.3「場面は見ていなくても、規則は見ている」） | **分かりにくい**（保留の場面がハーネスにとって未知の型だと読める。README は保留での効果を主張していないので、強すぎではない） | 用語の表に「ハーネスに近い規則が無い、という意味ではない（評価の結果 §5）」を 1 句足す |
| N5 | README 130 行（英語） | "Read by each row's own check, 19 of the 28 rows held without the harness." | `release-rules.md` §7 の雛形「もともと満点が大半」は、行の数と実行の数（6/14）を並べる。`verify-gate3.md` §7.4: 19 のうち 1 行は読みに依る（18） | **分かりにくい**（雛形の半分だけ。向きはハーネスに不利） | "…; by run, 6 of the 14 runs passed 3 of 3 without the harness (one of the 19 rows depends on a reading; 18 under the other)." |
| N6 | README 26 行 | 「Dev のハーネス（既定のスキル 第 8 版）が、最初のリリースとして、出荷の門を通りました」と、続く箇条 | `release-rules.md` §7:「下の雛形の〈 〉だけを、出力の値で埋める」。雛形「門が合格」は版・モデル・28 件・規則 13 / 振る舞い 15・全回の版と合否を 1 文に持つ | **分かりにくい**（中身は 28〜31 行の箇条に全部あり、数の違いも強すぎもない。雛形の字面から外れていることだけ） | 規則 §7 の字面に合わせるなら、`release-statement.md` §3 の引用の文をこの節の先頭に置く。合わせないなら、そのままでよい |

### 6.3 新しく入った文の照合（N1〜N6 のほか）

- 用語の表: 「看板のケース」の「『このハーネスが直す』と公開物に書くため」は憲章 25 行・計画 48 の 23 行に同じ語がある。「対照」「判定書」「門の中・外」「実行」は `release-statement.md` §2・`verdict.md` と合う。
- 「開発の場面で見えた違い」（49〜52 行）: 4 つとも `verify-gate3.md` §7.4 の書ける文と字が合う（なしのマージの内訳と外への通信 0 を省いただけ）。47 行「作り手が前の回の結果を見て直した場面」は `release-statement.md` §1・§7 の 4 と合う。
- 「先に決めたこと」: 56 行・58 行は `release-rules.md` 5〜7 行と §7 の 8 と合う（58 行は「§1 の例」を省いているが、雛形の変更に含めて読める）。
- 「自分で確かめる」: 上の手で確かめたとおり。97 行（commit `00137c99f` の手順は公開の木で行えない）は `release-statement.md` §8 の追記と合う。
- 31 行「新しい証拠は、その 4 実行だけです」: `verify-gate3.md` §0 の 2「新しいのは保留の 4 実行だけ」と合う（§7.2 は残りの 10 実行を「運だけではない程度の再現」と読むが、README の文はハーネスに不利な向きなので問題にしない）。
- 英語の節: 数（14・84・28・54・26・4・2 種・239/76.5 秒・0.62/0.07 ドル・第 6〜8 版）はどれも日本語と材料に合う。N2・N3・N5 のほかに食い違いは無い。
- リンク切れ: 無し（`REDACTIONS.md` は公開の木で解決する）。

### 6.4 このまま出してよいか

**このままでは出さない。** N1（ハーネスのあるロールの事実の誤り。1 回目の所見 22 の案に由来）と N2（英語で門を通った日を誤る）を直し、N3 を直し、所見 15（対象の文書の commit）を済ませてから出す。どれも 1〜2 文の直しで、ほかの 24 件は解けている。

## 7. 2 回目の所見への設計者の処置（2026-11-19、検証役の文ではない）

- N1・N2・N3・N4・N5 は、検証役の案のとおりに `README.md` を直した（N1 は、公開側に中身を置いていない比較の相手の名前は挙げず、`role-harness-v1` だけを名指しした）。
- N6 は直していない。規則 §7 の雛形の文は `release-statement.md` §3 に字面どおり引用してあり、README はそこへ送る。README の箇条は雛形と同じ中身を分けて書いたもので、数の違いも強すぎも無い、という検証役の読みに依る。
- 所見 15: この commit で対象の文書を commit し、その後で公開の台本を回す。


## 8. 公開の直後に分かったこと: 公開側の CI が 1 手順で落ちた（2026-11-19、設計者）

- スナップショット `4f00c2b56` を push した直後、公開側の CI（`.github/workflows/kit.yml`）が最後の手順「generate cases and check scripted controls for every role」で落ちた。落ちたのは保留の 4 場面（`dev-h0022-1`・`-2`、`dev-h0061-1`・`-2`）で、手元でも同じに落ちる。公開の作業で壊れたのではない。保留の場面を足したのは前回の公開（2026-11-14）の後で、CI がこの場面を見たのは今回が初めてだった。
- 朝に通った全体の試験（1000 本）には、この手順（`gen-cases.mjs` を場面ごとにコマンドで回す）は入っていない。設計者は、全体の試験が通ったことで CI も通ると見ていて、確かめていなかった。
- 原因: この手順は Harbor に移る前の古い自己検査で、手本の終わりの状態を「書いたファイル」だけから作る。保留の場面が問う行（`direct-to-mainline`・`hand-back-via-branch-or-pr`・`same-kind-not-stopped`・`new-test-red-before-fix`）は、remote の branch の先や、直す前にテストが赤だったかの事実が要るので、この作り方では決められない。採点器は「判定不能」と答え、判定不能は合格にしない（規則どおり）。確かめ: 同じ 4 行が `undecidable` に出る（準拠 1.00、違反 0）。
- 門が使う側の検査は通っている: コンテナなしの再生（`simulatedControls`）で `dev-h0022-1` は 8 本、`dev-h0061-1` は 9 本とも作ったとおり（手本は pass）。門 3 回目の前の docker の対照 76 本も作ったとおり。**門 3 回目の判定には関わらない。**
- 処置: CI のこの手順で、仕込みの履歴を持つ場面（`stage:` の項目がある場面）を飛ばすようにした。理由は workflow の注釈に書いた。採点器・門の台本・場面・規則は変えていない。直した手順を手元で最後まで回し、終了コード 0 を確かめた。
- 残り: 古い自己検査（`gen-cases.mjs` のコマンドの `ok`）は、`docs/kit-guide.md` が新しいロールの合格の条件として案内している。仕込みの履歴を持つ場面では使えないことを、次の版で手引きに書く。
