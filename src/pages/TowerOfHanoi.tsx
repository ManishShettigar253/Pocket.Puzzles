import { useState, useEffect } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Settings, Undo2, Lightbulb, Timer as TimerIcon, Hash, BookOpen, X } from 'lucide-react'
import Layout from '../components/Layout'
import GameEndModal from '../components/GameEndModal'
import ConfirmExitModal from '../components/ConfirmExitModal'
import { useTowerOfHanoi } from '../hooks/useTowerOfHanoi'
import { useStats } from '../hooks/useStats'
import { useSound } from '../hooks/useSound'

const DISK_COLORS = [
  'from-rose-400 to-pink-500 shadow-rose-500/30',
  'from-amber-400 to-orange-500 shadow-amber-500/30',
  'from-emerald-400 to-teal-500 shadow-emerald-500/30',
  'from-cyan-400 to-blue-500 shadow-cyan-500/30',
  'from-violet-400 to-purple-500 shadow-violet-500/30',
  'from-fuchsia-400 to-pink-600 shadow-fuchsia-500/30',
  'from-indigo-400 to-cyan-500 shadow-indigo-500/30',
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function TowerOfHanoi() {
  const navigate = useNavigate()
  const {
    pegs,
    selectedPeg,
    moves,
    minMoves,
    diskCount,
    pegCount,
    isWon,
    isLost,
    maxMoves,
    timer,
    invalidMovePeg,
    handlePegClick,
    undo,
    reset,
    setDiskCount,
    setPegCount,
    getHint,
    canUndo,
  } = useTowerOfHanoi(4, 3)

  const { recordResult } = useStats('tower-of-hanoi')
  const { playClick, playWin, playLose } = useSound()

  const [settingsOpen, setSettingsOpen] = useState(true)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Track stats on win or loss
  useEffect(() => {
    if (isWon) {
      recordResult('win')
      playWin()
    } else if (isLost) {
      recordResult('loss')
      playLose()
    }
  }, [isWon, isLost, recordResult, playWin, playLose])

  // Prevent accidental exits when in progress
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      moves > 0 && !isWon && !isLost && currentLocation.pathname !== nextLocation.pathname
  )

  const handleBack = () => {
    playClick()
    if (moves > 0 && !isWon && !isLost) {
      setShowExitConfirm(true)
    } else {
      navigate('/')
    }
  }

  const handleShowHint = () => {
    playClick()
    const nextHint = getHint()
    if (nextHint) {
      setHint(nextHint)
      setTimeout(() => setHint(null), 2500)
    }
  }

  const handleReset = () => {
    playClick()
    setHint(null)
    reset()
  }

  const handlePegTap = (index: number) => {
    playClick()
    setHint(null)
    handlePegClick(index)
  }

  return (
    <Layout className="flex flex-col overflow-hidden h-[100dvh]">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-3 pt-2.5 pb-1">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] active:scale-90 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-lg font-black bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 bg-clip-text text-transparent tracking-tight">
          Tower of Hanoi
        </h1>

        <button
          onClick={() => {
            playClick()
            setSettingsOpen(!settingsOpen)
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-90 ${
            settingsOpen
              ? 'bg-violet-600 text-white border border-violet-500 shadow-violet-900/40'
              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
          }`}
          aria-label="Settings"
        >
          <motion.div animate={{ rotate: settingsOpen ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Settings size={18} />
          </motion.div>
        </button>
      </div>

      {/* ── Settings Drawer ── */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden px-3 pb-2 shrink-0 z-20"
          >
            <div className="flex flex-col gap-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 shadow-lg">
              {/* Number of Disks */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Disks:</span>
                <div className="flex items-center gap-1">
                  {[3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        playClick()
                        setDiskCount(num)
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        diskCount === num
                          ? 'bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md'
                          : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Towers/Pegs */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Towers:</span>
                <div className="flex items-center gap-1">
                  {[
                    { count: 3, label: '3 Towers (Classic)' },
                    { count: 4, label: '4 Towers' },
                  ].map(({ count, label }) => (
                    <button
                      key={count}
                      onClick={() => {
                        playClick()
                        setPegCount(count)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        pegCount === count
                          ? 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-md'
                          : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Reset, Hint, Rules */}
              <div className="flex gap-2 pt-1 border-t border-[var(--border-color)]">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors active:scale-95"
                >
                  <RotateCcw size={14} />
                  <span>Restart</span>
                </button>

                {pegCount === 3 && (
                  <button
                    onClick={handleShowHint}
                    disabled={isWon}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors disabled:opacity-40 active:scale-95"
                  >
                    <Lightbulb size={14} />
                    <span>Hint</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    playClick()
                    setRulesOpen(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors active:scale-95"
                >
                  <BookOpen size={14} />
                  <span>Rules</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats & Actions Bar ── */}
      <div className="shrink-0 px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Moves & Max Moves */}
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-3 py-1.5 shadow-sm">
          <Hash size={14} className={moves >= maxMoves - 2 ? 'text-rose-400' : 'text-amber-400'} />
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Moves:</span>
            <span className={`text-sm font-black tabular-nums ${moves >= maxMoves - 2 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-[var(--text-primary)]'}`}>
              {moves}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold">/ {maxMoves} max</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-3 py-1.5 shadow-sm">
          <TimerIcon size={14} className="text-cyan-400" />
          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{formatTime(timer)}</span>
        </div>

        {/* Undo Button */}
        <button
          onClick={() => {
            playClick()
            undo()
          }}
          disabled={!canUndo}
          className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-3 py-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Undo move"
        >
          <Undo2 size={15} />
          <span>Undo</span>
        </button>
      </div>

      {/* ── Main Playing Area ── */}
      <div className="flex-1 flex flex-col justify-end px-3 pb-6 select-none relative min-h-0">

        {/* Hint banner */}
        <AnimatePresence>
          {hint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-0 right-0 mx-auto w-fit flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-md z-30"
            >
              <Lightbulb size={14} />
              <span>Hint: Move from Tower {hint.from + 1} to Tower {hint.to + 1}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pegs Grid */}
        <div className="grid gap-2 items-end h-[380px] relative z-10" style={{ gridTemplateColumns: `repeat(${pegCount}, minmax(0, 1fr))` }}>
          {pegs.map((peg, pegIndex) => {
            const isSelected = selectedPeg === pegIndex
            const isInvalid = invalidMovePeg === pegIndex
            const isHintSource = hint?.from === pegIndex
            const isHintDest = hint?.to === pegIndex

            return (
              <motion.div
                key={pegIndex}
                onClick={() => handlePegTap(pegIndex)}
                animate={isInvalid ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`relative flex flex-col items-center justify-end h-full rounded-2xl cursor-pointer p-1.5 transition-all ${
                  isSelected
                    ? 'bg-violet-500/10 ring-2 ring-violet-500'
                    : isHintDest
                    ? 'bg-emerald-500/10 ring-2 ring-emerald-500 animate-pulse'
                    : isHintSource
                    ? 'bg-amber-500/10 ring-2 ring-amber-500 animate-pulse'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Vertical Pole */}
                <div
                  className={`absolute bottom-2 w-3 rounded-t-full transition-colors ${
                    isSelected
                      ? 'bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.5)]'
                      : isHintDest
                      ? 'bg-emerald-400'
                      : 'bg-zinc-600 dark:bg-zinc-700'
                  }`}
                  style={{ height: '82%' }}
                />

                {/* Stacking Disks */}
                <div className="w-full flex flex-col-reverse items-center gap-1 z-10 mb-3">
                  {peg.map((diskSize, diskIndex) => {
                    const isTopDisk = diskIndex === peg.length - 1
                    const isFloating = isSelected && isTopDisk
                    const colorClass = DISK_COLORS[(diskSize - 1) % DISK_COLORS.length]
                    
                    // Width as percentage of column width
                    const widthPercent = 30 + ((diskSize - 1) / (diskCount - 1 || 1)) * 65

                    return (
                      <motion.div
                        key={diskSize}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          y: isFloating ? -32 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                        className={`h-7 rounded-xl bg-gradient-to-r ${colorClass} border border-white/30 flex items-center justify-center shadow-lg relative cursor-pointer`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {/* Glow and sheen */}
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-30 pointer-events-none" />
                        <span className="text-[11px] font-black text-white drop-shadow select-none">
                          {diskSize}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Base Plate with Source, Auxiliary, and Destination labels (Fixed equal height) */}
                <div className="w-full h-11 rounded-xl bg-zinc-800 border border-zinc-600/70 shadow-md flex flex-col items-center justify-center px-1 z-10 shrink-0">
                  <span className="text-xs font-black text-white leading-none">
                    Tower {String.fromCharCode(65 + pegIndex)}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider leading-none mt-1 whitespace-nowrap truncate max-w-full ${
                    pegIndex === 0 
                      ? 'text-amber-400' 
                      : pegIndex === pegCount - 1 
                      ? 'text-emerald-400' 
                      : 'text-zinc-400'
                  }`}>
                    {pegIndex === 0 ? 'Source' : pegIndex === pegCount - 1 ? 'Destination' : 'Auxiliary'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Wooden / Metallic Platform Deck */}
        <div className="w-full h-4 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 border-t border-zinc-600 shadow-2xl mt-1 flex items-center justify-center">
          <div className="w-24 h-1 rounded-full bg-zinc-600/50" />
        </div>

        {/* Instructions footer */}
        <p className="text-center text-[11px] text-[var(--text-secondary)] font-medium mt-3">
          Tap a tower to pick up its top disk, then tap another tower to drop it.
        </p>
      </div>

      {/* ── Rules Modal ── */}
      <AnimatePresence>
        {rulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRulesOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-[24px] shadow-2xl max-w-sm w-full z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)]">Game Rules</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">Tower of Hanoi</p>
                  </div>
                </div>
                <button
                  onClick={() => setRulesOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">🎯</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">Goal: </strong>
                    Move all disks from <span className="text-amber-400 font-bold">Source (Tower A)</span> to <span className="text-emerald-400 font-bold">Destination (Tower C)</span>.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">☝️</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">One Disk at a Time: </strong>
                    Tap a tower to pick up its top-most disk, then tap any other tower to drop it.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">⛔</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">Size Rule: </strong>
                    A larger disk can <strong className="text-rose-400">never</strong> be placed on top of a smaller disk! Only smaller disks can be placed on larger disks.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">⏳</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">Move Limit: </strong>
                    Complete the puzzle before reaching the limit (<strong className="text-rose-400">{maxMoves} max moves</strong>) or you lose! Optimal is <strong className="text-amber-400">{minMoves} moves</strong>.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">💡</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">Tools: </strong>
                    Use the <strong className="text-[var(--text-primary)]">Undo</strong> button to take back a move, or <strong className="text-amber-400">Hint</strong> in settings to see the next move.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setRulesOpen(false)}
                className="w-full mt-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg active:scale-95 transition-transform text-xs"
              >
                Got It!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Game End Modal (Win or Loss) ── */}
      <GameEndModal
        isOpen={isWon || isLost}
        result={isWon ? 'win' : 'lose'}
        winnerName={isWon ? 'You' : undefined}
        onPlayAgain={handleReset}
      />

      {/* ── Quit Confirmation Modal ── */}
      <ConfirmExitModal
        isOpen={showExitConfirm || blocker.state === 'blocked'}
        onConfirm={() => {
          setShowExitConfirm(false)
          if (blocker.state === 'blocked') {
            blocker.proceed()
          } else {
            navigate('/')
          }
        }}
        onCancel={() => {
          setShowExitConfirm(false)
          if (blocker.state === 'blocked') {
            blocker.reset()
          }
        }}
      />
    </Layout>
  )
}
