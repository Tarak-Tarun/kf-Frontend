import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function DistrictMapping() {
  const [mappings, setMappings] = useState([])
  const [plans, setPlans] = useState([])
  const [districts, setDistricts] = useState([])
  const [form, setForm] = useState({ district: '', week_number: 1, plan_id: '' })
  const [showCreateDistrict, setShowCreateDistrict] = useState(false)
  const [newDistrictName, setNewDistrictName] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ plan_id: '' })

  async function load() {
    try {
      const [m, p, d] = await Promise.all([
        api.get('/district-plan-mapping'),
        api.get('/plans'),
        api.get('/districts'),
      ])
      setMappings(m.data)
      setPlans(p.data)
      setDistricts(d.data)
      setErr('')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load data')
    }
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    if (!form.district || !form.plan_id) {
      setErr('Please select district and learning track')
      return
    }
    try {
      await api.post('/district-plan-mapping', {
        district: form.district,
        week_number: parseInt(form.week_number),
        plan_id: form.plan_id,
      })
      setForm({ district: '', week_number: 1, plan_id: '' })
      setSuccess('Mapping created successfully!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to create mapping')
    }
  }

  async function createDistrict(e) {
    e.preventDefault()
    if (!newDistrictName.trim()) {
      setErr('District name cannot be empty')
      return
    }
    try {
      const res = await api.post('/districts', { name: newDistrictName })
      setDistricts([...districts, res.data])
      setNewDistrictName('')
      setShowCreateDistrict(false)
      setSuccess(`District "${newDistrictName}" created successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to create district')
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/district-plan-mapping/${id}`)
      setSuccess('Mapping deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to delete')
    }
  }

  async function updateMapping(id) {
    if (!editForm.plan_id) {
      setErr('Please select a learning track')
      return
    }
    try {
      await api.patch(`/district-plan-mapping/${id}`, {
        plan_id: editForm.plan_id,
      })
      setEditingId(null)
      setEditForm({ plan_id: '' })
      setSuccess('Mapping updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to update mapping')
    }
  }

  function startEdit(mapping) {
    setEditingId(mapping.id)
    setEditForm({ plan_id: mapping.plan_id })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ plan_id: '' })
  }

  function planLabel(id) {
    const p = plans.find((x) => x.id === id)
    return p ? `Week ${p.week_number} · ${p.tech_stack} · ${p.title}` : id
  }

  // filter plans for the chosen week to make selection easier
  const weekPlans = plans.filter((p) => p.week_number === parseInt(form.week_number))

  return (
    <div className="space-y-6">
      {/* Hero section with brand colors */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 text-white p-12 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <circle cx="100" cy="100" r="50" fill="white" opacity="0.8"/>
            <circle cx="300" cy="100" r="50" fill="white" opacity="0.7"/>
            <path d="M 100 150 Q 200 120 300 150" stroke="white" strokeWidth="3" fill="none" opacity="0.6"/>
            <path d="M 80 80 L 120 80 M 100 60 L 100 100" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
            <path d="M 280 80 L 320 80 M 300 60 L 300 100" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
          </svg>
        </div>
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            📍 Curriculum Customization
          </div>
          <h1 className="text-5xl font-bold mt-3 leading-tight">District Learning Paths</h1>
          <p className="text-base opacity-95 mt-3 max-w-2xl leading-relaxed">
            Tailor weekly curriculum for each district based on local capabilities and requirements. Map districts to specific learning tracks for optimized outcomes.
          </p>
        </div>
      </div>

      {/* Error and Success Messages */}
      {err && (
        <div className="card border-l-4 border-rose-400 bg-rose-50">
          <div className="text-sm text-rose-700">{err}</div>
        </div>
      )}
      {success && (
        <div className="card border-l-4 border-emerald-400 bg-emerald-50">
          <div className="text-sm text-emerald-700">✓ {success}</div>
        </div>
      )}

      <form onSubmit={create} className="card max-w-3xl space-y-5 border-2 border-brand-200 bg-gradient-to-br from-white to-blue-50">
        <div className="pb-3 border-b border-brand-100">
          <h3 className="font-bold text-lg text-slate-900">Create New Mapping</h3>
          <p className="text-sm text-slate-600 mt-1">Assign a specific learning track for a district in a particular week.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">📍 District</label>
              <button
                type="button"
                onClick={() => setShowCreateDistrict(!showCreateDistrict)}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                + New District
              </button>
            </div>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            >
              <option value="">Select district</option>
              {districts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📅 Week</label>
            <input
              type="number"
              min="1"
              max="8"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
              value={form.week_number}
              onChange={(e) => setForm({ ...form, week_number: e.target.value, plan_id: '' })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📚 Learning Track</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
              value={form.plan_id}
              onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
            >
              <option value="">Select track</option>
              {weekPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.tech_stack} · {p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Create District Modal */}
        {showCreateDistrict && (
          <div className="pt-4 border-t border-brand-100 bg-brand-50 p-4 rounded-lg">
            <h4 className="font-bold text-slate-900 mb-3">Create New District</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="District name (e.g., Visakhapatnam)"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={createDistrict}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                ✓ Create
              </button>
              <button
                type="button"
                onClick={() => { setShowCreateDistrict(false); setNewDistrictName(''); }}
                className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-3 border-t border-brand-100">
          <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-lg transition" type="submit">
            ✨ Save Mapping
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="font-bold text-lg text-slate-900 mb-4">Active Mappings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-brand-50 to-blue-50 border-b-2 border-brand-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">District</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Week</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Learning Track</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-brand-50 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                      📍 {m.district}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">Week {m.week_number}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {editingId === m.id ? (
                      <select
                        value={editForm.plan_id}
                        onChange={(e) => setEditForm({ plan_id: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent w-full"
                      >
                        <option value="">Select track</option>
                        {plans.filter(p => p.week_number === m.week_number).map((p) => (
                          <option key={p.id} value={p.id}>{p.tech_stack} · {p.title}</option>
                        ))}
                      </select>
                    ) : (
                      planLabel(m.plan_id)
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                    {editingId === m.id ? (
                      <>
                        <button
                          onClick={() => updateMapping(m.id)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1 rounded font-medium transition"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-50 px-3 py-1 rounded font-medium transition"
                        >
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(m)}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded font-medium transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => remove(m.id)}
                          className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded font-medium transition"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {mappings.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">📭 No mappings yet. Create one to get started!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
