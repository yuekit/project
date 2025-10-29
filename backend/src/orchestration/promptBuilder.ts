import { PlayerAction, WorldState } from '../types/index.js';

export interface PromptBundle {
  systemPrompt: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

export class PromptBuilder {
  constructor(private readonly baseSystemPrompt: string) {}

  buildPrompt(action: PlayerAction, state: WorldState): PromptBundle {
    const systemPrompt = `${this.baseSystemPrompt}\nWorld State: ${JSON.stringify({
      characters: state.characters,
      locations: state.locations,
      questFlags: state.questFlags,
      inventory: state.inventory
    })}`;

    const history = state.transcript.slice(-10).map((entry) => ({
      role: entry.role === 'narrator' ? 'assistant' : entry.role === 'player' ? 'user' : 'system',
      content: entry.content
    }));

    const userMessage = { role: 'user' as const, content: action.playerInput };

    return {
      systemPrompt,
      messages: [{ role: 'system', content: systemPrompt }, ...history, userMessage]
    };
  }
}
