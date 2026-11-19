# 評価の実行時間はどこで使われているか、並列化すべきか（2026-11-03）

- 調査日: 2026-11-03
- 対象: Harbor で回した評価の実行（`runs/2026-11-03/exp28*`・`exp29-*`、試行 423 回・ジョブ 38 本）と、ホスト（WSL2 上の Docker Engine）
- 問い: 評価の時間が長いのは CPU・メモリ・SSD の I/O のどれのせいか。並列にしてよいか、するならどう安全にするか

## 結論

1. **CPU・メモリ・SSD のどれも律速していない。** エージェントの実行時間の 98% はモデル API の応答待ちで、コンテナ内の道具の実行は 2% に満たない（中央値 0.3 秒 / 試行）。**[一次: 実測]**
2. **評価はすでに並列で走っている。** pit-wall は Harbor に `-n 3` を渡しており（`PITWALL_HARBOR_CONCURRENCY` の既定値 3）、1 ジョブの中で試行が平均 2.4〜2.9 本同時に走っていた。「Harbor は並行させない」は Harbor のプロセスを複数同時に起動しないという意味で、ジョブの中の並行は 3 のまま動いている。**[一次: 実測・コード]**
3. **時間の行き先は 3 つある。** (a) モデル API の待ち（試行時間の 45%）、(b) 試行ごとの固定の手間（コンテナの組み立て 13%・後片付け 20%・その他 22%）、(c) ジョブ開始から最初の試行までの待ち（EXP-29 の総時間の 15%）。(c) は課題のファイル数にほぼ比例し（1 ファイルあたり約 1.6 秒）、`/mnt/e`（Windows のドライブ）上の課題ディレクトリを Harbor が試行ごとに読む処理だと推定する。**[一次: 実測] + [推論: 原因]**
4. **同時実行数を 1〜3 で比べると、モデル呼び出しの待ち時間は増えていなかった**（中央値 2.31 / 2.10 / 2.01 秒）。レート制限の拒否（`rejected`）は 0 件、使用量の警告（`allowed_warning`、7 日枠）だけだった。**[一次: 実測]**
5. **推奨: すぐには同時実行数を上げない。先に (i) 1 試行のメモリのピークを測り、(ii) 課題・結果のディレクトリを WSL 側の ext4 に移す試しをする。** (ii) はおそらく総時間を 1 割強縮め、評価の質に影響しない。(i) で 1 試行が十分小さいと分かったら、Harbor 1 プロセスのまま `-n` を空きメモリと PSI から決めて 3 → 最大 6 に上げる。その前に、台本の対照（モデルを呼ばない oracle）と A/A 比較で、無効の率と結果が変わらないことを確かめる。複数の Harbor プロセスを同時に起動する案は採らない。**[推論]**
6. 並列化で増えるのは「1 時間あたりの試行数」だけで、1 試行あたりのサブスク枠の消費は変わらない。7 日枠は 100〜220 試行で 1 ポイント上がるペースで、いまは時間のほうが制約になっている。ただし 5 時間枠は記録に出ておらず、同時実行数を上げると先に当たる可能性がある。**[一次: 実測] + [推論]**

## 前の調査との関係

- `research-u1-subscription-auth.md`: 「`-j` の並列実行はアカウントのレート制限を共有する」とだけ書いてある。今回は、実際にどれだけ並列だったか、レート制限の事象が出たかを実測で足した
- `docs/planning/02-design.md` §7: 「並列にしても、サブスクのレート制限で詰まるだけなので、`-j` は 1〜2 から始める」。この見込みは、n=3 では外れていた（詰まっていない）。n が 3 を超えたときは未測定
- `research-runners.md`: Harbor の採用理由を扱った。並列・資源の制御は扱っていない
- `docs/log/2026-11-01.md`「メモリ不足による停止」: Harbor を 2 本並行させてメモリ不足で止まった事故。今回の設計の前提にした
- 前の調査にあって今回扱わなかった点: なし（並列・資源を扱った調査は無かった）

---

## 1. 実測

### 1.1 測り方

すべて読み取りだけで、実行中の実験には触れていない。保留セルの中身・ハーネスの中身は読んでいない（時刻・件数・ファイル数だけを使った）。

