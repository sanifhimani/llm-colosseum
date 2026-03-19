FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json bun.lock ./
RUN npm install
COPY index.html vite.config.js tailwind.config.* postcss.config.* ./
COPY src/ src/
COPY public/ public/
RUN npx vite build

FROM oven/bun:1-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY --from=frontend /app/dist dist/

COPY engine/package.json engine/bun.lock engine/
RUN cd engine && bun install --frozen-lockfile --production

COPY engine/ engine/
COPY data/ data/

WORKDIR /app/engine

EXPOSE 8080

CMD ["bun", "run", "index.js"]
