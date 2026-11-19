// WBS v2 (plan 34 v4). {{key}} -> #number. Existing issue numbers given as numbers in EXISTING_KEYS.
export const EXISTING_KEYS = { epic: 7, E0: 8, NEXT: 15, decide: 16 };

const CLOSE = `## close の決まり
- 確かめは段の終わりに 1 回、実装した役以外（確かめ役のサブエージェント、またはオーナー）が行う。確かめ役への依頼文は EPIC #7 の雛形（AC の全文 + パスだけ。親の要約は渡さない）で、依頼文そのものを close のコメントに貼る。判定に効く葉（印 ★）では、既知の欠陥を 1 つ混ぜた版を渡し、見つけたかを記録する
- コメントに貼るのは追跡パスへの link・数字・ハッシュだけ。\`local/\` の出力は要約も貼らない
- 範囲・受け入れ条件を変えるときは、理由を EPIC #7 にコメントする`;

const leaf = ({ why, input = [], ac, deps = [], exp = 'なし', work = '小', notes = '', star = false }) => `## 目的との対応
${why}

## 入力（読むもの）
${input.length ? input.map((i) => `- ${i}`).join('\n') : '- 計画 34 第 3 版 `docs/planning/34-dev-real-failure-evaluation-plan.md` と第 4 版 `docs/planning/46-plan34-v4.md`'}

## 受け入れ条件${star ? '（★ 判定に効く葉）' : ''}
${ac.map((a) => `- [ ] ${a}`).join('\n')}

## 依存
${deps.length ? deps.map((d) => `- Blocked by {{${d}}}`).join('\n') : '- なし'}

## 消費
- 実験のモデル呼び出し: ${exp}
- 作業のセッション（7 日枠を使う）: ${work}
${notes ? `\n## 補足\n${notes}\n` : ''}
用語は EPIC #7 の用語欄を参照。

${CLOSE}
`;

const stage = ({ what, done, deps = [], date }) => `## この段ですること
${what}

## 段の終わりの条件
${done}

## 目安の日付
${date}（LATE の規則は EPIC #7）

## 依存
${deps.length ? deps.map((d) => `- Blocked by {{${d}}}`).join('\n') : '- なし'}

正本: \`docs/planning/46-plan34-v4.md\`（第 3 版 \`34-dev-real-failure-evaluation-plan.md\` への差分）。
`;

const V3 = '計画 34 第 3 版 `docs/planning/34-dev-real-failure-evaluation-plan.md`';
const V4 = '第 4 版 `docs/planning/46-plan34-v4.md`';

export const LABELS = [
  ['stage:決定', 'c5def5', '計画の決定'], ['stage:契約', 'c5def5', '契約・基準'], ['stage:計器', 'c5def5', '計器と門'],
  ['stage:試走', 'c5def5', '試走と門'], ['stage:本実験', 'c5def5', '本実験'], ['stage:判定', 'c5def5', '監査と判定'],
  ['stage:公開', 'c5def5', '回帰セットと公開の前提'], ['stage:汎用化', 'c5def5', '型の抽出と新しいハーネスの受け入れ試験'],
  ['judgement', 'd93f0b', '★ 判定に効く葉（確かめ役に欠陥を混ぜた版を渡す）'],
];

export const STAGES = [
  { key: 'T1', title: '契約・基準: 重要失敗例・S2 の定義・カード（規則と版の固定）', labels: ['epic', 'stage:契約'],
    body: stage({ what: '重要失敗例の表と場面、S2 の強制の定義と生成器を、場面より前に固定する。カードに判定の規則と版（採点器・Dataset・集計台本のハッシュ）を書く。', done: 'カード（`docs/planning/47-exp48-card.md`）が commit され、生成器の commit が場面の最初の commit より前である。', deps: ['E0'], date: '11-16〜11-18' }) },
  { key: 'T2', title: '計器と門: G4・G2・検出器・記録・植え込み・台本の対照', labels: ['epic', 'stage:計器'],
    body: stage({ what: '第 3 版 §9 の残りの計器と、第 4 版で足した計器を作り、モデル不要の門を通す。', done: '`gates/exp48/G4.json`（モデル不要の部分）と `G2.json` があり、植え込みの検査と台本の対照が通っている。', deps: ['T1'], date: '11-17〜11-20' }) },
  { key: 'T3', title: '試走と門: 消費の測定 → 規模の決定 → 試走 → G4b・G1・G3', labels: ['epic', 'stage:試走'],
    body: stage({ what: '消費を測り、規模・日付・記録の置き場所をオーナーに決めてもらい、試走で余地（G3・G3s）と採点の誤読（G1）を確かめる。', done: '`G4b.json`・`G1.json`・`G3.json`（と場面の G3s）がある。通らない項目・場面は外した記録がある。', deps: ['T2'], date: '11-20〜（試走 2 の時間は第 4 版 §11 の表）' }) },
  { key: 'T4', title: '本実験', labels: ['epic', 'stage:本実験', 'provisional'],
    body: stage({ what: '通った課題（上限 15）× A/B/C/D、通った場面 × A/C/S2 を、ブロック内の乱数の順で回す。', done: '全試行の記録が `local/exp48-gq/` にあり、点数（数字だけ）が commit されている。', deps: ['T3'], date: '消費の測定の後に決める' }) },
  { key: 'T5', title: '監査と判定: G1（再）・Q1 の分類・読み込み・判定・台帳', labels: ['epic', 'stage:判定', 'provisional'],
    body: stage({ what: '本実験の記録を監査し、事前に固定した規則で判定し、台帳に主張を書く。', done: '`docs/claims.md` に行があり、範囲の文・根拠の水準・限界が書かれている。', deps: ['T4'], date: '本実験の後 1 日' }) },
  { key: 'T6', title: '回帰セットと公開の前提', labels: ['epic', 'stage:公開', 'provisional'],
    body: stage({ what: '回帰セットを 1 コマンドで再実行できるようにし、スナップショットを検査して、オーナーに公開の承認を求める。', done: '回帰の台本と、公開の前提の記録と承認依頼がある。', deps: ['T5'], date: '判定の後 1 日' }) },
  { key: 'T7', title: '汎用化: 型の抽出と、新しいハーネスの受け入れ試験', labels: ['epic', 'stage:汎用化', 'provisional'],
    body: stage({ what: '憲章の「新しいハーネスを半日で設計、半日で試験」を受け持つ。Dev で作った型を雛形・ロールに中立なデータ・生成器にし、外部監査のハーネスで受け入れ試験をする。', done: '受け入れ試験の結果が台帳にあり、kit-guide が AgentOps の型で書き直されている。', deps: ['T6'], date: '公開の前提の後' }) },
];

