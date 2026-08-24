import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSound } from '../hooks/useSound'
import ModeSelector, { type GameMode } from './ModeSelector'
import DifficultySelector, { type Difficulty } from './DifficultySelector'

interface TopBarProps {
  title: string
  showBack?: boolean
  turnIndicator?: {
    label: string
    color: string
  } | null
  // Game settings
  mode?: GameMode
  difficulty?: Difficulty
  onModeChange?: (m: GameMode) => void
  onDifficultyChange?: (d: Difficulty) => void
  onRestart?: () => void
  showSettings?: boolean
}

export default function TopBar({
  title,
  showBack = true,
  turnIndicator,
  mode,
  difficulty,
  onModeChange,
  onDifficultyChange,
  onRestart,
  showSettings = true,
}: TopBarProps) {
  const navigate = useNavigate()
  const { soundEnabled, toggleSound } = useAppStore()
  const { playClick } = useSound()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="shrink-0">
      {/* Main bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => {
                playClick()
                navigate('/')
              }}
              className="tap-target rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] w-9 h-9 shadow-sm active:scale-90 transition-transform"
              aria-label="Back to hub"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h1 className="text-base font-extrabold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          {turnIndicator && (
            <motion.div
              key={turnIndicator.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${turnIndicator.color}20`,
                color: turnIndicator.color,
                border: `1.5px solid ${turnIndicator.color}40`,
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: turnIndicator.color }}
              />
              {turnIndicator.label}
            </motion.div>
          )}
          {showSettings && onRestart && (
            <button
              onClick={() => {
                playClick()
                setSettingsOpen(!settingsOpen)
              }}
              className={`tap-target rounded-xl w-9 h-9 shadow-sm transition-all ${
                settingsOpen
                  ? 'bg-primary-600 text-white border border-primary-500'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)]'
              }`}
              aria-label="Settings"
            >
              <motion.div animate={{ rotate: settingsOpen ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Settings size={16} />
              </motion.div>
            </button>
          )}
          <button
            onClick={() => {
              playClick()
              toggleSound()
            }}
            className="tap-target rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] w-9 h-9 shadow-sm active:scale-90 transition-transform"
            aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Settings tray - slides down */}
      <AnimatePresence>
        {settingsOpen && onRestart && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 px-3 pb-3 flex-nowrap overflow-x-auto hide-scrollbar w-full">
              {mode !== undefined && onModeChange && (
                <div className="shrink-0">
                  <ModeSelector mode={mode} onChange={(m) => { playClick(); onModeChange(m) }} />
                </div>
              )}
              {mode === 'pvai' && difficulty !== undefined && onDifficultyChange && (
                <div className="shrink-0">
                  <DifficultySelector difficulty={difficulty} onChange={(d) => { playClick(); onDifficultyChange(d) }} />
                </div>
              )}
              <button
                onClick={() => {
                  playClick()
                  onRestart()
                }}
                className="tap-target shrink-0 flex items-center justify-center aspect-square h-[38px] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm active:scale-90 transition-transform text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Restart Game"
                aria-label="Restart Game"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
