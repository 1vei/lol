'use client'

import { useState, useEffect } from 'react'

export default function TimeDisplay() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      setTime(formatted)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="time-display">
      <span className="time">{time}</span>

      <style jsx>{`
        .time-display {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .time {
          font-size: 64px;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -3px;
        }

        @media (max-width: 768px) {
          .time {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  )
}
