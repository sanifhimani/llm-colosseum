import { ClaudeAgent } from './claude.js';
import { GPTAgent } from './gpt.js';
import { GeminiAgent } from './gemini.js';
import { GrokAgent } from './grok.js';
import { MockAgent } from './mock.js';

const PROVIDERS = {
  anthropic: ClaudeAgent,
  openai: GPTAgent,
  google: GeminiAgent,
  xai: GrokAgent,
  mock: MockAgent,
};

export function createAgent(config) {
  const AgentClass = PROVIDERS[config.provider];
  if (!AgentClass) {
    throw new Error(`Unknown provider: ${config.provider}`);
  }
  return new AgentClass(config);
}

export function createAgentsFromRoster(roster, { useMock = false } = {}) {
  return roster.map((entry) => {
    if (useMock) {
      return new MockAgent(entry);
    }
    return createAgent(entry);
  });
}
