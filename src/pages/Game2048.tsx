import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import { useNavigate, useBlocker } from 'react-router-dom'
import Layout from '../components/Layout'
import ThemeToggle from '../components/ThemeToggle'
import { use2048 } from '../hooks/use2048'
import ConfirmExitModal from '../components/ConfirmExitModal'

function getTileColors(value: number) {
  if (value >= 2048) return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.5)] ring-2 ring-yellow-300/50'
  if (value >= 1024) return 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
  if (value >= 512) return 'bg-gradient-to-br from-rose-400 to-red-500 text-white'
  if (value >= 256) return 'bg-gradient-to-br from-pink-400 to-rose-500 text-white'
  if (value >= 128) return 'bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white'
  if (value >= 64) return 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white'
  if (value >= 32) return 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
  if (value >= 16) return 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white'
  if (value >= 8) return 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white'
  if (value >= 4) return 'bg-gradient-to-br from-emerald-100 to-teal-100 text-teal-900'
  return 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800'
}

function getFontSize(value: number) {
  if (value >= 10000) return 'text-xl'
  if (value >= 1000) return 'text-2xl'
  if (value >= 100) return 'text-3xl'
  return 'text-4xl'
}

export default function Game2048() {
  const navigate = useNavigate()
  const { tiles, score, bestScore, gameOver, won, resetGame, moveTiles, continuePlaying } = use2048()
  
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !gameOver && !won && (score > 0 || tiles.length > 2) && currentLocation.pathname !== nextLocation.pathname
  )

  // Touch handlers for swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const minSwipeDistance = 40

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY })
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance
    const isUpSwipe = distanceY > minSwipeDistance
    const isDownSwipe = distanceY < -minSwipeDistance

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) moveTiles('LEFT')
      if (isRightSwipe) moveTiles('RIGHT')
    } else {
      if (isUpSwipe) moveTiles('UP')
      if (isDownSwipe) moveTiles('DOWN')
    }
  }

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moveTiles('UP')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          moveTiles('DOWN')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveTiles('LEFT')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveTiles('RIGHT')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveTiles])

  return (
    <Layout className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-2 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          2048
        </h1>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center p-5 max-w-lg mx-auto w-full">
        {/* Score Board */}
        <div className="w-full flex justify-between items-center mb-6 gap-4">
          <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Score</span>
            <span className="text-xl font-black text-[var(--text-primary)] tabular-nums">{score}</span>
          </div>
          <button
            onClick={resetGame}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg hover:shadow-primary-500/25 active:scale-95 transition-all"
          >
            <RotateCcw size={20} />
          </button>
          <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              <Trophy size={10} /> Best
            </span>
            <span className="text-xl font-black text-[var(--text-primary)] tabular-nums">{bestScore}</span>
          </div>
        </div>

        {/* Game Board */}
        <div
          className="relative bg-slate-200 dark:bg-slate-800 p-2.5 rounded-[1.5rem] touch-none shadow-inner"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
          style={{ width: 'min(100%, 400px)', aspectRatio: '1/1' }}
        >
          {/* Background Grid Cells */}
          <div className="absolute inset-2.5 grid grid-cols-4 grid-rows-4 gap-2.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-slate-300/50 dark:bg-slate-700/50 rounded-xl" />
            ))}
          </div>

          {/* Active Tiles */}
          <div className="absolute inset-2.5">
            <AnimatePresence>
              {tiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  layout
                  initial={tile.isNew ? { scale: 0, opacity: 0 } : false}
                  animate={{
                    scale: tile.isMerged ? [1, 1.2, 1] : 1,
                    opacity: tile.isDead ? 0 : 1,
                    x: `calc(${tile.col * 100}% + ${tile.col * 10}px)`,
                    y: `calc(${tile.row * 100}% + ${tile.row * 10}px)`,
                    zIndex: tile.isDead ? 0 : 10,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 250,
                    damping: 25,
                    mass: 0.8,
                    scale: { duration: 0.15 },
                  }}
                  className={`absolute w-[calc(25%-7.5px)] h-[calc(25%-7.5px)] rounded-xl flex items-center justify-center font-black ${getFontSize(tile.value)} ${getTileColors(tile.value)}`}
                >
                  {tile.value}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm rounded-[1.5rem] flex flex-col items-center justify-center text-white"
              >
                <h2 className="text-4xl font-black mb-2">Game Over!</h2>
                <p className="text-white/80 mb-6 font-medium">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-transform"
                >
                  Try Again
                </button>
              </motion.div>
            )}
            
            {won && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 bg-yellow-500/40 backdrop-blur-md rounded-[1.5rem] flex flex-col items-center justify-center text-white shadow-[inset_0_0_100px_rgba(250,204,21,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/50 to-transparent rounded-[1.5rem]" />
                <h2 className="text-5xl font-black mb-2 relative drop-shadow-lg text-yellow-100">You Win!</h2>
                <p className="text-yellow-100 mb-6 font-bold text-lg relative">You reached 2048</p>
                <div className="flex gap-3 relative">
                  <button
                    onClick={continuePlaying}
                    className="px-5 py-2.5 rounded-full bg-yellow-600/80 hover:bg-yellow-600 text-white font-bold hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-5 py-2.5 rounded-full bg-white text-yellow-600 font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* On-screen Controls */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <button 
            onClick={() => moveTiles('UP')} 
            className="w-14 h-14 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-md active:scale-95 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-[var(--text-primary)]"
            aria-label="Move Up"
          >
            <ArrowUp size={28} />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => moveTiles('LEFT')} 
              className="w-14 h-14 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-md active:scale-95 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-[var(--text-primary)]"
              aria-label="Move Left"
            >
              <ArrowLeft size={28} />
            </button>
            <button 
              onClick={() => moveTiles('DOWN')} 
              className="w-14 h-14 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-md active:scale-95 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-[var(--text-primary)]"
              aria-label="Move Down"
            >
              <ArrowDown size={28} />
            </button>
            <button 
              onClick={() => moveTiles('RIGHT')} 
              className="w-14 h-14 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-md active:scale-95 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-[var(--text-primary)]"
              aria-label="Move Right"
            >
              <ArrowRight size={28} />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          <strong>How to play:</strong> Swipe, use on-screen arrows, or use arrow keys to move tiles. Tiles with the same number merge into one!
        </p>
      </div>

      <ConfirmExitModal
        isOpen={blocker.state === 'blocked'}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </Layout>
  )
}
