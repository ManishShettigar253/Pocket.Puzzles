import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react'
import TopBar from '../components/TopBar'
import Layout from '../components/Layout'
import { useHandCricket } from '../hooks/useHandCricket'
import { useBlocker } from 'react-router-dom'
import ConfirmExitModal from '../components/ConfirmExitModal'
import { useEffect, useState, useRef } from 'react'

const formatOvers = (balls: number) => {
  const overs = Math.floor(balls / 6)
  const remainder = balls % 6
  return `${overs}.${remainder}`
}

const HAND_EMOJIS: Record<number, string> = {
  0: '✊',
  1: '☝️',
  2: '✌️',
  3: '🤟',
  4: '🖖',
  5: '🖐️',
  6: '👍',
}

function OversSelector({ value, onChange }: { value: number | null, onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 shadow-sm shrink-0">
      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 w-[80px] text-center shrink-0">Overs</span>
      <div className="flex items-center">
        <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
        {[1, 2, 5, null].map(o => (
          <button 
            key={String(o)}
            onClick={() => onChange(o)}
            className={`relative flex items-center justify-center w-10 h-8 rounded-xl text-sm font-semibold transition-colors ${
              value === o ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {value === o && (
              <motion.div
                layoutId="overs-pill"
                className="absolute inset-0 bg-primary-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{o === null ? '∞' : o}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function WicketsSelector({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1 shadow-sm shrink-0">
      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 w-[80px] text-center shrink-0">Wickets</span>
      <div className="flex items-center">
        <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
        {[1, 3, 5, 10].map(w => (
          <button 
            key={w}
            onClick={() => onChange(w)}
            className={`relative flex items-center justify-center w-10 h-8 rounded-xl text-sm font-semibold transition-colors ${
              value === w ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {value === w && (
              <motion.div
                layoutId="wickets-pill"
                className="absolute inset-0 bg-primary-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{w}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function HandCricket() {
  const {
    phase,
    totalOvers,
    totalWickets,
    tossChoice,
    tossResultOutcome,
    tossWinner,
    playerRole,
    playerScore,
    aiScore,
    playerWickets,
    aiWickets,
    playerBalls,
    aiBalls,
    target,
    playerLastPlay,
    aiLastPlay,
    currentInningsHistory,
    result,
    commentary,
    setTotalOvers,
    setTotalWickets,
    chooseToss,
    chooseRole,
    startGame,
    playNumber,
    resetGame,
    startSecondInnings,
  } = useHandCricket()
  const [showAllOvers, setShowAllOvers] = useState(false)
  const [playerFloat, setPlayerFloat] = useState<{ id: number, text: string, color: string } | null>(null)
  const [aiFloat, setAiFloat] = useState<{ id: number, text: string, color: string } | null>(null)
  const prevHistoryLengthRef = useRef(0)
  const isAiBatting = playerRole === 'bowl'

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      phase !== 'toss_selection' && phase !== 'game_over' && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (currentInningsHistory.length > prevHistoryLengthRef.current) {
      const lastRun = currentInningsHistory[currentInningsHistory.length - 1]
      const text = lastRun === 'W' ? 'OUT!' : `+${lastRun}`
      const color = lastRun === 'W' ? 'text-rose-500' : 'text-primary-500'
      const id = Date.now()
      
      if (isAiBatting) {
        setAiFloat({ id, text, color })
        setTimeout(() => {
          setAiFloat(prev => prev?.id === id ? null : prev)
        }, 900)
      } else {
        setPlayerFloat({ id, text, color })
        setTimeout(() => {
          setPlayerFloat(prev => prev?.id === id ? null : prev)
        }, 900)
      }
    }
    prevHistoryLengthRef.current = currentInningsHistory.length
  }, [currentInningsHistory, isAiBatting])

  // Group history into overs
  const overs = []
  for (let i = 0; i < currentInningsHistory.length; i += 6) {
    overs.push(currentInningsHistory.slice(i, i + 6))
  }
  const currentOver = overs.length > 0 ? overs[overs.length - 1] : []

  const [showResultModal, setShowResultModal] = useState(false)

  useEffect(() => {
    if (phase === 'game_over') {
      setTimeout(() => setShowResultModal(true), 1500)
    } else {
      setShowResultModal(false)
    }
    // Always close the dropdown when phase changes (e.g. innings break)
    setShowAllOvers(false)
  }, [phase])

  return (
    <Layout className="bg-[var(--bg-primary)]">
      <TopBar 
        title="Hand Cricket" 
        onRestart={() => { resetGame(); setShowAllOvers(false) }}
        showSettings={true}
        customSettings={
          <div className="flex flex-col items-center gap-2 shrink-0">
            <OversSelector value={totalOvers} onChange={setTotalOvers} />
            <WicketsSelector value={totalWickets} onChange={setTotalWickets} />
          </div>
        }
      />

      <div className="flex-1 flex flex-col w-full max-w-lg mx-auto overflow-y-auto hide-scrollbar relative">
        <div className="relative z-10 flex-1 flex flex-col p-4 sm:p-6 gap-6">

          {/* Scoreboard */}
          {(phase === 'first_innings' || phase === 'second_innings' || phase === 'game_over') && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-card)] rounded-3xl p-5 shadow-sm border border-[var(--border-color)] flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Batting Side Info */}
              <div className="flex justify-between items-end border-b border-[var(--border-color)] pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    {isAiBatting ? 'AI BATTING' : 'YOU BATTING'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1 relative">
                    <span className="text-4xl font-black tabular-nums text-[var(--text-primary)] leading-none">
                      {isAiBatting ? aiScore : playerScore}
                    </span>
                    <span className="text-xl font-bold text-[var(--text-secondary)]">
                      -{isAiBatting ? aiWickets : playerWickets}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">OVERS</span>
                  <span className="text-xl font-black tabular-nums text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded-lg mt-1 border border-[var(--border-color)]">
                    {formatOvers(isAiBatting ? aiBalls : playerBalls)}
                    <span className="text-xs text-[var(--text-secondary)] ml-1">
                      / {totalOvers === null ? '∞' : totalOvers}
                    </span>
                  </span>
                </div>
              </div>

              {/* Target / Bowling Side Info */}
              {phase !== 'first_innings' && (
                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">
                      {isAiBatting ? 'YOUR 1ST INN SCORE' : 'AI 1ST INN SCORE'}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-[var(--text-primary)] mt-0.5">
                      {!isAiBatting ? aiScore : playerScore}-{!isAiBatting ? aiWickets : playerWickets} 
                      <span className="text-xs ml-1 text-[var(--text-secondary)]">({formatOvers(!isAiBatting ? aiBalls : playerBalls)})</span>
                    </span>
                  </div>

                  {target !== null && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">TARGET</span>
                      <span className="text-lg font-black tabular-nums text-amber-500">{target}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Run Tracker */}
          {(phase === 'first_innings' || phase === 'second_innings' || phase === 'game_over') && (
            <div className="flex flex-col gap-3">

              {/* Ball-by-ball Tracker */}
              <div className="bg-[var(--bg-card)] rounded-xl p-2.5 border border-[var(--border-color)] flex flex-col gap-2">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar min-h-[44px]">
                  <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest shrink-0 px-2">RECENT</span>
                  <div className="flex gap-1.5 ml-auto">
                    {currentOver.length === 0 ? (
                      <span className="text-xs text-[var(--text-secondary)] font-medium italic pr-2">No balls bowled yet</span>
                    ) : (
                      currentOver.map((run, i) => (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm shrink-0
                            ${run === 'W' 
                              ? 'bg-rose-500 text-white' 
                              : run === 6 
                                ? 'bg-fuchsia-500 text-white'
                                : run === 4
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]'
                            }
                          `}
                        >
                          {run}
                        </motion.div>
                      ))
                    )}
                  </div>
                  {overs.length > 1 && (
                    <button 
                      onClick={() => setShowAllOvers(!showAllOvers)}
                      className="ml-2 w-7 h-7 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                    >
                      {showAllOvers ? <ChevronUp size={16} className="text-[var(--text-secondary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />}
                    </button>
                  )}
                </div>

                {/* Expanded Overs History */}
                <AnimatePresence>
                  {showAllOvers && overs.length > 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-[var(--border-color)] pt-2"
                    >
                      <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                        {overs.slice(0, -1).map((over, overIdx) => (
                          <div key={overIdx} className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest shrink-0 px-2">OVR {overIdx + 1}</span>
                            <div className="flex gap-1.5 ml-auto mr-9">
                              {over.map((run, ballIdx) => (
                                <div 
                                  key={ballIdx}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm shrink-0
                                    ${run === 'W' 
                                      ? 'bg-rose-500 text-white' 
                                      : run === 6 
                                        ? 'bg-fuchsia-500 text-white'
                                        : run === 4
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]'
                                    }
                                  `}
                                >
                                  {run}
                                </div>
                              ))}
                            </div>
                          </div>
                        )).reverse()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* VS Arena */}
          {(phase === 'first_innings' || phase === 'second_innings' || phase === 'game_over') && (
            <div className="flex justify-between items-center px-2 py-4 relative my-auto">
              {/* Player Hand */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest bg-[var(--bg-card)] px-3 py-1 rounded-full border border-[var(--border-color)]">You</span>
                <motion.div 
                  key={`player-${playerLastPlay}-${playerBalls}`}
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-24 h-28 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl flex items-center justify-center shadow-md relative"
                >
                  <AnimatePresence>
                    {playerFloat && (
                      <motion.div
                        key={playerFloat.id}
                        initial={{ opacity: 1, scale: 1.5, y: -40, x: 0 }}
                        animate={{ opacity: 0.3, scale: 0.5, y: -260, x: -30 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeIn" }}
                        className={`absolute inset-0 m-auto w-max h-max z-50 font-black drop-shadow-2xl text-4xl ${playerFloat.color} pointer-events-none`}
                      >
                        {playerFloat.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent rounded-3xl overflow-hidden pointer-events-none"></div>
                  <span className="text-[72px] leading-none drop-shadow-md pb-2">
                    {playerLastPlay !== null ? HAND_EMOJIS[playerLastPlay] : <span className="text-[var(--text-secondary)] opacity-30">?</span>}
                  </span>
                  {playerLastPlay !== null && (
                    <div className="absolute bottom-2 right-2.5 bg-[var(--bg-primary)]/80 backdrop-blur-sm rounded-lg px-2 py-0.5 border border-[var(--border-color)] shadow-sm flex items-center justify-center">
                      <span className="text-xs font-black tabular-nums text-primary-500">{playerLastPlay}</span>
                    </div>
                  )}
                </motion.div>
              </div>

              <div className="flex flex-col items-center justify-center z-10 bg-[var(--bg-primary)] w-12 h-12 rounded-full border border-[var(--border-color)] shadow-sm">
                <span className="text-sm font-black text-[var(--text-secondary)] italic">VS</span>
              </div>

              {/* AI Hand */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest bg-[var(--bg-card)] px-3 py-1 rounded-full border border-[var(--border-color)]">AI</span>
                <motion.div 
                  key={`ai-${aiLastPlay}-${aiBalls}`}
                  initial={{ scale: 0.5, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-24 h-28 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl flex items-center justify-center shadow-md relative"
                >
                  <AnimatePresence>
                    {aiFloat && (
                      <motion.div
                        key={aiFloat.id}
                        initial={{ opacity: 1, scale: 1.5, y: -40, x: 0 }}
                        animate={{ opacity: 0.3, scale: 0.5, y: -260, x: -180 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeIn" }}
                        className={`absolute inset-0 m-auto w-max h-max z-50 font-black drop-shadow-2xl text-4xl ${aiFloat.color} pointer-events-none`}
                      >
                        {aiFloat.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent rounded-3xl overflow-hidden pointer-events-none"></div>
                  <span className="text-[72px] leading-none drop-shadow-md pb-2">
                    {aiLastPlay !== null ? HAND_EMOJIS[aiLastPlay] : <span className="text-[var(--text-secondary)] opacity-30">?</span>}
                  </span>
                  {aiLastPlay !== null && (
                    <div className="absolute bottom-2 right-2.5 bg-[var(--bg-primary)]/80 backdrop-blur-sm rounded-lg px-2 py-0.5 border border-[var(--border-color)] shadow-sm flex items-center justify-center">
                      <span className="text-xs font-black tabular-nums text-rose-500">{aiLastPlay}</span>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {/* Toss Flow UI */}
          {['toss_selection', 'toss_animation', 'toss_result'].includes(phase) && (
            <div className="bg-[var(--bg-card)] rounded-3xl p-6 shadow-md border border-[var(--border-color)] flex flex-col gap-6 w-full max-w-sm mx-auto my-auto relative overflow-hidden">
              <h2 className="text-2xl font-black text-center mb-2 text-[var(--text-primary)]">The Toss</h2>

              {/* Heads or Tails */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={() => chooseToss('heads')} 
                    disabled={tossChoice !== null}
                    className={`flex-1 py-4 rounded-xl font-black text-lg transition-all border ${tossChoice === 'heads' ? 'bg-primary-500 text-white border-primary-500 shadow-md' : tossChoice === 'tails' ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] opacity-50' : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:brightness-95 text-[var(--text-primary)]'}`}
                  >
                    HEADS
                  </button>
                  <button 
                    onClick={() => chooseToss('tails')} 
                    disabled={tossChoice !== null}
                    className={`flex-1 py-4 rounded-xl font-black text-lg transition-all border ${tossChoice === 'tails' ? 'bg-primary-500 text-white border-primary-500 shadow-md' : tossChoice === 'heads' ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] opacity-50' : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:brightness-95 text-[var(--text-primary)]'}`}
                  >
                    TAILS
                  </button>
                </div>
              </div>

              {/* Coin Animation */}
              {(phase === 'toss_animation' || phase === 'toss_result') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-4 items-center overflow-hidden">
                  <div className="perspective-1000 w-32 h-32 my-4 relative">
                    <motion.div
                      animate={
                        phase === 'toss_animation' 
                        ? { rotateX: [0, 1800, 3600], y: [0, -100, 0] } 
                        : { rotateX: tossResultOutcome === 'tails' ? 180 : 0, y: 0 }
                      }
                      transition={
                        phase === 'toss_animation' 
                        ? { duration: 2.4, ease: 'easeInOut' }
                        : { type: 'spring', stiffness: 200, damping: 20 }
                      }
                      className="w-full h-full relative preserve-3d"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* HEADS SIDE */}
                      <div className="absolute inset-0 rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-xl flex items-center justify-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="absolute inset-1 rounded-full border border-slate-400/50 flex flex-col items-center justify-center">
                          <span className="text-5xl drop-shadow-sm filter grayscale contrast-125">🦁</span>
                          <span className="text-[9px] font-black text-slate-700 mt-1 uppercase tracking-widest drop-shadow-sm">INDIA</span>
                        </div>
                      </div>
                      {/* TAILS SIDE (Number 1) */}
                      <div className="absolute inset-0 rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-xl flex items-center justify-center backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                        <div className="absolute inset-1 rounded-full border border-slate-400/50 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-slate-700 tabular-nums drop-shadow-sm leading-none">1</span>
                          <span className="text-[9px] font-black text-slate-700 mt-1 uppercase tracking-widest drop-shadow-sm">RUPEE</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Decision */}
              {phase === 'toss_result' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-3 relative z-10">
                  {playerRole ? (
                    <div className="flex flex-col gap-4">
                      <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)] text-center">
                        <span className="font-bold text-[var(--text-primary)]">
                          {tossWinner === 'player' ? `You chose to ${playerRole.toUpperCase()}!` : `AI chose to ${playerRole === 'bat' ? 'BOWL' : 'BAT'}!`}
                        </span>
                      </div>
                      <button onClick={startGame} className="w-full py-4 rounded-xl bg-primary-600 text-white font-black text-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        START GAME
                      </button>
                    </div>
                  ) : tossWinner === 'player' ? (
                    <div className="flex flex-col gap-3">
                      <span className="text-center font-black text-primary-500 mb-1">You won the toss!</span>
                      <div className="flex gap-3">
                        <button onClick={() => chooseRole('bat')} className="flex-1 py-4 rounded-xl bg-primary-500 text-white font-black text-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">
                          BAT
                        </button>
                        <button onClick={() => chooseRole('bowl')} className="flex-1 py-4 rounded-xl bg-accent-500 text-white font-black text-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">
                          BOWL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)] text-center">
                      <span className="font-bold text-[var(--text-primary)]">AI won the toss!</span>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Waiting for AI's decision...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Input Controls (Number Pad) */}
          {(phase === 'first_innings' || phase === 'second_innings') && (
            <div className="mt-auto pt-4 pb-2 z-20 w-full">
              <div className="flex flex-wrap gap-2 sm:gap-3 max-w-[280px] mx-auto px-2 pb-2 justify-center">
                {[1, 2, 3, 4, 5, 6, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => playNumber(num)}
                    className="relative shrink-0 w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col items-center justify-center hover:border-primary-500/50 hover:bg-[var(--bg-primary)] active:scale-95 transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-600/0 group-hover:from-primary-500/10 group-hover:to-primary-600/10 transition-colors"></div>
                    <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] relative z-10">{num}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Innings Break Modal */}
      <AnimatePresence>
        {phase === 'innings_break' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-[var(--bg-card)] rounded-[32px] p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden border border-[var(--border-color)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/10 opacity-50"></div>
              
              <div className="relative z-10 flex flex-col items-center w-full">
                <span className="text-sm font-black text-primary-500 tracking-widest uppercase mb-1">Innings Break</span>
                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">Target: <span className="text-amber-500">{target}</span></h2>
                
                <div className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-4 my-4 max-h-[220px] overflow-y-auto flex flex-col gap-2">
                  {overs.map((over, overIdx) => (
                    <div key={overIdx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest w-12 shrink-0 text-left">Ovr {overIdx + 1}</span>
                      <div className="flex gap-1.5 flex-1 flex-wrap">
                        {over.map((run, ballIdx) => (
                          <div 
                            key={ballIdx}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0
                              ${run === 'W' 
                                ? 'bg-rose-500 text-white' 
                                : run === 6 
                                  ? 'bg-fuchsia-500 text-white'
                                  : run === 4
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)]'
                              }
                            `}
                          >
                            {run}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={startSecondInnings}
                  className="w-full py-4 rounded-xl bg-primary-600 text-white font-black text-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform mt-2"
                >
                  START 2ND INNINGS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-[var(--bg-card)] rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden border border-[var(--border-color)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/10 opacity-50"></div>
              
              <div className="relative z-10 flex flex-col items-center w-full">
                {result === 'win' && (
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg ring-4 ring-yellow-500/20">
                    <Trophy size={48} className="text-white drop-shadow-md" />
                  </div>
                )}
                {result === 'loss' && (
                  <div className="w-24 h-24 bg-[var(--bg-primary)] rounded-full flex items-center justify-center mb-6 shadow-inner border-2 border-[var(--border-color)]">
                    <span className="text-5xl filter grayscale">😢</span>
                  </div>
                )}
                {result === 'draw' && (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg ring-4 ring-blue-500/20">
                    <span className="text-5xl text-white font-black drop-shadow-md">🤝</span>
                  </div>
                )}

                <h2 className="text-3xl font-black mb-2 text-[var(--text-primary)]">
                  {result === 'win' ? 'You Won!' : result === 'loss' ? 'You Lost!' : 'Draw!'}
                </h2>
                
                <p className="text-[var(--text-secondary)] font-medium mb-8 text-sm">
                  {commentary}
                </p>

                <div className="flex gap-4 w-full mb-6">
                  <div className="flex-1 bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-color)]">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)] block mb-1">Your Score</span>
                    <span className="text-xl font-black text-[var(--text-primary)]">{playerScore}-{playerWickets}</span>
                  </div>
                  <div className="flex-1 bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-color)]">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)] block mb-1">AI Score</span>
                    <span className="text-xl font-black text-[var(--text-primary)]">{aiScore}-{aiWickets}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowResultModal(false)
                    resetGame()
                  }}
                  className="w-full py-4 rounded-2xl bg-primary-600 text-white font-black text-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={20} />
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmExitModal
        isOpen={blocker.state === 'blocked'}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </Layout>
  )
}
