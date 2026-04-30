import { Link } from 'react-router-dom'

export default function SetPasswordPage({ mode = 'activate' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-semibold mb-1">
          {mode === 'reset' ? 'Reset password unavailable' : 'Activation unavailable'}
        </h1>
        <p className="text-sm text-slate-500 mb-5">
          This frontend is connected to the current MVP backend, which does not yet expose activation or reset-token flows.
        </p>

        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-4">
          Contact your administrator to get access credentials for this MVP environment.
        </div>

        <div className="mt-4">
          <Link to="/login" className="btn-primary w-full text-center block">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
