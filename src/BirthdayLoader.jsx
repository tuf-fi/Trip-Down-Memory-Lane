import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BirthdayLoader.css'

const MIN_MS = 3800 // always show the party for at least this long
const CONFETTI_COLORS = ['#ff85b4', '#ffb648', '#8fd3ff', '#b79cff', '#7fe3b0', '#fff2a8']
const MESSAGES = [
  'Blowing up balloons…',
  'Frosting the cake…',
  'Lighting the candles…',
  'Wrapping the memories…',
  'Almost party time!',
]

export default function BirthdayLoader({ children }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const confetti = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 4,
        duration: 3.5 + Math.random() * 3,
        round: i % 3 === 0,
      })),
    []
  )

  useEffect(() => {
    const start = performance.now()
    let loaded = document.readyState === 'complete'
    const onLoad = () => (loaded = true)
    window.addEventListener('load', onLoad)

    let raf
    let timer
    const tick = (now) => {
      const t = Math.min((now - start) / MIN_MS, 1)
      const eased = 1 - Math.pow(1 - t, 2)
      // hold at 95% until the page has really finished loading
      const p = loaded ? eased : Math.min(eased, 0.95)
      setProgress(p)
      if (p >= 1) timer = setTimeout(() => setDone(true), 450)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  const pct = Math.round(progress * 100)
  const message = MESSAGES[Math.min(Math.floor(progress * MESSAGES.length), MESSAGES.length - 1)]

  return (
    <>
      {children}
      <AnimatePresence>
        {!done && (
          <motion.div
            className="bday"
            key="bday"
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {confetti.map((c) => (
              <span
                key={c.id}
                className={`bday-confetti${c.round ? ' round' : ''}`}
                style={{
                  left: `${c.left}%`,
                  background: c.color,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`,
                }}
              />
            ))}

            <div className="bday-group">
              <img className="bday-pic" src="/images/1-removebg-preview.png" alt="" />
              <div className="bday-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                <div className="bday-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="bday-msg">{message} <b>{pct}%</b></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
