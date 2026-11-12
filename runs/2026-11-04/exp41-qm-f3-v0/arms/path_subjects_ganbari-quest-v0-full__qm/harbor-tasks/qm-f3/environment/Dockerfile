FROM pitwall/agent-claude-code:latest
COPY gh /usr/local/bin/gh
COPY pitwall-mark-run /usr/local/bin/pitwall-mark-run
COPY pitwall-ran-on-final /usr/local/bin/pitwall-ran-on-final
COPY fixture/ /fixture/
RUN chmod 755 /usr/local/bin/gh /usr/local/bin/pitwall-mark-run /usr/local/bin/pitwall-ran-on-final && bash /fixture/build.sh && rm -rf /fixture \
 && git config --system user.name agent && git config --system user.email agent@example.com
COPY harness-agents/ /app/.claude/agents/
RUN echo ".claude/" >> /app/.git/info/exclude
COPY harness-workspace/ /app/
RUN printf '%s\n' 'docs/sessions/README.md' 'docs/sessions/branch-strategy.md' 'docs/sessions/dev-process/README.md' 'docs/sessions/dev-process/anti-patterns.md' 'docs/sessions/dev-process/completion-principles.md' 'docs/sessions/dev-process/feature-change-lateral-spread.md' 'docs/sessions/dev-process/github-api-head-staleness.md' 'docs/sessions/dev-process/parallel-agent-ops.md' 'docs/sessions/dev-process/qm-fix-patterns.md' 'docs/sessions/dev-process/research-discipline.md' 'docs/sessions/dev-session.md' 'docs/sessions/label-mailbox.md' >> /app/.git/info/exclude
WORKDIR /app
