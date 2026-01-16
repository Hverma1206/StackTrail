import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Loader from '../components/Loader.jsx'
import StepCard from '../components/StepCard.jsx'

const PlayScenario = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  const initializeScenario = useCallback(async () => {
    try {
      setLoading(true)
      // Try to get progress
      const progressData = await api.getProgress(id)
      setProgress(progressData.progress)

      if (progressData.progress.completed || progressData.progress.failed) {
        // Scenario finished
        return
      }

      // Get current step
      const stepData = await api.getStep(id, progressData.progress.current_step_id)
      setCurrentStep(stepData.data.step)
    } catch (err) {
      if (err.message.includes('not found')) {
        // No progress, start scenario
        try {
          const startData = await api.startScenario(id)
          setProgress(startData.data.progress)
          setCurrentStep(startData.data.step)
        } catch (startErr) {
          setError(startErr.message)
        }
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    initializeScenario()
  }, [initializeScenario])

  const handleSelectOption = async (index) => {
    if (submitting) return
    setSelectedOption(index)
    setSubmitting(true)
    try {
      const result = await api.submitAnswer(id, currentStep.id, index)
      setProgress(result.data.progress)
      if (result.data.step) {
        setCurrentStep(result.data.step)
      } else {
        // Scenario ended
        navigate('/progress')
      }
      setSelectedOption(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <div className="text-red-400 p-4">{error}</div>

  if (!progress || !currentStep) {
    return <div className="text-white p-4">Loading scenario...</div>
  }

  if (progress.completed) {
    return (
      <div className="container mx-auto p-6 max-w-2xl mt-20">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-10 rounded text-center">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold font-mono text-white mb-6">Scenario Completed<span className="text-green-500">!</span></h1>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-900/20 border border-green-500/30 p-6 rounded">
              <p className="text-green-500 text-sm font-mono font-medium mb-2">Final Score</p>
              <p className="text-3xl font-bold font-mono text-white">{progress.score}</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded">
              <p className="text-red-400 text-sm font-mono font-medium mb-2">Bad Decisions</p>
              <p className="text-3xl font-bold font-mono text-white">{progress.bad_decision_count}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-sm font-mono font-bold transition-colors"
          >
            ← Back to Scenarios
          </button>
        </div>
      </div>
    )
  }

  if (progress.failed) {
    return (
      <div className="container mx-auto p-6 max-w-2xl mt-20">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-10 rounded text-center">
          <div className="text-7xl mb-6">💔</div>
          <h1 className="text-4xl font-bold font-mono text-white mb-6">Scenario Failed<span className="text-red-500">!</span></h1>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-800/30 border border-white/10 p-6 rounded">
              <p className="text-zinc-400 text-sm font-mono font-medium mb-2">Final Score</p>
              <p className="text-3xl font-bold font-mono text-white">{progress.score}</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded">
              <p className="text-red-400 text-sm font-mono font-medium mb-2">Bad Decisions</p>
              <p className="text-3xl font-bold font-mono text-white">{progress.bad_decision_count}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-sm font-mono font-bold transition-colors"
          >
            ← Try Another Scenario
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl mt-20">
      <div className="mb-6 bg-zinc-900/30 backdrop-blur-sm border border-white/10 p-6 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white">{progress.scenarios.title}<span className="text-green-500">_</span></h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">Make wise decisions to succeed</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-green-900/20 border border-green-500/30 px-4 py-2 rounded">
            <p className="text-green-500 text-xs font-mono font-medium mb-1">Score</p>
            <p className="text-xl font-bold font-mono text-white">{progress.score}</p>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 px-4 py-2 rounded">
            <p className="text-red-400 text-xs font-mono font-medium mb-1">Bad Decisions</p>
            <p className="text-xl font-bold font-mono text-white">{progress.bad_decision_count}</p>
          </div>
        </div>
      </div>
      <StepCard
        step={currentStep}
        onSelectOption={handleSelectOption}
        selectedOption={selectedOption}
        loading={submitting}
      />
    </div>
  )
}

export default PlayScenario