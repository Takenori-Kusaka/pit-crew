FROM ubuntu:24.04
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
COPY gh /usr/local/bin/gh
COPY workspace/ /app/
WORKDIR /app
RUN chmod 755 /usr/local/bin/gh && git init -q . && git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
