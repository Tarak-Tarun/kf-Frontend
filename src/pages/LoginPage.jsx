// src/pages/LoginPage.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setBusy(true)

    try {
      const data = await login(
        email.trim().toLowerCase(),
        password
      )

      if (data.must_change_password) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Login failed'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-slate-900">
            Knowledge Factory
          </div>

          <div className="text-sm text-slate-500 mt-1">
            Internship Management Platform
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold mb-1">
            Sign in
          </h1>

          <p className="text-sm text-slate-500 mb-5">
            Use your assigned email and password.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="label">
                Email
              </label>

              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="input"
                placeholder="you@org.com"
              />
            </div>

            <div>
              <label className="label">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            Contact administrator if you need password reset.
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          Accounts are created by Admin or Technical Leads only.
        </p>
      </div>
    </div>
  )
}

export default LoginPage