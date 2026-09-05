import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronsDown,
  RotateCcw, RotateCw, Pause, Play, Trophy, Settings, Square,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useTetris, COLS, ROWS, type PieceType } from '../hooks/useTetris'
import ConfirmExitModal from '../components/ConfirmExitModal'
import GameEndModal from '../components/GameEndModal'
import { useStats } from '../hooks/useStats'
import { useSound } from '../hooks/useSound'

// ─── Piece colors ─────────────────────────────────────────────
const PIECE_COLORS: Record<PieceType, { fill: string; light: string; dark: string }> = {
  I: { fill: '#22d3ee', light: '#67e8f9', dark: '#0e7490' },
  O: { fill: '#fbbf24', light: '#fde68a', dark: '#b45309' },
  T: { fill: '#a855f7', light: '#d8b4fe', dark: '#6b21a8' },
  S: { fill: '#22c55e', light: '#86efac', dark: '#15803d' },
  Z: { fill: '#f43f5e', light: '#fda4af', dark: '#be123c' },
  J: { fill: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8' },
  L: { fill: '#f97316', light: '#fdba74', dark: '#c2410c' },
}

// ─── Draw a single block on canvas ───────────────────────────
function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  type: PieceType,
  alpha = 1,
  ghost = false,
) {
  const col = PIECE_COLORS[type]
  const px = x * size, py = y * size
  const r = Math.max(2, size * 0.12)
  ctx.save()
  ctx.globalAlpha = alpha
  if (ghost) {
    ctx.strokeStyle = col.fill
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.roundRect(px + 1, py + 1, size - 2, size - 2, r); ctx.stroke()
    ctx.restore(); return
  }
  ctx.shadowColor = col.fill; ctx.shadowBlur = 6
  const g = ctx.createLinearGradient(px, py, px + size, py + size)
  g.addColorStop(0, col.light); g.addColorStop(0.5, col.fill); g.addColorStop(1, col.dark)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.roundRect(px + 1, py + 1, size - 2, size - 2, r); ctx.fill()
  ctx.shadowBlur = 0
  const hg = ctx.createLinearGradient(px, py, px, py + size * 0.5)
  hg.addColorStop(0, 'rgba(255,255,255,0.45)'); hg.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hg
  ctx.beginPath(); ctx.roundRect(px + 2, py + 2, size - 4, size * 0.42, r); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.roundRect(px + 1, py + 1, size - 2, size - 2, r); ctx.stroke()
  ctx.restore()
}

// ─── Mini piece for Hold / Next ───────────────────────────────
const MINI_MATRICES: Record<PieceType, number[][]> = {
  I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]], L: [[0,0,1],[1,1,1]],
}

