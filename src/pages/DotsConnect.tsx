import { motion } from 'framer-motion'
import { useBlocker } from 'react-router-dom'
import { useDotsConnect, type GridSize } from '../hooks/useDotsConnect'
import Layout from '../components/Layout'
import TopBar from '../components/TopBar'
import GameEndModal from '../components/GameEndModal'
import ConfirmExitModal from '../components/ConfirmExitModal'
import { useStats } from '../hooks/useStats'
import { useEffect, useRef } from 'react'
import type { DotColor } from '../data/dotsLevels'

const COLOR_MAP: Record<DotColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7'
}

export default function DotsConnect() {
  const { recordResult } = useStats('dots-connect')
  
  const {
    gridSize,
    currentRound,
    score,
    gameOver,
    level,
    paths,
    startGame,
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp
  } = useDotsConnect()

  // Prevent accidental exits when in a game
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      gridSize !== null && !gameOver && currentLocation.pathname !== nextLocation.pathname
  )

  // Register score when game ends
  useEffect(() => {
    if (gameOver) {
      recordResult('win') // Count as a win since they finished
    }
  }, [gameOver, recordResult])

  return (
    <Layout className="overflow-hidden">
      {gridSize ? (
        <>
          <TopBar
            title="Dots Connect"
            onRestart={() => startGame(gridSize)}
            showSettings={true}
            customSettings={
              <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 shadow-sm shrink-0">
                {[
                  { size: 4, label: '4×4', color: '#22c55e' },
                  { size: 5, label: '5×5', color: '#f59e0b' },
                  { size: 6, label: '6×6', color: '#ef4444' }
                ].map((opt) => (
                  <button
                    key={opt.size}
                    onClick={() => startGame(opt.size as GridSize)}
                    className={`relative px-3 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold transition-colors ${
                      gridSize === opt.size
                        ? 'text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {gridSize === opt.size && (
                      <motion.div
                        layoutId="grid-size-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: opt.color }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                ))}
              </div>
            }
          />
          {/* Stats Bar */}
          <div className="flex justify-center items-center gap-6 px-4 py-3 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Round</span>
              <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
                {currentRound + 1}
                <span className="text-sm text-[var(--text-secondary)]"> / 10</span>
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Score</span>
              <span className="text-lg font-bold text-primary-500 tabular-nums mt-1">{score}</span>
            </div>
          </div>
        </>
      ) : (
        <TopBar title="Dots Connect" showSettings={false} />
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-5 min-h-0 relative z-0">
        {!gridSize ? (
          <SizeSelection onSelect={startGame} />
        ) : (
          <GameGrid
            size={gridSize}
            level={level!}
            paths={paths}
            onPointerDown={handlePointerDown}
            onPointerEnter={handlePointerEnter}
            onPointerUp={handlePointerUp}
          />
        )}
      </div>

      <GameEndModal
        isOpen={gameOver}
        result="win"
        winnerName={`Score: ${score}`}
        onPlayAgain={() => startGame(gridSize!)}
      />

      <ConfirmExitModal
        isOpen={blocker.state === 'blocked'}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </Layout>
  )
}

function SizeSelection({ onSelect }: { onSelect: (s: GridSize) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm bg-[var(--bg-card)] p-6 rounded-3xl shadow-xl border border-[var(--border-color)] text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
        <span className="text-2xl filter grayscale brightness-200">✨</span>
      </div>
      <h2 className="text-2xl font-black mb-2">Select Grid Size</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Connect the matching colors. Fill the entire board!
      </p>

      <div className="flex flex-col gap-3">
        <SelectionButton size={4} label="4x4 Grid" points="1000 max score" onClick={() => onSelect(4)} color="from-green-400 to-emerald-500" />
        <SelectionButton size={5} label="5x5 Grid" points="1500 max score" onClick={() => onSelect(5)} color="from-blue-400 to-indigo-500" />
        <SelectionButton size={6} label="6x6 Grid" points="2000 max score" onClick={() => onSelect(6)} color="from-purple-400 to-pink-500" />
      </div>
    </motion.div>
  )
}

function SelectionButton({ label, points, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden w-full p-4 rounded-2xl text-left transition-transform active:scale-95 group shadow-sm hover:shadow-md`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative flex justify-between items-center">
        <div>
          <span className="block font-black text-lg text-[var(--text-primary)]">{label}</span>
          <span className="text-xs font-bold text-[var(--text-secondary)]">{points}</span>
        </div>
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color} text-white flex items-center justify-center shadow-sm`}>
          →
        </div>
      </div>
    </button>
  )
}

function GameGrid({ size, level, paths, onPointerDown, onPointerEnter, onPointerUp }: any) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Use refs to avoid tearing down the event listeners when state changes mid-drag
  const enterRef = useRef(onPointerEnter)
  const upRef = useRef(onPointerUp)

  useEffect(() => {
    enterRef.current = onPointerEnter
    upRef.current = onPointerUp
  }, [onPointerEnter, onPointerUp])

  // Handle pointer move manually to trigger enter correctly even when dragging
  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      // Prevent browser scrolling while trying to draw
      if (e.cancelable) {
        e.preventDefault()
      }

      let clientX, clientY
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
      }
      
      const el = document.elementFromPoint(clientX, clientY)
      if (el && el.hasAttribute('data-row')) {
        const r = parseInt(el.getAttribute('data-row')!)
        const c = parseInt(el.getAttribute('data-col')!)
        enterRef.current(r, c)
      }
    }

    const handleUp = () => upRef.current()
    
    // Attach with passive: false so we can preventDefault
    window.addEventListener('touchmove', handleMove as any, { passive: false })
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchend', handleUp)
    window.addEventListener('mouseup', handleUp)
    
    return () => {
      window.removeEventListener('touchmove', handleMove as any)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchend', handleUp)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  if (!level) return null

  const getDotColor = (r: number, c: number) => {
    for (const dot of level.dots) {
      if ((dot.start[0] === r && dot.start[1] === c) || (dot.end[0] === r && dot.end[1] === c)) {
        return COLOR_MAP[dot.color as DotColor]
      }
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-[400px] aspect-square bg-[var(--bg-card)] rounded-[32px] p-4 shadow-xl border border-[var(--border-color)] touch-none select-none"
      ref={gridRef}
      style={{ touchAction: 'none' }} // Crucial for preventing scrolling on mobile while dragging
    >
      {/* SVG overlay for drawing paths */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox={`0 0 ${size * 100} ${size * 100}`} style={{ padding: '16px' }}>
        {Object.entries(paths).map(([color, path]: any) => {
          if (path.length < 2) return null
          const points = path.map((p: any) => `${p[1] * 100 + 50},${p[0] * 100 + 50}`).join(' ')
          
          return (
            <polyline
              key={color}
              points={points}
              fill="none"
              stroke={COLOR_MAP[color as DotColor]}
              strokeWidth={30} // Thick pipes relative to grid size
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )
        })}
      </svg>

      {/* Grid Cells */}
      <div 
        className="w-full h-full grid relative z-20 bg-[var(--border-color)] rounded-2xl overflow-hidden shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          gap: '2px' // small gap looks nice
        }}
      >
        {Array.from({ length: size }).map((_, r) => (
          Array.from({ length: size }).map((_, c) => {
            const dotColor = getDotColor(r, c)
            return (
              <div
                key={`${r}-${c}`}
                data-row={r}
                data-col={c}
                onMouseDown={() => onPointerDown(r, c)}
                onTouchStart={() => onPointerDown(r, c)}
                className="w-full h-full flex items-center justify-center bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
              >
                {dotColor && (
                  <div
                    className="w-[60%] h-[60%] rounded-full shadow-md pointer-events-none"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
              </div>
            )
          })
        ))}
      </div>
    </motion.div>
  )
}
