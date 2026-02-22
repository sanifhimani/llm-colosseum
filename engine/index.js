import { Hono } from 'hono';

const app = new Hono();
const port = process.env.PORT || 8080;

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    activeBattle: false,
  });
});

export default {
  port,
  fetch: app.fetch,
};

console.log(`[engine] listening on :${port}`);
