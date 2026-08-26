type Tile = { id: string; value: number; row: number; col: number; isDead?: boolean }
const GRID_SIZE = 4

function testMove(direction: string, prevTiles: Tile[]) {
  const currentTiles = prevTiles.filter(t => !t.isDead).map(t => ({...t}))
  const map = Array(4).fill(null).map(() => Array(4).fill(null))
  currentTiles.forEach(t => map[t.row][t.col] = t)
  const newTiles: Tile[] = []
  
  const traverse = (processLine: any) => {
    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        let line = map[r]
        if (direction === 'RIGHT') line = [...line].reverse()
        const { newLine } = processLine(line)
        let finalLine = direction === 'RIGHT' ? [...newLine].reverse() : newLine
        finalLine.forEach((item: any, c: number) => {
          if (item.tile) { item.tile.row = r; item.tile.col = c; newTiles.push(item.tile) }
          item.deadTiles.forEach((dt: any) => { dt.row = r; dt.col = c; newTiles.push(dt) })
        })
      }
    }
  }

  const slideAndMerge = (line: any[]) => {
    let compact = line.filter(t => t !== null)
    let newLine: any[] = []
    let i = 0
    while (i < compact.length) {
      if (i < compact.length - 1 && compact[i].value === compact[i+1].value) {
        newLine.push({
          tile: { id: compact[i].id, value: compact[i].value * 2, row:0, col:0 },
          deadTiles: [{ ...compact[i+1], isDead: true }]
        })
        i += 2
      } else {
        newLine.push({ tile: { ...compact[i] }, deadTiles: [] })
        i++
      }
    }
    while(newLine.length < 4) newLine.push({ tile: null, deadTiles: [] })
    return { newLine }
  }
  
  traverse(slideAndMerge)
  return newTiles
}

let tiles = [
  { id: '1', value: 16, row: 0, col: 0 },
  { id: '2', value: 16, row: 0, col: 1 },
]
console.log("Initial:", tiles.map(t => `${t.id}:${t.value}@${t.row},${t.col}`))
tiles = testMove('LEFT', tiles)
console.log("After Left:", tiles.map(t => `${t.id}:${t.value}@${t.row},${t.col}${t.isDead?'(dead)':''}`))
tiles = testMove('LEFT', tiles)
console.log("After Left 2:", tiles.map(t => `${t.id}:${t.value}@${t.row},${t.col}${t.isDead?'(dead)':''}`))
