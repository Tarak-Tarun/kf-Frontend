import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

export default function InternArchive() {
  const [interns, setInterns] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('')

  const [selected, setSelected] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const [u, b] = await Promise.all([
        api.get('/profiles', { params: { role: 'INTERN', is_active: false } }),
        api.get('/batches'),
      ])
      setInterns(u.data || [])
      setBatches(b.data || [])
      setErr('')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load archive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function flash(msg) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3500)
  }

  const batchById = useMemo(() => {
    const m = {}
    batches.forEach(b => { m[b.id] = b })
    return m
  }, [batches])

  const filtered = useMemo(() => {
    return interns.filter(i => {
      if (batchFilter && i.batch_id !== batchFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!i.name?.toLowerCase().includes(q) && !i.email?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [interns, batchFilter, search])

  const allFilteredIds = useMemo(() => filtered.map(i => i.id), [filtered])
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id))
  const someSelected = !allSelected && allFilteredIds.some(id => selected.has(id))

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id))
      } else {
        allFilteredIds.forEach(id => next.add(id))
      }
      return next
    })
  }
  function clearSelection() { setSelected(new Set()); setConfirmDelete(false) }

  async function bulkRestore() {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (!confirm(`Restore ${ids.length} intern(s)? They will be reactivated.`)) return
    try {
      setBusy(true)
      const res = await api.post('/users/bulk-reactivate', { user_ids: ids })
      flash(`✓ Restored ${res.data.count} intern(s)`)
      clearSelection()
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Restore failed')
    } finally { setBusy(false) }
  }

  async function bulkDelete() {
    const ids = Array.from(selected)
    if (!ids.length) return
    try {
      setBusy(true)
      const res = await api.post('/users/bulk-delete', { user_ids: ids })
      flash(`✓ Permanently deleted ${res.data.count} intern(s)`)
      clearSelection()
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Delete failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect x="40" y="40" width="100" height="120" fill="white" rx="8"/>
            <rect x="260" y="60" width="100" height="100" fill="white" rx="8"/>
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-bold">🗄️ Intern Archive</h2>
            <p className="text-sm opacity-90 mt-2">
              Deactivated interns. You can restore them or permanently delete them.
            </p>
          </div>
          <Link
            to="/admin/interns"
            className="bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold px-5 py-3 rounded-lg transition flex items-center gap-2"
          >
            ← Back to Active Interns
          </Link>
        </div>
      </div>

      {/* Messages */}
      {err && (
        <div className="card border-l-4 border-rose-400 bg-rose-50">
          <div className="text-sm text-rose-700 flex items-center justify-between">
            <span>{err}</span>
            <button onClick={() => setErr('')} className="text-rose-600 hover:text-rose-800 ml-4">✕</button>
          </div>
        </div>
      )}
      {success && (
        <div className="card border-l-4 border-emerald-400 bg-emerald-50">
          <div className="text-sm text-emerald-700">{success}</div>
        </div>
      )}

      {/* Filter row */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name or email…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Batch</label>
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.district}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-200">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-700">
            {selected.size > 0
              ? <>✓ <span className="text-rose-700 font-bold">{selected.size}</span> selected</>
              : <>Select archived interns to restore or delete</>}
          </div>
          {selected.size > 0 && (
            <button onClick={clearSelection} className="text-xs text-slate-600 hover:text-slate-900 underline">
              clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!selected.size || busy}
            onClick={bulkRestore}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg transition"
          >
            ↩️ Restore ({selected.size})
          </button>
          {!confirmDelete ? (
            <button
              disabled={!selected.size || busy}
              onClick={() => setConfirmDelete(true)}
              className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg transition"
            >
              🗑️ Delete Permanently ({selected.size})
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white border-2 border-rose-300 rounded-lg px-3 py-1.5">
              <span className="text-sm font-semibold text-rose-700">
                Delete {selected.size} permanently? This cannot be undone.
              </span>
              <button
                disabled={busy}
                onClick={async () => { await bulkDelete() }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded text-sm transition"
              >
                Yes, Delete
              </button>
              <button
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1 rounded text-sm transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Tech Stack</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Batch</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="text-4xl mb-2">🗄️</div>
                    <div className="font-semibold text-slate-700">Archive is empty</div>
                    <div className="text-sm mt-1">Deactivated interns will appear here.</div>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(i => {
                const isSel = selected.has(i.id)
                const batch = batchById[i.batch_id]
                return (
                  <tr key={i.id} className={`transition ${isSel ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleOne(i.id)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{i.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{i.email}</td>
                    <td className="px-4 py-3">
                      {i.tech_stack && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {i.tech_stack}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {batch ? `${batch.name} — ${batch.district}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        Deactivated
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helper */}
      <div className="card border-l-4 border-amber-400 bg-amber-50">
        <h3 className="font-bold text-slate-900 mb-2">⚠️ About the Archive</h3>
        <ul className="text-sm text-slate-700 space-y-1.5">
          <li>✓ Deactivated interns cannot login but their data is preserved</li>
          <li>✓ <span className="font-semibold">Restore</span> brings them back to Active Interns</li>
          <li className="text-rose-700">⚠ <span className="font-semibold">Permanent Delete</span> removes the user record from the database — this cannot be undone</li>
        </ul>
      </div>
    </div>
  )
}
