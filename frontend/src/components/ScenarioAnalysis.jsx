import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ScenarioAnalysis = ({ scenarioId, onRetry, metadata }) => {
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        console.log('🔍 Starting AI analysis fetch for scenario:', scenarioId)
        setLoading(true)
        
        console.log('📡 Making API request to:', `${import.meta.env.VITE_API_URL}/scenarios/${scenarioId}/analyze`)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/scenarios/${scenarioId}/analyze`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(await import('../lib/supabase.js').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        console.log('📥 Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ API Error response:', errorText)
          throw new Error('Failed to generate analysis')
        }

        const data = await response.json()
        console.log('✅ Analysis data received:', data)
        setAnalysis(data.analysis)
        console.log('💾 Analysis saved to state')
      } catch (err) {
        console.error('❌ Error fetching analysis:', err)
        console.error('Error details:', err.message, err.stack)
        setError(err.message)
      } finally {
        console.log('🏁 Fetch analysis complete, setting loading to false')
        setLoading(false)
      }
    }

    // Only fetch once per mount
    if (!analysis && !error) {
      console.log('🚀 Initiating analysis fetch (first time)')
      fetchAnalysis()
    } else {
      console.log('⏭️ Skipping fetch - analysis:', !!analysis, 'error:', !!error)
    }
  }, [scenarioId]) // Removed analysis and error from dependencies

  if (loading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-10 rounded">
        <div className="text-center">
          {/* AI Brain Animation */}
          <div className="relative mb-8">
            <div className="text-7xl mb-4 animate-pulse">🤖</div>
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          
          {/* Loading Text */}
          <h3 className="text-2xl font-bold font-mono text-white mb-3">
            AI Analysis in Progress
          </h3>
          <p className="text-zinc-400 font-mono text-sm mb-6">
            Our AI mentor is analyzing your decision-making patterns...
          </p>
          
          {/* Progress Steps */}
          <div className="max-w-md mx-auto space-y-3 text-left">
            <div className="flex items-center gap-3 text-zinc-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono">Reviewing decision sequence</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
              <span className="text-sm font-mono">Evaluating technical approach</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '1000ms' }}></div>
              <span className="text-sm font-mono">Generating personalized insights</span>
            </div>
          </div>
          
          <p className="text-zinc-500 text-xs font-mono mt-8">
            This may take 3-5 seconds...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-10 rounded">
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded mb-6">
          Failed to generate analysis. Please try again later.
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/scenarios')}
            className="flex-1 bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded font-mono font-bold transition-colors"
          >
            ← Back to Scenarios
          </button>
          <button
            onClick={onRetry}
            className="flex-1 bg-green-500 text-black hover:bg-green-600 px-6 py-3 rounded font-mono font-bold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 p-8 border-b border-white/10">
        <div className="text-center mb-4">
          <div className="text-6xl mb-4">{metadata?.completed ? '🎓' : '📚'}</div>
          <h2 className="text-3xl font-bold font-mono text-white mb-2">
            Performance Analysis
          </h2>
          <p className="text-zinc-400 font-mono text-sm">
            Expert feedback from a Staff-level Engineer
          </p>
        </div>
        
        {/* Metadata stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-zinc-800/50 border border-white/10 p-3 rounded text-center">
            <p className="text-zinc-400 text-xs font-mono mb-1">Status</p>
            <p className={`text-sm font-bold font-mono ${metadata?.completed ? 'text-green-400' : 'text-red-400'}`}>
              {metadata?.completed ? 'COMPLETED' : 'FAILED'}
            </p>
          </div>
          <div className="bg-zinc-800/50 border border-white/10 p-3 rounded text-center">
            <p className="text-zinc-400 text-xs font-mono mb-1">Final Score</p>
            <p className="text-sm font-bold font-mono text-white">{metadata?.finalScore || 0}</p>
          </div>
          <div className="bg-zinc-800/50 border border-white/10 p-3 rounded text-center">
            <p className="text-zinc-400 text-xs font-mono mb-1">Decisions</p>
            <p className="text-sm font-bold font-mono text-white">{metadata?.totalDecisions || 0}</p>
          </div>
          <div className="bg-zinc-800/50 border border-white/10 p-3 rounded text-center">
            <p className="text-zinc-400 text-xs font-mono mb-1">Poor Choices</p>
            <p className="text-sm font-bold font-mono text-red-400">{metadata?.badDecisions || 0}</p>
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="p-8 space-y-8">
        {/* Summary */}
        <div className="bg-zinc-800/30 border border-white/10 p-6 rounded">
          <h3 className="text-lg font-bold font-mono text-white mb-3 flex items-center gap-2">
            <span className="text-blue-400">📊</span>
            Overall Assessment
          </h3>
          <p className="text-zinc-300 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="bg-green-900/10 border border-green-500/20 p-6 rounded">
            <h3 className="text-lg font-bold font-mono text-green-400 mb-4 flex items-center gap-2">
              <span>✅</span>
              What You Did Well
            </h3>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex gap-3 text-zinc-300">
                  <span className="text-green-500 font-bold mt-1">•</span>
                  <span className="flex-1">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mistakes */}
        {analysis.mistakes && analysis.mistakes.length > 0 && (
          <div className="bg-red-900/10 border border-red-500/20 p-6 rounded">
            <h3 className="text-lg font-bold font-mono text-red-400 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {analysis.mistakes.map((mistake, index) => (
                <li key={index} className="flex gap-3 text-zinc-300">
                  <span className="text-red-500 font-bold mt-1">•</span>
                  <span className="flex-1">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded">
            <h3 className="text-lg font-bold font-mono text-blue-400 mb-4 flex items-center gap-2">
              <span>💡</span>
              Recommendations
            </h3>
            <ul className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex gap-3 text-zinc-300">
                  <span className="text-blue-500 font-bold mt-1">{index + 1}.</span>
                  <span className="flex-1">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Senior Perspective */}
        {analysis.seniorPerspective && (
          <div className="bg-purple-900/10 border border-purple-500/20 p-6 rounded">
            <h3 className="text-lg font-bold font-mono text-purple-400 mb-4 flex items-center gap-2">
              <span>🧠</span>
              Senior Engineer Perspective
            </h3>
            <p className="text-zinc-300 leading-relaxed">{analysis.seniorPerspective}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-zinc-800/30 border-t border-white/10 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/scenarios')}
            className="flex-1 bg-zinc-700 text-white hover:bg-zinc-600 px-6 py-3 rounded font-mono font-bold transition-colors"
          >
            ← Back to Scenarios
          </button>
          <button
            onClick={onRetry}
            className="flex-1 bg-green-500 text-black hover:bg-green-600 px-6 py-3 rounded font-mono font-bold transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="flex-1 bg-blue-500 text-black hover:bg-blue-600 px-6 py-3 rounded font-mono font-bold transition-colors"
          >
            View Progress
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScenarioAnalysis
