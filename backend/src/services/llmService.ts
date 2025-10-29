import { PromptBundle } from '../orchestration/promptBuilder.js';
import { NarrativeChunk } from '../types/index.js';

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface LLMResponse {
  chunk: NarrativeChunk;
  toolCalls: ToolCall[];
}

export class LLMService {
  constructor(private readonly client: { generate: (prompt: PromptBundle) => Promise<LLMResponse> }) {}

  async generateNarrative(prompt: PromptBundle): Promise<LLMResponse> {
    return this.client.generate(prompt);
  }

  async summarizeTranscript(
    transcript: Array<{ role: string; content: string }>
  ): Promise<string> {
    const summaryPrompt: PromptBundle = {
      systemPrompt: 'Summarize the following role-playing transcript in 3 sentences.',
      messages: [
        {
          role: 'user',
          content: transcript.map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`).join('\n')
        }
      ]
    };

    const response = await this.client.generate(summaryPrompt);
    return response.chunk.text;
  }
}
