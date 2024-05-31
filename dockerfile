FROM node:16.18.1-alpine

ARG NODE_ENV=prod
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

#RUN npm install --force --only=prod
#RUN npm install --force
RUN export $(cat .env.prod) && npm install --force

COPY . .

RUN npm run build-gateway

#COPY --from=dev /usr/src/app/dist ./dist

CMD export $(cat .env) && npm run start-gateway
#CMD ["node", "dist/apps/b2crypto/main.gateway.js"]