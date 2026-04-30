import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function MyProjects() {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('ALL')

  async function load() {
    const r = await api.get('/projects')
    setProjects(r.data)
  }
  useEffect(() => { load() }, [])

  async function remove(id) {
    if (!confirm('Delete this submission?')) return
    await api.delete(`/projects/${id}`)
    load()
  }

  const filtered = filter === 'ALL' ? projects : projects.filter((p) => p.kind === filter)

  // group by week
  const byWeek = {}
  filtered.forEach((p) => {
    if (!byWeek[p.week_number]) byWeek[p.week_number] = []
    byWeek[p.week_number].push(p)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <p className="text-sm text-slate-500 mt-1">All your work submissions across weeks.</p>
      </div>

      <div className="card">
        <div className="flex gap-2 flex-wrap">
          <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All ({projects.length})</FilterChip>
          <FilterChip active={filter === 'WEEKLY_WORK'} onClick={() => setFilter('WEEKLY_WORK')}>
            Weekly work ({projects.filter((p) => p.kind === 'WEEKLY_WORK').length})
          </FilterChip>
          <FilterChip active={filter === 'CAPSTONE'} onClick={() => setFilter('CAPSTONE')}>
            Capstone ({projects.filter((p) => p.kind === 'CAPSTONE').length})
          </FilterChip>
        </div>
      </div>

      {Object.keys(byWeek).length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">📂</div>
          <div className="font-medium text-slate-700">No projects yet</div>
          <div className="text-sm text-slate-500 mt-1">Submit your work proofs from the My Plan page.</div>
        </div>
      ) : (
        Object.entries(byWeek).sort(([a], [b]) => parseInt(b) - parseInt(a)).map(([week, items]) => (
          <div key={week} className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="badge-blue">Week {week}</span>
              <span className="text-sm text-slate-500">{items.length} submission{items.length > 1 ? 's' : ''}</span>
            </h2>
            <ul className="space-y-3">
              {items.map((p) => (
                <li key={p.id} className="border-l-4 border-emerald-300 pl-4 py-2 hover:bg-slate-50 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{p.title}</span>
                        {p.kind === 'CAPSTONE' && <span className="badge-amber">Capstone</span>}
                      </div>
                      {p.description && <div className="text-sm text-slate-600">{p.description}</div>}
                      <div className="flex gap-3 mt-2 text-xs">
                        {p.project_url && (
                          <a href={p.project_url} target="_blank" rel="noopener noreferrer"
                             className="text-brand-600 hover:underline">🔗 Project link</a>
                        )}
                        {p.file_path && (
                          <a href={`/api/projects/${p.id}/file`} target="_blank" rel="noopener noreferrer"
                             className="text-brand-600 hover:underline">📎 Download file</a>
                        )}
                        <span className="text-slate-500">{new Date(p.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => remove(p.id)} className="text-xs text-red-600 hover:underline ml-4">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
      {children}
    </button>
  )
}
