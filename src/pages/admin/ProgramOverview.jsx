import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

const STATUS_TONE = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-200 text-slate-600',
}

export default function ProgramOverview() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')

  useEffect(() => {
    api.get('/dashboard/program-overview')
       .then(r => setData(r.data))
       .catch(e => setErr(e.response?.data?.detail || 'Failed to load overview'))
  }, [])

  if (err) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>
  if (!data) return <div className="text-slate-500 p-6">Loading program overview…</div>

  const { headline, districts, partners, tech_demand } = data
  const visibleDistricts = districtFilter
    ? districts.filter(d => d.district === districtFilter)
    : districts

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 text-white p-10 shadow-2xl">
        <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          🌊 AP-wide Program
        </div>
        <h1 className="text-4xl font-bold leading-tight">8-Week AI-Ready Internship — Live Snapshot</h1>
        <p className="opacity-95 mt-2 max-w-3xl">
          A single view of the program: which districts are running, which TLs are leading them,
          how many cohorts are live, and which companies are waiting to hire.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        <Stat label="Districts"        value={headline.total_districts} />
        <Stat label="Batches"          value={headline.total_batches} />
        <Stat label="Tech Leads"       value={headline.total_tls} />
        <Stat label="Interns"          value={headline.total_interns} />
        <Stat label="Active interns"   value={headline.active_interns} accent="emerald" />
        <Stat label="Hiring partners"  value={headline.total_partners} accent="indigo" />
        <Stat label="Open positions"   value={headline.total_openings} accent="amber" />
        <Stat label="Placed"           value={headline.total_placed ?? 0} accent="emerald" />
        <Stat label="Joined"           value={headline.total_joined ?? 0} accent="emerald" />
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-3 flex-wrap items-center">
        <span className="text-sm font-semibold text-slate-700">District:</span>
        <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All districts</option>
          {districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
        </select>
        <Link to="/admin/partners"
              className="ml-auto text-sm font-semibold text-brand-700 hover:text-brand-900">Manage partners →</Link>
        <Link to="/admin/placements"
              className="text-sm font-semibold text-brand-700 hover:text-brand-900">Manage placements →</Link>
        <Link to="/batches"
              className="text-sm font-semibold text-brand-700 hover:text-brand-900">Manage batches →</Link>
      </div>

      {/* Districts grid */}
      <section>
        <h2 className="text-lg font-bold text-brand-900 mb-3">📍 Districts running the program</h2>
        {visibleDistricts.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-slate-500">
            No districts on file yet. Add one in <Link to="/districts" className="text-brand-700 hover:underline">Districts</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleDistricts.map(d => (
              <div key={d.district} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-brand-900 text-lg">📍 {d.district}</div>
                    <div className="text-xs text-slate-500">
                      {d.active_batch_count}/{d.batch_count} batch{d.batch_count === 1 ? '' : 'es'} active
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-brand-700">{d.intern_count}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Interns</div>
                  </div>
                </div>

                {d.tech_stacks?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {d.tech_stacks.map(s => (
                      <span key={s} className="bg-brand-50 text-brand-700 text-[11px] font-semibold px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Tech Leads</div>
                  {d.tls.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No TL assigned to any batch in this district yet.</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {d.tls.map(tl => (
                        <li key={tl.id} className="flex items-center justify-between text-sm">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">👤 {tl.name}</div>
                            <div className="text-xs text-slate-500 truncate">{tl.email}</div>
                          </div>
                          <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded">
                            {tl.batches} batch{tl.batches === 1 ? '' : 'es'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tech demand */}
      <section>
        <h2 className="text-lg font-bold text-brand-900 mb-3">📈 Hiring demand by tech stack</h2>
        {tech_demand.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-slate-500">
            No partners or openings logged yet. Add hiring partners to see demand.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-5 space-y-3">
            {tech_demand.map(t => {
              const max = Math.max(...tech_demand.map(x => x.openings))
              const pct = max ? Math.round((t.openings / max) * 100) : 0
              return (
                <div key={t.tech_stack} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-semibold text-slate-700 truncate">{t.tech_stack}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm font-bold text-brand-700">{t.openings}</div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Partners */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-brand-900">🤝 Hiring partners</h2>
          <Link to="/admin/partners" className="text-sm text-brand-700 font-semibold hover:underline">Manage →</Link>
        </div>
        {partners.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-slate-500">
            No partners yet. Add some on the <Link to="/admin/partners" className="text-brand-700 hover:underline">Hiring Partners</Link> page.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Company</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Industry</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Tech stacks</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Openings</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Placement</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {p.website ? <a href={p.website} target="_blank" rel="noreferrer" className="hover:underline">{p.name}</a> : p.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.industry || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.tech_stacks || '').split(',').map(s => s.trim()).filter(Boolean).map(s => (
                          <span key={s} className="bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{p.openings ?? 0}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const placed = p.placed ?? 0
                        const total = p.openings ?? 0
                        const pct = total ? Math.min(100, Math.round((placed / total) * 100)) : 0
                        return (
                          <div className="min-w-[140px]">
                            <div className="text-xs text-slate-600 mb-1">
                              <span className="font-bold text-emerald-700">{placed}</span> placed
                              {total > 0 && <> · <span className="text-slate-500">{p.remaining ?? Math.max(0, total - placed)} open</span></>}
                            </div>
                            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            {(p.joined ?? 0) > 0 && (
                              <div className="text-[10px] text-slate-500 mt-1">{p.joined} joined</div>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${STATUS_TONE[p.hiring_status] || STATUS_TONE.CLOSED}`}>
                        {p.hiring_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{p.contact_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }) {
  const tone = {
    emerald: 'text-emerald-700',
    indigo: 'text-indigo-700',
    amber: 'text-amber-700',
  }[accent] || 'text-brand-700'
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</div>
      <div className={`text-2xl font-black mt-1 ${tone}`}>{value}</div>
    </div>
  )
}
