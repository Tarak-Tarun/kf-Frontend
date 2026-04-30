// src/pages/LoginPage.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'
import { validateEmail, validatePassword } from '../utils/validation'
import api from '../lib/api'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' or 'change-password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    setError('')
    setFieldErrors({})
    setBusy(true)
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      setFieldErrors({ email: emailValidation.error })
      setError(emailValidation.error)
      setBusy(false)
      return
    }
    
    // Validate password
    if (!password || password.length === 0) {
      setFieldErrors({ password: 'Password is required' })
      setError('Password is required')
      setBusy(false)
      return
    }

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

  const handleChangePassword = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')
    setFieldErrors({})
    setBusy(true)

    // Validate all fields
    const errors = {}

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.error
    }

    if (!oldPassword) {
      errors.oldPassword = 'Current password is required'
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else {
      const passwordValidation = validatePassword(newPassword, 'New password')
      if (!passwordValidation.valid) {
        errors.newPassword = passwordValidation.error
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (oldPassword && newPassword && oldPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('⚠️ Please fix the validation errors above')
      setBusy(false)
      return
    }

    try {
      await api.post('/auth/change-password', {
        email: email.trim().toLowerCase(),
        old_password: oldPassword,
        new_password: newPassword
      })

      setSuccess('Password changed successfully! You can now login with your new password.')
      
      // Clear form and switch back to login after 2 seconds
      setTimeout(() => {
        setEmail('')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess('')
        setMode('login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
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
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
                setSuccess('')
                setFieldErrors({})
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('change-password')
                setError('')
                setSuccess('')
                setFieldErrors({})
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'change-password'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Change Password
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <>
              <h1 className="text-xl font-semibold mb-1">
                Sign in
              </h1>

              <p className="text-sm text-slate-500 mb-5">
                Use your assigned email and password.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                      setFieldErrors({ ...fieldErrors, email: null })
                    }}
                    className={`input ${fieldErrors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                      setFieldErrors({ ...fieldErrors, password: null })
                    }}
                    className={`input ${fieldErrors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                </div>

                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </>
          )}

          {/* Change Password Form */}
          {mode === 'change-password' && (
            <>
              <h1 className="text-xl font-semibold mb-1">
                Change Password
              </h1>

              <p className="text-sm text-slate-500 mb-5">
                Update your password securely. Works for all users including admins.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                      setSuccess('')
                      setFieldErrors({ ...fieldErrors, email: null })
                    }}
                    className={`input ${fieldErrors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value)
                      setError('')
                      setSuccess('')
                      setFieldErrors({ ...fieldErrors, oldPassword: null })
                    }}
                    className={`input ${fieldErrors.oldPassword ? 'border-red-500' : ''}`}
                    placeholder="Enter current password"
                  />
                  {fieldErrors.oldPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.oldPassword}</p>}
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setError('')
                      setSuccess('')
                      setFieldErrors({ ...fieldErrors, newPassword: null })
                    }}
                    className={`input ${fieldErrors.newPassword ? 'border-red-500' : ''}`}
                    placeholder="Enter new password"
                  />
                  {fieldErrors.newPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.newPassword}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    Min 8 chars, uppercase, lowercase, number, special character
                  </p>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError('')
                      setSuccess('')
                      setFieldErrors({ ...fieldErrors, confirmPassword: null })
                    }}
                    className={`input ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm new password"
                  />
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
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

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {busy ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          {mode === 'login' 
            ? 'Accounts are created by Admin or Technical Leads only.'
            : 'After changing password, use the new password to sign in.'}
        </p>
      </div>
    </div>
  )
}

export default LoginPage