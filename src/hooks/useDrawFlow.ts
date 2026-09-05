import { useState, useCallback, useRef } from 'react'

export interface DrawFlowNode {
  id: number
  x: number // percentage 0-100
  y: number // percentage 0-100
}

export interface DrawFlowEdge {
  from: number
  to: number
}

export interface DrawFlowLevel {
  id: number
  name: string
  nodes: DrawFlowNode[]
  edges: DrawFlowEdge[]
}

export function getEdgeKey(u: number, v: number): string {
  return u < v ? `${u}-${v}` : `${v}-${u}`
}

// 10 Eulerian graphs (solvable in 1 continuous stroke without lifting pen)
export const DRAW_FLOW_LEVELS: DrawFlowLevel[] = [
  // Round 1: Bowtie / Hourglass (5 nodes, 6 edges)
  {
    id: 1,
    name: 'Hourglass',
    nodes: [
      { id: 0, x: 20, y: 20 },
      { id: 1, x: 80, y: 20 },
      { id: 2, x: 50, y: 50 },
      { id: 3, x: 20, y: 80 },
      { id: 4, x: 80, y: 80 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 2 },
    ],
  },
  // Round 2: Classic House / Envelope (5 nodes, 8 edges - 2 odd degree nodes at bottom)
  {
    id: 2,
    name: 'House',
    nodes: [
      { id: 0, x: 50, y: 15 }, // Roof peak
      { id: 1, x: 20, y: 45 }, // Top-left
      { id: 2, x: 80, y: 45 }, // Top-right
      { id: 3, x: 20, y: 85 }, // Bottom-left (deg 3)
      { id: 4, x: 80, y: 85 }, // Bottom-right (deg 3)
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 1, to: 4 },
      { from: 2, to: 3 },
    ],
  },
  // Round 3: Diamond with Cross (5 nodes, 8 edges)
  {
    id: 3,
    name: 'Diamond Star',
    nodes: [
      { id: 0, x: 50, y: 15 }, // Top
      { id: 1, x: 15, y: 50 }, // Left
      { id: 2, x: 50, y: 50 }, // Center
      { id: 3, x: 85, y: 50 }, // Right
      { id: 4, x: 50, y: 85 }, // Bottom
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 4, to: 1 },
      { from: 4, to: 3 },
      { from: 0, to: 2 },
      { from: 4, to: 2 },
      { from: 1, to: 2 },
      { from: 3, to: 2 },
    ],
  },
  // Round 4: 5-Pointed Pentagram (5 nodes, 5 diagonal edges)
  {
    id: 4,
    name: 'Pentagram',
    nodes: [
      { id: 0, x: 50, y: 15 },
      { id: 1, x: 85, y: 42 },
      { id: 2, x: 72, y: 85 },
      { id: 3, x: 28, y: 85 },
      { id: 4, x: 15, y: 42 },
    ],
    edges: [
      { from: 0, to: 2 },
      { from: 2, to: 4 },
      { from: 4, to: 1 },
      { from: 1, to: 3 },
      { from: 3, to: 0 },
    ],
  },
  // Round 5: Double Diamond / Hex Cross (6 nodes, 9 edges)
  {
    id: 5,
    name: 'Prism',
    nodes: [
      { id: 0, x: 30, y: 15 },
      { id: 1, x: 70, y: 15 },
      { id: 2, x: 20, y: 50 },
      { id: 3, x: 80, y: 50 },
      { id: 4, x: 30, y: 85 },
      { id: 5, x: 70, y: 85 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
      { from: 0, to: 3 },
      { from: 1, to: 2 },
    ],
  },
  // Round 6: Winged Kite (6 nodes, 10 edges)
  {
    id: 6,
    name: 'Wind Kite',
    nodes: [
      { id: 0, x: 50, y: 12 },
      { id: 1, x: 20, y: 45 },
      { id: 2, x: 50, y: 45 },
      { id: 3, x: 80, y: 45 },
      { id: 4, x: 35, y: 85 },
      { id: 5, x: 65, y: 85 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 1, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
    ],
  },
  // Round 7: Crown (6 nodes, 9 edges)
  {
    id: 7,
    name: 'Crown',
    nodes: [
      { id: 0, x: 15, y: 25 },
      { id: 1, x: 50, y: 15 },
      { id: 2, x: 85, y: 25 },
      { id: 3, x: 25, y: 55 },
      { id: 4, x: 75, y: 55 },
      { id: 5, x: 50, y: 85 },
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
    ],
  },
  // Round 8: Hexagram Star with Center (7 nodes, 12 edges)
  {
    id: 8,
    name: 'Hex Star',
    nodes: [
      { id: 0, x: 50, y: 15 },
      { id: 1, x: 80, y: 32 },
      { id: 2, x: 80, y: 68 },
      { id: 3, x: 50, y: 85 },
      { id: 4, x: 20, y: 68 },
      { id: 5, x: 20, y: 32 },
      { id: 6, x: 50, y: 50 }, // Center
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 0 },
      { from: 0, to: 6 },
      { from: 1, to: 6 },
      { from: 2, to: 6 },
      { from: 3, to: 6 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
    ],
  },
  // Round 9: Pyramid Citadel (7 nodes, 11 edges)
  {
    id: 9,
    name: 'Citadel',
    nodes: [
      { id: 0, x: 50, y: 15 },
      { id: 1, x: 25, y: 45 },
      { id: 2, x: 50, y: 45 },
      { id: 3, x: 75, y: 45 },
      { id: 4, x: 15, y: 85 },
      { id: 5, x: 50, y: 85 },
      { id: 6, x: 85, y: 85 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 1, to: 5 },
      { from: 3, to: 5 },
    ],
  },
  // Round 10: The Sacred Mandala / Mystic Cube (8 nodes, 14 edges)
  {
    id: 10,
    name: 'Mystic Polygram',
    nodes: [
      { id: 0, x: 35, y: 15 },
      { id: 1, x: 65, y: 15 },
      { id: 2, x: 15, y: 50 },
      { id: 3, x: 40, y: 45 },
      { id: 4, x: 60, y: 45 },
      { id: 5, x: 85, y: 50 },
      { id: 6, x: 35, y: 85 },
      { id: 7, x: 65, y: 85 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 5 },
      { from: 2, to: 6 },
      { from: 5, to: 7 },
      { from: 6, to: 7 },
      { from: 0, to: 3 },
      { from: 1, to: 4 },
      { from: 3, to: 4 },
      { from: 2, to: 3 },
      { from: 4, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 7 },
      { from: 3, to: 7 },
    ],
  },
]

export function useDrawFlow() {
  const [roundIndex, setRoundIndex] = useState(0) // 0 to 9 (10 rounds)
  const [visitedEdges, setVisitedEdges] = useState<Set<string>>(new Set())
  const [activePath, setActivePath] = useState<number[]>([])
  const [currentCoord, setCurrentCoord] = useState<{ x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [isWon, setIsWon] = useState(false)
  const [errorShake, setErrorShake] = useState(false)

  const currentLevel = DRAW_FLOW_LEVELS[roundIndex]
  const totalEdges = currentLevel.edges.length

  // Build edge adjacency lookup
  const edgeMap = useRef<Map<string, boolean>>(new Map())
  edgeMap.current.clear()
  currentLevel.edges.forEach(e => {
    edgeMap.current.set(getEdgeKey(e.from, e.to), true)
  })

  // Start stroke from a node
  const startStroke = useCallback((nodeId: number, point: { x: number; y: number }) => {
    if (roundComplete || isWon) return
    setIsDrawing(true)
    setActivePath([nodeId])
    setVisitedEdges(new Set())
    setCurrentCoord(point)
    setErrorShake(false)
  }, [roundComplete, isWon])

  // Move pointer over a target node
  const visitNode = useCallback((nodeId: number) => {
    if (!isDrawing || activePath.length === 0 || roundComplete || isWon) return
    const lastNode = activePath[activePath.length - 1]
    if (lastNode === nodeId) return // same node

    const key = getEdgeKey(lastNode, nodeId)
    // Check if edge exists in graph and has NOT been traversed yet in this stroke
    if (edgeMap.current.has(key) && !visitedEdges.has(key)) {
      const nextVisited = new Set(visitedEdges)
      nextVisited.add(key)
      setVisitedEdges(nextVisited)
      setActivePath(prev => [...prev, nodeId])

      // Check if all edges are traversed!
      if (nextVisited.size === totalEdges) {
        setRoundComplete(true)
        setIsDrawing(false)
        setCurrentCoord(null)

        if (roundIndex >= DRAW_FLOW_LEVELS.length - 1) {
          setIsWon(true)
        } else {
          // Advance to next round after brief celebration
          setTimeout(() => {
            setRoundIndex(r => r + 1)
            setVisitedEdges(new Set())
            setActivePath([])
            setRoundComplete(false)
          }, 1200)
        }
      }
    }
  }, [isDrawing, activePath, roundComplete, isWon, visitedEdges, totalEdges, roundIndex])

  // Update drag point
  const updatePointer = useCallback((point: { x: number; y: number }) => {
    if (!isDrawing) return
    setCurrentCoord(point)
  }, [isDrawing])

  // End stroke (lifting pen)
  const endStroke = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    setCurrentCoord(null)

    // If stroke finished without completing all edges, reset stroke
    if (visitedEdges.size < totalEdges && !roundComplete) {
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 500)
      setActivePath([])
      setVisitedEdges(new Set())
    }
  }, [isDrawing, visitedEdges.size, totalEdges, roundComplete])

  // Clear current round drawing
  const restartCurrentRound = useCallback(() => {
    setIsDrawing(false)
    setCurrentCoord(null)
    setActivePath([])
    setVisitedEdges(new Set())
    setRoundComplete(false)
    setErrorShake(false)
  }, [])

  // Reset entire sequence to Round 1
  const resetSequence = useCallback(() => {
    setRoundIndex(0)
    setIsDrawing(false)
    setCurrentCoord(null)
    setActivePath([])
    setVisitedEdges(new Set())
    setRoundComplete(false)
    setIsWon(false)
    setErrorShake(false)
  }, [])

  return {
    currentLevel,
    roundNumber: roundIndex + 1,
    totalRounds: DRAW_FLOW_LEVELS.length,
    visitedEdges,
    activePath,
    currentCoord,
    isDrawing,
    roundComplete,
    isWon,
    errorShake,
    totalEdges,
    edgesCovered: visitedEdges.size,
    startStroke,
    visitNode,
    updatePointer,
    endStroke,
    restartCurrentRound,
    resetSequence,
  }
}
