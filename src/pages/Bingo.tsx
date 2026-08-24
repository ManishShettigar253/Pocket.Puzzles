import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import Layout from '../components/Layout'
import TopBar from '../components/TopBar'
import ScoreCard from '../components/ScoreCard'
import GameEndModal from '../components/GameEndModal'
import { useBingo } from '../hooks/useBingo'
import { useSound } from '../hooks/useSound'
import type { BingoBoard, BingoMarked } from '../utils/bingoLogic'
import { getCompletedLines } from '../utils/bingoLogic'

export default function Bingo() {
  const {
    p1Board,
    p1Marked,
    calledNumbers,
    currentPlayer,
    p1Lines,
    p2Lines,
    winner,
    gameOver,
    scores,
    mode,
    bingoLetters,
    callNumber,
    resetBoard,
    shuffleBoard,
  } = useBingo()
  const { playMove, playBingo } = useSound()

  const turnLabel =
    mode === 'pvai'
      ? currentPlayer === 1 ? 'Your Turn' : 'AI Thinking...'
      : currentPlayer === 1 ? 'Player 1' : 'Player 2'
  const turnColor = currentPlayer === 1 ? '#f43f5e' : '#3b82f6'

  const getEndResult = () => {
    if (!winner) return null
    if (mode === 'pvai') return winner === 1 ? ('win' as const) : ('lose' as const)
    return 'win' as const
  }

  const getWinnerName = () => {
    if (mode === 'pvp') return winner === 1 ? 'Player 1' : 'Player 2'
    return winner === 1 ? 'You' : 'AI'
  }

  const handleCallNumber = (num: number) => {
    if (currentPlayer !== 1 && mode === 'pvai') return
    const prevP1Lines = p1Lines
    const success = callNumber(num)
    if (success) {
      playMove()
      const newMarked = p1Marked.map((r) => [...r])
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 5; c++)
          if (p1Board[r][c] === num) newMarked[r][c] = true
      if (getCompletedLines(newMarked).length > prevP1Lines) playBingo()
    }
  }

  return (
    <Layout>
      <TopBar
        title="Bingo"
        turnIndicator={{ label: turnLabel, color: turnColor }}
        onRestart={resetBoard}
        showSettings={true}
      />

      <ScoreCard
        player1={{
          name: 'You',
          score: scores.p1,
          color: '#f43f5e',
          avatar: '🎯',
        }}
        player2={{
          name: 'AI Bot',
          score: scores.p2,
          color: '#3b82f6',
          avatar: '🤖',
        }}
        activePlayer={currentPlayer}
      />

      {/* BINGO Letter Trackers */}
      <div className="flex justify-center gap-3 px-3 pb-2 shrink-0">
        <BingoTracker letters={bingoLetters} completedLines={p1Lines} label="You" color="#f43f5e" />
        <BingoTracker letters={bingoLetters} completedLines={p2Lines} label="AI Bot" color="#3b82f6" />
      </div>

      {/* Boards area - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0 overflow-hidden">
        {/* Player 1 Board */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-bold" style={{ color: '#f43f5e' }}>
              Your Board
            </span>
            {calledNumbers.size === 0 && (
              <button
                onClick={() => shuffleBoard(1)}
                className="tap-target w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] active:scale-90 transition-transform"
                title="Shuffle Board"
              >
                <Shuffle size={14} />
              </button>
            )}
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-1 rounded-lg shadow-sm">
              {p1Lines}/5 lines
            </span>
          </div>
          <BingoGrid
            board={p1Board}
            marked={p1Marked}
            calledNumbers={calledNumbers}
            isActive={currentPlayer === 1 && !gameOver}
            onCellClick={handleCallNumber}
          />
        </div>
      </div>

      {/* Number Pad - compact */}
      <div className="shrink-0 px-3 py-2">
        <div className="grid grid-cols-5 gap-2 max-w-[320px] mx-auto">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
            const isCalled = calledNumbers.has(num)
            const isMyTurn = currentPlayer === 1
            return (
              <motion.button
                key={num}
                whileTap={!isCalled && !gameOver && isMyTurn ? { scale: 0.85 } : {}}
                onClick={() => {
                  if (!isCalled && !gameOver && isMyTurn) handleCallNumber(num)
                }}
                disabled={isCalled || gameOver || !isMyTurn}
                className={`
                  h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center
                  ${isCalled
                    ? 'bg-primary-600/30 text-white/30'
                    : !isMyTurn
                    ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] opacity-40'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] active:bg-primary-500/15 active:border-primary-400'
                  }
                `}
              >
                {num}
              </motion.button>
            )
          })}
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

// --- Sub-components ---

function BingoTracker({
  letters,
  completedLines,
  label,
  color,
}: {
  letters: string[]
  completedLines: number
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
      <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{label}</span>
      <div className="flex gap-0.5">
        {letters.map((letter, i) => {
          const lit = i < completedLines
          return (
            <motion.div
              key={`${label}-${letter}`}
              animate={{
                scale: lit ? 1.15 : 1,
                backgroundColor: lit ? color : 'transparent',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border-2 ${
                lit ? 'border-transparent text-white shadow-sm' : 'border-[var(--border-color)] text-[var(--text-secondary)] opacity-50'
              }`}
            >
              {letter}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function BingoGrid({
  board,
  marked,
  calledNumbers,
  isActive,
  onCellClick,
}: {
  board: BingoBoard
  marked: BingoMarked
  calledNumbers: Set<number>
  isActive: boolean
  onCellClick: (num: number) => void
}) {
  const completedLines = getCompletedLines(marked)
  const winCells = new Set<string>()
  completedLines.forEach((line) => {
    line.cells.forEach(([r, c]) => winCells.add(`${r}-${c}`))
  })

  return (
    <div className="game-board w-full max-w-[min(85vw,340px)] aspect-square">
      <div className="grid grid-cols-5 gap-1.5 h-full">
        {board.map((row, r) =>
          row.map((num, c) => {
            const isMarked = marked[r][c]
            const isWinLine = winCells.has(`${r}-${c}`)
            const canClick = isActive && !calledNumbers.has(num)
            return (
              <motion.button
                key={`${r}-${c}`}
                whileTap={canClick ? { scale: 0.88 } : {}}
                onClick={() => canClick && onCellClick(num)}
                className={`
                  rounded-xl text-sm font-black flex items-center justify-center transition-all
                  ${isWinLine
                    ? 'bg-green-500 text-white border-2 border-green-400 shadow-md shadow-green-500/30'
                    : isMarked
                    ? 'bg-primary-600 text-white border-2 border-primary-400 shadow-sm'
                    : 'bg-[var(--bg-card)] border-2 border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
                  }
                  ${canClick ? 'cursor-pointer active:border-primary-400 hover:border-primary-400/50' : ''}
                `}
              >
                {isMarked ? (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                  >
                    {num}
                  </motion.span>
                ) : (
                  num
                )}
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  )
}
