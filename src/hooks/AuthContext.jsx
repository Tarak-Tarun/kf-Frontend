import { createContext, useContext, useEffect, useState } from 'react'

import api from '../lib/api'

const AuthContext = createContext(null)


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('kf_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  async function hydrateCurrentUser() {
    const { data } = await api.get('/auth/me')
    setUser(data)
    localStorage.setItem('kf_user', JSON.stringify(data))
    return data
  }

  useEffect(() => {
    const token = localStorage.getItem('kf_token')
    if (!token) {
      setLoading(false)
      return
    }

    hydrateCurrentUser()
      .catch(() => {
        localStorage.removeItem('kf_token')
        localStorage.removeItem('kf_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('kf_token', data.access_token)
    return hydrateCurrentUser()
  }

  function logout() {
    localStorage.removeItem('kf_token')
    localStorage.removeItem('kf_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: hydrateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}


export const useAuth = () => useContext(AuthContext)
