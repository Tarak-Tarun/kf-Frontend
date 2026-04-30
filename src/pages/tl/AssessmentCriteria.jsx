import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

const blank = { name: '', description: '', max_points: 1, order_index: 0 }

export default function AssessmentCriteria() {
  const { user } = useAuth()
  const [stacks, setStacks] = useState([])
  const [selectedStack, setSelectedStack] = useState('')
  const [criteria, setCriteria] = useState([])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(blank)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // Derive available stacks from the tech_stack column of the TL's interns (all statuses)
  useEffect(() => {
    api.get('/users', { params: { role: 'INTERN' } }).then((r) => {
      const unique = [...new Set(r.data.map((i) => i.tech_stack).filter(Boolean))]
      setStacks(unique)
      if (unique.length > 0) setSelectedStack(unique[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedStack) return
    loadCriteria()
  }, [selectedStack])

  async function loadCriteria() {
    const r = await api.get('/assessment-criteria', { params: { tech_stack: selectedStack } })
    setCriteria(r.data)
  }

  async function create(e) {
    e.preventDefault()
    setErr('')
    try {
      await api.post('/assessment-criteria', {
        ...form,
        tech_stack: selectedStack,
        max_points: parseFloat(form.max_points),
        order_index: parseInt(form.order_index),
      })
      setForm(blank)
      setMsg('Criterion added.')
      loadCriteria()
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed')
    }
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/assessment-criteria/${id}`, {
        name: editForm.name,
        description: editForm.description,
        max_points: parseFloat(editForm.max_points),
        order_index: parseInt(editForm.order_index),
      })
      setEditingId(null)
      loadCriteria()
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Failed')
    }
  }

  async function remove(id) {
    if (!confirm('Delete this criterion? Existing evaluation scores for it will also be removed.')) return
    await api.delete(`/assessment-criteria/${id}`)
    loadCriteria()
  }

  const totalMax = criteria.reduce((s, c) => s + c.max_points, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assessment Criteria</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define evaluation rubrics per tech stack. Interns in that stack will be scored against these criteria.
        </p>
      </div>

      {/* Stack selector */}
      <div className="flex items-center gap-3">
        <label className="label !mb-0 shrink-0">Tech Stack</label>
        <select
          className="input max-w-xs"
          value={selectedStack}
          onChange={(e) => setSelectedStack(e.target.value)}
        >
          {stacks.map((s) => <option key={s} value={s}>{s}</option>)}
          {stacks.length === 0 && <option value="">No interns found</option>}
        </select>
      </div>

      {selectedStack && (
        <>
          {/* Criteria list */}
          <div className="card max-w-3xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Criteria for {selectedStack}</h2>
              {criteria.length > 0 && (
                <span className="text-xs text-slate-500">
                  Total max points: <strong>{totalMax}</strong> → normalised to 4 pts in final score
                </span>
              )}
            </div>

            {criteria.length === 0 && (
              <p className="text-sm text-slate-500">No criteria yet. Add one below.</p>
            )}

            <ul className="space-y-2">
              {criteria.map((c) => (
                <li key={c.id} className="border border-slate-200 rounded-lg p-3">
                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="input col-span-2"
                          placeholder="Criterion name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <input
                          type="number" min="0.1" step="0.1"
                          className="input"
                          placeholder="Max pts"
                          value={editForm.max_points}
                          onChange={(e) => setEditForm({ ...editForm, max_points: e.target.value })}
                        />
                      </div>
                      <textarea
                        className="input text-sm"
                        rows="2"
                        placeholder="Description (optional)"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(c.id)} className="btn-primary text-sm py-1 px-3">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost text-sm py-1 px-3">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{c.name}</span>
                          <span className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded px-1.5 py-0.5">
                            {c.max_points} pts
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                        )}
                      </div>
                      <div className="flex gap-3 shrink-0 text-sm">
                        <button
                          onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, description: c.description || '', max_points: c.max_points, order_index: c.order_index }) }}
                          className="text-brand-600 hover:underline"
                        >Edit</button>
                        <button onClick={() => remove(c.id)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Add new criterion */}
          <form onSubmit={create} className="card max-w-3xl space-y-3">
            <h2 className="font-semibold">Add criterion</h2>
            <div className="grid grid-cols-3 gap-3">
              <input
                className="input col-span-2"
                placeholder="e.g. Code Quality"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="number" min="0.1" step="0.1"
                className="input"
                placeholder="Max points"
                required
                value={form.max_points}
                onChange={(e) => setForm({ ...form, max_points: e.target.value })}
              />
            </div>
            <textarea
              className="input text-sm"
              rows="2"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary">Add criterion</button>
              {msg && <span className="text-sm text-green-700">{msg}</span>}
              {err && <span className="text-sm text-red-700">{err}</span>}
            </div>
            <p className="text-xs text-slate-400">
              Scores across all criteria are normalised to the 0–4 TL score range automatically.
            </p>
          </form>
        </>
      )}
    </div>
  )
}
