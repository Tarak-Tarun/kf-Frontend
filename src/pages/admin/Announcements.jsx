import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

const EMPTY_FORM = { user_id: '', title: '', message: '' }
const EMPTY_BROADCAST_FORM = { message: '' }

export default function Announcements() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [notifications, setNotifications] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [broadcastForm, setBroadcastForm] = useState(EMPTY_BROADCAST_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')

  const canManage = user?.role === 'ADMIN' || user?.role === 'TECHNICAL_LEAD'
  const isAdmin = user?.role === 'ADMIN'
  const profileMap = useMemo(() => Object.fromEntries(profiles.map((profile) => [profile.id, profile])), [profiles])

  async function load() {
    try {
      const profilePromise = canManage
        ? api.get('/profiles', { params: { limit: 500 } })
        : Promise.resolve({ data: [user] })
      
      // Build query params for notifications
      const notificationParams = { limit: 500 }
      if (!canManage && user?.id) notificationParams.user_id = user.id
      if (searchQuery) notificationParams.search = searchQuery
      if (typeFilter) notificationParams.type = typeFilter
      if (readFilter) notificationParams.is_read = readFilter === 'read'

      const notificationPromise = api.get('/notifications', { params: notificationParams })

      const [profileList, notificationList] = await Promise.all([profilePromise, notificationPromise])
      setProfiles(profileList.data || [])
      setNotifications(notificationList.data || [])
      setError('')
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError(err.response?.data?.detail || 'Failed to load notifications.')
      setNotifications([])
      setProfiles([])
    }
  }

  useEffect(() => { if (user?.id) load() }, [user, searchQuery, typeFilter, readFilter])

  async function createNotification(event) {
    event.preventDefault()
    try {
      await api.post('/notifications', form)
      setForm(EMPTY_FORM)
      setSuccess('Notification sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
      load()
      // Trigger unread count refresh
      window.dispatchEvent(new Event('notificationUpdate'))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create notification.')
    }
  }

  async function sendBroadcast(event) {
    event.preventDefault()
    if (!window.confirm('Send this notification to all users?')) return
    
    try {
      await api.post('/notifications/broadcast', { message: broadcastForm.message })
      setBroadcastForm(EMPTY_BROADCAST_FORM)
      setSuccess('Broadcast notification sent to all users!')
      setTimeout(() => setSuccess(''), 3000)
      load()
      // Trigger unread count refresh
      window.dispatchEvent(new Event('notificationUpdate'))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send broadcast notification.')
    }
  }

  async function markRead(id, isRead) {
    try {
      await api.put(`/notifications/${id}`, { is_read: isRead })
      load()
      // Trigger unread count refresh
      window.dispatchEvent(new Event('notificationUpdate'))
    } catch (err) {
      console.error('Failed to update notification:', err)
      setError(err.response?.data?.detail || 'Failed to update notification.')
    }
  }

  async function deleteNotification(id) {
    if (!canManage || !window.confirm('Delete this notification?')) return
    try {
      await api.delete(`/notifications/${id}`)
      load()
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You can only manage resources in your assigned batches.')
      } else {
        setError(err.response?.data?.detail || 'Failed to delete notification.')
      }
    }
  }

  function getTypeBadgeColor(type) {
    const colors = {
      SYSTEM: 'bg-slate-100 text-slate-700 border-slate-300',
      INFO: 'bg-blue-100 text-blue-700 border-blue-300',
      WARNING: 'bg-amber-100 text-amber-700 border-amber-300',
      SUCCESS: 'bg-green-100 text-green-700 border-green-300',
      ERROR: 'bg-rose-100 text-rose-700 border-rose-300',
    }
    return colors[type] || colors.SYSTEM
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
      {success && <div className="card border border-green-200 bg-green-50 text-green-700">{success}</div>}

      {/* 1. Send Notification Forms (TOP) */}
      {isAdmin && (
        <form onSubmit={sendBroadcast} className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900">Broadcast to All Users</h2>
          </div>
          <input
            className="input"
            placeholder="Broadcast message"
            value={broadcastForm.message}
            onChange={(e) => setBroadcastForm({ message: e.target.value })}
            required
          />
          <button className="btn-primary w-full" type="submit">
            Send to All Users
          </button>
        </form>
      )}

      {canManage && (
        <form onSubmit={createNotification} className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Send Individual Notification</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
              <option value="">Select recipient</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} ({profile.role})</option>)}
            </select>
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input className="input" placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <button className="btn-primary w-full" type="submit">Send Notification</button>
        </form>
      )}

      {/* 2. Search and Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Search & Filter Notifications</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select className="input" value={readFilter} onChange={(e) => setReadFilter(e.target.value)}>
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Notifications List (BOTTOM) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">All Notifications</h2>
        {notifications.length === 0 && <div className="card text-slate-500">No notifications found.</div>}
        {notifications.map((item) => {
          // Use is_sender from backend to determine perspective
          const isSender = item.is_sender === true
          const isReceiver = !isSender
          
          return (
            <div key={item.id} className={`card ${item.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    
                    {/* New badge - only for receiver if unread */}
                    {isReceiver && !item.is_read && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">New</span>
                    )}
                    
                    {/* Read status - only for sender */}
                    {isSender && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        item.is_read 
                          ? 'bg-green-100 text-green-700 border-green-300' 
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {item.is_read ? 'Seen' : 'Sent'}
                      </span>
                    )}
                    
                    {/* Type badge */}
                    {item.type && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getTypeBadgeColor(item.type)}`}>
                        {item.type}
                      </span>
                    )}
                    
                    {/* Broadcast badge */}
                    {item.is_broadcast && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 rounded-full">
                        Broadcast
                      </span>
                    )}
                  </div>
                  
                  {/* Sender name - only show to receiver */}
                  {isReceiver && item.sender_name && (
                    <div className="text-xs text-slate-500 mt-1">
                      From: <span className="font-medium">{item.sender_name}</span>
                    </div>
                  )}
                  
                  {/* Receiver name - only show to sender */}
                  {isSender && !item.is_broadcast && (
                    <div className="text-xs text-slate-500 mt-1">
                      To: <span className="font-medium">{profileMap[item.user_id]?.name || item.user_id}</span>
                    </div>
                  )}
                  
                  {/* Message */}
                  <div className="text-sm text-slate-700 mt-2">{item.message}</div>
                  
                  {/* Timestamp */}
                  <div className="text-xs text-slate-400 mt-3">
                    {item.is_broadcast && 'Sent to all users · '}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {/* Mark as read - only for receiver */}
                  {isReceiver && (
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
                  )}
                  
                  {/* Delete - only for managers */}
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
          )
        })}
      </div>
    </div>
  )
}
