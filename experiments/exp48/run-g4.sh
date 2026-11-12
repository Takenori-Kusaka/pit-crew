#!/bin/bash
# EXP-48 G4: run the in-image tests of the real-repository instruments and write the RAW result
# gates/exp48/G4.result.json (numbers only). No model, no Harbor agent. Run inside WSL:
#   bash experiments/exp48/run-g4.sh [phase ...]
#   phases: unit images checks recorder capture hidden history tools dhooks dhooks-run leak collect
# The verdict file gates/exp48/G4.json is NOT written here: another role writes it from the
# result (process v2 §5: the implementer does not write the gate on its own instruments).
# Samples: experiments/exp48/samples/*.json (two fix commits picked mechanically; instrument
# samples, not tasks). Everything with the subject's content stays under local/exp48-gq/.
# Since review 34 §11 and the owner's decisions of 2026-11-13: every arm has the history up to the
# pre-fix commit (filtered for A/B/C: build-history-mirror.sh first), the gh stand-in with a frozen
# snapshot, graphify in arm D where graphify-out/ is tracked, and a 6,144 MiB container.
set -u
cd /mnt/e/Github/pit-crew
L=local/exp48-gq
OUT=$L/g4-out
W=${G4_WORK:-$HOME/.cache/pit-wall/exp48-g4}
MEM=${G4_MEM:-6144m}
SAMPLES=${G4_SAMPLES:-"g4-s1 g4-s2"}
GRAPHIFY=${G4_GRAPHIFY:-0.9.107}
mkdir -p "$OUT" "$W"
phases=${*:-"unit images checks recorder capture hidden history tools dhooks dhooks-run leak collect"}
has() { case " $phases " in *" $1 "*) return 0 ;; esac; return 1; }
docker_phase() { for p in images checks recorder capture hidden history tools dhooks dhooks-run leak; do has $p && return 0; done; return 1; }
free_g() { free -g | awk '/^Mem:/{print $7}'; }
need_mem() { m=$(free_g); if [ "$m" -lt 6 ]; then echo "free memory ${m}G < 6G: not starting $1"; exit 1; fi; }
# Docker's store is inside the WSL disk: stop before it fills the drive that holds it (2026-11-13:
# the host's system drive reached 0 bytes and WSL stopped).
need_disk() { a=$(df -BG --output=avail / | tail -1 | tr -dc 0-9); if [ "${a:-0}" -lt "${G4_MIN_DISK_G:-20}" ]; then echo "less than ${G4_MIN_DISK_G:-20}G free on the WSL disk (${a}G): not starting $1"; exit 1; fi; }
# one docker job at a time on this host
if docker_phase; then source experiments/heavy-lock.sh exp48-g4; fi

# One phase in a fresh container: no network, the memory limit of the runs, inputs read-only.
run() { # sample kind phase [extra docker args...]
  s=$1; k=$2; p=$3; shift 3
  need_mem "$s $k $p"; need_disk "$s $k $p"
  mkdir -p "$W/out"
  docker run --rm --network none --memory "$MEM" --memory-swap "$MEM" -e G4_HARNESS_RE="$HRE" -e G4_ISSUE="$(pointer $s issue)" -e G4_PR="$(pointer $s pr)" \
    -v "$W/g4:/g4:ro" -v "$W/$s/tests:/tests:ro" -v "$W/$s/solution:/solution:ro" -v "$W/out:/out" "$@" \
    "pitwall/realrepo-tree:$s-$k" /opt/pitwall/node/bin/node /g4/g4-in-image.mjs "$p" "/out/$s-$k-$p.json" 2>&1 | tail -3
  cp "$W/out/$s-$k-$p.json"* "$OUT/" 2>/dev/null || echo "NO RESULT for $s $k $p"
}
pointer() { node -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(String(t[process.argv[2]]??""))' "experiments/exp48/samples/$1.json" "$2"; }
HRE=$(node -e '
  const h = JSON.parse(require("fs").readFileSync("experiments/exp48/harness-files.json", "utf8")).remove;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (m) => "\\" + m);
  console.log(h.map(({ pattern: p }) => p.startsWith("**/") ? "(^|/)" + esc(p.slice(3)) + "$" : p.endsWith("/") ? "^" + esc(p) : "^" + esc(p) + "$").join("|"))')

if has unit; then
  # The unit tests of the instruments and of everything else (the earlier tests must stay green).
  node --test packages/pit-wall/test/*.test.mjs > "$OUT/unit.txt" 2>&1; echo "exit=$?" >> "$OUT/unit.txt"
  grep -E '^ℹ (tests|pass|fail)|^exit=' "$OUT/unit.txt"
fi

if has images; then
  need_disk images
  [ -f "$L/gq-filtered.git/filter-repo/commit-map" ] || { echo "no filtered history mirror: run experiments/exp48/build-history-mirror.sh"; exit 1; }
  node experiments/exp48/materialise.mjs contexts $(for s in $SAMPLES; do echo experiments/exp48/samples/$s.json; done) \
    --gh "$L/cache" --jq "$L/tools/jq" --graphify "$GRAPHIFY" --default-node 22.23.2 > "$OUT/contexts.jsonl" || exit 1
  REBUILD=${REBUILD:-1} bash experiments/exp48/build-images.sh $SAMPLES || exit 1
fi

if docker_phase; then
  rm -rf "$W/g4"; mkdir -p "$W/g4"; cp experiments/exp48/g4-in-image.mjs "$W/g4/"
  for s in $SAMPLES; do
    node experiments/exp48/materialise.mjs arm experiments/exp48/samples/$s.json A --script reference > /dev/null || exit 1
    rm -rf "$W/$s"; mkdir -p "$W/$s"
    cp -r "$L/harbor/A-reference/harbor-tasks/$s/tests" "$W/$s/tests"
    cp -r "$L/harbor/A-reference/harbor-tasks/$s/solution" "$W/$s/solution"
    # the image itself has no /tests: checked without the mount
    docker run --rm "pitwall/realrepo-tree:$s-abc" bash -c 'test -e /tests && echo present || echo absent' > "$OUT/$s-tests-in-image.txt"
  done
fi

for s in $SAMPLES; do
  if has checks; then
    run $s abc checks -e G4_CHECKS="${G4_CHECKS_ABC:-vitest-related,vitest,svelte-check,tsc,biome,eslint}"
    run $s d checks -e G4_CHECKS="${G4_CHECKS_D:-vitest-related,vitest,svelte-check,biome}"
  fi
  if has recorder; then run $s abc recorder; fi
  if has capture; then run $s abc capture; fi
  if has hidden; then
    for k in abc d; do run $s $k hidden; run $s $k reference; done
  fi
  if has history; then for k in abc d; do run $s $k history; done; fi
  if has tools; then for k in abc d; do run $s $k tools; done; fi
  if has dhooks; then run $s d dhooks; fi
  if has dhooks-run; then run $s d dhooks-run; fi
  if has leak; then run $s abc leak -e G4_TESTS_ABSENT="$(cat "$OUT/$s-tests-in-image.txt" 2>/dev/null)"; fi
done

if has collect; then node experiments/exp48/g4-collect.mjs; fi
