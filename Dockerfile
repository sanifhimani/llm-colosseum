FROM oven/bun:1-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY engine/package.json engine/bun.lock engine/
RUN cd engine && bun install --frozen-lockfile --production

COPY engine/ engine/
COPY data/ data/

WORKDIR /app/engine

EXPOSE 8080

CMD ["bun", "run", "index.js"]
