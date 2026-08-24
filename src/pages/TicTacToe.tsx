import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import TopBar from '../components/TopBar'
import ScoreCard from '../components/ScoreCard'
import GameEndModal from '../components/GameEndModal'
import { useTicTacToe } from '../hooks/useTicTacToe'
import { useSound } from '../hooks/useSound'

export default function TicTacToe() {
  const {
    board,
    currentPlayer,
    winner,
    winningLine,
    isDraw,
    gameOver,
    moveCount,
    scores,
    mode,
    difficulty,
    makeMove,
    resetBoard,
    changeMode,
    changeDifficulty,
  } = useTicTacToe()
  const { playMove } = useSound()

  const turnLabel =
    mode === 'pvai'
      ? currentPlayer === 'X' ? 'Your Turn' : 'AI Thinking...'
      : currentPlayer === 'X' ? 'Player 1' : 'Player 2'
  const turnColor = currentPlayer === 'X' ? '#f43f5e' : '#3b82f6'

  const getEndResult = () => {
    if (isDraw) return 'draw' as const
    if (!winner) return null
    if (mode === 'pvai') return winner === 'X' ? ('win' as const) : ('lose' as const)
    return 'win' as const
  }

  const getWinnerName = () => {
    if (isDraw) return undefined
    if (mode === 'pvp') return winner === 'X' ? 'Player 1' : 'Player 2'
    return winner === 'X' ? 'You' : 'AI'
  }

  return (
    <Layout>
      <TopBar
        title="Tic-Tac-Toe"
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
          color: '#f43f5e',
          avatar: '✕',
        }}
        player2={{
          name: mode === 'pvai' ? 'AI Bot' : 'Player 2',
          score: scores.p2,
          color: '#3b82f6',
          avatar: '○',
        }}
        activePlayer={currentPlayer === 'X' ? 1 : 2}
      />

      {/* Game Board - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        <div className="game-board w-full max-w-[min(85vw,340px)] aspect-square">
          <div className="grid grid-cols-3 gap-2.5 h-full">
            {board.map((cell, index) => {
              const isWinCell = winningLine?.includes(index)
              return (
                <motion.button
                  key={index}
                  whileTap={!cell && !gameOver ? { scale: 0.88 } : {}}
                  onClick={() => {
                    const moved = makeMove(index)
                    if (moved) playMove()
                  }}
                  disabled={cell !== null || gameOver}
                  className={`
                    tap-target rounded-2xl font-black transition-all duration-200
                    bg-[var(--bg-card)] border-2
                    ${isWinCell
                      ? 'win-cell border-green-400 bg-green-500/10'
                      : 'border-[var(--border-color)]'
                    }
                    ${!cell && !gameOver
                      ? 'cursor-pointer hover:border-primary-400/60 active:bg-primary-500/10'
                      : 'cursor-default'
                    }
                  `}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, rotate: -90, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      className={`text-4xl sm:text-5xl ${cell === 'X' ? 'text-player-x' : 'text-player-o'}`}
                    >
                      {cell === 'X' ? '✕' : '○'}
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Move counter - subtle */}
        <motion.p
          key={moveCount}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="mt-3 text-[11px] text-[var(--text-secondary)] font-medium tabular-nums"
        >
          Move {moveCount} / 9
        </motion.p>
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
