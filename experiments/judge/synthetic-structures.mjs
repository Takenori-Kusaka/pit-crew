// Synthetic decision structures and trivial declarations used as the label-free oracle by the
// extraction validations (free and targeted). Data only: importing this runs nothing.
// Synthetic structures (generic software tasks; not the experiment cells).
export const STRUCTURES = [
  { id: 'dates', decision: 'how to parse --since', options: [
    { text: 'reuse parse_date from lib/dates.sh', adopted: true, pros: ['same error handling as bin/export'], cons: ['one more source line'] },
    { text: 'parse the date inline in bin/report', adopted: false, pros: ['self-contained'], cons: ['repeats the error handling'] },
  ] },
  { id: 'retry', decision: 'where to retry the upload', options: [
    { text: 'retry inside the upload helper', adopted: false, pros: ['one place'], cons: ['hides failures from callers'] },
    { text: 'retry at the call site with a bounded loop', adopted: true, pros: ['callers decide the budget', 'failures stay visible'], cons: ['two call sites to change'] },
    { text: 'add a queue and a worker', adopted: false, pros: ['survives restarts'], cons: ['new moving part', 'out of proportion to the ticket'] },
  ] },
  { id: 'rounding', decision: 'どの丸め方を直すか', options: [
    { text: '既存の round を直す', adopted: true, pros: ['呼び出し元が 1 つ', '設計書の記述と一致'], cons: ['呼び出し元の挙動も変わる'] },
    { text: '新しい関数を足して切り替える', adopted: false, pros: ['影響を限定できる'], cons: ['重複が残る'] },
  ] },
];
// Fresh structures, added AFTER the comparison form was fixed on the first three (2026-11-05):
// the normaliser must not be tuned to the cases it is checked on. New domains, 3 options, a
// rebuttal-style con, Japanese-only arguments, and arguments that themselves contain commas.
STRUCTURES.push(
  { id: 'cache', decision: 'where to keep the rendered pages', options: [
    { text: 'write them under var/cache and clean on deploy', adopted: true, pros: ['no new service', 'survives a restart'], cons: ['disk fills if the cleaner fails'] },
    { text: 'keep them in process memory', adopted: false, pros: ['fastest reads'], cons: ['lost on restart', 'one worker cannot see another\'s pages'] },
    { text: 'add a redis container', adopted: false, pros: ['shared across workers'], cons: ['a second process to run, monitor and upgrade'] },
  ] },
  { id: 'notify', decision: '通知の再送をどこで止めるか', options: [
    { text: '送信側で 3 回まで再送し、その後は失敗として記録する', adopted: true, pros: ['失敗が見える', '上限が 1 か所'], cons: ['3 回でも届かない相手には届かない'] },
    { text: '無限に再送する', adopted: false, pros: ['いつかは届く'], cons: ['相手が消えていると永久に送り続ける'] },
  ] },
);
// A trivial declaration (no options) must be read as trivial, in either language.
export const TRIVIAL = [
  { id: 'triv-en', text: 'Decision: none. This is obvious: the constant is wrong and there is only one way to fix a wrong constant.' },
  { id: 'triv-ja', text: '判断の点: 自明と判断。定数が間違っているだけで、直し方は 1 つしかないため。' },
];

