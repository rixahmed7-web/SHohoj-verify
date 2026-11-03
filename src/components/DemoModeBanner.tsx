/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Demo Mode Banner
 * Informs the user that preview is running on demo data without crashing, with clear setup instructions.
 */

import React, { useState } from 'react';
import { Info, Sparkles, Wrench, X, ExternalLink } from 'lucide-react';

interface DemoModeBannerProps {
  onOpenSetupGuide: () => void;
  isConfigured: boolean;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({
  onOpenSetupGuide,
  isConfigured,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isConfigured) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white text-xs py-2 px-4 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Info className="w-4 h-4 text-amber-100 shrink-0" />
          <span className="font-semibold text-white whitespace-nowrap">
            Demo Preview Mode:
          </span>
          <span className="text-amber-100 truncate hidden sm:inline">
            Environment variables not configured yet. Running with offline demo certificates without crashing.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSetupGuide}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded font-bold text-[11px] transition-colors border border-white/30 flex items-center gap-1 cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-amber-200" />
            <span>Setup Instructions</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded text-amber-100 hover:text-white transition-colors"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
