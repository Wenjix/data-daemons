import { create } from 'zustand'

type UIStore = {
  detailOpen: boolean
  openDetail: () => void
  closeDetail: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  detailOpen: false,
  openDetail: () => set({ detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
}))