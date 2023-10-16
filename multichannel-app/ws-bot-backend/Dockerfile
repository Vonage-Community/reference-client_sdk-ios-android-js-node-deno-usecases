FROM node:18-alpine AS build_base
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install turbo --global

FROM build_base AS builder

COPY . .
RUN turbo prune ws-bot-backend --docker

FROM build_base AS installer

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./
RUN npm ci

COPY --from=builder /app/out/full .
COPY turbo.json turbo.json

RUN turbo run build --filter ws-bot-backend...

FROM node:18-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 ws-bot-backend
RUN adduser --system  --uid 1001 ws-bot-backend
USER ws-bot-backend
COPY --from=installer /app .

CMD ["node", "multichannel-app/ws-bot-backend/dist/index.js"]