# EXP-48 G4 のモデル不要の残り（Issue #56）— 実装役の報告

日付: 2026-11-15。役: 基盤の実装役。モデル呼び出し 0 回。`gates/exp48/G4.json` は書いていない。課題を「使う / 使わない」と決めていない。「不要」で閉じた項目は無い。
この文書にあるのは数・ハッシュ・パスだけで、対象リポジトリの本文・テストの題・issue の文は無い。生の出力は `local/exp48-gq/g4-out/`（git の外）。

## 一覧

| # | 項目 | 状態 | 残り |
|---|---|---|---|
| 1 | 課題ごと・木ごとの「もともと赤い一覧」 | **起動済み・メモリ待ち**（結果 0 / 48） | WSL の空きが 6 GiB に届けば自動で始まる |
| 2 | v03 の image の作り直しと tools / history / leak | **待ち**（上と同じ走行の最初の 2 単位） | 同上 |
| 3 | v19 の graphify の原因 | **原因は記録済み**（image の外で再現）。image の中での確かめは待ち | 同上（3 番目の単位） |
| 4 | 要求の本文 = gh 代役の issue 本文 | **検査は実装・実行済み**。代役 = キャッシュ = 作成役の写し 28 / 28。要求ファイルが 0 / 28 のため検査は不合格で止まる | 作成役が要求を書いた後に再実行 |
| 5 | `no-gq-content` の texts を fail closed に | **済み**。再実行は ok（一致 0 行） | `--all` は未実行。要求の置き場を必須にするかは査読役 |
| 6 | 自分が作る image での leak の段 | **待ち**（1 の走行が作る全 image で走るよう配線済み） | 同上 |

## 1. もともと赤い一覧（起動済み・メモリ待ち）

- スクリプト: `experiments/exp48/already-red.sh`（新規）。対象はふるい段 5 を通った 24 件（`image-verify.json` の `stage5 === true`。`G4.partial.json` の `dropped_at_stage5` の 4 件を除いた集合と同じ）。
- 単位は「課題 1 件 × 木 1 つ」。計画は 51 単位: 先に小さい 3 単位（v03 の両方の木、v19 の D）、次に A/B/C の木 24、最後に D の木 24。lock file ごとに並べ、依存 image は lock file が変わる時に消す。
- 1 単位 = image を作る → `checks`（`npx vitest run` を 1 回。network なし、6,144 MiB、上限 3,000 秒）→ `leak` → 木の image を消す。結果ファイルがある段は飛ばす（再開できる）。
- 守っている規則: 単位ごとにホスト全体の heavy lock を取り、終われば返す（docker は 1 本）。空きが 6 GiB 未満なら docker を始めずに 5 分おきに待つ（最長 72 時間で停止）。`build-images.sh` の E: 40 GiB / image 15 GiB の停止はそのまま（exit 5 で走行も止まる）。E: の空きは起動時 59 GiB。
- **いま止まっている理由**: WSL の利用可能メモリが 4,753〜4,867 MiB（上限 10 GB の設定）。WSL の中で、自分のものではないプロセスが動いている: OpenSearch のコンテナ `osja`（2.7 GiB、起動から 5 時間）と Python のサービス 1 本（1.9 GiB）。止めていない（自分の作ったものではないため）。Windows 側の空きは 9,354 MB。
- 起動: 2026-11-15 13:21（JST）、PID 938002、`setsid nohup`。起動したセッションが終わった後も生きていることを別の `wsl` 呼び出しで確かめた。log: `local/exp48-gq/g4-out/already-red/run-20261115T132108.log`、進行: `.../progress.log`。
- 結果の置き場: 生の結果 `local/exp48-gq/g4-out/already-red/<id>-<abc|d>-checks.json`、一覧 `<id>-<abc|d>-red.txt`（パスの一覧。local のみ）。追跡するのは `experiments/exp48/g4-machine.json`（件数、終了コード、秒、ピーク MiB、一覧の sha256、隠しテスト / 隣のテストのうち赤い件数、2 つの木の差の件数）。走行が単位ごとに書き直す。
- 一覧が無い実行（時間切れ・ファイルごとの記録なし）は「空の一覧」にせず `listed: false` と理由を書く（単体テストあり）。
- 見込み: 見本での実測は 1 回 1,325〜1,411 秒。A/B/C の 24 件で約 9.5 時間 + build、D も同じ。

進行の確認（WSL の中）:

```
tail -5 /mnt/e/Github/pit-crew/local/exp48-gq/g4-out/already-red/progress.log
ls /mnt/e/Github/pit-crew/local/exp48-gq/g4-out/already-red/*-checks.json 2>/dev/null | wc -l     # 48 で全部
```

