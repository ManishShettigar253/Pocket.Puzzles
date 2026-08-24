import { motion } from 'framer-motion'
import { Users, Bot } from 'lucide-react'

export type GameMode = 'pvp' | 'pvai'

interface ModeSelectorProps {
  mode: GameMode
  onChange: (mode: GameMode) => void
}

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 shadow-sm">
      <ModeButton
        active={mode === 'pvai'}
        onClick={() => onChange('pvai')}
        icon={<Bot size={16} />}
        label="vs AI"
      />
      <ModeButton
        active={mode === 'pvp'}
        onClick={() => onChange('pvp')}
        icon={<Users size={16} />}
        label="PvP"
      />
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
        active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {active && (
        <motion.div
          layoutId="mode-pill"
          className="absolute inset-0 bg-primary-600 rounded-xl"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  )
}
