import { useState, useCallback, useEffect } from 'react'

export interface HanoiMove {
  from: number
  to: number
  disk: number
}

export function getMinMoves(disks: number, pegs = 3): number {
  if (pegs === 3) {
    return Math.pow(2, disks) - 1
  }
  // Frame-Stewart algorithm for 4 pegs
  if (disks <= 0) return 0
  if (disks === 1) return 1
  const k = Math.round(disks - Math.sqrt(2 * disks + 1) + 1)
  return 2 * getMinMoves(k, 4) + Math.pow(2, disks - k) - 1
}

export function getMaxMoves(disks: number, pegs = 3): number {
  const min = getMinMoves(disks, pegs)
  // Moderate, engaging challenge: ~1.6x of optimal moves
  return Math.round(min * 1.6) + (disks <= 3 ? 1 : 2)
}

export function useTowerOfHanoi(initialDisks = 4, initialPegs = 3) {
  const [diskCount, setDiskCountState] = useState(initialDisks)
  const [pegCount, setPegCountState] = useState(initialPegs)
  
  // Pegs: each peg is an array of numbers (e.g. [4, 3, 2, 1] with 1 on top)
  const [pegs, setPegs] = useState<number[][]>(() => {
    const p: number[][] = Array.from({ length: initialPegs }, () => [])
    for (let i = initialDisks; i >= 1; i--) {
      p[0].push(i)
    }
    return p
  })

  const [selectedPeg, setSelectedPeg] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [history, setHistory] = useState<HanoiMove[]>([])
  const [isWon, setIsWon] = useState(false)
  const [isLost, setIsLost] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [invalidMovePeg, setInvalidMovePeg] = useState<number | null>(null)

  const maxMoves = getMaxMoves(diskCount, pegCount)

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (timerActive && !isWon && !isLost) {
      interval = setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, isWon, isLost])

  // Reset helper
  const reset = useCallback((disks = diskCount, numPegs = pegCount) => {
    const p: number[][] = Array.from({ length: numPegs }, () => [])
    for (let i = disks; i >= 1; i--) {
      p[0].push(i)
    }
    setPegs(p)
    setSelectedPeg(null)
    setMoves(0)
    setHistory([])
    setIsWon(false)
    setIsLost(false)
    setTimer(0)
    setTimerActive(false)
    setInvalidMovePeg(null)
  }, [diskCount, pegCount])

  // Change disk count
  const setDiskCount = useCallback((n: number) => {
    const clamped = Math.max(3, Math.min(7, n))
    setDiskCountState(clamped)
    reset(clamped, pegCount)
  }, [pegCount, reset])

  // Change peg count (3 or 4)
  const setPegCount = useCallback((n: number) => {
    const clamped = n === 4 ? 4 : 3
    setPegCountState(clamped)
    reset(diskCount, clamped)
  }, [diskCount, reset])

  // Move disk
  const moveDisk = useCallback((from: number, to: number): boolean => {
    if (from === to) return false
    const source = pegs[from]
    const dest = pegs[to]
    if (!source || source.length === 0) return false

    const disk = source[source.length - 1]
    const destTop = dest.length > 0 ? dest[dest.length - 1] : Infinity

    // Check if valid
    if (disk > destTop) {
      // Invalid move
      setInvalidMovePeg(to)
      setTimeout(() => setInvalidMovePeg(null), 600)
      return false
    }

    // Start timer on first move
    if (!timerActive) {
      setTimerActive(true)
    }

    const nextPegs = pegs.map((peg, idx) => {
      if (idx === from) return peg.slice(0, -1)
      if (idx === to) return [...peg, disk]
      return [...peg]
    })

    const nextMoves = moves + 1
    setPegs(nextPegs)
    setMoves(nextMoves)
    setHistory(h => [...h, { from, to, disk }])
    setSelectedPeg(null)

    // Check win condition: all disks transferred to any other peg
    const won = nextPegs.slice(1).some(peg => peg.length === diskCount)
    if (won) {
      setIsWon(true)
      setTimerActive(false)
    } else if (nextMoves >= maxMoves) {
      setIsLost(true)
      setTimerActive(false)
    }

    return true
  }, [pegs, diskCount, timerActive, moves, maxMoves])

  // Peg click interaction
  const handlePegClick = useCallback((index: number) => {
    if (isWon || isLost) return

    if (selectedPeg === null) {
      // Trying to select source peg
      if (pegs[index] && pegs[index].length > 0) {
        setSelectedPeg(index)
      }
    } else if (selectedPeg === index) {
      // Deselect
      setSelectedPeg(null)
    } else {
      // Trying to move to target peg
      const success = moveDisk(selectedPeg, index)
      if (!success) {
        setSelectedPeg(null)
      }
    }
  }, [isWon, isLost, selectedPeg, pegs, moveDisk])

  // Undo move
  const undo = useCallback(() => {
    if (history.length === 0 || isWon) return
    const lastMove = history[history.length - 1]
    
    setPegs(prev => {
      const from = lastMove.to
      const to = lastMove.from
      const disk = lastMove.disk
      return prev.map((peg, idx) => {
        if (idx === from) return peg.slice(0, -1)
        if (idx === to) return [...peg, disk]
        return [...peg]
      })
    })

    setHistory(h => h.slice(0, -1))
    setMoves(m => Math.max(0, m - 1))
    setSelectedPeg(null)
    setIsLost(false)
  }, [history, isWon])

  // Solve next move hint for 3-peg Hanoi
  const getHint = useCallback((): { from: number; to: number } | null => {
    if (isWon || pegCount !== 3) return null

    // Helper: find shortest move sequence using BFS for current state
    const encode = (state: number[][]) => state.map(p => p.join(',')).join('|')
    const targetEncoded = [
      '',
      '',
      Array.from({ length: diskCount }, (_, i) => diskCount - i).join(',')
    ].join('|')

    const queue: { state: number[][]; firstMove: { from: number; to: number } | null }[] = [
      { state: pegs, firstMove: null }
    ]
    const visited = new Set<string>([encode(pegs)])

    let iterations = 0
    while (queue.length > 0 && iterations < 3000) {
      iterations++
      const current = queue.shift()!
      if (encode(current.state) === targetEncoded) {
        return current.firstMove
      }

      for (let from = 0; from < 3; from++) {
        const src = current.state[from]
        if (src.length === 0) continue
        const disk = src[src.length - 1]

        for (let to = 0; to < 3; to++) {
          if (from === to) continue
          const dst = current.state[to]
          const destTop = dst.length > 0 ? dst[dst.length - 1] : Infinity
          if (disk < destTop) {
            const nextState = current.state.map((peg, idx) => {
              if (idx === from) return peg.slice(0, -1)
              if (idx === to) return [...peg, disk]
              return [...peg]
            })
            const enc = encode(nextState)
            if (!visited.has(enc)) {
              visited.add(enc)
              queue.push({
                state: nextState,
                firstMove: current.firstMove || { from, to }
              })
            }
          }
        }
      }
    }
    return null
  }, [isWon, pegCount, diskCount, pegs])

  return {
    pegs,
    selectedPeg,
    moves,
    minMoves: getMinMoves(diskCount, pegCount),
    diskCount,
    pegCount,
    isWon,
    isLost,
    maxMoves,
    timer,
    invalidMovePeg,
    handlePegClick,
    moveDisk,
    undo,
    reset,
    setDiskCount,
    setPegCount,
    getHint,
    canUndo: history.length > 0 && !isWon,
  }
}
