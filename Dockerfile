FROM oven/bun:1-alpine

RUN apk add --no-cache git

WORKDIR /app

# Install and build frontend
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY index.html vite.config.js tailwind.config.* postcss.config.* ./
COPY src/ src/
COPY public/ public/
RUN bun run build

# Install engine deps
COPY engine/package.json engine/bun.lock engine/
RUN cd engine && bun install --frozen-lockfile --production

COPY engine/ engine/
COPY data/ data/

WORKDIR /app/engine

EXPOSE 8080

CMD ["bun", "run", "index.js"]
