import { useEffect, useState } from 'react'
import api from '../../lib/api'

const blank = {
  name: '',
  tech_stack: '',
  description: '',
  total_weeks: 8,
  is_active: true,
}

export default function LearningTracks() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(blank)
  const [detail, setDetail] = useState(null)        // { track, weeks }
  const [search, setSearch] = useState('')
  const [stackFilter, setStackFilter] = useState('')

  async function load() {
    setLoading(true)
    setErr('')
    try {
      const r = await api.get('/tracks')
      setTracks(r.data)
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load tracks')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    setErr('')
    try {
      await api.post('/tracks', {
        ...form,
        total_weeks: parseInt(form.total_weeks, 10) || 8,
      })
      setForm(blank)
      setShowCreate(false)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Create failed')
    }
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditForm({
      name: t.name,
      tech_stack: t.tech_stack,
      description: t.description || '',
      total_weeks: t.total_weeks,
      is_active: t.is_active,
    })
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/tracks/${id}`, {
        ...editForm,
        total_weeks: parseInt(editForm.total_weeks, 10) || 8,
      })
      setEditingId(null)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Update failed')
    }
  }

  async function toggleActive(t) {
    try {
      await api.patch(`/tracks/${t.id}`, { is_active: !t.is_active })
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Toggle failed')
    }
  }

  async function remove(t) {
    if (!confirm(`Delete track "${t.name}"? Weekly plans for this stack will remain.`)) return
    try {
      await api.delete(`/tracks/${t.id}`)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed')
    }
  }

  async function openDetail(t) {
    try {
      const r = await api.get(`/tracks/${t.id}`)
      setDetail(r.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to load track detail')
    }
  }

  const stacks = Array.from(new Set(tracks.map(t => t.tech_stack))).sort()
  const filtered = tracks.filter(t => {
    if (stackFilter && t.tech_stack !== stackFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.name.toLowerCase().includes(q) && !t.tech_stack.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-brand-900">📚 Learning Tracks</h1>
          <p className="text-sm text-slate-600 mt-1">
            Curriculum tracks per tech stack. Each track groups the weekly plans interns follow.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setForm(blank) }}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow"
        >
          + New Track
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or stack…"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={stackFilter}
          onChange={e => setStackFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All tech stacks</option>
          {stacks.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{err}</div>}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={create} className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-bold text-brand-900">Create new track</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name">
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Tech stack">
              <input required value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })}
                     placeholder="e.g. Python, Java, React"
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Total weeks">
              <input type="number" min="1" max="52" value={form.total_weeks}
                     onChange={e => setForm({ ...form, total_weeks: e.target.value })}
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Active">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active}
                       onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Visible to TLs and interns
              </label>
            </Field>
          </div>
          <Field label="Description">
            <textarea rows="3" value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">Create</button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">Loading tracks…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
          No tracks yet. Click <strong>+ New Track</strong> to publish your first curriculum.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
              {editingId === t.id ? (
                <>
                  <input value={editForm.name}
                         onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold" />
                  <input value={editForm.tech_stack}
                         onChange={e => setEditForm({ ...editForm, tech_stack: e.target.value })}
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" min="1" max="52" value={editForm.total_weeks}
                         onChange={e => setEditForm({ ...editForm, total_weeks: e.target.value })}
                         className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <textarea rows="3" value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={editForm.is_active}
                           onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} />
                    Active
                  </label>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 text-sm">Cancel</button>
                    <button onClick={() => saveEdit(t.id)}
                            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">Save</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-brand-900">{t.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.tech_stack}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${
                      t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}>{t.is_active ? 'Active' : 'Hidden'}</span>
                  </div>
                  {t.description && (
                    <p className="text-sm text-slate-600 line-clamp-3">{t.description}</p>
                  )}
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>📆 {t.total_weeks} weeks</span>
                    <span>📋 {t.week_count} plans loaded</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    <button onClick={() => openDetail(t)}
                            className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">View weeks</button>
                    <button onClick={() => startEdit(t)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">Edit</button>
                    <button onClick={() => toggleActive(t)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
                      {t.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => remove(t)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
             onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-6"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-brand-900">{detail.name}</h2>
                <div className="text-sm text-slate-500">{detail.tech_stack} · {detail.total_weeks} weeks</div>
              </div>
              <button onClick={() => setDetail(null)}
                      className="text-slate-500 hover:text-slate-800 text-2xl leading-none">×</button>
            </div>
            {detail.description && <p className="text-sm text-slate-700 mb-4">{detail.description}</p>}
            {detail.weeks?.length ? (
              <ol className="space-y-3">
                {detail.weeks.map(w => (
                  <li key={w.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="font-semibold text-brand-900">Week {w.week_number} — {w.title}</div>
                    {w.description && <p className="text-sm text-slate-600 mt-1">{w.description}</p>}
                    {w.tasks?.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-sm text-slate-700 space-y-0.5">
                        {w.tasks.map(t => <li key={t.id}>{t.title}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-slate-500 italic">
                No weekly plans loaded for <strong>{detail.tech_stack}</strong> yet.
                Add them in the Weekly Plans page.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  )
}
