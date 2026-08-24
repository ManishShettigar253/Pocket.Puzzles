// Bingo board generation and line detection utilities

export type BingoBoard = number[][]
export type BingoMarked = boolean[][]

export function generateBingoBoard(): BingoBoard {
  // Create numbers 1-25 and shuffle them into a 5x5 grid
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
  shuffleArray(numbers)
  const board: BingoBoard = []
  for (let r = 0; r < 5; r++) {
    board.push(numbers.slice(r * 5, r * 5 + 5))
  }
  return board
}

export function createEmptyMarked(): BingoMarked {
  return Array.from({ length: 5 }, () => Array(5).fill(false))
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

export interface LineResult {
  type: 'row' | 'col' | 'diag'
  index: number // row/col number or 0/1 for diagonals
  cells: [number, number][] // [row, col] pairs
}

export function getCompletedLines(marked: BingoMarked): LineResult[] {
  const lines: LineResult[] = []

  // Check rows
  for (let r = 0; r < 5; r++) {
    if (marked[r].every(Boolean)) {
      lines.push({
        type: 'row',
        index: r,
        cells: Array.from({ length: 5 }, (_, c) => [r, c] as [number, number]),
      })
    }
  }

  // Check columns
  for (let c = 0; c < 5; c++) {
    if (marked.every((row) => row[c])) {
      lines.push({
        type: 'col',
        index: c,
        cells: Array.from({ length: 5 }, (_, r) => [r, c] as [number, number]),
      })
    }
  }

  // Check main diagonal (top-left to bottom-right)
  if (Array.from({ length: 5 }, (_, i) => marked[i][i]).every(Boolean)) {
    lines.push({
      type: 'diag',
      index: 0,
      cells: Array.from({ length: 5 }, (_, i) => [i, i] as [number, number]),
    })
  }

  // Check anti-diagonal (top-right to bottom-left)
  if (Array.from({ length: 5 }, (_, i) => marked[i][4 - i]).every(Boolean)) {
    lines.push({
      type: 'diag',
      index: 1,
      cells: Array.from({ length: 5 }, (_, i) => [i, 4 - i] as [number, number]),
    })
  }

  return lines
}

export function markNumberOnBoard(
  board: BingoBoard,
  marked: BingoMarked,
  number: number
): BingoMarked {
  const newMarked = marked.map((row) => [...row])
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === number) {
        newMarked[r][c] = true
      }
    }
  }
  return newMarked
}

export function findNumberPosition(board: BingoBoard, num: number): [number, number] | null {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === num) return [r, c]
    }
  }
  return null
}

// AI strategy: pick numbers that maximize own completed lines
export function getAIBingoMove(
  aiBoard: BingoBoard,
  aiMarked: BingoMarked,
  calledNumbers: Set<number>
): number {
  const available = Array.from({ length: 25 }, (_, i) => i + 1).filter(
    (n) => !calledNumbers.has(n)
  )

  if (available.length === 0) return -1

  // Score each number by how many near-complete lines it helps
  let bestScore = -1
  let bestNum = available[0]

  for (const num of available) {
    const testMarked = markNumberOnBoard(aiBoard, aiMarked, num)
    const newLines = getCompletedLines(testMarked).length
    const currentLines = getCompletedLines(aiMarked).length
    let score = (newLines - currentLines) * 10

    // Also score partial line progress
    const pos = findNumberPosition(aiBoard, num)
    if (pos) {
      const [r, c] = pos
      // Count how many in same row are marked
      score += testMarked[r].filter(Boolean).length
      // Count column
      score += testMarked.filter((row) => row[c]).length
      // Diagonal bonus
      if (r === c) score += Array.from({ length: 5 }, (_, i) => testMarked[i][i]).filter(Boolean).length
      if (r + c === 4) score += Array.from({ length: 5 }, (_, i) => testMarked[i][4 - i]).filter(Boolean).length
    }

    // Random tiebreaker
    score += Math.random() * 0.5

    if (score > bestScore) {
      bestScore = score
      bestNum = num
    }
  }

  return bestNum
}
