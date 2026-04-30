import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function BatchMapping() {
  const [mappings, setMappings] = useState([])
  const [plans, setPlans] = useState([])
  const [batches, setBatches] = useState([])
  const [form, setForm] = useState({ batch_id: '', week_number: 1, plan_id: '' })
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ plan_id: '' })

  async function load() {
    try {
      const [m, p, b] = await Promise.all([
        api.get('/batch-plan-mapping'),
        api.get('/plans'),
        api.get('/batches'),
      ])
      setMappings(m.data)
      setPlans(p.data)
      setBatches(b.data)
      setErr('')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load data')
    }
  }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    if (!form.batch_id || !form.plan_id) {
      setErr('Please select batch and learning track')
      return
    }
    try {
      await api.post('/batch-plan-mapping', {
        batch_id: form.batch_id,
        week_number: parseInt(form.week_number),
        plan_id: form.plan_id,
      })
      setForm({ batch_id: '', week_number: 1, plan_id: '' })
      setSuccess('Batch mapping saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to create mapping')
    }
  }

  async function remove(id) {
    if (!confirm('Delete this batch mapping?')) return
    try {
      await api.delete(`/batch-plan-mapping/${id}`)
      setSuccess('Mapping deleted!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to delete')
    }
  }

  async function saveEdit(id) {
    if (!editForm.plan_id) { setErr('Please choose a plan'); return }
    try {
      const m = mappings.find(x => x.id === id)
      await api.patch(`/batch-plan-mapping/${id}`, {
        batch_id: m.batch_id,
        week_number: m.week_number,
        plan_id: editForm.plan_id,
      })
      setEditingId(null)
      setEditForm({ plan_id: '' })
      setSuccess('Mapping updated!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to update')
    }
  }

  function batchLabel(id) {
    const b = batches.find(x => x.id === id)
    return b ? `${b.name} · ${b.tech_stack}` : id
  }
  function planLabel(id) {
    const p = plans.find(x => x.id === id)
    return p ? `Week ${p.week_number} · ${p.tech_stack} · ${p.title}` : id
  }

  // For new-mapping form: show only plans whose week_number == form.week_number
  const weekPlans = plans.filter(p => p.week_number === parseInt(form.week_number))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 text-white p-10 shadow-2xl">
        <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          📚 Batch-Specific Curriculum
        </div>
        <h1 className="text-4xl font-bold mt-2">Batch Learning Plans</h1>
        <p className="text-base opacity-95 mt-2 max-w-2xl">
          Override the weekly plan for a specific batch. Batch overrides take precedence over district overrides and the default tech-stack plan.
        </p>
      </div>

      {err && <div className="card border-l-4 border-rose-400 bg-rose-50 text-sm text-rose-700">{err}</div>}
      {success && <div className="card border-l-4 border-emerald-400 bg-emerald-50 text-sm text-emerald-700">✓ {success}</div>}

      <form onSubmit={create} className="card max-w-3xl space-y-5 border-2 border-brand-200 bg-gradient-to-br from-white to-blue-50">
        <div className="pb-3 border-b border-brand-100">
          <h3 className="font-bold text-lg text-slate-900">Create Batch Mapping</h3>
          <p className="text-sm text-slate-600 mt-1">Pick a batch, a week, and the plan it should follow that week.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📚 Batch</label>
            <select
              required
              value={form.batch_id}
              onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} · {b.tech_stack} · {b.district}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📅 Week</label>
            <input
              type="number" min="1" max="8" required
              value={form.week_number}
              onChange={(e) => setForm({ ...form, week_number: e.target.value, plan_id: '' })}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📋 Plan</label>
            <select
              required
              value={form.plan_id}
              onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select plan</option>
              {weekPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.tech_stack} · {p.title}</option>
              ))}
            </select>
            {weekPlans.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No plans yet for week {form.week_number}. Create one in Weekly Plans first.</p>
            )}
          </div>
        </div>
        <div className="pt-3 border-t border-brand-100">
          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-lg transition">
            ✨ Save Mapping
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="font-bold text-lg text-slate-900 mb-4">Active Batch Mappings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-brand-50 to-blue-50 border-b-2 border-brand-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Batch</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Week</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Plan</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map(m => (
                <tr key={m.id} className="hover:bg-brand-50 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                      📚 {batchLabel(m.batch_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">Week {m.week_number}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {editingId === m.id ? (
                      <select
                        value={editForm.plan_id}
                        onChange={(e) => setEditForm({ plan_id: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg w-full"
                      >
                        <option value="">Select plan</option>
                        {plans.filter(p => p.week_number === m.week_number).map(p => (
                          <option key={p.id} value={p.id}>{p.tech_stack} · {p.title}</option>
                        ))}
                      </select>
                    ) : planLabel(m.plan_id)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === m.id ? (
                      <>
                        <button onClick={() => saveEdit(m.id)} className="text-sm text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded font-medium">✓ Save</button>
                        <button onClick={() => { setEditingId(null); setEditForm({ plan_id: '' }) }} className="text-sm text-slate-600 hover:bg-slate-50 px-3 py-1 rounded font-medium">✕ Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(m.id); setEditForm({ plan_id: m.plan_id }) }} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded font-medium">✏️ Edit</button>
                        <button onClick={() => remove(m.id)} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded font-medium">🗑️ Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {mappings.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">📭 No batch mappings yet. Create one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
