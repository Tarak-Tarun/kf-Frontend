import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function PlacementReport() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/dashboard/placement').then((r) => setRows(r.data))
  }, [])

  const filtered = filter === 'ALL' ? rows : rows.filter((r) => r.status === filter)
  const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Placement Readiness</h1>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Ready" count={counts.READY || 0} active={filter === 'READY'}
                     onClick={() => setFilter(filter === 'READY' ? 'ALL' : 'READY')} tone="green" />
        <SummaryCard label="Borderline" count={counts.BORDERLINE || 0} active={filter === 'BORDERLINE'}
                     onClick={() => setFilter(filter === 'BORDERLINE' ? 'ALL' : 'BORDERLINE')} tone="amber" />
        <SummaryCard label="Not Ready" count={counts.NOT_READY || 0} active={filter === 'NOT_READY'}
                     onClick={() => setFilter(filter === 'NOT_READY' ? 'ALL' : 'NOT_READY')} tone="red" />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Intern</th>
                <th className="th">Avg Score</th>
                <th className="th">Consistency</th>
                <th className="th">Attendance</th>
                <th className="th">Tasks</th>
                <th className="th">Final</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.intern_id}>
                  <td className="td font-medium">{r.name}</td>
                  <td className="td">{r.avg_weekly_score}</td>
                  <td className="td">{r.consistency.toFixed(1)}%</td>
                  <td className="td">{r.attendance.toFixed(1)}%</td>
                  <td className="td">{r.task_completion.toFixed(1)}%</td>
                  <td className="td font-semibold">{r.final_score}</td>
                  <td className="td"><StatusBadge s={r.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="td text-center text-slate-500">No data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, count, onClick, active, tone }) {
  const styles = {
    green: 'border-green-300 bg-green-50',
    amber: 'border-amber-300 bg-amber-50',
    red:   'border-red-300 bg-red-50',
  }
  return (
    <button onClick={onClick}
            className={`text-left rounded-lg border-2 p-4 transition ${styles[tone]} ${active ? 'ring-2 ring-brand-500' : ''}`}>
      <div className="text-xs uppercase font-medium text-slate-700">{label}</div>
      <div className="text-3xl font-bold mt-1">{count}</div>
    </button>
  )
}

function StatusBadge({ s }) {
  const map = { READY: 'badge-green', BORDERLINE: 'badge-amber', NOT_READY: 'badge-red' }
  return <span className={map[s]}>{s.replace('_', ' ')}</span>
}
