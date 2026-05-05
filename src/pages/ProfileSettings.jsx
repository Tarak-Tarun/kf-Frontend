import { useState } from 'react'
import { useAuth } from '../hooks/AuthContext'
import api from '../lib/api'
import { validateName } from '../utils/validation'

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }
    
    setError('')
    setSuccess('')
    setFieldError('')
    
    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      setFieldError(nameValidation.error)
      setError('Please fix the validation error')
      return
    }
    
    // Check if name actually changed
    if (name.trim() === user?.name) {
      setError('No changes detected')
      return
    }
    
    try {
      setLoading(true)
      await api.put(`/profiles/${user.id}`, { name: name.trim() })
      
      // Refresh user data in context
      await refreshUser()
      
      setSuccess('Profile updated successfully')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setName(user?.name || '')
    setIsEditing(false)
    setError('')
    setSuccess('')
    setFieldError('')
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 text-white p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-sm opacity-90 mt-2">
          Manage your personal information
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="card border-l-4 border-rose-400 bg-rose-50">
          <div className="text-sm text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800 ml-4">✕</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="card border-l-4 border-emerald-400 bg-emerald-50">
          <div className="text-sm text-emerald-700">{success}</div>
        </div>
      )}

      {/* Profile Information */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
          Personal Information
        </h2>
        
        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                    setFieldError('')
                  }}
                  className={`input ${fieldError ? 'border-red-500' : ''}`}
                  placeholder="Enter your name"
                  disabled={loading}
                />
                {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
              </div>
            ) : (
              <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">
                {user?.name}
              </div>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
              {user?.email}
            </div>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Role Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Role is assigned by administrators</p>
          </div>

          {/* Tech Stack (Read-only, if exists) */}
          {user?.tech_stack && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tech Stack
              </label>
              <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {user.tech_stack}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all duration-200"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 rounded-lg shadow-sm transition-all duration-200"
              >
                Edit Name
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="card border-l-4 border-blue-400 bg-blue-50">
        <h3 className="font-bold text-slate-900 mb-2">About Profile Settings</h3>
        <ul className="text-sm text-slate-700 space-y-1.5">
          <li>You can update your display name at any time</li>
          <li>Email and role cannot be changed - contact your administrator if needed</li>
          <li>Changes are reflected immediately across the system</li>
        </ul>
      </div>
    </div>
  )
}
