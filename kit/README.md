# ハーネスキット

新しいロールのハーネスを、半日で設計し、半日でテストしてリリースするための道具一式。目的と期限は `docs/planning/36-goal-2026-11-14.md`。

| 置き場 | 中身 |
|---|---|
| `kit/schema/role-spec.md` | 手順の定義の書式（データの形と、検出の語彙） |
| `kit/templates/role-spec.yaml` | 新しいロールで埋める雛形 |
| `kit/templates/role-spec.example.yaml` | 記入例（架空の小さなロール） |
| `kit/roles/<role>.yaml` | ロールごとの手順の定義。**ハーネスの文面からではなく、ロールの決定権とピットイン開発プロセスから書く** |

原則:
- 手順の定義は、測られるハーネスから独立したデータにする。採点器は手順の定義と、実行の記録（transcript）・終了状態だけを読み、ハーネスの文面を読まない（先例: SOPBench、ST-WebAgentBench、τ²-bench、agentevals。`docs/research/research-process-evidence-evaluation.md`）
- 検出は、道具の呼び出しの事実と終了状態で書く。文章の言い回しでは判定しない
- 進み具合は `node scripts/kit-check.mjs` で確かめる
