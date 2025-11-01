# Data Daemons

A browser-based demo featuring three persistent "Data Daemons" that evolve based on the content you feed them. Each daemon develops unique personality traits through AI-powered analysis, maintains contextual memories, and can collaborate to generate creative ideas.

## Tech Stack

### Frontend
- **React 19** - UI framework
- **PixiJS 8** - High-performance 2D graphics engine for daemon animations
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management for UI-only state
- **Convex React Client** - Real-time data subscriptions

### Backend
- **FastAPI** - High-performance Python API framework
- **Python 3.x** - Backend language
- **OpenAI** - Primary LLM for content analysis, personality generation, and creative brainstorming
- **Gemini** - Fallback LLM provider for redundancy

### Infrastructure & Services
- **Convex** - Real-time database and backend-as-a-service
  - Authoritative state management for daemon traits, stages, and feed history
  - Real-time subscriptions for instant UI updates
  - Mutation-based data integrity with optimistic updates
- **Hyperspell** - Contextual memory and semantic search
  - Long-term memory storage for each daemon's experiences
  - Retrieval of relevant memories for Pet Manager brainstorming
- **AgentMail** - Email integration service
  - Dedicated inbox per daemon for email-based feeding
  - Webhook delivery to backend for processing

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ DaemonSwitcher│  │ PixiJS Canvas│  │   Trait Panel          ││
│  │   (3 Daemons) │  │  (Animations)│  │ (Real-time Traits)     ││
│  └──────────────┘  └──────────────┘  └────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┐
│  │          Feed History & Pet Manager (Brainstorm)            ││
│  └──────────────────────────────────────────────────────────────┘
└──────────────┬──────────────────────────────────┬───────────────┘
               │                                  │
        Convex │                           FastAPI│ /analyze
        useQuery/useMutation                      │ /feed-by-email
               │                                  │ /pet-manager/brainstorm
               ▼                                  ▼
┌──────────────────────────┐      ┌────────────────────────────────┐
│      Convex Backend      │      │      FastAPI Backend           │
│  ┌──────────────────────┐│      │  ┌──────────────────────────┐ │
│  │ daemons (collection) ││◄─────┤  │  Analysis Pipeline       │ │
│  │ feeds (collection)   ││      │  │  - Content normalization │ │
│  │ managerLogs          ││      │  │  - OpenAI LLM calls      │ │
│  └──────────────────────┘│      │  │  - Trait delta calc      │ │
│  Real-time subscriptions │      │  └──────────────────────────┘ │
│  Mutations & validation  │      │           │         │          │
└───────────┬──────────────┘      └───────────┼─────────┼──────────┘
            │                                  │         │
            │                                  ▼         ▼
            │                     ┌──────────────┐  ┌──────────────┐
            │                     │  Hyperspell  │  │  AgentMail   │
            │                     │  (Memories)  │  │  (Webhooks)  │
            │                     └──────────────┘  └──────────────┘
            │                          ▲                    ▲
            └──────────────────────────┘                    │
                  Memory retrieval                   Email ingestion
                  for brainstorming                  daemon1@...
                                                     daemon2@...
                                                     daemon3@...
