import React from 'react';

interface EcoLoopLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const EcoLoopLogo: React.FC<EcoLoopLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`} id="ecoloop-brand-logo">
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-sm ring-1 ring-emerald-500/20`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/7 h-5/7 text-white"
        >
          {/* Dual circular loop representing circular economy */}
          <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
          <path d="M11 19h8.2a1.8 1.8 0 0 0 1.8-1.8V7.8A1.8 1.8 0 0 0 19.2 6H13" />
          <path d="M16 3l-3 3 3 3" />
          <path d="M4 16l3 3-3 3" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-slate-900 ${textSizes[size]} font-['Space_Grotesk',sans-serif]`}>
            Eco<span className="text-emerald-600">Loop</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mt-0.5">
            Circular Economy Market
          </span>
        )}
      </div>
    </div>
  );
};
