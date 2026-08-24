import { RotateCcw } from 'lucide-react'
import ModeSelector, { type GameMode } from './ModeSelector'
import DifficultySelector, { type Difficulty } from './DifficultySelector'
import { useSound } from '../hooks/useSound'

interface ActionBarProps {
  mode: GameMode
  difficulty: Difficulty
  onModeChange: (m: GameMode) => void
  onDifficultyChange: (d: Difficulty) => void
  onRestart: () => void
}

export default function ActionBar({
  mode,
  difficulty,
  onModeChange,
  onDifficultyChange,
  onRestart,
}: ActionBarProps) {
  const { playClick } = useSound()

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 shrink-0">
      <ModeSelector mode={mode} onChange={(m) => { playClick(); onModeChange(m) }} />
      {mode === 'pvai' && (
        <DifficultySelector difficulty={difficulty} onChange={(d) => { playClick(); onDifficultyChange(d) }} />
      )}
      <button
        onClick={() => {
          playClick()
          onRestart()
        }}
        className="tap-target gap-1.5 px-4 py-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold shadow-sm hover:shadow-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <RotateCcw size={14} />
        <span>Restart</span>
      </button>
    </div>
  )
}
