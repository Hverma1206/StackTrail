import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      navigate('/scenarios')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 flex items-center justify-center rounded mx-auto mb-4">
            <i className="fa-solid fa-brain text-green-500 text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold font-mono text-white mb-2">
            Welcome Back<span className="text-green-500">_</span>
          </h1>
          <p className="text-zinc-500 text-sm font-mono">
            Continue your journey
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 font-mono">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-zinc-800/50 text-white rounded border border-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 font-mono">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-zinc-800/50 text-white rounded border border-zinc-700 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono text-sm"
              required
            />
          </div>
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded text-sm font-mono">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 p-3 rounded-sm font-mono font-bold text-sm transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link
            to="/signup"
            className="text-green-500 hover:text-green-400 text-sm font-mono font-medium transition-colors"
          >
            Need an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
          