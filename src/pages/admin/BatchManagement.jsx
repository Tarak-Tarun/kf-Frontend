import { useEffect, useState } from 'react'

import api from '../../lib/api'

const EMPTY_FORM = { name: '', tech_stack: '', start_date: '', team_lead_id: '' }

export default function BatchManagement() {
  const [batches, setBatches] = useState([])
  const [tls, setTls] = useState([])
  const [form, setForm] = useState({ ...EMPTY_FORM, start_date: new Date().toISOString().slice(0, 10) })
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  async function load() {
    try {
      const [batchList, tlProfiles] = await Promise.all([
        api.get('/batches', { params: { limit: 500 } }),
        api.get('/profiles', { params: { role: 'TECHNICAL_LEAD', limit: 500 } }),
      ])
      setBatches(batchList.data)
      setTls(tlProfiles.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load batches.')
    }
  }

  useEffect(() => { load() }, [])

  async function createBatch(event) {
    event.preventDefault()
    try {
      await api.post('/batches', {
        ...form,
        team_lead_id: form.team_lead_id || null,
      })
      setForm({ ...EMPTY_FORM, start_date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create batch.')
    }
  }

  async function saveBatch(id) {
    try {
      await api.put(`/batches/${id}`, {
        ...editingForm,
        team_lead_id: editingForm.team_lead_id || null,
      })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update batch.')
    }
  }

  async function deleteBatch(id) {
    if (!window.confirm('Delete this batch?')) return
    try {
      await api.delete(`/batches/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete batch.')
    }
  }

  function tlName(id) {
    return tls.find((item) => item.id === id)?.name || 'Unassigned'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Batches</h1>
        <p className="text-sm text-slate-500 mt-2">Create batches and assign technical leads to them.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <form onSubmit={createBatch} className="card grid md:grid-cols-5 gap-4">
        <input className="input" placeholder="Batch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Tech stack" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} required />
        <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
        <select className="input" value={form.team_lead_id} onChange={(e) => setForm({ ...form, team_lead_id: e.target.value })}>
          <option value="">No technical lead</option>
          {tls.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button className="btn-primary" type="submit">Create Batch</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Tech Stack</th>
              <th className="th">Start Date</th>
              <th className="th">Technical Lead</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map((item) => (
              <tr key={item.id}>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.name} onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })} />
                  ) : item.name}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.tech_stack} onChange={(e) => setEditingForm({ ...editingForm, tech_stack: e.target.value })} />
                  ) : item.tech_stack}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" type="date" value={editingForm.start_date} onChange={(e) => setEditingForm({ ...editingForm, start_date: e.target.value })} />
                  ) : item.start_date}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <select className="input" value={editingForm.team_lead_id || ''} onChange={(e) => setEditingForm({ ...editingForm, team_lead_id: e.target.value })}>
                      <option value="">No technical lead</option>
                      {tls.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
                    </select>
                  ) : tlName(item.team_lead_id)}
                </td>
                <td className="td space-x-3">
                  {editingId === item.id ? (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => saveBatch(item.id)}>Save</button>
                      <button className="text-sm text-slate-500" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => {
                        setEditingId(item.id)
                        setEditingForm({
                          name: item.name,
                          tech_stack: item.tech_stack,
                          start_date: item.start_date,
                          team_lead_id: item.team_lead_id || '',
                        })
                      }}>Edit</button>
                      <button className="text-sm text-rose-700 font-semibold" onClick={() => deleteBatch(item.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={5}>No batches found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
