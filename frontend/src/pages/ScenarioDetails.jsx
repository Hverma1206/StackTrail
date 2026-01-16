import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Loader from '../components/Loader.jsx'

const ScenarioDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scenario, setScenario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchScenario = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getScenarioById(id)
      setScenario(data.scenario)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchScenario()
  }, [fetchScenario])

  const handleStart = async () => {
    try {
      await api.startScenario(id)
      navigate(`/play/${id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Loader />
  if (error) return <div className="text-red-400 p-4">{error}</div>
  if (!scenario) return <div className="text-white p-4">Scenario not found</div>

  return (
    <div className="container mx-auto p-6 max-w-4xl mt-20">
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-8 rounded">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold font-mono text-white mb-4">{scenario.title}<span className="text-green-500">_</span></h1>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 bg-green-900/20 border border-green-500/20 text-green-500 rounded text-sm font-mono">👤 {scenario.role}</span>
              <span className={`px-4 py-1.5 rounded text-sm font-mono border ${
                scenario.difficulty === 'easy' ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                scenario.difficulty === 'medium' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                'bg-red-900/20 border-red-500/30 text-red-400'
              }`}>
                {scenario.difficulty === 'easy' ? '🟢' : scenario.difficulty === 'medium' ? '🟡' : '🔴'} {scenario.difficulty}
              </span>
            </div>
          </div>
          <div className="text-6xl">🎯</div>
        </div>
        <div className="bg-zinc-800/30 p-6 rounded mb-8 border border-white/5">
          <p className="text-zinc-300 text-lg leading-relaxed">{scenario.description}</p>
        </div>
        <button
          onClick={handleStart}
          className="w-full bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-sm text-lg font-mono font-bold transition-colors flex items-center justify-center gap-2"
        >
          <span>Start Scenario</span>
          <span>🚀</span>
        </button>
      </div>
    </div>
  )
}

export default ScenarioDetails