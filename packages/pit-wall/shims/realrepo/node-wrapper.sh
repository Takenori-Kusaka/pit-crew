#!/bin/bash
# The only `node` on PATH in a real-repository task image (installed as /usr/local/bin/node;
# the real binary is $PITWALL_REAL_NODE, default /opt/pitwall/node/bin/node).
# Every way of running a project's check tools ends in `node <script> ...` (npm, npx, the
# node_modules/.bin shims with their `#!/usr/bin/env node`, bash -c, chains), so this is the
# one place where the run can be recorded whatever the form of the call (recorder.mjs).
# A call that cannot be a check tool goes straight to the real node: nothing between the caller
# and the program, same arguments, same environment.
REAL=${PITWALL_REAL_NODE:-/opt/pitwall/node/bin/node}
REC=${PITWALL_RECORDER:-/opt/pitwall/rec/recorder.mjs}
for a in "$@"; do
  case $a in
    *vitest*|*svelte-check*|*svelte-kit*|*tsc*|*typescript*|*biome*|*eslint*|*stylelint*|*playwright*|*npm-cli*|*npx-cli*|*/npm|*/npx|npm|npx)
      [ -f "$REC" ] && exec "$REAL" "$REC" "$@"
      break ;;
  esac
done
exec "$REAL" "$@"
