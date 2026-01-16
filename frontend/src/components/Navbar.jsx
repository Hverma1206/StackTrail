import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const Navbar = () => {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 flex items-center justify-center rounded">
            <i className="fa-solid fa-brain text-green-500 text-sm"></i>
          </div>
          <span className="font-mono font-bold text-lg tracking-tight text-white">BrainWave<span className="text-green-500">_</span></span>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/20 rounded">
              <div className="w-6 h-6 bg-green-500/20 border border-green-500/40 flex items-center justify-center rounded text-xs font-mono font-bold text-green-400">
                {user.email[0].toUpperCase()}
              </div>
              <span className="text-zinc-400 text-sm font-mono">{user.email.split('@')[0]}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 px-4 py-2 text-sm font-mono font-medium transition-colors rounded-sm"
            >
              logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar