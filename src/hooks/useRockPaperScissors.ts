import { useState, useCallback } from 'react'
import { useStats } from './useStats'

export type Move = 'rock' | 'paper' | 'scissors' | null
export type Result = 'win' | 'loss' | 'draw' | null

const MOVES: Move[] = ['rock', 'paper', 'scissors']

export function useRockPaperScissors() {
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  
  const [playerChoice, setPlayerChoice] = useState<Move>(null)
  const [aiChoice, setAiChoice] = useState<Move>(null)
  
  const [result, setResult] = useState<Result>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [matchWinner, setMatchWinner] = useState<'player' | 'ai' | null>(null)
  
  const { recordResult } = useStats('rock-paper-scissors')

  const TARGET_SCORE = 3

  const playRound = useCallback((choice: Move) => {
    if (isRevealing || choice === null || matchWinner) return

    setPlayerChoice(choice)
    setAiChoice(null)
    setResult(null)
    setIsRevealing(true)

    // Simulate "thinking" / suspense
    setTimeout(() => {
      const randomChoice = MOVES[Math.floor(Math.random() * MOVES.length)]
      setAiChoice(randomChoice)

      let roundResult: Result = 'draw'

      if (choice === randomChoice) {
        roundResult = 'draw'
      } else if (
        (choice === 'rock' && randomChoice === 'scissors') ||
        (choice === 'paper' && randomChoice === 'rock') ||
        (choice === 'scissors' && randomChoice === 'paper')
      ) {
        roundResult = 'win'
      } else {
        roundResult = 'loss'
      }

      setResult(roundResult)
      
      let newPlayerScore = playerScore
      let newAiScore = aiScore

      if (roundResult === 'win') {
        newPlayerScore += 1
        setPlayerScore(newPlayerScore)
      }
      if (roundResult === 'loss') {
        newAiScore += 1
        setAiScore(newAiScore)
      }

      if (newPlayerScore === TARGET_SCORE) {
        setMatchWinner('player')
        recordResult('win')
      } else if (newAiScore === TARGET_SCORE) {
        setMatchWinner('ai')
        recordResult('loss')
      }

      setIsRevealing(false)
    }, 1000) // Reduced to 1s for snappier play
  }, [isRevealing, matchWinner, playerScore, aiScore, recordResult])

  const resetGame = useCallback(() => {
    setPlayerScore(0)
    setAiScore(0)
    setPlayerChoice(null)
    setAiChoice(null)
    setResult(null)
    setIsRevealing(false)
    setMatchWinner(null)
  }, [])

  return {
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
  }
}
