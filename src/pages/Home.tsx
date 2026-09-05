import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid3X3, Hash, Circle, Trophy, Gamepad2, Flame, TrendingUp, Search, LayoutGrid, Info, X, Network, ListFilter, Check, Layers } from 'lucide-react'
import Layout from '../components/Layout'
import ThemeToggle from '../components/ThemeToggle'
import { getAllStats, type GameStats } from '../hooks/useStats'
import { useMemo, useState } from 'react'
import mePic from '../assets/me.jpeg'

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
    id: 'tower-of-hanoi',
    title: 'Tower of Hanoi',
    description: 'Move the stack of disks to the destination tower one by one!',
    icon: <Layers size={32} strokeWidth={2.5} />,
    path: '/tower-of-hanoi',
    gradient: 'from-amber-400 via-rose-500 to-violet-600',
    accent: '#f43f5e',
  },
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Stack falling blocks and clear lines in this colorful neon classic!',
    icon: <LayoutGrid size={32} strokeWidth={2.5} />,
    path: '/tetris',
    gradient: 'from-cyan-400 via-violet-500 to-fuchsia-600',
    accent: '#8b5cf6',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards and find matching pairs! Test your memory.',
    icon: <Grid3X3 size={32} strokeWidth={2.5} />,
    path: '/memory-match',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-500',
    accent: '#14b8a6',
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
  {
    id: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    description: 'The classic showdown. Try to outsmart the AI bot!',
    icon: <span className="text-3xl filter grayscale brightness-200">✌️</span>,
    path: '/rock-paper-scissors',
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    accent: '#d946ef',
  },
  {
    id: 'hand-cricket',
    title: 'Hand Cricket',
    description: 'Classic playground game! Bat, bowl, and chase targets against the AI.',
    icon: <span className="text-3xl filter grayscale brightness-200">🏏</span>,
    path: '/hand-cricket',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    accent: '#10b981',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Slide tiles and merge numbers to reach the ultimate 2048 tile!',
    icon: <LayoutGrid size={32} strokeWidth={2.5} />,
    path: '/2048',
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    accent: '#f59e0b',
  },
  {
    id: 'dots-connect',
    title: 'Dots Connect',
    description: 'Connect matching colors to fill the entire grid. Mind-bending puzzles!',
    icon: <Network size={32} strokeWidth={2.5} />,
    path: '/dots-connect',
    gradient: 'from-sky-400 via-indigo-500 to-purple-600',
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showDevModal, setShowDevModal] = useState(false)
  const [sortBy, setSortBy] = useState<'default' | 'alphabetical' | 'most-played' | 'win-rate'>('default')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filteredGames = useMemo(() => {
    let result = GAMES

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query)
      )
    }

    if (sortBy === 'alphabetical') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'most-played') {
      result = [...result].sort((a, b) => {
        const aPlayed = allStats[a.id]?.gamesPlayed || 0
        const bPlayed = allStats[b.id]?.gamesPlayed || 0
        return bPlayed - aPlayed
      })
    } else if (sortBy === 'win-rate') {
      result = [...result].sort((a, b) => {
        const aStats = allStats[a.id]
        const bStats = allStats[b.id]
        
        const aTotalDecisive = aStats ? aStats.wins + aStats.losses : 0
        const bTotalDecisive = bStats ? bStats.wins + bStats.losses : 0
        
        const aWinRate = aTotalDecisive > 0 ? (aStats!.wins / aTotalDecisive) : -1
        const bWinRate = bTotalDecisive > 0 ? (bStats!.wins / bTotalDecisive) : -1
        
        return bWinRate - aWinRate
      })
    }

    return result
  }, [searchQuery, sortBy, allStats])

  const totalGames = Object.values(allStats).reduce((s, g) => s + g.gamesPlayed, 0)
  const totalWins = Object.values(allStats).reduce((s, g) => s + g.wins, 0)
  const totalLosses = Object.values(allStats).reduce((s, g) => s + g.losses, 0)
  const totalDecisiveGames = totalWins + totalLosses
  const overallWinRate = totalDecisiveGames > 0 ? Math.round((totalWins / totalDecisiveGames) * 100) : 0

  return (
    <Layout className="overflow-hidden">
      {/* Fixed Header Section */}
      <div className="z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl pb-4 shadow-sm border-b border-[var(--border-color)] shrink-0 relative">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDevModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm text-[var(--text-secondary)] hover:text-indigo-500 hover:border-indigo-500/30 transition-all"
            >
              <Info size={20} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-5 mt-2 mb-4 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
        >
          <div className="flex items-center justify-around">
            <StatItem icon={<Gamepad2 size={16} />} label="Played" value={totalGames} />
            <div className="w-px h-8 bg-[var(--border-color)]" />
            <StatItem icon={<TrendingUp size={16} />} label="Win Rate" value={`${overallWinRate}%`} />
            <div className="w-px h-8 bg-[var(--border-color)]" />
            <StatItem icon={<Trophy size={16} />} label="Wins" value={totalWins} />
            <div className="w-px h-8 bg-[var(--border-color)]" />
            <StatItem icon={<X size={16} />} label="Losses" value={totalLosses} />
          </div>
        </motion.div>

        {/* Search Bar Section */}
        <div className="px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider shrink-0">
            Choose a game
          </h2>
          <div className="relative w-full sm:max-w-xs flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-[var(--text-secondary)]" />
              </div>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-sm"
              />
            </div>
            
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center border transition-all shadow-sm ${
                  showSortDropdown || sortBy !== 'default'
                    ? 'bg-primary-500/10 text-primary-500 border-primary-500/30'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:border-primary-500/30'
                }`}
                aria-label="Sort games"
              >
                <ListFilter size={18} />
              </button>
              
              <AnimatePresence>
                {showSortDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSortDropdown(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden py-1"
                    >
                      {[
                        { id: 'default', label: 'Default Order' },
                        { id: 'alphabetical', label: 'Alphabetical' },
                        { id: 'most-played', label: 'Most Played' },
                        { id: 'win-rate', label: 'Highest Win Rate' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortBy(opt.id as any)
                            setShowSortDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[var(--bg-primary)] transition-colors ${
                            sortBy === opt.id ? 'text-primary-500 font-bold' : 'text-[var(--text-primary)] font-medium'
                          }`}
                        >
                          {opt.label}
                          {sortBy === opt.id && <Check size={14} />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col relative min-h-0">
        {/* Game Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="px-5 py-6 flex flex-col"
        >

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <GameCardComponent
                key={game.id}
                game={game}
                stats={allStats[game.id]}
                onClick={() => navigate(game.path)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-[var(--text-secondary)]">
            <Search size={32} className="mb-3 opacity-20" />
            <p className="text-sm">No games found for "{searchQuery}"</p>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="text-center py-5 text-xs text-[var(--text-secondary)] opacity-50 shrink-0">
        Built with ❤️ by Manish
      </div>
      
      </div> {/* End Scrollable Body */}

      {/* Developer Modal */}
      <AnimatePresence>
        {showDevModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDevModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              <button
                onClick={() => setShowDevModal(false)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="relative group rounded-[28px] p-[1.5px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
                
                <div className="relative rounded-[26.5px] bg-[var(--bg-card)] p-5 z-10">
                  <div className="flex items-center gap-4 mb-5">
                    {/* Profile Image with animated ring */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-80 transition duration-500 animate-pulse"></div>
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--bg-card)] bg-gradient-to-br from-indigo-600 to-violet-600">
                        <img
                          src={mePic}
                          alt="Manish"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                          className="w-full h-full object-cover"
                        />
                        {/* Fallback Initial */}
                        <div className="hidden w-full h-full flex items-center justify-center text-white text-2xl font-black">
                          M
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1 opacity-70">
                        Designed & Built By
                      </h3>
                      <h2 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent leading-tight mb-1.5">
                        Manish
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        <span className="flex items-center gap-1 bg-[var(--bg-primary)] px-2 py-1 rounded-md">
                          👨‍💻 SDE at IBM
                        </span>
                        <span className="flex items-center gap-1 bg-[var(--bg-primary)] px-2 py-1 rounded-md">
                          📍 Mangalore
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href="https://www.linkedin.com/in/manish253/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-[14px] bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-blue-500/30 text-[var(--text-secondary)] hover:text-blue-500 transition-all group/link"
                    >
                      <svg className="transition-transform group-hover/link:scale-110 group-hover/link:-translate-y-0.5" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      <span className="text-[9px] font-bold uppercase tracking-widest">LinkedIn</span>
                    </a>
                    <a
                      href="https://www.instagram.com/manish__shettigar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-[14px] bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-pink-500/30 text-[var(--text-secondary)] hover:text-pink-500 transition-all group/link"
                    >
                      <svg className="transition-transform group-hover/link:scale-110 group-hover/link:-translate-y-0.5" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      <span className="text-[9px] font-bold uppercase tracking-widest">Instagram</span>
                    </a>
                    <a
                      href="https://github.com/ManishShettigar253"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-[14px] bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--text-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all group/link"
                    >
                      <svg className="transition-transform group-hover/link:scale-110 group-hover/link:-translate-y-0.5" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      <span className="text-[9px] font-bold uppercase tracking-widest">GitHub</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
