// Connect Four game logic: board operations, win detection, AI

export const ROWS = 6
export const COLS = 7

export type C4Cell = 'R' | 'Y' | null
export type C4Board = C4Cell[][]

export function createEmptyBoard(): C4Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

export function dropPiece(board: C4Board, col: number, player: C4Cell): { newBoard: C4Board; row: number } | null {
  if (col < 0 || col >= COLS || board[0][col] !== null) return null

  const newBoard = board.map((r) => [...r])
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r][col] === null) {
      newBoard[r][col] = player
      return { newBoard, row: r }
    }
  }
  return null
}

export function getValidColumns(board: C4Board): number[] {
  const valid: number[] = []
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) valid.push(c)
  }
  return valid
}

export function isBoardFull(board: C4Board): boolean {
  return getValidColumns(board).length === 0
}

interface WinResult {
  winner: C4Cell
  cells: [number, number][] | null
}

export function checkC4Winner(board: C4Board): WinResult {
  // Check all 4-in-a-row directions
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal down-right
    [1, -1], // diagonal down-left
  ]

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c]) continue
      const player = board[r][c]

      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [[r, c]]
        let valid = true
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i
          const nc = c + dc * i
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) {
            valid = false
            break
          }
          cells.push([nr, nc])
        }
        if (valid) {
          return { winner: player, cells }
        }
      }
    }
  }

  return { winner: null, cells: null }
}

// --- AI with Minimax + Alpha-Beta ---

function evaluateWindow(window: (C4Cell)[], player: C4Cell, opponent: C4Cell): number {
  const playerCount = window.filter((c) => c === player).length
  const opponentCount = window.filter((c) => c === opponent).length
  const emptyCount = window.filter((c) => c === null).length

  if (playerCount === 4) return 100
  if (playerCount === 3 && emptyCount === 1) return 5
  if (playerCount === 2 && emptyCount === 2) return 2
  if (opponentCount === 3 && emptyCount === 1) return -4
  return 0
}

function scorePosition(board: C4Board, player: C4Cell): number {
  const opponent = player === 'R' ? 'Y' : 'R'
  let score = 0

  // Center column preference
  const centerCol = Math.floor(COLS / 2)
  const centerCount = board.filter((row) => row[centerCol] === player).length
  score += centerCount * 3

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]]
      score += evaluateWindow(window, player, opponent)
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]]
      score += evaluateWindow(window, player, opponent)
    }
  }

  // Diagonal (positive slope)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]]
      score += evaluateWindow(window, player, opponent)
    }
  }

  // Diagonal (negative slope)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]]
      score += evaluateWindow(window, player, opponent)
    }
  }

  return score
}

function c4Minimax(
  board: C4Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: C4Cell,
  humanPlayer: C4Cell
): [number | null, number] {
  const validCols = getValidColumns(board)
  const { winner } = checkC4Winner(board)

  if (winner === aiPlayer) return [null, 100000 + depth]
  if (winner === humanPlayer) return [null, -100000 - depth]
  if (validCols.length === 0) return [null, 0]
  if (depth === 0) return [null, scorePosition(board, aiPlayer)]

  if (isMaximizing) {
    let bestScore = -Infinity
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)]
    for (const col of validCols) {
      const result = dropPiece(board, col, aiPlayer)
      if (!result) continue
      const [, score] = c4Minimax(result.newBoard, depth - 1, alpha, beta, false, aiPlayer, humanPlayer)
      if (score > bestScore) {
        bestScore = score
        bestCol = col
      }
      alpha = Math.max(alpha, score)
      if (alpha >= beta) break
    }
    return [bestCol, bestScore]
  } else {
    let bestScore = Infinity
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)]
    for (const col of validCols) {
      const result = dropPiece(board, col, humanPlayer)
      if (!result) continue
      const [, score] = c4Minimax(result.newBoard, depth - 1, alpha, beta, true, aiPlayer, humanPlayer)
      if (score < bestScore) {
        bestScore = score
        bestCol = col
      }
      beta = Math.min(beta, score)
      if (alpha >= beta) break
    }
    return [bestCol, bestScore]
  }
}

export type C4Difficulty = 'easy' | 'medium' | 'hard'

export function getC4AIMove(board: C4Board, difficulty: C4Difficulty, aiPlayer: C4Cell): number {
  const validCols = getValidColumns(board)
  if (validCols.length === 0) return -1

  const humanPlayer = aiPlayer === 'R' ? 'Y' : 'R'

  switch (difficulty) {
    case 'easy': {
      // Random move with slight preference against immediate opponent wins
      const opponent = aiPlayer === 'R' ? 'Y' : 'R'
      // Block immediate wins
      for (const col of validCols) {
        const result = dropPiece(board, col, opponent)
        if (result && checkC4Winner(result.newBoard).winner === opponent) {
          return col // Block!
        }
      }
      return validCols[Math.floor(Math.random() * validCols.length)]
    }
    case 'medium': {
      const [col] = c4Minimax(board, 3, -Infinity, Infinity, true, aiPlayer, humanPlayer)
      return col ?? validCols[0]
    }
    case 'hard': {
      const [col] = c4Minimax(board, 6, -Infinity, Infinity, true, aiPlayer, humanPlayer)
      return col ?? validCols[0]
    }
  }
}
