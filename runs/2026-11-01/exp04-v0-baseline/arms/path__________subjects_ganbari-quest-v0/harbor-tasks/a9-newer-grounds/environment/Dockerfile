FROM pitwall/agent-claude-code:latest
COPY gh /usr/local/bin/gh
COPY fixture/ /fixture/
RUN chmod 755 /usr/local/bin/gh && bash /fixture/build.sh && rm -rf /fixture \
 && git config --system user.name agent && git config --system user.email agent@example.com
COPY harness-agents/ /app/.claude/agents/
RUN echo ".claude/" >> /app/.git/info/exclude
WORKDIR /app
