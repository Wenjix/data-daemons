import { create } from 'zustand'
import type { Id } from '../../../convex/_generated/dataModel'

export type EvolutionStage = 'Egg' | 'Baby' | 'Teen' | 'Adult'

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

type PersonalityTraits = {
  values: Record<TraitKey, number>
  active: TraitKey[]
}

type PetState = {
  petName?: string
  evolutionStage: EvolutionStage
  satisfactionMeter: number
  feedsSinceEvolution: number
  personalityTraits: PersonalityTraits
}

type IdleMusing = {
  message: string
  trait: string
  timestamp: number
}

type PetStore = PetState & {
  setRoast: (roast: string | undefined) => void
  roast?: string
  applyTraitDeltas: (deltas: { trait: TraitKey; delta: number }[]) => void
  feedCountThreshold: (stage: EvolutionStage) => number
  activeDaemonId?: Id<"daemons">
  setActiveDaemonId: (id: Id<"daemons">) => void
  idleMusings: Record<string, IdleMusing>
  setIdleMusing: (daemonId: string, musing: IdleMusing) => void
  clearIdleMusing: (daemonId: string) => void
  lastFeedTimes: Record<string, number>
  setLastFeedTime: (daemonId: string, time: number) => void
}

const initialValues: Record<TraitKey, number> = {
  Intelligence: 0,
  Creativity: 0,
  Empathy: 0,
  Resilience: 0,
  Curiosity: 0,
  Humor: 0,
  Kindness: 0,
  Confidence: 0,
  Discipline: 0,
  Honesty: 0,
  Patience: 0,
  Optimism: 0,
  Courage: 0,
  OpenMindedness: 0,
  Prudence: 0,
  Adaptability: 0,
  Gratitude: 0,
  Ambition: 0,
  Humility: 0,
  Playfulness: 0,
}

export const usePetStore = create<PetStore>((set, get) => ({
  petName: undefined,
  evolutionStage: 'Egg',
  satisfactionMeter: 0,
  feedsSinceEvolution: 0,
  personalityTraits: { values: initialValues, active: [] },
  roast: undefined,
  activeDaemonId: undefined,
  idleMusings: {},
  lastFeedTimes: {},
  setActiveDaemonId: (id) => set({ activeDaemonId: id }),
  setRoast: (roast) => set({ roast }),
  setIdleMusing: (daemonId, musing) => {
    const musings = { ...get().idleMusings }
    musings[daemonId] = musing
    set({ idleMusings: musings })
  },
  clearIdleMusing: (daemonId) => {
    const musings = { ...get().idleMusings }
    delete musings[daemonId]
    set({ idleMusings: musings })
  },
  setLastFeedTime: (daemonId, time) => {
    const times = { ...get().lastFeedTimes }
    times[daemonId] = time
    set({ lastFeedTimes: times })
  },
  feedCountThreshold: (stage) => {
    if (stage === 'Egg') return 5
    if (stage === 'Baby') return 8
    if (stage === 'Teen') return 12
    return 12
  },
  applyTraitDeltas: (deltas) => {
    const current = { ...get().personalityTraits.values }
    for (const d of deltas) {
      current[d.trait as TraitKey] = Math.max(0, (current[d.trait as TraitKey] || 0) + d.delta)
    }
    set({ personalityTraits: { values: current, active: get().personalityTraits.active } })
  },
}))