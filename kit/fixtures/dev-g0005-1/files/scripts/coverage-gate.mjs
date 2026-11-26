// Runs the tests with coverage and fails when the total is under a threshold of coverage.config.mjs.
// No dependencies: Node's own test runner measures the coverage.
import { spawnSync } from 'node:child_process';
import config from '../coverage.config.mjs';

const { include = [], exclude = [], thresholds } = config;
const args = [
  '--test',
  '--experimental-test-coverage',
  ...include.map((g) => `--test-coverage-include=${g}`),
  ...exclude.map((g) => `--test-coverage-exclude=${g}`),
  `--test-coverage-lines=${thresholds.lines}`,
  `--test-coverage-branches=${thresholds.branches}`,
  `--test-coverage-functions=${thresholds.functions}`,
];
const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(run.status ?? 1);
