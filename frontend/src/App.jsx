import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import LandingPage from './pages/landingPage.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Scenarios from './pages/Scenarios.jsx'
import ScenarioDetails from './pages/ScenarioDetails.jsx'
import PlayScenario from './pages/PlayScenario.jsx'
import Progress from './pages/Progress.jsx'

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/scenarios"
          element={
            <ProtectedRoute>
              <Scenarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scenarios/:id"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ScenarioDetails />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/play/:id"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <PlayScenario />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Progress />
              </>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
