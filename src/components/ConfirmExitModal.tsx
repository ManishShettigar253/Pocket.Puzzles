import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmExitModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmExitModal({ isOpen, onConfirm, onCancel }: ConfirmExitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[24px] shadow-2xl max-w-sm w-full text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Quit Game?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Are you sure you want to leave? Your current progress will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-color)] text-[var(--text-primary)] transition-all"
              >
                Continue
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all"
              >
                Quit Game
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
