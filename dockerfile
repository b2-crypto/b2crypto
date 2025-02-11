
FROM public.ecr.aws/docker/library/fedora:latest AS base
WORKDIR /app
COPY ./package*.json ./
RUN dnf install python3 -y
RUN dnf install python3-pip -y
RUN dnf install make -y
RUN dnf install gcc -y
RUN dnf install g++ -y
RUN dnf install nodejs -y
RUN npm install -g pnpm@^9.15.5
RUN pnpm config set store-dir .pnpm-store

FROM base AS deps-dev
RUN pnpm install

FROM base AS deps
RUN pnpm install --production

FROM deps-dev AS build
WORKDIR /app
COPY . .
RUN pnpm run build

FROM public.ecr.aws/docker/library/node:20.17.0-alpine3.20
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.pnpm-store ./.pnpm-store
COPY --from=build /app/dist/apps/b2crypto ./dist/apps/b2crypto
COPY --from=build /app/package*.json ./
COPY --from=build /app/sftp ./sftp
COPY --from=build /app/libs/message/src/templates ./libs/message/src/templates
RUN apk add --update curl

ENV ENVIRONMENT=""
ENV APP_NAME=""
ENV APP_VERSION=""
ENV STACK=""
ENV GOOGLE_2FA=false
ENV PORT=3000

ENV DATABASE_NAME=""
ENV DATABASE_URL=""

ENV RABBIT_MQ_HOST=""
ENV RABBIT_MQ_PORT=""
ENV RABBIT_MQ_QUEUE=""
ENV RABBIT_MQ_USERNAME=""
ENV RABBIT_MQ_PASSWORD=""

ENV REDIS_HOST=""
ENV REDIS_USERNAME=""
ENV REDIS_PASSWORD=""
ENV REDIS_PORT=""

ENV CACHE_TTL=10
ENV CACHE_MAX_ITEMS=5

ENV AUTH_MAX_SECONDS_TO_REFRESH=60
ENV AUTH_SECRET=""
ENV AUTH_EXPIRE_IN=8h
ENV OTP_VALIDATION_TIME_SECONDS=120
ENV API_KEY_EMAIL_APP=""
ENV URL_API_EMAIL_APP=""

ENV TESTING=true
ENV TZ='UTC'

ENV AWS_SES_FROM_DEFAULT=""
ENV AWS_SES_HOST=""
ENV AWS_SES_PORT=""
ENV AWS_SES_USERNAME=""
ENV AWS_SES_PASSWORD=""

ENV DEFAULT_CURRENCY_CONVERSION_COIN="USD"

ENV AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE=0.1

ENV POMELO_SIGNATURE_SECRET_KEY_DIC=""
ENV POMELO_WHITELISTED_IPS_CHECK="OFF"
ENV POMELO_WHITELISTED_IPS=""
ENV POMELO_CLIENT_ID=""
ENV POMELO_SECRET_ID=""
ENV POMELO_AUDIENCE=""
ENV POMELO_AUTH_GRANT_TYPE=""
ENV POMELO_API_URL=""

ENV CURRENCY_CONVERSION_API_KEY=""
ENV CURRENCY_CONVERSION_API_URL=""

ENV V1_DB_USER=""
ENV V1_DB_PWD=""
ENV V1_DB_HOST=""
ENV V1_DB_PORT=
ENV V1_DB_NAME=""

ENV POMELO_SFTP_HOST=""
ENV POMELO_SFTP_PORT=""
ENV POMELO_SFTP_USR=""
ENV POMELO_SFTP_PASSPHRASE=""

ENV LOGO_URL=""
ENV SOCIAL_MEDIA_ICONS=""
ENV SOCIAL_MEDIA_LINKS=""

ENV OTLP_HOST=""
ENV OTLP_API_KEY=""

ENTRYPOINT [ "node", "./dist/apps/b2crypto/main.js" ]
CMD [""]