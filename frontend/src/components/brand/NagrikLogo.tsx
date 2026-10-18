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
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg sm:text-xl font-extrabold',
    lg: 'text-2xl font-black',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Authentic NAGRIK.IN Circular Seal with Saffron/Orange Ring, Fist Emblem & Wreath */}
      <div
        className={`relative ${iconSizes[size]} rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Black Border */}
          <circle cx="50" cy="50" r="48" fill="#18181B" stroke="#09090B" strokeWidth="2" />

          {/* Saffron / Warm Orange Inner Ring */}
          <circle cx="50" cy="50" r="44" fill="#F97316" />

          {/* Inner Badge Core */}
          <circle cx="50" cy="50" r="38" fill="#18181B" />

          {/* Radiant Sun/Leaves Decorative Wreath */}
          <g stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
            <path d="M50 14 V20" />
            <path d="M30 18 L34 23" />
            <path d="M70 18 L66 23" />
            <path d="M18 34 L24 37" />
            <path d="M82 34 L76 37" />
            <path d="M22 64 L27 60" />
            <path d="M78 64 L73 60" />
          </g>

          {/* Stylized Civic Fist Emblem */}
          <g fill="#FFFFFF" transform="translate(32, 22) scale(0.36)">
            {/* Forearm */}
            <path d="M35 85 L65 85 L62 55 L38 55 Z" fill="#FFFFFF" />
            {/* Clenched Fist Fingers */}
            <rect x="30" y="30" width="10" height="26" rx="5" fill="#FFFFFF" />
            <rect x="40" y="24" width="10" height="32" rx="5" fill="#FFFFFF" />
            <rect x="50" y="26" width="10" height="30" rx="5" fill="#FFFFFF" />
            <rect x="60" y="32" width="10" height="24" rx="5" fill="#FFFFFF" />
            {/* Thumb wrapped across fingers */}
            <path
              d="M26 48 C24 38, 38 34, 46 36 L48 44 C42 46, 32 46, 26 48 Z"
              fill="#FFFFFF"
            />
          </g>

          {/* Circular Text Inscription: NAGRIK.IN */}
          <path
            id="textPath"
            d="M 22 72 A 34 34 0 0 0 78 72"
            fill="none"
          />
          <text
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="800"
            letterSpacing="2.5"
            fontFamily="monospace"
          >
            <textPath href="#textPath" startOffset="50%" textAnchor="middle">
              NAGRIK.IN
            </textPath>
          </text>
        </svg>
      </div>

      {/* Official Typography: "Nagrik AI" */}
      {showText && (
        <div className="flex items-center tracking-tight">
          <span
            className={`${textSizes[size]} font-display text-slate-900 dark:text-white tracking-tight leading-none`}
          >
            Nagrik{' '}
            <span className="text-slate-900 dark:text-zinc-100 font-extrabold">
              AI
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
