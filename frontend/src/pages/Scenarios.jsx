import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import Loader from '../components/Loader.jsx'
import Navbar from '../components/Navbar.jsx'

const JOB_ROLES = [
  'Backend Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Frontend Engineer',
  'Security Engineer'
]

const Scenarios = () => {
  const [scenarios, setScenarios] = useState([])
  const [allScenarios, setAllScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedRole) params.role = selectedRole
      if (selectedDifficulty) params.difficulty = selectedDifficulty
      
      const data = await api.getScenarios(params)
      setAllScenarios(data.scenarios)
      setScenarios(data.scenarios)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedRole, selectedDifficulty])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  // Client-side search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setScenarios(allScenarios)
      return
    }

    const filtered = allScenarios.filter(scenario => {
      const search = searchTerm.toLowerCase()
      return (
        scenario.title.toLowerCase().includes(search) ||
        scenario.description.toLowerCase().includes(search) ||
        scenario.role.toLowerCase().includes(search)
      )
    })
    setScenarios(filtered)
  }, [searchTerm, allScenarios])

  const handleRoleChange = (value) => {
    setSelectedRole(value)
    setSearchTerm('')
  }

  const handleDifficultyChange = (value) => {
    setSelectedDifficulty(value)
    setSearchTerm('')
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  if (loading) return (
    <>
      <Navbar />
      <Loader />
    </>
  )
  if (error) return (
    <>
      <Navbar />
      <div className="text-red-400 p-4 mt-20">{error}</div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-7xl mt-20">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-white mb-2">Training Scenarios<span className="text-green-500">_</span></h1>
        <p className="text-zinc-500 font-mono text-sm">Choose a scenario to test your decision-making skills</p>
      </div>
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="bg-zinc-900/50 border border-white/10 text-white p-3 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono text-sm"
        >
          <option value="">All Job Roles</option>
          {JOB_ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={selectedDifficulty}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          className="bg-zinc-900/50 border border-white/10 text-white p-3 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono text-sm"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          type="text"
          placeholder="Search scenarios..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="flex-1 bg-zinc-900/50 border border-white/10 text-white p-3 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono text-sm"
        />
      </div>
      {scenarios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 font-mono">No scenarios found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-6 rounded hover:border-green-500/30 transition-all hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold font-mono text-white group-hover:text-green-400 transition-colors">{scenario.title}</h2>
                <div className="text-2xl">🎯</div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-green-900/20 border border-green-500/20 text-green-500 rounded text-xs font-mono">{scenario.role}</span>
                <span className={`px-3 py-1 rounded text-xs font-mono border ${
                  scenario.difficulty === 'easy' ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                  scenario.difficulty === 'medium' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                  'bg-red-900/20 border-red-500/30 text-red-400'
                }`}>{scenario.difficulty}</span>
              </div>
              <p className="text-zinc-400 mb-5 line-clamp-3 text-sm">{scenario.description}</p>
              <Link
                to={`/scenarios/${scenario.id}`}
                className="inline-block w-full bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-sm font-mono font-bold text-sm transition-colors text-center"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

export default Scenarios