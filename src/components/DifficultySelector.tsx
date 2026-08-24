import { motion } from 'framer-motion'

export type Difficulty = 'easy' | 'medium' | 'hard'

interface DifficultySelectorProps {
  difficulty: Difficulty
  onChange: (d: Difficulty) => void
}

const LEVELS: { key: Difficulty; label: string; color: string }[] = [
  { key: 'easy', label: 'Easy', color: '#22c55e' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'hard', label: 'Hard', color: '#ef4444' },
]

export default function DifficultySelector({ difficulty, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 shadow-sm">
      {LEVELS.map((level) => (
        <button
          key={level.key}
          onClick={() => onChange(level.key)}
          className={`relative px-2.5 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold transition-colors ${
            difficulty === level.key
              ? 'text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {difficulty === level.key && (
            <motion.div
              layoutId="difficulty-pill"
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: level.color }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{level.label}</span>
        </button>
      ))}
    </div>
  )
}
