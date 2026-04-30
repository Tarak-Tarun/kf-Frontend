// src/pages/ChangePasswordPage.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

const ChangePasswordPage = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain an uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain a lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain a digit'
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};:,.<>?]/.test(password)) {
      return 'Password must contain a special character (!@#$%^&*...)'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Check all fields are filled
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match')
      return
    }

    // Validate password strength
    const strengthError = validatePassword(newPassword)
    if (strengthError) {
      setError(strengthError)
      return
    }

    // Check old password is different from new
    if (oldPassword === newPassword) {
      setError('New password must be different from old password')
      return
    }

    setBusy(true)

    try {
      await api.post('/auth/change-password', {
        email: email.trim().toLowerCase(),
        old_password: oldPassword,
        new_password: newPassword
      })

      setSuccess('Password changed successfully')

      // Clear form
      setEmail('')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to change password'
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
            Change Password
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold mb-1">
            Update Password
          </h1>

          <p className="text-sm text-slate-500 mb-5">
            Enter your current password and create a new one.
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
                Current Password
              </label>

              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) =>
                  setOldPassword(e.target.value)
                }
                className="input"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="label">
                New Password
              </label>

              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                className="input"
                placeholder="New strong password"
              />

              <div className="text-xs text-slate-500 mt-1">
                Min 8 chars, uppercase, lowercase, digit, special char
              </div>
            </div>

            <div>
              <label className="label">
                Confirm New Password
              </label>

              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="input"
                placeholder="Re-enter new password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy
                ? 'Changing password...'
                : 'Change Password'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          Password must meet security requirements.
        </p>
      </div>
    </div>
  )
}

export default ChangePasswordPage
