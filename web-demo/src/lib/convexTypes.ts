// Types mirrored from server/schemas.py and PRD data contracts

export type TraitKey =
  | 'Intelligence'
  | 'Creativity'
  | 'Empathy'
  | 'Resilience'
  | 'Curiosity'
  | 'Humor'
  | 'Kindness'
  | 'Confidence'
  | 'Discipline'
  | 'Honesty'
  | 'Patience'
  | 'Optimism'
  | 'Courage'
  | 'OpenMindedness'
  | 'Prudence'
  | 'Adaptability'
  | 'Gratitude'
  | 'Ambition'
  | 'Humility'
  | 'Playfulness'

export type PersonalityTraits = {
  values: Record<TraitKey, number>
  active: TraitKey[]
}

export type TraitDelta = {
  trait: TraitKey
  delta: number // [0..3]
}

export type EvolutionStage = 'Egg' | 'Baby' | 'Teen' | 'Adult'
export type EvolutionStageCode = 0 | 1 | 2 | 3

export const stageCodeToName = (code: EvolutionStageCode): EvolutionStage => {
  return ['Egg', 'Baby', 'Teen', 'Adult'][code]
}

export const stageNameToCode = (name: EvolutionStage): EvolutionStageCode => {
  return { Egg: 0, Baby: 1, Teen: 2, Adult: 3 }[name]
}

export const feedCountThreshold = (stage: EvolutionStage | EvolutionStageCode): number => {
  const code = typeof stage === 'number' ? stage : stageNameToCode(stage)
  if (code === 0) return 5
  if (code === 1) return 8
  if (code === 2) return 12
  return 12
}

// Convex Daemon Record (PRD)
export type DaemonRecord = {
  _id: string
  name: string
  stage: number // 0 Egg, 1 Baby, 2 Teen, 3 Adult
  traits: Record<TraitKey, number>
  feedsSinceEvolution: number
  satisfaction: number
  spriteUrl: string
  lastUpdated: number
  archetypeId?: string
  topTraits?: string[]
  lastArchetypeUpdate?: number
}

export type FeedStatus = 'processing' | 'completed' | 'errored'
export type FeedSource = 'email' | 'drag-drop'

// Convex Feed Record (PRD)
export type FeedRecord = {
  _id: string
  feedId: string
  daemonId: string
  source: FeedSource
  status: FeedStatus
  contentSummary: string
  traitsDelta: Record<TraitKey, number>
  roast: string
  attachmentsMeta: any
  errorMessage?: string
  createdAt: number
  startedAt: number
  completedAt: number | null | undefined
}

// Manager Logs
export type ManagerLog = {
  _id: string
  brainstormIdea: string
  contributions: { daemonName: string; role: string; highlight: string }[]
  createdAt: number
}

// Server request/response models (mirror server/schemas.py)
export type AnalyzeRequest = {
  fileName?: string
  fileType?: string
  fileDescription?: string
  text?: string
  imageUrl?: string
  imageBase64?: string
  currentTraits: PersonalityTraits
  dominantTrait?: TraitKey
  currentArchetypeId?: string
}

export type AnalyzeResponse = {
  caption?: string
  tags: string[]
  roast?: string
  traitDeltas: TraitDelta[]
  newArchetypeId?: string
  topTraits?: string[]
}

export type PetState = {
  petId?: string
  petName?: string
  evolutionStage: EvolutionStage
  currentSpriteUrl?: string
  personalityTraits: PersonalityTraits
  feedsSinceEvolution: number
  satisfactionMeter: number
  activeTraitCount: number
  generationPrompt?: string
}

export type EvolveRequest = { petState: PetState }
export type SpriteData = { spriteUrl?: string; silhouetteUrl?: string; metadata: Record<string, string> }
export type EvolveResponse = { nextStage: EvolutionStage; spriteData: SpriteData }

export type GenerateNameRequest = { petState: PetState }
export type GenerateNameResponse = { name: string; rationale?: string }

export type RemoveBackgroundRequest = { imageUrl?: string; imageBase64?: string }
export type RemoveBackgroundResponse = { resultUrl?: string; notes?: string }