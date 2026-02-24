import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAgent } from './base.js';

export class GeminiAgent extends BaseAgent {
  constructor(config) {
    super(config);
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }

  async call(prompt, { timeout = 15000 } = {}) {
    const start = Date.now();
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 128 },
      },
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }, { signal: controller.signal });

      const response = result.response;
      const text = response.text();
      if (!text) throw new Error('Empty response from Google AI API');

      return {
        text,
        usage: {
          input: response.usageMetadata?.promptTokenCount || 0,
          output: response.usageMetadata?.candidatesTokenCount || 0,
        },
        latencyMs: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
