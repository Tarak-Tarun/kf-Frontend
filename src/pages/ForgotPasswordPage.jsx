import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-semibold mb-1">Password assistance</h1>
        <p className="text-sm text-slate-500 mb-5">
          Self-service password reset is not enabled in the current MVP backend.
        </p>

        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-4">
          Ask your administrator or technical lead to update your password access.
        </div>

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-brand-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
