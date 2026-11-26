// Coverage settings for `npm run test:coverage` (CI runs the same command).
// The thresholds only go up. Do not lower them, and do not shrink `include` or grow `exclude`,
// to get a red run green: add the missing tests instead (see CONTRIBUTING.md).
export default {
  include: ['src/**/*.js'],
  exclude: [],
  thresholds: { lines: 80, branches: 70, functions: 80 },
};
