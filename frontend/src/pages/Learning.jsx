import Navbar from '../components/Navbar.jsx'

const Learning = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-7xl mt-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-mono text-white mb-4">
              Learning page under progress<span className="text-green-500">_</span>
            </h1>
            <p className="text-zinc-500 font-mono text-lg">
              Coming soon...
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Learning
