import { useEffect, useState } from 'react'

import api from '../../lib/api'
import { validateEmail, validateName, validateTechStack, validateUUID } from '../../utils/validation'

const EMPTY_FORM = { name: '', email: '', tech_stack: '', batch_id: '' }

export default function InternManagement() {
  const [interns, setInterns] = useState([])
  const [batches, setBatches] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function load() {
    try {
      const [profiles, batchList] = await Promise.all([
        api.get('/profiles', { params: { role: 'INTERN', limit: 500 } }),
        api.get('/batches', { params: { limit: 500 } }),
      ])
      setInterns(profiles.data)
      setBatches(batchList.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load intern profiles.')
    }
  }

  useEffect(() => { load() }, [])

  async function createProfile(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    
    // Validate all fields
    const errors = {}
    
    const nameValidation = validateName(form.name)
    if (!nameValidation.valid) {
      errors.name = nameValidation.error
    }
    
    const emailValidation = validateEmail(form.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.error
    }
    
    const techStackValidation = validateTechStack(form.tech_stack)
    if (!techStackValidation.valid) {
      errors.tech_stack = techStackValidation.error
    }
    
    const batchIdValidation = validateUUID(form.batch_id, 'Batch')
    if (!batchIdValidation.valid) {
      errors.batch_id = batchIdValidation.error
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('⚠️ Please fix the validation errors above')
      return
    }
    
    try {
      await api.post('/profiles', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        tech_stack: form.tech_stack.trim() || null,
        role: 'INTERN',
        batch_id: form.batch_id || null,
      })
      setForm(EMPTY_FORM)
      setFieldErrors({})
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create intern profile.')
    }
  }

  async function saveProfile(id) {
    setError('')
    setFieldErrors({})
    
    // Validate all fields
    const errors = {}
    
    const nameValidation = validateName(editingForm.name)
    if (!nameValidation.valid) {
      errors.name = nameValidation.error
    }
    
    const emailValidation = validateEmail(editingForm.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.error
    }
    
    const techStackValidation = validateTechStack(editingForm.tech_stack)
    if (!techStackValidation.valid) {
      errors.tech_stack = techStackValidation.error
    }
    
    const batchIdValidation = validateUUID(editingForm.batch_id, 'Batch')
    if (!batchIdValidation.valid) {
      errors.batch_id = batchIdValidation.error
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('⚠️ Please fix the validation errors above')
      return
    }
    
    try {
      await api.put(`/profiles/${id}`, {
        name: editingForm.name.trim(),
        email: editingForm.email.trim().toLowerCase(),
        tech_stack: editingForm.tech_stack?.trim() || null,
        batch_id: editingForm.batch_id || null,
      })
      setEditingId(null)
      setEditingForm(EMPTY_FORM)
      setFieldErrors({})
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update intern profile.')
    }
  }

  async function deleteProfile(id) {
    if (!window.confirm('Delete this intern profile?')) return
    try {
      await api.delete(`/profiles/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete intern profile.')
    }
  }

  function batchName(batchId) {
    return batches.find((batch) => batch.id === batchId)?.name || 'Unassigned'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Intern Profiles</h1>
        <p className="text-sm text-slate-500 mt-2">Manage intern profiles and assign them to batches.</p>
      </div>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      <form onSubmit={createProfile} className="card grid md:grid-cols-5 gap-4">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Tech stack" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
        <select className="input" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })}>
          <option value="">No batch</option>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
        </select>
        <button className="btn-primary" type="submit">Create Intern</button>
      </form>

      <div className="card overflow-x-auto">
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
            {interns.map((item) => (
              <tr key={item.id}>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.name} onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })} />
                  ) : item.name}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" type="email" value={editingForm.email} onChange={(e) => setEditingForm({ ...editingForm, email: e.target.value })} />
                  ) : item.email}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <input className="input" value={editingForm.tech_stack || ''} onChange={(e) => setEditingForm({ ...editingForm, tech_stack: e.target.value })} />
                  ) : (item.tech_stack || '—')}
                </td>
                <td className="td">
                  {editingId === item.id ? (
                    <select className="input" value={editingForm.batch_id || ''} onChange={(e) => setEditingForm({ ...editingForm, batch_id: e.target.value })}>
                      <option value="">No batch</option>
                      {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                    </select>
                  ) : batchName(item.batch_id)}
                </td>
                <td className="td space-x-3">
                  {editingId === item.id ? (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => saveProfile(item.id)}>Save</button>
                      <button className="text-sm text-slate-500" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-sm text-brand-700 font-semibold" onClick={() => {
                        setEditingId(item.id)
                        setEditingForm({
                          name: item.name,
                          email: item.email,
                          tech_stack: item.tech_stack || '',
                          batch_id: item.batch_id || '',
                        })
                      }}>Edit</button>
                      <button className="text-sm text-rose-700 font-semibold" onClick={() => deleteProfile(item.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {interns.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={5}>No intern profiles found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