export const LEAVES = [
  // E0
  { key: 'd-v4', parent: 'E0', title: '計画 34 第 4 版（docs/planning/46-plan34-v4.md）の査読を反映し、オーナーの承認を得る', labels: ['stage:決定', 'needs-owner'],
    body: leaf({ why: '2026-11-15 の決定（計画 34 第 3 版を保ち AgentOps の要素を足す）を、実行できる文書にする。', input: [V3, V4, '査読 `docs/planning/45-review-wbs/09-v4-review.md`'], ac: ['09 の blocker と major が第 4 版に反映されたか、理由つきで採らなかったと書かれている', '第 2 の問いの量を「試み + 迂回」から「禁止の結果が終了状態で成立した試行の割合」に変えたこと（09 の V3）と、場面の数字の案（2 試行中 1・上限 8 と 4・7 場面）を、オーナーに確かめた', 'オーナーの承認が `docs/planning/00-owner-statements.md` に日付つきで記録されている'], work: '小' }) },
  { key: 'd-records', parent: 'E0', title: '記録の整え: 憲章への反映（Jev の例外・実装役）、逸脱の追記、役ごとの消費の記録の置き場', labels: ['stage:決定'],
    body: leaf({ why: '第 3 版 §9・§10 が求める記録で、まだ無いもの。', input: [V3 + ' §3（逸脱）・§9（費用）・§10', '`docs/planning/00-goal-charter.md`'], ac: ['憲章に Jev の 2 ドルの例外と実装役の記載がある', '`experiments/exp48/deviations.md` に逸脱 1・2 と、B の文書の版（207 件）の逸脱が書かれている', '役ごとのセッションの消費を記録するファイルと書式がある'], work: '小' }) },
  { key: 'd-tree', parent: 'E0', title: 'Issue の木を第 4 版に合わせて作り直す（旧 #9〜#14・#17〜#38 は閉じる）', labels: ['stage:決定'],
    body: leaf({ why: '旧い木（計画 43 由来）は、計画 34 の決定を外していた（`45-review-wbs/00-synthesis.md`）。', input: [V4, '`docs/planning/45-review-wbs/00-synthesis.md`'], ac: ['旧 #9〜#14・#17〜#38 が「置き換え」のコメントつきで閉じている', '新しい葉の全部に、入力のパス・受け入れ条件・依存・消費が書かれている', 'EPIC #7 に用語欄・段の日付・運用の決まりがある'], work: '中' }) },

  // T1 契約
  { key: 'c-failures', parent: 'T1', title: '重要失敗例の表（GQ の ADR 8 本: 所在・再生か合成か・土台・開発か保留か）', labels: ['stage:契約'],
    body: leaf({ why: 'AgentOps は観測した失敗から始める。合成の罠ではなく、まず実際の失敗の再生を探す（第 4 版 §3.2）。', input: [V4 + ' §3.2', 'GQ の ADR は手元の clone（`local/` 配下。public には置かない）', '`docs/research/research-ganbari-incidents.md`'],
      ac: ['ADR 0006・0060・0022・0026・0030・0061・0005・0002 の各行に: 事故の状況の要約 / 禁止の行為 / 正しい行為 / 決定的な確かめ方 / 元の PR・commit・セッションの所在（無ければ理由）/ 再生か合成か / 土台（remote・承認者）の有無 / 既定スキルがこの ADR を出典にしているか（= 開発の場面）', '土台を作れない行は理由つきで外している', 'GQ の本文・人名・家族の情報が無い（`node packages/pit-wall/src/gates.mjs no-gq-content` が通る）'], work: '中' }) },
  { key: 'c-traj', parent: 'T1', title: 'GQ の Dev の実セッションの軌跡から失敗の候補を抜く', labels: ['stage:契約'],
    body: leaf({ why: '実際の失敗の候補を、ADR の外からも集める（第 4 版 §3.2）。', input: ['既存の transcript → 軌跡の変換器（11-11 の spike。`packages/pit-wall/` 配下を探す）', V4 + ' §3.2'],
      ac: ['候補の一覧（軌跡の id・失敗の型・該当する重要失敗例の行）が `local/exp48-gq/` にあり、追跡パスには件数と型の集計だけがある', '候補は判定に使わないと明記している'], deps: ['c-failures'], work: '中' }) },
  { key: 'c-mut', parent: 'T1', title: '変異の一覧（experiments/exp48/mutations.json）を、検出器と生成器を見ていない役が書く', labels: ['stage:契約', 'judgement'],
    body: leaf({ why: '検出器を知る役が変異を書くと、検出できる形しか並ばない（`04-redteam.md` R2、`09-v4-review.md` V10）。', input: ['重要失敗例の表（{{c-failures}}。`experiments/exp48/critical-failures.md`）', '公開の文献（テストの弱体化・迂回の型。調べた出典を一覧の中に書く）', '置き場所: `experiments/exp48/mutations.json`'], ac: ['一覧に、テストの弱め方・裏付けのない停止・漏れ・禁止の行ごとの迂回の変異がある', '書いた役は `packages/pit-wall/src/kit/grader.mjs` と生成器を読んでいない（依頼文を記録）', 'commit が、検出器の直しと生成器の最初の commit の祖先である'], deps: ['c-failures'], work: '中', star: true }) },
  { key: 'c-enforce', parent: 'T1', title: 'ロール定義に forbidden[].enforce を足し、強制の生成器を作る（Dev と ext-audit）', labels: ['stage:契約', 'judgement'],
    body: leaf({ why: '決定 14: S2 は汎用ハーネスの一部として、ロール定義の禁止の行から作る。場面より前に固定して循環を断つ。', input: ['`kit/schema/role-spec.md`', '`kit/roles/dev.yaml`・`kit/roles/ext-audit.yaml`', V4 + ' §5'],
      ac: ['`kit/schema/role-spec.md` に `enforce` の型があり、`kit/roles/dev.yaml` の禁止の行に `enforce` が書かれている', '生成器（`kit/` 配下）が dev と ext-audit の spec から Claude Code の hook・権限の設定を作り、単体テストが CI で通る', 'GQ のスクリプトを写していない', '強制の設定は作業木の外に置かれ、エージェントが書き換えられない'], deps: ['c-failures', 'c-mut'], work: '中', star: true }) },
  { key: 'c-scenes', parent: 'T1', title: '場面を作る（開発の場面 / 保留の場面は別の役）と、場面の採否の規則を commit', labels: ['stage:契約', 'judgement'],
    body: leaf({ why: 'S2 の効果を作り手が見ていない場面で判定する（決定 14）。', input: [V4 + ' §3.2', '重要失敗例の表（{{c-failures}}。`experiments/exp48/critical-failures.md`）'],
      ac: ['再生の場面は元の直前の状態から、合成の場面は EXP-48 の課題の上に作られ、中身は `local/exp48-gq/`、追跡パスには id とハッシュだけ', '保留の場面は、生成器と禁止の行を書いた役とは別のサブエージェントが作った。渡したのは重要失敗例の表の行を機械で切り出したものだけ（依頼文を記録）', '生成器の commit が場面の一覧の commit の祖先である（`git merge-base --is-ancestor`）', '場面と禁止の行の対応は第 3 の役が付け、対応する行の無い場面は「S2 の対象外」として数えている', '場面の採否の規則（C で禁止の結果が 2 試行中 1 以上成立）と上限（保留 8・開発 4）が、試走の前に commit されている。数字は査読役が出し直しオーナーが承認するまで仮', '場面ごとに、隠した検査（挙動）と主の量の登録を作れたかの表がある', '参照の手順で通り、何もしない台本で落ちることを各場面 3 回確かめた'], deps: ['c-enforce'], work: '大', star: true }) },
  { key: 'c-card', parent: 'T1', title: 'カード 47 を commit（判定の規則・版の固定・新しい数字）', labels: ['stage:契約', 'needs-owner', 'judgement'],
    body: leaf({ why: '結果を見てから測り方を変えないために、規則と版を試行の前に固定する（第 4 版 §7）。', input: [V3 + ' §6・§8', V4 + ' §7'],
      ac: ['`docs/planning/47-exp48-card.md` に、第 1 の族（第 3 版 §8 のまま）と第 2 の族（第 4 版 §7）の規則、主の量・補助の量の定義、採点器の commit・Dataset の sha256・集計台本の sha256・生成器の commit と生成物の sha256 の欄がある', '第 1 の族で判定を付けるのは C − A だけ。第 2 の族は保留の場面が 7 未満なら記述、と書かれている', '新しく要る数字（場面の採否、第 2 の族の扱い、G1 の分母と上限の出し直し）は、計画を書いていない査読役が出し、オーナーが承認した記録がある', 'カードは雛形 `kit/templates/agentops-card.md` から作り、雛形も同じ commit に入っている（Dev の値は雛形に書かない）'], deps: ['c-scenes'], work: '中', star: true }) },
  { key: 'c-aggregate', parent: 'T1', title: '集計の台本を試行の前に commit する', labels: ['stage:契約', 'judgement'],
    body: leaf({ why: '憲章 `:45` は、カードと集計の台本を実行の前に commit することを求める。', input: ['カード `docs/planning/47-exp48-card.md`'],
      ac: ['集計の台本が保存した記録・ロール定義・カードだけを入力にし、ロール名を台本に書かない', '合成の記録で動く単体テストが CI で通る', 'sha256 がカードに書かれている'], deps: ['c-card'], work: '中', star: true }) },

  // T2 計器
  { key: 'i-g4m', parent: 'T2', title: 'G4 のモデル不要の残り: 機械の作業（v03 の作り直し・漏れ・もともと赤い一覧・D の対照）', labels: ['stage:計器'],
    body: leaf({ why: 'EXP-48 の課題を回すには、計器が門を通っていなければならない。', input: ['`gates/exp48/G4.partial.json` の open_items', '`experiments/exp48/README.md`（G4 の実行 `run-g4.sh`）'],
      ac: ['open_items の機械の項目（v03 の作り直しと tools/history/leak の再実行、使う課題ごとのもともと赤い一覧、D の木の対照 3 回、試行に使う全 image の漏れの段、no-gq-content の texts の fail closed）が閉じている', '「不要」で閉じた項目が無い'], deps: ['T1'], exp: 'なし（WSL の Harbor・docker。1 本ずつ、空き 6 GB 以上）', work: '中' }) },
  { key: 'i-g4j', parent: 'T2', title: 'G4 のモデル不要の残り: 判断の作業（課題の順の導き直し・依頼文と代役の照合・環境の事実）と G4.json', labels: ['stage:計器', 'judgement'],
    body: leaf({ why: '課題の選び方を後から動かせないように、順を機械で固定する（第 4 版 §3.1）。', input: ['`gates/exp48/rederive.json`', '`gates/exp48/G4.partial.json`'],
      ac: ['導き直し役が `rederive.json`・`probe-input.json`・`task-order.json` とハッシュを書いた', 'すべての課題で、依頼文が代役の issue の本文と一致することを機械で確かめた', '条件ごとの環境の事実の文がある', '`gates/exp48/G4.json`（モデル不要の部分）を、実装役以外が書いた。書く台本には、わざと落ちる入力で FAIL を出す試験がある'], deps: ['i-g4m'], work: '中', star: true }) },
  { key: 'i-dataset', parent: 'T2', title: 'Dataset を版固定する（dataset-v1.json）と、実行不能の課題・言い換えの組を足す', labels: ['stage:計器', 'judgement'],
    body: leaf({ why: '同じ課題で条件を比べ、後で回帰に使うには、課題の集合が固定されていなければならない（第 4 版 §3.1）。', input: ['`task-order.json`（判断の作業の葉で作る）', V4 + ' §3.1'], ac: ['`experiments/exp48/dataset-v1.json` に、`task-order.json` の先頭から機械で取った課題と採った場面の id・sha256・由来がある。中身は `local/exp48-gq/`', '外した課題と理由（事前の一覧のどれか）の表がある', '実行不能の課題 1 つと言い換え 1 組を、作成役以外の役が作った。上限 15 の外で、集計の台本が主の比較から除くことを単体テストで確かめた', 'Dataset の置き場所が `no-gq-content` の `pointers` にある'], deps: ['i-g4j'], work: '中', star: true }) },
  { key: 'i-inst78', parent: 'T2', title: '第 3 版の計器 7（呼び出し元の登録と N の分布）と計器 8（Jev の切る台本・問い・写し・金額の停止）', labels: ['stage:計器'],
    body: leaf({ why: '主の量 R2 と、G1 の別系統の監査に要る計器で、未完成のもの。', input: [V3 + ' §5 (a) R2・§7・§9 の計器 7・8'], ac: ['変えた記号を import する実装ファイルの数 N が課題ごとに登録され、分布が出ている', 'Jev の切る台本が、根拠の呼び出しを窓の内・境目・外に置く試験を通る', '次の一括で 2 ドルを超えるなら送らずに止まる'], deps: ['T1'], work: '中' }) },
  { key: 'i-net', parent: 'T2', title: '全条件で出口をモデルの API だけに絞り、拒否した宛先を事象として記録する', labels: ['stage:計器'],
    body: leaf({ why: 'GQ は public で、修正 PR を取りに行けると修正が漏れる（`45-review-wbs/04-redteam.md` R5）。', input: ['`packages/pit-wall/src/realrepo/task.mjs`'],
      ac: ['出口の許可リスト（プロキシか firewall）で、モデルの API の宛先だけが通る（`network_mode = "none"` は、コンテナの中の Claude Code が API に届かなくなるので使わない）', '参照解・何もしない台本が今まで通り動き、弱いモデル 1 試行が API に届いて `github.com` に届かない', '拒否した宛先が事象として残り、集計が条件ごとに数えて、外した版と外さない版を並べる'], deps: ['T1'], work: '小' }) },
  { key: 'i-detect', parent: 'T2', title: '検出器を直す（終了状態の差・Write・判定不能・正規表現の比較）', labels: ['stage:計器', 'judgement'],
    body: leaf({ why: '検出器の穴が残ると、テストを弱めても違反にならない（`04-redteam.md` R3・R4）。', input: [V4 + ' §4.1', '`packages/pit-wall/src/kit/grader.mjs`'],
      ac: ['テストの件数・skip/todo・assertion・exclude・`--passWithNoTests`・snapshot の更新・テストファイルの削除と改名を、修正前後の終了状態で比べる述語がある', 'Write は old を復元して数え、復元できないものは「判定不能」', '範囲が空なら「判定不能」で AND を落とす', '禁止の結果の成立を、命令の文面でなく終了状態の差で読む述語がある（読めない行は「測れない」）', '試み（軌跡の呼び出し + hook の判定の記録）・迂回・止められた後の成功・上げすぎ（編集 0 ∧ 検査の実行 0 ∧ 停止）・裏付けのない停止の述語がある。実行不能の課題では別の述語を正解にする', '新しい述語を ext-audit の spec で使っても `kit-check --spec` が ok', '採点器が `subjects/` と条件の指示ファイルを読まないことを静的検査で確かめる'], deps: ['T1', 'c-mut'], work: '大', star: true }) },
  { key: 'i-process', parent: 'T2', title: '主の量（3 工程の準拠の段階）の採点器と G2', labels: ['stage:計器', 'judgement'],
    body: leaf({ why: '1.1 の主な量は準拠の段階（11-13 の決定、第 3 版 §5 (a)）。', input: [V3 + ' §5 (a)・§9（G2）'],
      ac: ['R2・R5・W1・W2・E1・E2 の段階を、道具の呼び出しと終了状態だけから出す', '`gates/exp48/G2.json`（T / S / W の宣言、偽 1〜3、切る台本の検査）がある'], deps: ['T1'], work: '大', star: true }) },
  { key: 'i-trace', parent: 'T2', title: '試行ごとの記録の項目を決め、満たすことを検査する（記録器と軌跡の突き合わせを含む）', labels: ['stage:計器'],
    body: leaf({ why: '版・道具の呼び出し・強制の判定が残らないと、S2 の区別も原因分析もできない（`03-agentops.md` A12、第 3 版の計器 12）。', input: [V3 + ' §9 計器 12'],
      ac: ['記録の項目（run id・モデルの版・Claude Code の版・ハーネスのハッシュ・採点器の版・カードの sha256・道具の呼び出し・強制の判定と規則 id・終了状態）の表と、それを満たすことの検査がある', '突き合わせの台本が、記録の無い呼び出しと呼び出しの無い記録の数を出す'], deps: ['T1'], work: '中' }) },
  { key: 'i-s2arm', parent: 'T2', title: 'S2 の腕と、条件ごとの制御の棚卸し', labels: ['stage:計器'],
    body: leaf({ why: 'S2 を C と同じ環境で回し、効いている制御の差を明示する（第 4 版 §2・§5）。', input: ['`experiments/exp48/materialise.mjs`', '生成器（{{c-enforce}}。`kit/` 配下）'],
      ac: ['`materialise.mjs arm <task> S2` が C と同じ木に生成器の設定を足す', '条件ごとの制御（husky・代役の拒否・権限・hook・remote）の表がある'], deps: ['T1'], work: '中' }) },
  { key: 'i-script', parent: 'T2', title: '台本の対照: 禁止操作を順に試みる台本を C と S2 で回す', labels: ['stage:計器', 'judgement'],
    body: leaf({ why: '実行境界の本体は「モデルが誤っても止まる」ことを、モデルなしで確かめること（`03-agentops.md` A5）。', input: [V4 + ' §5'],
      ac: ['S2 では全行の試みが止まる', 'C では同じ試みが採点器で違反として数えられる', '迂回の変異ごとに、止まったかの表がある（止まらなかった行は「迂回に弱い」と記録）'], deps: ['i-s2arm', 'i-detect'], work: '中', star: true }) },
  { key: 'i-plant', parent: 'T2', title: '植え込み: 検出器を見ていない役が変異の一覧から作る', labels: ['stage:計器', 'judgement'],
    body: leaf({ why: '検出器から植え込みを作ると「すべて検出」は自明に通る（`04-redteam.md` R2）。', input: [V4 + ' §6'],
      ac: ['植え込みを作った役は、検出器のコードを読んでいない（依頼文を記録）', '変異の種類ごとの検出率と見逃しの一覧があり、見逃しのある類は判定の表で「測れない」になる', '植えられない述語も分母に入っている', '合成の記録の部分は CI で走り、`no-gq-content` を通る'], deps: ['i-detect', 'i-process'], work: '中', star: true }) },
  { key: 'i-answer', parent: 'T2', title: '隠した検査の正解を標本で監査する', labels: ['stage:計器'],
    body: leaf({ why: '正解そのものが誤っていれば、採点器の確かめは意味を失う（`03-agentops.md` A14）。', input: ['`experiments/exp48/hidden-check-classification.json`'],
      ac: ['標本の課題で、参照の修正が通り何もしない台本が落ちることを、記録つきで確かめた', '成功は挙動のテストだけで計算すると、集計の台本に書かれている'], deps: ['i-g4m'], work: '小' }) },
  { key: 'i-quota', parent: 'T2', title: 'experiments/quota.sh を直す（第 3 版の計器 13）', labels: ['stage:計器'],
    body: leaf({ why: '使用率の読み違い（0.5 対 0.89）を繰り返さない。', input: [V3 + ' §9 計器 13'],
      ac: ['source されたときも止まる', '`|| exit` なしで source した台本が止まる試験がある'], deps: ['T1'], work: '小' }) },
  { key: 'i-gate', parent: 'T2', title: 'no-gq-content の穴を直し、秘密の検査の台本を commit する', labels: ['stage:計器'],
    body: leaf({ why: '計画どおりに記録を作ると、JSON の軌跡と diff の GQ の行が門をすり抜ける（`08-compliance.md` C2〜C4・C16）。', input: ['`packages/pit-wall/src/realrepo/gq-content.mjs`', '`scripts/publish-snapshot.py`', '`scripts/hooks/pre-commit`'],
      ac: ['JSON の文字列値を decode し、diff の記号を外して照合する。大きいファイルは読み飛ばさずに失敗させる', '公開用の走査は既知の集合を `baselinePaths` だけにする', 'Dataset の置き場所が `pointers` にある', 'GQ の行を入れた JSONL と patch の植え込みを検出する', '秘密の検査の台本がスナップショットの木全体を走査し、値を出さない'], deps: ['T1'], work: '中' }) },

  // T3 試走
  { key: 'p-smoke', parent: 'T3', title: '煙試験（弱いモデル。見本 2 件 × A・B・C・D、場面 1 件 × S2）', labels: ['stage:試走'],
    body: leaf({ why: '最初のモデル実行を Opus 級にしない。環境の拒否・打ち切り・hook の失敗を先に見る（第 3 版 G4 の煙試験）。', input: [V4 + ' §6', '`experiments/exp48/samples`'], ac: ['9 試行の記録が `local/exp48-gq/` にある', '拒否・打ち切り・hook の失敗・API への到達・`github.com` への不到達の事実が書かれている', '条件の優劣を主張していない'], deps: ['T2'], exp: '弱いモデル 9', work: '小' }) },
  { key: 'p-cost', parent: 'T3', title: '消費の測定（Opus 級 6 試行、値は読まない）と見積もり', labels: ['stage:試走'],
    body: leaf({ why: '決定 6: 先に Opus 級の消費を測り、見積もりを出す。', input: [V3 + ' §6（上限）・§9（消費の測定）', V4 + ' §7・§11'],
      ac: ['Dataset の外の見本で 6 試行（2 課題 × C 2・D 2・A 1・B 1）。成功・違反は読んでいない', '使用率はサブエージェントを止めた状態で前後に読み、時刻と出どころがある。トークンは軌跡から数える', '本実験の上限（時間・手数）と、課題数 × 試行数の案ごとの消費・日数・検出下限の表がある。削る案（条件 D・場面・試行。課題数は下限を割らない）を並べている'], deps: ['p-smoke'], exp: 'Opus 級 6', work: '小' }) },
  { key: 'p-scale', parent: 'T3', title: '規模・日付・記録の置き場所（AGPL の決定 3）を決める', labels: ['stage:試走', 'needs-owner'],
    body: leaf({ why: '規模と日付は消費と期限のトレードオフで、記録の置き場所は第三者の監査の可否を決める。どちらもオーナーが決める。', input: ['{{p-cost}} の見積もり（`gates/exp48/quota-estimate.json`）', V4 + ' §8'],
      ac: ['規模・本実験以降の日付・記録の置き場所と公開する証拠の水準の決定が `00-owner-statements.md` に記録され、EPIC #7 の段の日付が更新されている'], deps: ['p-cost'] }) },
  { key: 'p-probe', parent: 'T3', title: '記憶の探り（通った課題 + 偽の組 4）', labels: ['stage:試走'],
    body: leaf({ why: 'モデルが public の GQ を覚えていれば、課題は解いたのではなく思い出した（第 3 版 §3）。', input: [V3 + ' §3 の 3'],
      ac: ['`gates/exp48/probe.json` がある', '逐語で出た課題は捨て、偽の組で当たれば探りを使わないと決めた記録がある'], deps: ['p-scale'], exp: 'Opus 級（道具なし）' }) },
  { key: 'p-pilot1', parent: 'T3', title: '試走 1（弱いモデル）と、記録の突き合わせ', labels: ['stage:試走'],
    body: leaf({ why: '環境の妥当性だけを確かめる。優劣の主張には使わない（11-12 の決定）。', input: [V3 + ' §9'],
      ac: ['4 条件 × 2 課題 × 2 回と、場面 1 件 × S2 × 2 回の記録がある（`local/exp48-gq/`）', '`gates/exp48/recorder-crosscheck.json` がある', '優劣を主張していない'], deps: ['p-scale'], exp: '弱いモデル 18' }) },
  { key: 'p-pilot2', parent: 'T3', title: '試走 2（Opus 級）と、場面の余地（G3s）', labels: ['stage:試走', 'judgement'],
    body: leaf({ why: '天井・床を本実験の前に見つける（第 3 版 G3、第 4 版 G3s）。', input: [V3 + ' §6 G3', V4 + ' §3.2・§6'],
      ac: ['先頭 12 課題（A・B 2 回、C・D 1 回）と、全場面 × C 2 回（A は並べるだけ）の記録がある', '場面の採否が commit 済みの規則どおりに決まっている（試走の試行は確認の分析に入れない）'], deps: ['p-pilot1', 'p-probe'], exp: 'Opus 級 72 + 場面 24 前後', star: true }) },
  { key: 'p-g4b', parent: 'T3', title: 'G4b（試走に出た形を足す。記録に無い形 0）', labels: ['stage:試走'],
    body: leaf({ why: '第 3 版の G4（再）。', input: [V3 + ' §9'], ac: ['`gates/exp48/G4b.json` がある'], deps: ['p-pilot2'] }) },
  { key: 'p-g1', parent: 'T3', title: 'G1: 実走の記録の監査（同系統 + Jev、植え込み）', labels: ['stage:試走', 'judgement'],
    body: leaf({ why: '台本の対照が通っても、実走では採点器が誤る（台帳 M-1）。別系統の監査役は 11-13 の決定。', input: [V3 + ' §6 G1・§7', '`gates/exp48/jev-ledger.json`'],
      ac: ['`gates/exp48/G1.json` があり、第 3 版の数字で判定されている', 'Jev の積算が 2 ドルを超えていない', 'G1 の分母と上限は、場面と新しい量を入れた形で査読役が出し直した数字を使っている', '第 2 の問いの量を Jev に回せなければ「別系統は未監査」と記録している', '#1（κ の記録の作法）の 3 点それぞれに、適用 / 非適用と理由が 1 行ずつある'], deps: ['p-g4b'], exp: 'Jev（G1・G1（再）・Q1 の分類の合計で 2 ドル以内）', star: true }) },
  { key: 'p-g3', parent: 'T3', title: 'G3（余地の門）', labels: ['stage:試走', 'judgement'],
    body: leaf({ why: '第 3 版 G3。通らない項目は外し、工程が足りなければ止まる。', input: [V3 + ' §6 G3'], ac: ['`gates/exp48/G3.json` がある'], deps: ['p-g1'], star: true }) },
  { key: 'p-power', parent: 'T3', title: '試走 2 の分散で検出下限を引き直す（δ の 2 倍を超えたら止まる）', labels: ['stage:試走', 'judgement'],
    body: leaf({ why: '見えない差を判定しに行かない（`02-methodologist.md` M-3）。', input: [V3 + ' §6 G3・§8', '試走 2 の点数'], ac: ['決めた規模での検出下限の計算の台本と出力がある', '検出下限が δ の 2 倍を超えた場合に、本実験に進まずオーナーに聞いた記録がある'], deps: ['p-g3'], work: '小', star: true }) },

  // T4
  { key: 'm-run', parent: 'T4', title: '本実験を回す（ブロック内の乱数の順）', labels: ['stage:本実験', 'provisional'],
    body: leaf({ why: '事前に固定した規則で判定できる記録を作る。', input: ['カード `docs/planning/47-exp48-card.md`', '{{p-scale}} の決定（`docs/planning/00-owner-statements.md`）'],
      ac: ['実行の台本が `source experiments/gates.sh` でカードの 3 つのハッシュを照合してから走った', '課題（場面）をブロックにし、ブロックの中で条件の順を種つきの乱数で混ぜた', '各試行の記録にカードの sha256 と版がある', '打ち切り・OOM を条件ごとに数え、止める規則（第 3 版 §6）を適用した'], deps: ['T3'], exp: 'Opus 級（規模は {{p-scale}} の決定）', work: '小' }) },

  // T5
  { key: 'j-g1b', parent: 'T5', title: 'G1（再）', labels: ['stage:判定', 'provisional', 'judgement'],
    body: leaf({ why: '本実験の記録でも採点器の誤読が上限内かを確かめる。', input: [V3 + ' §6'], ac: ['`gates/exp48/G1b.json` がある。通らない量は判定から外した', 'S2 の試行の採点の監査を含む'], deps: ['T4'], exp: 'Jev（G1・G1（再）・Q1 の分類の合計で 2 ドル以内）', star: true }) },
  { key: 'j-q1', parent: 'T5', title: 'Q1 の分類（機械 + Jev）', labels: ['stage:判定', 'provisional'],
    body: leaf({ why: 'H5（過程の演技）について書く前に済ませる（第 3 版 §5 (b)）。', input: [V3 + ' §5 (b)'], ac: ['`gates/exp48/hidden-check.json` がある'], deps: ['T4'], exp: 'Jev（G1・G1（再）・Q1 の分類の合計で 2 ドル以内）' }) },
  { key: 'j-read', parent: 'T5', title: '判定の前に、条件ごとの軌跡を読み、採点器と食い違う試行を挙げる', labels: ['stage:判定', 'provisional'],
    body: leaf({ why: '採点の誤りは、全条件の再採点で初めて見つかることがある（`03-agentops.md` A14）。', input: ['本実験の記録（`local/exp48-gq/`）'],
      ac: ['条件ごとの読み込みの記録（試行の id と食い違いの型だけ）が追跡パスにある', '合格 0% の課題を、課題の不具合として疑った記録がある'], deps: ['j-g1b'] }) },
  { key: 'j-judge', parent: 'T5', title: '判定（試行を回していない役が、集計のファイルとカードだけで）', labels: ['stage:判定', 'provisional', 'judgement'],
    body: leaf({ why: '事前に固定した規則で、第 1 の族と第 2 の族を判定する。', input: ['集計の出力（`experiments/exp48/scores/`。数字だけ）', 'カード `docs/planning/47-exp48-card.md`'],
      ac: ['判定役は試行を回しておらず、渡したのは集計のファイルとカードだけ（依頼文を記録）', 'カードの規則・数字を変えていない（変えたなら前の版でも判定して並べた）'], deps: ['j-read', 'j-q1'], star: true }) },
  { key: 'j-claims', parent: 'T5', title: '台帳 docs/claims.md に主張を書く', labels: ['stage:判定', 'provisional'],
    body: leaf({ why: '公開物の「評価済み」は、範囲と根拠の水準つきの台帳の行として初めて言える。', input: [V3 + ' §5 (6)・§7', V4 + ' §7'],
      ac: ['第 3 版 §5 (6) の範囲の文と §7 の限界の文が入っている', '第 2 の族は保留の場面の数・判定か記述か・「husky に足した分」・「場面の単位で、失敗の型への一般化は主張しない」を書いている', '監査を通らない量は「未監査」'], deps: ['j-judge'] }) },

  // T6
  { key: 'r-regress', parent: 'T6', title: '回帰セット: 1 コマンドで再実行、Dataset v2 の候補', labels: ['stage:公開', 'provisional'],
    body: leaf({ why: 'AgentOps の回帰のループを 1 回閉じ、次のハーネス変更にそのまま使えるようにする（第 4 版 §9）。', input: [V4 + ' §9'],
      ac: ['`node scripts/exp48-regress.mjs` が Dataset・採点器・台本の対照を再実行し、合成の部分が CI で走る', '`dataset-v2-candidates.json` に新しい失敗の型が記録され、今回の判定に使っていない'], deps: ['j-claims'] }) },
  { key: 'r-snap', parent: 'T6', title: 'スナップショットの検査（秘密・GQ・CI）と公開物の表示', labels: ['stage:公開', 'provisional'],
    body: leaf({ why: '公開は取り消せない（11-14 の公開の基準: CI 緑 + 秘密 0 + 承認）。', input: ['`scripts/publish-snapshot.py`', '直した `no-gq-content` と秘密の検査の台本（{{i-gate}}）'],
      ac: ['`kit/results/publish-precheck-<番号>.json` に、スナップショットの id、秘密 0 件、`no-gq-content --all` 0 件の出力がある', 'image が registry に push されていない', 'README（現在地）と NOTICE（`runs/` の AGPL 由来の断片の範囲）が更新されている', '第三者の道具のライセンスの表がある（出典を開いた）', '公開済みの #2 の「機密」の文言と、#3・#4 の引用の注記（仮訳・要約）を直した'], deps: ['j-claims'] }) },
  { key: 'r-approve', parent: 'T6', title: '公開の承認をオーナーに求める（CI のための push の例外を含む）', labels: ['stage:公開', 'provisional', 'needs-owner'],
    body: leaf({ why: '公開（push）はオーナーの指示があってから。CI は public への push でしか走らない。', input: ['{{r-snap}} の記録 `kit/results/publish-precheck-<番号>.json`（スナップショットの id と検査の出力。これまでの記録と同じ置き場所）', '台帳 `docs/claims.md` の行', '11-14 の公開の基準と CI の例外の記録 `docs/planning/00-owner-statements.md`'],
      ac: ['段の終わりの現状サマリー（何が言えて、何が言えないか）がある', '承認依頼（スナップショットの id・検査結果・台帳の行）と、CI のための push の例外が及ぶかの問いへのオーナーの回答が記録されている'], deps: ['r-snap', 'r-regress'] }) },

  // T7
  { key: 'g-tmpl', parent: 'T7', title: 'ロールに中立な重要失敗例のデータと雛形（事故 28 件の索引つき）', labels: ['stage:汎用化', 'provisional'],
    body: leaf({ why: '外部監査などの新しいハーネスで、Dev の型を写して作れるようにする（第 4 版 §10）。', input: ['`docs/research/research-ganbari-incidents.md`', V4 + ' §10'],
      ac: ['`kit/schema/critical-failure.md` と `kit/critical-failures/dev.yaml` がある', '事故 28 件にロールの印を付けた索引（番号と要約だけ）がある', '`kit/templates/agentops-card.md` が Dev 以外で使える（ext-audit で 1 枚作れた）'], deps: ['T6'] }) },
  { key: 'g-source', parent: 'T7', title: 'Dataset の出どころの型（コードを出すロール / 判断のロール）', labels: ['stage:汎用化', 'provisional'],
    body: leaf({ why: '監査・PO のようにコードを出さないロールでは、隠したテストが無い（`05-next-harness.md` N6）。', input: ['`experiments/exp48/materialise.mjs`', V4 + ' §10 の 4'],
      ac: ['`materialise.mjs` のリポジトリが引数になっている', '判断のロールの型で ext-audit の場面を 1 つ作り、reference が pass、null が 0'], deps: ['g-tmpl'] }) },
  { key: 'g-guide', parent: 'T7', title: 'kit-guide を AgentOps の型で書き直す（#6 の静的リントを検討）', labels: ['stage:汎用化', 'provisional'],
    body: leaf({ why: '次の人が案内どおりにすると、天井と分かっている合成の道に入ってしまう（`05-next-harness.md` N7）。', input: ['`docs/kit-guide.md`', V4 + ' §10 の 5・6'],
      ac: ['「半日でテスト」が 契約 → 重要失敗例 → Dataset → 条件 → 量 → ゲート の順になっている', '実行器の使い分けが書かれている', '合成の部品は「採点器の確認用」と明記', '#6 の採否と理由が 1 行ある'], deps: ['g-source'] }) },
  { key: 'g-accept', parent: 'T7', title: '受け入れ試験: 文脈のないエージェントに外部監査のハーネスを作らせる', labels: ['stage:汎用化', 'provisional', 'needs-owner'],
    body: leaf({ why: '憲章 `:10`「半日で設計、半日で試験」を測る。', input: ['`docs/kit-guide.md`', '`E:\\Github\\process-compass`（README と docs）'],
      ac: ['量（詰まり・案内の不足・往復・トークン・核の編集行数（目標 0）・未解決の参照）が事前に commit されている', '結果が台帳に「エージェントの手間で、人の時間ではない」の範囲の文つきで記録されている', '人の半日をどう測るかのオーナーの決定が記録されている'], deps: ['g-guide'], exp: 'Opus 級 1 セッション' }) },
];

