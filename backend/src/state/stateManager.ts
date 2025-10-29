import crypto from 'node:crypto';

import { ActionSchema, NarrativeChunk, PlayerAction, WorldState, WorldStateSchema } from '../types/index.js';

export class StateManager {
  private states = new Map<string, WorldState>();

  createSession(seed?: Partial<WorldState>): WorldState {
    const sessionId = seed?.sessionId ?? crypto.randomUUID();
    const baseState: WorldState = WorldStateSchema.parse({
      sessionId,
      characters: seed?.characters ?? {},
      locations: seed?.locations ?? {},
      questFlags: seed?.questFlags ?? {},
      inventory: seed?.inventory ?? [],
      transcript: seed?.transcript ?? []
    });

    this.states.set(sessionId, baseState);
    return baseState;
  }

  listSessionIds(): string[] {
    return Array.from(this.states.keys());
  }

  getState(sessionId: string): WorldState | undefined {
    return this.states.get(sessionId);
  }

  appendTranscript(sessionId: string, role: 'player' | 'narrator' | 'system', content: string) {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Unknown session ${sessionId}`);
    }

    state.transcript.push({
      role,
      content,
      createdAt: new Date().toISOString()
    });

    this.states.set(sessionId, state);
  }

  applyNarrative(sessionId: string, chunk: NarrativeChunk) {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Unknown session ${sessionId}`);
    }

    if (chunk.stateDiff) {
      Object.assign(state, chunk.stateDiff);
    }

    if (chunk.text.trim().length > 0) {
      this.appendTranscript(sessionId, 'narrator', chunk.text);
    }
  }

  validateAction(action: PlayerAction) {
    return ActionSchema.parse(action);
  }
}

export const stateManager = new StateManager();
