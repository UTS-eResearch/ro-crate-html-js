FROM node:latest


COPY . /app

WORKDIR /app


RUN npm install

RUN npm link

RUN mkdir /data

ENTRYPOINT ["/usr/local/bin/rochtml"]

