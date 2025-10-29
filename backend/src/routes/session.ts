import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { ConsistencyEngine } from '../orchestration/consistencyEngine.js';
import { PromptBuilder } from '../orchestration/promptBuilder.js';
import { ToolRouter } from '../orchestration/toolRouter.js';
import { LLMService } from '../services/llmService.js';
import { MediaService } from '../services/mediaService.js';
import { stateManager } from '../state/stateManager.js';
import { ActionSchema } from '../types/index.js';

const mockLLMClient = {
  async generate() {
    return {
      chunk: {
        text: 'The AI narrator continues the tale, awaiting further input.',
        media: [],
        stateDiff: undefined
      },
      toolCalls: []
    };
  }
};

const mockMediaClient = {
  async generateImage(payload: Record<string, unknown>) {
    return {
      type: 'image' as const,
      url: `https://example.com/generated-image?prompt=${encodeURIComponent(String(payload.prompt ?? ''))}`,
      description: String(payload.prompt ?? 'Generated artwork')
    };
  },
  async generateAudio(payload: Record<string, unknown>) {
    return {
      type: 'audio' as const,
      url: `https://example.com/generated-audio?mood=${encodeURIComponent(String(payload.mood ?? 'mystery'))}`,
      description: String(payload.mood ?? 'Ambient audio')
    };
  }
};

const promptBuilder = new PromptBuilder(
  `You are an imaginative game master who collaborates with the player to tell cinematic, emotionally rich stories.
Follow established continuity and respect the structured world state. Use tool calls to request media or update mechanics when needed.`
);

const llmService = new LLMService(mockLLMClient);
const mediaService = new MediaService(mockMediaClient);
const toolRouter = new ToolRouter(mediaService, llmService);
const consistencyEngine = new ConsistencyEngine();

export const registerSessionRoutes = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.get('/', async () => ({ sessions: stateManager.listSessionIds() }));

  fastify.post('/', async () => {
    const state = stateManager.createSession();
    stateManager.appendTranscript(state.sessionId, 'system', 'Session initialized.');
    return state;
  });

  fastify.get('/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const state = stateManager.getState(sessionId);
    if (!state) {
      return reply.status(404).send({ message: 'Session not found' });
    }
    return state;
  });

  fastify.post('/:sessionId/actions', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const state = stateManager.getState(sessionId);
    if (!state) {
      return reply.status(404).send({ message: 'Session not found' });
    }

    const parsed = ActionSchema.safeParse({
      sessionId,
      ...(request.body as Record<string, unknown>)
    });

    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid action payload', issues: parsed.error.issues });
    }

    const action = parsed.data;
    stateManager.appendTranscript(sessionId, 'player', action.playerInput);

    const prompt = promptBuilder.buildPrompt(action, state);
    const llmResponse = await llmService.generateNarrative(prompt);

    const toolOutputs = await toolRouter.handleToolCalls(sessionId, llmResponse.toolCalls);
    const combinedChunk = {
      text: llmResponse.chunk.text,
      media: [...(llmResponse.chunk.media ?? []), ...toolOutputs.flatMap((item) => item.media ?? [])],
      stateDiff: llmResponse.chunk.stateDiff
    };

    const issues = consistencyEngine.validate(combinedChunk);
    if (issues.length > 0) {
      fastify.log.warn({ sessionId, issues }, 'Consistency issues detected');
    }

    stateManager.applyNarrative(sessionId, combinedChunk);

    return { chunk: combinedChunk, issues };
  });

  fastify.get('/:sessionId/stream', { websocket: true }, (connection, req) => {
    const { sessionId } = req.params as { sessionId: string };
    const state = stateManager.getState(sessionId);
    if (!state) {
      connection.socket.send(
        JSON.stringify({ type: 'error', message: 'Session not found. Create a session first.' })
      );
      connection.socket.close();
      return;
    }

    connection.socket.send(JSON.stringify({ type: 'transcript', transcript: state.transcript }));
  });
};
