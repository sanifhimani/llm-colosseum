import OpenAI from 'openai';
import { BaseAgent } from './base.js';

export class GPTAgent extends BaseAgent {
  constructor(config) {
    super(config);
    this.client = new OpenAI();
  }

  async call(prompt, { timeout = 15000, maxTokens = 150 } = {}) {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }, { timeout });

    const text = response.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI API');

    return {
      text,
      usage: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
      latencyMs: Date.now() - start,
    };
  }
}
