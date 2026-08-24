import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Grid3X3, Hash, Circle, Trophy, Gamepad2, Flame, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import ThemeToggle from '../components/ThemeToggle'
import { getAllStats, type GameStats } from '../hooks/useStats'
import { useMemo } from 'react'

interface GameCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  path: string
  gradient: string
  accent: string
}

const GAMES: GameCard[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Classic 3×3 grid. Outsmart the AI or challenge a friend!',
    icon: <Grid3X3 size={32} strokeWidth={2.5} />,
    path: '/tic-tac-toe',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    accent: '#f43f5e',
  },
  {
    id: 'bingo',
    title: 'Bingo',
    description: '5×5 number grid. Call numbers and race to complete 5 lines!',
    icon: <Hash size={32} strokeWidth={2.5} />,
    path: '/bingo',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    accent: '#f59e0b',
  },
  {
    id: 'connect-four',
    title: 'Connect Four',
    description: '7×6 board. Drop discs and connect 4 in a row to win!',
    icon: <Circle size={32} strokeWidth={2.5} />,
    path: '/connect-four',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    accent: '#6366f1',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function Home() {
  const navigate = useNavigate()
  const allStats = useMemo(() => getAllStats(), [])

  const totalGames = Object.values(allStats).reduce((s, g) => s + g.gamesPlayed, 0)
  const totalWins = Object.values(allStats).reduce((s, g) => s + g.wins, 0)
  const overallWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
  const bestStreak = Object.values(allStats).reduce((s, g) => Math.max(s, g.bestStreak), 0)

  return (
    <Layout className="overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-600 bg-clip-text text-transparent">
              Pocket
            </span>
            <span>Puzzles</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-[var(--text-secondary)] mt-0.5"
          >
            Brain games, anytime, anywhere ✨
          </motion.p>
        </div>
        <ThemeToggle />
      </div>

      {/* Stats Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-5 mt-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
      >
        <div className="flex items-center justify-around">
          <StatItem icon={<Gamepad2 size={16} />} label="Played" value={totalGames} />
          <div className="w-px h-8 bg-[var(--border-color)]" />
          <StatItem icon={<TrendingUp size={16} />} label="Win Rate" value={`${overallWinRate}%`} />
          <div className="w-px h-8 bg-[var(--border-color)]" />
          <StatItem icon={<Flame size={16} />} label="Best Streak" value={bestStreak} />
          <div className="w-px h-8 bg-[var(--border-color)]" />
          <StatItem icon={<Trophy size={16} />} label="Wins" value={totalWins} />
        </div>
      </motion.div>

      {/* Game Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 px-5 py-4"
      >
        <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Choose a game
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => (
            <GameCardComponent
              key={game.id}
              game={game}
              stats={allStats[game.id]}
              onClick={() => navigate(game.path)}
            />
          ))}
        </div>
      </motion.div>

      {/* Meet the Developer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-5 pb-4"
      >
        <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>👨‍💻</span> Meet the Developer
        </h2>
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar with green ring */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-[3px] shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black">
                M
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black">Manish</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  SDE at IBM
                </span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  Mangalore
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="https://www.linkedin.com/in/manish253/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:border-blue-400 hover:text-blue-400 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <a
              href="https://www.instagram.com/manish__shettigar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:border-pink-400 hover:text-pink-400 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              Instagram
            </a>
            <a
              href="https://github.com/ManishShettigar253"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:border-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-3 text-xs text-[var(--text-secondary)] opacity-50 shrink-0">
        Built with ❤️ by Manish
      </div>
    </Layout>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-primary-400">{icon}</div>
      <span className="text-base font-black tabular-nums">{value}</span>
      <span className="text-[10px] text-[var(--text-secondary)] font-medium">{label}</span>
    </div>
  )
}

function GameCardComponent({
  game,
  stats,
  onClick,
}: {
  game: GameCard
  stats: GameStats
  onClick: () => void
}) {
  return (
    <motion.button
      variants={item}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative w-full text-left overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-90`} />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 transform rotate-12 scale-150 text-white opacity-20">
          {game.icon}
        </div>
        <div className="absolute bottom-2 left-2 transform -rotate-12 scale-75 text-white opacity-10">
          {game.icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md">
            {game.icon}
          </div>
          {stats.gamesPlayed > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold">
              {stats.wins}W / {stats.losses}L
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-black text-white mb-1">{game.title}</h3>
          <p className="text-white/70 text-xs leading-relaxed">{game.description}</p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="px-3 py-1.5 rounded-xl bg-white/25 backdrop-blur-sm text-white text-xs font-bold shadow-sm group-hover:bg-white/35 transition-colors">
            Play Now →
          </span>
          {stats.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-white/80 text-[10px] font-semibold">
              <Flame size={12} /> {stats.currentStreak} streak
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
