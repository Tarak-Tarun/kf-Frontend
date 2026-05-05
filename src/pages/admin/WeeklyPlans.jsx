import { useEffect, useState } from 'react'

import api from '../../lib/api'

const EMPTY_FORM = { title: '', description: '', batch_id: '', due_date: '' }

export default function WeeklyPlans() {
  const [tasks, setTasks] = useState([])
  const [batches, setBatches] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  async function load() {
    try {
      const [taskList, batchList] = await Promise.all([
        api.get('/tasks', { params: { batch_id: selectedBatch || undefined, limit: 500 } }),
        api.get('/batches', { params: { limit: 500 } }),
      ])
      setTasks(taskList.data)
      setBatches(batchList.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tasks.')
    }
  }

  useEffect(() => { load() }, [selectedBatch])

  async function createTask(event) {
    event.preventDefault()
    try {
      await api.post('/tasks', { ...form, batch_id: form.batch_id })
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.')
    }
  }

  async function saveTask(id) {
    try {
      await api.put(`/tasks/${id}`, editingForm)
      setEditingId(null)
      setError('')
      load()
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You can only manage resources in your assigned batches.')
      } else {
        setError(err.response?.data?.detail || 'Failed to update task.')
      }
    }
  }

  async function deleteTask(id) {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      setError('')
      load()
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You can only manage resources in your assigned batches.')
      } else {
        setError(err.response?.data?.detail || 'Failed to delete task.')
      }
    }
  }

  function batchName(batchId) {
    return batches.find((batch) => batch.id === batchId)?.name || 'Unknown batch'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500 mt-2">Manage batch-level tasks that interns work on.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <div className="card grid md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-3">
          <label className="label">Filter by batch</label>
          <select className="input" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="">All batches</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={createTask} className="card grid md:grid-cols-5 gap-4">
        <input className="input" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="input" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} required>
          <option value="">Select batch</option>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
        </select>
        <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        <button className="btn-primary" type="submit">Create Task</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Title</th>
              <th className="th">Description</th>
              <th className="th">Batch</th>
              <th className="th">Due Date</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((item) => (
              <tr key={item.id}>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.title} onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })} />
                  ) : item.title}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.description || ''} onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })} />
                  ) : (item.description || '—')}
                </td>
                <td className="td">{batchName(item.batch_id)}</td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" type="date" value={editingForm.due_date || ''} onChange={(e) => setEditingForm({ ...editingForm, due_date: e.target.value })} />
                  ) : (item.due_date || '—')}
                </td>
                <td className="td space-x-3">
                  {editingId === item.id ? (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => saveTask(item.id)}>Save</button>
                      <button className="text-sm text-slate-500" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => {
                        setEditingId(item.id)
                        setEditingForm({
                          title: item.title,
                          description: item.description || '',
                          due_date: item.due_date || '',
                        })
                      }}>Edit</button>
                      <button className="text-sm text-rose-700 font-semibold" onClick={() => deleteTask(item.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={5}>No tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
