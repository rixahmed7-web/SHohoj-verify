/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy / Shohoj Trip - Official Footer Component
 */

import React from 'react';
import { ShohojLogo } from './ShohojLogo';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Globe } from 'lucide-react';

export const AcademyFooter: React.FC = () => {
  return (
    <footer id="academy-footer" className="bg-[#071326] text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Academy Brand & Profile */}
          <div className="space-y-4 md:col-span-1">
            <ShohojLogo size="md" variant="monochrome-white" />
            <p className="text-slate-400 leading-relaxed text-xs">
              Premier aviation training organization delivering certified career pathways in airline ticketing (GDS), cabin safety & hospitality, and flight operations.
            </p>
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px]">Official Credential Authority</span>
            </div>
          </div>

          {/* Col 2: Institutional Contact & Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Head Office Location
            </h3>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-white block font-semibold">Shohoj Trip</strong>
                  Office No: C3, Lift-2<br />
                  Tower 71, ECB Chattar,<br />
                  Matikata Road, Dhaka Cantonment,<br />
                  Dhaka-1206, Bangladesh.
                </span>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-mono text-slate-300">
                  +8801810666313, +8801305962300
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>info@shohojtrip.com</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Academic Operations & Web Portal */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Verification & Support
            </h3>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Saturday – Thursday<br />
                  09:00 AM – 06:00 PM (BST / UTC+6)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href="https://www.shohojtrip.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline font-medium"
                >
                  www.shohojtrip.com
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Employer Advisory */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Airline & Employer Notice
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Shohoj Aviation Academy issues physical certificates equipped with high-density QR verification codes. For manual verification requests, apostille authentication, or transcript validation, please contact the Registrar’s office with the candidate’s Certificate ID.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} Shohoj Aviation Academy · Shohoj Trip. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.shohojtrip.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              www.shohojtrip.com
            </a>
            <span>·</span>
            <span>Official Certificate Verification Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
