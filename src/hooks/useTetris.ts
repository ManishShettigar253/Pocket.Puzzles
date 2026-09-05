import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Constants ───────────────────────────────────────────────
export const COLS = 10
export const ROWS = 20

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type Cell = PieceType | null
export type Board = Cell[][]

export interface ActivePiece {
  type: PieceType
  matrix: number[][]
  x: number
  y: number
}

// ─── Tetromino shapes ────────────────────────────────────────
const TETROMINOES: Record<PieceType, number[][]> = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
}

const PIECE_TYPES: PieceType[] = ['I','O','T','S','Z','J','L']
const SCORES = [0, 100, 300, 500, 800]

function dropInterval(level: number) {
  return Math.max(80, 800 - (level - 1) * 75)
}

// ─── Bag randomizer ──────────────────────────────────────────
function makeBag(): PieceType[] {
  return [...PIECE_TYPES].sort(() => Math.random() - 0.5)
}

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}

function createPiece(type: PieceType): ActivePiece {
  return {
    type,
    matrix: TETROMINOES[type].map(r => [...r]),
    x: type === 'O' ? 4 : 3,
    y: 0,
  }
}

function collides(board: Board, piece: ActivePiece, ox = 0, oy = 0): boolean {
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue
      const nx = piece.x + c + ox
      const ny = piece.y + r + oy
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && board[ny][nx]) return true
    }
  }
  return false
}

function rotateMatrix(matrix: number[][], dir: 1 | -1): number[][] {
  const n = matrix.length
  const m = matrix[0].length
  const result: number[][] = Array.from({ length: m }, () => Array(n).fill(0))
  for (let r = 0; r < n; r++)
    for (let c = 0; c < m; c++)
      result[dir === 1 ? c : m - 1 - c][dir === 1 ? n - 1 - r : r] = matrix[r][c]
  return result
}

const KICKS = [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]]

function calcGhost(board: Board, piece: ActivePiece): ActivePiece {
  let ghost = { ...piece }
  while (!collides(board, ghost, 0, 1)) ghost = { ...ghost, y: ghost.y + 1 }
  return ghost
}

// ─── Hook ────────────────────────────────────────────────────
export interface TetrisState {
  board: Board
  current: ActivePiece | null
  ghost: ActivePiece | null
  held: ActivePiece | null
  nextQueue: ActivePiece[]
  score: number
  lines: number
  level: number
  bestScore: number
  gameOver: boolean
  paused: boolean
  // actions
  moveLeft: () => void
  moveRight: () => void
  softDrop: () => void
  hardDrop: () => void
  rotateLeft: () => void
  rotateRight: () => void
  holdPiece: () => void
  togglePause: () => void
  restart: () => void
}

