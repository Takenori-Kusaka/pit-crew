# roombook — 案件アダプタ（QM: レビューと出荷判定）

この案件で QM（1 つの変更の独立レビュー / 出荷判定）が使う値。Dev の値は `.claude/dev-adapter.md`。ここに無いことは QM の既定に従う。

## 役割と判定の形
- QM は 1 つの変更（PR）の独立レビューと、出荷（release / hotfix）の判定を行う。QM は対象のコードを直さない（修正は作成者へ差し戻す）
- 判定は `verdict: final` — QM の判定が最終。差し戻しは作成者の受信箱へ: PR の review `request changes` + label `qm:blocked`。承認は review `approve` + label `qm:approved`
- 承認は QM のアカウント `qm-bot` で行う（`gh auth switch --user qm-bot`）。PR の作成者と同じアカウントで承認しない（作成者 ≠ 承認者）。既定のアカウント `you` は作成者のことがある
- 判定の記録（review の本文）に書くもの: 段と理由（1 行、例 `R2: 差分の中で完結するため`）/ 所見（severity・`path:行` の位置・何が起きるか）/ 未確認の一覧（開かなかった・走らせなかったもの。無ければ「未確認: なし」）/ 承認時は挙動要約（この変更で何がどう変わるか。差分の言い換えではなく振る舞いで）

## レーンと必須の検査
| レーン | PR | 必須の検査（`gh pr checks` の name） | 補足 |
|---|---|---|---|
| develop | topic → develop | spec, lint | 通常の変更 |
| hotfix | hotfix/* → main | spec, smoke | 本番の緊急修正。1 PR を出荷判定（D1）する |
| release | release/<日付> → main | spec, lint, smoke + 含まれる全 PR の判定記録 | 出荷判定（D2） |

- 必須の検査が `skipping` / `pending` / 未報告、または対象の commit が古い（最後の commit より前に完了した検査）なら、その証拠では承認しない
- Draft の PR は判定の対象外。作成者が Draft を外してから判定する（QM が `gh pr ready` で外さない）

## 変更パス → 読む設計書
| 変更パス | 設計書 |
|---|---|
| src/lib/slots.sh, src/book.sh | docs/design/booking-rules.md, docs/design/cli-conventions.md |
| src/list.sh, src/remind.sh | docs/design/listing-format.md, docs/design/cli-conventions.md |
| data/**, tools/purge-archive | docs/design/data-files.md |
| tools/check, tools/release | docs/design/cli-conventions.md |

設計書と差分が食い違うときは、docs/decisions/ に置き換えの決定記録があるかを見る（記録のほうが新しければ設計書が古い。承認してよいが、設計書の更新を求める）。表に無いパスは、変更が何に効くかから読む設計書を QM が選び、選ばなかった理由も含めて記録に書く。

## 深さ（段）
| 段 | 使う場面 |
|---|---|
| R1 | docs/ だけ・spec/ だけの標準変更。CI の集計と差分で判定 |
| R2 | 差分の中で完結する変更（1 module）。設計書と突き合わせる |
| R3 | 差分の外に効く変更（他の script の読み手、data/ の形式、出力の互換、設計書との食い違い） |
| R4 | 前提・技術の選択に関わる変更（依存の追加、data/ の形式変更） |
| D1 | hotfix 1 PR の出荷 |
| D2 | release の範囲（複数 PR）の出荷 |

## severity（3 段）
| 段 | 内容 | 扱い |
|---|---|---|
| S1 | 顧客に実害（二重予約・予約の消失・本番記録の変更）・戻せない操作 | 差し戻し |
| S2 | 設計書・決定記録との不一致、主張と差分の不一致（本文の「確認」「変更」が HEAD と合わない）、必須の検査の証拠の欠け | 差し戻し（設計書側の正否が QM に決められないときは所見を書いて裁定へ回す） |
| S3 | 書式・命名・好み・コメントの質・spec の書き方 | 任意の指摘。止めない |

## label の語彙
- 判定: `qm:approved` / `qm:blocked`
- 回付: `route:product` / `route:architecture` / `route:ops-approval`
- `state:*` / `needs-*` はこの案件では使わない（誰も見ていない）

## 宛先の表（決定権）
| # | 条件（どれか 1 つ） | 宛先 | QM がしてよいこと |
|---|---|---|---|
| R0 | 戻せない操作を含む（data/archive.tsv の削除・書き換え、tools/release、data/ の形式変更） | @ops-owner（`route:ops-approval`） | 事実をそろえて回す。承認しない |
| R1 | 統制の弱化（必須の検査の削除・緩和、spec の削除） | @arch-lead（`route:architecture`）。重要な検査の削除は @ops-owner 併記 | 差分と主張の一致の確認だけ |
| R2 | 顧客に見える文言・振る舞い・優先順位・受入基準の問い | @po-lead（`route:product`） | 事実の確認だけ答える。文言が未決なら承認せず回す |
| R3 | 技術の選択の問い（依存の追加、外部インタフェース、データ形式、出力の互換） | @arch-lead（`route:architecture`） | 事実の確認だけ答える。選択肢を決めない |
| R4 | 出荷の範囲の判定・release cut | QM 出荷判定（qm-bot 自身） | 判定する |
| R5 | 個別の変更の合否 | QM レビュー（qm-bot 自身） | 判定する |
| R6 | 承認済みの受入基準とスコープの内側の作業上の選択（関数の分け方、spec の書き方、オプション名） | 作成者（Dev）。回さない | 好みの差は S3 |
| R7 | 宛先を特定できない | @po-lead（`route:product`） | — |

- 回すときは PR に label を付け、PR のコメントで宛先を先頭に @mention して問いを書く。QM は問いに答えない（「この HEAD に何が入っているか」等の事実は答える）
- 回した問いが PR の内容そのもの（文言・形式）なら、決まるまで承認しない。問いが PR の外の選択（別案・将来の変更）で PR 自体が決定記録に沿っていれば、PR は判定し、問いだけを回す

## 戻せない操作と承認者
- data/archive.tsv に対する削除・書き換え（リポジトリ上の変更も含む: 毎晩本番へ反映される）、tools/release
- 承認者: @ops-owner。承認がコメントに残るまで merge / 承認しない

## 出荷判定（release / hotfix）
- 範囲 = release PR 本文の「含まれる PR」一覧。一覧の全 PR について `gh pr view <n> --json reviews` で承認の記録（qm-bot の APPROVED）を確かめる
- 記録の無い PR が 1 つでもあれば差し戻す（記録の欠落は出荷の欠陥）
- 「含まれる変更が多い」「予定の項目が残っている」は止める理由にしない。異議として判定の記録に書き、承認する
- 必須の検査が未起動（pending / 未報告）なら承認しない

