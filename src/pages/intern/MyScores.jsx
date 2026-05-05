import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/AuthContext'
import api from '../../lib/api'

export default function MyScores() {
  const { user } = useAuth()
  const [evals, setEvals] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    
    api.get('/evaluations', { params: { intern_id: user.id, limit: 500 } })
      .then((r) => {
        setEvals(r.data || [])
        setError('')
      })
      .catch((err) => {
        console.error('Failed to load evaluations:', err)
        setError(err.response?.data?.detail || 'Failed to load your evaluations.')
        setEvals([])
      })
  }, [user])

  const withFeedback = evals.filter((e) => e.feedback)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Feedback</h1>

      {error && <div className="card border border-rose-200 bg-rose-50 text-rose-700">{error}</div>}

      {evals.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-600 font-medium">No evaluations yet.</p>
          <p className="text-sm text-slate-400 mt-1">Your TL will share feedback after each week's review.</p>
        </div>
      ) : withFeedback.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-slate-600 font-medium">No feedback comments yet.</p>
          <p className="text-sm text-slate-400 mt-1">Your TL hasn't added written feedback yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evals.map((e) => (
            <div key={e.id} className="card border-l-4 border-amber-400 bg-amber-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  Week {e.week_number}
                </div>
                <div className="text-sm font-bold text-brand-700">{e.score}/5</div>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">{e.feedback || 'No written feedback provided.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
