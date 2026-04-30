import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function BatchDetails() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const [batch, setBatch] = useState(null)
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  async function load() {
    try {
      setLoading(true)
      // Fetch batch details
      const batchRes = await api.get('/batches')
      const batch = batchRes.data.find(x => x.id === batchId)
      setBatch(batch)

      // Fetch interns for this batch - real data from API
      try {
        const internsRes = await api.get(`/batches/${batchId}/interns`)
        setInterns(internsRes.data || [])
      } catch (e) {
        // Fallback: get all users and filter by batch
        const usersRes = await api.get('/users', { params: { role: 'INTERN' } })
        const batchInterns = usersRes.data?.filter(u => u.batch_id === batchId) || []
        setInterns(batchInterns)
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [batchId])

  if (loading) return <div className="text-slate-500">Loading…</div>
  if (err) return <div className="text-red-600">{err}</div>
  if (!batch) return <div className="text-slate-500">Batch not found</div>

  // Build tech stack distribution dynamically from real intern data
  const techStacks = {}
  interns.forEach(i => {
    const stack = i.tech_stack || 'Unassigned'
    techStacks[stack] = (techStacks[stack] || 0) + 1
  })

  const totalInterns = interns.length

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/batches')}
        className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold transition"
      >
        ← Back to Batches
      </button>

      {/* Batch Header */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-12 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <circle cx="80" cy="40" r="50" fill="white" opacity="0.8"/>
            <circle cx="320" cy="160" r="70" fill="white" opacity="0.6"/>
          </svg>
        </div>
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            📊 Batch Details
          </div>
          <h1 className="text-5xl font-bold mt-3 leading-tight">{batch.name}</h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold">
              📍 {batch.district}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold">
              📅 Started {batch.start_date}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold">
              ⏱️ Week {batch.current_week}/{batch.duration_weeks}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon="👥" label="Total Interns" value={totalInterns} accent="from-blue-500 to-blue-700" />
        <KpiCard icon="💻" label={batch.tech_stack || 'Multi-Stack'} value="Active" accent="from-brand-500 to-brand-700" />
        <KpiCard icon="📊" label="Tracks Assigned" value={Object.keys(techStacks).length} accent="from-emerald-500 to-emerald-700" />
        <KpiCard icon="✅" label="Active" value={batch.duration_weeks > 0 ? 'Yes' : 'No'} accent="from-purple-500 to-purple-700" />
      </div>

      {/* Tech Stack Distribution */}
      <div className="card">
        <h2 className="font-bold text-2xl text-slate-900 mb-6">📚 Tech Stack Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stack Distribution Chart */}
          <div className="space-y-4">
            {Object.entries(techStacks).map(([stack, count]) => {
              const percentage = (count / totalInterns) * 100
              return (
                <div key={stack}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-800">{stack}</span>
                    <span className="text-sm font-bold text-brand-600">{count} interns ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stack Cards */}
          <div className="space-y-3">
            {Object.entries(techStacks).map(([stack, count]) => (
              <div
                key={stack}
                className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white to-slate-50 shadow-md border border-slate-200 p-4 hover:shadow-lg transition"
              >
                <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10`}
                     style={{ background: `linear-gradient(135deg, rgb(22, 186, 173), rgb(10, 143, 145))` }} />
                <div className="relative z-10">
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                  <div className="text-sm text-slate-600 font-medium">{stack}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {Math.round((count / totalInterns) * 100)}% of cohort
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Info Table */}
      <div className="card">
        <h2 className="font-bold text-lg text-slate-900 mb-4">📋 Batch Information</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-brand-50 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50">Batch Name</td>
                <td className="px-6 py-4 text-slate-700">{batch.name}</td>
              </tr>
              <tr className="hover:bg-brand-50 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50">District</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                    📍 {batch.district}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-brand-50 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50">Current Batch Status</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Week {batch.current_week}/{batch.duration_weeks}</span>
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
                        style={{ width: `${(batch.current_week / batch.duration_weeks) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {Math.round((batch.current_week / batch.duration_weeks) * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-brand-50 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50">Start Date</td>
                <td className="px-6 py-4 text-slate-700">{batch.start_date}</td>
              </tr>
              <tr className="hover:bg-brand-50 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50">Duration</td>
                <td className="px-6 py-4 text-slate-700">{batch.duration_weeks} weeks</td>
              </tr>
              <tr className="hover:bg-brand-50 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50">Total Interns</td>
                <td className="px-6 py-4">
                  <span className="text-xl font-bold text-slate-900">{totalInterns}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tech Stack Curriculum */}
      <div className="card">
        <h2 className="font-bold text-lg text-slate-900 mb-4">🎓 Learning Tracks Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(techStacks).map((track) => (
            <div
              key={track}
              className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white to-slate-50 shadow-md border-2 border-brand-200 p-5 hover:shadow-lg transition"
            >
              <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 opacity-10" />
              <div className="relative z-10">
                <div className="text-2xl mb-2">💻</div>
                <div className="font-bold text-slate-900">{track}</div>
                <div className="text-xs text-slate-600 mt-2">
                  {techStacks[track]} intern{techStacks[track] !== 1 ? 's' : ''} assigned
                </div>
                <div className="mt-3 pt-3 border-t border-brand-200">
                  <div className="text-xs font-semibold text-brand-600">View Curriculum →</div>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(techStacks).length === 0 && (
            <p className="text-sm text-slate-500 col-span-3">No interns assigned to this batch yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, accent }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-md border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-5`} />
      <div className="relative z-10">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-xs uppercase tracking-wide text-slate-500 font-bold">{label}</div>
        <div className="text-4xl font-bold text-slate-900 mt-2">{value}</div>
      </div>
    </div>
  )
}
