# Data Daemons Visual Design Spec

## Context & Goals
- Anchor the multi-daemon UX to PRD v2.3 requirements, especially AgentMail-first feeding (PRD.md:10,22,61,66) and event-driven state sync (PRD.md:15).
- Communicate hybrid mythic-tech identity: dragon-egg organic forms fused with cyberpunk circuitry inspired by My Daemon, Shin Megami Tensei Digital Devil Saga, and Daenerys dragon eggs.
- Keep every HUD element justifiable for the data-ingestion gameplay loop (drag and drop, email feed, trait deltas, Pet Manager synthesis).

## Visual DNA
- Palette: obsidian #0c0f12 base, void teal #06545e, ember magenta #d94b8a, spectral cyan #6ff4ff, pearlescent gold #f2c572; gradients blend ember-to-cyan.
- Materials: brushed dark metal with rune etching, translucent resin eggshells, neon filament conduits, volumetric teal fog.
- Typography: Orbitron 600 for ritual headers; Source Sans (or similar humanist sans) 400/600 for body and metrics with tabular numerals.

## Screen Blueprints
### Summoning Hub
- Twelve-column layout; central PixiJS daemon canvas at sixty-four percent width, parallax cathedral circuitry backdrop.
- Three daemon pedestals arranged triangularly around the summoner console; inactive pedestals at sixty percent scale, active at one hundred ten percent with holo overlay.
- Inbox Egg control per daemon: faceted ovoid housing an abstract envelope rune, idle cyan pulse; hover reveals tooltip "Send to daemonN@..." and copy button.
- Feed timeline cards sit in the left rail with source badges (Drag, Email, Summoner) and express state transitions (ingested -> analysis -> traits -> animation).

### Daemon Detail
- Split layout: left holo-diagram (layered SVG or Pixi overlays for armor modules and temperament aura), right rune-ring sliders for behavior tuning.
- Inbox panel reiterates email address, last AgentMail feed meta, quick link to upload modal.
- Tabs for Lore, Abilities, Equipment with scroll shadows and animated sigils.

### Battle Prep and Team Synergy
- Top mission timeline with phase nodes; center card carousel for daemon formations; bottom quick-action chips for buffs.
- Triangular synergy map connecting daemons; filaments glow along edges when Convex feed events trigger shared buffs.

### Pet Manager Terminal
- Ritual console for synthesis output; vertical nav pillar on left, stream window on right for Gemini-generated brainstorm with error banners.
- Dev Mode panel collapses into side drawer exposing feed timeline and webhook payloads per PRD sections nine and thirteen.

## Component System
- Design tokens:
  - Radii: pedestals 32px, panels 16px; spacing scale 4/8/16/24/40.
  - Shadow: altar 0 20px 60px rgba(6,84,94,0.35); focus ring 2px cyan outer plus 1px dark offset.
  - Durations: quick 150ms, summon 600ms cubic-bezier(.23,1,.32,1).
- Buttons: primary pill (56px) with gradient stroke magenta-to-cyan, inner glow on hover; secondary etched ghost.
- Cards: glassmorphic backdrop with 1px bright rim, accent bar keyed to daemon archetype color.
- Inbox Glyph: combined cracked egg silhouette plus minimal envelope fold; stroke color matches daemon alignment; includes unread badge (Convex subscription) and live-region updates.
- ProgressGlyph: conic gradient ring with inner rune; colors shift cyan (analysis), magenta (mutation), gold (success).
- HUD Chips: 40px tokens showing stat deltas; include icon, label, value

## Interaction and Motion
- Summon animation: egg cracks emit neon shards (300ms) followed by energy beam forming daemon silhouette; reduced-motion swaps for opacity fade.
- Hover states ignite glyph outlines, add subtle heartbeat scale (1.03) and low-frequency vibration audio cue.
- New email arrival: inbox egg pulses cyan-to-magenta arc, feed timeline card slides in from left with 150ms delay and "AgentMail" badge.
- Drag and drop ingestion: drop zone lights amber, line art rotates fifteen degrees; on success, conduit flickers along path to active daemon.

## Multi-Agent Orchestration
- **Synergy Overload**: Merge Sigil CTA appears near the synergy map once Convex reports two or more daemons with complementary trait deltas inside a ten-second window. Activating it launches a three-stage animation—(1) conduits flare along each daemon pedestal, (2) data orbs lift into the central glyph, (3) combined insight beams into the Pet Manager console. UI cards summarize the contribution from Echo, Pixel, and Nova, and a streaming Gemini summary renders in the console. For reduced motion, swap particle arcs for opacity fades. Keyboard focus lands on the Merge Sigil button with space/enter triggering the sequence; a live region narrates “Synergy overload initiated...complete.”
- **Conversational Chorus**: Dedicated panel beside the Pet Manager terminal showing call-and-response bubbles. When the manager submits a prompt, Echo kicks off (blue bubble, waveform icon), Pixel continues (magenta voxels icon), Nova concludes (gold nebula icon). Threads animate sequentially with 200ms staggering so players perceive the hand-off. Each bubble exposes a “Send follow-up” micro button that routes attachments or text back to that daemon’s inbox. Screen reader labels announce order, e.g., “Echo response 1 of 3.” This panel persists feed references by linking bubble footers to the originating feed ID in Feed History.
- **Cast Hyperspell**: Ritual control inside the Pet Manager terminal footer for offloading or compacting memory context to Hyperspell as outlined in PRD.md. The button unlocks after a daemon accumulates more than five active memory nodes; on activation a containment ring contracts around the chosen daemon egg, particles funnel into a stasis shard, and UI toasts confirm “Context sealed to Hyperspell.” A log entry is added to the Dev Mode panel referencing the memory bundle ID, and the daemon’s aura shifts to a subdued tone until new context arrives. Provide undo within ten seconds, with the button regaining focus after the sequence. Reduced motion: show progress bar fill instead of swirl animation.

## Accessibility and Implementation Notes
- Maintain 4.5:1 contrast for text; provide colorblind-safe patterns on glyph backgrounds (crosshatch or dotted).
- ARIA: inbox eggs exposed as interactive buttons with labels "Email daemon name - press enter to copy address," live region announces "New mail ingested for daemon name."
- Keyboard: arrow keys cycle daemon pedestals, Enter opens detail view, Shift+Enter focuses AgentMail panel copy CTA (PRD.md:12).
- State management: Convex subscriptions drive unread counts and feed history; Zustand handles transient animations (PRD.md:83,126).
- Reliability surfacing: on AgentMail retries or queue delays, pedestals show crimson rim plus tooltip referencing webhook status (PRD.md:214,263).
- Performance guardrails: ensure Pixi canvas stays under 60fps by rendering inbox glyphs in UI layer; offload heavy effects to shader cache (PRD.md:210).
