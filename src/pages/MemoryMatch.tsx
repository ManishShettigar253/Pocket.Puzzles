import { motion, AnimatePresence } from 'framer-motion'
import { useBlocker } from 'react-router-dom'
import Layout from '../components/Layout'
import TopBar from '../components/TopBar'
import GameEndModal from '../components/GameEndModal'
import ConfirmExitModal from '../components/ConfirmExitModal'
import { useMemoryMatch } from '../hooks/useMemoryMatch'

export default function MemoryMatch() {
  const {
    cards,
    moves,
    maxMoves,
    isGameOver,
    hasWon,
    gridSize,
    flipCard,
    resetGame,
    changeGridSize,
  } = useMemoryMatch(16) // Default to 4x4

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isGameOver && moves > 0 && currentLocation.pathname !== nextLocation.pathname
  )

  const columns = Math.sqrt(gridSize)
  
  // Dynamic grid styling based on size
  const gridClass = {
    16: 'grid-cols-4 gap-2 sm:gap-3', // 4x4
    36: 'grid-cols-6 gap-1.5 sm:gap-2', // 6x6
    64: 'grid-cols-8 gap-1 sm:gap-1.5', // 8x8
  }[gridSize] || 'grid-cols-4 gap-2'

  const cardSizes = {
    16: 'text-3xl sm:text-4xl',
    36: 'text-2xl sm:text-3xl',
    64: 'text-xl sm:text-2xl',
  }[gridSize] || 'text-3xl'

  return (
    <Layout>
      <TopBar
        title="Memory Match"
        onRestart={resetGame}
        showSettings={true}
        customSettings={
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 shadow-sm shrink-0">
            {[
              { size: 16, label: '4×4', color: '#22c55e' },
              { size: 36, label: '6×6', color: '#f59e0b' },
              { size: 64, label: '8×8', color: '#ef4444' }
            ].map((opt) => (
              <button
                key={opt.size}
                onClick={() => changeGridSize(opt.size)}
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
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Moves</span>
          <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
            <span className={moves >= maxMoves - 5 ? 'text-red-500' : ''}>{moves}</span>
            <span className="text-sm text-[var(--text-secondary)]"> / {maxMoves}</span>
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Grid</span>
          <span className="text-lg font-bold text-primary-500 tabular-nums mt-1">{columns} × {columns}</span>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6 min-h-0">
        <div className="game-board w-full max-w-[min(90vw,400px)] aspect-square bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-3xl shadow-sm">
          <div className={`grid ${gridClass} h-full`}>
            {cards.map((card, index) => (
              <div key={card.id} className="relative w-full h-full perspective-1000">
                <motion.button
                  onClick={() => flipCard(index)}
                  className="w-full h-full relative preserve-3d"
                  initial={false}
                  animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
                >
                  {/* Card Front (Hidden) */}
                  <div className={`
                    absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl
                    bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm
                    border-2 border-primary-300/30
                    flex items-center justify-center
                    tap-target
                  `}>
                    <div className="w-1/3 h-1/3 bg-white/20 rounded-full blur-[2px]" />
                  </div>

                  {/* Card Back (Revealed) */}
                  <div 
                    className={`
                      absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl
                      flex items-center justify-center rotate-y-180
                      shadow-inner border-2
                      ${card.isMatched 
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-400 text-green-600 dark:text-green-400' 
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                      }
                    `}
                  >
                    <span className={`${cardSizes} filter drop-shadow-sm transition-all duration-300 ${card.isMatched ? 'scale-110' : ''}`}>
                      {card.value}
                    </span>
                  </div>
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GameEndModal
        isOpen={isGameOver}
        result={hasWon ? 'win' : 'lose'}
        winnerName="You"
        onPlayAgain={resetGame}
      />

      <ConfirmExitModal
        isOpen={blocker.state === 'blocked'}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </Layout>
  )
}
