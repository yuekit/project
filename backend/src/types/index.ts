import { z } from 'zod';

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  attributes: z.record(z.string(), z.number()).default({}),
  inventory: z.array(z.string()).default([])
});

export type Character = z.infer<typeof CharacterSchema>;

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  connections: z.array(z.string()).default([])
});

export type Location = z.infer<typeof LocationSchema>;

export const QuestFlagSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['locked', 'active', 'completed', 'failed']).default('locked')
});

export type QuestFlag = z.infer<typeof QuestFlagSchema>;

export const WorldStateSchema = z.object({
  sessionId: z.string(),
  characters: z.record(z.string(), CharacterSchema),
  locations: z.record(z.string(), LocationSchema),
  questFlags: z.record(z.string(), QuestFlagSchema),
  inventory: z.array(z.string()).default([]),
  transcript: z.array(
    z.object({
      role: z.enum(['player', 'narrator', 'system']),
      content: z.string(),
      createdAt: z.date().or(z.string())
    })
  )
});

export type WorldState = z.infer<typeof WorldStateSchema>;

export const ActionSchema = z.object({
  sessionId: z.string(),
  playerInput: z.string().min(1),
  timestamp: z.date().or(z.string()).optional()
});

export type PlayerAction = z.infer<typeof ActionSchema>;

export const NarrativeChunkSchema = z.object({
  text: z.string(),
  media: z.array(
    z.object({
      type: z.enum(['image', 'audio']),
      url: z.string(),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional()
    })
  ).default([]),
  stateDiff: z.record(z.string(), z.any()).optional()
});

export type NarrativeChunk = z.infer<typeof NarrativeChunkSchema>;
