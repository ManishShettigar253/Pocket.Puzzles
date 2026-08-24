import { useState, useCallback, useEffect, useRef } from 'react'
import {
  generateBingoBoard,
  createEmptyMarked,
  markNumberOnBoard,
  getCompletedLines,
  getAIBingoMove,
  type BingoBoard,
  type BingoMarked,
} from '../utils/bingoLogic'
import type { GameMode } from '../components/ModeSelector'
import { useStats } from './useStats'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
const WIN_LINES_COUNT = 5

export function useBingo() {
  const [p1Board, setP1Board] = useState<BingoBoard>(() => generateBingoBoard())
  const [p2Board, setP2Board] = useState<BingoBoard>(() => generateBingoBoard())
  const [p1Marked, setP1Marked] = useState<BingoMarked>(() => createEmptyMarked())
  const [p2Marked, setP2Marked] = useState<BingoMarked>(() => createEmptyMarked())
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set())
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [p1Lines, setP1Lines] = useState(0)
  const [p2Lines, setP2Lines] = useState(0)
  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [mode, setMode] = useState<GameMode>('pvai')
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const aiPending = useRef(false)
  const { recordResult } = useStats('bingo')

  const resetBoard = useCallback(() => {
    setP1Board(generateBingoBoard())
    setP2Board(generateBingoBoard())
    setP1Marked(createEmptyMarked())
    setP2Marked(createEmptyMarked())
    setCalledNumbers(new Set())
    setCurrentPlayer(1)
    setP1Lines(0)
    setP2Lines(0)
    setWinner(null)
    setGameOver(false)
    aiPending.current = false
  }, [])

  const changeMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode)
      setScores({ p1: 0, p2: 0 })
      resetBoard()
    },
    [resetBoard]
  )

  // Core logic: apply a number call and return result
  const applyNumber = useCallback(
    (num: number): { success: boolean; gameEnded: boolean } => {
      if (calledNumbers.has(num) || gameOver) return { success: false, gameEnded: false }

      const newCalled = new Set(calledNumbers)
      newCalled.add(num)
      setCalledNumbers(newCalled)

      // Mark on both boards
      const newP1Marked = markNumberOnBoard(p1Board, p1Marked, num)
      const newP2Marked = markNumberOnBoard(p2Board, p2Marked, num)
      setP1Marked(newP1Marked)
      setP2Marked(newP2Marked)

      // Count completed lines
      const p1CompletedLines = getCompletedLines(newP1Marked).length
      const p2CompletedLines = getCompletedLines(newP2Marked).length
      setP1Lines(p1CompletedLines)
      setP2Lines(p2CompletedLines)

      // Check win - P1
      if (p1CompletedLines >= WIN_LINES_COUNT) {
        setWinner(1)
        setGameOver(true)
        setScores((s) => ({ ...s, p1: s.p1 + 1 }))
        if (mode === 'pvai') recordResult('win')
        return { success: true, gameEnded: true }
      }
      // Check win - P2
      if (p2CompletedLines >= WIN_LINES_COUNT) {
        setWinner(2)
        setGameOver(true)
        setScores((s) => ({ ...s, p2: s.p2 + 1 }))
        if (mode === 'pvai') recordResult('loss')
        return { success: true, gameEnded: true }
      }

      // Switch player
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1))
      return { success: true, gameEnded: false }
    },
    [calledNumbers, gameOver, p1Board, p1Marked, p2Board, p2Marked, mode, recordResult]
  )

  // Player calls a number (blocked during AI turn)
  const callNumber = useCallback(
    (num: number) => {
      if (aiPending.current) return false
      const { success } = applyNumber(num)
      return success
    },
    [applyNumber]
  )

  const shuffleBoard = useCallback(
    (player: 1 | 2) => {
      if (calledNumbers.size > 0) return
      if (player === 1) {
        setP1Board(generateBingoBoard())
      } else {
        setP2Board(generateBingoBoard())
      }
    },
    [calledNumbers]
  )

  // AI auto-move: triggers when it's player 2's turn in PvAI
  useEffect(() => {
    if (mode !== 'pvai' || currentPlayer !== 2 || gameOver) return
    aiPending.current = true

    const timer = setTimeout(() => {
      const aiNum = getAIBingoMove(p2Board, p2Marked, calledNumbers)
      if (aiNum > 0) {
        // Directly apply — don't go through callNumber (which has the aiPending guard)
        applyNumber(aiNum)
      }
      aiPending.current = false
    }, 600)

    return () => {
      clearTimeout(timer)
      aiPending.current = false
    }
  }, [currentPlayer, gameOver, mode, p2Board, p2Marked, calledNumbers, applyNumber])

  return {
    p1Board,
    p2Board,
    p1Marked,
    p2Marked,
    calledNumbers,
    currentPlayer,
    p1Lines,
    p2Lines,
    winner,
    gameOver,
    scores,
    mode,
    bingoLetters: BINGO_LETTERS,
    callNumber,
    resetBoard,
    changeMode,
    shuffleBoard,
  }
}
