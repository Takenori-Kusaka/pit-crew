# docs/planning/ — 計画・設計・査読の一覧

このディレクトリには、いま有効な文書と、途中で捨てた案・失敗した進め方の文書が、どちらも残っている。消していない。誤った進め方の記録は、それが手元にあって初めて後から確かめられるため。

**いま有効なのは次の 4 つ。** ほかは経緯として読む。

| 文書 | 内容 |
|---|---|
| [00-goal-charter.md](00-goal-charter.md) | 憲章。目的、成果物と完了の定義、現在地 |
| [00-owner-statements.md](00-owner-statements.md) | オーナーの発言と決定の記録（問いと選択肢の全文つき） |
| [48-evaluated-release-plan.md](48-evaluated-release-plan.md) | 評価済みリリースの計画（憲章 1.1 の 2026-11-15 改訂を満たす道） |
| [../claims.md](../claims.md) | 主張の台帳。公開の文は、ここに無い主張を書かない |

最初のリリースの結果は [kit/results/dev/release-statement.md](../../kit/results/dev/release-statement.md) にある。

## 経緯（時期の順）

### 1. 企画と最初の設計（2026-10-31〜11-01）

| 文書 | 内容 |
|---|---|
| 01-proposal.md | 企画書 |
| 02-design.md | 設計書 |
| 03-validity.md | 評価の妥当性（偽判定を作らないための設計） |
| 04-context-cases.md と `.review*.md` 4 本 | 文書の矛盾と権限外の質問の評価の設計と、独立レビュー 4 回 |
| 05-shortcut-resistance.md | 近道に強い評価と、具体例をハーネスに焼き込まない作り方 |
| 06-where-we-are.md | ここまでの整理と、次の分かれ道の問い |
| 07-v1-and-cells.md | 汎用ハーネス v1 の方針と、それを測る課題 |
| 08-experiment-plan.md | 計画の立て直し: 前提を疑う実験の順序 |
| 09-direction-after-ceiling.md | 方向転換の条件に当たった後の整理 |
| 10-status-summary.md | 現状サマリー（2026-11-01） |

### 2. Dev ロールの設計と、構造の実験（2026-11-02〜11-04）

| 文書 | 内容 |
|---|---|
| 11-dev-role-design.md | 汎用 Dev ロールの設計書 |
| 11-dev-role-design.review.md・.critique.md | 出典照合レビューと批判的レビュー |
| 11-dev-role-design.v3〜v7-candidate.md | 設計書の第 3〜7 版の候補（採らなかった案を含む） |
| 12-dev-role-evaluation-plan.md | Dev ロールの評価計画 |
| 13-context-minimal-staged-skills.md | 文脈を小さく保ったまま段階的なスキルの実行を保つ研究計画 |
| 14〜22-status-summary-*.md | 構造・規定の中身・届け方の実験（14〜20）と、D1 の確認・Dev の評価の段（21・22）の現状サマリー 9 本 |
| 23-process-evidence-evaluation-design.md | プロセス準拠と根拠の評価の設計 |
| 24-status-summary-dev-stage.md | Dev の評価の段の現状サマリー |
| 25-audit-summary-dev.md | 第三者向け監査サマリー（2026-11-04 時点。その後の訂正は主張の台帳） |

### 3. QM・fix ロール（2026-11-04〜11-12）

| 文書 | 内容 |
|---|---|
| 26-qm-role-design.md・.review.md | 汎用 QM ロールの設計書と査読 |
| 27-qm-role-evaluation-plan.md | QM ロールの評価計画 |
| 28-status-summary-qm-stage.md | QM の段の現状サマリー |
| 29-status-summary-e-series.md | 設計の根拠の質を人のラベル無しで測る系列（ロールに共通） |
| 30-fix-role-design.md | 汎用 fix ロールの設計書 |
| 31-fix-role-evaluation-plan.md | fix ロールの評価計画 |
| 32-status-summary-fix.md | fix ロールの評価の状況（採点器の誤りで主張を取り下げた回） |

### 4. 測り方の誤りが見つかった後の立て直し（2026-11-12〜11-13）

| 文書 | 内容 |
|---|---|
| 33-evaluation-process-v2.md | 評価の進め方 v2（測定が正しいことを先に確かめる） |
| 33-review-redteam.md | 上の反対側からの査読 |
| 34-dev-real-failure-evaluation-plan.md | 実際の失敗を課題にする Dev の評価計画 |
| 34-review-g5.md | 上の査読 |
| 35-charter-status-2026-11-13.md | 憲章の成果物ごとの現在地 |

### 5. キットでの評価と、天井（2026-11-14〜11-15）

合成の小さな課題では、強いモデルがハーネスなしでも満点になることが多く、差を測れる場面をほとんど作れなかった（主張の台帳 DK-13〜17）。

| 文書 | 内容 |
|---|---|
| 36-goal-2026-11-14.md | この週の目標の文 |
| 38-dev-kit-evaluation.md | 実験カード: キットで Dev のハーネスを評価し、1 回改善する |
| 39-dev-kit-cases-v2.md | 実験カード: ケースを条件の差を測れる作りに直す |
| 40-dev-kit-power.md | 実験カード: 判定を定める力を持たせる |
| 41-dev-kit-hidden-scenes.md | 実験カード: 強いモデルでも天井にならない場面 |
| 42-dev-kit-probe.md | 実験カード: 天井にならない場面の型を安い探りで見つける |

### 6. 「評価済み」の定義の改訂と、出荷の門（2026-11-15〜11-19）

| 文書 | 内容 |
|---|---|
| 43-autonomous-plan.md | 自律で進める計画 |
| 45-review-wbs/ | 作業の木への査読 8 人ぶんと統合、計画 34 第 4 版の査読、目的に照らした監査、計画 48 の査読。ほかに Issue の写しと木の案 |
| 46-plan34-v4.md | 計画 34 第 4 版 |
| 48-evaluated-release-plan.md | 評価済みリリースの計画（いま有効） |

番号の 37・44・47 は欠番。44 は、計画 43 が作ると書いたカードで、作らなかった。
