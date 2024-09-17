FROM public.ecr.aws/docker/library/node:lts-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN apk update && apk add tree && apk add grep && apk add findutils
RUN tree -fi | grep -P "(\.env)([.].*)*\$" | xargs -d"\n" rm
RUN tree -fi | grep -P "(dockerfile|Dockerfile|\.dockerignore|docker-compose).*\$" | xargs -d"\n" rm
RUN npm run build

FROM public.ecr.aws/docker/library/node:lts-alpine AS deploy
WORKDIR /app
COPY --from=build /app/dist/apps/b2crypto ./
COPY --from=build /app/package*.json ./
COPY --from=build /app/sftp /app/sftp
RUN npm ci --only=production
RUN apk update && apk add tree && apk add grep && apk add findutils
RUN tree -fi | grep -P "(dockerfile|Dockerfile|\.dockerignore|docker-compose).*\$" | xargs -d"\n" rm

ENV ENVIRONMENT=""
ENV APP_NAME=""
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
ENV OTP_VALIDATION_TIME_SECONDS=90
ENV AUTH_SECRET=""
ENV AUTH_EXPIRE_IN=8h
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

ENV POMELO_SFTP_HOST=""
ENV POMELO_SFTP_PORT=""
ENV POMELO_SFTP_USR=""
ENV POMELO_SFTP_PASSPHRASE=""

EXPOSE 3000
ENTRYPOINT [ "node", "main.js" ]
CMD [""]