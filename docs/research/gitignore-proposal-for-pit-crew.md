# Proposal: .gitignore for E:/Github/pit-crew (not applied)

Current local .gitignore has 4 lines (evals/results/, **/evals/results/, node_modules/, pitwall-out/). Proposed replacement = the public repo's .gitignore below. Root-anchored scratch rules (/tmp/, /.dev-state.md) are deliberate: runs/**/fixture/000/.dev-state.md files are committed evidence and must not be ignored. Also recommend: git config core.longpaths true (run session paths exceed 260 chars on Windows).

```gitignore
# --- dependencies / build output ---
node_modules/
*.tsbuildinfo

# --- pit-wall working output (conclusions are moved into runs/<date>/ before commit) ---
pitwall-out/
evals/results/
**/evals/results/

# --- scratch / local state (anchored at the root so fixtures under runs/ and suites/ are not affected) ---
/tmp/
/scratch/
/scratchpad/
/.scratch/
/.dev-state.md
/packages/*/tmp/

# --- local caches ---
.cache/
.npm/
.eslintcache
.pytest_cache/
__pycache__/
*.pyc

# --- large binaries / archives / model weights ---
*.tgz
*.tar.gz
*.zst
*.zip
*.safetensors
*.gguf
*.ckpt
*.pt
*.onnx

# --- secrets (never commit) ---
.env
.env.*
!.env.example
*.pem
*.key
oauth-token

# --- OS / editor ---
.DS_Store
Thumbs.db
desktop.ini
*.swp
*.swo
*~
.idea/
.vscode/
```
