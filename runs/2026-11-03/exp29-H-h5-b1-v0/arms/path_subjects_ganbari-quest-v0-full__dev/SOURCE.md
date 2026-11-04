# ganbari-quest-v0-full（GQ のハーネスを丸ごと別のプロジェクトに写したもの）

- 出典: `subjects/ganbari-quest-v0`（GQ commit 0b32d8bab の skills 5・agents 5）に、Dev が読む docs/sessions（12 ファイル、218162 バイト、同じ commit）を `workspace/` として足した。手を加えずに写した
- 位置づけ（オーナー 2026-11-03）: 性能評価で汎用の Dev スキルと比べる相手の 1 つ。「汎用化せずに GQ のハーネスを新しいプロジェクトに写して使ったら」
- Harbor の runner は `workspace/` を作業ツリーに置き、git から隠す（課題の履歴にも他の arm にも入らない）
- 作り直し: `node experiments/structure/make-v0full.mjs <GQ のクローン>`。秘密の形（トークン・Webhook・鍵・メールアドレス）と会社の情報の語を検索し、1 つでもあれば止まる
- 載せた文書: docs/sessions/dev-session.md、docs/sessions/README.md、docs/sessions/label-mailbox.md、docs/sessions/branch-strategy.md、docs/sessions/dev-process/README.md、docs/sessions/dev-process/anti-patterns.md、docs/sessions/dev-process/completion-principles.md、docs/sessions/dev-process/feature-change-lateral-spread.md、docs/sessions/dev-process/github-api-head-staleness.md、docs/sessions/dev-process/parallel-agent-ops.md、docs/sessions/dev-process/qm-fix-patterns.md、docs/sessions/dev-process/research-discipline.md