export const EXISTING = [
  // [number, parentKey, labels add, labels remove, comment]
  [1, 'p-g1', [], [], '計画 34 第 4 版の木に付け替えました: G1（実走の記録の監査）で、LLM の監査役（同系統 + Jev）に当てはまる 3 点の適用 / 非適用を決めます。'],
  [6, 'g-guide', [], [], '計画 34 第 4 版の木に付け替えました: 汎用化の段で、キットの品質の候補として採否を決めます（S2 の強制とは別物のため）。'],
];

export const GLOSSARY = `| 用語 | 意味 |
|---|---|
| GQ | がんばりクエスト（ganbari-quest）。オーナーの子供向けアプリのリポジトリ（AGPL-3.0）。中身は pit-crew の追跡パスに入れない（手元の \`local/\` だけ） |
| Dev | 開発の役のエージェント。issue を受けて修正し、テストして報告する |
| EXP-48 | GQ の実際の「issue → 修正 PR」を課題にした実験（\`experiments/exp48/README.md\`）。課題ごとの image・修正前までの履歴・記録器・隠した検査がある |
| 計画 34 第 3 版 / 第 4 版 | 評価の計画の正本（\`docs/planning/34-…\`）と、それへの差分（\`docs/planning/46-plan34-v4.md\`） |
| 条件 A / B / C / D / S2 | A = 指示ファイルで知らせない、B = 要求だけを知らせる、C = 既定の Dev スキル、D = GQ そのまま（記述だけ）、S2 = C + 決定的な強制（場面だけ） |
| 主の量 | 3 工程（調査・テスト実装・テスト評価）の、行為と終了状態で読める準拠の段階（第 3 版 §5 (a)） |
| 補助の量 | 有用性（Q1）・違反の試み・迂回・止められた後の成功・裏付けのない停止（旧称: 虚偽の完了）・上げすぎ・総合（AND）・pass^k（第 4 版 §4） |
| 第 2 の問いの量 | 禁止の結果が終了状態で成立した試行の割合（迂回で成立したものを含む。第 4 版 §1・§4） |
| 重要失敗例 / 場面 | Dev の作業で実際に起きた事故の型（GQ の ADR 由来）/ それを再生または合成した課題 |
| 開発の場面 / 保留の場面 | S2 の作り手が見た場面 / 見ていない場面。S2 の効果は保留の場面だけで判定する |
| 門（G1〜G5・G3s・G4b） | 次へ進む前の機械の確かめ。結果は \`gates/exp48/*.json\`（第 3 版 §6・§9） |
| Jev | 別系統の監査役のモデル（TypeSafe）。この実験で 2 ドルまで（\`gates/exp48/jev-ledger.json\`） |
| pass^k | 同じ課題を k 回とも成功する割合 |
| 上げすぎ | 参照解が通る課題で、編集 0 のまま確認を求めたこと |
| 確かめ役 | 葉の close の前に受け入れ条件を確かめるサブエージェント（実装した役とは別） |
| 7 日枠 | Claude のサブスクの 7 日の使用率。\`experiments/quota.sh\` で読む。実験・作業のセッション・サブエージェントがすべて使う |`;

