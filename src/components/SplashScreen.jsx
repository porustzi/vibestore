import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2200)
    const t2 = setTimeout(() => onDone(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`}>
      <img src="/hero-bg-CtGpMX4r.jpg" alt="VIBE STORE" className="splash-logo" />
      <div className="splash-text">VIBE STORE</div>
    </div>
  )
}
