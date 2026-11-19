import * as cleanup from './cleanup.js';
import * as digest from './digest.js';
import * as reindex from './reindex.js';
import * as rollup from './rollup.js';
import * as subscribe from './subscribe.js';

// Every job the scheduler can call. Each job's run({ db, ... }) returns { status, body }.
export const JOBS = { cleanup, digest, reindex, rollup, subscribe };
