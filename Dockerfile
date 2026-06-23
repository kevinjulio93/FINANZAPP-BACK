FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

RUN corepack enable && corepack prepare pnpm@10 --activate && \
    pnpm rebuild && \
    pnpm prune --prod

EXPOSE 4000

CMD ["node", "dist/index.js"]

CMD ["node", "dist/index.js"]