```

### Data Flow

#### Feed Ingestion (Drag & Drop)
1. User drops file/text on active daemon
2. Frontend creates unique `feedId`, calls Convex mutation `feeds.startProcessing`
3. Frontend POSTs to FastAPI `/analyze` with content and `daemonId`
4. Backend:
   - Normalizes content (optional OCR)
   - Calls OpenAI for analysis (caption, roast, trait deltas)
   - Creates Hyperspell memory with daemon context
   - Calls Convex mutation `feeds.complete` with trait deltas
5. Convex updates daemon traits and feed status
6. Frontend receives updates via real-time subscription
7. UI animates trait changes and displays roast

#### Email-Based Feeding (AgentMail)
1. User sends email to `daemonN@agentmail.to`
2. AgentMail webhook triggers POST to `/feed-by-email`
3. Backend extracts `daemonId` from recipient address
4. Follows same analysis pipeline as drag-and-drop
5. Real-time UI updates via Convex subscription

#### Pet Manager Brainstorming
1. User clicks "Brainstorm" button
2. Frontend POSTs to `/pet-manager/brainstorm` (optional topic)
3. Backend orchestration:
   - Fetches all 3 daemon records from Convex (traits, stages, names)
   - Retrieves recent Hyperspell memories for each daemon
   - Constructs rich prompt with personality summaries
   - Calls OpenAI for collaborative idea generation
   - Streams response back to frontend
4. Output references each daemon's unique traits and memories

## Key Integrations

### Convex: Real-Time State Management

Convex serves as the single source of truth for all daemon state:

**Collections:**
- `daemons` - Daemon records with traits (20 dimensions), stage, satisfaction, name, sprite URL
- `feeds` - Ingestion events with status tracking (processing → completed/errored)
- `managerLogs` - Pet Manager brainstorm sessions

**Features:**
- Real-time subscriptions: UI updates automatically when daemon state changes
- Mutation-based writes: Ensures data consistency with transaction-like semantics
- Optimistic updates: Instant UI feedback with automatic rollback on errors
- Evolution logic: Automatic stage progression based on configurable thresholds

**Usage Example:**
```typescript
// Frontend: Subscribe to daemon updates
const daemon = useQuery(api.daemons.get, { id: activeDaemonId });

// Frontend: Update daemon via mutation
const completeFeed = useMutation(api.feeds.complete);
await completeFeed({ feedId, daemonId, traitDeltas, roast });
```

### Hyperspell: Contextual Memory

Hyperspell provides semantic memory storage for each daemon:

**Memory Structure:**
- Collection per daemon: `daemon-{daemonId}`
- Each memory includes: caption, roast, source (email/drag-drop), content type, timestamp
- Resource ID format: `{daemonId}-{timestamp}`

**Features:**
- Semantic search: Query memories using natural language
- Recency retrieval: Fetch N most recent memories for context
- Persistence: Memories survive daemon evolution and sessions

**Usage Example:**
```python
# Backend: Add memory after feed analysis
add_daemon_memory(
    daemon_id="abc123",
    daemon_name="Nova",
    caption="User shared a sunset photo",
    roast="Your photography skills need work!",
    source="email",
    content_type="jpg",
    timestamp=int(time.time() * 1000)
)

# Backend: Retrieve for brainstorming
memories = get_recent_daemon_memories(daemon_id="abc123", limit=10)
```

### AgentMail: Email Integration

AgentMail enables email-based daemon feeding:

**Setup:**
- Three provisioned inboxes: `daemon1@agentmail.to`, `daemon2@agentmail.to`, `daemon3@agentmail.to`
- Webhook configured to POST to `/feed-by-email` on `message.received` events
- Shared secret validation for security

**Webhook Payload:**
- Message metadata: `messageId`, `from`, `to`, `subject`
- Content: `text`, `html` body
- Attachments: Array of attachment metadata with download URLs

**Features:**
- Automatic daemon routing: Extracts `daemonId` from recipient address
- Multi-content support: Text body + image/PDF attachments
- Idempotency: Uses `messageId` as `feedId` to prevent duplicate processing

### OpenAI: Primary AI Provider

OpenAI drives the core intelligence behind Data Daemons:

**Primary Use Cases:**

1. **Content Analysis** (`/analyze` endpoint)
   - Generates witty caption summarizing content
   - Creates snarky roast/commentary
   - Calculates trait deltas (0-3 per trait) across 20 personality dimensions
   - Output: JSON with `{ caption, roast, traitDeltas }`

2. **Name Generation** (`/generate-name` endpoint)
   - Creates unique daemon names based on personality and stage
   - Input: Current traits, stage (Egg/Baby/Teen/Adult)

3. **Pet Manager Brainstorming** (`/pet-manager/brainstorm` endpoint)
   - Synthesizes data from all 3 daemons
   - Combines trait summaries + Hyperspell memories
   - Generates creative ideas with each daemon's "contribution"
   - Optional topic focus for targeted brainstorming

**Prompt Engineering:**
- Structured JSON output for reliable parsing
- 20 canonical trait definitions for consistency
- Personality-aware prompts incorporating daemon archetype and history

**Fallback Strategy:**
- Gemini is used as a backup when OpenAI is unavailable
- Automatic failover with circuit breaker pattern
- Mock responses available for development without API keys

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Convex account ([convex.dev](https://convex.dev))
- Hyperspell API key ([hyperspell.com](https://hyperspell.com))
- AgentMail account ([agentmail.to](https://agentmail.to))
- OpenAI API key (Gemini key optional for fallback)

### Environment Setup

Create `.env.local` in the project root:
```bash
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Backend (server/.env)
HYPERSPELL_API_KEY=hs2-xxx-xxxx
AGENTMAIL_API_KEY=your-agentmail-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key  # Optional fallback
AGENTMAIL_WEBHOOK_SECRET=your-webhook-secret
```

### Installation & Run

1. **Install dependencies:**
   ```bash
   # Root (Convex + Hyperspell)
   npm install

   # Frontend
   cd web-demo
   npm install

   # Backend
   cd ../server
   pip install -r requirements.txt
   ```

2. **Start Convex dev server:**
   ```bash
   npx convex dev
   ```

3. **Start FastAPI backend:**
   ```bash
   cd server
   python -m uvicorn main:app --reload --port 8000
   ```

4. **Start frontend dev server:**
   ```bash
   cd web-demo
   npm run dev
   ```

5. **Open browser:**
   Navigate to `http://localhost:5173`

