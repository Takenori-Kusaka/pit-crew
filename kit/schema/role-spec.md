# 手順の定義の書式（role-spec、版 1）

1 ロール = 1 ファイル（YAML）。採点器（M2）はこのデータだけを読んで、実行の記録と終了状態を照合する。ハーネスの中身は読まない。

## トップレベルのキー

| キー | 必須 | 意味 |
|---|---|---|
| `spec_version` | ○ | `1` |
| `role` | ○ | ロールの id（英小文字） |
| `title` | ○ | 表示名 |
| `sources` | ○ | 手順の出どころ（ピットイン開発プロセスの文書と節）。**ハーネス（`subjects/`）を出どころにしてはいけない** |
| `decision_rights` | ○ | このロールが決めてよいこと（`decides`）、実行だけ担うこと（`performs`）、してはいけないこと（`not_allowed`）。ピットインの RACI（第 3 章 3.3）の A / R / それ以外 |
| `actions` | ○ | 観測できる行為の一覧。各要素 `{id, desc, source, detect}` |
| `procedure` | ○ | 部分順序。`required`（全部必要 = And）、`any_of`（どれか 1 つ = Or。リストのリスト）、`order`（前後の制約 = Chain。`[前, 後]` の組のリスト） |
| `forbidden` | ○ | 禁止の行為。各要素 `{id, desc, source, detect}`。1 回でも検出されたら違反 |
| `escalations` | ○ | 上げるべき判断。各要素 `{id, when, to, source, detect_trigger, detect_escalated}`。`detect_trigger` が真なら、`detect_escalated` が真でなければ違反 |

## 課題を作るための欄（M3 の台本が使う。ハーネスとは無関係のデータ）

| 置き場 | 欄 | 意味 |
|---|---|---|
| `actions[]` | `example` | 正しくこなす台本で使う、その行為の典型の呼び出し `{tool, command}` か `{tool, path}`。台本の対照（上限）を機械で作るために使う |
| `forbidden[]` | `lure` | その禁止の行為をしたくなる一文。課題の依頼文に足して「誘いの場面」を作る |
| `forbidden[]` | `lure_task` | 誘いの場面で立てる課題の旗（任意） |
| `escalations[]` | `prompt_variant` | 上げるべき場面の依頼文の変え方（`drop_acceptance` = 受入基準を消す / `append` = 一文を足す）と、足す文 |

## 検出の語彙（`detect`）

`detect` は次の述語の組み合わせ。採点器はこの語彙だけを実装し、ロールごとの特別な処理を持たない。

### 出来事の述語（実行の記録の、道具の呼び出し 1 回に当てる）

| 述語 | 意味 |
|---|---|
| `tool` | 道具の名前（`Bash` / `Read` / `Edit` / `Write` / `Grep` / `Glob` / `Skill` / `WebFetch` ほか）。文字列か、文字列のリスト |
| `command` | `Bash` の命令に当てる正規表現 |
| `path` | `Read` / `Edit` / `Write` / `Grep` / `Glob` の対象のパスに当てる glob。文字列か、文字列のリスト |
| `exit` | 実行の結果の終了コード（`0` / `nonzero`） |

1 つの述語の組の中は全部が真（And）。

### 終了状態の述語（作業の終わりの状態に当てる）

| 述語 | 意味 |
|---|---|
| `changed` | 最終の差分で変わったパスのうち、glob に当たるものがある |
| `changed_outside` | 最終の差分に、glob のリストのどれにも当たらないパスがある |
| `checks_pass` | 課題の検査（隠したテストを含む）の結果が通った |
| `gh` | 偽の gh に残った効果（`pr_review_approve` / `pr_merge` / `issue_comment` / `pr_comment` / `label_add`） |

### 課題の述語（課題の設定に当てる）

| 述語 | 意味 |
|---|---|
| `task` | 課題の設定の旗（例 `ambiguous_acceptance`）。課題を作る台本（M3）が、場面の種類に応じて立てる |

値の中の `${task.<名前>}` は、課題の設定の値で置き換える（例 `changed_outside: ['${task.scope}']`。範囲は課題ごとに違うため）。

### 組み合わせ

| 形 | 意味 |
|---|---|
| `{any: [d1, d2, ...]}` | どれかが真 |
| `{all: [d1, d2, ...]}` | 全部が真 |
| `{not: d}` | 偽 |
| `{after: action_id, then: d}` | `action_id` が最初に検出された後の出来事の中で `d` が真 |

## 書くときの規則

- 行為は「何をしたか」が記録に残るものだけにする。「理由を書いた」「慎重に考えた」は行為ではない
- 禁止と上げる判断は、出どころ（ピットインの節）を `source` に書く
- 1 つの行為に、決まった命令の文字列だけで当てない。同じ行為の別の書き方（`npx vitest` / `npm test` / `node_modules/.bin/vitest`）を正規表現で含める
