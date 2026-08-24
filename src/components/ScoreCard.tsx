import { motion } from 'framer-motion'

interface ScoreCardProps {
  player1: { name: string; score: number; color: string; avatar: string }
  player2: { name: string; score: number; color: string; avatar: string }
  activePlayer: 1 | 2
}

export default function ScoreCard({ player1, player2, activePlayer }: ScoreCardProps) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1 shrink-0">
      <PlayerBadge player={player1} isActive={activePlayer === 1} />

      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <motion.span
          key={`p1-${player1.score}`}
          initial={{ scale: 1.5, y: -3 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-lg font-black tabular-nums"
          style={{ color: player1.color }}
        >
          {player1.score}
        </motion.span>
        <span className="text-xs font-bold text-[var(--text-secondary)] opacity-40">:</span>
        <motion.span
          key={`p2-${player2.score}`}
          initial={{ scale: 1.5, y: -3 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-lg font-black tabular-nums"
          style={{ color: player2.color }}
        >
          {player2.score}
        </motion.span>
      </div>

      <PlayerBadge player={player2} isActive={activePlayer === 2} />
    </div>
  )
}

function PlayerBadge({
  player,
  isActive,
}: {
  player: { name: string; color: string; avatar: string }
  isActive: boolean
}) {
  return (
    <motion.div
      animate={{ scale: isActive ? 1 : 0.9, opacity: isActive ? 1 : 0.45 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-xl"
      style={isActive ? {
        backgroundColor: `${player.color}15`,
        border: `1.5px solid ${player.color}30`,
      } : {}}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
        style={{ backgroundColor: player.color }}
      >
        {player.avatar}
      </div>
      <span className="text-[11px] font-bold truncate max-w-[50px]">{player.name}</span>
    </motion.div>
  )
}
