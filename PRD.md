  # Data Daemons – Product Requirements Document (PRD)                                                                                         
                                                                                                                                               
  Version: 2.2 (Multi-pet, Summoner Architecture)                                                                                              
  Stack: React + PixiJS + Convex frontend; Python FastAPI backend; Gemini, AgentMail, Hyperspell                                               
  Audience: Product, Engineering, QA                                                                                                           
  Last Updated: 2025-11-01                                                                                                                     
                                                                                                                                               
  ## 1. Overview                                                                                                                                              
                                                                                                                                                              
  Purpose: Deliver a browser-based demo featuring three persistent “Data Daemons.” Users feed Daemons through drag-and-drop or dedicated AgentMail inboxes.   
  Gemini-powered analysis updates personality traits stored in Convex, while contextual “memories” are persisted in Hyperspell. A central Pet Manager         
  (“Summoner Agent”) orchestrates Daemon state and memories to brainstorm new ideas.                                                                          
                                                                                                                                                              
  Event-Driven Behavior: Use ordered events (feed ingested → analysis complete → trait delta applied → animation triggered).  
  Implement this pattern with React event emitters, Convex mutations, and subscription callbacks so every ingestion triggers the same deterministic chain of UI, animation, and persistence updates.                                                                                                                  
                                                                                                                                                              
  Goals:                                                                                                                                                      
  - Preserve the Unity event-driven loop across ingestion, analysis, trait deltas, evolution, and animations.                                                 
  - Provide high-fidelity PixiJS animations for each Daemon with seamless switching.                                                                          
  - Integrate Gemini for analysis, speech/roasts, evolution guidance, and name generation.                                                                    
  - Implement multi-Daemon architecture (three concurrent Daemons) with a dedicated switcher.                                                                 
  - Use AgentMail as the primary “feed-by-email” experience with inbox per Daemon.                                                                            
  - Use Convex as the authoritative, real-time store for Daemon state, feed history, and Pet Manager logs.                                                    
  - Use Hyperspell for long-term contextual memories per Daemon.                                                                                              
  - Build a Pet Manager surface that synthesizes Daemon traits and memories into creative output.                                                             
                                                                                                                                                              
  ## 2. Scope                                                                                                                                                 
                                                                                                                                                              
  In Scope:                                                                                                                                                   
  - Multi-Daemon UI with switcher, active Daemon canvas, trait panel, and feed history.                                                                       
  - Drag-and-drop ingestion targeting the active Daemon (validation, animation, backend orchestration).                                                       
  - AgentMail webhook integration with three provisioned inboxes and secure ingestion endpoint.                                                               
  - Gemini-backed analysis pipeline producing caption, roast, and trait deltas.                                                                               
  - Convex integration for Daemon records, feed history, brainstorm logs, and real-time subscriptions.                                                        
  - Hyperspell integration for contextual memory storage/retrieval.                                                                                           
  - Pet Manager UI and backend orchestration endpoint.                                                                                                        
  - Optional background removal, name generation, and Dev Mode diagnostics.                                                                                   
  - Observability across frontend, backend, and third-party services.                                                                                         
                                                                                                                                                        
                                                                                                                                                              
  ## 3. Canonical Traits & Stage Mechanics (Aligned)                                                                                                          
                                                                                                                                                              
  Trait keys (20) and definitions remain unchanged from the Unity baseline. Trait values are non-negative integers with deltas between 0 and 3 per feed.      
                                                                                                                                                              
  Stage progression (Egg → Baby → Teen → Adult), thresholds, and active trait display counts mirror Unity; Convex now stores state instead of in-memory/      
  localStorage.                                                                                                                                               
                                                                                                                                                              
  ## 4. Target Platforms                                                                                                                                      
                                                                                                                                                              
  - Browsers: Chrome ≥115, Edge ≥115, Firefox ≥115, Safari ≥16.                                                                                               
  - OS: Windows/macOS desktop primary.                                                                                                                        
  - Devices: Laptop/desktop with WebGL; mobile best-effort.                                                                                                   
                                                                                                                                                              
  ## 5. UX Flows                                                                                                                                              
                                                                                                                                                              
  Layout:                                                                                                                                                     
  - Top/Side: Daemon Switcher (tabs/icons) showing avatar, name, stage.                                                                                       
  - Left: PixiJS canvas rendering active Daemon, speech bubble, feed animations.                                                                              
  - Right: Trait panel driven by Convex data for the active Daemon.                                                                                           
  - Right (tabbed): Pet Manager view with “Brainstorm” button and streamed output pane.                                                                       
  - Bottom: File drop zone (active Daemon target) and feed history list.                                                                                      
  - Supplemental: Collapsible AgentMail panel listing Daemon inboxes and status.                                                                              
                                                                                                                                                              
  Flows:                                                                                                                                                      
  - Drag-and-Drop Feed: Drop file → validation → animation → POST `/analyze` (daemonId) → Gemini analysis → Convex trait update → Hyperspell memory write → UI
  updates via Convex subscription → speech bubble.                                                                                                            
  - Email Feed: Send email to daemonN@… → AgentMail webhook → POST `/feed-by-email` → shared analysis pipeline → Convex and Hyperspell updates → UI updates   
  via Convex subscription.                                                                                                                                    
  - Evolution: Convex threshold met → POST `/evolve` (daemonId) → sprite update, stage advancement, counter resets.                                           
  - Pet Manager Brainstorm: Open tab → click “Brainstorm” → POST `/pet-manager/brainstorm` → backend orchestrates Convex + Hyperspell data → Gemini prompt →  
  streamed response in UI.                                                                                                                                    
  - Settings: Toggles for Use Cloud AI, Background Removal, Dev Mode (no “Save Session Locally” toggle).                                                      
                                                                                                                                                              
  ## 6. Functional Requirements                                                                                                                               
                                                                                                                                                              
  ### 6.1 File Ingestion & Validation                                                                                                                         
  - Drag-and-drop/picker uses existing file validation (types, size, queue).                                                                                  
  - Email webhook `POST /feed-by-email` secured via shared secret/HMAC.                                                                                       
  - Webhook parses daemonId from `to` address; supports body + attachments (text/images).                                                                     
  - Invalid files return descriptive errors; valid ingestions reach analysis pipeline.                                                                        
                                                                                                                                                              
  ### 6.2 Pet State & Traits                                                                                                                                  
  - Convex stores Daemon records (`traits`, `stage`, `feedsSinceEvolution`, `satisfaction`, `name`, `spriteUrl`).                                             
  - Frontend uses Convex `useQuery` for live subscriptions; Zustand handles ephemeral UI state.                                                               
  - Daemon switching updates canvas, traits, and feed history instantly.                                                                                      
                                                                                                                                                              
  ### 6.3 Analysis Pipeline (AI)                                                                                                                              
  - Endpoints: `POST /analyze` and `POST /feed-by-email`.                                                                                                     
  - Inputs include `daemonId`, file/text payload, metadata.                                                                                                   
  - Idempotency: every ingestion carries a unique `feedId` (AgentMail `messageId` or client UUID); Convex mutations must no-op when that `feedId` already exists in `feeds`.                                                                                                    
  - Pipeline normalizes content (optional lightweight OCR), calls Gemini, and on success:                                                                     
    - Applies trait deltas/evolution checks via Convex mutation.                                                                                              
    - Creates Hyperspell memory `{ daemonId, caption, roast, source, contentType, timestamp }`.                                                               
    - Transitions the Convex feed record from `processing` to `completed`, stamping `completedAt`.                                                             
  - Failure handling:                                                                                                                                         
    - Mark feed records `errored`, capture `errorMessage`, and roll back optimistic trait deltas to keep Daemon state consistent.                              
    - Expose retry affordances in Dev Mode while suppressing duplicate downstream events; mock fallbacks are logged.                                          
  - Responses return JSON; optional text streaming for speech when time permits.                                                                              
                                                                                                                                                              
  ### 6.4 Evolution Pipeline                                                                                                                                  
  - Trigger thresholds identical to Unity.                                                                                                                    
  - `POST /evolve` accepts `daemonId`; updates Convex record, resets counters, writes feed event.                                                             
  - Optional background removal invoked when enabled; sprite URL saved in Convex.                                                                             
                                                                                                                                                              
  ### 6.5 Name Generation                                                                                                                                     
  - `POST /generate-name` accepts `daemonId`, traits, stage; stores returned name in Convex.                                                                  
                                                                                                                                                              
  ### 6.6 Background Removal (Optional)                                                                                                                       
  - Endpoint unchanged; invoked per evolution or manual action; stores result in Convex.                                                                      
                                                                                                                                                              
  ### 6.7 Speech & Roast                                                                                                                                      
  - Speech bubble tied to active Daemon; roasts logged in Convex feed history with source metadata.                                                           
                                                                                                                                                              
  ### 6.8 Settings & Toggles                                                                                                                                  
  - Available toggles: Use Cloud AI, Background Removal, Dev Mode.                                                                                            
  - Dev Mode displays payloads, Convex mutation traces, webhook logs.                                                                                         
                                                                                                                                                              
  ### 6.9 Pet Manager (Summoner Agent)                                                                                                                        
  - Endpoint: `POST /pet-manager/brainstorm` (optional `topic`).                                                                                              
  - Orchestration: fetch Convex Daemon records, pull recent Hyperspell memories per Daemon, build prompt, call Gemini, stream text back.                      
  - Output references each Daemon’s traits and memories; optionally stored in Convex `managerLogs`.                                                           
                                                                                                                                                              
  ## 7. Technical Architecture                                                                                                                                
                                                                                                                                                              
  Frontend (React + PixiJS + TS):                                                                                                                             
  - Build: Vite; integrates Convex client SDK.                                                                                                                
  - State: Convex `useQuery`/`useMutation` for persistent data; Zustand for ephemeral UI state.                                                               
  - Key components: `DaemonManager`, `DaemonSwitcher`, `PetCanvas`, `TraitsPanel`, `FeedHistory`, `PetManagerView`, `AgentMailInfo`, `DevModePanel`.          
                                                                                                                                                              
  Backend (FastAPI):                                                                                                                                          
  - Endpoints: `/analyze`, `/feed-by-email`, `/evolve`, `/generate-name`, `/remove-background`, `/pet-manager/brainstorm`, `/health`.                         
  - Integrations: Convex server client, Hyperspell client, AgentMail webhook, Gemini SDK/REST.                                                                
  - Uses structured logging with trace IDs; optional SSE/chunked streaming for long-running responses.                                                        
                                                                                                                                                              
  ### 7.1 Convex Responsibilities                                                                                                                             
                                                                                                                                                              
  - Authoritative storage for:                                                                                                                                
    - `daemons` collection (traits, stage, satisfaction, metadata, sprite URLs).                                                                              
    - `feeds` collection (ingestion events with source, trait deltas, roast summary).                                                                         
    - `managerLogs` collection (Pet Manager prompts/responses).                                                                                               
  - Real-time subscriptions driving frontend UI and animations.                                                                                               
  - Mutation layer applying trait deltas, enforcing stage thresholds, resetting counters, and writing audit metadata.                                         
  - Coordinating optimistic updates and providing deterministic ordering for the event-driven loop.                                                           
  - Excludes long-form memory (delegated to Hyperspell) and raw file payloads (discarded after processing).                                                   
                                                                                                                                                              
  ## 8. Data Contracts (JSON)                                                                                                                                 
                                                                                                                                                              
  `AnalysisResult`, `EvolutionResult`, `NameResult`, `Error` (unchanged).                                                                                     
                                                                                                                                                              
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

  Convex Feed Record                                                                                                                                          
                                                                                                                                                              
  {
    "_id": string,
    "feedId": string,
    "daemonId": string,
    "source": "email" | "drag-drop",
    "status": "processing" | "completed" | "errored",
    "contentSummary": string,
    "traitsDelta": Record<TraitKey, number>,
    "roast": string,
    "attachmentsMeta": any,
    "errorMessage"?: string,
    "createdAt": number,
    "startedAt": number,
    "completedAt": number | null
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
                                                                                                                                                              
  PetManagerOutput                                                                                                                                            
                                                                                                                                                              
  {                                                                                                                                                           
    "brainstormIdea": string,                                                                                                                                 
    "contributions": [                                                                                                                                        
      { "daemonName": string, "role": string, "highlight": string }                                                                                           
    ]                                                                                                                                                         
  }                                                                                                                                                           
                                                                                                                                                              
  ## 9. Prompt Builders                                                                                                                                       
                                                                                                                                                              
  - BuildAnalysisPrompt: unchanged (20 trait definitions, JSON-only output).                                                                                  
  - BuildNameGenerationPrompt: unchanged.                                                                                                                     
  - BuildPetManagerPrompt(daemons, memories, topic?): constructs persona summary for each Daemon, injects recent memories, optional topic, and requests       
    collaborative idea with contributions.                                                                                                                    
                                                                                                                                                              
  ## 10. Performance & Reliability                                                                                                                            
                                                                                                                                                              
  - Initial load <2.5 s; PixiJS canvas targets 60 fps.                                                                                                        
  - Convex query latency ≤200 ms; Daemon switch transitions <100 ms.                                                                                          
  - Gemini analysis <8 s typical; email ingest to UI <10 s end-to-end.                                                                                        
  - Retry strategy: single retry for Convex/Hyperspell mutations; circuit breaker to mock AI on repeated failures.                                            
  - AgentMail webhook queue supports replay; dedupe via message ID.                                                                                           
                                                                                                                                                              
  ## 11. Security & Privacy                                                                                                                                   
                                                                                                                                                              
  - AgentMail webhooks validated via shared secret/HMAC; rejected if invalid.
  - Rate limiting per endpoint, with stricter limits on /feed-by-email.
  - API keys stored server-side; frontend receives only necessary Convex config.
  - MIME enforcement: strip HTML content, reject non-whitelisted attachment types, and cap attachment size before persisting or forwarding to Gemini.
  - Vision calls run only against sanitized image buffers; executable and archive payloads are discarded.
  - File content sanitized and discarded after processing; only derived summaries stored.
  - Gemini prompts enforce safety guidelines; outputs filtered before display.
  - Audit logging for webhook events and Convex mutations with trace IDs.
                                                                                                                                                              
  ## 12. Accessibility & Localization                                                                                                                         
                                                                                                                                                              
  - Keyboard-accessible switcher, drop zone, and Pet Manager controls.                                                                                        
  - ARIA roles for tabs, speech bubbles, feed history.                                                                                                        
  - English UI with i18n scaffolding for future localization.                                                                                                 
                                                                                                                                                              
  ## 13. Observability                                                                                                                                        
                                                                                                                                                              
  - Frontend: Sentry for errors, analytics for Daemon switching, feed success rate, Convex subscription latency.                                              
  - Backend: structured logs (trace IDs, daemonId, latency), metrics for AI latency, webhook throughput, Convex mutation duration, Hyperspell errors.         
  - Dashboard: webhook success/failure counts, retry logs, brainstorm usage.                                                                                  
                                                                                                                                                              
  ## 14. Testing & Acceptance Criteria                                                                                                                        
                                                                                                                                                              
  Unit:                                                                                                                                                       
                                                                                                                                                              
  - Convex mutation helpers (trait application, evolution resets).                                                                                            
  - AgentMail parser (daemonId extraction, MIME handling).                                                                                                    
  - Pet Manager prompt builder and schema validation.                                                                                                         
  - Hyperspell client formatting.                                                                                                                             
                                                                                                                                                              
  Integration:                                                                                                                                                

  - Drag-and-drop flow with mock AI → Convex update → Hyperspell write → UI update.                                                                           
  - Email webhook flow with mocked AgentMail payload → UI update via Convex.                                                                                  
  - Brainstorm endpoint returning structured output referencing all Daemons.                                                                                  
                                                                                                                                                              
  E2E (Playwright/Cypress):                                                                                                                                   
                                                                                                                                                              
  - Switch among three Daemons; trait bars differ.                                                                                                            
  - Drag feed to Daemon 1 → only Daemon 1 traits update.                                                                                                      
  - Email to Daemon 2 inbox → UI updates automatically.                                                                                                       
  - Brainstorm output references traits/memories from every Daemon.                                                                                           
                                                                                                                                                              
  Acceptance:                                                                                                                                                 
                                                                                                                                                              
  - Convex is single source of truth; UI reflects updates within 1 s.
  - Each successful feed creates Convex feed record and Hyperspell memory.                                                                                    
  - Brainstorm completes within 10 s, citing each Daemon by name/trait.                                                                                       
                                                                                                                                                              
  ## 15. Risks & Mitigations                                                                                                                                  
                                                                                                                                                              
  - Service integration complexity → start with mocks, add services sequentially, use feature flags.                                                          
  - Real-time sync confusion → rely on Convex ordering, expose Dev Mode diagnostics.                                                                          
  - Webhook reliability → verify signatures, rate-limit, log all requests, support replay.                                                                    
  - Vendor latency/outages → provide mock fallbacks for Gemini/Hyperspell, queue AgentMail events.                                                            
  - Multi-agent UX overload → clear switcher states, feed history filters, persona summaries.                                                                 
                                                                                                                                                              
  ## 16. Milestones & Timeline (MVP)                                                                                                                          
                                                                                                                                                              
  Week 1 – Persistent Core:                                                                                                                                   
                                                                                                                                                              
  - FastAPI scaffold; Convex schema/mutations with mock data.
  - /analyze wired to mock Gemini; updates Convex for selected daemonId.
  - React + PixiJS + Convex client; Daemon switcher and trait panel wired.
  - Service mocks: local AgentMail payload fixtures plus Hyperspell/Gemini stubs validate event ordering before live credentials.
                                                                                                                                                              
  Goal: Drag-and-drop updates Convex state for active Daemon in real time.                                                                                    
                                                                                                                                                              
  Week 2 – Inputs & Memory:                                                                                                                                   
                                                                                                                                                              
  - AgentMail webhook integration; email feeds reuse analysis logic.                                                                                          
  - Hyperspell memory writes for both ingestion paths.                                                                                                        
  - UI: feed history with source badges; AgentMail instructions panel.                                                                                        
                                                                                                                                                              
  Goal: Emailing daemon2@… updates Daemon 2 traits/memories without page refresh.                                                                             
                                                                                                                                                              
  Week 3 – Summoner & Polish:                                                                                                                                 

  - /pet-manager/brainstorm orchestration (Convex + Hyperspell + Gemini).                                                                                     
  - Pet Manager UI with streaming output and error handling.                                                                                                  
  - PixiJS animation polish, Dev Mode enhancements, telemetry wiring.                                                                                         
                                                                                                                                                              
  Goal: Brainstorm yields creative idea referencing live traits/memories.                                                                                     
                                                                                                                                                              
  ## 17. Open Questions                                                                                                                                       
                                                                                                                                                              
  - AgentMail SLA and retry budget—confirm sandbox credentials and throughput.                                                                                
  - Hyperspell retention policy and quota management.                                                                                                         
  - Final brainstorm response format (streamed text vs. structured JSON) prior to Week 3 build.                                                               
  - Naming conventions for public Daemon inboxes for demo audiences.                                                                                          
                                                                                                                                                              
  ## 18. Stretch Goals (Post-MVP)                                                                                                                             
                                                                                                                                                              
  - Account management, advanced authentication, or cross-user Daemon persistence beyond session scope.     
