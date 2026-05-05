import { useEffect, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

export default function AttendanceAdmin() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const isAdmin = user?.role === 'ADMIN'
  const isTechLead = user?.role === 'TECHNICAL_LEAD'

  async function load() {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const params = {
        limit: 500,
      }
      
      if (searchQuery) params.search = searchQuery
      if (batchFilter) params.batch_id = batchFilter
      if (dateFilter) params.date = dateFilter
      if (statusFilter) params.status = statusFilter
      
      const [attendanceList, batchList] = await Promise.all([
        api.get('/attendance', { params }),
        // Backend filters batches for Tech Lead automatically
        api.get('/batches', { params: { limit: 500 } }),
      ])
      
      setAttendance(attendanceList.data || [])
      setBatches(batchList.data || [])
      setError('')
    } catch (err) {
      console.error('Failed to load attendance:', err)
      setError(err.response?.data?.detail || 'Failed to load attendance records.')
      setAttendance([])
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user, searchQuery, batchFilter, dateFilter, statusFilter])

  function clearFilters() {
    setSearchQuery('')
    setBatchFilter('')
    setDateFilter('')
    setStatusFilter('')
  }

  const hasActiveFilters = searchQuery || batchFilter || dateFilter || statusFilter

  function getStatusBadge(status) {
    const styles = {
      present: 'bg-green-100 text-green-700 border-green-300',
      absent: 'bg-rose-100 text-rose-700 border-rose-300',
      late: 'bg-amber-100 text-amber-700 border-amber-300',
    }
    return styles[status?.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-300'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-2">
          {isAdmin ? 'View attendance records for all interns.' : 'View attendance records for interns in your batches.'}
        </p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Search & Filter</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-sm text-brand-700 font-semibold hover:text-brand-800"
            >
              Clear All Filters
            </button>
          )}
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search by intern name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Batch</label>
              <select 
                className="input" 
                value={batchFilter} 
                onChange={(e) => setBatchFilter(e.target.value)}
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Date</label>
            <input
              type="date"
              className="input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Status</label>
            <select 
              className="input" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-x-auto">
        {loading && (
          <div className="text-center py-8 text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="mt-2">Loading attendance records...</p>
          </div>
        )}
        
        {!loading && (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Attendance Records</h2>
            <table className="table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Intern Name</th>
                  <th className="th">Batch</th>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                  {isAdmin && <th className="th">Notes</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="td font-medium">{record.intern_name || 'Unknown'}</td>
                    <td className="td">{record.batch_name || 'Unassigned'}</td>
                    <td className="td">{record.date || '—'}</td>
                    <td className="td">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(record.status)}`}>
                        {record.status || 'Unknown'}
                      </span>
                    </td>
                    {isAdmin && <td className="td text-sm text-slate-600">{record.notes || '—'}</td>}
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td className="td text-slate-500 text-center" colSpan={isAdmin ? 5 : 4}>
                      {hasActiveFilters ? 'No attendance records found matching your filters.' : 'No attendance records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
