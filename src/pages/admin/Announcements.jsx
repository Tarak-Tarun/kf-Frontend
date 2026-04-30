import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

const EMPTY_FORM = { user_id: '', title: '', message: '' }

export default function Announcements() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [notifications, setNotifications] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const canManage = user?.role === 'ADMIN' || user?.role === 'TECHNICAL_LEAD'
  const profileMap = useMemo(() => Object.fromEntries(profiles.map((profile) => [profile.id, profile])), [profiles])

  async function load() {
    try {
      const profilePromise = canManage
        ? api.get('/profiles', { params: { limit: 500 } })
        : Promise.resolve({ data: [user] })
      const notificationPromise = canManage
        ? api.get('/notifications', { params: { limit: 500 } })
        : api.get('/notifications', { params: { user_id: user.id, limit: 500 } })

      const [profileList, notificationList] = await Promise.all([profilePromise, notificationPromise])
      setProfiles(profileList.data)
      setNotifications(notificationList.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load notifications.')
    }
  }

  useEffect(() => { if (user?.id) load() }, [user])

  async function createNotification(event) {
    event.preventDefault()
    try {
      await api.post('/notifications', form)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create notification.')
    }
  }

  async function markRead(id, isRead) {
    try {
      await api.put(`/notifications/${id}`, { is_read: isRead })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update notification.')
    }
  }

  async function deleteNotification(id) {
    if (!canManage || !window.confirm('Delete this notification?')) return
    try {
      await api.delete(`/notifications/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete notification.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-2">
          {canManage ? 'Send direct notifications to platform users.' : 'Track your notifications and mark them as read.'}
        </p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      {canManage && (
        <form onSubmit={createNotification} className="card grid md:grid-cols-4 gap-4">
          <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
            <option value="">Select recipient</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} ({profile.role})</option>)}
          </select>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="input md:col-span-2" placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          <button className="btn-primary md:col-span-4" type="submit">Send Notification</button>
        </form>
      )}

      <div className="space-y-3">
        {notifications.length === 0 && <div className="card text-slate-500">No notifications found.</div>}
        {notifications.map((item) => (
          <div key={item.id} className={`card ${item.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  {!item.is_read && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">New</span>
                  )}
                </div>
                <div className="text-sm text-slate-700 mt-2">{item.message}</div>
                <div className="text-xs text-slate-400 mt-3">
                  Recipient: {profileMap[item.user_id]?.name || item.user_id} · {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors flex items-center gap-2 justify-center min-w-[140px]"
                  onClick={() => markRead(item.id, !item.is_read)}
                >
                  {item.is_read ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Mark as Unread
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark as Read
                    </>
                  )}
                </button>
                {canManage && (
                  <button 
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 justify-center min-w-[120px]"
                    onClick={() => deleteNotification(item.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
