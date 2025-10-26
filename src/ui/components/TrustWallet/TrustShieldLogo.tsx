import React from 'react';

interface TrustShieldLogoProps {
  size?: number;
  className?: string;
}

export const TrustShieldLogo: React.FC<TrustShieldLogoProps> = ({
  size = 100,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`trust-shield-logo ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: '#06B6D4', stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <path
        d="M 50 15 L 75 25 L 75 50 Q 75 70 50 85 Q 25 70 25 50 L 25 25 Z"
        fill="url(#shieldGradient)"
        stroke="none"
      />
    </svg>
  );
};
