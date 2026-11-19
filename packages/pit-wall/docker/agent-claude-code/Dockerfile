# pit-wall agent image: Claude Code
#
# Base image for every Harbor task that pit-wall runs with the claude-code agent.
# Installing Claude Code once here, instead of in every trial, removes several minutes
# of setup per run, and fixes the version for the whole image.
#
# Build it with `pit-wall image build claude-code [--claude-version X.Y.Z]`.
# The image is built locally from Anthropic's official installer. Claude Code is
# distributed under Anthropic's terms, so do not push this image to a public registry.

ARG UBUNTU_VERSION=24.04
FROM ubuntu:${UBUNTU_VERSION}

# What every pit-wall task expects: git (fixtures are a git repo), certificates and
# curl for the installer, procps because Harbor checks for it.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates curl procps \
 && rm -rf /var/lib/apt/lists/*

# "latest", "stable", or an exact version such as 2.1.314.
ARG CLAUDE_CODE_VERSION=latest
# Install to /usr/local/bin so the binary is on PATH for any user Harbor runs as,
# and Harbor's install check (`command -v claude`) skips its own installation.
RUN curl -fsSL https://claude.ai/install.sh | bash -s -- "${CLAUDE_CODE_VERSION}" \
 && cp -L /root/.local/bin/claude /usr/local/bin/claude \
 && rm -rf /root/.local/share/claude /root/.local/bin/claude \
 && claude --version

# The version must not drift during a run.
ENV DISABLE_AUTOUPDATER=1

LABEL org.opencontainers.image.title="pit-wall agent: claude-code" \
      dev.pitwall.agent="claude-code"
