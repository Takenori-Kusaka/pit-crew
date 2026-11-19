# genai-evaluation-blueprint と既存資産の調査（要約版）

## このまま使える本の枠組み

- **成熟度 V0〜V4。** 段階を飛ばさない。先に V1（固定セットを人が採点）を作り、その後で V2（CI で回帰を判定）に進む。審判の照合相手が先に要るため（19-evaluation-maturity.md）
- **ゴールデンセット。** 実際の失敗から 20〜50 件。版を付け、合否は 2 値で、最終判定者は 1 人。30 件を過ぎたら基準を書き直す（23 §3）
- **統計。** Miller (arXiv:2411.00640) に従い、信頼区間、対応のある差の検定、検出力を出す。pass^k を使う。審判と人の一致は Cohen の κ とラベル件数で記録する。較正に使うラベルと一致の測定に使うラベルは分ける（19 §7、23 §4）
- **審判。** 生成側とは別のモデルにする。提示順を入れ替える。長さを統制する。YES/NO のチェックリストにする。2025 年以降は LLM-as-judge への懐疑論もある（05）
- **回帰を判定するタイミング。** 自分の変更時に加え、提供者のモデル更新時と定期実行。PR では一部、マージ時に全件（19 §4、23 §4）
- **2 層 10 項目を skill に読み替えたもの。**
  - I1：聞き返し
  - I2：必要な ADR を読んだか
  - I3：文脈の読みすぎ
  - I4：古い文書を根拠にしていないか
  - I5：読んではいけないもの
  - G1：形式
  - G2：受入基準に忠実か
  - G3：テストが通るか
  - G4：ロールの越権
  - G5：達成度と手直しの量
- **道具に依存しないデータ形式。** JSONL を repo に置き、評価の道具は実行器としてだけ使う。道具の入れ替わりが激しいため（OpenAI Evals は 2026-11-30 に停止、promptfoo は OpenAI が買収）（09）

## 既存の資産

- `E:\Github\ganbari-quest-po\tmp\briefs\research\skills-vs-docs.md`（E1〜E172）
  - SkillsBench：人が整えた skill で +16.6pt。self-generated だと −8.1pt。網羅的な長文 skill は +0.7pt。87 タスク中 13 タスクで悪化
  - skill の発火率は 68.2%
  - QM の役割からの逸脱は文書の追記を 5 回しても変わらなかった。効いたのは「出力形式を強制する subagent」と「承認を止める hook」の組み合わせ
- `E:\Github\process-compass\research\282-survey-2026-09\themes\TH03-rule-delivery-skills.md`
  - Web-Bench では skill を注入すると Pass@2 が −1.3〜4.2pt、費用が +72〜394%
  - skill の本数が増えると選択精度が急に落ちる
  - ルールファイルを自発的に読んだ割合は 3.5%
  - skill の 13.4% に重大な問題がある
- **流用できるコード**
  - `E:\Github\publishing-hub\scripts\derive\lib\judge.mjs`：`claude -p` を隔離して実行する。全ツールを拒否し、--json-schema で出力を縛る。引用が実在しなければ UNKNOWN。repeats 回の結果を集約する
  - `E:\Github\publishing-hub\scripts\derive\calibrate.mjs`：審判の selftest。TPR と TNR を出し、3 の法則で上限を出す。予算で打ち切る

## process-compass から使えるもの

- `phase6-operation\metrics.md`：候補 21 + 三識 4
  - 差し戻し率、手戻り率、ゲート滞留時間、判定記録の完備率、欠陥注入の検出率
  - 対になる指標で歪みを見つける。LLM 審判はふるい分けにだけ使う
- `template\scripts\gate\adoption-trial.mjs`
  - **合否基準を事前にコミットする**（事後に書き換えたら証拠に数えない）
  - **目隠しで欠陥を注入する**（seal/tally）
  - **AI 層の担い手を識別する**（モデルと skill の版を付け、不一致なら失効）
- `recalibration.mjs`：モデルや指示資産の版が変わったときに再評価する
- `scripts\regress\`：一時ディレクトリへの複製、時計の固定、期待する場面との照合
- `seeded-error-safety.md`：注入した欠陥を隔離する 4 層

## 本に無いもの（自分で設計する部分）

1. 複数ステップの軌跡の評価
2. skill の発火を独立変数として扱うこと（置いた効果と、実際に使われた効果を分ける）
3. 複数セッション・複数ロールの相互作用（受け渡し、maker≠approver、逸脱）
4. 環境の再現と隔離（repo の snapshot、gh のモック、時計）
5. 費用とトークンを主要指標として、品質と同時に判定すること
6. 非決定性を前提にした統計設計（対応のある比較、分散分解、多重比較）
7. 改善 / 回帰 / 判定不能の 3 値判定（非劣性・優越性）
8. eval awareness、タスクセットへの過適合（非公開の分割、動的に更新）
9. skill の陳腐化とモデル世代による効果の反転
10. 配布物としての skill の安全性
11. 比べる「なし」をどれにするか（skill なし / CLAUDE.md に書く / subagent に preload）
12. ロール分離そのものの効果（目隠しの欠陥注入と、層別の検出率が近い）
