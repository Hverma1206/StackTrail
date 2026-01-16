const OptionButton = ({ option, index, onClick, disabled, selected }) => {
  const baseClasses = "w-full text-left p-5 rounded transition-all duration-200 border"
  const stateClasses = selected
    ? "bg-white border-green-500 text-black scale-[1.02]"
    : disabled
    ? "bg-zinc-800/30 border-zinc-700 text-zinc-600 cursor-not-allowed"
    : "bg-zinc-800/50 border-white/10 hover:border-green-500/50 hover:bg-zinc-800 text-white cursor-pointer hover:scale-[1.02]"

  return (
    <button
      className={`${baseClasses} ${stateClasses} group`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl font-mono font-bold ${
          selected ? 'text-black' : disabled ? 'text-zinc-700' : 'text-green-500 group-hover:text-green-400'
        }`}>
          {String.fromCharCode(65 + index)}
        </span>
        <div className="flex-1">
          <div className="font-mono font-semibold text-base mb-1">{option.text}</div>
          {option.description && (
            <div className={`text-sm mt-2 font-mono ${
              selected ? 'text-zinc-700' : disabled ? 'text-zinc-600' : 'text-zinc-400'
            }`}>{option.description}</div>
          )}
        </div>
      </div>
    </button>
  )
}

export default OptionButton