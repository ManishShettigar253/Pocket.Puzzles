import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Frown, Handshake, RotateCcw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ConfettiEffect from './ConfettiEffect'
import { useSound } from '../hooks/useSound'

interface GameEndModalProps {
  isOpen: boolean
  result: 'win' | 'lose' | 'draw' | null
  winnerName?: string
  onPlayAgain: () => void
}

export default function GameEndModal({ isOpen, result, winnerName, onPlayAgain }: GameEndModalProps) {
  const navigate = useNavigate()
  const { playClick } = useSound()

  const config = {
    win: {
      icon: <Trophy size={48} />,
      title: `${winnerName || 'You'} Won!`,
      subtitle: 'Amazing play! 🎉',
      gradient: 'from-emerald-500 to-cyan-500',
      iconColor: 'text-yellow-300',
    },
    lose: {
      icon: <Frown size={48} />,
      title: 'You Lost!',
      subtitle: 'Better luck next time 💪',
      gradient: 'from-rose-500 to-orange-500',
      iconColor: 'text-rose-200',
    },
    draw: {
      icon: <Handshake size={48} />,
      title: "It's a Draw!",
      subtitle: 'Great match! 🤝',
      gradient: 'from-violet-500 to-purple-500',
      iconColor: 'text-purple-200',
    },
  }

  const current = result ? config[result] : config.draw

  return (
    <>
      <ConfettiEffect active={isOpen && result === 'win'} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onPlayAgain()}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`relative w-full max-w-sm rounded-3xl bg-gradient-to-br ${current.gradient} p-8 text-center text-white shadow-2xl overflow-hidden`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className={`inline-flex mb-4 ${current.iconColor}`}
              >
                {current.icon}
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black mb-1"
              >
                {current.title}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 text-sm mb-8"
              >
                {current.subtitle}
              </motion.p>

              <div className="flex gap-3 relative z-10">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playClick()
                    navigate('/')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors font-semibold text-sm backdrop-blur-sm"
                >
                  <Home size={18} /> Hub
                </motion.button>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playClick()
                    onPlayAgain()
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white text-gray-900 hover:bg-white/90 transition-colors font-bold text-sm shadow-lg"
                >
                  <RotateCcw size={18} /> Play Again
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
