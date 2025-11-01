  # Data Daemons – Product Requirements Document (PRD)                                                                                         
                                                                                                                                               
  Version: 2.0 (Multi-pet, Summoner Architecture)                                                                                              
  Stack: React + PixiJS + Convex frontend; Python FastAPI backend; Gemini, AgentMail, Hyperspell                                               
  Audience: Product, Engineering, QA                                                                                                           
  Last Updated: 2025-10-31                                                                                                                     
                                                                                                                                               
  ## 1. Overview                                                                                                                               
                                                                                                                                               
  Purpose: Deliver a browser-based demo featuring three persistent “Data Daemons.” Users feed Daemons by drag-and-drop or via dedicated        
  AgentMail inboxes. Gemini-powered analysis updates personality traits stored in Convex, while contextual “memories” are persisted in         
  Hyperspell. A central Pet Manager (“Summoner Agent”) orchestrates all Daemons’ state and memories to brainstorm new ideas.                   
                                                                                                                                               
  Goals:                                                                                                                                       
  - Preserve the Unity event-driven behavior in a multi-agent web architecture.                                                                
  - Provide high-fidelity PixiJS animations for each Daemon with seamless switching.                                                           
  - Integrate Gemini for analysis, speech/roasts, evolution guidance, and name generation.                                                     
  - Implement persistent state via Convex (traits, stage, satisfaction).                                                                       
  - Capture long-term memories per Daemon in Hyperspell.                                                                                       
  - Build a Pet Manager surface that synthesizes Daemons’ states and memories into creative output.                                            
  - Primary “feed-by-email” experience via AgentMail; drag-and-drop remains supported.                                                         
                                                                                                                                               
  Non-Goals (MVP):                                                                                                                             
  - Account management or cross-user persistence (Convex sessions are scoped per demo instance).                                               
  - Complex sprite generation beyond curated assets.                                                                                           
  - Mobile-first optimization (desktop-first; mobile best-effort).                                                                             
                                                                                                                                               
  ## 2. Scope                                                                                                                                  
                                                                                                                                               
  In scope:                                                                                                                                    
  - Multi-Daemon UI with switcher (3 concurrent Daemons).                                                                                      
  - PixiJS visualization for the active Daemon plus stage-appropriate animations.                                                              
  - Trait panel, satisfaction bar, evolution panel for the active Daemon.                                                                      
  - File ingest (drag-and-drop/picker) targeting the active Daemon.                                                                            
  - AgentMail integration with three provisioned inboxes and webhook ingestion.                                                                
  - Gemini-backed analysis pipeline (caption, roast, trait deltas).                                                                            
  - Convex integration for authoritative Daemon state and real-time UI sync.                                                                   
  - Hyperspell integration for contextual memory storage/retrieval.                                                                            
  - Pet Manager UI and backend orchestration endpoint.                                                                                         
  - Existing optional background removal, name generation, Dev Mode diagnostics.                                                               
  - Observability across frontend, backend, and third-party services.                                                                          
                                                                                                                                               
  Out of scope:                                                                                                                                
  - Local session save/restore (Convex handles persistence).                                                                                   
  - Multiplayer/shared Daemon ownership.                                                                                                       
  - Browser-based webhook configuration UI.                                                                                                    
  - Advanced asset authoring or new trait definitions.                                                                                         
                                                                                                                                               
  ## 3. Canonical Traits & Stage Mechanics (Aligned)                                                                                           
                                                                                                                                               
  Trait keys (20) and definitions remain unchanged from v1.1.                                                                                  
  Trait values are non-negative integers; trait deltas per feed remain 0–3.                                                                    
                                                                                                                                               
  Stage progression (Egg → Baby → Teen → Adult), thresholds, and active trait display counts are identical to the Unity baseline. The only     
  change is storing and updating these values in Convex instead of in-memory/localStorage.                                                     
                                                                                                                                               
  ## 4. Target Platforms                                                                                                                       
                                                                                                                                               
  Unchanged from v1.1:                                                                                                                         
  - Browsers: Chrome ≥115, Edge ≥115, Firefox ≥115, Safari ≥16.                                                                                
  - OS: Windows/macOS desktop primary.                                                                                                         
  - Devices: Laptop/desktop with WebGL; mobile best-effort.                                                                                    
                                                                                                                                               
  ## 5. UX Flows                                                                                                                               
                                                                                                                                               
  Layout:                                                                                                                                      
  - Top/Side: Daemon Switcher (tabs/icons) showing avatar, name, stage.                                                                        
  - Left: PixiJS canvas rendering the active Daemon, speech bubble, feed animations.                                                           
  - Right: Trait panel with real-time Convex data for the active Daemon.                                                                       
  - Right (tabbed): Pet Manager view containing “Brainstorm” button and output stream.                                                         
  - Bottom: File drop zone (targets active Daemon) plus feed history list.                                                                     
  - Supplemental: Collapsible AgentMail panel listing each Daemon’s email address and status.                                                  
                                                                                                                                               
  Flows:                                                                                                                                       
  - Drag-and-Drop Feed: User drops file → validation → animation → POST /analyze (daemonId) → Gemini analysis → Convex trait update →          
  Hyperspell memory write → real-time UI update → speech bubble.                                                                               
  - Email Feed: User emails daemonN@… → AgentMail webhook → POST /feed-by-email → analysis pipeline (daemonId inferred) → Convex & Hyperspell  
  updates → active browser session receives Convex push → UI shows updated traits/history.                                                     
  - Evolution: Triggered from Convex state (same thresholds) → POST /evolve (daemonId) → sprite update, stage advancement, resets.             
  - Pet Manager Brainstorm: User opens Pet Manager tab → clicks Brainstorm → POST /pet-manager/brainstorm → backend fetches Convex & Hyperspell
  data, constructs prompt → Gemini streams synthesized idea → UI displays contributions per Daemon.                                            
  - Settings: Toggles remain (Use Cloud AI, Background Removal, Dev Mode) except “Save Session Locally,” which is removed.                     
                                                                                                                                               
  ## 6. Functional Requirements                                                                                                                
                                                                                                                                               
  ### 6.1 File Ingestion & Validation                                                                                                          
  - Drag-and-drop/picker uses existing validation rules (file types, size, sequential processing).                                             
  - Webhook: POST /feed-by-email secured with shared secret.                                                                                   
    - Parses target daemonId from “To” address.                                                                                                
    - Supports multiple attachments; processes first supported file (text/images initially).                                                   
    - Captures origin metadata (`source: 'email'`).                                                                                            
  - Acceptance: Valid files (UI or email) result in consistent analysis pipeline execution; invalid requests return clear responses without    
  processing.                                                                                                                                  
                                                                                                                                               
  ### 6.2 Pet State & Traits                                                                                                                   
  - Convex schema stores Daemon state (`traits`, `stage`, `name`, `feedsSinceEvolution`, `satisfaction`, metadata).                            
  - Frontend subscribes via Convex `useQuery` for all Daemon records plus feed history.                                                        
  - Zustand reserved for ephemeral UI state (active tab, Dev Mode toggles).                                                                    
  - Acceptance: Switching Daemons is instantaneous; trait bars and satisfaction updates reflect Convex state without manual refresh.           
                                                                                                                                               
  ### 6.3 Analysis Pipeline (AI)                                                                                                               
  - Endpoints: POST /analyze (drag/drop) and POST /feed-by-email (webhook).                                                                    
  - Inputs include `daemonId`, file data or text content, metadata.                                                                            
  - On success:                                                                                                                                
    - Update Convex record via server-side mutation (idempotent, optimistic friendly).                                                         
    - Persist Hyperspell memory `{ daemonId, caption, roast, source, contentType, timestamp }`.                                                
  - Output schema for analysis remains unchanged; errors trigger mock fallback with logging.                                                   
                                                                                                                                               
  ### 6.4 Evolution Pipeline                                                                                                                   
  - Trigger thresholds unchanged; source of truth is Convex.                                                                                   
  - POST /evolve takes `daemonId`; updates Convex record, resets evolution counters.                                                           
  - Sprite assets remain curated by stage; optional background removal invoked when enabled.                                                   
                                                                                                                                               
  ### 6.5 Name Generation                                                                                                                      
  - POST /generate-name accepts `daemonId` along with current traits/stage.                                                                    
  - Generated name stored back into Convex for consistency across sessions.                                                                    
                                                                                                                                               
  ### 6.6 Background Removal (Optional)                                                                                                        
  - Endpoint unchanged; invoked per evolution or user action.                                                                                  
  - Stores resulting sprite URL in Convex.                                                                                                     
                                                                                                                                               
  ### 6.7 Speech & Roast                                                                                                                       
  - Speech bubble tied to active Daemon; roasts stored in feed history logs in Convex.                                                         
  - Email feeds display origin metadata in history panel.                                                                                      
                                                                                                                                               
  ### 6.8 Settings & Toggles                                                                                                                   
  - Available toggles: Use Cloud AI, Background Removal, Dev Mode.                                                                             
  - Save Session Locally removed (persistence is default).                                                                                     
  - Dev Mode extended to display Convex record snapshot and hook latency.                                                                      
                                                                                                                                               
  ### 6.9 Pet Manager (Summoner Agent)                                                                                                         
  - Endpoint: POST /pet-manager/brainstorm (optional `topic`).                                                                                 
  - Backend orchestration:                                                                                                                     
    - Fetch all Daemons’ Convex records.                                                                                                       
    - Pull latest N memories per Daemon from Hyperspell.                                                                                       
    - Build Summoner prompt (Section 9) and call Gemini with streaming response.                                                               
    - Return streaming text (MVP) or structured JSON `{ brainstormIdea, contributions[] }`.                                                    
  - Acceptance: Output references each Daemon’s personality traits and recent memories.                                                        
                                                                                                                                               
  ## 7. Technical Architecture                                                                                                                 
                                                                                                                                               
  Frontend (React + PixiJS + TS):                                                                                                              
  - Build: Vite; integrates Convex client SDK.                                                                                                 
  - State Management:                                                                                                                          
    - Convex `useQuery`/`useMutation` for live Daemon data and feed history.                                                                   
    - Zustand for transient UI (activeDaemonId, modal states, Dev Mode flags).                                                                 
  - Key Modules:                                                                                                                               
    - `DaemonManager.tsx` – subscribes to Convex data, provides context providers.                                                             
    - `DaemonSwitcher.tsx` – renders Daemon tabs, handles selection.                                                                           
    - `PetCanvas.tsx` – PixiJS scene per Daemon.                                                                                               
    - `TraitPanel.tsx` – binds to Convex state; animates trait changes.                                                                        
    - `FeedHistory.tsx` – lists feed events, badges for email/drag sources.                                                                    
    - `PetManagerView.tsx` – Summoner UI with streaming output and logs.                                                                       
    - `DevModePanel.tsx` – exposes raw payloads, Convex mutations, webhook logs.                                                               
                                                                                                                                               
  Backend (FastAPI):                                                                                                                           
  - Endpoints: `/analyze`, `/feed-by-email`, `/evolve`, `/generate-name`, `/remove-background`, `/pet-manager/brainstorm`, `/health`.          
  - Integrations:                                                                                                                              
    - Convex server-side client (secure key) for mutations/queries.                                                                            
    - Hyperspell client for memory CRUD (with retries).                                                                                        
    - AgentMail webhook ingestion (HMAC validation, request logging).                                                                          
    - Gemini SDK for analysis and brainstorming (with safety configs).                                                                         
  - Architecture: request handlers orchestrate services; shared utilities for prompt building, JSON validation, retries.                       
  - Observability: structured logging, tracing IDs, correlation across Convex/Hyperspell/Gemini calls.                                         
                                                                                                                                               
  ## 8. Data Contracts (JSON)                                                                                                                  
                                                                                                                                               
  `AnalysisResult` (unchanged).                                                                                                                
  `EvolutionResult`, `NameResult`, `Error` (unchanged).                                                                                        
                                                                                                                                               
  `Convex Daemon Record`                                                                                                                       
  ```json                                                                                                                                      
  {                                                                                                                                            
    "_id": string,                                                                                                                             
    "name": string,                                                                                                                            
    "stage": number,                                                                                                                           
    "traits": Record<TraitKey, number>,                                                                                                        
    "feedsSinceEvolution": number,                                                                                                             
    "satisfaction": number,                                                                                                                    
    "spriteUrl": string,                                                                                                                       
    "lastUpdated": number                                                                                                                      
  }                                                                                                                                            
                                                                                                                                               
  Hyperspell Memory                                                                                                                            
                                                                                                                                               
  {                                                                                                                                            
    "daemonId": string,                                                                                                                        
    "timestamp": number,                                                                                                                       
    "memoryText": string,                                                                                                                      
    "caption": string,                                                                                                                         
    "roast": string,                                                                                                                           
    "source": "email" | "drag-drop",                                                                                                           
    "contentType": "txt" | "png" | "jpg" | "pdf" | string                                                                                      
  }                                                                                                                                            
                                                                                                                                               
  PetManagerOutput (MVP)                                                                                                                       
                                                                                                                                               
  {                                                                                                                                            
    "brainstormIdea": string,                                                                                                                  
    "contributions": [                                                                                                                         
      { "daemonName": string, "role": string, "highlight": string }                                                                            
    ]                                                                                                                                          
  }                                                                                                                                            
                                                                                                                                               
  (Allowed to stream plain text initially; upgrade path to structured payload.)                                                                
                                                                                                                                               
  ## 9. Prompt Builders (Server-side)                                                                                                          
                                                                                                                                               
  - BuildAnalysisPrompt – unchanged (20 trait definitions, JSON-only output).                                                                  
  - BuildNameGenerationPrompt – unchanged.                                                                                                     
  - BuildPetManagerPrompt(daemons, memories, topic?):                                                                                          
                                                                                                                                               
  You are the creative Pet Manager coordinating three Data Daemons.                                                                            
  Daemon 1 "{name}": top traits [...], recent memories [...]                                                                                   
  Daemon 2 "{name}": top traits [...], recent memories [...]                                                                                   
  Daemon 3 "{name}": top traits [...], recent memories [...]                                                                                   
  Task: Produce a single collaborative project idea. Show how each Daemon contributes, referencing their personalities and latest experiences. 
  Keep it playful and actionable.                                                                                                              
  Optional topic: {topic}                                                                                                                      
  Respond in JSON with brainstormIdea and contributions array.                                                                                 
                                                                                                                                               
  ## 10. Performance & Reliability                                                                                                             
                                                                                                                                               
  - Initial load <2.5s; PixiJS canvas targets 60fps.                                                                                           
  - Convex query latency ≤200ms typical; brain-storm streaming begins <3s.                                                                     
  - Gemini analysis <8s; email-to-trait update visible <10s end-to-end.                                                                        
  - Retry strategy: single retry for idempotent Convex/Hyperspell operations; circuit breaker toggles mock AI after repeated failures.         
  - Email webhook queue supports replay; dedupe via AgentMail message ID.                                                                      
                                                                                                                                               
  ## 11. Security & Privacy                                                                                                                    
                                                                                                                                               
  - Webhook security: AgentMail requests validated via shared secret/HMAC; reject unsigned calls.                                              
  - Rate limiting per endpoint; stricter on /feed-by-email.                                                                                    
  - Convex and Hyperspell credentials stored server-side; never shipped to frontend.                                                           
  - Email attachments sanitized and discarded after processing; only derived data (traits/memories) persisted.                                 
  - Content safety filters maintained for Gemini prompts/responses.                                                                            
  - Audit logging for webhook activity and Convex mutations (trace IDs).                                                                       
                                                                                                                                               
  ## 12. Accessibility & Localization                                                                                                          
                                                                                                                                               
  - Keyboard-accessible Daemon switcher and Pet Manager controls.                                                                              
  - ARIA roles for tab panels, speech bubbles, feed history.                                                                                   
  - English UI; maintain i18n scaffolding for future localization.                                                                             
                                                                                                                                               
  ## 13. Observability                                                                                                                         
                                                                                                                                               
  - Frontend: Sentry (errors), analytics for Daemon switching, email feed success rate, Convex subscription latency.                           
  - Backend: structured logs with trace IDs linking incoming requests → Convex mutations → Hyperspell writes → Gemini calls.                   
  - Webhook monitoring dashboard (success/fail counts, retries).                                                                               
  - Metrics exported for AI latency, Convex mutation duration, Hyperspell failures, brainstorm invocation counts.                              
                                                                                                                                               
  ## 14. Testing & Acceptance Criteria                                                                                                         
                                                                                                                                               
  Unit Tests:                                                                                                                                  
                                                                                                                                               
  - Convex mutation helpers (trait application, evolution resets).                                                                             
  - AgentMail parser (daemonId extraction, file handling).                                                                                     
  - PetManager prompt builder and JSON schema validation.                                                                                      
  - Hyperspell client wrapper (memory formatting).                                                                                             
                                                                                                                                               
  Integration Tests:                                                                                                                           
                                                                                                                                               
  - Drag-and-drop flow with mock AI → Convex update → Hyperspell write.                                                                        
  - Email webhook end-to-end using mocked AgentMail payload → UI reflects change.                                                              
  - Brainstorm endpoint returning structured output referencing all Daemons.                                                                   
                                                                                                                                               
  E2E (Playwright or Cypress):                                                                                                                 
                                                                                                                                               
  - User can switch among three Daemons; trait bars differ per Daemon.                                                                         
  - Drag feed to Daemon 1 → only Daemon 1 traits update.                                                                                       
  - Send email to Daemon 2 inbox → UI updates automatically without refresh.                                                                   
  - Brainstorm output references stage/traits/memories of all Daemons.                                                                         
                                                                                                                                               
  Acceptance:                                                                                                                                  
                                                                                                                                               
  - Convex state is single source of truth; UI reflects updates within 1s.                                                                     
  - Hyperspell memories appear in feed history with correct source badge.                                                                      
  - Brainstorm response arrives within 10s and cites each Daemon by name/trait.                                                                
                                                                                                                                               
  ## 15. Risks & Mitigations                                                                                                                   
                                                                                                                                               
  - Service Integration Complexity → Start with mock adapters; integrate sequentially; leverage feature flags.                                 
  - Real-time Sync Confusion → Standardize Convex mutations and optimistic UI updates; add Dev Mode diagnostics.                               
  - Webhook Reliability & Abuse → Verify secrets, log all requests, employ rate limiting and replay-safe processing.                           
  - Vendor Latency/Outages → Mock fallbacks for Gemini/Hyperspell; queue AgentMail events for retry.                                           
  - Multi-agent UX Overload → Provide clear Daemon switcher states, visual cues, and history filters.                                          
                                                                                                                                               
  ## 16. Milestones & Timeline (MVP)                                                                                                           
                                                                                                                                               
  Week 1 – Core Loop Persistent:                                                                                                               
                                                                                                                                               
  - FastAPI scaffolding; Convex schema + mutations (mock data).                                                                                
  - POST /analyze mocked Gemini; updates Convex for selected daemonId.                                                                         
  - React + PixiJS + Convex client; Daemon switcher and trait panel wired to Convex.                                                           
    Goal: Drag-and-drop updates Convex state for chosen Daemon in real time.
                                                                                                                                               
  Week 2 – Inputs & Memory:                                                                                                                    
                                                                                                                                               
  - AgentMail webhook integration; email feed flows into /feed-by-email and shared analysis logic.                                             
  - Hyperspell memory writes for both ingestion paths.                                                                                         
  - UI updates: feed history with source badges; AgentMail instruction panel.                                                                  
    Goal: Emailing daemon2@… updates Daemon 2 traits/memories in UI automatically.                                                             
                                                                                                                                               
  Week 3 – Summoner & Polish:                                                                                                                  
                                                                                                                                               
  - POST /pet-manager/brainstorm with Gemini orchestration.                                                                                    
  - Pet Manager UI with streaming idea output and error handling.                                                                              
  - PixiJS animation polish, Dev Mode enhancements, telemetry wiring.                                                                          
    Goal: Brainstorm yields creative output referencing live traits/memories.                                                                  
                                                                                                                                               
  ## 17. Open Questions                                                                                                                        
                                                                                                                                               
  - AgentMail SLA and retry budget—confirm limits and sandbox credentials.                                                                     
  - Hyperspell memory retention policy and quota management.                                                                                   
  - Final schema for brainstorm output (streamed text vs structured JSON) before Week 3.                                                       
  - Naming convention for Daemon inboxes (public vs obfuscated) for demo audiences.                                                            