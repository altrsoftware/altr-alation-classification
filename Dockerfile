FROM node:16-alpine3.16

RUN apk add --no-cache tini

ENV NODE_ENV production

USER node

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

CMD ["tini", "node", "index.js"]