import { create } from 'zustand'

type SettingsStore = {
  mockMode: boolean
  apiBaseUrl: string
  setMockMode: (v: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  mockMode: true,
  apiBaseUrl: 'http://localhost:8000',
  setMockMode: (v) => set({ mockMode: v }),
}))