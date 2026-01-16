import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Loader from '../components/Loader.jsx'

const PlayScenario = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [totalXp, setTotalXp] = useState(0)
  const [badDecisionCount, setBadDecisionCount] = useState(0)
  const [currentStep, setCurrentStep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [summary, setSummary] = useState(null)
  const [scenarioInfo, setScenarioInfo] = useState(null)

  const initializeScenario = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get scenario info
      const scenarioData = await api.getScenarioById(id)
      setScenarioInfo(scenarioData.scenario)
      
      // Start scenario (will create or reset progress)
      const startData = await api.startScenario(id)
      setTotalXp(startData.data.progress.total_xp || 0)
      setBadDecisionCount(startData.data.progress.bad_decision_count || 0)
      setCurrentStep(startData.data.step)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    initializeScenario()
  }, [initializeScenario])

  const handleSelectOption = async (optionId) => {
    if (submitting || !currentStep) return
    
    setSubmitting(true)
    setFeedback(null)
    
    try {
      const result = await api.submitAnswer(id, currentStep.id, optionId)
      
      if (result.data.isComplete) {
        // Scenario ended
        setIsComplete(true)
        setIsFailed(result.data.isFailed || false)
        setSummary(result.data.summary)
      } else {
        // Continue to next step
        const { xpGained, decisionQuality, nextStep, progress } = result.data
        
        setFeedback({
          xpGained,
          quality: decisionQuality
        })
        
        setTotalXp(progress.totalXp)
        setBadDecisionCount(progress.badDecisionCount)
        
        // Small delay to show feedback before moving to next step
        setTimeout(() => {
          setCurrentStep(nextStep)
          setSelectedOption(null)
          setFeedback(null)
        }, 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getXpBadgeColor = (quality) => {
    if (quality === 'good') return 'bg-green-900/20 border-green-500/30 text-green-400'
    if (quality === 'risky') return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
    return 'bg-red-900/20 border-red-500/30 text-red-400'
  }

  if (loading) return <Loader />
  if (error) return (
    <div className="container mx-auto p-6 max-w-2xl mt-20">
      <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded">
        {error}
      </div>
    </div>
  )

  // Completion screen
  if (isComplete && summary) {
    return (
      <div className="container mx-auto p-6 max-w-3xl mt-20">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-10 rounded">
          <div className="text-center mb-8">
            <div className="text-7xl mb-6">{isFailed ? '💔' : '🎉'}</div>
            <h1 className="text-4xl font-bold font-mono text-white mb-2">
              Scenario {isFailed ? 'Failed' : 'Complete'}<span className={isFailed ? 'text-red-500' : 'text-green-500'}>!</span>
            </h1>
            <p className="text-zinc-400">
              {isFailed ? 'Too many bad decisions. Try again!' : 'Congratulations on completing the scenario!'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-800/50 border border-white/10 p-4 rounded text-center">
              <p className="text-zinc-400 text-xs font-mono mb-2">Total XP</p>
              <p className="text-3xl font-bold font-mono text-white">{summary.totalXp}</p>
            </div>
            <div className="bg-green-900/20 border border-green-500/30 p-4 rounded text-center">
              <p className="text-green-400 text-xs font-mono mb-2">Good</p>
              <p className="text-3xl font-bold font-mono text-white">{summary.goodDecisions}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded text-center">
              <p className="text-yellow-400 text-xs font-mono mb-2">Risky</p>
              <p className="text-3xl font-bold font-mono text-white">{summary.riskyDecisions}</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded text-center">
              <p className="text-red-400 text-xs font-mono mb-2">Bad</p>
              <p className="text-3xl font-bold font-mono text-white">{summary.badDecisions}</p>
            </div>
          </div>

          <div className="bg-zinc-800/30 border border-white/10 p-6 rounded mb-6">
            <h3 className="text-lg font-bold font-mono text-white mb-2">Performance: <span className="text-green-500">{summary.performance}</span></h3>
            <p className="text-zinc-400 text-sm">Total decisions made: {summary.totalDecisions}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/scenarios')}
              className="flex-1 bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded font-mono font-bold transition-colors"
            >
              ← Back to Scenarios
            </button>
            <button
              onClick={initializeScenario}
              className="flex-1 bg-green-500 text-black hover:bg-green-600 px-6 py-3 rounded font-mono font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentStep || !scenarioInfo) {
    return <div className="text-white p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl mt-20">
      {/* Header with stats */}
      <div className="mb-6 bg-zinc-900/30 backdrop-blur-sm border border-white/10 p-6 rounded">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono text-white">
              {scenarioInfo.title}<span className="text-green-500">_</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1 font-mono">Make wise decisions to succeed</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-zinc-800/50 border border-white/10 px-4 py-2 rounded">
              <p className="text-zinc-400 text-xs font-mono mb-1">Total XP</p>
              <p className="text-xl font-bold font-mono text-white">{totalXp}</p>
            </div>
            <div className={`px-4 py-2 rounded border ${badDecisionCount >= 2 ? 'bg-red-900/30 border-red-500/40' : 'bg-red-900/20 border-red-500/30'}`}>
              <p className="text-red-400 text-xs font-mono mb-1">Bad Decisions</p>
              <p className="text-xl font-bold font-mono text-white">{badDecisionCount}/3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-8 rounded">
        <div className="mb-6">
          <div className="bg-zinc-800/30 p-6 rounded border border-white/5 mb-6">
            <p className="text-zinc-200 text-lg leading-relaxed">{currentStep.context}</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono font-bold text-zinc-500 uppercase tracking-wide mb-3">
            Choose your action:
          </h3>
          {currentStep.options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setSelectedOption(option.id)
                handleSelectOption(option.id)
              }}
              disabled={submitting || selectedOption !== null}
              className={`w-full text-left p-4 rounded border transition-all
                ${selectedOption === option.id 
                  ? 'bg-green-900/30 border-green-500/50 text-white' 
                  : 'bg-zinc-800/50 border-white/10 text-zinc-300 hover:border-green-500/30 hover:bg-zinc-800/70'
                }
                ${submitting || selectedOption ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
            >
              <span className="font-mono">{option.text}</span>
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mt-6 p-4 rounded border animate-fadeIn ${getXpBadgeColor(feedback.quality)}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {feedback.quality === 'good' ? '✅' : feedback.quality === 'risky' ? '⚠️' : '❌'}
              </span>
              <div>
                <p className="font-mono font-bold">
                  {feedback.quality === 'good' ? 'Good Decision!' : feedback.quality === 'risky' ? 'Risky Choice' : 'Bad Decision'}
                </p>
                <p className="text-sm font-mono">
                  {feedback.xpGained >= 0 ? '+' : ''}{feedback.xpGained} XP
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayScenario