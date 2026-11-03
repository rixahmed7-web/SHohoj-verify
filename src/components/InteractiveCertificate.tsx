/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Interactive & Printable Certificate
 * Rendered with navy blue and gold accents, official seals, and security guilloche borders.
 */

import React, { useEffect, useState } from 'react';
import { Certificate, PublicVerificationResult } from '../types';
import { ShohojLogo } from './ShohojLogo';
import { generateCertificateQRCode } from '../services/qr';
import { Printer, Download, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

interface InteractiveCertificateProps {
  certificate: Certificate | PublicVerificationResult;
  onClose?: () => void;
}

export const InteractiveCertificate: React.FC<InteractiveCertificateProps> = ({
  certificate,
  onClose,
}) => {
  const [qrPngUrl, setQrPngUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    generateCertificateQRCode(certificate.verification_token)
      .then((res) => {
        if (active) setQrPngUrl(res.pngDataUrl);
      })
      .catch((err) => console.error('Failed to generate cert QR', err));
    return () => {
      active = false;
    };
  }, [certificate.verification_token]);

  const handlePrint = () => {
    window.print();
  };

  const isRevoked = certificate.status === 'REVOKED';

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto my-6 print:m-0 print:p-0">
      {/* Top action toolbar (hidden during printing) */}
      <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-slate-800 text-sm">
            Official Academy Credential Document
          </span>
          {isRevoked ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-red-100 text-red-700 ml-2">
              REVOKED STATUS
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 ml-2">
              VERIFIED OFFICIAL
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Certificate Frame */}
      <div
        id="printable-certificate"
        className="relative w-full aspect-[1.414/1] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xs border-12 border-[#0B2545] select-none overflow-hidden print:shadow-none print:border-8 print:w-full"
      >
        {/* Revoked watermark overlay if revoked */}
        {isRevoked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-red-950/15">
            <div className="transform -rotate-25 border-8 border-red-600/80 px-12 py-4 rounded-lg">
              <span className="text-5xl sm:text-7xl font-extrabold tracking-widest text-red-600/80 font-mono">
                REVOKED
              </span>
            </div>
          </div>
        )}

        {/* Inner Gold Guilloche Border */}
        <div className="absolute inset-3 border-2 border-amber-500/80 pointer-events-none">
          <div className="absolute inset-1 border border-amber-400/40" />
          {/* Corner gold motifs */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full text-center px-4 py-2">
          {/* Header & Logo */}
          <div className="flex flex-col items-center">
            <div className="mb-2">
              <ShohojLogo size="lg" />
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-semibold">
              Civil Aviation & Professional Aeronautics Training Institute
            </p>
            <p className="text-[11px] text-slate-400">
              Approved Professional Aviation Academy • Dhaka, Bangladesh
            </p>

            <div className="my-4 flex items-center justify-center w-full max-w-md">
              <div className="h-px bg-linear-to-r from-transparent via-amber-400 to-transparent flex-1" />
              <span className="px-4 text-xs font-serif text-amber-700 tracking-widest uppercase font-bold">
                Official Credential
              </span>
              <div className="h-px bg-linear-to-r from-transparent via-amber-400 to-transparent flex-1" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-wide text-slate-900 uppercase">
              Certificate of Achievement
            </h1>
          </div>

          {/* Student & Course Details */}
          <div className="my-3 space-y-3">
            <p className="text-xs sm:text-sm text-slate-600 italic font-serif">
              This is to officially certify that
            </p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-blue-950 font-serif tracking-normal border-b-2 border-amber-400/60 pb-1 inline-block px-8 max-w-xl">
              {certificate.student_name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed pt-1">
              has successfully completed all prescribed coursework, flight simulator / laboratory training, and examinations for the professional program:
            </p>
            <div className="py-1">
              <span className="text-base sm:text-2xl font-bold text-amber-800 font-sans tracking-tight">
                {certificate.course_title}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Course Duration: <strong className="text-slate-800">{certificate.course_duration}</strong>
              <span className="mx-2">·</span>
              Completion Date: <strong className="text-slate-800">{certificate.completion_date}</strong>
            </p>
          </div>

          {/* Footer: QR Code, Seal, Signatures */}
          <div className="grid grid-cols-3 items-end pt-4 border-t border-slate-200 mt-2 text-left">
            {/* Left: QR Code & Verification Token */}
            <div className="flex items-center gap-3">
              {qrPngUrl ? (
                <img
                  src={qrPngUrl}
                  alt="Certificate Verification QR Code"
                  className="w-20 h-20 border border-slate-300 p-1 bg-white shadow-xs rounded-xs"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                  QR Code
                </div>
              )}
              <div className="text-[10px] text-slate-500 leading-tight">
                <span className="font-semibold text-slate-700 block">Scan to Verify</span>
                <span className="font-mono text-slate-800 font-bold block mt-0.5">
                  {certificate.certificate_number}
                </span>
                <span className="text-[9px] text-slate-400">verify.shohojaviation.com</span>
              </div>
            </div>

            {/* Middle: Golden Foil Embossed Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-amber-500 bg-linear-to-tr from-amber-500 via-amber-300 to-amber-600 p-1 shadow-lg flex items-center justify-center text-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-amber-800/60 flex flex-col items-center justify-center p-1 bg-amber-400/90 text-amber-950">
                  <span className="text-[8px] font-bold tracking-widest uppercase">SHOHOJ</span>
                  <Award className="w-5 h-5 text-amber-900 my-0.5" />
                  <span className="text-[7px] font-extrabold uppercase tracking-tight">OFFICIAL SEAL</span>
                  <span className="text-[6px] tracking-tight">DHAKA, BANGLADESH</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-600 mt-1">
                Issued: {certificate.issue_date}
              </span>
            </div>

            {/* Right: Signatures */}
            <div className="text-right flex flex-col items-end">
              <div className="w-40 border-b border-slate-400 pb-1 text-center font-serif italic text-base text-blue-900 font-bold">
                Md. Zahidul Islam
              </div>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mt-1">
                Director of Training
              </p>
              <p className="text-[10px] text-slate-500">
                Shohoj Aviation Academy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
