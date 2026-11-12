#!/bin/bash
# Stage 4 of the E series (design 23 §3.3 "defects"): teacher-forced log-probabilities need a
# local LM that scores a given text (ollama only reports logprobs of generated tokens). This
# installs llama-cpp-python into a user venv (CPU wheel from the project's index; no payment,
# no system packages). The GGUF is ollama's own blob (qwen3:8b), read in place.
# Usage (WSL): bash -l experiments/setup/install-llama-cpp.sh
set -u -o pipefail
V=~/.local/pit-wall-venv
python3 -m venv "$V" 2>/dev/null || { echo "python3 -m venv failed (apt install python3-venv?)"; exit 2; }
"$V/bin/pip" install --quiet --upgrade pip
"$V/bin/pip" install --quiet llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu && echo "llama-cpp-python installed (CPU wheel)" || { echo "wheel install failed; trying a source build (slow)"; CMAKE_ARGS="-DGGML_CUDA=off" "$V/bin/pip" install --quiet llama-cpp-python; }
"$V/bin/python" -c "import llama_cpp; print('llama_cpp', llama_cpp.__version__)"
# ollama's blob for qwen3:8b (the GGUF layer of the manifest)
M=~/.local/ollama/models/manifests/registry.ollama.ai/library/qwen3/8b
B=$(python3 -c "import json,sys; m=json.load(open('$M')); print([l['digest'] for l in m['layers'] if l['mediaType'].endswith('image.model')][0].replace('sha256:','sha256-'))")
ls -la ~/.local/ollama/models/blobs/$B && echo "GGUF: ~/.local/ollama/models/blobs/$B"
