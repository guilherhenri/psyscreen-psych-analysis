FROM node:22-alpine AS builder

WORKDIR /api

RUN npm install -g pnpm@10.22.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prefer-offline

COPY . .

RUN pnpm run build

FROM node:22-alpine AS migrator

WORKDIR /api

RUN npm install -g pnpm@10.22.0

COPY --from=builder /api/dist dist
COPY --from=builder /api/package.json .
COPY --from=builder /api/pnpm-lock.yaml .

RUN pnpm install --frozen-lockfile --prefer-offline

CMD ["pnpm", "migration:run:prod"]

FROM node:22-alpine AS runner

WORKDIR /api

RUN npm install -g pnpm@10.22.0

COPY --from=builder /api/dist dist
COPY --from=builder /api/package.json .
COPY --from=builder /api/pnpm-lock.yaml .

RUN pnpm install --prod --frozen-lockfile --prefer-offline --ignore-scripts

ENV KAFKA_BROKER=localhost:9092

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const [h,p]=process.env.KAFKA_BROKER.split(':');require('net').connect(p,h).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" || exit 1

CMD ["node", "dist/infra/main.js"]
