export type DotColor = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple'

export interface DotPair {
  color: DotColor
  start: [number, number]
  end: [number, number]
}

export interface DotsLevel {
  gridSize: number
  dots: DotPair[]
}

// Helper to rotate coordinates 90 degrees clockwise
const rotate90 = (r: number, c: number, size: number): [number, number] => [c, size - 1 - r]
// Helper to flip coordinates horizontally
const flipH = (r: number, c: number, size: number): [number, number] => [r, size - 1 - c]

function generateVariations(seed: DotsLevel): DotsLevel[] {
  const variations: DotsLevel[] = []
  const s = seed.gridSize

  // 4 Rotations
  let current = seed
  for (let i = 0; i < 4; i++) {
    variations.push(current)
    const nextDots = current.dots.map(d => ({
      color: d.color,
      start: rotate90(d.start[0], d.start[1], s),
      end: rotate90(d.end[0], d.end[1], s)
    }))
    current = { gridSize: s, dots: nextDots }
  }

  // Flips of those rotations
  const flippedVariations: DotsLevel[] = variations.map(v => ({
    gridSize: s,
    dots: v.dots.map(d => ({
      color: d.color,
      start: flipH(d.start[0], d.start[1], s),
      end: flipH(d.end[0], d.end[1], s)
    }))
  }))

  return [...variations, ...flippedVariations]
}

const seed4x4_1: DotsLevel = {
  gridSize: 4,
  dots: [
    { color: 'red', start: [0, 0], end: [2, 1] },
    { color: 'blue', start: [0, 2], end: [2, 2] },
    { color: 'green', start: [0, 3], end: [3, 3] },
    { color: 'yellow', start: [1, 0], end: [3, 2] }
  ]
}

const seed4x4_2: DotsLevel = {
  gridSize: 4,
  dots: [
    { color: 'red', start: [0, 0], end: [3, 0] },
    { color: 'blue', start: [0, 1], end: [3, 3] },
    { color: 'green', start: [1, 1], end: [3, 2] },
    { color: 'yellow', start: [1, 2], end: [2, 2] }
  ]
}

const seed5x5_1: DotsLevel = {
  gridSize: 5,
  dots: [
    { color: 'red', start: [0, 0], end: [3, 3] },
    { color: 'blue', start: [0, 4], end: [4, 4] },
    { color: 'green', start: [1, 0], end: [4, 0] },
    { color: 'yellow', start: [1, 1], end: [3, 2] },
    { color: 'orange', start: [2, 1], end: [4, 3] }
  ]
}

const seed5x5_2: DotsLevel = {
  gridSize: 5,
  dots: [
    { color: 'red', start: [0, 0], end: [4, 0] },
    { color: 'blue', start: [0, 1], end: [4, 4] },
    { color: 'green', start: [1, 1], end: [3, 3] },
    { color: 'yellow', start: [2, 1], end: [4, 3] },
    { color: 'orange', start: [2, 2], end: [3, 2] }
  ]
}

const seed6x6_1: DotsLevel = {
  gridSize: 6,
  dots: [
    { color: 'red', start: [0, 0], end: [3, 4] },
    { color: 'blue', start: [0, 5], end: [5, 5] },
    { color: 'green', start: [1, 0], end: [5, 0] },
    { color: 'yellow', start: [1, 1], end: [3, 3] },
    { color: 'orange', start: [2, 1], end: [5, 4] },
    { color: 'purple', start: [2, 2], end: [4, 4] }
  ]
}

const seed6x6_2: DotsLevel = {
  gridSize: 6,
  dots: [
    { color: 'red', start: [0, 0], end: [5, 0] },
    { color: 'blue', start: [0, 1], end: [5, 5] },
    { color: 'green', start: [1, 1], end: [5, 4] },
    { color: 'yellow', start: [2, 1], end: [4, 3] },
    { color: 'orange', start: [3, 1], end: [5, 3] },
    { color: 'purple', start: [3, 2], end: [4, 2] }
  ]
}

// Generate pool of variations and slice to exactly 10 per grid size
// We shuffle them to make it random each time it's loaded (or just keep static and shuffle in component)
function shuffle(array: any[]) {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const LEVELS_4X4 = shuffle([...generateVariations(seed4x4_1), ...generateVariations(seed4x4_2)]).slice(0, 10)
export const LEVELS_5X5 = shuffle([...generateVariations(seed5x5_1), ...generateVariations(seed5x5_2)]).slice(0, 10)
export const LEVELS_6X6 = shuffle([...generateVariations(seed6x6_1), ...generateVariations(seed6x6_2)]).slice(0, 10)
