import { useEffect, useState, useCallback } from 'react'

import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

const EMPTY_FORM = { name: '', email: '', tech_stack: '', batch_id: '' }

export default function InternManagement() {
  const { user } = useAuth()
  const [interns, setInterns] = useState([])
  const [batches, setBatches] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter states
  const [nameFilter, setNameFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [techStackFilter, setTechStackFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [sortOption, setSortOption] = useState('name_asc')

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null)

  async function loadBatches() {
    try {
      const { data } = await api.get('/batches', { params: { limit: 500 } })
      setBatches(data)
    } catch (err) {
      console.error('Failed to load batches:', err)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        role: 'INTERN',
        limit: 500,
      }

      if (nameFilter) params.search_name = nameFilter
      if (emailFilter) params.search_email = emailFilter
      if (techStackFilter) params.tech_stack = techStackFilter
      if (batchFilter) params.batch_id = batchFilter

      // Parse sort option
      const [sortBy, sortOrder] = sortOption.split('_')
      if (sortBy) params.sort_by = sortBy
      if (sortOrder) params.sort_order = sortOrder

      const { data } = await api.get('/profiles', { params })
      setInterns(data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load intern profiles.')
    } finally {
      setLoading(false)
    }
  }, [nameFilter, emailFilter, techStackFilter, batchFilter, sortOption])

  useEffect(() => { loadBatches() }, [])

  useEffect(() => {
    // Debounce for text inputs
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      load()
    }, 300)

    setDebounceTimer(timer)

    return () => clearTimeout(timer)
  }, [nameFilter, emailFilter, techStackFilter, batchFilter, sortOption])

  async function createProfile(event) {
    event.preventDefault()
    try {
      await api.post('/profiles', {
        ...form,
        role: 'INTERN',
        batch_id: form.batch_id || null,
      })
      setForm(EMPTY_FORM)
      setError('')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create intern profile.')
    }
  }

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

  async function deleteProfile(id) {
    if (!window.confirm('Delete this intern profile?')) return
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

  function batchName(batchId) {
    return batches.find((batch) => batch.id === batchId)?.name || 'Unassigned'
  }

  // Role-based access control
  function canEditIntern(intern) {
    if (!user) return false
    
    // ADMIN can edit all interns
    if (user.role === 'ADMIN') return true
    
    // TECHNICAL_LEAD can edit only interns in their batches
    if (user.role === 'TECHNICAL_LEAD' && intern.batch_id === user.batch_id) return true
    
    // INTERN can edit only their own profile (but this page is not for interns)
    if (user.role === 'INTERN' && intern.id === user.id) return true
    
    return false
  }

  function clearFilters() {
    setNameFilter('')
    setEmailFilter('')
    setTechStackFilter('')
    setBatchFilter('')
    setSortOption('name_asc')
  }

  const hasActiveFilters = nameFilter || emailFilter || techStackFilter || batchFilter || sortOption !== 'name_asc'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Intern Profiles</h1>
        <p className="text-sm text-slate-500 mt-2">Manage intern profiles and assign them to batches.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <form onSubmit={createProfile} className="card grid md:grid-cols-5 gap-4">
        <input 
          className="input" 
          placeholder="Name" 
          value={form.name} 
          onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }} 
          required 
        />
        <input 
          className="input" 
          placeholder="Email" 
          type="email" 
          value={form.email} 
          onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }} 
          required 
        />
        <input 
          className="input" 
          placeholder="Tech stack" 
          value={form.tech_stack} 
          onChange={(e) => { setForm({ ...form, tech_stack: e.target.value }); setError(''); }} 
        />
        <select 
          className="input" 
          value={form.batch_id} 
          onChange={(e) => { setForm({ ...form, batch_id: e.target.value }); setError(''); }}
        >
          <option value="">No batch</option>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
        </select>
        <button className="btn-primary" type="submit">Create Intern</button>
      </form>

      {/* Filter Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Filter & Sort</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-sm text-brand-700 font-semibold hover:text-brand-800"
            >
              Clear All Filters
            </button>
          )}
        </div>
        
        <div className="grid md:grid-cols-5 gap-4">
          <input 
            className="input" 
            placeholder="Search by name..." 
            value={nameFilter} 
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <input 
            className="input" 
            placeholder="Search by email..." 
            value={emailFilter} 
            onChange={(e) => setEmailFilter(e.target.value)}
          />
          <input 
            className="input" 
            placeholder="Filter by tech stack..." 
            value={techStackFilter} 
            onChange={(e) => setTechStackFilter(e.target.value)}
          />
          <select 
            className="input" 
            value={batchFilter} 
            onChange={(e) => setBatchFilter(e.target.value)}
          >
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>
          <select 
            className="input" 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="email_asc">Email A-Z</option>
            <option value="email_desc">Email Z-A</option>
            <option value="tech_stack_asc">Tech Stack A-Z</option>
            <option value="tech_stack_desc">Tech Stack Z-A</option>
            <option value="batch_asc">Batch A-Z</option>
            <option value="batch_desc">Batch Z-A</option>
          </select>
        </div>
      </div>

      {/* Results Section */}
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
                      ) : item.name}
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
                          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
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
                                onClick={() => deleteProfile(item.id)}
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
                    {hasActiveFilters ? 'No interns found matching your filters.' : 'No intern profiles found.'}
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
