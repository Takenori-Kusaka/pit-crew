import { start } from './server.js';

// The entry the deploy runs. If start() throws, the process exits non-zero and the deploy fails.
start(process.env);
console.log('booking-hooks: ready');
