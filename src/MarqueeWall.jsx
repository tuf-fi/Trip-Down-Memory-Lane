import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import data from './data/marquee.json'
import './MarqueeWall.css'

const ROWS = 4
const MAIN_ROWS = [1, 2] // the two center rows — interactive, driven by marquee.json in order
const DECOR_PER_ROW = 20 // unique cards in each decorative (top/bottom) row
const COPIES = 3 // duplicated copies per row track — guarantees the track is
// always wider than the row (no gap of bare background while scrolling) and
// keeps the loop-restart math exact (each copy is an identical width, so
// wrapping the position by exactly one copy-width lines the next copy up
// pixel-perfect)

const ITEMS = data.items
const ROW_DURATIONS = [75, 105, 58, 118] // seconds for one copy-width to scroll by, at normal speed
const SLOW_MOTION_FACTOR = 0.2 // speed every non-active row eases to while something's active
const EASE_TAU = 0.35 // seconds — how quickly speed eases toward its target

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRow(rowIndex) {
  const mainSlot = MAIN_ROWS.indexOf(rowIndex)
  const isMain = mainSlot !== -1

  // main rows: the JSON items, dealt out alternately across the main rows
  // decor rows: random images from the same pool, no captions
  let unique
  if (isMain) {
    unique = ITEMS.filter((_, i) => i % MAIN_ROWS.length === mainSlot)
  } else {
    const pool = []
    while (pool.length < DECOR_PER_ROW) pool.push(...shuffled(ITEMS))
    unique = pool.slice(0, DECOR_PER_ROW)
  }

  const images = []
  for (let copy = 0; copy < COPIES; copy++) {
    unique.forEach((item, i) => {
      images.push({ key: `${rowIndex}-${copy}-${i}`, src: item.image, item })
    })
  }
  return {
    isMain,
    duration: ROW_DURATIONS[rowIndex % ROW_DURATIONS.length],
    direction: rowIndex % 2 === 0 ? 'normal' : 'reverse',
    images,
  }
}

export default function MarqueeWall() {
  const rows = useMemo(
    () => Array.from({ length: ROWS }, (_, i) => buildRow(i)),
    []
  )

  const trackRefs = useRef([])
  const hoveredRowRef = useRef(null) // which row index is currently hovered, or null
  const openRowRef = useRef(null) // which row index has a card open in the modal, or null

  const [openImage, setOpenImage] = useState(null) // { key, src, item } | null
  const [modalFlipped, setModalFlipped] = useState(true)

  const openCard = (img, rowIndex) => {
    openRowRef.current = rowIndex
    setModalFlipped(true) // the open transition doubles as the flip-to-caption
    setOpenImage({ key: img.key, src: img.src, item: img.item })
  }

  const closeCard = () => {
    openRowRef.current = null
    setOpenImage(null)
  }

  useEffect(() => {
    if (!openImage) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeCard()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openImage])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const rowState = rows.map((row) => ({
      pos: 0,
      mult: reduceMotion ? 0 : 1,
      singleWidth: 0,
      speed: 0, // px/sec at mult = 1
      dir: row.direction === 'reverse' ? 1 : -1,
      duration: row.duration,
    }))

    const measure = () => {
      rowState.forEach((s, i) => {
        const el = trackRefs.current[i]
        if (!el) return
        s.singleWidth = el.scrollWidth / COPIES
        s.speed = s.singleWidth / s.duration
      })
    }

    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)

    let raf
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1) // clamp so a stalled tab doesn't jump on return
      last = now

      rowState.forEach((s, i) => {
        if (!reduceMotion) {
          const isActiveRow = hoveredRowRef.current === i || openRowRef.current === i
          const anyActive = hoveredRowRef.current !== null || openRowRef.current !== null
          const target = isActiveRow ? 0 : anyActive ? SLOW_MOTION_FACTOR : 1
          const k = 1 - Math.exp(-dt / EASE_TAU)
          s.mult += (target - s.mult) * k

          if (s.singleWidth > 0) {
            s.pos += s.dir * s.speed * s.mult * dt
            if (s.dir < 0 && s.pos <= -s.singleWidth) s.pos += s.singleWidth
            if (s.dir > 0 && s.pos >= s.singleWidth) s.pos -= s.singleWidth
          }
        }

        const el = trackRefs.current[i]
        if (el) el.style.transform = `translateX(${s.pos}px)`
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [rows])

  return (
    <>
      <div className="wall">
        {rows.map((row, i) => {
          // only the main rows react to hover/click — the rest are decorative
          const isMain = row.isMain
          return (
            <div className={`row${isMain ? ' interactive' : ''}`} key={i}>
              <div className="track" ref={(el) => (trackRefs.current[i] = el)}>
                {row.images.map((img) => {
                  const isOpenThis = openImage?.key === img.key
                  return (
                    <div className="card-slot" key={img.key}>
                      {!isOpenThis && (
                        <motion.div
                          className="card"
                          layoutId={img.key}
                          onClick={isMain ? () => openCard(img, i) : undefined}
                          onMouseEnter={isMain ? () => (hoveredRowRef.current = i) : undefined}
                          onMouseLeave={
                            isMain
                              ? () => {
                                  if (hoveredRowRef.current === i) hoveredRowRef.current = null
                                }
                              : undefined
                          }
                        >
                          <div className="card-face card-front">
                            <img src={img.src} alt="" loading="eager" draggable={false} />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="glow" />

      <AnimatePresence>
        {openImage && (
          <motion.div
            className="modal-backdrop"
            onClick={closeCard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="modal-card"
              layoutId={openImage.key}
              onClick={(e) => {
                e.stopPropagation()
                setModalFlipped((f) => !f)
              }}
            >
              <motion.div
                className="modal-card-inner"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: modalFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.3, 0.1, 0.2, 1] }}
              >
                <div className="card-face card-front">
                  <img src={openImage.src} alt="" draggable={false} />
                </div>
                <div className="card-face card-back">
                  <span className="card-eyebrow">{openImage.item.date}</span>
                  <span className="card-author">{openImage.item.title}</span>
                  <span className="card-divider" />
                  <span className="card-meta">{openImage.item.description}</span>
                </div>
              </motion.div>
            </motion.div>

            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation()
                closeCard()
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
