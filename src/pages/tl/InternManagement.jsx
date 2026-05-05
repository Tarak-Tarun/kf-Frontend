import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

const EMPTY_FORM = { name: '', email: '', tech_stack: '', batch_id: '' }

export default function InternManagement() {
  const { user } = useAuth()
  const [interns, setInterns] = useState([])
  const [batches, setBatches] = useState([])
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  async function load() {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const params = {
        role: 'INTERN',
        limit: 500,
      }

      if (searchQuery) params.search = searchQuery
      if (batchFilter) params.batch_id = batchFilter
      if (sortBy) params.sort_by = sortBy
      if (sortOrder) params.order = sortOrder

      const [batchList, profiles] = await Promise.all([
        api.get('/batches', { params: { limit: 500 } }),
        api.get('/profiles', { params }),
      ])
      
      setBatches(batchList.data || [])
      
      // Filter to only show interns in Tech Lead's batches
      const allowedBatchIds = new Set(batchList.data.map((batch) => batch.id))
      setInterns(profiles.data.filter((intern) => allowedBatchIds.has(intern.batch_id)))
      setError('')
    } catch (err) {
      console.error('Failed to load interns:', err)
      setError(err.response?.data?.detail || 'Failed to load assigned interns.')
      setInterns([])
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user, searchQuery, batchFilter, sortBy, sortOrder])

  async function saveProfile(id) {
    try {
      await api.put(`/profiles/${id}`, {
        ...editingForm,
        batch_id: editingForm.batch_id || null,
      })
      setEditingId(null)
      setEditingForm(EMPTY_FORM)
      setError('')
      load()
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You can only edit interns in your assigned batches.')
      } else {
        setError(err.response?.data?.detail || 'Failed to update intern profile.')
      }
    }
  }

  async function deleteProfile(id, internName) {
    if (!window.confirm(`Delete intern profile for ${internName}?\n\nThis action cannot be undone.`)) return
    
    try {
      await api.delete(`/profiles/${id}`)
      setError('')
      load()
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You can only delete interns in your assigned batches.')
      } else {
        setError(err.response?.data?.detail || 'Failed to delete intern profile.')
      }
    }
  }

  // Role-based access control
  function canEditIntern(intern) {
    if (!user) return false
    
    // ADMIN can edit all interns
    if (user.role === 'ADMIN') return true
    
    // TECHNICAL_LEAD can edit only interns in their batches
    if (user.role === 'TECHNICAL_LEAD' && intern.batch_id === user.batch_id) return true
    
    return false
  }

  const batchMap = useMemo(() => Object.fromEntries(batches.map((batch) => [batch.id, batch])), [batches])

  function batchName(batchId) {
    return batchMap[batchId]?.name || 'Unassigned'
  }

  function clearFilters() {
    setSearchQuery('')
    setBatchFilter('')
    setSortBy('name')
    setSortOrder('asc')
  }

  const hasActiveFilters = searchQuery || batchFilter || sortBy !== 'name' || sortOrder !== 'asc'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Assigned Interns</h1>
        <p className="text-sm text-slate-500 mt-2">Manage intern profiles across the batches currently assigned to you.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      {/* Search and Filters Section */}
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
              placeholder="Search interns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
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
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
            <select 
              className="input" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="tech_stack">Tech Stack</option>
              <option value="created_at">Created Date</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
            <select 
              className="input" 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interns Table */}
      <div className="card overflow-x-auto">
        {loading && (
          <div className="text-center py-8 text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <p className="mt-2">Loading interns...</p>
          </div>
        )}
        
        {!loading && (
          <table className="table">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Tech Stack</th>
                <th className="th">Batch</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interns.map((item) => {
                const canEdit = canEditIntern(item)
                
                return (
                  <tr key={item.id}>
                    <td className="td">
                      {editingId === item.id ? (
                        <input 
                          className="input" 
                          value={editingForm.name} 
                          onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })} 
                        />
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </td>
                    <td className="td">
                      {editingId === item.id ? (
                        <input 
                          className="input" 
                          type="email" 
                          value={editingForm.email} 
                          onChange={(e) => setEditingForm({ ...editingForm, email: e.target.value })} 
                        />
                      ) : item.email}
                    </td>
                    <td className="td">
                      {editingId === item.id ? (
                        <input 
                          className="input" 
                          value={editingForm.tech_stack || ''} 
                          onChange={(e) => setEditingForm({ ...editingForm, tech_stack: e.target.value })} 
                        />
                      ) : (item.tech_stack || '—')}
                    </td>
                    <td className="td">
                      {editingId === item.id ? (
                        <select 
                          className="input" 
                          value={editingForm.batch_id || ''} 
                          onChange={(e) => setEditingForm({ ...editingForm, batch_id: e.target.value })}
                        >
                          <option value="">No batch</option>
                          {batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>{batch.name}</option>
                          ))}
                        </select>
                      ) : batchName(item.batch_id)}
                    </td>
                    <td className="td space-x-3">
                      {editingId === item.id ? (
                        <>
                          <button 
                            className="text-sm text-brand-700 font-semibold" 
                            onClick={() => saveProfile(item.id)}
                          >
                            Save
                          </button>
                          <button 
                            className="text-sm text-slate-500" 
                            onClick={() => {
                              setEditingId(null)
                              setEditingForm(EMPTY_FORM)
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {canEdit ? (
                            <>
                              <button 
                                className="text-sm text-brand-700 font-semibold" 
                                onClick={() => {
                                  setEditingId(item.id)
                                  setEditingForm({
                                    name: item.name,
                                    email: item.email,
                                    tech_stack: item.tech_stack || '',
                                    batch_id: item.batch_id || '',
                                  })
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="text-sm text-rose-700 font-semibold" 
                                onClick={() => deleteProfile(item.id, item.name)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400 italic">No access</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
              {interns.length === 0 && (
                <tr>
                  <td className="td text-slate-500 text-center" colSpan={5}>
                    {hasActiveFilters ? 'No interns found matching your filters.' : 'No interns are assigned to your batches.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
