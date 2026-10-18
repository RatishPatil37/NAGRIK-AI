import React from 'react';

interface NagrikLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const NagrikLogo: React.FC<NagrikLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  onClick,
}) => {
  const sealSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg sm:text-xl font-bold',
    lg: 'text-2xl font-bold',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Authentic NAGRK.IN Circular Seal from user's original logo asset */}
      <img
        src="/nagrik-seal.png"
        alt="Nagrik AI Emblem"
        className={`${sealSizes[size]} rounded-full object-contain shrink-0 group-hover:scale-105 transition-transform`}
        onError={(e) => {
          // Fallback if needed
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* Official Typography: "Nagrik AI" */}
      {showText && (
        <span
          className={`${textSizes[size]} font-sans font-bold text-slate-950 dark:text-white tracking-tight leading-none`}
        >
          Nagrik AI
        </span>
      )}
    </div>
  );
};
