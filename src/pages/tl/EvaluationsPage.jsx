import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

const EMPTY_FORM = { intern_id: '', week_number: 1, score: 0, feedback: '' }

export default function EvaluationsPage() {
  const { user } = useAuth()
  const [interns, setInterns] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [internFilter, setInternFilter] = useState('')
  
  // CSV download states
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [selectedInterns, setSelectedInterns] = useState([])
  const [selectedWeeks, setSelectedWeeks] = useState([])

  const internMap = useMemo(() => Object.fromEntries(interns.map((intern) => [intern.id, intern])), [interns])

  // Filter evaluations based on search and filters
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const internName = internMap[item.intern_id]?.name || ''
      const matchesSearch = !searchQuery || 
        internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.feedback && item.feedback.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesWeek = !weekFilter || item.week_number === Number(weekFilter)
      const matchesIntern = !internFilter || item.intern_id === internFilter
      return matchesSearch && matchesWeek && matchesIntern
    })
  }, [evaluations, searchQuery, weekFilter, internFilter, internMap])

  async function load() {
    if (!user?.id) return
    
    try {
      const [profiles, batches, evaluationList] = await Promise.all([
        api.get('/profiles', { params: { role: 'INTERN', limit: 500 } }),
        // Backend now filters batches for Tech Lead automatically
        user?.role === 'TECHNICAL_LEAD'
          ? api.get('/batches', { params: { limit: 500 } })
          : Promise.resolve({ data: [] }),
        api.get('/evaluations', {
          params: user?.role === 'TECHNICAL_LEAD' ? { reviewed_by: user.id, limit: 500 } : { limit: 500 },
        }),
      ])

      if (user?.role === 'TECHNICAL_LEAD') {
        const allowedBatchIds = new Set((batches.data || []).map((batch) => batch.id))
        setInterns((profiles.data || []).filter((intern) => allowedBatchIds.has(intern.batch_id)))
      } else {
        setInterns(profiles.data || [])
      }
      setEvaluations(evaluationList.data || [])
      setError('')
    } catch (err) {
      console.error('Failed to load evaluations:', err)
      setError(err.response?.data?.detail || 'Failed to load evaluations.')
      setInterns([])
      setEvaluations([])
    }
  }

  useEffect(() => { load() }, [user])

  async function createEvaluation(event) {
    event.preventDefault()
    if (!user?.id) {
      setError('User not authenticated.')
      return
    }
    
    try {
      await api.post('/evaluations', {
        ...form,
        week_number: Number(form.week_number),
        score: Number(form.score),
        reviewed_by: user.id,
      })
      setForm(EMPTY_FORM)
      setError('')
      load()
    } catch (err) {
      console.error('Failed to create evaluation:', err)
      setError(err.response?.data?.detail || 'Failed to create evaluation.')
    }
  }

  async function deleteEvaluation(evaluationId, internName, weekNumber) {
    if (!window.confirm(`Delete evaluation for ${internName} (Week ${weekNumber})?\n\nThis action cannot be undone.`)) {
      return
    }
    
    try {
      await api.delete(`/evaluations/${evaluationId}`)
      setError('')
      load()
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You can only manage resources in your assigned batches.')
      } else {
        setError(err.response?.data?.detail || 'Failed to delete evaluation.')
      }
    }
  }

  async function downloadCSV() {
    if (filteredEvaluations.length === 0) {
      setError('No evaluations to download. Please adjust your filters.')
      return
    }
    
    setDownloadLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      
      // Add filters
      if (selectedInterns.length > 0) {
        params.append('intern_ids', selectedInterns.join(','))
      }
      if (selectedWeeks.length > 0) {
        params.append('week_numbers', selectedWeeks.join(','))
      }
      
      // If Tech Lead, backend will filter by their batches automatically
      if (user?.role === 'TECHNICAL_LEAD') {
        params.append('reviewed_by', user.id)
      }
      
      console.log('Downloading CSV with params:', params.toString())
      
      const response = await api.get(`/evaluations/export?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `evaluations_${timestamp}.csv`)
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('CSV download successful')
    } catch (err) {
      console.error('Failed to download CSV:', err)
      if (err.response?.status === 404) {
        setError('No evaluations found matching your filters.')
      } else {
        setError(err.response?.data?.detail || 'Failed to download CSV file.')
      }
    } finally {
      setDownloadLoading(false)
    }
  }

  // Get unique weeks from evaluations
  const availableWeeks = useMemo(() => {
    const weeks = new Set(evaluations.map(e => e.week_number))
    return Array.from(weeks).sort((a, b) => a - b)
  }, [evaluations])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Evaluations</h1>
        <p className="text-sm text-slate-500 mt-2">Record weekly scores and written feedback for interns.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      {/* 1. Record New Evaluation Form (TOP) */}
      <form onSubmit={createEvaluation} className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Record New Evaluation</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Intern *
            </label>
            <select 
              className="input" 
              value={form.intern_id} 
              onChange={(e) => setForm({ ...form, intern_id: e.target.value })} 
              required
            >
              <option value="">Choose an intern...</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>{intern.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Week Number *
            </label>
            <input 
              className="input" 
              type="number" 
              min="1" 
              max="52"
              placeholder="e.g., 1, 2, 3..."
              value={form.week_number} 
              onChange={(e) => setForm({ ...form, week_number: e.target.value })} 
              required 
            />
            <p className="text-xs text-slate-500 mt-1">Enter week 1-52</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Score (0-5) *
            </label>
            <input 
              className="input" 
              type="number" 
              min="0" 
              max="5" 
              step="0.1" 
              placeholder="e.g., 4.5"
              value={form.score} 
              onChange={(e) => setForm({ ...form, score: e.target.value })} 
              required 
            />
            <p className="text-xs text-slate-500 mt-1">0.0 to 5.0 scale</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Feedback (Optional)
          </label>
          <textarea 
            className="input min-h-[80px] resize-y" 
            placeholder="Write your feedback for the intern's performance this week..."
            value={form.feedback} 
            onChange={(e) => setForm({ ...form, feedback: e.target.value })}
            rows={3}
          />
        </div>
        
        <button className="btn-primary w-full" type="submit">
          Save Evaluation
        </button>
      </form>

      {/* 2. Search and Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Search & Filter Evaluations</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search by intern name or feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Intern</label>
            <select className="input" value={internFilter} onChange={(e) => setInternFilter(e.target.value)}>
              <option value="">All Interns</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>{intern.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Week</label>
            <input
              type="number"
              className="input"
              placeholder="Week number..."
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              min="1"
              max="52"
            />
          </div>
        </div>
      </div>

      {/* CSV Download Section */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Export Evaluations (CSV)</h2>
          <p className="text-sm text-slate-500 mt-1">Download filtered evaluations as a CSV file</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Interns (Optional)</label>
            <select 
              multiple 
              className="input min-h-[100px]" 
              value={selectedInterns}
              onChange={(e) => setSelectedInterns(Array.from(e.target.selectedOptions, option => option.value))}
            >
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>{intern.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Weeks (Optional)</label>
            <select 
              multiple 
              className="input min-h-[100px]" 
              value={selectedWeeks}
              onChange={(e) => setSelectedWeeks(Array.from(e.target.selectedOptions, option => option.value))}
            >
              {availableWeeks.map((week) => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={downloadCSV}
              disabled={downloadLoading || filteredEvaluations.length === 0}
              className="btn-primary w-full disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {downloadLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">💡 Tip:</span> Leave filters empty to download all evaluations. 
            The CSV will include: Intern Name, Week Number, Score, Feedback, and Date.
          </p>
        </div>
      </div>

      {/* 3. Evaluations Table (BOTTOM) */}
      <div className="card overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Evaluations</h2>
        <table className="table">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Intern</th>
              <th className="th">Week</th>
              <th className="th">Score</th>
              <th className="th">Feedback</th>
              {user?.role === 'ADMIN' && <th className="th">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvaluations.map((item) => (
              <tr key={item.id}>
                <td className="td">{internMap[item.intern_id]?.name || item.intern_id}</td>
                <td className="td">{item.week_number}</td>
                <td className="td font-semibold">{item.score}</td>
                <td className="td">{item.feedback || '—'}</td>
                {user?.role === 'ADMIN' && (
                  <td className="td">
                    <button
                      onClick={() => deleteEvaluation(item.id, internMap[item.intern_id]?.name || 'Unknown', item.week_number)}
                      className="px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-all duration-200"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filteredEvaluations.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={user?.role === 'ADMIN' ? 5 : 4}>No evaluations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
