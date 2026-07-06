import { useState, useRef, useEffect } from 'react'

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const handleProgressClick = (e) => {
    const audio = audioRef.current
    if (!audio || !progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    audio.currentTime = percent * duration
  }

  const formatTime = (t) => {
    const min = Math.floor(t / 60)
    const sec = Math.floor(t % 60)
    return `${min}:${sec.toString().padStart(2, "0")}`
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="player-controls">
        <button className="play-pause-btn" onClick={togglePlay}>
          {playing ? "⏸" : "▶"}
        </button>
        <div className="progress-container" ref={progressRef} onClick={handleProgressClick}>
          <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
