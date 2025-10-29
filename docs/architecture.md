# Living Storybook Architecture

The platform combines a web-based experience layer with an orchestration service that mediates player interactions, manages world state, and coordinates external AI services.

## High-Level Components

```
+-------------------+       +------------------+       +---------------------+
|   Web Front-End   | <---> |  Orchestration   | <---> |  External AI APIs   |
| (Next.js + SSE)   |       |  Service Layer   |       | (LLM, Image, Audio) |
+-------------------+       +------------------+       +---------------------+
          |                          |                           |
          |                          v                           |
          |                 +------------------+                 |
          |                 |  State Manager   | <---------------+
          |                 +------------------+
          |                          |
          v                          v
+-------------------+       +------------------+
|  Player Sessions  |       | Persistence Tier |
|  (WebSockets)     |       | (DB, Object Store)|
+-------------------+       +------------------+
```

### Front-End (Out of Scope in this repository)

- Built with **Next.js** and **Tailwind CSS** for rapid UI iteration.
- Establishes a persistent connection (WebSockets or Server-Sent Events) to stream AI responses and media asset metadata.
- Renders AI-generated prose, illustrations, and ambient audio cues as a living comic panel experience.

### Orchestration Service (This repository)

The Fastify-based service mediates player input, world updates, and tool invocations.

- **Prompt Builder:** Serializes the latest narrative context, structured world state, and player intent into a prompt document for the LLM.
- **Tool Router:** Executes tool calls emitted by the LLM, such as `update_state`, `generate_image`, `trigger_audio`, or `fetch_reference_image`.
- **Consistency Engine:** Applies content filters, continuity checks, and red teaming passes before delivering output to players.
- **Session Gateway:** Exposes REST endpoints for session lifecycle management and a WebSocket channel for real-time story streaming.

### State Manager

- Maintains canonical world data: characters, locations, quests, inventory, and relationships.
- Supports deterministic mechanics (combat, skill checks) via dice rollers and rule resolvers.
- Provides snapshotting and restoration for save/load flows, branch exploration, and analytics.
- Emits state change events for auditing and observability.

### External AI APIs

- **LLM Engine:** GPT-4, Claude, or a fine-tuned custom model for interactive fiction.
- **Image Generation:** DALL·E, Stable Diffusion, Midjourney, or custom diffusion services.
- **Audio Generation:** Optional integration with AI music or procedural audio libraries.

## Service Modules

| Module | Description |
| ------ | ----------- |
| `PromptBuilder` | Compiles the player's latest action, recent transcript, and structured state into a token-efficient prompt. |
| `ToolRouter` | Validates and dispatches AI tool calls to downstream services. |
| `ConsistencyEngine` | Applies moderation, safety, and continuity rules to AI outputs. |
| `StateManager` | Stores and mutates the canonical world state, exposing a deterministic API for game mechanics. |
| `SessionController` | Handles HTTP/WebSocket traffic, bridging clients to the orchestration pipeline. |

## Data Flow

1. **Player Action:** Client sends free-form text or selected action to `/api/sessions/{id}/actions`.
2. **Prompt Assembly:** `PromptBuilder` merges action, transcript history, and state snapshot.
3. **LLM Invocation:** `LLMService` streams narrative text and tool calls.
4. **Tool Execution:** `ToolRouter` resolves requested operations (state updates, asset generation, audio cues).
5. **Consistency Pass:** `ConsistencyEngine` sanitizes and validates outputs.
6. **Broadcast:** Session gateway streams the narrative chunk and asset metadata to connected clients.
7. **Persistence:** `StateManager` commits structural changes and appends the transcript log.

## Persistence Strategy

- **Document Store (MongoDB/DynamoDB):** Session transcripts, world state snapshots, quest metadata.
- **Redis Cache:** Active session state for low-latency reads and event fan-out.
- **Object Storage (S3-compatible):** Generated images, audio files, and exported storybooks.

## Observability & Safety

- Structured JSON logging with correlation IDs per session.
- Metrics for latency, token usage, content moderation events, and completion rates.
- Pluggable guardrails to enforce community guidelines and red-team automated outputs.

## Roadmap Highlights

- Implement client UI with cinematic panel transitions and timeline browsing.
- Integrate adaptive soundtrack selection via metadata tagging and mood detection.
- Add branching analytics and authoring tools for curated story arcs.
- Support collaborative multiplayer sessions with synchronized state updates.
