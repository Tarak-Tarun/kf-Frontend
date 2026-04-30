import { useEffect, useMemo, useState } from 'react'

import api from '../../lib/api'

export default function AttendanceAdmin() {
  const [interns, setInterns] = useState([])
  const [selectedInternId, setSelectedInternId] = useState('')
  const [start, setStart] = useState(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/profiles', { params: { role: 'INTERN', limit: 500 } })
      .then((response) => setInterns(response.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load intern list.'))
  }, [])

  useEffect(() => {
    if (!selectedInternId) {
      setRecords([])
      return
    }
    api.get('/attendance', { params: { user_id: selectedInternId, start, end, limit: 500 } })
      .then((response) => {
        setRecords(response.data)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load attendance records.'))
  }, [selectedInternId, start, end])

  const recordMap = useMemo(() => Object.fromEntries(records.map((item) => [item.day, item])), [records])
  const days = useMemo(() => buildDateRange(start, end), [start, end])

  async function markAttendance(day, status) {
    try {
      const existing = recordMap[day]
      if (existing) {
        await api.put(`/attendance/${existing.id}`, { status })
      } else {
        await api.post('/attendance', { user_id: selectedInternId, day, status })
      }
      const { data } = await api.get('/attendance', { params: { user_id: selectedInternId, start, end, limit: 500 } })
      setRecords(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save attendance.')
    }
  }

  async function clearAttendance(day) {
    const existing = recordMap[day]
    if (!existing) return
    try {
      await api.delete(`/attendance/${existing.id}`)
      const { data } = await api.get('/attendance', { params: { user_id: selectedInternId, start, end, limit: 500 } })
      setRecords(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clear attendance.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-2">Mark present, absent, or leave for interns by day.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <div className="card grid md:grid-cols-3 gap-4">
        <select className="input" value={selectedInternId} onChange={(e) => setSelectedInternId(e.target.value)}>
          <option value="">Select intern</option>
          {interns.map((intern) => <option key={intern.id} value={intern.id}>{intern.name}</option>)}
        </select>
        <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Date</th>
              <th className="th">Current Status</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {days.map((day) => {
              const record = recordMap[day]
              return (
                <tr key={day}>
                  <td className="td">{day}</td>
                  <td className="td">{record?.status || 'Unmarked'}</td>
                  <td className="td space-x-2">
                    <button className="text-sm text-emerald-700 font-semibold" onClick={() => markAttendance(day, 'PRESENT')}>Present</button>
                    <button className="text-sm text-amber-700 font-semibold" onClick={() => markAttendance(day, 'LEAVE')}>Leave</button>
                    <button className="text-sm text-rose-700 font-semibold" onClick={() => markAttendance(day, 'ABSENT')}>Absent</button>
                    {record && <button className="text-sm text-slate-500" onClick={() => clearAttendance(day)}>Clear</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildDateRange(start, end) {
  const values = []
  const cursor = new Date(start)
  const last = new Date(end)
  while (cursor <= last) {
    values.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return values
}
