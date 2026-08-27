import { useState, useCallback, useMemo, useEffect } from 'react'
import { LEVELS_4X4, LEVELS_5X5, LEVELS_6X6, type DotColor, type DotsLevel } from '../data/dotsLevels'

export type GridSize = 4 | 5 | 6

interface PathState {
  [color: string]: [number, number][]
}

export function useDotsConnect() {
  const [gridSize, setGridSize] = useState<GridSize>(5)
  const [currentRound, setCurrentRound] = useState(0) // 0 to 9
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  
  const [paths, setPaths] = useState<PathState>({})
  const [activeColor, setActiveColor] = useState<DotColor | null>(null)

  const currentLevels = useMemo(() => {
    if (gridSize === 4) return LEVELS_4X4
    if (gridSize === 5) return LEVELS_5X5
    if (gridSize === 6) return LEVELS_6X6
    return []
  }, [gridSize])

  const level: DotsLevel | undefined = currentLevels[currentRound]

  const startGame = useCallback((size: GridSize) => {
    setGridSize(size)
    setCurrentRound(0)
    setScore(0)
    setGameOver(false)
    setPaths({})
    setActiveColor(null)
  }, [])

  const nextRound = useCallback(() => {
    if (currentRound < 9) {
      setCurrentRound(prev => prev + 1)
      setPaths({})
      setActiveColor(null)
    } else {
      setGameOver(true)
    }
  }, [currentRound])

  // Helper to check if two coords are same
  const isSame = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]
  
  // Helper to check if adjacent
  const isAdjacent = (a: [number, number], b: [number, number]) => {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
  }

  // Helper to find what is at a given cell
  const getCellContent = useCallback((r: number, c: number) => {
    if (!level) return null
    // Check dots
    for (const dot of level.dots) {
      if (isSame([r, c], dot.start) || isSame([r, c], dot.end)) {
        return { type: 'dot', color: dot.color }
      }
    }
    // Check paths
    for (const color of Object.keys(paths) as DotColor[]) {
      const path = paths[color]
      const idx = path.findIndex(p => isSame([r, c], p))
      if (idx !== -1) {
        return { type: 'path', color, index: idx }
      }
    }
    return null
  }, [level, paths])

  const handlePointerDown = useCallback((r: number, c: number) => {
    if (gameOver || !level) return
    const content = getCellContent(r, c)
    if (!content) return

    if (content.type === 'dot') {
      // Start new path or reset existing path to this dot
      setActiveColor(content.color)
      setPaths(prev => ({
        ...prev,
        [content.color]: [[r, c]]
      }))
    } else if (content.type === 'path' && content.index !== undefined) {
      // Truncate path up to this point and start dragging
      setActiveColor(content.color as DotColor)
      setPaths(prev => {
        const currentPath = prev[content.color as DotColor] || []
        return {
          ...prev,
          [content.color as DotColor]: currentPath.slice(0, content.index! + 1)
        }
      })
    }
  }, [gameOver, level, getCellContent])

  const handlePointerEnter = useCallback((r: number, c: number) => {
    if (!activeColor || gameOver || !level) return

    setPaths(prev => {
      const currentPath = prev[activeColor] || []
      if (currentPath.length === 0) return prev

      const head = currentPath[currentPath.length - 1]
      
      // If entering the cell we are already in, do nothing
      if (isSame(head, [r, c])) return prev

      // If stepping back, pop
      if (currentPath.length > 1 && isSame(currentPath[currentPath.length - 2], [r, c])) {
        return {
          ...prev,
          [activeColor]: currentPath.slice(0, -1)
        }
      }

      // Must be adjacent
      if (!isAdjacent(head, [r, c])) return prev

      // Prevent dragging if the path is already complete
      // Check if current head is a dot and length > 1
      const headContent = getCellContent(head[0], head[1])
      if (currentPath.length > 1 && headContent?.type === 'dot') {
        // Wait, if it's the start dot, it's fine. If it's the end dot, the path is complete.
        // If the path is complete, we shouldn't extend it.
        const dotPair = level.dots.find(d => d.color === activeColor)
        if (dotPair) {
          const isStart = isSame(head, dotPair.start)
          const isEnd = isSame(head, dotPair.end)
          if ((isStart || isEnd) && currentPath.length > 1) {
            return prev // Already connected
          }
        }
      }

      const content = getCellContent(r, c)
      
      if (content) {
        if (content.type === 'dot') {
          if (content.color !== activeColor) return prev // Can't go into another color's dot
          // Entering our own dot -> connect!
          return {
            ...prev,
            [activeColor]: [...currentPath, [r, c]]
          }
        }
        
        if (content.type === 'path' && content.index !== undefined) {
          if (content.color === activeColor) {
            // Self-intersection: truncate path to this point
            return {
              ...prev,
              [activeColor]: currentPath.slice(0, content.index! + 1)
            }
          } else {
            // Break the other path!
            const newPrev = { ...prev }
            const otherPath = newPrev[content.color as DotColor] || []
            newPrev[content.color as DotColor] = otherPath.slice(0, content.index!)
            return {
              ...newPrev,
              [activeColor]: [...currentPath, [r, c]]
            }
          }
        }
      }

      // Empty cell
      return {
        ...prev,
        [activeColor]: [...currentPath, [r, c]]
      }
    })
  }, [activeColor, gameOver, level, getCellContent])

  const handlePointerUp = useCallback(() => {
    setActiveColor(null)
  }, [])

  // Check win condition
  useEffect(() => {
    if (!level || gameOver) return

    let allConnected = true
    let totalPathCells = 0

    for (const dot of level.dots) {
      const path = paths[dot.color]
      if (!path || path.length < 2) {
        allConnected = false
        break
      }
      const first = path[0]
      const last = path[path.length - 1]
      const connectsStart = isSame(first, dot.start) || isSame(first, dot.end)
      const connectsEnd = isSame(last, dot.start) || isSame(last, dot.end)
      
      if (!connectsStart || !connectsEnd) {
        allConnected = false
        break
      }
      totalPathCells += path.length
    }

    if (allConnected) {
      // Round Win!
      setScore(prev => prev + (level.gridSize === 4 ? 100 : level.gridSize === 5 ? 150 : 200))
      setTimeout(() => {
        nextRound()
      }, 800) // Small delay to show complete state
    }
  }, [paths, level, gameOver, nextRound])

  const quitGame = useCallback(() => {
    setGridSize(5)
  }, [])

  return {
    gridSize,
    currentRound,
    score,
    gameOver,
    level,
    paths,
    activeColor,
    startGame,
    nextRound,
    quitGame,
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp
  }
}
