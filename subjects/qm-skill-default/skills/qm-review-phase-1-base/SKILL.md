---
name: qm-review-phase-1-base
description: QM の変更レビューの工程 V1（土台を固定する）の手順。qm-review スキルの指示で呼ぶ。
user-invocable: false
---

### V1 土台を固定する

**目的**: 判定の対象を「どの HEAD の、どの base に対する差分か」で固定し、見かけの緑に騙されない。手順 1〜4 が段階。

| # | 手順 | 要点 | 出典 |
|---|---|---|---|
| 1 | HEAD を固定する | `git ls-remote` で head の SHA を取り、以降の全確認で固定参照する（API の値は古いことがある） | 〔GQ〕qm-session §Authoritative HEAD |
| 2 | merge-base を測る | 空なら orphan（CI の全 pass は根拠にならない）。差分は three-dot で見る（two-dot は「まだ取り込んでいない」を「削除」と読ませる） | 〔事故〕I-23〔GQ〕qm-session §① |
| 3 | base 側も実物から読む | 作業ツリーでなく `git show origin/<base>:<path>` / API で取る | 〔GQ〕qm-session §base 側ファイル |
| 4 | Draft と未起動を確かめる | Draft は required が skip になり緑に見える。context 0 件は走っていない | 〔事故〕I-22〔GQ〕qm-session §Draft |

- **考え方**: 読む対象を固定しないと、後の確認がそれぞれ別の状態を見る（I-13・I-23）。土台の固定は読む前に 1 回だけ行う〔GQ〕qm-session
- **調査の範囲と深さ**: HEAD・base・merge-base・Draft の 4 点だけ。差分の中身は V3
- **背景・目的が不明なとき**: base が判別できない（複数の候補、PR の base が案件のレーンに無い）→ 作成者に問い、仮の base で読み進めない〔推論〕
- **矛盾するとき**: `gh pr view` と `ls-remote` が割れたら ls-remote を採り fetch してから読む〔GQ〕qm-session §Authoritative HEAD
- **成果物と受け渡し**: HEAD・base・merge-base・Draft の有無を判定記録の冒頭メタに
- **典型的な失敗**: Draft のまま approve（I-22）/ two-dot で削除と誤読（I-23）/ 別の HEAD で検査（I-13）
