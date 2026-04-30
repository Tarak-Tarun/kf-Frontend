import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function DistrictAdmin() {
  const [districtsList, setDistrictsList] = useState([])
  const [batches, setBatches] = useState([])
  const [districtMap, setDistrictMap] = useState({})
  const [showAddDistrict, setShowAddDistrict] = useState(false)
  const [newDistrictName, setNewDistrictName] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name, batchCount, force }

  async function load() {
    try {
      // Get districts from API
      const d = await api.get('/districts')
      setDistrictsList(d.data)

      // Get batches
      const b = await api.get('/batches')
      setBatches(b.data)

      // Map districts to batch counts
      const map = {}
      b.data.forEach(batch => {
        map[batch.district] = (map[batch.district] || 0) + 1
      })
      setDistrictMap(map)
      setErr('')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to load data')
    }
  }

  useEffect(() => { load() }, [])

  async function addDistrict(e) {
    e.preventDefault()
    if (!newDistrictName.trim()) {
      setErr('District name cannot be empty')
      return
    }

    try {
      await api.post('/districts', { name: newDistrictName })
      setNewDistrictName('')
      setShowAddDistrict(false)
      setSuccess(`District "${newDistrictName}" created successfully!`)
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to create district')
    }
  }

  async function deleteDistrict(districtId, districtName, force = false) {
    try {
      await api.delete(`/districts/${districtId}${force ? '?force=true' : ''}`)
      setDeleteConfirm(null)
      setSuccess(`District "${districtName}" deleted successfully!`)
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (e) {
      const detail = e.response?.data?.detail || ''
      if (!force && detail.includes('force=true')) {
        setDeleteConfirm((prev) => ({ ...prev, force: true, detail }))
      } else {
        setErr(detail || 'Failed to delete district')
        setDeleteConfirm(null)
      }
    }
  }

  const activeDistricts = Object.keys(districtMap)

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <circle cx="80" cy="60" r="40" fill="white"/>
            <circle cx="320" cy="140" r="50" fill="white"/>
            <path d="M 100 150 Q 200 120 300 150" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold">📍 District Management</h2>
          <p className="text-sm opacity-90 mt-2">Manage internship districts in Andhra Pradesh</p>
        </div>
      </div>

      {/* Error and Success Messages */}
      {err && (
        <div className="card border-l-4 border-rose-400 bg-rose-50">
          <div className="text-sm text-rose-700">{err}</div>
        </div>
      )}
      {success && (
        <div className="card border-l-4 border-emerald-400 bg-emerald-50">
          <div className="text-sm text-emerald-700">✓ {success}</div>
        </div>
      )}

      {/* Add New District Form */}
      {showAddDistrict && (
        <form onSubmit={addDistrict} className="card max-w-2xl space-y-4 border-2 border-brand-200 bg-gradient-to-br from-white to-blue-50">
          <div className="pb-3 border-b border-brand-100">
            <h3 className="font-bold text-lg text-slate-900">Add New District</h3>
            <p className="text-sm text-slate-600 mt-1">Create a new district for managing internship programs</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">District Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g., Visakhapatnam"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-brand-100">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ✓ Create District
            </button>
            <button
              type="button"
              onClick={() => { setShowAddDistrict(false); setNewDistrictName(''); }}
              className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showAddDistrict && (
        <button
          onClick={() => setShowAddDistrict(true)}
          className="mb-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ➕ Add New District
        </button>
      )}

      {/* Districts Grid - REAL data from DB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {districtsList.map((district) => {
          const batchCount = districtMap[district.name] || 0
          const isActive = batchCount > 0

          return (
            <div
              key={district.id}
              className={`relative overflow-hidden rounded-xl shadow-md border-2 transition ${
                isActive
                  ? 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-300 hover:shadow-lg'
                  : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
              }`}
            >
              <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10`}
                   style={{ background: isActive ? 'linear-gradient(135deg, rgb(22, 186, 173), rgb(10, 143, 145))' : 'gray' }} />

              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-4xl mb-2">📍</div>
                    <h3 className={`text-2xl font-bold ${isActive ? 'text-brand-900' : 'text-slate-700'}`}>
                      {district.name}
                    </h3>
                    <p className={`text-xs mt-1 font-medium ${isActive ? 'text-brand-700' : 'text-slate-600'}`}>
                      {isActive ? 'Active' : 'Ready to activate'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {batchCount}
                  </div>
                </div>

                <div className={`pt-4 border-t ${isActive ? 'border-brand-200' : 'border-slate-300'}`}>
                  {isActive ? (
                    <div className={`text-xs font-semibold ${isActive ? 'text-brand-700' : 'text-slate-600'}`}>
                      ✓ {batchCount} active batch{batchCount !== 1 ? 'es' : ''}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 italic">
                      Create a batch to activate
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <div className={`mt-4 pt-4 border-t ${isActive ? 'border-brand-200' : 'border-slate-300'}`}>
                  {deleteConfirm?.id === district.id ? (
                    <div className="space-y-2">
                      {deleteConfirm.force ? (
                        <>
                          <p className="text-xs text-rose-700 font-bold">⚠️ This district has {batchCount} batch(es).</p>
                          <p className="text-xs text-rose-600">All batches will be deleted and interns will be unassigned from their batches.</p>
                        </>
                      ) : (
                        <p className="text-xs text-rose-700 font-medium">Are you sure you want to delete "{district.name}"?</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteDistrict(district.id, district.name, deleteConfirm.force)}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-3 rounded text-xs transition"
                        >
                          {deleteConfirm.force ? 'Yes, force delete' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold py-1 px-3 rounded text-xs transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm({ id: district.id, name: district.name, batchCount, force: false })}
                      className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded font-medium transition"
                    >
                      🗑️ Delete District
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {districtsList.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-600">No districts yet. Click "Add New District" to get started!</p>
        </div>
      )}

      {/* District Details Table */}
      {activeDistricts.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-lg text-slate-900 mb-4">📊 Active Districts Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-brand-50 to-blue-50 border-b-2 border-brand-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">District</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Active Batches</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDistricts.map((dist) => (
                    <tr key={dist} className="hover:bg-brand-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                          📍 {dist}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-slate-900">{districtMap[dist]}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          ✓ Active
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      <div className="card border-l-4 border-brand-400 bg-brand-50">
        <h3 className="font-bold text-slate-900 mb-2">💡 About District Management</h3>
        <ul className="text-sm text-slate-700 space-y-2">
          <li>✓ Manage internship programs across Andhra Pradesh districts</li>
          <li>✓ Create new districts from this page or via Curriculum Mapping</li>
          <li>✓ Delete districts that have no active batches</li>
          <li>✓ Create batches for each district independently</li>
          <li>✓ Map district-specific learning paths and curriculum</li>
          <li>✓ Monitor district-wise performance metrics</li>
        </ul>
      </div>
    </div>
  )
}
