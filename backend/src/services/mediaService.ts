import { NarrativeChunk } from '../types/index.js';

export class MediaService {
  constructor(
    private readonly client: {
      generateImage: (payload: Record<string, unknown>) => Promise<NarrativeChunk['media'][number]>;
      generateAudio: (payload: Record<string, unknown>) => Promise<NarrativeChunk['media'][number]>;
    }
  ) {}

  async generateImage(payload: Record<string, unknown>) {
    return this.client.generateImage(payload);
  }

  async generateAudio(payload: Record<string, unknown>) {
    return this.client.generateAudio(payload);
  }
}
