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
      <div className="splash-bg-blur" />
      <div className="splash-glow" />
      <div className="splash-content">
        <div className="splash-title-fancy">𝐕𝐈𝐁𝐄 𝐒𝐓𝐎𝐑𝐄</div>
        <div className="splash-subtitle">людкові речі під замовлення</div>
        <div className="splash-dots">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  )
}
