import { NarrativeChunk } from '../types/index.js';
import { MediaService } from '../services/mediaService.js';
import { LLMService } from '../services/llmService.js';
import { stateManager } from '../state/stateManager.js';

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export class ToolRouter {
  constructor(private readonly mediaService: MediaService, private readonly llmService: LLMService) {}

  async handleToolCalls(sessionId: string, toolCalls: ToolCall[]): Promise<NarrativeChunk[]> {
    const outputs: NarrativeChunk[] = [];

    for (const call of toolCalls) {
      switch (call.name) {
        case 'update_state': {
          const diff = call.arguments?.diff as Record<string, unknown>;
          stateManager.applyNarrative(sessionId, { text: '', media: [], stateDiff: diff });
          break;
        }
        case 'generate_image': {
          const image = await this.mediaService.generateImage(call.arguments);
          outputs.push({
            text: '',
            media: [image]
          });
          break;
        }
        case 'generate_audio': {
          const audio = await this.mediaService.generateAudio(call.arguments);
          outputs.push({
            text: '',
            media: [audio]
          });
          break;
        }
        case 'summarize_transcript': {
          const state = stateManager.getState(sessionId);
          if (!state) break;
          const summary = await this.llmService.summarizeTranscript(state.transcript);
          outputs.push({ text: summary, media: [] });
          break;
        }
        default:
          outputs.push({
            text: `Unhandled tool call: ${call.name}`,
            media: []
          });
      }
    }

    return outputs;
  }
}