function MiniPiece({ type, cellSize = 14 }: { type: PieceType | null; cellSize?: number }) {
  if (!type) return <div style={{ height: cellSize * 2 + 2 }} />
  const mat = MINI_MATRICES[type]
  const col = PIECE_COLORS[type]
  return (
    <div className="flex items-center justify-center" style={{ height: cellSize * 2 + 2 }}>
      <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${mat[0].length}, ${cellSize}px)`, gap: 1 }}>
        {mat.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} style={{
            width: cellSize, height: cellSize,
            background: cell === 1 ? `linear-gradient(135deg, ${col.light}, ${col.fill}, ${col.dark})` : 'transparent',
            borderRadius: 2,
            border: cell === 1 ? '0.5px solid rgba(255,255,255,0.25)' : 'none',
            position: 'relative', overflow: 'hidden',
          }}>
            {cell === 1 && (
              <div style={{ position: 'absolute', inset: 0, height: '45%', background: 'linear-gradient(to bottom,rgba(255,255,255,0.4),transparent)' }} />
            )}
          </div>
        )))}
      </div>
    </div>
  )
}

// ─── Control button ───────────────────────────────────────────
type CtrlVariant = 'hold' | 'rotate' | 'drop' | 'arrow'

const VARIANT_STYLES: Record<CtrlVariant, string> = {
  hold: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-950/40 border border-amber-400/30',
  rotate: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-950/40 border border-violet-400/30',
  drop: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-md shadow-cyan-950/40 border border-cyan-400/30',
  arrow: 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 shadow-md shadow-black/40 border border-slate-600/50 active:bg-slate-600',
}

function CtrlBtn({ id, onPress, icon, label, size = 44, width, variant = 'arrow' }: {
  id: string
  onPress: () => void
  icon: React.ReactNode
  label: string
  size?: number
  width?: string | number
  variant?: CtrlVariant
}) {
  const pressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const start = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); onPress()
    pressRef.current = setTimeout(() => { repeatRef.current = setInterval(onPress, 60) }, 180)
  }, [onPress])
  const stop = useCallback(() => {
    if (pressRef.current) clearTimeout(pressRef.current)
    if (repeatRef.current) clearInterval(repeatRef.current)
  }, [])
  return (
    <button
      id={id} aria-label={label}
      onPointerDown={start} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop}
      className={`relative flex items-center justify-center rounded-xl font-bold select-none touch-none active:scale-95 transition-transform ${VARIANT_STYLES[variant]}`}
      style={{ width: width ?? '100%', height: size }}
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: 'linear-gradient(to bottom,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0) 50%)' }} />
      {icon}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function Tetris() {
  const navigate = useNavigate()
  const game = useTetris()
  const { recordResult } = useStats('tetris')
  const { playClick, playWin, playLose } = useSound()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [endModalOpen, setEndModalOpen] = useState(false)
  const [endResult, setEndResult] = useState<'win' | 'lose' | null>(null)
  const [flashLines, setFlashLines] = useState(false)
  const prevLinesRef = useRef(0)

  // Canvas refs (inlined from GameBoard for layout integration)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !game.gameOver && !endModalOpen && currentLocation.pathname !== nextLocation.pathname
  )

  // When game over occurs naturally (blocks reach the top): user loses!
  useEffect(() => {
    if (game.gameOver && !endModalOpen) {
      setEndResult('lose')
      recordResult('loss')
      setEndModalOpen(true)
      playLose()
    }
  }, [game.gameOver, endModalOpen, recordResult, playLose])

  const handleEndGame = () => {
    playClick()
    setSettingsOpen(false)
    const isWin = game.score >= 1
    const res = isWin ? 'win' : 'lose'
    setEndResult(res)
    recordResult(isWin ? 'win' : 'loss')
    setEndModalOpen(true)
    if (!game.gameOver && !game.paused) {
      game.togglePause()
    }
    if (isWin) playWin()
    else playLose()
  }

  const handleRestart = () => {
    playClick()
    setSettingsOpen(false)
    setEndModalOpen(false)
    game.restart()
  }

  const handleTogglePause = () => {
    playClick()
    game.togglePause()
  }

  const handlePlayAgain = () => {
    playClick()
    setEndModalOpen(false)
    game.restart()
  }

  // Flash on line clear
  useEffect(() => {
    if (game.lines > prevLinesRef.current) {
      setFlashLines(true)
      setTimeout(() => setFlashLines(false), 280)
    }
    prevLinesRef.current = game.lines
  }, [game.lines])

  // ── Canvas draw ──────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return
    const w = wrap.clientWidth, h = Math.max(0, wrap.clientHeight - 12)
    const size = Math.floor(Math.min(w / COLS, h / ROWS))
    const bw = size * COLS, bh = size * ROWS
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh }
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, bw, bh)
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(0, 0, bw, bh)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r*size); ctx.lineTo(bw, r*size); ctx.stroke() }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c*size, 0); ctx.lineTo(c*size, bh); ctx.stroke() }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (game.board[r][c]) drawBlock(ctx, c, r, size, game.board[r][c]!)
    if (game.ghost && game.current)
      for (let r = 0; r < game.ghost.matrix.length; r++)
        for (let c = 0; c < game.ghost.matrix[r].length; c++)
          if (game.ghost.matrix[r][c]) { const ny=game.ghost.y+r, nx=game.ghost.x+c; if (ny>=0&&ny<ROWS&&nx>=0&&nx<COLS&&!game.board[ny][nx]) drawBlock(ctx,nx,ny,size,game.current.type,0.18,true) }
    if (game.current)
      for (let r = 0; r < game.current.matrix.length; r++)
        for (let c = 0; c < game.current.matrix[r].length; c++)
          if (game.current.matrix[r][c]) { const ny=game.current.y+r, nx=game.current.x+c; if (ny>=0&&ny<ROWS&&nx>=0&&nx<COLS) drawBlock(ctx,nx,ny,size,game.current.type) }
  }, [game.board, game.current, game.ghost])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const wrap = wrapRef.current; if (!wrap) return
    const ro = new ResizeObserver(() => draw()); ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  // ── Keyboard ─────────────────────────────────────────────────
  useEffect(() => {
    const DELAY = 150, RATE = 50
    const down: Record<string, boolean> = {}
    const timers: Record<string, ReturnType<typeof setTimeout | typeof setInterval>> = {}
    const onDown = (e: KeyboardEvent) => {
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space'].includes(e.code)) e.preventDefault()
      if (down[e.code]) return; down[e.code] = true
      switch (e.code) {
        case 'ArrowLeft': game.moveLeft(); break
        case 'ArrowRight': game.moveRight(); break
        case 'ArrowDown': game.softDrop(); break
        case 'ArrowUp': case 'KeyX': game.rotateRight(); break
        case 'KeyZ': game.rotateLeft(); break
        case 'Space': game.hardDrop(); break
        case 'KeyC': game.holdPiece(); break
        case 'Escape': case 'KeyP': game.togglePause(); break
      }
      const fn = e.code==='ArrowLeft'?game.moveLeft:e.code==='ArrowRight'?game.moveRight:e.code==='ArrowDown'?game.softDrop:null
      if (fn) timers[e.code] = setTimeout(() => { timers[e.code+'_i'] = setInterval(fn, RATE) }, DELAY)
    }
    const onUp = (e: KeyboardEvent) => {
      down[e.code] = false
      clearTimeout(timers[e.code] as ReturnType<typeof setTimeout>)
      clearInterval(timers[e.code+'_i'] as ReturnType<typeof setInterval>)
    }
    window.addEventListener('keydown', onDown, { passive: false })
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [game])

  // Controls size & panel width for right vertical column
  const [btnSize, setBtnSize] = useState(48)
  const [panelWidth, setPanelWidth] = useState(96)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w < 380) {
        setPanelWidth(88)
        setBtnSize(h < 680 ? 38 : 42)
      } else {
        setPanelWidth(96)
        setBtnSize(h < 720 ? 44 : 48)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const ico = btnSize * 0.44

  return (
    <Layout className="flex flex-col overflow-hidden h-[100dvh]">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-3 pt-2 pb-1">
        <button
          onClick={() => {
            playClick()
            navigate('/')
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] active:scale-90 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <h1 className="text-lg font-black bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
          Tetris
        </h1>

        {/* Settings button — animated gear icon matching TicTacToe */}
        <button
          onClick={() => {
            playClick()
            setSettingsOpen(!settingsOpen)
          }}
          className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-90 ${
            settingsOpen
              ? 'bg-violet-600 text-white border border-violet-500 shadow-violet-900/40'
              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
          }`}
          aria-label="Settings"
        >
          <motion.div animate={{ rotate: settingsOpen ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Settings size={16} />
          </motion.div>
        </button>
      </div>

      {/* ── Settings Tray: Pause Game, Restart Game, End Game ── */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden px-2.5 pb-2 shrink-0 z-20"
          >
            <div className="flex items-center justify-between gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 shadow-lg">
              {/* Pause / Resume */}
              <button
                onClick={handleTogglePause}
                disabled={game.gameOver}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
              >
                {game.paused ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} className="text-amber-400" />}
                <span>{game.paused ? 'Resume' : 'Pause'}</span>
              </button>

              <div className="w-[1px] h-4 bg-[var(--border-color)]" />

              {/* Restart */}
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-white/10 active:scale-95 transition-all"
              >
                <RotateCcw size={13} className="text-violet-400" />
                <span>Restart</span>
              </button>

              <div className="w-[1px] h-4 bg-[var(--border-color)]" />

              {/* End Game */}
              <button
                onClick={handleEndGame}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
              >
                <Square size={13} className="fill-rose-400/20" />
                <span>End Game</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex flex-1 gap-2 px-2 pb-2 min-h-0">

        {/* BOARD COLUMN: Full height board with sleek arcade frame */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col rounded-2xl bg-black/60 border border-[var(--border-color)] shadow-inner overflow-hidden relative">
          <div
            ref={wrapRef}
            className="flex-1 min-h-0 relative flex items-end justify-center pb-2.5"
          >
            <canvas
              ref={canvasRef}
              className={`block transition-all duration-200 ${flashLines ? 'brightness-[1.4]' : ''}`}
            />

            {/* Pause overlay */}
            <AnimatePresence>
              {game.paused && !game.gameOver && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm">
                  <span className="text-xl font-black text-white drop-shadow">PAUSED</span>
                  <button onClick={game.togglePause}
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-transform">
                    Resume
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT PANEL: Expands full height with equal spacing around all items */}
        <div className="flex flex-col justify-evenly shrink-0 h-full py-1" style={{ width: panelWidth }}>

          {/* Hold */}
          <button
            onClick={game.holdPiece}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-1.5 px-2 flex flex-col items-center shadow-sm active:scale-95 transition-transform"
            aria-label="Hold Piece"
          >
            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Hold</span>
            <div className="flex items-center justify-center h-7">
              <MiniPiece type={game.held?.type ?? null} cellSize={panelWidth >= 96 ? 15 : 13} />
            </div>
          </button>

          {/* Next */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-1.5 px-2 flex flex-col items-center shadow-sm">
            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Next</span>
            <div className="flex items-center justify-center h-7">
              <MiniPiece type={game.nextQueue[0]?.type ?? null} cellSize={panelWidth >= 96 ? 15 : 13} />
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-1.5 px-2 shadow-sm">
            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-none">Score</span>
            <span className="text-base font-black tabular-nums leading-tight mt-0.5 text-amber-400">{game.score}</span>
          </div>

          {/* Best */}
          <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-1.5 px-2 shadow-sm">
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider leading-none">
              <Trophy size={10} /> Best
            </span>
            <span className="text-base font-black tabular-nums leading-tight mt-0.5 text-amber-400">{game.bestScore}</span>
          </div>

          {/* Level (separate line) */}
          <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-1.5 px-2 shadow-sm">
            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-none">Level</span>
            <span className="text-base font-black tabular-nums leading-tight mt-0.5 text-[var(--text-primary)]">{game.level}</span>
          </div>

          {/* Lines (separate line) */}
          <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-1.5 px-2 shadow-sm">
            <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-none">Lines</span>
            <span className="text-base font-black tabular-nums leading-tight mt-0.5 text-[var(--text-primary)]">{game.lines}</span>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 shadow-sm">
            {/* Actions: Hold & Hard Drop */}
            <div className="grid grid-cols-2 gap-1">
              <CtrlBtn id="ctrl-hold" onPress={game.holdPiece} label="Hold" size={btnSize} variant="hold"
                icon={<span style={{ fontWeight: 900, fontSize: btnSize * 0.38 }}>H</span>} />
              <CtrlBtn id="ctrl-hard" onPress={game.hardDrop} label="Hard Drop" size={btnSize} variant="drop"
                icon={<ChevronsDown size={ico} />} />
            </div>

            {/* Rotations: Left & Right */}
            <div className="grid grid-cols-2 gap-1">
              <CtrlBtn id="ctrl-rotl" onPress={game.rotateLeft} label="Rotate L" size={btnSize} variant="rotate"
                icon={<RotateCcw size={ico} />} />
              <CtrlBtn id="ctrl-rotr" onPress={game.rotateRight} label="Rotate R" size={btnSize} variant="rotate"
                icon={<RotateCw size={ico} />} />
            </div>

            {/* Horizontal Movement: Left & Right */}
            <div className="grid grid-cols-2 gap-1">
              <CtrlBtn id="ctrl-left" onPress={game.moveLeft} label="Left" size={btnSize} variant="arrow"
                icon={<ArrowLeft size={ico} />} />
              <CtrlBtn id="ctrl-right" onPress={game.moveRight} label="Right" size={btnSize} variant="arrow"
                icon={<ArrowRight size={ico} />} />
            </div>

            {/* Downward Movement: Soft Drop bar */}
            <CtrlBtn id="ctrl-soft" onPress={game.softDrop} label="Soft Drop" width="100%" size={Math.round(btnSize * 0.82)} variant="arrow"
              icon={<ChevronDown size={ico} />} />
          </div>

        </div>
      </div>

      <GameEndModal
        isOpen={endModalOpen}
        result={endResult}
        winnerName={endResult === 'win' ? 'You' : undefined}
        onPlayAgain={handlePlayAgain}
      />

      <ConfirmExitModal
        isOpen={blocker.state === 'blocked'}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </Layout>
  )
}
