import { create } from 'zustand'

type ContextState = 'loaded' | 'cleared'
type MemoryState = 'contextual' | 'recalled'

interface MagicStore {
  contextState: ContextState
  memoryState: MemoryState
  agentifyState: boolean
  toggleContext: () => void
  toggleMemory: () => void
  toggleAgentify: () => void
}

export const useMagicStore = create<MagicStore>((set) => ({
  // Initial states: Context is Loaded, Memory is Contextual, Agentify is inactive
  contextState: 'loaded',
  memoryState: 'contextual',
  agentifyState: false,

  // Toggle context between 'loaded' and 'cleared'
  toggleContext: () =>
    set((state) => ({
      contextState: state.contextState === 'loaded' ? 'cleared' : 'loaded',
    })),

  // Toggle memory between 'contextual' and 'recalled'
  toggleMemory: () =>
    set((state) => ({
      memoryState: state.memoryState === 'contextual' ? 'recalled' : 'contextual',
    })),

  // Toggle agentify effect
  toggleAgentify: () =>
    set((state) => ({
      agentifyState: !state.agentifyState,
    })),
}))
