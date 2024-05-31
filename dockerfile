FROM node:16.18.1-alpine AS dev

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --force

COPY . .

FROM node:16.18.1-alpine as prod

ARG NODE_ENV=prod
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --force --only=prod

COPY . .

RUN nest build b2crypto-gateway

COPY --from=dev /usr/src/app/dist ./dist

#CMD ["node", "dist/apps/b2crypto/main.gateway.js"]