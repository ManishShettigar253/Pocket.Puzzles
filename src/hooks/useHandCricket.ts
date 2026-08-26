import { useState, useCallback } from 'react'
import { useStats } from './useStats'
import { useSound } from './useSound'

export type GamePhase =
  | 'toss_selection' // Player choosing heads or tails
  | 'toss_animation' // Coin flipping animation
  | 'toss_result' // Toss result is shown, winner picks bat/bowl
  | 'first_innings' // First innings play
  | 'innings_break' // Between first and second innings
  | 'second_innings' // Second innings play (chasing target)
  | 'game_over' // Game finished

export type TossChoice = 'heads' | 'tails' | null
export type Role = 'bat' | 'bowl' | null

export function useHandCricket() {
  const [phase, setPhase] = useState<GamePhase>('toss_selection')
  
  // Settings
  const [totalOvers, setTotalOvers] = useState<number | null>(2) // null = unlimited
  const [totalWickets, setTotalWickets] = useState<number>(5)

  // Toss State
  const [tossChoice, setTossChoice] = useState<TossChoice>(null)
  const [tossResultOutcome, setTossResultOutcome] = useState<'heads' | 'tails' | null>(null)
  const [tossWinner, setTossWinner] = useState<'player' | 'ai' | null>(null)
  const [playerRole, setPlayerRole] = useState<Role>(null)
  
  // Game State
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [playerWickets, setPlayerWickets] = useState(0)
  const [aiWickets, setAiWickets] = useState(0)
  const [playerBalls, setPlayerBalls] = useState(0)
  const [aiBalls, setAiBalls] = useState(0)
  
  const [target, setTarget] = useState<number | null>(null)
  
  const [playerLastPlay, setPlayerLastPlay] = useState<number | null>(null)
  const [aiLastPlay, setAiLastPlay] = useState<number | null>(null)
  
  const [currentInningsHistory, setCurrentInningsHistory] = useState<(number | 'W')[]>([])
  
  const [result, setResult] = useState<'win' | 'loss' | 'draw' | null>(null)
  const [commentary, setCommentary] = useState<string>("Welcome to Hand Cricket! Heads or Tails?")

  const { recordResult } = useStats('hand-cricket')
  const { playHit, playWicket, playWin, playLose, playDraw, playClick } = useSound()

  const resetGame = useCallback(() => {
    setPhase('toss_selection')
    setTossChoice(null)
    setTossResultOutcome(null)
    setTossWinner(null)
    setPlayerRole(null)
    
    setPlayerScore(0)
    setAiScore(0)
    setPlayerWickets(0)
    setAiWickets(0)
    setPlayerBalls(0)
    setAiBalls(0)
    
    setTarget(null)
    setPlayerLastPlay(null)
    setAiLastPlay(null)
    setCurrentInningsHistory([])
    setResult(null)
    setCommentary("Welcome to Hand Cricket! Heads or Tails?")
  }, [])

  const chooseToss = useCallback((choice: 'heads' | 'tails') => {
    setTossChoice(choice)
    setPhase('toss_animation')
    setCommentary(`You chose ${choice.toUpperCase()}. Flipping the coin...`)
    
    // Determine outcome instantly but reveal after animation
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails'
    setTossResultOutcome(outcome)
    
    const playerWon = choice === outcome
    setTossWinner(playerWon ? 'player' : 'ai')
    
    setTimeout(() => {
      setPhase('toss_result')
      if (playerWon) {
        setCommentary(`It's ${outcome.toUpperCase()}! You won the toss. Bat or Bowl?`)
      } else {
        const aiChoice = Math.random() > 0.5 ? 'bat' : 'bowl'
        setCommentary(`It's ${outcome.toUpperCase()}. AI won and chose to ${aiChoice.toUpperCase()}.`)
        
        setTimeout(() => {
          setPlayerRole(aiChoice === 'bat' ? 'bowl' : 'bat')
          setCommentary(aiChoice === 'bat' ? "AI is batting first." : "You are batting first.")
        }, 3000)
      }
    }, 2500) // 2.5s flip animation
  }, [])

  const chooseRole = useCallback((role: 'bat' | 'bowl') => {
    setPlayerRole(role)
    setCommentary(role === 'bat' ? "You chose to bat." : "You chose to bowl.")
  }, [])

  const startGame = useCallback(() => {
    setPhase('first_innings')
    setPlayerLastPlay(null)
    setAiLastPlay(null)
    setCurrentInningsHistory([])
    setCommentary(playerRole === 'bat' ? "You are batting first. Score as much as you can!" : "AI is batting first. Get them out!")
  }, [playerRole])

  const getSmartAIChoice = (): number => {
    const rand = Math.random()
    if (rand < 0.1) return 0
    if (rand < 0.25) return 1
    if (rand < 0.4) return 2
    if (rand < 0.55) return 3
    if (rand < 0.7) return 4
    if (rand < 0.85) return 5
    return 6
  }

  const handleGameEnd = useCallback((draw: boolean = false, winner: 'player'|'ai'|null = null) => {
    if (draw) {
      setResult('draw')
      recordResult('draw')
      setPhase('game_over')
      setCommentary("GAME OVER! It's a DRAW! Scores are perfectly level.")
      playDraw()
    } else if (winner === 'player') {
      setResult('win')
      recordResult('win')
      setPhase('game_over')
      setCommentary("GAME OVER! You win! What a match.")
      playWin()
    } else if (winner === 'ai') {
      setResult('loss')
      recordResult('loss')
      setPhase('game_over')
      setCommentary("GAME OVER! AI wins! Better luck next time.")
      playLose()
    }
  }, [recordResult, playWin, playLose, playDraw])

  const startSecondInnings = useCallback(() => {
    setPhase('second_innings')
    setPlayerRole(playerRole === 'bat' ? 'bowl' : 'bat')
    setCurrentInningsHistory([])
    setCommentary(`INNINGS OVER! The target is ${target}. ${playerRole === 'bat' ? 'Defend it!' : 'Chase it down!'}`)
    
    // Reset last play for fresh start
    setPlayerLastPlay(null)
    setAiLastPlay(null)
  }, [playerRole, target])

  const playNumber = useCallback((playerNum: number) => {
    if (phase !== 'first_innings' && phase !== 'second_innings') return

    const isAiBatting = playerRole === 'bowl'
    const aiNum = getSmartAIChoice()
    
    setPlayerLastPlay(playerNum)
    setAiLastPlay(aiNum)

    const isWicket = playerNum === aiNum
    let newPlayerScore = playerScore
    let newAiScore = aiScore
    let newPlayerWickets = playerWickets
    let newAiWickets = aiWickets
    let newPlayerBalls = playerBalls
    let newAiBalls = aiBalls

    if (isAiBatting) {
      newAiBalls++
      if (isWicket) newAiWickets++
      else newAiScore += aiNum
    } else {
      newPlayerBalls++
      if (isWicket) newPlayerWickets++
      else newPlayerScore += playerNum
    }

    setPlayerScore(newPlayerScore)
    setAiScore(newAiScore)
    setPlayerWickets(newPlayerWickets)
    setAiWickets(newAiWickets)
    setPlayerBalls(newPlayerBalls)
    setAiBalls(newAiBalls)
    
    // Update history
    const runScored = (isWicket ? 'W' : (isAiBatting ? aiNum : playerNum)) as number | 'W'
    setCurrentInningsHistory(prev => [...prev, runScored])

    const isFirstInnings = phase === 'first_innings'
    
    if (isWicket) {
      setCommentary(`WICKET! Caught and bowled!`)
      playWicket()
    } else {
      setCommentary(`${isAiBatting ? 'AI' : 'You'} score ${runScored} runs.`)
      if (runScored !== 'W' && runScored > 0) playHit()
      else playClick()
    }

    if (!isFirstInnings) {
      const currentChaserScore = isAiBatting ? newAiScore : newPlayerScore
      if (currentChaserScore >= target!) {
         handleGameEnd(false, isAiBatting ? 'ai' : 'player')
         return
      }
    }

    // Check All Out or Overs Finished
    const currentWickets = isAiBatting ? newAiWickets : newPlayerWickets
    const currentBalls = isAiBatting ? newAiBalls : newPlayerBalls
    
    const isAllOut = currentWickets >= totalWickets
    const isOversFinished = totalOvers !== null && currentBalls >= (totalOvers * 6)

    if (isAllOut || isOversFinished) {
      if (isFirstInnings) {
        const setTargetScore = (isAiBatting ? newAiScore : newPlayerScore) + 1
        setTarget(setTargetScore)
        setPhase('innings_break')
      } else {
        // Second innings over without reaching target
        const currentChaserScore = isAiBatting ? newAiScore : newPlayerScore
        if (currentChaserScore === (target! - 1)) {
           handleGameEnd(true) // draw
        } else {
           handleGameEnd(false, isAiBatting ? 'player' : 'ai') // defender wins
        }
      }
    }

  }, [phase, playerRole, playerScore, aiScore, playerWickets, aiWickets, playerBalls, aiBalls, target, totalOvers, totalWickets, handleGameEnd, playWicket, playHit, playClick])

  return {
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
    startSecondInnings
  }
}
