import { useCallback } from 'react'

export interface GameStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  currentStreak: number
  bestStreak: number
}

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
}

function getStorageKey(gameId: string): string {
  return `pocket-puzzles-stats-${gameId}`
}

export function useStats(gameId: string) {
  const getStats = useCallback((): GameStats => {
    try {
      const raw = localStorage.getItem(getStorageKey(gameId))
      if (raw) return JSON.parse(raw) as GameStats
    } catch {
      // ignore parse errors
    }
    return { ...DEFAULT_STATS }
  }, [gameId])

  const saveStats = useCallback(
    (stats: GameStats) => {
      localStorage.setItem(getStorageKey(gameId), JSON.stringify(stats))
    },
    [gameId]
  )

  const recordResult = useCallback(
    (result: 'win' | 'loss' | 'draw') => {
      const stats = getStats()
      stats.gamesPlayed++
      if (result === 'win') {
        stats.wins++
        stats.currentStreak++
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
      } else if (result === 'loss') {
        stats.losses++
        stats.currentStreak = 0
      } else {
        stats.draws++
        stats.currentStreak = 0
      }
      saveStats(stats)
      return stats
    },
    [getStats, saveStats]
  )

  const getWinRate = useCallback((): number => {
    const stats = getStats()
    if (stats.gamesPlayed === 0) return 0
    return Math.round((stats.wins / stats.gamesPlayed) * 100)
  }, [getStats])

  return { getStats, recordResult, getWinRate }
}

export function getAllStats(): Record<string, GameStats> {
  const games = ['tic-tac-toe', 'bingo', 'connect-four', '2048', 'memory-match', 'rock-paper-scissors', 'dots-connect']
  const result: Record<string, GameStats> = {}
  for (const game of games) {
    try {
      const raw = localStorage.getItem(getStorageKey(game))
      result[game] = raw ? (JSON.parse(raw) as GameStats) : { ...DEFAULT_STATS }
    } catch {
      result[game] = { ...DEFAULT_STATS }
    }
  }
  return result
}
