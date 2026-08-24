import { useState, useCallback, useEffect, useRef } from 'react'
import {
  createEmptyBoard,
  dropPiece,
  checkC4Winner,
  isBoardFull,
  getC4AIMove,
  type C4Board,
  type C4Cell,
  type C4Difficulty,
} from '../utils/connectFourLogic'
import type { GameMode } from '../components/ModeSelector'
import type { Difficulty } from '../components/DifficultySelector'
import { useStats } from './useStats'

export function useConnectFour() {
  const [board, setBoard] = useState<C4Board>(() => createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<C4Cell>('R')
  const [winner, setWinner] = useState<C4Cell>(null)
  const [winningCells, setWinningCells] = useState<[number, number][] | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(null)
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [mode, setMode] = useState<GameMode>('pvai')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const isAIThinking = useRef(false)
  const { recordResult } = useStats('connect-four')

  const resetBoard = useCallback(() => {
    setBoard(createEmptyBoard())
    setCurrentPlayer('R')
    setWinner(null)
    setWinningCells(null)
    setIsDraw(false)
    setGameOver(false)
    setLastDrop(null)
    isAIThinking.current = false
  }, [])

  const changeMode = useCallback((newMode: GameMode) => {
    setMode(newMode)
    setScores({ p1: 0, p2: 0 })
    resetBoard()
  }, [resetBoard])

  const changeDifficulty = useCallback((newDiff: Difficulty) => {
    setDifficulty(newDiff)
    resetBoard()
  }, [resetBoard])

  const drop = useCallback(
    (col: number) => {
      if (gameOver || isAIThinking.current) return false

      const result = dropPiece(board, col, currentPlayer)
      if (!result) return false

      setBoard(result.newBoard)
      setLastDrop({ row: result.row, col })

      const winResult = checkC4Winner(result.newBoard)
      if (winResult.winner) {
        setWinner(winResult.winner)
        setWinningCells(winResult.cells)
        setGameOver(true)
        if (winResult.winner === 'R') {
          setScores((s) => ({ ...s, p1: s.p1 + 1 }))
          if (mode === 'pvai') recordResult('win')
        } else {
          setScores((s) => ({ ...s, p2: s.p2 + 1 }))
          if (mode === 'pvai') recordResult('loss')
        }
        return true
      }

      if (isBoardFull(result.newBoard)) {
        setIsDraw(true)
        setGameOver(true)
        if (mode === 'pvai') recordResult('draw')
        return true
      }

      setCurrentPlayer(currentPlayer === 'R' ? 'Y' : 'R')
      return true
    },
    [board, currentPlayer, gameOver, mode, recordResult]
  )

  // AI auto-move
  useEffect(() => {
    if (mode !== 'pvai' || currentPlayer !== 'Y' || gameOver) return
    isAIThinking.current = true

    const timer = setTimeout(() => {
      const aiCol = getC4AIMove([...board.map((r) => [...r])], difficulty as C4Difficulty, 'Y')
      if (aiCol >= 0) {
        const result = dropPiece(board, aiCol, 'Y')
        if (result) {
          setBoard(result.newBoard)
          setLastDrop({ row: result.row, col: aiCol })

          const winResult = checkC4Winner(result.newBoard)
          if (winResult.winner) {
            setWinner(winResult.winner)
            setWinningCells(winResult.cells)
            setGameOver(true)
            setScores((s) => ({ ...s, p2: s.p2 + 1 }))
            recordResult('loss')
            isAIThinking.current = false
            return
          }
          if (isBoardFull(result.newBoard)) {
            setIsDraw(true)
            setGameOver(true)
            recordResult('draw')
            isAIThinking.current = false
            return
          }
          setCurrentPlayer('R')
        }
      }
      isAIThinking.current = false
    }, 500)

    return () => clearTimeout(timer)
  }, [board, currentPlayer, gameOver, mode, difficulty, recordResult])

  return {
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
  }
}
