/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Verification Guide Component
 */

import React from 'react';
import { ShieldCheck, QrCode, Search, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface VerificationGuideProps {
  onStartVerify: () => void;
}

export const VerificationGuide: React.FC<VerificationGuideProps> = ({ onStartVerify }) => {
  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>Employer & Recruiter Verification Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How to Verify Shohoj Aviation Certificates
        </h1>
        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
          Shohoj Aviation Academy credentials incorporate multiple layers of physical and digital security. Follow this guide to confirm candidate credentials for airlines, travel companies, and aviation ground handlers.
        </p>
      </div>

      {/* 2 Ways to Verify Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Method 1: Instant Smartphone QR Scan */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-5">
              <QrCode className="w-6 h-6 text-blue-700" />
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Method 1 (Fastest)
            </span>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Scan the QR Code on the Certificate
            </h2>
            <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
              <li>Open any camera or QR scanner app on your smartphone or tablet.</li>
              <li>Point the lens at the QR code located at the bottom-left corner of the certificate.</li>
              <li>Tap the notification to open our official <code className="bg-slate-100 text-blue-900 px-1 py-0.5 rounded font-mono">verify.shohojaviation.com</code> verification page.</li>
              <li>For privacy protection, enter the graduate's registered full name when prompted.</li>
              <li>Review the real-time institutional database record.</li>
            </ol>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Works natively on iOS Camera & Google Lens
            </span>
          </div>
        </div>

        {/* Method 2: Manual Online Search */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center mb-5">
              <Search className="w-6 h-6 text-amber-700" />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Method 2 (Online Portal)
            </span>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Online Verification Portal
            </h2>
            <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
              <li>Locate the Certificate Number on the printed document (e.g. <span className="font-mono text-slate-800 font-bold">SAA-GDS-TRV-2026-001</span>).</li>
              <li>Navigate to our public portal homepage.</li>
              <li>Input the Certificate Number and the candidate's exact legal full name.</li>
              <li>Click <strong>"Verify Certificate"</strong> to query our secure database.</li>
              <li>View the verified status, course hours, issue dates, and cadet photo.</li>
            </ol>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onStartVerify}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>Go to Verification Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Security Features Breakdown */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 mb-12">
        <h2 className="text-xl font-bold mb-4">Official Anti-Forgery Standards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
          <div>
            <strong className="text-amber-400 block text-sm mb-1">Live Database Validation</strong>
            Every digital record is authenticated against our cloud PostgreSQL database. Printed documents can never bypass a database check.
          </div>
          <div>
            <strong className="text-amber-400 block text-sm mb-1">Immediate Revocation Flag</strong>
            If any student's accreditation is withdrawn due to misconduct or administrative reasons, the verification page immediately displays a clear <span className="text-red-400 font-bold">REVOKED</span> advisory.
          </div>
          <div>
            <strong className="text-amber-400 block text-sm mb-1">Privacy Two-Factor Match</strong>
            We do not reveal candidate credentials simply by scanning or guessing certificate IDs; matching the student's legal name is always required.
          </div>
        </div>
      </div>
    </div>
  );
};
