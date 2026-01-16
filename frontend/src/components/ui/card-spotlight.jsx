import React, { useRef } from 'react';
import { cn } from "../../lib/utils";

export const CardSpotlight = ({
  children,
  className,
  spotlightColor = 'rgba(34, 197, 94, 0.25)', // green-500
  ...props
}) => {
  const divRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative rounded-xl border border-white/10 bg-zinc-900/50 p-8 overflow-hidden",
        "before:content-[''] before:absolute before:inset-0",
        "before:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),var(--spotlight-color),transparent_80%)]",
        "before:opacity-0 before:transition-opacity before:duration-500 before:pointer-events-none",
        "hover:before:opacity-100 focus-within:before:opacity-100",
        className
      )}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        '--spotlight-color': spotlightColor
      }}
      {...props}
    >
      {children}
    </div>
  );
};
