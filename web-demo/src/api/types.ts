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

export type TraitDelta = { trait: TraitKey; delta: number }

export type PersonalityTraits = {
  values: Record<TraitKey, number>
  active: TraitKey[]
}

export type AnalyzeRequest = {
  fileName?: string
  fileType?: string
  fileDescription?: string
  text?: string
  imageUrl?: string
  imageBase64?: string
  currentTraits: PersonalityTraits
  dominantTrait?: TraitKey
}

export type AnalyzeResponse = {
  caption?: string
  tags: string[]
  roast?: string
  traitDeltas: TraitDelta[]
}