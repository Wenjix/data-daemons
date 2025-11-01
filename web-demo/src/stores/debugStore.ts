import { create } from 'zustand';

type VisualStyle = 'default' | 'memphis';

interface DebugState {
  visualStyle: VisualStyle;
  isMenuOpen: boolean;
  setVisualStyle: (style: VisualStyle) => void;
  toggleMenu: () => void;
}

const STORAGE_KEY = 'debug-visual-style';

// Load persisted visual style from localStorage
const loadPersistedStyle = (): VisualStyle => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'memphis' || stored === 'default') {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to load visual style from localStorage:', e);
  }
  return 'memphis';
};

// Persist visual style to localStorage
const persistStyle = (style: VisualStyle) => {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch (e) {
    console.warn('Failed to persist visual style to localStorage:', e);
  }
};

export const useDebugStore = create<DebugState>((set) => ({
  visualStyle: loadPersistedStyle(),
  isMenuOpen: false,

  setVisualStyle: (style: VisualStyle) => {
    persistStyle(style);
    set({ visualStyle: style });
  },

  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
}));
