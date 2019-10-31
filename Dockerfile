FROM node:12-alpine

RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

COPY bin /usr/local/bin
COPY src /app
