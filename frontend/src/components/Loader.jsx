const Loader = () => (
  <div className="flex flex-col justify-center items-center h-64">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-800"></div>
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-green-500 border-r-green-500 absolute top-0 left-0"></div>
    </div>
    <p className="mt-4 text-zinc-500 animate-pulse font-mono text-sm">Loading...</p>
  </div>
)

export default Loader