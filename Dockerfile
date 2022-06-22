# Dockerfile for ro-crate-html-js
# https://github.com/UTS-eResearch/ro-crate-html-js
# License GNU GPLv3
# Copyright (C) 2022  University of Technology Sydney
FROM node:18-alpine

ENV NODE_ENV=production

# this will be the mounted folder in host
RUN mkdir /data

WORKDIR /home/node/app

RUN chown node:node /home/node/app /data

USER node

COPY --chown=node:node . .

RUN npm config set prefix=/home/node && npm ci && npm install -g

ENTRYPOINT ["/home/node/bin/rochtml"]
