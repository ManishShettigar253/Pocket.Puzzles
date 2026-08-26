import { useState, useCallback, useEffect } from 'react'
import { useStats } from './useStats'

export type Tile = {
  id: string
  value: number
  row: number
  col: number
  isNew?: boolean
  isMerged?: boolean
  isDead?: boolean
}

const GRID_SIZE = 4

function getEmptyCells(tiles: Tile[]): { r: number; c: number }[] {
  const empty: { r: number; c: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!tiles.find((t) => t.row === r && t.col === c)) {
        empty.push({ r, c })
      }
    }
  }
  return empty
}

let tileIdCounter = 0
function generateTileId() {
  return `tile-${Date.now()}-${tileIdCounter++}`
}

function spawnRandomTile(tiles: Tile[]): Tile | null {
  const empty = getEmptyCells(tiles)
  if (empty.length === 0) return null
  const { r, c } = empty[Math.floor(Math.random() * empty.length)]
  return {
    id: generateTileId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: r,
    col: c,
    isNew: true,
  }
}

export function use2048() {
  const [gameState, setGameState] = useState<{ tiles: Tile[]; score: number }>({ tiles: [], score: 0 })
  const { tiles, score } = gameState
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [hasContinued, setHasContinued] = useState(false)

  const { recordResult } = useStats('2048')

  // Load best score on mount
  useEffect(() => {
    const savedBest = localStorage.getItem('2048-best-score')
    if (savedBest) setBestScore(parseInt(savedBest, 10))
  }, [])

  const updateBestScore = useCallback((newScore: number) => {
    setBestScore((prev) => {
      const best = Math.max(prev, newScore)
      localStorage.setItem('2048-best-score', best.toString())
      return best
    })
  }, [])

  const resetGame = useCallback(() => {
    const initialTiles: Tile[] = []
    const t1 = spawnRandomTile(initialTiles)
    if (t1) initialTiles.push(t1)
    const t2 = spawnRandomTile(initialTiles)
    if (t2) initialTiles.push(t2)
    
    setGameState({ tiles: initialTiles, score: 0 })
    setGameOver(false)
    setWon(false)
    setHasContinued(false)
  }, [])

  // Initialize on first render
  useEffect(() => {
    if (tiles.length === 0) {
      resetGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveTiles = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver || (won && !hasContinued)) return

      setGameState((prevState) => {
        const { tiles: prevTiles, score: prevScore } = prevState
        let hasMoved = false
        let addedScore = 0
        const newTiles: Tile[] = []
        
        // Remove 'isNew' and 'isMerged' flags from previous step, and filter out dead tiles
        const currentTiles = prevTiles
          .filter((t) => !t.isDead)
          .map((t) => ({ ...t, isNew: false, isMerged: false }))

        // Create a 2D map of current tiles for easy access
        const map = Array(GRID_SIZE).fill(null).map(() => Array<Tile | null>(GRID_SIZE).fill(null))
        currentTiles.forEach((t) => (map[t.row][t.col] = t))

        type LineItem = { tile: Tile | null; deadTiles: Tile[] }

        // We process row by row or col by col based on direction
        const traverse = (
          processLine: (line: (Tile | null)[]) => { newLine: LineItem[], moved: boolean, score: number }
        ) => {
          if (direction === 'LEFT' || direction === 'RIGHT') {
            for (let r = 0; r < GRID_SIZE; r++) {
              let line = map[r]
              if (direction === 'RIGHT') line = [...line].reverse()
              
              const { newLine, moved, score } = processLine(line)
              hasMoved = hasMoved || moved
              addedScore += score

              let finalLine = direction === 'RIGHT' ? [...newLine].reverse() : newLine
              finalLine.forEach((item, c) => {
                if (item.tile) {
                  item.tile.row = r
                  item.tile.col = c
                  newTiles.push(item.tile)
                }
                item.deadTiles.forEach(dt => {
                  dt.row = r
                  dt.col = c
                  newTiles.push(dt)
                })
              })
            }
          } else {
            for (let c = 0; c < GRID_SIZE; c++) {
              let line = [map[0][c], map[1][c], map[2][c], map[3][c]]
              if (direction === 'DOWN') line = [...line].reverse()

              const { newLine, moved, score } = processLine(line)
              hasMoved = hasMoved || moved
              addedScore += score

              let finalLine = direction === 'DOWN' ? [...newLine].reverse() : newLine
              finalLine.forEach((item, r) => {
                if (item.tile) {
                  item.tile.row = r
                  item.tile.col = c
                  newTiles.push(item.tile)
                }
                item.deadTiles.forEach(dt => {
                  dt.row = r
                  dt.col = c
                  newTiles.push(dt)
                })
              })
            }
          }
        }

        const slideAndMerge = (line: (Tile | null)[]) => {
          let moved = false
          let score = 0
          
          let compact = line.filter((t) => t !== null) as Tile[]

          let newLine: LineItem[] = []
          let i = 0
          while (i < compact.length) {
            if (i < compact.length - 1 && compact[i].value === compact[i + 1].value) {
              // Merge
              const mergedValue = compact[i].value * 2
              score += mergedValue
              newLine.push({
                tile: {
                  id: compact[i].id, // keep id for animation
                  value: mergedValue,
                  row: 0, col: 0,
                  isMerged: true,
                },
                deadTiles: [{ ...compact[i + 1], isDead: true }]
              })
              i += 2
              moved = true // merging implies movement
            } else {
              newLine.push({ tile: { ...compact[i] }, deadTiles: [] })
              i++
            }
          }

          // Strict check for movement before padding
          const originalVals = line.map((t) => (t ? t.value : 0))
          const newVals = newLine.map((item) => (item.tile ? item.tile.value : 0))
          // pad newVals for comparison
          while (newVals.length < GRID_SIZE) newVals.push(0)
          if (originalVals.join(',') !== newVals.join(',')) {
            moved = true
          }

          // Pad with nulls
          while (newLine.length < GRID_SIZE) {
            newLine.push({ tile: null, deadTiles: [] })
          }

          return { newLine, moved, score }
        }

        traverse(slideAndMerge)

        if (hasMoved) {
          const t = spawnRandomTile(newTiles)
          if (t) newTiles.push(t)

          // Update Score
          const newScore = prevScore + addedScore
          updateBestScore(newScore)

          // Check Win Condition
          if (!won && newTiles.some((t) => t.value === 2048)) {
            setWon(true)
            recordResult('win') // They reached 2048, mark a win
          }

          // Check Lose Condition (No empty spaces and no adjacent equal values)
          const empty = getEmptyCells(newTiles)
          if (empty.length === 0) {
            let canMove = false
            const checkMap = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))
            newTiles.forEach((nt) => (checkMap[nt.row][nt.col] = nt.value))
            
            for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                const val = checkMap[r][c]
                if (
                  (r < GRID_SIZE - 1 && checkMap[r + 1][c] === val) ||
                  (c < GRID_SIZE - 1 && checkMap[r][c + 1] === val)
                ) {
                  canMove = true
                  break
                }
              }
              if (canMove) break
            }
            if (!canMove) {
              setGameOver(true)
              if (!newTiles.some(t => t.value >= 2048)) {
                recordResult('loss') // They lost before reaching 2048
              }
            }
          }

          return { tiles: newTiles, score: newScore }
        }

        return prevState // No movement
      })
    },
    [gameOver, won, hasContinued, updateBestScore, recordResult]
  )

  const continuePlaying = useCallback(() => {
    setHasContinued(true)
  }, [])

  return {
    tiles,
    score,
    bestScore,
    gameOver,
    won: won && !hasContinued,
    resetGame,
    moveTiles,
    continuePlaying,
  }
}
