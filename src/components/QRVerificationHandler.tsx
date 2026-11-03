/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - QR Code Verification Gateway (Page C)
 * Triggered when a QR code on a physical certificate is scanned.
 * Step 1: Identifies certificate token
 * Step 2: Asks visitor for student's full name to confirm identity and prevent unauthorized scraping
 * Step 3: Verifies against database and displays certificate
 */

import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storage';
import { PublicVerificationResult } from '../types';
import { ShohojLogo } from './ShohojLogo';
import { QrCode, ShieldCheck, UserCheck, AlertCircle, ArrowRight, Lock } from 'lucide-react';

interface QRVerificationHandlerProps {
  token: string;
  onVerified: (result: PublicVerificationResult | null, certNumber: string, studentName: string) => void;
  onCancel: () => void;
}

export const QRVerificationHandler: React.FC<QRVerificationHandlerProps> = ({
  token,
  onVerified,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState<{ certificate_number: string; course_title: string; status: string } | null>(null);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let active = true;
    storageService.getCertificateHintByToken(token).then((data) => {
      if (!active) return;
      setHint(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameInput.trim()) {
      setErrorMsg("Please enter the student's full name.");
      return;
    }
    if (!hint) return;

    setVerifying(true);
    setErrorMsg(null);
    try {
      const match = await storageService.verifyCertificate(hint.certificate_number, studentNameInput.trim());
      onVerified(match, hint.certificate_number, studentNameInput.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing verification');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto my-16 p-8 bg-white rounded-xl shadow-lg border border-slate-200 text-center">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Processing QR Verification Token...</h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to Shohoj Aviation Academy records...</p>
      </div>
    );
  }

  if (!hint) {
    return (
      <div className="w-full max-w-lg mx-auto my-16 p-8 bg-white rounded-xl shadow-lg border border-red-200 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid or Expired QR Token</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          The scanned QR code token <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">{token}</code> is not recognized in our official registry.
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          Go to Standard Verification Search
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-linear-to-r from-blue-950 to-blue-900 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold">QR Certificate Scanned</h2>
          <p className="text-xs text-blue-200 mt-1">
            Official Shohoj Aviation Academy Verification Request
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Certificate Pre-fill Identification Notice */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Certificate Identified:</span>
              <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                {hint.certificate_number}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Aviation Program:</span>
              <span className="font-semibold text-slate-800 text-right max-w-[240px] truncate">
                {hint.course_title}
              </span>
            </div>
          </div>

          {/* Prompt Visitor for Student Full Name */}
          <div className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">Identity Confirmation Required</span>
              To protect student privacy and comply with aviation accreditation standards, please enter the graduate's registered full name to reveal the official certificate record.
            </div>
          </div>

          <form onSubmit={handleConfirmSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="qrStudentName"
                className="block text-xs uppercase font-bold tracking-wider text-slate-700 mb-1.5"
              >
                Student Registered Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="qrStudentName"
                type="text"
                autoFocus
                value={studentNameInput}
                onChange={(e) => {
                  setStudentNameInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter exact full name as on certificate"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 px-5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {verifying ? (
                <span>Confirming Record...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Confirm Name & Reveal Certificate</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel and search by Certificate Number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
