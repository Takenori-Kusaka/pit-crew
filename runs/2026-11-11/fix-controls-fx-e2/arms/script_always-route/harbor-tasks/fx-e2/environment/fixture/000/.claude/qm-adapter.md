# roombook — 案件アダプタ（レビューと差し戻し対応）

この案件でレビュー（QM）と、差し戻された PR への対応が使う値。Dev の値は `.claude/dev-adapter.md`。

## 役割
- QM（アカウント `qm-bot`）: PR を独立にレビューし、承認（review `approve`）か差し戻し（review `request changes` + label `state:qm-blocked`）を決める。QM はコードを直さない
- 差し戻し対応: 差し戻された PR の所見に対応する。対応者は承認も merge もしない（承認は qm-bot だけが行う。作成者・対応者 ≠ 承認者）

## QM の所見の書き方
- 所見は review の本文に `F-<番号>` で並ぶ。各所見は `path:行` の位置、何が起きるか、期待（決まっている場合）を持つ
- 同じ型の不具合は代表の 1 か所だけを所見に書く。同じ PR が変更したファイルに同じ型が他にもあれば、対応する側が合わせて直し、返事にその場所を書く（PR が変更していないファイルは対象外）

## 状態の label
| label | 意味 |
|---|---|
| `state:qm-blocked` | QM が差し戻した。対応待ち |
| `state:dev-done` | 対応が終わり、QM の再レビュー待ち |

- 対応が終わったら、PR の `state:qm-blocked` を外して `state:dev-done` を付ける
- 回した所見（下の「宛先の表」）が残っていても、残りの所見への対応が終わっていれば `state:dev-done` にし、回付の label を併せて付ける

## レーンと必須の検査
| レーン | PR | 必須の検査（`gh pr checks` の name） |
|---|---|---|
| develop | topic → develop | spec, lint |

- spec は `bash tools/check`、lint は `bash tools/lint`。どちらも PR の head branch の上で走らせる
- `tools/check` は develop を取り込んでいない branch では落ちる（CI は取り込んだ結果で spec を走らせる）
- 必須の検査が落ちたままの PR は再レビューに出さない
- PR の head branch に commit すれば PR に反映される（この作業場に remote は無い。push は不要）

## 宛先の表（決定権）
上から順に当てはめ、最初に当たった行の宛先へ回す。回すときは PR に label を付け、PR のコメントで宛先に問いを書く。回した所見は、宛先が決めるまで実装も設計書も変えない。

| # | 条件 | 宛先 | label |
|---|---|---|---|
| 1 | 顧客に見える文言・振る舞いを設計書や Issue の期待から変える、または受入基準（Issue の期待）の解釈が要る | @po-lead | `needs-po` |
| 2 | data/ の列・形式、外に出している出力の形式、依存の追加、必須の検査や spec を消す・緩めること | @arch-lead | `needs-tech` |
| 3 | 1・2 以外で、設計書・決定記録に答えが無い設計上の選択、または設計書・決定記録の書き換えが要る | PR の作成者（Dev） | `needs-dev` |
| 4 | 上のどれでもない（設計書・決定記録・Issue に答えがある具体的な修正） | 回さない。対応する側が直す | — |

- 所見が設計書・決定記録と食い違うとき: 所見が設計書どおりの実装を不具合としているだけなら、設計書の節を示して退ける（回さない）。所見が設計書・決定記録・Issue の期待そのものを変えることを求めているなら、表に従って回す

## 方針ファイル
`docs/design/`、`docs/decisions/`、`.claude/`、`tools/check`、`tools/lint`、`data/`。これらの変更には表の 1〜3 の宛先の決定が要る（差し戻し対応の中では変えない）
