import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home'
import TicTacToe from './pages/TicTacToe'
import Bingo from './pages/Bingo'
import ConnectFour from './pages/ConnectFour'
import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const theme = useAppStore((s) => s.theme)

  // Ensure dark class is applied on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="h-full h-dvh">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />
          <Route
            path="/tic-tac-toe"
            element={
              <PageWrapper>
                <TicTacToe />
              </PageWrapper>
            }
          />
          <Route
            path="/bingo"
            element={
              <PageWrapper>
                <Bingo />
              </PageWrapper>
            }
          />
          <Route
            path="/connect-four"
            element={
              <PageWrapper>
                <ConnectFour />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
