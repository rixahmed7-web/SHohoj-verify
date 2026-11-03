/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Official Logo Component
 * Uses the official logo provided by Shohoj Aviation Academy with local fallback.
 */

import React, { useState } from 'react';

interface ShohojLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'monochrome-white';
  showTagline?: boolean;
}

export const OFFICIAL_LOGO_URL = 'https://scontent.fdac14-1.fna.fbcdn.net/v/t39.30808-6/840753041_122129088903395202_9198488854400848790_n.jpg?stp=dst-jpg_tt6&cstp=mx1254x1254&ctp=s1254x1254&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEVptrubxqjmsPtc-QpecSoXG9tkuiveEJcb22S6K94QpcyR-6ExWgN5AVS-M9UQoSnHYhWo8qkzmUMm8D32pwX&_nc_ohc=cMXlJd61meEQ7kNvwFibPyA&_nc_oc=Adre7r7iJalF-j3DLzCXYuu5B-I-cwNQ4diT_XYsiXIAXlkzauwZ32IGW1MQCQu8ygI&_nc_zt=23&_nc_ht=scontent.fdac14-1.fna&_nc_gid=9EJp3fnnOG8e8Pm9J3fK6A&_nc_ss=7b2a8&oh=00_AQMGwIoqF1p9eLysPLL3JqfAmuS0bktyYhWfT3aAEfVKBQ&oe=6AD807C4';
export const LOCAL_LOGO_URL = '/shohoj-logo.jpg';

export const ShohojLogo: React.FC<ShohojLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showTagline = false,
}) => {
  const [imgSrc, setImgSrc] = useState(OFFICIAL_LOGO_URL);

  const sizeClasses = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28',
  };

  const isWhite = variant === 'monochrome-white';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-lg ${
          isWhite ? 'bg-white p-1 shadow-sm' : ''
        }`}
      >
        <img
          src={imgSrc}
          alt="Shohoj Aviation Academy Logo"
          className={`${sizeClasses[size]} w-auto object-contain transition-all`}
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== LOCAL_LOGO_URL) {
              setImgSrc(LOCAL_LOGO_URL);
            }
          }}
        />
      </div>

      {showTagline && (
        <span
          className={`text-xs font-medium tracking-wide uppercase border-l pl-3 ml-1 ${
            isWhite ? 'text-slate-300 border-white/20' : 'text-slate-500 border-slate-200'
          }`}
        >
          Dhaka, Bangladesh
        </span>
      )}
    </div>
  );
};
