FROM docker.1ms.run/jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    curl \
    ca-certificates \
    python3 \
    docker-cli \
    docker.io \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://nodejs.org/dist/v20.19.5/node-v20.19.5-linux-x64.tar.gz -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /opt \
    && ln -s /opt/node-v20.19.5-linux-x64 /opt/node \
    && ln -sf /opt/node/bin/node /usr/local/bin/node \
    && ln -sf /opt/node/bin/npm /usr/local/bin/npm \
    && ln -sf /opt/node/bin/npx /usr/local/bin/npx \
    && rm -f /tmp/node.tar.gz

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm install -g playwright@1.58.2 @playwright/test@1.58.2 \
    && npx playwright install --with-deps chromium \
    && npm cache clean --force

COPY docker/jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
COPY docker/jenkins/init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

USER jenkins
