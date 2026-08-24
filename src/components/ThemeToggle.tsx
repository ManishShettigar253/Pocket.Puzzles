import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useSound } from '../hooks/useSound'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore()
  const { playClick } = useSound()

  return (
    <button
      onClick={() => {
        playClick()
        toggleTheme()
      }}
      className="tap-target relative w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all overflow-hidden"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Moon size={18} className="text-indigo-300" />
        ) : (
          <Sun size={18} className="text-amber-500" />
        )}
      </motion.div>
    </button>
  )
}
