import OptionButton from './OptionButton.jsx'

const StepCard = ({ step, onSelectOption, selectedOption, loading }) => {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-8 rounded">
      <div className="mb-6">
        <div className="inline-block px-4 py-2 bg-green-900/20 border border-green-500/20 rounded mb-4">
          <span className="text-green-500 font-mono font-bold">Step {step.step_number}</span>
        </div>
        <div className="bg-zinc-800/30 p-6 rounded border border-white/5">
          <p className="text-zinc-200 text-lg leading-relaxed">{step.context}</p>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold text-zinc-500 uppercase tracking-wide mb-3">Choose your action:</h3>
        {step.options.map((option, index) => (
          <OptionButton
            key={index}
            option={option}
            index={index}
            onClick={() => onSelectOption(index)}
            disabled={loading || selectedOption !== null}
            selected={selectedOption === index}
          />
        ))}
      </div>
      {step.feedback && (
        <div className="mt-8 p-6 bg-green-900/20 border border-green-500/20 rounded animate-fadeIn">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <p className="text-zinc-200 leading-relaxed flex-1 font-mono text-sm">{step.feedback}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StepCard