### AgentMail Webhook Configuration

Run the setup script to configure AgentMail webhooks:
```bash
python setup_agentmail_webhook.py
```

This will:
- Create 3 daemon inboxes
- Register webhook pointing to your `/feed-by-email` endpoint
- Display inbox addresses for testing

## Project Structure

```
data-daemons/
├── convex/                 # Convex backend functions
│   ├── daemons.ts         # Daemon CRUD and mutations
│   ├── feeds.ts           # Feed lifecycle management
│   ├── managerLogs.ts     # Pet Manager logs
│   └── schema.ts          # Database schema definitions
├── server/                 # FastAPI backend
│   ├── main.py            # API routes and orchestration
│   ├── hyperspell_client.py  # Hyperspell integration
│   ├── llm_providers.py   # OpenAI/Gemini clients
│   ├── personality.py     # Trait definitions and logic
│   ├── prompt_builder.py  # LLM prompt construction
│   └── schemas.py         # Pydantic models
├── web-demo/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── DaemonSwitcher.tsx
│   │   │   ├── TraitPanel.tsx
│   │   │   ├── DropZone.tsx
│   │   │   └── PetManagerView.tsx
│   │   ├── pixi/          # PixiJS animations
│   │   │   └── Stage.tsx
│   │   ├── stores/        # Zustand stores
│   │   │   └── petStore.ts
│   │   └── lib/           # Convex client
│   │       └── convexClient.ts
│   └── package.json
└── package.json           # Root dependencies (Convex, Hyperspell)
```

## Key Features

- **Multi-Daemon Management**: Switch between 3 concurrent daemons, each with independent state
- **Real-Time Updates**: Convex subscriptions ensure UI reflects backend changes instantly
- **Dual Input Methods**: Feed daemons via drag-and-drop or dedicated email addresses
- **AI-Powered Personality**: 20-dimensional trait system with OpenAI-driven analysis
- **Contextual Memory**: Hyperspell stores and retrieves daemon experiences for richer interactions
- **Pet Manager**: Collaborative brainstorming using combined daemon personalities and memories
- **Event-Driven Architecture**: Ordered pipeline ensures deterministic state updates and animations

## Future Goals

- **Evolution System**: Daemons progress through stages (Egg → Baby → Teen → Adult) based on feed count
- **Advanced Animations**: Stage-specific PixiJS sprites and transition effects
- **Cross-User Persistence**: Account management and authentication for saved daemon state
- **Extended Memory**: Advanced memory summarization and retention policies

## Documentation

- [Product Requirements Document](./PRD.md) - Full feature specifications
- [Convex Integration Guide](./convex-integration.md) - Detailed Convex setup
- [Hyperspell Integration Guide](./HYPERSPELL_INTEGRATION.md) - Memory system details
- [AgentMail Reference](./agent-mail-reference.md) - API documentation
