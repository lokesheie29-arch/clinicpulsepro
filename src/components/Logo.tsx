import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'dark',
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', pro: 'text-[10px] px-1.5 py-0.5' },
    md: { icon: 'w-9 h-9', text: 'text-xl', pro: 'text-xs px-2 py-0.5' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', pro: 'text-xs px-2.5 py-0.5' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', pro: 'text-sm px-3 py-1' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Brand Icon Emblem */}
      <div className={`relative ${currentSize.icon} shrink-0 rounded-2xl overflow-hidden shadow-sm transition-transform hover:scale-105`}>
        <img
          src="/logo.png"
          alt="ClinicPulse Pro Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-1.5 font-sans leading-none">
          <span
            className={`font-black tracking-tight ${
              variant === 'light' ? 'text-white' : 'text-slate-900'
            } ${currentSize.text}`}
          >
            Clinic<span className={variant === 'light' ? 'text-teal-400' : 'text-teal-600'}>Pulse</span>
          </span>
          <span
            className={`font-extrabold uppercase tracking-wider rounded-lg border shadow-xs ${currentSize.pro} ${
              variant === 'light'
                ? 'bg-teal-400/20 text-teal-300 border-teal-400/30'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-transparent'
            }`}
          >
            PRO
          </span>
        </div>
      )}
    </div>
  );
};
