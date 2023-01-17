FROM node:18-alpine AS builder

ADD . /app

WORKDIR /app

RUN npm ci

RUN npm run build

FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

ADD . /app

COPY --from=builder /app/dist /app/dist

RUN npm ci

ENTRYPOINT ["/app/entrypoint.sh"]
