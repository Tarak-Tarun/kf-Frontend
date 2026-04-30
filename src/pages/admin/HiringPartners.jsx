import { useEffect, useState } from 'react'
import api from '../../lib/api'

const blank = {
  name: '', industry: '', website: '',
  contact_name: '', contact_email: '', contact_phone: '',
  tech_stacks: '', openings: 0, hiring_status: 'ACTIVE',
  mou_signed_on: '', notes: '', is_active: true,
}

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-200 text-slate-600',
}

export default function HiringPartners() {
  const [partners, setPartners] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(blank)
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    try {
      const r = await api.get('/partners')
      setPartners(r.data)
      setErr('')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load partners')
    }
  }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    try {
      const body = { ...form, openings: parseInt(form.openings, 10) || 0 }
      if (!body.mou_signed_on) delete body.mou_signed_on
      await api.post('/partners', body)
      setForm(blank); setShowCreate(false); load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Create failed')
    }
  }

  function startEdit(p) {
    setEditingId(p.id)
    setEditForm({
      ...blank, ...p,
      mou_signed_on: p.mou_signed_on || '',
      openings: p.openings ?? 0,
    })
  }

  async function saveEdit(id) {
    try {
      const body = { ...editForm, openings: parseInt(editForm.openings, 10) || 0 }
      if (!body.mou_signed_on) body.mou_signed_on = null
      await api.patch(`/partners/${id}`, body)
      setEditingId(null); load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Update failed')
    }
  }

  async function remove(p) {
    if (!confirm(`Remove partner "${p.name}"?`)) return
    try {
      await api.delete(`/partners/${p.id}`); load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed')
    }
  }

  const filtered = partners.filter(p => {
    if (statusFilter && p.hiring_status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${p.name} ${p.industry || ''} ${p.tech_stacks || ''} ${p.contact_name || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const totalOpenings = filtered.reduce((s, p) => s + (p.openings || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-brand-900">🤝 Hiring Partners</h1>
          <p className="text-sm text-slate-600 mt-1">
            Companies and startups tied up with the program. Track openings and tech-stack demand.
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); setForm(blank) }}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow">
          + New Partner
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Partners" value={filtered.length} accent="brand" />
        <Stat label="Total openings" value={totalOpenings} accent="emerald" />
        <Stat label="Actively hiring" value={filtered.filter(p => p.hiring_status === 'ACTIVE').length} accent="indigo" />
        <Stat label="Paused" value={filtered.filter(p => p.hiring_status === 'PAUSED').length} accent="amber" />
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Search name, industry, stack, contact…"
               className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{err}</div>}

      {showCreate && <PartnerForm form={form} setForm={setForm} onSubmit={create} onCancel={() => setShowCreate(false)} title="Add partner" />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500 col-span-full">
            No partners yet. Click <strong>+ New Partner</strong> to add one.
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
            {editingId === p.id ? (
              <PartnerForm form={editForm} setForm={setEditForm}
                           onSubmit={(e) => { e.preventDefault(); saveEdit(p.id) }}
                           onCancel={() => setEditingId(null)}
                           title="Edit partner" compact />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-brand-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{p.industry || '—'}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${STATUS_STYLE[p.hiring_status] || STATUS_STYLE.CLOSED}`}>
                    {p.hiring_status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(p.tech_stacks || '').split(',').map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} className="bg-brand-50 text-brand-700 font-semibold px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
                <div className="text-sm text-slate-700">
                  <strong className="text-emerald-700">{p.openings ?? 0}</strong> openings
                </div>
                {(p.contact_name || p.contact_email || p.contact_phone) && (
                  <div className="text-xs text-slate-600">
                    {p.contact_name && <div>👤 {p.contact_name}</div>}
                    {p.contact_email && <div>✉️ {p.contact_email}</div>}
                    {p.contact_phone && <div>📞 {p.contact_phone}</div>}
                  </div>
                )}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noreferrer"
                     className="text-xs text-brand-700 hover:underline truncate">{p.website}</a>
                )}
                {p.notes && <p className="text-xs text-slate-500 line-clamp-2">{p.notes}</p>}
                <div className="flex gap-2 mt-1">
                  <button onClick={() => startEdit(p)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">Edit</button>
                  <button onClick={() => remove(p)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100">Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  const tone = {
    brand: 'text-brand-700',
    emerald: 'text-emerald-700',
    indigo: 'text-indigo-700',
    amber: 'text-amber-700',
  }[accent] || 'text-slate-700'
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">{label}</div>
      <div className={`text-2xl font-black mt-1 ${tone}`}>{value}</div>
    </div>
  )
}

function PartnerForm({ form, setForm, onSubmit, onCancel, title, compact }) {
  return (
    <form onSubmit={onSubmit} className={`bg-white ${compact ? '' : 'rounded-xl shadow p-5'} space-y-3`}>
      {!compact && <h2 className="font-bold text-brand-900">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Company name" required value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <Input label="Industry" value={form.industry || ''} onChange={v => setForm({ ...form, industry: v })} />
        <Input label="Website" value={form.website || ''} onChange={v => setForm({ ...form, website: v })} placeholder="https://" />
        <Input label="Tech stacks (CSV)" value={form.tech_stacks || ''} onChange={v => setForm({ ...form, tech_stacks: v })} placeholder="Python,React,Java" />
        <Input label="Contact name" value={form.contact_name || ''} onChange={v => setForm({ ...form, contact_name: v })} />
        <Input label="Contact email" value={form.contact_email || ''} onChange={v => setForm({ ...form, contact_email: v })} />
        <Input label="Contact phone" value={form.contact_phone || ''} onChange={v => setForm({ ...form, contact_phone: v })} />
        <Input label="Openings" type="number" value={form.openings ?? 0} onChange={v => setForm({ ...form, openings: v })} />
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Hiring status</label>
          <select value={form.hiring_status} onChange={e => setForm({ ...form, hiring_status: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <Input label="MOU signed on" type="date" value={form.mou_signed_on || ''} onChange={v => setForm({ ...form, mou_signed_on: v })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Notes</label>
        <textarea rows="2" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-medium">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">Save</button>
      </div>
    </form>
  )
}

function Input({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} required={required} value={value} placeholder={placeholder}
             onChange={e => onChange(e.target.value)}
             className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    </div>
  )
}