| 測ったもの | 出どころ | 方法 |
|---|---|---|
| 試行の各段階の時間 | 各試行の `result.json` の `started_at` / `environment_setup` / `agent_setup` / `agent_execution` / `verifier` / `finished_at` | 差を取った。423 試行 |
| ジョブ内の同時実行数 | 同じジョブの試行の `[started_at, finished_at]` の重なり | 時刻で走査して最大値と時間平均を出した |
| ジョブの前置き | ジョブの `result.json` の `started_at` と最初の試行の `started_at` の差 | |
| モデル待ちと道具の時間 | `agent/sessions/projects/*/*.jsonl` の各行の `timestamp` | 直前の事象から `assistant` 行までをモデル待ち、直前から `tool_result` を含む `user` 行までを道具の実行とした。あわせて stream-json の最終 `result` の `duration_api_ms / duration_ms` も見た |
| レート制限 | `agent/claude-code.txt` の `rate_limit_event` | 状態・種類・`utilization` を集計 |
| 同時実行数とモデル待ちの関係 | 上の各モデル呼び出しの時刻に、ホスト全体で `agent_execution` 中だった試行の数を数えた | 2026-11-01〜03 の全 run、モデル呼び出し 11,370 件 |
| ホスト | WSL で `nproc` / `lscpu` / `free` / `/proc/meminfo` / `/proc/pressure/*` / `docker info` / `lsblk` / `.wslconfig` | 2026-11-03 19:13、評価は走っていない時点 |
| Harbor の挙動 | WSL にインストールされた Harbor 0.25.0 のソース（`harbor/environments/docker/docker.py`、`models/job/config.py`、`models/trial/error_policy.py`） | 読んだ |

集計の台本はこのリポジトリには入れていない（使い捨て）。数字を取り直すときは、上の表の方法で同じ値が出る。

### 1.2 ホスト

| 項目 | 値 |
|---|---|
| CPU | AMD Ryzen 7 3700X、WSL に 8 論理 CPU（`.wslconfig` `processors=8`） |
| WSL のメモリ | 12 GB（`.wslconfig` `memory=12GB`、Windows 本体は 32 GB）。swap 1 GB（`E:\wsl\swap.vhdx`） |
| 空きメモリ（評価なし） | `MemAvailable` 11.1 GB |
| PSI（評価なし） | cpu some avg10=1.04、memory some/full avg10=0.07、io some/full avg10=0.66 |
| cgroup | v2（cpuset cpu io memory hugetlb pids）。Docker 29.9.2、cgroup driver systemd |
| ディスク | WSL のルート `/dev/sde`（1 TB の VHD）。結果と課題は `/mnt/e`（Windows の E: を DrvFs でマウント）に置いている |
| メモリの返却 | `autoMemoryReclaim=gradual`、`sparseVhd=true` |
| Docker のイメージ | 常駐は agent イメージ 707 MB（2 タグ）だけ。課題ごとのイメージ `hb__*` は残っていない。build cache 952 MB |

### 1.3 試行 1 回の内訳（423 試行）

| 段階 | 中央値（秒） | p10 | p90 | 合計に占める割合 |
|---|---|---|---|---|
| 開始〜環境の準備開始（待ち・前処理） | 0.4 | 0.2 | 5.1 | 4.0% |
| 環境の準備（`docker compose build`（キャッシュ済み）＋ `up`） | 6.7 | 5.3 | 12.1 | 13.2% |
| エージェントの準備 | 1.4 | 1.4 | 1.7 | 2.5% |
| **エージェントの実行**（Claude Code） | **25.5** | 15.2 | 44.3 | **45.4%** |
| 実行後〜検証開始 | 2.6 | 2.3 | 3.7 | 4.7% |
| 検証（state-capture） | 2.6 | 2.4 | 3.3 | 4.8% |
| 後片付け（`down --rmi local --volumes`、ログの回収） | 11.3 | 11.1 | 13.9 | 19.6% |
| 合計 | 59.4 | 45.4 | 87.3 | 100% |

試行の合計の最大は 213 秒で、エージェントの制限時間 900 秒に対して十分に余裕がある。

### 1.4 エージェントの実行の中身

- セッション JSONL から: モデル待ち 合計 11,160 秒、道具の実行 合計 221 秒。**モデル待ちが 98.1%**
- stream-json の `duration_api_ms / duration_ms`: 中央値 0.98（p10 0.97、p90 0.99）
- つまり、コンテナ内の作業（`git`・`grep`・ファイルの読み書き）は試行の時間にほぼ効いていない。CPU やディスクを速くしても、エージェントの実行は縮まない **[一次: 実測]**
- 注意: いまの課題は小さなリポジトリでの調査と少量の編集で、テストの実行やビルドを伴わない。重い検査を走らせる課題を足すと、道具の時間の割合は変わる **[推論]**

### 1.5 ジョブ単位: 並列の度合いと前置き

