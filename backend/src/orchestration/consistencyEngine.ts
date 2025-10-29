import { NarrativeChunk } from '../types/index.js';

interface ConsistencyIssue {
  type: 'safety' | 'continuity' | 'moderation';
  message: string;
}

export class ConsistencyEngine {
  validate(chunk: NarrativeChunk): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    const media = chunk.media ?? [];

    if (chunk.text.length === 0 && media.length === 0 && !chunk.stateDiff) {
      issues.push({ type: 'continuity', message: 'Narrative chunk is empty.' });
    }

    if (/\b(?:kill|murder)\b/i.test(chunk.text)) {
      issues.push({ type: 'moderation', message: 'Potentially sensitive content detected.' });
    }

    return issues;
  }
}
