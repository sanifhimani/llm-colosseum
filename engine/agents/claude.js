import Anthropic from '@anthropic-ai/sdk';
import { BaseAgent } from './base.js';

export class ClaudeAgent extends BaseAgent {
  constructor(config) {
    super(config);
    this.client = new Anthropic();
  }

  async call(prompt, { timeout = 15000, maxTokens = 150 } = {}) {
    const start = Date.now();
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }, { timeout });

    const text = response.content?.[0]?.text;
    if (!text) throw new Error('Empty response from Anthropic API');

    return {
      text,
      usage: {
        input: response.usage?.input_tokens || 0,
        output: response.usage?.output_tokens || 0,
      },
      latencyMs: Date.now() - start,
    };
  }
}
