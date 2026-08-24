import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Layout from '../components/Layout'
import TopBar from '../components/TopBar'
import ScoreCard from '../components/ScoreCard'
import GameEndModal from '../components/GameEndModal'
import { useConnectFour } from '../hooks/useConnectFour'
import { useSound } from '../hooks/useSound'
import { COLS } from '../utils/connectFourLogic'

export default function ConnectFour() {
  const {
    board,
    currentPlayer,
    winner,
    winningCells,
    isDraw,
    gameOver,
    lastDrop,
    scores,
    mode,
    difficulty,
    drop,
    resetBoard,
    changeMode,
    changeDifficulty,
  } = useConnectFour()
  const { playDrop } = useSound()
  const [hoverCol, setHoverCol] = useState<number | null>(null)

  const turnLabel =
    mode === 'pvai'
      ? currentPlayer === 'R' ? 'Your Turn' : 'AI Thinking...'
      : currentPlayer === 'R' ? 'Player 1' : 'Player 2'
  const turnColor = currentPlayer === 'R' ? '#ef4444' : '#eab308'

  const getEndResult = () => {
    if (isDraw) return 'draw' as const
    if (!winner) return null
    if (mode === 'pvai') return winner === 'R' ? ('win' as const) : ('lose' as const)
    return 'win' as const
  }

  const getWinnerName = () => {
    if (isDraw) return undefined
    if (mode === 'pvp') return winner === 'R' ? 'Player 1' : 'Player 2'
    return winner === 'R' ? 'You' : 'AI'
  }

  const winCellSet = new Set(winningCells?.map(([r, c]) => `${r}-${c}`) ?? [])

  return (
    <Layout>
      <TopBar
        title="Connect Four"
        turnIndicator={{ label: turnLabel, color: turnColor }}
        mode={mode}
        difficulty={difficulty}
        onModeChange={changeMode}
        onDifficultyChange={changeDifficulty}
        onRestart={resetBoard}
      />

      <ScoreCard
        player1={{
          name: mode === 'pvai' ? 'You' : 'Player 1',
          score: scores.p1,
          color: '#ef4444',
          avatar: '🔴',
        }}
        player2={{
          name: mode === 'pvai' ? 'AI Bot' : 'Player 2',
          score: scores.p2,
          color: '#eab308',
          avatar: '🟡',
        }}
        activePlayer={currentPlayer === 'R' ? 1 : 2}
      />

      {/* Game Board - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        <div className="game-board w-full max-w-[min(92vw,380px)]">
          {/* Column selectors */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {Array.from({ length: COLS }, (_, col) => (
              <motion.button
                key={`selector-${col}`}
                onClick={() => {
                  const success = drop(col)
                  if (success) playDrop()
                }}
                onMouseEnter={() => setHoverCol(col)}
                onMouseLeave={() => setHoverCol(null)}
                onTouchStart={() => setHoverCol(col)}
                onTouchEnd={() => setTimeout(() => setHoverCol(null), 200)}
                whileTap={{ scale: 0.85 }}
                className={`
                  tap-target h-7 rounded-lg transition-all duration-150
                  ${hoverCol === col && !gameOver
                    ? currentPlayer === 'R'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-yellow-500/15 text-yellow-400'
                    : 'text-[var(--text-secondary)] opacity-30'
                  }
                `}
                disabled={gameOver || board[0][col] !== null}
              >
                <ChevronDown size={16} />
              </motion.button>
            ))}
          </div>

          {/* Board */}
          <div className="bg-primary-700 dark:bg-primary-800 rounded-2xl p-2 shadow-2xl">
            <div className="grid grid-cols-7 gap-[5px]">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isWin = winCellSet.has(`${r}-${c}`)
                  const isLastDrop = lastDrop?.row === r && lastDrop?.col === c

                  return (
                    <motion.div
                      key={`${r}-${c}`}
                      className="aspect-square rounded-full"
                      animate={isWin ? {
                        boxShadow: [
                          `0 0 4px ${cell === 'R' ? '#ef4444' : '#eab308'}`,
                          `0 0 16px ${cell === 'R' ? '#ef4444' : '#eab308'}`,
                          `0 0 4px ${cell === 'R' ? '#ef4444' : '#eab308'}`,
                        ],
                      } : {}}
                      transition={isWin ? { repeat: Infinity, duration: 1.5 } : {}}
                      style={{
                        backgroundColor:
                          cell === 'R'
                            ? '#ef4444'
                            : cell === 'Y'
                            ? '#eab308'
                            : 'var(--bg-primary)',
                        boxShadow: cell && !isWin
                          ? 'inset 0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(255,255,255,0.1)'
                          : !cell
                          ? 'inset 0 3px 6px rgba(0,0,0,0.35)'
                          : undefined,
                      }}
                    >
                      {cell && isLastDrop && (
                        <motion.div
                          initial={{ y: -(r + 1) * 60, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 180,
                            damping: 14,
                            mass: 1,
                          }}
                          className="w-full h-full rounded-full"
                          style={{
                            backgroundColor: cell === 'R' ? '#ef4444' : '#eab308',
                            boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.15), inset 0 2px 3px rgba(255,255,255,0.15)',
                          }}
                        />
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <GameEndModal
        isOpen={gameOver}
        result={getEndResult()}
        winnerName={getWinnerName()}
        onPlayAgain={resetBoard}
      />
    </Layout>
  )
}
