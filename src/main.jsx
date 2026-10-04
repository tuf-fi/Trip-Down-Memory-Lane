import React from 'react'
import ReactDOM from 'react-dom/client'
import MarqueeWall from './MarqueeWall.jsx'
import MusicPlayer from './MusicPlayer.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MarqueeWall />
    <MusicPlayer />
  </React.StrictMode>
)