再開（走行が止まっていた場合。同じ命令。済みの段は飛ばす）:

```
cd /mnt/e/Github/pit-crew && setsid nohup bash experiments/exp48/already-red.sh > local/exp48-gq/g4-out/already-red/run-$(date +%Y%m%dT%H%M%S).log 2>&1 < /dev/null &
```

走っている間は `already-red.sh` を編集しない（bash が読みながら実行している）。

## 2. v03 の作り直し（待ち）

- 走行の最初の 2 単位が `v03 abc: tools history leak` と `v03 d: tools history leak`。結果は `local/exp48-gq/g4-out/already-red/v03-<tree>-<phase>.json`、数は `g4-machine.json` の `rerun`。`image-verify.json`（54 / 56 のまま）は書き換えていない。
- docker を使わずに確かめられた分: v03 の build context の代役（`pitwall-gh/gh.mjs` + `snapshot.json`）は、両方の木で課題の issue に答え、本文はキャッシュと同じ（項目 4 の検査）。snapshot に「課題の issue が直前の commit より後に起票」の印があるのは v03・v06・v07・v09 の 4 件で、実装報告の記述と一致。

## 3. v19 の graphify（原因は記録済み。image の中は待ち）

- image の外での再現（docker なし）: `experiments/exp48/graphify-probe.sh`（新規）。同じ版（graphifyy 0.9.107）を `pip --target` で入れ、v19 の直前の commit の `graphify-out/` を手元の clone から取り出して `graphify explain <実装ファイル>` を実行。stderr は `local/exp48-gq/g4-out/graphify-probe/v19.stderr.txt`、数は `.../v19.json` と `g4-machine.json` の `graphify`。
- 結果: exit 1、出力 0 文字、`json.decoder.JSONDecodeError`（行 259175、列 7、文字 10692584）。落ちる場所は `graphify/paths.py:584 read_graph_json` → 標準の `json`。
- **原因**: v19 の直前の commit で追跡されている `graphify-out/graph.json`（blob `67511cb8b46b59f40ee9ce698edf45adc9681fa0`、28,259,558 バイト、sha256 `fbc4cc127b8133c335e4498a04ad468d2a4a29c1270baf6c2c6308848b70eb5d`）が JSON として壊れている。Python の `json` も node の `JSON.parse` も同じ位置で拒む。merge の衝突の印（`<<<<<<<` など）は 0 行、ファイルの終わりは閉じている。壊れているのは対象リポジトリのその時点のデータで、代役・道具の版・network ではない。
- 対照: 同じ道具で v14・v15・v16 は exit 0、出力 2,465〜3,639 文字、`graph.json` は読める。
- 壊れ方（その行の前後がどう食い違っているか）は調べていない。v19 の D で graphify をどう扱うかは決めていない。
- image の中での確かめ: `g4-in-image.mjs` に段 `graphify` を足した（実装ファイルごとに `explain`、stderr を結果の隣に残す、`graph.json` が読めるかを node と Python で聞く）。走行の 3 番目の単位（`v19 d: graphify tools leak`）と、D の木で `graphify-out/` を追跡する課題の単位で走る。

## 4. 要求の本文 = 代役の issue 本文（検査は済み。要求が未作成）

- スクリプト: `experiments/exp48/request-body-check.mjs`（新規）。課題ごとに、build context の中の代役そのもの（image に入るファイル）に `gh issue view <issue> --json title,body` と素の `gh issue view <issue>` を聞き、作成役の issue キャッシュ、作成役の写し（`local/exp48-gq/issues/<issue>.md`）、要求（`local/exp48-gq/tasks/<id>/instruction.md`）と比べる。比較は改行を LF にそろえ、末尾の空白を落とした文字列。
- 結果（`experiments/exp48/request-body-check.json`。実行のたびに `date` の欄が変わるので、ファイルのハッシュはここに書かない。入力のハッシュは同ファイルの `inputs`）: 28 件。代役の本文 = キャッシュ 28 / 28（両方の木）、題 28 / 28、素の表示が本文で終わる 28 / 28、写し = キャッシュ 28 / 28、context の `gh.mjs` = 今の shim 28 / 28。
- **要求ファイルは 0 / 28**（`local/exp48-gq/tasks/` が無い）。比べる相手が無いので検査は exit 1（「要求が書かれていない」を合格にしない）。要求は作成役が書く（`G4.partial.json` の open_items）。書かれた後に同じ命令を再実行する。検査は「要求が issue の本文を切れ目なく含む」ことを見る。

