import { useState, useEffect, useCallback } from 'react'
import { useStats } from './useStats'

export interface Card {
  id: string
  value: string
  isFlipped: boolean
  isMatched: boolean
}

const ICONS = [
  '🚀', '👾', '👻', '💎', '🎮', '🧩', '🌟', '🔥', 
  '🍔', '🍕', '🌮', '🍣', '🍩', '🍪', '🍦', '🍓',
  '🐶', '🐱', '🦊', '🐼', '🐸', '🦄', '🐝', '🐙',
  '🎸', '🥁', '🎷', '🎺', '🎻', '🎹', '🎨', '🎬'
]

export function useMemoryMatch(initialGridSize: number = 16) {
  const [gridSize, setGridSize] = useState(initialGridSize)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const { recordResult } = useStats('memory-match')

  const maxMoves = gridSize === 16 ? 20 : gridSize === 36 ? 45 : 90

  const initializeGame = useCallback((size: number) => {
    const pairsCount = size / 2
    // Select random icons for this game
    const shuffledIcons = [...ICONS].sort(() => Math.random() - 0.5)
    const selectedIcons = shuffledIcons.slice(0, pairsCount)
    
    const cardValues = [...selectedIcons, ...selectedIcons]
    const shuffledCards: Card[] = cardValues
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: `card-${index}`,
        value,
        isFlipped: false,
        isMatched: false,
      }))
      
    setCards(shuffledCards)
    setFlippedIndices([])
    setMoves(0)
    setIsGameOver(false)
    setHasWon(false)
    setIsLocked(false)
  }, [])

  useEffect(() => {
    initializeGame(gridSize)
  }, [gridSize, initializeGame])

  const flipCard = useCallback((index: number) => {
    if (isLocked || isGameOver) return false
    if (cards[index].isFlipped || cards[index].isMatched) return false

    const newCards = [...cards]
    newCards[index].isFlipped = true
    setCards(newCards)

    const newFlippedIndices = [...flippedIndices, index]
    setFlippedIndices(newFlippedIndices)

    if (newFlippedIndices.length === 2) {
      setIsLocked(true)
      const nextMoves = moves + 1
      setMoves(nextMoves)
      
      const [firstIndex, secondIndex] = newFlippedIndices
      
      if (newCards[firstIndex].value === newCards[secondIndex].value) {
        // Match found
        setTimeout(() => {
          setCards((prev) => {
            const matched = [...prev]
            matched[firstIndex].isMatched = true
            matched[secondIndex].isMatched = true
            return matched
          })
          setFlippedIndices([])
          setIsLocked(false)
          
          // Check win condition
          setCards((currentCards) => {
            const allMatched = currentCards.every(c => c.isMatched)
            if (allMatched) {
              setIsGameOver(true)
              setHasWon(true)
              recordResult('win')
            } else if (nextMoves >= maxMoves) {
              setIsGameOver(true)
              setHasWon(false)
              recordResult('loss')
            }
            return currentCards
          })
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const flippedBack = [...prev]
            flippedBack[firstIndex].isFlipped = false
            flippedBack[secondIndex].isFlipped = false
            return flippedBack
          })
          setFlippedIndices([])
          setIsLocked(false)
          
          // Check loss condition
          if (nextMoves >= maxMoves) {
            setIsGameOver(true)
            setHasWon(false)
            recordResult('loss')
          }
        }, 1000)
      }
    }
    return true
  }, [cards, flippedIndices, isLocked, moves, maxMoves, recordResult, isGameOver])

  const resetGame = useCallback(() => {
    initializeGame(gridSize)
  }, [initializeGame, gridSize])

  const changeGridSize = useCallback((size: number) => {
    setGridSize(size)
  }, [])

  return {
    cards,
    moves,
    maxMoves,
    isGameOver,
    hasWon,
    gridSize,
    flipCard,
    resetGame,
    changeGridSize,
  }
}
