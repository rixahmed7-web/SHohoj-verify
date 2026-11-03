/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Public Navbar
 * Follows Top Bar Contract: 3 distinct zones, clean typography, single-line links.
 */

import React from 'react';
import { ShohojLogo } from './ShohojLogo';
import { ShieldCheck, Lock, CheckCircle2, PhoneCall } from 'lucide-react';

interface PublicNavbarProps {
  currentView: 'home' | 'admin' | 'how-to';
  onNavigate: (view: 'home' | 'admin' | 'how-to') => void;
  isAdminLoggedIn?: boolean;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentView,
  onNavigate,
  isAdminLoggedIn = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          {/* Zone 1: Brand Wordmark (Single text & logo element) */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg group"
            aria-label="Shohoj Aviation Academy Home"
          >
            <ShohojLogo size="md" />
          </button>

          {/* Zone 2: 4 Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'home' ? 'text-blue-700 font-semibold' : ''
              }`}
            >
              Verify Certificate
            </button>
            <button
              onClick={() => onNavigate('how-to')}
              className={`hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'how-to' ? 'text-blue-700 font-semibold' : ''
              }`}
            >
              Verification Guide
            </button>
            <a
              href="#programs"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('accredited-courses')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              Aviation Programs
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('academy-footer')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              Contact Academy
            </a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('admin')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-blue-900 text-white hover:bg-blue-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="whitespace-nowrap shrink-0">
                {isAdminLoggedIn ? 'Admin Console' : 'Staff Login'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