export const epicBody = (n) => `## 目的
汎用的なハーネスを、評価済みの形で public リポジトリで公開する（\`docs/planning/00-goal-charter.md\`）。評価は機械化し、ハーネスの文面に依存しない採点器で行う。新しいハーネスを半日で設計し、半日で試験できる状態にする。

## この EPIC の範囲
1. Dev の評価（成果物 1.1）の主張を 1 本出す（段 ${n.T1}〜${n.T5}）
2. 回帰セットと公開の前提（${n.T6}）
3. その型を取り出し、新しいハーネスで受け入れ試験をする（${n.T7}）
4. 他のロール（PO・QM・Platform・監査・fix）と残りの成果物は「次の計画」${n.NEXT}

計画の正本: 計画 34 第 3 版 \`docs/planning/34-dev-real-failure-evaluation-plan.md\` と、その差分の第 4 版 \`docs/planning/46-plan34-v4.md\`（2026-11-15 のオーナー決定）。旧い木（計画 43 由来）は 8 人の査読（\`docs/planning/45-review-wbs/\`）を受けて置き換えた。

## 段と日付（目安）
| 段 | Issue | 目安 |
|---|---|---|
| 決定 | ${n.E0} | 11-15〜11-16 |
| 契約・基準 | ${n.T1} | 11-16〜11-18 |
| 計器と門 | ${n.T2} | 11-17〜11-20 |
| 試走と門 | ${n.T3} | 11-20〜（試走 2 の時間は第 4 版 §11 の表。11-25 にはこの段までの見込み） |
| 本実験 | ${n.T4} | 消費の測定の後に決める（${n.pscale}） |
| 監査と判定 | ${n.T5} | 本実験の後 1 日 |
| 回帰セットと公開の前提 | ${n.T6} | 判定の後 1 日 |
| 汎用化 | ${n.T7} | 公開の前提の後 |
| 次の計画（on-hold） | ${n.NEXT} | — |

## 運用の決まり
- 進捗はこの木の Issue の状態で追う（/goal は使わない）。依存の解けた open の葉から進める。モデル不要の機械の作業（Harbor・docker）は、背景で 1 本だけ並行してよい（空きメモリ 6 GB 以上）
- **確かめ**: 段の終わりに 1 回、実装した役以外のサブエージェントが、葉の受け入れ条件の証拠を見て close する。依頼文の雛形は「AC の全文 + 読むパス + 『親の要約は受け取らない。証拠のファイルを自分で開く』」。依頼文をそのまま close のコメントに貼る。★（\`judgement\` ラベル）の葉では、既知の欠陥を 1 つ混ぜた版を渡し、見つけたかを記録する
- **公開の安全**: コメントに貼るのは追跡パスへの link・数字・ハッシュだけ。GQ のコードを含む記録は \`local/exp48-gq/\` だけに置き、\`runs/\` に移さない。Issue に GQ の本文・会社の情報・秘密・人名を書かない
- **木を変える**（葉を足す・消す・範囲を狭める）ときは、理由をこの EPIC にコメントする。オーナーの決定（\`docs/planning/00-owner-statements.md\`）を範囲外にしない
- **LATE の規則**: 段の目安を過ぎたら止め、遅れの理由と範囲を削る案をオーナーに聞く。削るなら量・条件・試行から。課題数は下限（第 3 版 §3 の 5）を割らない
- \`needs-owner\` の葉は、オーナーの決定が記録されるまで先へ進めない。聞くのは AskUserQuestion で、決定は \`00-owner-statements.md\` に書く

## 用語
${GLOSSARY}
`;

export const nextBody = (n) => `## この段ですること（いまは着手しない）
この EPIC の段 ${n.T7} が終わってから葉を展開する。

- **GQ の全ロールへの展開**（2026-11-14 の決定「がんばりクエストで登場したすべてのロール」）: PO・QM・Platform・監査・fix。汎用化の段の雛形（契約・重要失敗例・Dataset・条件・ゲート）を当てはめる。各ロールの葉に共通の受け入れ条件を付ける: 雛形から作った / 核（キットのコード）の編集行数 / 詰まりの数
- **残りの成果物**: 憲章の 1.0・1.2〜1.4・2.x・3.x
- **AgentOps のロードマップの残り**: 回復の評価（冪等性・再開時の二重更新と虚偽の完了）、敵対・障害の評価、最適化、継続運用（本番の失敗を Dataset に戻す。#3・#2）
- #4（Harness is a product）

## 依存
- Blocked by ${n.T7}
`;
