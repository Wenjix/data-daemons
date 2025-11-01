import { create } from 'zustand'
import type { Id } from '../../../convex/_generated/dataModel'

type UIStore = {
  detailOpen: boolean
  openDetail: () => void
  closeDetail: () => void
  chatOpen: boolean
  activeChatDaemonId: Id<'daemons'> | null
  openChat: (daemonId: Id<'daemons'>) => void
  closeChat: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  detailOpen: false,
  openDetail: () => set({ detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  chatOpen: false,
  activeChatDaemonId: null,
  openChat: (daemonId) => set({ chatOpen: true, activeChatDaemonId: daemonId }),
  closeChat: () => set({ chatOpen: false, activeChatDaemonId: null }),
}))