export function useTetris(): TetrisState {
  // ─── mutable refs (not reactive) ─────────────────────────
  const boardRef      = useRef<Board>(createBoard())
  const currentRef    = useRef<ActivePiece | null>(null)
  const ghostRef      = useRef<ActivePiece | null>(null)
  const heldRef       = useRef<ActivePiece | null>(null)
  const nextQueueRef  = useRef<ActivePiece[]>([])
  const bagRef        = useRef<PieceType[]>([])
  const holdUsedRef   = useRef(false)
  const scoreRef      = useRef(0)
  const linesRef      = useRef(0)
  const levelRef      = useRef(1)
  const bestScoreRef  = useRef(parseInt(localStorage.getItem('pp-tetris-best') || '0'))
  const gameOverRef   = useRef(false)
  const pausedRef     = useRef(false)
  const dropTimerRef  = useRef(0)
  const lastTimeRef   = useRef(0)
  const animIdRef     = useRef(0)

  // ─── reactive snapshot (for rendering) ──────────────────
  const [tick, setTick] = useState(0)
  const forceRender = useCallback(() => setTick(t => t + 1), [])

  // Snapshot that components read
  const snapshot = {
    board:     boardRef.current,
    current:   currentRef.current,
    ghost:     ghostRef.current,
    held:      heldRef.current,
    nextQueue: nextQueueRef.current,
    score:     scoreRef.current,
    lines:     linesRef.current,
    level:     levelRef.current,
    bestScore: bestScoreRef.current,
    gameOver:  gameOverRef.current,
    paused:    pausedRef.current,
  }
  void tick // suppress unused

  // ─── helpers ─────────────────────────────────────────────
  function drawFromBag(): PieceType {
    if (!bagRef.current.length) bagRef.current = makeBag()
    return bagRef.current.pop()!
  }

  function updateGhost() {
    if (currentRef.current)
      ghostRef.current = calcGhost(boardRef.current, currentRef.current)
  }

  function updateBest() {
    if (scoreRef.current > bestScoreRef.current) {
      bestScoreRef.current = scoreRef.current
      localStorage.setItem('pp-tetris-best', String(bestScoreRef.current))
    }
  }

  function spawnPiece() {
    while (nextQueueRef.current.length < 3)
      nextQueueRef.current.push(createPiece(drawFromBag()))
    const next = nextQueueRef.current.shift()!
    nextQueueRef.current.push(createPiece(drawFromBag()))
    currentRef.current = next
    if (collides(boardRef.current, next)) {
      gameOverRef.current = true
      cancelAnimationFrame(animIdRef.current)
      forceRender()
    }
    updateGhost()
  }

  function lockPiece() {
    const p = currentRef.current!
    for (let r = 0; r < p.matrix.length; r++)
      for (let c = 0; c < p.matrix[r].length; c++)
        if (p.matrix[r][c]) {
          const ny = p.y + r
          if (ny < 0) {
            gameOverRef.current = true
            cancelAnimationFrame(animIdRef.current)
            forceRender()
            return
          }
          boardRef.current[ny][p.x + c] = p.type
        }
    // clear lines
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (boardRef.current[r].every(c => c)) {
        boardRef.current.splice(r, 1)
        boardRef.current.unshift(Array<Cell>(COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared) {
      linesRef.current += cleared
      scoreRef.current += SCORES[cleared] * levelRef.current
      levelRef.current = Math.floor(linesRef.current / 10) + 1
      updateBest()
    }
    holdUsedRef.current = false
    spawnPiece()
  }

  // ─── game actions ─────────────────────────────────────────
  const moveLeft = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !currentRef.current) return
    if (!collides(boardRef.current, currentRef.current, -1)) {
      currentRef.current = { ...currentRef.current, x: currentRef.current.x - 1 }
      updateGhost()
      forceRender()
    }
  }, [forceRender])

  const moveRight = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !currentRef.current) return
    if (!collides(boardRef.current, currentRef.current, 1)) {
      currentRef.current = { ...currentRef.current, x: currentRef.current.x + 1 }
      updateGhost()
      forceRender()
    }
  }, [forceRender])

  const softDrop = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !currentRef.current) return
    if (!collides(boardRef.current, currentRef.current, 0, 1)) {
      currentRef.current = { ...currentRef.current, y: currentRef.current.y + 1 }
      scoreRef.current += 1
      updateBest()
    } else {
      lockPiece()
    }
    forceRender()
  }, [forceRender])

  const hardDrop = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !currentRef.current) return
    let moved = 0
    while (!collides(boardRef.current, currentRef.current!, 0, 1)) {
      currentRef.current = { ...currentRef.current!, y: currentRef.current!.y + 1 }
      moved++
    }
    scoreRef.current += moved * 2
    updateBest()
    lockPiece()
    forceRender()
  }, [forceRender])

  const rotateLeft = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !currentRef.current) return
    const mat = rotateMatrix(currentRef.current.matrix, -1)
    for (const [kx, ky] of KICKS) {
      const test = { ...currentRef.current!, matrix: mat, x: currentRef.current!.x + kx, y: currentRef.current!.y + ky }
      if (!collides(boardRef.current, test)) {
        currentRef.current = test
        updateGhost()
        forceRender()
        return
      }
    }
  }, [forceRender])

  const rotateRight = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || !currentRef.current) return
    const mat = rotateMatrix(currentRef.current.matrix, 1)
    for (const [kx, ky] of KICKS) {
      const test = { ...currentRef.current!, matrix: mat, x: currentRef.current!.x + kx, y: currentRef.current!.y + ky }
      if (!collides(boardRef.current, test)) {
        currentRef.current = test
        updateGhost()
        forceRender()
        return
      }
    }
  }, [forceRender])

  const holdPiece = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || holdUsedRef.current || !currentRef.current) return
    holdUsedRef.current = true
    const t = currentRef.current.type
    if (heldRef.current) {
      currentRef.current = createPiece(heldRef.current.type)
    } else {
      spawnPiece()
    }
    heldRef.current = createPiece(t)
    updateGhost()
    forceRender()
  }, [forceRender])

  const togglePause = useCallback(() => {
    if (gameOverRef.current) return
    pausedRef.current = !pausedRef.current
    if (!pausedRef.current) {
      lastTimeRef.current = performance.now()
      dropTimerRef.current = 0
      animIdRef.current = requestAnimationFrame(loop)
    } else {
      cancelAnimationFrame(animIdRef.current)
    }
    forceRender()
  }, [forceRender])

  // ─── game loop ───────────────────────────────────────────
  function loop(timestamp: number) {
    if (pausedRef.current || gameOverRef.current) return
    const dt = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp
    dropTimerRef.current += dt
    if (dropTimerRef.current >= dropInterval(levelRef.current)) {
      dropTimerRef.current = 0
      if (currentRef.current) {
        if (!collides(boardRef.current, currentRef.current, 0, 1)) {
          currentRef.current = { ...currentRef.current, y: currentRef.current.y + 1 }
        } else {
          lockPiece()
        }
        forceRender()
      }
    }
    if (!gameOverRef.current) animIdRef.current = requestAnimationFrame(loop)
    else forceRender()
  }

  // ─── restart ─────────────────────────────────────────────
  const restart = useCallback(() => {
    cancelAnimationFrame(animIdRef.current)
    boardRef.current     = createBoard()
    bagRef.current       = []
    nextQueueRef.current = []
    heldRef.current      = null
    holdUsedRef.current  = false
    scoreRef.current     = 0
    linesRef.current     = 0
    levelRef.current     = 1
    pausedRef.current    = false
    gameOverRef.current  = false
    dropTimerRef.current = 0
    bestScoreRef.current = parseInt(localStorage.getItem('pp-tetris-best') || '0')

    nextQueueRef.current.push(createPiece(drawFromBag()))
    nextQueueRef.current.push(createPiece(drawFromBag()))
    nextQueueRef.current.push(createPiece(drawFromBag()))
    spawnPiece()

    lastTimeRef.current = performance.now()
    animIdRef.current   = requestAnimationFrame(loop)
    forceRender()
  }, [forceRender])

  // ─── init on mount ───────────────────────────────────────
  useEffect(() => {
    restart()
    return () => cancelAnimationFrame(animIdRef.current)
  }, [])

  return {
    ...snapshot,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    rotateLeft,
    rotateRight,
    holdPiece,
    togglePause,
    restart,
  }
}
