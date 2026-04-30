import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'

const blank = {
  intern_id: '', partner_id: '',
  role_title: '', status: 'OFFERED',
  offer_date: '', join_date: '', ctc: '', notes: '',
}

const STATUS_TONE = {
  OFFERED:   'bg-amber-100 text-amber-700',
  JOINED:    'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-rose-100 text-rose-700',
  WITHDRAWN: 'bg-slate-200 text-slate-600',
}

export default function Placements() {
  const [rows, setRows] = useState([])
  const [interns, setInterns] = useState([])
  const [partners, setPartners] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(blank)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [partnerFilter, setPartnerFilter] = useState('')

  async function load() {
    try {
      const [pl, u, p] = await Promise.all([
        api.get('/placements'),
        api.get('/users?role=INTERN'),
        api.get('/partners'),
      ])
      setRows(pl.data); setInterns(u.data); setPartners(p.data); setErr('')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load')
    }
  }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    try {
      const body = { ...form }
      if (!body.offer_date) delete body.offer_date
      if (!body.join_date) delete body.join_date
      await api.post('/placements', body)
      setShowCreate(false); setForm(blank); load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Create failed')
    }
  }

  function startEdit(r) {
    setEditingId(r.id)
    setEditForm({
      role_title: r.role_title || '',
      status: r.status,
      offer_date: r.offer_date || '',
      join_date: r.join_date || '',
      ctc: r.ctc || '',
      notes: r.notes || '',
    })
  }

  async function saveEdit(id) {
    try {
      const body = { ...editForm }
      if (!body.offer_date) body.offer_date = null
      if (!body.join_date) body.join_date = null
      await api.patch(`/placements/${id}`, body)
      setEditingId(null); load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Update failed')
    }
  }

  async function remove(r) {
    if (!confirm(`Delete placement of ${r.intern_name} at ${r.partner_name}?`)) return
    try {
      await api.delete(`/placements/${r.id}`); load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed')
    }
  }

  const filtered = useMemo(() => rows.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    if (partnerFilter && r.partner_id !== partnerFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${r.intern_name || ''} ${r.intern_email || ''} ${r.partner_name || ''} ${r.role_title || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }), [rows, search, statusFilter, partnerFilter])

  const counts = {
    OFFERED: rows.filter(r => r.status === 'OFFERED').length,
    JOINED: rows.filter(r => r.status === 'JOINED').length,
    REJECTED: rows.filter(r => r.status === 'REJECTED').length,
    WITHDRAWN: rows.filter(r => r.status === 'WITHDRAWN').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-brand-900">🎯 Placements</h1>
          <p className="text-sm text-slate-600 mt-1">Track which intern is placed at which company.</p>
        </div>
        <button onClick={() => { setShowCreate(true); setForm(blank) }}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow">
          + New Placement
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total" value={rows.length} />
        <Stat label="Offered" value={counts.OFFERED} accent="amber" />
        <Stat label="Joined" value={counts.JOINED} accent="emerald" />
        <Stat label="Rejected" value={counts.REJECTED} accent="rose" />
        <Stat label="Withdrawn" value={counts.WITHDRAWN} accent="slate" />
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Search intern, company, role…"
               className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {['OFFERED','JOINED','REJECTED','WITHDRAWN'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All partners</option>
          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{err}</div>}

      {showCreate && (
        <form onSubmit={create} className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-bold text-brand-900">New placement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Intern</label>
              <select required value={form.intern_id} onChange={e => setForm({ ...form, intern_id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select intern</option>
                {interns.map(i => <option key={i.id} value={i.id}>{i.name} · {i.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Partner</label>
              <select required value={form.partner_id} onChange={e => setForm({ ...form, partner_id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select company</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Input label="Role title" value={form.role_title} onChange={v => setForm({ ...form, role_title: v })} />
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {['OFFERED','JOINED','REJECTED','WITHDRAWN'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Offer date" type="date" value={form.offer_date} onChange={v => setForm({ ...form, offer_date: v })} />
            <Input label="Join date"  type="date" value={form.join_date}  onChange={v => setForm({ ...form, join_date: v })} />
            <Input label="CTC" value={form.ctc} onChange={v => setForm({ ...form, ctc: v })} placeholder="₹6 LPA" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Notes</label>
            <textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-sm font-medium">Cancel</button>
            <button type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Intern</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Company</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Offer / Join</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">CTC</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 italic">📭 No placements yet.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{r.intern_name}</div>
                  <div className="text-xs text-slate-500">{r.intern_email}</div>
                </td>
                <td className="px-4 py-3 text-slate-800">{r.partner_name}</td>
                <td className="px-4 py-3 text-slate-700">
                  {editingId === r.id
                    ? <input value={editForm.role_title} onChange={e => setEditForm({ ...editForm, role_title: e.target.value })}
                             className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                    : (r.role_title || '—')}
                </td>
                <td className="px-4 py-3">
                  {editingId === r.id ? (
                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            className="border border-slate-300 rounded px-2 py-1 text-sm">
                      {['OFFERED','JOINED','REJECTED','WITHDRAWN'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${STATUS_TONE[r.status]}`}>{r.status}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {editingId === r.id ? (
                    <div className="flex flex-col gap-1">
                      <input type="date" value={editForm.offer_date || ''} onChange={e => setEditForm({ ...editForm, offer_date: e.target.value })}
                             className="border border-slate-300 rounded px-2 py-1" />
                      <input type="date" value={editForm.join_date || ''} onChange={e => setEditForm({ ...editForm, join_date: e.target.value })}
                             className="border border-slate-300 rounded px-2 py-1" />
                    </div>
                  ) : (
                    <>
                      <div>📝 {r.offer_date || '—'}</div>
                      <div>✈️ {r.join_date || '—'}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {editingId === r.id
                    ? <input value={editForm.ctc} onChange={e => setEditForm({ ...editForm, ctc: e.target.value })}
                             className="border border-slate-300 rounded px-2 py-1 text-sm w-24" />
                    : (r.ctc || '—')}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {editingId === r.id ? (
                    <>
                      <button onClick={() => saveEdit(r.id)} className="text-emerald-700 text-sm font-semibold hover:bg-emerald-50 px-2 py-1 rounded">✓ Save</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-600 text-sm font-semibold hover:bg-slate-100 px-2 py-1 rounded">✕ Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(r)} className="text-blue-700 text-sm font-semibold hover:bg-blue-50 px-2 py-1 rounded">✏️ Edit</button>
                      <button onClick={() => remove(r)}    className="text-red-700  text-sm font-semibold hover:bg-red-50  px-2 py-1 rounded">🗑️ Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  const tone = {
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    slate: 'text-slate-700',
  }[accent] || 'text-brand-700'
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</div>
      <div className={`text-2xl font-black mt-1 ${tone}`}>{value}</div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
             className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    </div>
  )
}