- 全ジョブの設定が `n_concurrent_trials: 3`（2026-11-01〜03 の 726 ジョブ中 713。残りは 1 または 2）
- 20 試行のジョブ（EXP-29）では、時間平均の同時実行数が 2.4〜2.9、最大 3
- 試行の合計時間 ÷ 試行が走っていた区間 = 実効の並列度。EXP-28・29 全体で 26,865 秒 ÷ 11,987 秒 ≈ 2.2
- **ジョブの前置き（ジョブ開始〜最初の試行開始）が課題のファイル数に比例していた:**

| run | 課題ディレクトリのファイル数 | 前置き（秒） |
|---|---|---|
| H h5-a1 vanilla | 20 | 19 |
| R t5-stale-base-weak vanilla | 27 | 31 |
| H h5-a1 v0 | 37 | 46 |
| R t4-scatter-big-start vanilla | 137 | 230 |
| R t4-scatter-big-start v0 | 154 | 257 |

  - 1 ファイルあたり約 1.6 秒。20 試行のジョブなので、1 試行・1 ファイルあたり約 80 ms になる
  - Harbor はジョブの開始時に試行ごとの lock（`lock.json`、課題の内容の digest を含む）を作る。t4 のジョブでは `lock.json` の書き込みがジョブ開始の 3 分 35 秒後だった **[一次: ファイルの時刻]**
  - 原因の推定: 課題ディレクトリを試行の数だけ走査してハッシュを取る処理が、DrvFs（`/mnt/e`）上で遅い **[推論]**。Microsoft は Linux のコマンドから使うファイルは WSL のファイルシステムに置くよう勧めている（「For the fastest performance speed, store your files in the WSL file system if you are working in a Linux command line」）[一次: Microsoft Learn, Working across file systems](https://learn.microsoft.com/en-us/windows/wsl/filesystems)
- EXP-29 全体: 最初のジョブ開始〜最後のジョブ終了 9,205 秒（2.56 時間、320 試行）。うち前置きの合計 1,377 秒（15%）、ジョブ間の隙間（台本の検査・集計）は 1 回 10〜18 秒

### 1.6 Harbor の挙動（ソースから）

- 課題ごとのイメージ `hb__<環境 id>` を試行ごとに `docker compose build` し（同じ名前のビルドは lock で直列化）、試行の終わりに `down --rmi local --volumes --remove-orphans` で消す（`delete=true` が既定）。2 回目以降のビルドは build cache に当たるので 5〜10 秒で済む **[一次: docker.py]**
- コンテナの CPU・メモリの制限は、課題（`task.toml` の `cpus` / `memory_mb`）か実行時の `--override-memory-mb` / `--override-cpus` と、方針（`--cpus` / `--memory` に `limit` / `request` / `guarantee` / `ignore` / `auto`）で決まる。pit-wall の課題は `cpus` も `memory_mb` も書いていないので、**いまコンテナにはメモリの上限が無い** **[一次: docker.py・config.py、Harbor docs [Resources](https://docs.harborframework.com/tasks/resources.md)]**
- ジョブの中の同時実行数 `n_concurrent_trials`（`-n`、既定 4）は asyncio のセマフォで、ジョブの途中では変えられない。エージェントごとの下位の上限 `n_concurrent` / `concurrency_group` もある **[一次: queue.py・config.py]**
- 再試行は `-r`（`max_retries`、既定 0）。pit-wall は渡していないので再試行はしない。インストールされた 0.25.0 では使用量の上限（`ApiUsageLimitError`）は既定で再試行の対象外になっている。公式の文書は「usage / rate limit は再試行・採点するが報酬は無効」と書いており、版によって扱いが違う **[一次: config.py と [Error classification](https://docs.harborframework.com/jobs/error-classification.md) の食い違い]**

### 1.7 レート制限と失敗

- `rate_limit_event` 425 件（EXP-28・29）: すべて `seven_day` / `allowed_warning`。`rejected` は 0 件。`utilization` の最大は 0.83
- 2026-11-01〜03 の全 run（1,555 試行）でも、種類は `seven_day` だけで、状態は `allowed` と `allowed_warning` だけだった。5 時間枠の事象は一度も記録されていない
- 7 日枠の使用率は 100〜220 試行で 0.01 上がるペースだった（例: 11-03 16:01 に 0.82 → 223 試行後の 18:08 に 0.83）。オーナーの手元の作業も同じ枠を使う（[一次: Claude サポート「limits are shared across Claude and Claude Code」](https://support.claude.com/en/articles/11145838)）ので、この値は評価だけの消費ではない **[推論]**
- 例外: `NonZeroAgentExitCodeError` 3 件。3 件とも stream-json の最後の `result` が `subtype: error_max_turns`（ターン上限で終わり、Claude Code が exit 1 を返した）で、`error_max_turns` 4 件のうちの 3 件にあたる。レート制限による失敗は 0 件
- 同時実行数とモデル待ち（ホスト全体、2026-11-01〜03）:

| 同時に実行中のエージェント | モデル呼び出し数 | 待ちの中央値（秒） | p90 |
|---|---|---|---|
| 1 | 1,693 | 2.31 | 5.40 |
| 2 | 4,487 | 2.10 | 5.15 |
| 3 | 5,190 | 2.01 | 5.03 |

  3 本までなら、同時実行で API の応答が遅くなった形跡は無い。時刻の違い（混み具合）も混ざっているので、因果の証拠ではない **[一次: 実測] + [推論: 解釈]**

### 1.8 ボトルネックの判定

| 候補 | 判定 | 根拠 |
|---|---|---|
| 単一プロセスの CPU | 違う | 道具の実行が 2% 未満。Harbor 本体も asyncio で待つだけ。ホストの cpu some avg10 は評価なしで 1%（評価中の値は未測定 **[未確認]**） |
| メモリの割り当て | いまは律速していないが、**並列を上げたときの制約になる** | n=3 で空きメモリの検査（6 GB）に一度も掛かっていない。一方 2026-11-01 には Harbor 2 本の並行で Windows 側の空きが約 3 GB / 32 GB になり、メモリ不足で止まった。1 試行のメモリのピークは記録が無く **[未確認]** |
| SSD の I/O | 帯域は律速していないが、**`/mnt/e`（DrvFs）のファイル単位の遅さが前置きを作っている** | 前置きがファイル数に比例（1.5 節）。ext4 側に置いたときの値は未測定 **[推論]** |
| モデル API | **いちばん大きい**。ただし並列で隠せている | エージェントの実行の 98%。n=3 で待ちは伸びていない |
| サブスク枠 | いまは律速していない | 7 日枠は 100〜220 試行で 1 ポイント。拒否 0 件 |

---

## 2. 外部の作法（何を参考にしたか）

### 2.1 評価の実行器の同時実行の設定

- **Harbor**: `-n` が試行の同時実行数。文書の例は `--n-concurrent 4`（ローカル）や `n_concurrent_trials: 100`（クラウドの sandbox）で、ローカルの Docker でいくつにすべきかの指針は無い。Harbor Hub（クラウド）は「Backs off on rate limits」「Pauses on cascading failures (e.g. usage limits)」とあり、使用量の上限に当たったら止める設計 [一次: [Run a job](https://docs.harborframework.com/jobs/run-a-job.md)] [二次: [PyPI harbor](https://pypi.org/project/harbor/0.2.0/)]
- **SWE-bench**: 「we recommend using fewer than min(0.75 * os.cpu_count(), 24)」。メモリが逼迫したら `--max_workers` を下げる。推奨ホストは 8 コア・16 GB RAM・空き 120 GB [二次: [SWE-bench README](https://github.com/SWE-bench/SWE-bench)、[harness reference](https://swebench.com/SWE-bench/reference/harness)]
- **Inspect AI**: 3 つの上限を分けている。model API の同時接続（`max_connections`。既定は適応制御で、429 を受けると上限を 0.8 倍に下げ、15 秒の冷却を置く）、同時に走る標本（`max_samples`。道具や sandbox を使う課題では `max_connections` より大きくせよ）、sandbox の数（`max_sandboxes`。Docker の既定は CPU 数の 2 倍で、「Pushing up against and beyond them can lead to instability and failed evaluations」）。モデル呼び出しは既定で指数バックオフにより無期限に再試行する [一次: [Parallelism](https://inspect.aisi.org.uk/parallelism.html)、[Model Concurrency](https://inspect.aisi.org.uk/models-concurrency.html)]
- **Terminal-Bench**: README の例は `--n-concurrent 8`。統合先（Mux）はローカル Docker の既定を 4 にしている [二次: [terminal-bench wiki](https://github.com/harbor-framework/terminal-bench/wiki)、[Mux benchmarking](https://mux.coder.com/reference/benchmarking)]

要点: どの実行器も「モデルの同時接続」と「sandbox の同時数」を別々の上限として持ち、sandbox の上限は CPU 数から決めている。メモリから決める仕組みは、調べた範囲では標準の機能に無い。

### 2.2 資源の設定が評価の結果を変える

- Anthropic の調査では、Terminal-Bench 2.0 で資源の与え方だけで得点が 6 ポイント変わった。仕様どおりの厳密な上限（1x）では基盤由来のエラーが 5.8%、3 倍の上限で 2.1%、上限なしで 0.5%。1x〜3x の得点の差は誤差の内（p=0.40）。勧めは「保証量と、それとは別の打ち切りの上限を両方決め、上限での得点と保証量での得点が誤差の内に収まるよう帯を較正する」「資源の設定を、プロンプトや温度と同じ厳密さで記録する」。同時実行数も交絡の候補に挙げられているが、実験はしていない。時刻による合格率の揺れ（API の混み具合）も逸話として書かれている [一次: [Anthropic Engineering, Quantifying infrastructure noise in agentic coding evals](https://www.anthropic.com/engineering/infrastructure-noise)]
- pit-crew への当てはめ: いまの課題は資源をほとんど使わないので、得点が資源で動く余地は小さい **[推論]**。ただしコンテナにメモリの上限を付けるなら、上限が低すぎてエラーを作らないよう余裕（数倍）を取り、上限の値を条件として記録する

### 2.3 サブスクの枠とレート制限

- Pro / Max には 5 時間のセッション枠と週の枠があり、Claude と Claude Code で共有される [一次: [Claude サポート 11145838](https://support.claude.com/en/articles/11145838)]。並列のインスタンスについての記述は無い
- API のレート制限は token bucket で、超えると 429 と `retry-after`。「急な増加には acceleration limit で 429 が返ることがある。増やすときは少しずつ」 [一次: [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)]。サブスクの OAuth にこの表がそのまま当てはまるかは書かれていない **[未確認]**
- 当てはめ: 並列化は 1 時間あたりの消費を上げる。週の枠の総量は変わらないが、5 時間枠には先に当たりうる。同時実行数を上げるときは一度に大きく上げず、段階的に上げる **[推論]**

### 2.4 メモリの逼迫の検知と OOM の余裕

- PSI（`/proc/pressure/{cpu,memory,io}`）は「some」（一部のタスクが資源待ち）と「full」（全タスクが待ち＝スラッシング）の時間の割合を 10・60・300 秒の平均で出す。用途として負荷の切り離し・ジョブの配置・低優先のバッチの停止、OOM を避けた規模決めを挙げている。cgroup v2 では cgroup ごとに `memory.pressure` がある。poll で閾値の通知も受けられる [一次: [kernel.org PSI](https://docs.kernel.org/accounting/psi.html)]
- systemd-oomd の既定: cgroup のメモリ圧が 60% を 30 秒続けたら止める。メモリと swap の使用率がともに 90% を超えても止める [一次: [oomd.conf](https://www.freedesktop.org/software/systemd/man/latest/oomd.conf.html)]。これは「殺す」側の閾値で、「新しい仕事を入れない」閾値はもっと手前に置く必要がある **[推論]**
- Docker: メモリが尽きるとカーネルはどのプロセスも殺しうる（Docker 自身も）。daemon は OOM の優先度を下げてあるが、コンテナは下げていない。`--memory` はハードな上限、`--memory-reservation` は競合時だけ効くソフトな下限で「保証ではない」。`--oom-kill-disable` は `--memory` と組み合わせるときだけ。本番の前にメモリの必要量を試験で把握せよ [一次: [Docker, Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)]
- WSL2: `memory` の既定は Windows の 50%。`autoMemoryReclaim` は `disabled` / `gradual`（キャッシュをゆっくり返す）/ `dropCache`（すぐ返す、既定）[一次: [Microsoft Learn, wsl-config](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)]
- 当てはめ（重要）: **WSL の中の `MemAvailable` は Windows 側の逼迫を見ていない。** 2026-11-01 の停止では、WSL の空きが約 1.9 GB のときに Windows の空きが約 3 GB / 32 GB だった（`docs/log/2026-11-01.md`）。WSL の VM は上限（12 GB）までメモリを Windows から取りに行くので、Windows 側で他のアプリが膨らむと、WSL の中の数字が健全でも全体が逼迫する **[推論]**。WSL のホストでは Windows 側の空きも見る必要がある。CI（Linux の runner）では `/proc/meminfo` と PSI で足りる

---

## 3. 選択肢

時間の見積もりは EXP-29（320 試行、2.56 時間）を基準にした **[推論: 単純なモデル]**。試行の区間は「20 試行 ÷ 同時実行数 × 1 試行の時間」でおおむね決まり、前置きは別に足される。

| 案 | 内容 | 見込みの短縮 | 評価の質への危険 | 実装の手間 |
|---|---|---|---|---|
| **A 現状維持** | `-n 3`、Harbor は 1 本ずつ | 0 | なし（測れている状態） | 0 |
| **B 置き場所を ext4 へ** | 課題の生成先（`harbor-tasks`）と Harbor の jobs ディレクトリを WSL の ext4（例 `~/pit-runs/`）に置き、終わったら結果を `/mnt/e` の `runs/` へ写す | 前置き 1,377 秒の大半 → 総時間の約 1 割強。後片付け（ログの回収、19.6%）も縮む可能性 **[推論]** | ほぼ無し。結果の写しが漏れると記録が欠けるので、写しの検査が要る | 小（runner の出力先と写しの処理） |
| **C 試行ごとの固定の手間を削る** | イメージを試行ごとに消さず、ジョブの最後に消す（Harbor の `delete` を無効にしてジョブ後に `docker image rm`） | 後片付け 11 秒・ビルド数秒は n=3 の並行で大半が隠れているので、総時間では数 % **[推論]** | 試行どうしが同じイメージを共有する（いまも同じ内容から作り直しているだけなので差は無い **[推論]**）。消し忘れでゴミが残る危険 | 小〜中 |
| **D Harbor 1 本のまま `-n` を上げる（受け入れ制御つき）** | ジョブの開始時に空きメモリ・PSI・CPU 数から n を決める（3〜6）。コンテナにメモリの上限を付ける | n=6 で試行の区間がおよそ半分（7 波 → 4 波）。総時間で約 4 割 **[推論]**。B と合わせて約 5 割 | 5 時間枠・acceleration limit に当たる危険。メモリ不足で試行が殺されると無効が増える。同時実行の多さによる API の遅延（n>3 は未測定） | 中（受け入れ制御、上限の較正、監視、検証） |
| **E Harbor を複数本並行** | arm やセルを別プロセスで同時に流す | D と同程度 | 2026-11-01 の停止と同じ形。プロセスをまたいだ受け入れ制御が要る。良い点として arm を時間的に交互に混ぜられる | 大（プロセス間の資源の取り合いの管理） |

---

## 4. 推奨

### 4.1 判断

- **いま並列度を上げる理由は弱い。** n=3 で API 待ちはすでに 2〜3 本重ねて隠れており、ホストの CPU・ディスクの帯域は余っている。並列度を上げて得るのは時間だけで、そのために 5 時間枠とメモリの危険を新しく抱える
- **先にやる価値が高いのは B（置き場所）と、メモリの実測。** B は評価の質に触れずに約 1 割縮む見込みで、手間も小さい。メモリの実測は D の前提になる
- D は、メモリの実測で「1 試行のピーク × 6 + 余裕」が収まると分かり、下の検証を通ってから入れる。E は採らない（憲章の「Harbor は並行させない」をそのまま残す）
- 「並列にしない」を選ぶ場合の条件: 1 試行のピークが大きく n を 4 以上にできない、または n=4〜6 の A/A 比較で無効の率・レート制限の事象・結果のどれかが動いた場合。そのときは B だけを入れて n=3 に留める

### 4.2 段階 0: 測る（評価の質に触れない、モデルの枠を使わない）

1. **1 試行のメモリのピーク**: 次の評価の実行に合わせて、別プロセスで 5 秒ごとに `docker stats --no-stream` と、各コンテナの cgroup の `memory.peak`（cgroup v2、`/sys/fs/cgroup/system.slice/docker-<id>.scope/memory.peak`）、`/proc/pressure/memory`、`MemAvailable`、Windows の空き（`powershell.exe -c "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"`）を記録する。読み取りだけなので評価に負荷を足さない **[推論]**
2. **置き場所の差**: 台本の対照（oracle、モデルを呼ばない）を同じ課題で、`/mnt/e` 置きと ext4 置きの 2 通り、`-k 5` で回し、前置きと後片付けの時間を比べる。モデルの枠は使わない
3. 記録は実験ノートに残し、この調査の 1.8 節の [未確認] を埋める

### 4.3 段階 1（D を入れる場合）: n の決め方

ホストに依存しないよう、値はすべて実行時に読む。

```
P   = 1 試行のメモリのピーク（段階 0 の実測の p95。未測定なら入れない）
H   = 1.5            # ピークの揺れへの余裕
R   = max(2 GiB, 0.15 × MemTotal)   # OS・Docker・他プロセスのための予約
A   = min(MemAvailable(WSL), Windows の空き − 4 GiB)   # WSL 以外のホストでは MemAvailable だけ
n_mem = floor((A − R) / (P × H))
n_cpu = max(1, floor(0.75 × nproc))   # SWE-bench の目安
n   = clamp(min(n_mem, n_cpu, N_CAP), 1, N_CAP)   # N_CAP は最初 6
開始しない条件: n_mem < 1、memory PSI some avg60 > 10、full avg10 > 1、cpu some avg60 > 50
```

- 閾値（10・1・50）は oomd の既定（60% を 30 秒）よりずっと手前に置いた「入れない」側の値で、根拠のある定数ではない。段階 0 の記録を見て決め直す **[推論]**
- いまの「空き 6 GB 未満で始めない」は、P×H が 1 GB 前後なら上の式と矛盾しない（R=2 GB、n=3 → 約 5 GB）**[推論]**
- Harbor の n はジョブの途中で変えられないので、決めるのはジョブの開始時だけ。途中の変化には次の見張りで対処する
- **見張り**: ジョブの実行中、5 秒ごとに `MemAvailable < R` または memory PSI full avg10 > 5 が 3 回続いたら、Harbor のプロセスを止め（SIGINT、Harbor が後片付けをする）、その run を不完全として扱い集計に使わない（11-01 と同じ扱い）。見張りの記録は run のディレクトリに置く
- **コンテナごとのメモリの上限**: `--memory limit --override-memory-mb <P×3>` で上限を付ける。上限を付けておけば、膨らんだ 1 本がカーネルの OOM でホスト全体（Docker 自身を含む）を巻き込む代わりに、その 1 本だけが落ちて無効として記録される。値は Anthropic の勧めに倣って保証量の 3 倍程度の余裕をとり、記録に残す。`--memory-reservation` は保証ではないので、予約は上の受け入れの式で行う（Linux ではメモリを前もって確保することはできず、「確保」は受け入れの勘定で表す）**[一次: Docker・Anthropic] + [推論]**
- **ゴミを残さない**: ジョブの後に `docker ps -a --filter name=<ジョブの接頭辞>` と `docker images 'hb__*'` が空であることを検査し、残っていれば消して記録する。build cache は閾値（例 5 GB）を超えたら `docker builder prune --filter until=168h` する

### 4.4 並列が妥当性を下げていないかの検知

各 run の記録に次を足す: その試行の開始時と実行中の同時実行数、ジョブの n、ジョブ開始時の `A`・PSI、コンテナのメモリの上限。比べるもの:

| 指標 | 下がったと判断する目安 |
|---|---|
| 無効の率（`assessRun` の invalid、runner-error） | n=3 のときより増えた（いまは EXP-29 で 4/320） |
| 例外（`NonZeroAgentExitCodeError` 以外も）・`error_max_turns` | n を上げた run だけで増えた |
| `rate_limit_event` の状態 | `rejected` が 1 件でも出た、または `five_hour` の事象が出た |
| モデル待ちの中央値・エージェントの実行時間 | 同じセル・同じ arm で n=3 より明らかに伸びた（1.7 節の表と同じ取り方） |
| コンテナの OOM | `docker inspect` の `OOMKilled` が 1 件でもある |
| 結果そのもの | A/A 比較（下記）で害の率に差が出た |

### 4.5 入れる前に確かめること

通るべき場合:

1. 受け入れの式の単体テスト: `/proc/meminfo`・`/proc/pressure/*` の写しを入力にして、期待どおりの n が出る（余裕のある場合、CPU が律速する場合、`N_CAP` で切られる場合）
2. 台本の対照（oracle、モデルを呼ばない）を n=6 で回し、対照が「作ったとおり」（`pit-wall controls` が ok）で、例外 0、後片付け後にコンテナ・イメージが残らない
3. **A/A 比較**: 結果が分かっている既存のセル 1 つ（例: t5-stale-base-weak の default、EXP-29 で 1/20）を、同じ arm・同じ版で n=3 と n=6 で各 20 回。害の率の差が Fisher で検出されず、無効の率・例外・レート制限の事象・モデル待ちが変わらない。n=3 側も同じ時間帯に回し、時刻の交絡を減らす

落ちるべき場合:

4. 空きメモリが足りない入力（`MemAvailable` を R 未満にした写し）で、受け入れが「開始しない」を返し、台本が止まる
5. 台本の対照の 1 つにメモリを食う手順を入れ、コンテナの上限を低く（例 256 MB）して回すと、その試行が OOM で落ち、`OOMKilled` として無効に分類され、害にも合格にも数えられない
6. 見張りの単体テスト: PSI・`MemAvailable` の時系列の写しで、閾値を 3 回続けて超えたときだけ停止を返す（1 回だけの突出では止めない）
7. （試験の窓を取れるときだけ）別プロセスでメモリを消費させて、見張りが Harbor を止め、run が不完全として扱われる。負荷試験になるので、他の実験と重ならない時間に、オーナーの了承を得てから行う

### 4.6 再現性・CI

- 受け入れの式は `nproc`・`MemTotal`・`MemAvailable`・PSI だけを使うので、GitHub Actions の Linux の runner でもそのまま動く。Windows 側の空きの検査は WSL のときだけ足す
- n・上限・置き場所は試行の条件として結果に記録する（Anthropic の「資源の設定を記録せよ」に従う）。第三者が同じ n で回せば同じ条件になる

---

## 5. 未確認・残る問い

- 1 試行のメモリのピーク、評価中の CPU・I/O の PSI **[未確認]**（段階 0 で測る）
- 前置きが DrvFs のせいだという推定 **[推論]**（段階 0 の 2 で確かめる）
- n>3 のときの API 待ち、5 時間枠への当たり方 **[未確認]**
- サブスクの OAuth 経路で 429 / acceleration limit がどう出るか（stream-json の `rate_limit_event` の `rejected` として出るのか）**[未確認]**
- Harbor の版による使用量の上限の再試行の扱いの違い（0.25.0 のソースと文書が食い違う）。pit-wall は再試行を使わないので、いまは影響しない

## 6. 実施の結果（2026-11-03、オーナーが「段階で進める」を採った後）

| 段 | 確かめたこと | 結果 |
|---|---|---|
| ① 課題と結果を WSL 側に置く | 台本の対照（structure-big）、置く/置かない | 251 → 129 秒、結果とファイルの集合が同一、後片付けの残り 0（`runs/2026-11-03/perf-stage-check.log`） |
| ② 1 試行のメモリのピーク | 一番大きいセル t4 を 3 回、2 秒ごとに docker stats | 136〜159 MiB、3 本同時で合計 424 MiB、ホストの空きの最小 10.5 GiB |
| ③ 受け入れ・上限・見張り | 単体テスト 58、台本の対照の A/A（n=6 と n=3 で結果同一）、256 MiB の上限でメモリを食う試行が落ち oom-killed として無効に分類、上限なしでは通る（両方向）。モデルを使う A/A（t5w・既定のスキル 12 回ずつ） | n=3 342 秒 / n=6 193 秒、無効 0 / 0、レート制限の拒否 0 / 0、害 1 / 1 |

- [誤り] 受け入れの最初の版は、Windows 側と WSL 側の予約を両方 Windows 側から引き、この機械（Windows の空き 4.8 GiB）で 1 本も始めない判定を出した。実機で試して見つけ、予約を両側に分けて直した（テストに実機の値を足した）
- 既定を受け入れ（この機械では n=6）に切り替えた。各記録に `runConditions`（n・上限・開始時の空き）を残す。`PITWALL_ADMISSION=0` で以前の固定 3 に戻せる。実験の中では n は一定なので、arm 間の比較の条件は変わらない [推論]
- 総時間の見込み: ①で準備の待ちが半分、③で試行の部分が約 0.56 倍 → 合わせて EXP-29 規模（320 回）で 2.6 時間 → 約 1.3 時間 [推論、①③の実測の比から]

## 7. Windows 側のメモリ（2026-11-03〜04）

- EXP-32 の 1 回目は、Harbor（n=6）と judge（ollama、GPU）を同時に走らせ、Windows の空きが 1.2 GiB まで落ちて Claude Code に止められた。WSL の中は空きがあったが、ページキャッシュ（約 8.7 GiB）が Windows に返っていなかった
- 対策: ホスト全体で重い処理を 1 つにするロック、見張りが Windows の空きも見る、重い処理の前にページキャッシュを捨てる（オーナーが一度だけ入れたヘルパー、`experiments/setup/install-drop-caches.sh`）
- 両方向の確かめ（`experiments/perf/check-drop-caches-filled.sh`）: モデルのファイル約 11 GiB を読んでキャッシュを満たすと、Windows の空き 10508 → 909 MiB、WSL のキャッシュ 188 → 9885 MiB。捨てた直後は 962 MiB、90 秒後に 10562 MiB に戻った（autoMemoryReclaim=gradual）。[誤り] この確かめで Windows の空きを一時 0.9 GiB まで下げた。キャッシュを満たす量は、次からは空きの半分までにする
- 見張りは、Windows が予約を下回ったらまずキャッシュを捨て、90 秒後も下回るときだけ止める
