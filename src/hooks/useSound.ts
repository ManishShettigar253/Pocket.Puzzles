import { useCallback, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useSound() {
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }, [])

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
      if (!soundEnabled) return
      try {
        const ctx = getCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(frequency, ctx.currentTime)
        gain.gain.setValueAtTime(volume, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + duration)
      } catch {
        // Silently fail if audio context is not available
      }
    },
    [soundEnabled, getCtx]
  )

  const playMove = useCallback(() => {
    playTone(600, 0.1, 'sine', 0.1)
  }, [playTone])

  const playClick = useCallback(() => {
    playTone(800, 0.06, 'square', 0.06)
  }, [playTone])

  const playWin = useCallback(() => {
    if (!soundEnabled) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 120)
    })
  }, [soundEnabled, playTone])

  const playDraw = useCallback(() => {
    playTone(300, 0.4, 'triangle', 0.1)
  }, [playTone])

  const playLose = useCallback(() => {
    if (!soundEnabled) return
    const notes = [400, 350, 300, 250]
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sawtooth', 0.06), i * 150)
    })
  }, [soundEnabled, playTone])

  const playDrop = useCallback(() => {
    playTone(200, 0.15, 'sine', 0.12)
    setTimeout(() => playTone(150, 0.1, 'sine', 0.08), 80)
  }, [playTone])

  const playBingo = useCallback(() => {
    if (!soundEnabled) return
    const notes = [440, 554, 659, 880, 1108]
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.1), i * 100)
    })
  }, [soundEnabled, playTone])

  return { playMove, playClick, playWin, playDraw, playLose, playDrop, playBingo }
}
