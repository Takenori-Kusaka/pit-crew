# U1: サブスク認証で評価を回せるか（2026-10-31 調査）

## 結論

| 対象 | 判定 | 理由 |
|---|---|---|
| (a) ローカルの WSL2 で、サブスクにログインした状態で `claude plugin eval` を回す | **OK** | eval run も judge も、ログイン中と同じ認証で動き、プランの枠を消費する（plugin-evals）。`-p` のときに `ANTHROPIC_API_KEY` が環境にあるとそちらが優先されて課金されるので、必ず unset する（authentication） |
| (b) GitHub Actions で `CLAUDE_CODE_OAUTH_TOKEN`（サブスク）を使い、反復的に自動評価する | **グレー** | Actions のドキュメントは CI の選択肢として案内している。一方、規約は OAuth を「ordinary use」に向けたものとし、宣伝している上限も「ordinary, individual usage」を前提にしている。高頻度で反復すると逸脱と読まれる余地がある |

## 設計への影響

- `--max-cost-usd` / `costUsd` は定価で換算した推定値で、プランの枠の消費量ではない。予算の上限としては使えず、暴走を止める目安にとどまる
- 枠に達したときは、その run が 0 点になり、非 0 で終了する（partial 扱いにはならない）
- `-j` の並列実行はアカウントのレート制限を共有する
- CI からプランの枠の消費量を取る公式手段はない。`--json` の run 数と回数で管理する
- 公開 repo の注意点：fork から来た PR には secret が渡らない。schedule は 60 日間動きがないと止まる
- sandbox：Linux と WSL2 には bubblewrap と socat が必要。Ubuntu 24.04 以降は AppArmor が bwrap の user namespace を止めるので、`sysctl kernel.apparmor_restrict_unprivileged_userns` を確認し、bwrap 用のプロファイルを足す。コンテナ内で動かす回避策は sandbox を弱めるので使わない

## 方針

1. 重い比較（全 arm、judge あり）はローカル（WSL2）で回す
2. Actions の Claude 実行は頻度を絞る。`workflow_dispatch` と週次の `schedule` だけにし、push ごとには回さない
3. PR ごとの Actions では Claude を呼ばない検査だけを回す：スキーマ、依存の向き、L1 の単体テスト、保存済み transcript の再採点
4. Actions 側の実際の動き（token が子プロセスに渡るか、runner で bwrap が動くか）は smoke run で確かめる

## 未確認

- `CLAUDE_CODE_OAUTH_TOKEN` が eval の子プロセスまで渡るか
- bwrap の最小バージョン
- GitHub-hosted の ubuntu-24.04 で bwrap が動くか
- bwrap がないときに eval がどう振る舞うか
- Pro/Max の枠の具体的な値
- `/usage` を CI から取れるか

## 出典

code.claude.com/docs/en/{plugin-evals, authentication, github-actions, headless, sandboxing, costs, legal-and-compliance}.md, anthropic.com/legal/consumer-terms
