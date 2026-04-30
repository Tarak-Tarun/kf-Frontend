import { useEffect, useState } from 'react'

import api from '../../lib/api'

const EMPTY_FORM = { name: '', email: '', tech_stack: '', batch_id: '' }

export default function TLManagement() {
  const [tls, setTls] = useState([])
  const [batches, setBatches] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  async function load() {
    try {
      const { data } = await api.get('/profiles', { params: { role: 'TECHNICAL_LEAD', limit: 500 } })
      setTls(data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load technical lead profiles.')
    }
  }

  async function loadBatches() {
    try {
      const { data } = await api.get('/batches', { params: { limit: 500 } })
      setBatches(data)
    } catch (err) {
      console.error('Failed to load batches:', err)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadBatches() }, [])

  async function createProfile(event) {
    event.preventDefault()
    try {
      const payload = {
        ...form,
        role: 'TECHNICAL_LEAD',
        batch_id: form.batch_id || null
      }
      await api.post('/profiles', payload)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create technical lead profile.')
    }
  }

  async function saveProfile(id) {
    try {
      await api.put(`/profiles/${id}`, editingForm)
      setEditingId(null)
      setEditingForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    }
  }

  async function deleteProfile(id) {
    if (!window.confirm('Delete this technical lead profile?')) return
    try {
      await api.delete(`/profiles/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete profile.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Technical Leads</h1>
        <p className="text-sm text-slate-500 mt-2">Create and maintain technical lead profiles in the current MVP.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <form onSubmit={createProfile} className="card grid md:grid-cols-5 gap-4">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Tech stack" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
        <select className="input" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })}>
          <option value="">Assign to batch...</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b.tech_stack})</option>
          ))}
        </select>
        <button className="btn-primary" type="submit">Create TL</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Email</th>
              <th className="th">Tech Stack</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tls.map((item) => (
              <tr key={item.id}>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.name} onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })} />
                  ) : item.name}
                </td>
                <td className="td">{item.email}</td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.tech_stack || ''} onChange={(e) => setEditingForm({ ...editingForm, tech_stack: e.target.value })} />
                  ) : (item.tech_stack || '—')}
                </td>
                <td className="td space-x-3">
                  {editingId === item.id ? (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => saveProfile(item.id)}>Save</button>
                      <button className="text-sm text-slate-500" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => {
                        setEditingId(item.id)
                        setEditingForm({ name: item.name, tech_stack: item.tech_stack || '', batch_id: item.batch_id || null })
                      }}>Edit</button>
                      <button className="text-sm text-rose-700 font-semibold" onClick={() => deleteProfile(item.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tls.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={4}>No technical lead profiles found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
