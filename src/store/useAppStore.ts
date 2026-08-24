import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: 'light' | 'dark'
  soundEnabled: boolean
  toggleTheme: () => void
  toggleSound: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      soundEnabled: true,
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light'
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { theme: newTheme }
        }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: 'pocket-puzzles-settings',
    }
  )
)

// Apply theme on initial load
const savedSettings = localStorage.getItem('pocket-puzzles-settings')
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings)
    if (parsed?.state?.theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } catch {
    // ignore
  }
} else {
  document.documentElement.classList.add('dark')
}
