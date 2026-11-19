// Balanced synthetic decisions for validating the READER measure (design 23 §13.2). Unlike
// synthetic-structures.mjs (whose options are lopsided: a reader picks the adopted option from the
// wording alone, P_0 up to 0.96), every option here is the right one under SOME decisive observation,
// so the reader should sit near chance without a rationale and move only with the observation.
// Each case: task (used masked as the control text), options with neutral wording, and per option
// the decisive observation that supports it WITHOUT naming any option. Data only.
export const BALANCED = [
  { id: 'dedupe', task: 'Customer records are sometimes duplicated when the nightly import runs twice. Decide where to prevent duplicates.',
    options: [
      { text: 'check for an existing record before each insert', obs: 'The import runs single-threaded and the table has no unique key; adding one would need a migration the team has frozen until the audit.' },
      { text: 'add a unique index and let the insert fail', obs: 'Migrations are routine here, the import already retries on any constraint error, and two importers can run at the same time.' },
    ] },
  { id: 'config', task: 'The service reads its settings from three places and they disagree. Decide which one becomes the single source.',
    options: [
      { text: 'the environment variables', obs: 'The deploy tool only lets operators change environment variables, and the file in the repository is overwritten on every release.' },
      { text: 'the settings file in the repository', obs: 'Operators have no access to the deployment environment, and every change must be reviewed in a pull request for the audit trail.' },
      { text: 'the database settings table', obs: 'Settings must change at runtime without a restart, and several instances must see the same value at the same moment.' },
    ] },
  // Task statements must not imply a direction (run 2: "too noisy … reduce" sent the control to 0.95).
  { id: 'log-level', task: 'The team disagrees about how production logging should be organised. Decide.',
    options: [
      { text: 'raise the level so only warnings and errors are written', obs: 'Nobody has read a debug line in production in a year, and the noisy lines come from one logger that has no separate switch.' },
      { text: 'keep everything but route each module to its own file', obs: 'Support needs the full trace of a single request to reproduce bugs, and the storage cost of logs is not a concern.' },
    ] },
  { id: 'retry-ja', task: '外部 API の呼び出しがときどきタイムアウトする。どこで再試行するかを決める。',
    options: [
      { text: '呼び出し側で回数を決めて再試行する', obs: '呼び出し側ごとに許容できる待ち時間が違い、バッチは長く待ててよいが画面からの呼び出しは 2 秒で諦める必要がある。' },
      { text: '共通の HTTP クライアントの中で再試行する', obs: '呼び出し側は 30 か所あり、どれも同じ待ち時間でよく、個別に直すと漏れが出ることが前回の障害で分かっている。' },
    ] },
  { id: 'rounding-ja', task: '請求書と会計で合計の端数処理が異なることが分かった。どう揃えるかを決める。',
    options: [
      { text: '請求書側の丸めを会計側と同じ関数に揃える', obs: '会計側の丸め関数は監査済みで仕様書にも記載があり、請求書側だけが独自に小数を切り捨てていた。' },
      { text: '会計側の丸めを請求書側に揃える', obs: '請求書側の丸めが法令の定める端数処理に合っており、会計側の関数は旧仕様のまま残っていたことが調査で分かった。' },
      { text: '両方を残し差額を調整項目として出力する', obs: 'どちらの丸めも別々の顧客契約で明示されていて変えられず、差額を明示して出すことが監査人から求められている。' },
    ] },
];
