#!/bin/bash
cd /tmp/hb/smoke
printf 'Create a file named hello.txt containing hi.\n' > instruction.md
printf '#!/bin/bash\necho hi > /app/hello.txt\n' > solution/solve.sh
cat > tests/test.sh <<'T'
#!/bin/bash
mkdir -p /logs/verifier
echo 1 > /logs/verifier/reward.txt
T
sed -i 's/environment_mode = "separate"/environment_mode = "shared"/' task.toml
rm -f tests/Dockerfile
cd /tmp/hb && timeout 900 harbor run --help 2>&1 | grep -E "^\s*│\s+--(path|agent|task|jobs-dir|env|ae|agent-env|n-attempts|model)" | head -20
timeout 900 harbor run -p /tmp/hb/smoke -a oracle -o /tmp/hb/jobs 2>&1 | tail -25
