import React from 'react'
import ReactDOM from 'react-dom/client'
import MarqueeWall from './MarqueeWall.jsx'
import MusicPlayer from './MusicPlayer.jsx'
import BirthdayLoader from './BirthdayLoader.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BirthdayLoader>
      <MarqueeWall />
      <MusicPlayer />
    </BirthdayLoader>
  </React.StrictMode>
)
