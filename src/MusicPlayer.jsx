import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import note from './data/note.json'
import './MusicPlayer.css'

const SRC = encodeURI('/audio/New Year’s Day.mp3')

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [flipped, setFlipped] = useState(true)
  // On close the shared-layout flight back into the button is skipped: `closing`
  // drops the layoutId first, then the card unmounts and just fades out.
  const [closing, setClosing] = useState(false)
  const layoutId = closing ? undefined : 'note-card'

  const openNote = () => {
    setFlipped(true) // the open transition doubles as the flip to the message
    setClosing(false)
    setNoteOpen(true)
  }

  const closeNote = () => setClosing(true)

  useEffect(() => {
    if (closing) setNoteOpen(false)
  }, [closing])

  useEffect(() => {
    if (!noteOpen) return
    const onKey = (e) => e.key === 'Escape' && closeNote()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [noteOpen])

  // Autoplay from the top on load. Browsers block unmuted autoplay until the
  // user interacts with the page, so if that's refused we start the track
  // muted (always allowed) and unmute it on the first real interaction.
  useEffect(() => {
    const audio = audioRef.current
    audio.currentTime = 0
    const events = ['pointerdown', 'keydown', 'touchstart']
    const removeFallback = () =>
      events.forEach((e) => window.removeEventListener(e, onInteract))
    function onInteract(ev) {
      removeFallback()
      // the play button handles its own click
      if (ev.target.closest?.('.play-btn')) {
        audio.muted = false
        return
      }
      audio.muted = false
      if (audio.paused) audio.play().catch(() => {})
    }
    audio.muted = false
    audio.play().catch(() => {
      audio.muted = true
      audio.play().catch(() => {})
      events.forEach((e) => window.addEventListener(e, onInteract))
    })
    return removeFallback
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="music-bar">
        {!noteOpen && (
        <motion.button
          className="music-btn note-btn"
          layoutId={layoutId}
          onClick={openNote}
          aria-label="Open birthday note"
          title="Open note"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </motion.button>
        )}
        <button className="music-btn play-btn" onClick={toggle}>
          <span className="play-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              {playing ? (
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              ) : (
                <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
              )}
            </svg>
          </span>
          New Year&rsquo;s Day
        </button>
      </div>

      <AnimatePresence>
        {noteOpen && (
          <motion.div
            className="modal-backdrop note-backdrop"
            onClick={closeNote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="modal-card"
              layoutId={layoutId}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation()
                setFlipped((f) => !f)
              }}
            >
              <motion.div
                className="modal-card-inner"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.3, 0.1, 0.2, 1] }}
              >
                <div className="card-face note-front">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>
                <div className="card-face card-back note-back">
                  <span className="card-author">{note.title}</span>
                  <span className="card-divider" />
                  <div className="card-meta note-text">
                    {note.message.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation()
                closeNote()
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
