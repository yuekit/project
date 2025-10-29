# Living Storybook

An immersive, AI-powered role-playing experience that blends the open-ended creativity of text adventures with dynamic visual storytelling. Players co-create the narrative alongside AI systems that respond to their choices with original prose, illustrations, soundscapes, and game logic.

## Vision

Deliver a living storybook that adapts to every player's imagination. Each playthrough becomes a unique adventure crafted in real time by large language models and generative art systems, reinforced by lightweight game mechanics and a cinematic presentation layer.

## Repository Layout

```
.
├── backend/                 # Fastify-based orchestration & state APIs
├── docs/                    # Architecture and design references
├── .gitignore
└── README.md
```

## Getting Started

```bash
cd backend
npm install
npm run dev
```

The development server exposes a REST interface for session management and a WebSocket channel for live story updates. API documentation is available at `http://localhost:3333/docs` when the server is running.

## Key Features

- **Narrative Co-Creation:** A large language model (LLM) acts as the narrator and dungeon master, generating scene descriptions, dialogue, and branching plotlines based on free-form player input.
- **AI-Generated Artwork:** Image models produce illustrative panels or animations for each scene, optionally reusing character references to preserve continuity.
- **Persistent World State:** Structured data captures characters, inventory, quest flags, and location details to maintain narrative coherence and support rules-based interactions.
- **Interactive Gameplay Loop:** Players submit actions by typing or selecting suggested options; the AI adjudicates outcomes, updates the world state, and advances the story.
- **Audio Atmosphere (Optional):** Adaptive music and sound effects selected by a tagging model enhance immersion during key events.
- **Session Persistence:** Stories can be exported or revisited, enabling alternate decisions and replayability.

## Architecture Overview

See [docs/architecture.md](docs/architecture.md) for a detailed breakdown of the orchestration layer, state manager, and AI integrations.
