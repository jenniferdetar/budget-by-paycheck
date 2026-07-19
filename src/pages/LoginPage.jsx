import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        setInfo('Account created! Check your email to confirm, then sign in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">$</span>
          Budget by Paycheck
        </div>
        <p className="auth-subtitle">
          Track income, bills, expenses, savings, and debt for every pay period.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'sign-in' ? 'active' : ''}
            onClick={() => setMode('sign-in')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'sign-up' ? 'active' : ''}
            onClick={() => setMode('sign-up')}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <div className="auth-message error">{error}</div>}
          {info && <div className="auth-message info">{info}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
