import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import { CardSpotlight } from '../components/ui/card-spotlight.jsx'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Extract username from email or use full name if available
  const getUsername = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    return user?.email?.split('@')[0] || 'User'
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-7xl mt-20">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome {getUsername()}<span className="text-green-500">,</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Access the StackTrail platform and develop yourself as a decision-making professional.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Learning Card */}
          <CardSpotlight className="hover:border-green-500/40 transition-all cursor-pointer" onClick={() => navigate('/learning')}>
            <div className="relative z-10">
              <div className="mb-4">
                <span className="text-green-400 font-mono text-sm font-medium">StackTrail Academy</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 font-mono">
                Learn and get<br />certified
              </h2>
              <p className="text-zinc-300 mb-8 text-sm leading-relaxed">
                Begin or advance your journey in decision-making with our online learning paths and earn industry certifications to prove your expertise.
              </p>
              <button
                className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-mono font-bold text-sm transition-colors"
              >
                Start learning
              </button>
            </div>
          </CardSpotlight>

          {/* Labs Card */}
          <CardSpotlight className="hover:border-green-500/40 transition-all cursor-pointer" onClick={() => navigate('/scenarios')}>
            <div className="relative z-10">
              <div className="mb-4">
                <span className="text-green-400 font-mono text-sm font-medium">StackTrail Labs</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 font-mono">
                Practice with hands-on Labs
              </h2>
              <p className="text-zinc-300 mb-8 text-sm leading-relaxed">
                Access decision-making scenarios simulating real-world challenges, edge cases, and critical incidents. With releases every week!
              </p>
              <button
                className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded font-mono font-bold text-sm transition-colors"
              >
                Start playing
              </button>
            </div>
          </CardSpotlight>
        </div>

        {/* Additional Cards */}
        {/* <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-lg hover:border-white/20 transition-all flex items-center justify-between group cursor-pointer">
            <div>
              <h3 className="text-white font-mono font-bold text-lg mb-1">StackTrail Defense</h3>
              <p className="text-zinc-400 text-sm">Level up your defensive decision-making skills</p>
            </div>
            <div className="text-zinc-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-lg hover:border-white/20 transition-all flex items-center justify-between group cursor-pointer">
            <div>
              <h3 className="text-white font-mono font-bold text-lg mb-1">StackTrail Challenges</h3>
              <p className="text-zinc-400 text-sm">Compete or host decision-making competitions</p>
            </div>
            <div className="text-zinc-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div> */}
      </div>
    </>
  )
}

export default Dashboard
