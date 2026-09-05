import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Settings, BookOpen, X, Sparkles, CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout'
import GameEndModal from '../components/GameEndModal'
import ConfirmExitModal from '../components/ConfirmExitModal'
import { useDrawFlow, getEdgeKey } from '../hooks/useDrawFlow'
import { useStats } from '../hooks/useStats'
import { useSound } from '../hooks/useSound'

export default function DrawFlow() {
  const navigate = useNavigate()
  const {
    currentLevel,
    roundNumber,
    totalRounds,
    visitedEdges,
    activePath,
    currentCoord,
    isDrawing,
    roundComplete,
    isWon,
    errorShake,
    totalEdges,
    edgesCovered,
    startStroke,
    visitNode,
    updatePointer,
    endStroke,
    restartCurrentRound,
    resetSequence,
  } = useDrawFlow()

  const { recordResult } = useStats('draw-flow')
  const { playClick, playWin, playMove } = useSound()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const boardRef = useRef<HTMLDivElement>(null)
  const prevEdgesCountRef = useRef(0)

  // Play sound on edge connection
  useEffect(() => {
    if (edgesCovered > prevEdgesCountRef.current) {
      playMove()
    }
    prevEdgesCountRef.current = edgesCovered
  }, [edgesCovered, playMove])

  // Track win on completion of all 10 rounds
  useEffect(() => {
    if (isWon) {
      recordResult('win')
      playWin()
    }
  }, [isWon, recordResult, playWin])

  // Prevent accidental navigation when game is in progress
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (roundNumber > 1 || edgesCovered > 0) && !isWon && currentLocation.pathname !== nextLocation.pathname
  )

  const handleBack = () => {
    playClick()
    if ((roundNumber > 1 || edgesCovered > 0) && !isWon) {
      setShowExitConfirm(true)
    } else {
      navigate('/')
    }
  }

  // Get SVG coordinate from pointer event
  const getRelativeCoord = useCallback((e: React.PointerEvent) => {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return null
    const clientX = e.clientX
    const clientY = e.clientY
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    return { x, y, px: clientX - rect.left, py: clientY - rect.top, width: rect.width, height: rect.height }
  }, [])

  // Find nearest node to pointer coordinates
  const findNearestNode = useCallback((x: number, y: number, width: number, height: number) => {
    const HIT_RADIUS_PX = 38 // generous tap/drag snap radius
    let nearest: number | null = null
    let minDist = Infinity

    for (const node of currentLevel.nodes) {
      const nodePxX = (node.x / 100) * width
      const nodePxY = (node.y / 100) * height
      const pointerPxX = (x / 100) * width
      const pointerPxY = (y / 100) * height
      const dist = Math.hypot(nodePxX - pointerPxX, nodePxY - pointerPxY)

      if (dist <= HIT_RADIUS_PX && dist < minDist) {
        minDist = dist
        nearest = node.id
      }
    }
    return nearest
  }, [currentLevel.nodes])

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getRelativeCoord(e)
    if (!pos) return
    const nodeId = findNearestNode(pos.x, pos.y, pos.width, pos.height)
    if (nodeId !== null) {
      startStroke(nodeId, { x: pos.x, y: pos.y })
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return
    const pos = getRelativeCoord(e)
    if (!pos) return
    updatePointer({ x: pos.x, y: pos.y })

    const nearest = findNearestNode(pos.x, pos.y, pos.width, pos.height)
    if (nearest !== null) {
      visitNode(nearest)
    }
  }

  const handlePointerUp = () => {
    endStroke()
  }

  // Node position helper
  const getNodePos = (id: number) => {
    return currentLevel.nodes.find(n => n.id === id) || { x: 50, y: 50 }
  }

  const lastNodeId = activePath.length > 0 ? activePath[activePath.length - 1] : null
  const lastNodePos = lastNodeId !== null ? getNodePos(lastNodeId) : null

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

        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
            Draw Flow
          </h1>
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Round {roundNumber} of {totalRounds} • {currentLevel.name}
          </span>
        </div>

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
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>Sequence Control:</span>
                <span className="text-[11px] text-violet-400 font-semibold">10 Progressive Rounds</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    playClick()
                    resetSequence()
                    setSettingsOpen(false)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors active:scale-95"
                >
                  <RotateCcw size={14} />
                  <span>Reset to Round 1</span>
                </button>

                <button
                  onClick={() => {
                    playClick()
                    restartCurrentRound()
                    setSettingsOpen(false)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors active:scale-95"
                >
                  <RotateCcw size={14} />
                  <span>Retry Round</span>
                </button>

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

      {/* ── Progress HUD ── */}
      <div className="shrink-0 px-3 py-1 flex items-center justify-between gap-3">
        {/* Round Progress Tracker */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-3 py-1.5 shadow-sm">
          <div className="flex gap-1">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < roundNumber - 1
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : i === roundNumber - 1
                    ? 'bg-violet-400 ring-2 ring-violet-500/50 scale-125'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-[var(--text-secondary)] ml-1">
            {roundNumber}/{totalRounds}
          </span>
        </div>

        {/* Edges Traced Status */}
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-3 py-1.5 shadow-sm">
          <Sparkles size={14} className={edgesCovered === totalEdges ? 'text-emerald-400' : 'text-cyan-400'} />
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Lines:</span>
            <span className={`text-sm font-black tabular-nums ${edgesCovered === totalEdges ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}>
              {edgesCovered}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold">/ {totalEdges}</span>
          </div>
        </div>
      </div>

      {/* ── Main Canvas Drawing Area ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 select-none relative min-h-0">

        {/* Board container */}
        <motion.div
          ref={boardRef}
          animate={errorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full max-w-[360px] aspect-square rounded-3xl bg-black/40 border border-[var(--border-color)] shadow-2xl p-4 overflow-hidden touch-none cursor-crosshair backdrop-blur-md"
        >
          {/* SVG Canvas for Lines */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="neonLaser" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Target Lines (Guide Pattern) */}
            {currentLevel.edges.map((edge) => {
              const fromPos = getNodePos(edge.from)
              const toPos = getNodePos(edge.to)
              const key = getEdgeKey(edge.from, edge.to)
              const isTraced = visitedEdges.has(key)

              return (
                <line
                  key={key}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={isTraced ? 'url(#neonLaser)' : 'rgba(255, 255, 255, 0.14)'}
                  strokeWidth={isTraced ? '3.5' : '2'}
                  strokeDasharray={isTraced ? 'none' : '2.5 2.5'}
                  strokeLinecap="round"
                  filter={isTraced ? 'url(#glow)' : undefined}
                />
              )
            })}

            {/* Active Live Dragging Trail */}
            {isDrawing && lastNodePos && currentCoord && (
              <line
                x1={lastNodePos.x}
                y1={lastNodePos.y}
                x2={currentCoord.x}
                y2={currentCoord.y}
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="1 3"
                filter="url(#glow)"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Interactive Nodes */}
          {currentLevel.nodes.map((node) => {
            const isLastNode = lastNodeId === node.id
            const isVisited = activePath.includes(node.id)

            return (
              <div
                key={node.id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                {/* Outer Glow Ring */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isLastNode
                      ? 'ring-4 ring-cyan-400/80 bg-cyan-400/20 scale-125'
                      : isVisited
                      ? 'ring-2 ring-emerald-400/50 bg-emerald-400/10'
                      : 'ring-2 ring-white/20 bg-white/5'
                  }`}
                >
                  {/* Node Core */}
                  <div
                    className={`w-4 h-4 rounded-full transition-all ${
                      isLastNode
                        ? 'bg-cyan-300 shadow-[0_0_12px_#38bdf8]'
                        : isVisited
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : 'bg-zinc-400'
                    }`}
                  />
                </div>
              </div>
            )
          })}

          {/* Round Complete Banner Animation */}
          <AnimatePresence>
            {roundComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/40"
                >
                  <CheckCircle2 size={36} />
                </motion.div>
                <h3 className="text-xl font-black text-white drop-shadow">Round Cleared!</h3>
                <p className="text-xs text-emerald-300 font-semibold mt-1">
                  {roundNumber === totalRounds ? 'All Rounds Completed! 🎉' : 'Next round starting...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Guidance tip footer */}
        <p className="text-center text-[11px] text-[var(--text-secondary)] font-medium mt-3">
          Touch any dot and drag through all lines without lifting your finger.
        </p>
      </div>

      {/* ── Game Rules Modal ── */}
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
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)]">Game Rules</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">Draw Flow (One-Line Puzzle)</p>
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
                  <span className="text-base leading-none shrink-0">☝️</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">One Continuous Stroke: </strong>
                    Touch a node and trace every line of the figure <strong className="text-cyan-400">without lifting your finger/pen</strong>.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">🚫</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">No Retracing: </strong>
                    Each line can only be drawn <strong className="text-rose-400">once</strong>. You cannot cross the same line twice!
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">🏆</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">10 Rounds to Win: </strong>
                    Complete all 10 progressively challenging shapes to win the game!
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-base leading-none shrink-0">🔄</span>
                  <div>
                    <strong className="text-[var(--text-primary)]">Reset Option: </strong>
                    Open Settings anytime to <strong className="text-amber-400">Reset to Round 1</strong> or retry the current round.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setRulesOpen(false)}
                className="w-full mt-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg active:scale-95 transition-transform text-xs"
              >
                Got It!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Win Game Modal ── */}
      <GameEndModal
        isOpen={isWon}
        result="win"
        winnerName="You"
        onPlayAgain={resetSequence}
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
