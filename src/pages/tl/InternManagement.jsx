import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

export default function InternManagement() {
  const { user } = useAuth()
  const [interns, setInterns] = useState([])
  const [batches, setBatches] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Backend now filters batches for Tech Lead automatically
        const [batchList, profiles] = await Promise.all([
          api.get('/batches', { params: { limit: 500 } }),
          api.get('/profiles', { params: { role: 'INTERN', limit: 500 } }),
        ])
        setBatches(batchList.data)
        const allowedBatchIds = new Set(batchList.data.map((batch) => batch.id))
        setInterns(profiles.data.filter((intern) => allowedBatchIds.has(intern.batch_id)))
        setError('')
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load assigned interns.')
      }
    }

    if (user?.id) load()
  }, [user])

  const batchMap = useMemo(() => Object.fromEntries(batches.map((batch) => [batch.id, batch])), [batches])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Assigned Interns</h1>
        <p className="text-sm text-slate-500 mt-2">Intern profiles across the batches currently assigned to you.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Email</th>
              <th className="th">Tech Stack</th>
              <th className="th">Batch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {interns.map((item) => (
              <tr key={item.id}>
                <td className="td font-medium">{item.name}</td>
                <td className="td">{item.email}</td>
                <td className="td">{item.tech_stack || '—'}</td>
                <td className="td">{batchMap[item.batch_id]?.name || 'Unassigned'}</td>
              </tr>
            ))}
            {interns.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={4}>No interns are assigned to your batches.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
