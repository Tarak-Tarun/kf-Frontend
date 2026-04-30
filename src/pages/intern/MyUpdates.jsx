import { useEffect, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

export default function MyUpdates() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [form, setForm] = useState({
    submitted_for: new Date().toISOString().slice(0, 10),
    content: '',
  })
  const [message, setMessage] = useState('')

  async function load() {
    const requests = [api.get('/submissions', { params: { user_id: user.id, limit: 500 } })]
    if (user.batch_id) {
      requests.unshift(api.get('/tasks', { params: { batch_id: user.batch_id, limit: 500 } }))
    } else {
      requests.unshift(Promise.resolve({ data: [] }))
    }
    const [taskList, submissionList] = await Promise.all(requests)
    setTasks(taskList.data)
    setSubmissions(submissionList.data)
  }

  useEffect(() => { if (user?.id) load() }, [user])

  async function submitUpdate(event) {
    event.preventDefault()
    try {
      await api.post('/submissions', {
        user_id: user.id,
        submitted_for: form.submitted_for,
        content: form.content,
      })
      setForm({ ...form, content: '' })
      setMessage('Update submitted successfully.')
      load()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to submit update.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">My Updates</h1>
        <p className="text-sm text-slate-500 mt-2">Submit your daily progress and review the tasks assigned to your batch.</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Assigned Tasks</h2>
        <div className="space-y-3">
          {tasks.length === 0 && <div className="text-sm text-slate-500">No tasks assigned to your batch yet.</div>}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-slate-200 p-4">
              <div className="font-semibold text-slate-900">{task.title}</div>
              <div className="text-sm text-slate-700 mt-2">{task.description || 'No description provided.'}</div>
              <div className="text-xs text-slate-400 mt-3">Due: {task.due_date || 'Not set'}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submitUpdate} className="card space-y-4">
        <h2 className="text-lg font-semibold">Submit Daily Update</h2>
        <input className="input max-w-xs" type="date" value={form.submitted_for} onChange={(e) => setForm({ ...form, submitted_for: e.target.value })} required />
        <textarea className="input" rows="5" placeholder="What did you work on today?" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        {message && <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">{message}</div>}
        <button className="btn-primary" type="submit">Submit Update</button>
      </form>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Previous Updates</h2>
        <div className="space-y-3">
          {submissions.length === 0 && <div className="text-sm text-slate-500">No updates submitted yet.</div>}
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-400">{submission.submitted_for}</div>
              <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{submission.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