## 5. `no-gq-content` の texts（済み）

- 変更: `packages/pit-wall/src/realrepo/gq-content.mjs`、設定 `experiments/exp48/no-gq-content.json`。
  - texts は検査する入力の一覧になった。無い、またはテキストが 1 つも無い入力があれば STOP（exit 1）。設定に texts が無いときの既定（`local/exp48-gq/tasks`）も同じ扱い。
  - JSON の中の本文（issue の本文は JSON の 1 つの文字列で、ファイルの行ではない）は、文字列を取り出して行ごとにハッシュする。1 MiB の上限は texts には掛けない（キャッシュは 1 ファイルが大きい）。
  - 入力: `cache/`（issue 725・PR のキャッシュ）、`cache-v2/`、`issues/`（写し 50）、`build/` の下の gh snapshot（56）。`tasks/` は「任意」とし、無い間は実行のたびに「NOT checked」と出す。
- 変更前の設定で実行: STOP（texts の場所が無い）。fail closed になったことの確かめ。
- 変更後の再実行: 対象の行ハッシュ 512,123（98 commit、テキスト 112 ファイル、うち texts だけから来たもの 178,356）、変更ファイル 1,561 を走査、**一致 0 行、ok**。初回 90 秒（以後はキャッシュ）。
- 残り: `--all`（追跡ファイル全部）は実行していない。`tasks/` を必須にするか（今は任意。必須にすると作成役が書くまで commit が全部止まる）は決めていない。追跡ファイル側の JSON 文字列の中の行は、今も行単位でしか見ない。

## 6. 自分が作る image での leak（待ち）

- `already-red.sh` は作った image すべて（24 件 × 2 つの木 + 小さい 3 単位）で、mount なしで `/tests` が無いことを聞き、`leak` の段（隠しテストと同じバイトのファイルが image のどこにも無い）を走らせる。結果は `g4-machine.json` の `leak`（image の ID 付き）。
- 試行に使う image はこの走行の後に作り直されるので、この結果は「この build の手順が作る image」についてのもの。試行の直前の検査は別に要る。

## 作ったもの・変えたもの

| ファイル | 内容 |
|---|---|
| `experiments/exp48/already-red.sh` | 項目 1・2・3・6 の走行（待つ・再開できる・1 本ずつ） |
| `experiments/exp48/g4-machine-collect.mjs` → `g4-machine.json` | 生の結果から数とハッシュだけを集める |
| `experiments/exp48/request-body-check.mjs` → `request-body-check.json` | 項目 4 |
| `experiments/exp48/graphify-probe.sh`・`.mjs` | 項目 3（image の外） |
| `experiments/exp48/g4-in-image.mjs` | 段 `graphify`、`G4_VITEST_SEC`、`checks` に関連ファイル数 |
| `packages/pit-wall/src/realrepo/gq-content.mjs`、`experiments/exp48/no-gq-content.json` | 項目 5 |
| `packages/pit-wall/test/realrepo-g4-machine.test.mjs`（5 件）、`realrepo-gq-content.test.mjs`（+2 件） | 両方向のテスト |

単体テスト全体: 378 件、通過 375、失敗 0、skip 3（Windows。skip は以前からの 3 件）。

## していないこと（この依頼の 6 項目の外。Issue #56 の受け入れ条件には残る）

- D の木の対照（参照の修正 / 変更なし）を 3 回ずつ。`runners/harbor.mjs run()` での最初の 2 課題 × 4 条件。`jev-audit.mjs` の E2 の問いの削除。v08 の D の木での失敗の原因。
- `no-gq-content --all`。
- 順番（`task-order.json`）が決まっていないので、24 件すべてを対象にした。「使う課題」は決めていない。

## 別の役に見てほしい点

1. メモリの待ち: 自分のものではないプロセス 2 つを止めるかどうか。止めなければ走行は始まらない（72 時間で止まる）。
2. `already-red.sh` は lock file が変わる時に `docker builder prune -af` を呼ぶ（`image-verify.sh` と同じ）。他の実験の build cache も消える。
3. `g4-machine.json` の `redByTopDir` は 3 階層までのディレクトリ名と件数（パスは指し示しとして許されている範囲と判断した）。
4. v19 の D の木では graphify が答えない。原因はその時点の対象のデータ。扱いは未決。
5. `tasks/` を `no-gq-content` の必須の入力にするかどうか。
6. 待っている間に他の役が heavy lock を長く持つと、この走行はその後ろで待つ（最長 72 時間）。
