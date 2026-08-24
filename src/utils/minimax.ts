// Tic-Tac-Toe Minimax and AI utilities
// Also used by Connect Four with board abstraction

export type TTTBoard = (string | null)[]

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
]

export function checkTTTWinner(board: TTTBoard): { winner: string | null; line: number[] | null } {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return { winner: null, line: null }
}

export function isBoardFull(board: TTTBoard): boolean {
  return board.every((cell) => cell !== null)
}

export function getAvailableMoves(board: TTTBoard): number[] {
  return board.reduce<number[]>((moves, cell, i) => {
    if (cell === null) moves.push(i)
    return moves
  }, [])
}

// Minimax with alpha-beta pruning
function minimax(
  board: TTTBoard,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: string,
  humanPlayer: string
): number {
  const { winner } = checkTTTWinner(board)
  if (winner === aiPlayer) return 10 - depth
  if (winner === humanPlayer) return depth - 10
  if (isBoardFull(board)) return 0

  const moves = getAvailableMoves(board)

  if (isMaximizing) {
    let best = -Infinity
    for (const move of moves) {
      board[move] = aiPlayer
      const score = minimax(board, depth + 1, false, alpha, beta, aiPlayer, humanPlayer)
      board[move] = null
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      board[move] = humanPlayer
      const score = minimax(board, depth + 1, true, alpha, beta, aiPlayer, humanPlayer)
      board[move] = null
      best = Math.min(best, score)
      beta = Math.min(beta, score)
      if (beta <= alpha) break
    }
    return best
  }
}

export function getBestMove(board: TTTBoard, aiPlayer: string, humanPlayer: string): number {
  let bestScore = -Infinity
  let bestMove = -1
  const moves = getAvailableMoves(board)

  for (const move of moves) {
    board[move] = aiPlayer
    const score = minimax(board, 0, false, -Infinity, Infinity, aiPlayer, humanPlayer)
    board[move] = null
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }
  return bestMove
}

export function getRandomMove(board: TTTBoard): number {
  const moves = getAvailableMoves(board)
  return moves[Math.floor(Math.random() * moves.length)]
}

export function getMediumMove(board: TTTBoard, aiPlayer: string, humanPlayer: string): number {
  // 60% chance of optimal, 40% random
  if (Math.random() < 0.6) {
    return getBestMove(board, aiPlayer, humanPlayer)
  }
  return getRandomMove(board)
}

export type TTTDifficulty = 'easy' | 'medium' | 'hard'

export function getAIMove(board: TTTBoard, difficulty: TTTDifficulty, aiPlayer: string, humanPlayer: string): number {
  switch (difficulty) {
    case 'easy':
      return getRandomMove(board)
    case 'medium':
      return getMediumMove(board, aiPlayer, humanPlayer)
    case 'hard':
      return getBestMove(board, aiPlayer, humanPlayer)
  }
}
