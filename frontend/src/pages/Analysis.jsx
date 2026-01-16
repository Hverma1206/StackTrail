import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ScenarioAnalysis from '../components/ScenarioAnalysis'
import { useNavigate } from 'react-router-dom'

const Analysis = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Get metadata from location state if available
  const metadata = window.history.state?.usr?.metadata || {
    completed: true,
    failed: false,
    finalScore: 0,
    totalDecisions: 0,
    badDecisions: 0
  }

  const handleRetry = () => {
    navigate(`/play/${id}`)
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl mt-20">
        <ScenarioAnalysis 
          scenarioId={id}
          onRetry={handleRetry}
          metadata={metadata}
        />
      </div>
    </>
  )
}

export default Analysis
