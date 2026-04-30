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
          <div key={item.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-700 mt-2">{item.message}</div>
                <div className="text-xs text-slate-400 mt-3">
                  Recipient: {profileMap[item.user_id]?.name || item.user_id} · {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="text-sm text-brand-700 font-semibold" onClick={() => markRead(item.id, !item.is_read)}>
                  {item.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
                {canManage && (
                  <button className="text-sm text-rose-700 font-semibold" onClick={() => deleteNotification(item.id)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
