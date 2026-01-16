const Progress = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl mt-20">
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-10 rounded text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 flex items-center justify-center rounded mx-auto mb-6">
          <i className="fa-solid fa-chart-line text-green-500 text-3xl"></i>
        </div>
        <h1 className="text-4xl font-bold font-mono text-white mb-4">Your Progress<span className="text-green-500">_</span></h1>
        <p className="text-zinc-500 mb-8 font-mono text-sm">Track your learning journey and achievements</p>
        <div className="bg-green-900/20 border border-green-500/20 p-6 rounded">
          <p className="text-zinc-300 font-mono text-sm">📈 Progress tracking feature coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default Progress