/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Certificate Verification Result (Page B)
 * Strict validation: Only displays valid credentials when both Cert ID & Student Name match.
 */

import React, { useState } from 'react';
import { PublicVerificationResult } from '../types';
import { InteractiveCertificate } from './InteractiveCertificate';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  QrCode,
  Download,
  Copy,
  Check,
  Building2,
  FileText,
  User,
  ShieldCheck,
  ExternalLink,
  Printer,
  ChevronLeft
} from 'lucide-react';
import { downloadQRCodePNG, downloadQRCodeSVG, generateCertificateQRCode, getVerificationUrl } from '../services/qr';
import { storageService } from '../services/storage';

interface VerificationResultViewProps {
  result: PublicVerificationResult | null;
  searchedCertNumber: string;
  searchedStudentName: string;
  onResetSearch: () => void;
}

export const VerificationResultView: React.FC<VerificationResultViewProps> = ({
  result,
  searchedCertNumber,
  searchedStudentName,
  onResetSearch,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  // If no match found or student name mismatch
  if (!result) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 px-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-lg p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-600 border border-red-200">
            <XCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Verification Unsuccessful
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6 text-left text-sm text-red-900 leading-relaxed">
            <p className="font-semibold text-red-950 mb-1">
              No matching certificate record found. Please check the certificate number and student name.
            </p>
            <p className="text-xs text-red-800">
              For security and student privacy, our verification engine requires both the unique Certificate ID and the student's registered full name to match our institutional records exactly.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs text-slate-600 mb-8 space-y-2">
            <p className="font-semibold text-slate-800 text-sm">Submitted Details:</p>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Certificate Number:</span>
              <span className="font-mono font-medium text-slate-900">{searchedCertNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Student Full Name:</span>
              <span className="font-medium text-slate-900">{searchedStudentName || '—'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onResetSearch}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Try Another Search
            </button>
            <a
              href="#contact"
              onClick={() => {
                document.getElementById('academy-footer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Contact Registrar
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Result IS matched and verified
  const isValid = result.status === 'VALID';
  const verificationUrl = getVerificationUrl(result.verification_token);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = async (format: 'png' | 'svg') => {
    setDownloadingQr(true);
    try {
      const qrData = await generateCertificateQRCode(result.verification_token);
      if (format === 'png') {
        downloadQRCodePNG(qrData.pngDataUrl, result.certificate_number);
      } else {
        downloadQRCodeSVG(qrData.svgString, result.certificate_number);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingQr(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-10 px-4 sm:px-6">
      {/* Top back navigation button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onResetSearch}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>New Certificate Verification</span>
        </button>
        <span className="text-xs font-mono text-slate-500">
          Ref: {result.certificate_number}
        </span>
      </div>

      {/* Main Verification Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Status Header Banner */}
        <div
          className={`px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isValid
              ? 'bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white'
              : 'bg-linear-to-r from-red-900 via-red-800 to-rose-950 text-white'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {isValid ? (
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-red-300" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {isValid ? 'Official Verified Certificate' : 'Certificate Revoked'}
                </h1>
                <span
                  className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-sm tracking-wide ${
                    isValid
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                      : 'bg-red-400/20 text-red-200 border border-red-400/30'
                  }`}
                >
                  {result.status}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Authentic record confirmed in Shohoj Aviation Academy institutional database.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 block">
              Official Issuer
            </span>
            <span className="font-semibold text-sm text-white block">
              Shohoj Aviation Academy
            </span>
          </div>
        </div>

        {/* Revocation Warning Box if status is Revoked */}
        {!isValid && (
          <div className="p-6 bg-red-50 border-b border-red-200 text-red-950 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">
                  Notice to Employers and Aviation Authorities
                </p>
                <p className="text-xs text-red-800 mt-1">
                  This certificate was revoked by Shohoj Aviation Academy on{' '}
                  <strong>{result.revocation_date ? new Date(result.revocation_date).toLocaleDateString() : 'Official Notice'}</strong>.
                  {result.revocation_reason && (
                    <span className="block mt-1 font-mono text-[11px] bg-red-100 p-2 rounded-sm border border-red-300">
                      Reason: {result.revocation_reason}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Student & Course Details Grid */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column: Student photograph & ID lockup */}
            <div className="flex flex-col items-center text-center">
              <div className="w-36 h-44 rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-md flex items-center justify-center relative mb-3">
                {result.student_photo_url ? (
                  <img
                    src={result.student_photo_url}
                    alt={result.student_name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                    <User className="w-16 h-16 text-slate-300 mb-1" />
                    <span className="text-[11px] font-medium text-slate-500">Official Cadet Photo</span>
                  </div>
                )}
                {/* Official Stamp icon badge */}
                <div className="absolute bottom-1 right-1 bg-blue-900 text-white p-1 rounded-full shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>

              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Certified Graduate
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {result.student_name}
              </h2>
              <span className="text-xs font-mono font-medium text-blue-800 mt-1 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                {result.certificate_number}
              </span>
            </div>

            {/* Right two columns: Course & Accreditation Details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Course Title / Program of Study
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-blue-950 mt-1 leading-snug">
                  {result.course_title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Course Duration</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {result.course_duration}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Completion Date</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {result.completion_date}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Certificate Issue Date</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {result.issue_date}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Issuing Institution</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    Shohoj Aviation Academy · Shohoj Trip
                  </span>
                </div>
              </div>

              {/* Official HR / Airline Verification Statement */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/70 text-slate-800 text-xs leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-950 font-semibold block mb-0.5">
                      Institutional Verification Statement
                    </strong>
                    This credential was issued by <strong>Shohoj Aviation Academy</strong> in accordance with aviation curriculum standards and regulatory guidelines. Employers, airlines, and authorities can rely on this record as proof of training completion.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: View Certificate, QR Code Download, Share URL */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCertificateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>View Full Certificate</span>
              </button>

              <button
                onClick={() => handleDownloadQR('png')}
                disabled={downloadingQr}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
                title="Download 1024x1024 High-Resolution QR Code (PNG)"
              >
                <QrCode className="w-4 h-4 text-slate-600" />
                <span>Download QR (PNG)</span>
              </button>

              <button
                onClick={() => handleDownloadQR('svg')}
                disabled={downloadingQr}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
                title="Download Scalable Vector QR Code (SVG)"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>QR (SVG)</span>
              </button>
            </div>

            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-slate-50 text-slate-700 hover:text-blue-900 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Verification URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full Certificate Modal Preview */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl p-4 sm:p-6 overflow-hidden">
            <InteractiveCertificate
              certificate={result}
              onClose={() => setShowCertificateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
