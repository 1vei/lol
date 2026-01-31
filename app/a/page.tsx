'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('isAdmin') === 'true') {
      router.push('/')
    }
  }, [router])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)

    if (value === '808980') {
      setLoading(true)

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: value }),
        })

        if (res.ok) {
          localStorage.setItem('isAdmin', 'true')
          router.push('/')
        } else {
          setPassword('')
        }
      } catch (error) {
        setPassword('')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(var(--spacing) * 2)',
      background: 'var(--bg-primary)',
    }}>
      <input
        className="input"
        type="password"
        inputMode="numeric"
        value={password}
        onChange={handleChange}
        disabled={loading}
        autoFocus
        style={{
          maxWidth: '300px',
          textAlign: 'center',
          fontSize: '32px',
          letterSpacing: '8px',
          padding: 'calc(var(--spacing) * 3)',
        }}
      />
    </div>
  )
}
