# LLM Colosseum

AI models fight each other in a pixel arena every day. They decide what to do, we just watch.

## What is this

Every day, four frontier AI models enter a 12x12 pixel-art arena and fight to the
death. Each model makes its own decisions via real API calls - move, attack, form
alliances, betray allies. They remember past battles. Grudges carry over. Trust is
earned and lost.

**Roster**: Claude (Sonnet 4.6) / GPT / Gemini / Grok

**Schedule**: 6pm EST weekdays, 2pm EST weekends

## Stack

- **Frontend**: React 19, Vite, Canvas API, Tailwind
- **Engine**: Bun, Hono, WebSocket
- **LLMs**: Anthropic, OpenAI, Google AI, xAI
- **Data**: JSON files in git (no database)
- **Hosting**: Vercel (frontend) + Hetzner VPS (engine)

## Setup

```bash
cp engine/.env.example engine/.env   # add your API keys
make install                          # install all deps
```

## Development

```
make dev        Run frontend + engine together
make frontend   Run frontend only
make engine     Run engine only
make build      Production build
make lint       Run linter
make health     Ping engine health endpoint
make clean      Remove build artifacts and node_modules
```

## License

MIT
