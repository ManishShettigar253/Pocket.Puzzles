import { useState, useCallback, useEffect, useRef } from 'react'
import { checkTTTWinner, isBoardFull, getAIMove, type TTTBoard, type TTTDifficulty } from '../utils/minimax'
import type { GameMode } from '../components/ModeSelector'
import type { Difficulty } from '../components/DifficultySelector'
import { useStats } from './useStats'

export interface TicTacToeState {
  board: TTTBoard
  currentPlayer: 'X' | 'O'
  winner: string | null
  winningLine: number[] | null
  isDraw: boolean
  gameOver: boolean
  moveCount: number
  scores: { p1: number; p2: number }
  mode: GameMode
  difficulty: Difficulty
}

export function useTicTacToe() {
  const [board, setBoard] = useState<TTTBoard>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X')
  const [winner, setWinner] = useState<string | null>(null)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [mode, setMode] = useState<GameMode>('pvai')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const isAIThinking = useRef(false)
  const { recordResult } = useStats('tic-tac-toe')

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setWinningLine(null)
    setIsDraw(false)
    setGameOver(false)
    setMoveCount(0)
    isAIThinking.current = false
  }, [])

  const resetScores = useCallback(() => {
    setScores({ p1: 0, p2: 0 })
  }, [])

  const changeMode = useCallback((newMode: GameMode) => {
    setMode(newMode)
    resetBoard()
    resetScores()
  }, [resetBoard, resetScores])

  const changeDifficulty = useCallback((newDiff: Difficulty) => {
    setDifficulty(newDiff)
    resetBoard()
  }, [resetBoard])

  const makeMove = useCallback(
    (index: number) => {
      if (board[index] !== null || gameOver || isAIThinking.current) return false

      const newBoard = [...board]
      newBoard[index] = currentPlayer
      setBoard(newBoard)
      setMoveCount((c) => c + 1)

      const result = checkTTTWinner(newBoard)
      if (result.winner) {
        setWinner(result.winner)
        setWinningLine(result.line)
        setGameOver(true)
        if (result.winner === 'X') {
          setScores((s) => ({ ...s, p1: s.p1 + 1 }))
          if (mode === 'pvai') recordResult('win')
        } else {
          setScores((s) => ({ ...s, p2: s.p2 + 1 }))
          if (mode === 'pvai') recordResult('loss')
        }
        return true
      }

      if (isBoardFull(newBoard)) {
        setIsDraw(true)
        setGameOver(true)
        if (mode === 'pvai') recordResult('draw')
        return true
      }

      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
      return true
    },
    [board, currentPlayer, gameOver, mode, recordResult]
  )

  // AI auto-move
  useEffect(() => {
    if (mode !== 'pvai' || currentPlayer !== 'O' || gameOver) return
    isAIThinking.current = true

    const timer = setTimeout(() => {
      const aiMove = getAIMove([...board], difficulty as TTTDifficulty, 'O', 'X')
      if (aiMove >= 0) {
        const newBoard = [...board]
        newBoard[aiMove] = 'O'
        setBoard(newBoard)
        setMoveCount((c) => c + 1)

        const result = checkTTTWinner(newBoard)
        if (result.winner) {
          setWinner(result.winner)
          setWinningLine(result.line)
          setGameOver(true)
          setScores((s) => ({ ...s, p2: s.p2 + 1 }))
          recordResult('loss')
          isAIThinking.current = false
          return
        }
        if (isBoardFull(newBoard)) {
          setIsDraw(true)
          setGameOver(true)
          recordResult('draw')
          isAIThinking.current = false
          return
        }
        setCurrentPlayer('X')
      }
      isAIThinking.current = false
    }, 400)

    return () => clearTimeout(timer)
  }, [board, currentPlayer, gameOver, mode, difficulty, recordResult])

  return {
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
  }
}
