FROM pitwall/agent-claude-code:latest
COPY gh /usr/local/bin/gh
COPY fixture/ /fixture/
RUN chmod 755 /usr/local/bin/gh && bash /fixture/build.sh && rm -rf /fixture \
 && git config --system user.name agent && git config --system user.email agent@example.com
ENV CLAUDE_CODE_AUTO_COMPACT_WINDOW="100000"
ENV CLAUDE_AUTOCOMPACT_PCT_OVERRIDE="50"
WORKDIR /app
