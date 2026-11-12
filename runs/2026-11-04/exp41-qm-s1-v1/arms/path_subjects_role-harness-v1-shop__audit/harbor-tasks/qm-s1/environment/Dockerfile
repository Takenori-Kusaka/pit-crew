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
RUN printf '%s\n' '.claude/CLAUDE.md' '.claude/HARNESS-ADAPTER.md' >> /app/.git/info/exclude
WORKDIR /app
