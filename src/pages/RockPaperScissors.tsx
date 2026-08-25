import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBlocker } from 'react-router-dom'
import Layout from '../components/Layout'
import TopBar from '../components/TopBar'
import ConfirmExitModal from '../components/ConfirmExitModal'
import GameEndModal from '../components/GameEndModal'
import { useRockPaperScissors, type Move } from '../hooks/useRockPaperScissors'
import { useSound } from '../hooks/useSound'

const ICONS = {
  rock: '👊',
  paper: '✋',
  scissors: '✌️',
}

const AI_ICONS = {
  rock: '🤛',
  paper: '🤚',
  scissors: '✌️',
}

export default function RockPaperScissors() {
  const {
    playerScore,
    aiScore,
    playerChoice,
    aiChoice,
    result,
    isRevealing,
    matchWinner,
    TARGET_SCORE,
    playRound,
    resetGame,
  } = useRockPaperScissors()

  const { playClick, playWin, playLose } = useSound()

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !matchWinner && (playerScore > 0 || aiScore > 0) && currentLocation.pathname !== nextLocation.pathname
  )

  const handlePlay = (move: Move) => {
    playClick()
    playRound(move)
  }

  // Effect to play sound on result reveal
  useEffect(() => {
    if (result === 'win') playWin()
    if (result === 'loss') playLose()
    if (result === 'draw') playClick() // subtle click for draw
  }, [result, playWin, playLose, playClick])

  return (
    <Layout>
      <TopBar
        title="Rock Paper Scissors"
        onRestart={resetGame}
        showSettings={true}
        mode="pvai"
      />

      {/* Score Header - Best of 3 */}
      <div className="flex justify-center items-center gap-8 px-4 py-4 shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">You</span>
          <div className="flex gap-1.5">
            {Array.from({ length: TARGET_SCORE }).map((_, i) => (
              <div 
                key={`p-${i}`} 
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${i < playerScore ? 'bg-primary-500 border-primary-500 shadow-[0_0_8px_rgba(var(--color-primary-500),0.5)]' : 'border-[var(--border-color)] bg-[var(--bg-primary)]'}`}
              />
            ))}
          </div>
        </div>
        <div className="text-xl font-bold text-[var(--text-secondary)] opacity-50">VS</div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">AI</span>
          <div className="flex gap-1.5">
            {Array.from({ length: TARGET_SCORE }).map((_, i) => (
              <div 
                key={`ai-${i}`} 
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${i < aiScore ? 'bg-rose-500 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'border-[var(--border-color)] bg-[var(--bg-primary)]'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
        
        {/* AI Side (Top) */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8 w-full">
          <AnimatePresence mode="wait">
            {isRevealing ? (
              <motion.div
                key="thinking"
                animate={{ 
                  rotate: [0, 10, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-8xl drop-shadow-xl filter grayscale"
              >
                🤛
              </motion.div>
            ) : aiChoice ? (
              <motion.div
                key={aiChoice}
                initial={{ scale: 0.5, opacity: 0, rotate: 45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="text-8xl drop-shadow-xl"
              >
                {AI_ICONS[aiChoice]}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-24 h-24 rounded-full border-4 border-dashed border-[var(--border-color)] flex items-center justify-center opacity-50"
              >
                <span className="text-3xl text-[var(--text-secondary)]">🤖</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Divider / Result */}
        <div className="shrink-0 h-16 flex items-center justify-center z-10 my-4 relative w-full px-8">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`
                  px-6 py-2 rounded-full font-black text-lg tracking-widest uppercase shadow-lg border-2 z-10 bg-[var(--bg-card)]
                  ${result === 'win' ? 'text-green-500 border-green-500 shadow-green-500/20' : ''}
                  ${result === 'loss' ? 'text-rose-500 border-rose-500 shadow-rose-500/20' : ''}
                  ${result === 'draw' ? 'text-gray-400 border-gray-400' : ''}
                `}
              >
                {result === 'win' ? 'Round Won' : result === 'loss' ? 'Round Lost' : 'Draw'}
              </motion.div>
            ) : (
              <div className="px-6 py-2 rounded-full font-black text-xl tracking-widest text-[var(--text-secondary)] uppercase bg-[var(--bg-primary)] border-2 border-[var(--border-color)] z-10 opacity-50">
                VS
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Side (Bottom) */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8 w-full">
          <AnimatePresence mode="wait">
            {isRevealing ? (
              <motion.div
                key="thinking-player"
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-8xl drop-shadow-xl filter grayscale"
              >
                👊
              </motion.div>
            ) : playerChoice ? (
              <motion.div
                key={playerChoice}
                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="text-8xl drop-shadow-xl"
              >
                {ICONS[playerChoice]}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-24 h-24 rounded-full border-4 border-dashed border-[var(--border-color)] flex items-center justify-center opacity-50"
              >
                <span className="text-3xl text-[var(--text-secondary)]">👤</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Controls */}
      <div className="px-5 py-6 shrink-0 pb-safe">
        <div className="flex justify-center gap-3 sm:gap-4 max-w-sm mx-auto">
          {(['rock', 'paper', 'scissors'] as Move[]).map((move) => (
            <motion.button
              key={move!}
              whileTap={{ scale: 0.9 }}
              disabled={isRevealing || !!matchWinner}
              onClick={() => handlePlay(move!)}
              className={`
                flex-1 aspect-[4/5] rounded-[24px] flex flex-col items-center justify-center gap-3
                bg-[var(--bg-card)] border-2 transition-all shadow-md hover:-translate-y-1
                ${playerChoice === move && !isRevealing ? 'border-primary-500 bg-primary-500/10 shadow-primary-500/25' : 'border-[var(--border-color)] hover:border-primary-300'}
                ${(isRevealing || !!matchWinner) ? 'opacity-50 cursor-not-allowed hover:-translate-y-0' : ''}
              `}
            >
              <span className="text-4xl sm:text-5xl filter drop-shadow-md">{ICONS[move!]}</span>
              <span className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-widest">
                {move}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <GameEndModal
        isOpen={!!matchWinner}
        result={matchWinner === 'player' ? 'win' : 'lose'}
        winnerName={matchWinner === 'player' ? 'You' : 'AI'}
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
