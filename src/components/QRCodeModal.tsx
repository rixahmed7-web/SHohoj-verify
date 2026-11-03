/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Dedicated QR Code Modal & Asset Exporter
 */

import React, { useEffect, useState } from 'react';
import { Certificate } from '../types';
import { generateCertificateQRCode, downloadQRCodePNG, downloadQRCodeSVG, getVerificationUrl } from '../services/qr';
import { X, QrCode, Download, Copy, Check, ExternalLink, Printer } from 'lucide-react';

interface QRCodeModalProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  certificate,
  isOpen,
  onClose,
}) => {
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    generateCertificateQRCode(certificate.verification_token)
      .then((res) => {
        setPngDataUrl(res.pngDataUrl);
        setSvgString(res.svgString);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate QR', err);
        setLoading(false);
      });
  }, [certificate, isOpen]);

  if (!isOpen) return null;

  const verificationUrl = getVerificationUrl(certificate.verification_token);

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Certificate QR Code</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center">
          <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mb-2">
            {certificate.certificate_number}
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {certificate.student_name}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            {certificate.course_title}
          </p>

          {/* QR Container */}
          <div className="w-64 h-64 p-3 bg-white border-2 border-slate-200 rounded-xl shadow-md flex items-center justify-center mb-4">
            {loading ? (
              <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
            ) : pngDataUrl ? (
              <img
                src={pngDataUrl}
                alt="Verification QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-red-500">Failed to render QR</span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 max-w-xs mb-6">
            Scannable with any iOS/Android smartphone camera. Directs to the tamper-proof Shohoj verification page.
          </p>

          {/* Verification URL Input with Copy */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 mb-6 text-left">
            <span className="text-xs font-mono text-slate-600 truncate flex-1">
              {verificationUrl}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-100 transition-colors flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => downloadQRCodePNG(pngDataUrl, certificate.certificate_number)}
              disabled={!pngDataUrl}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download PNG (1024px)</span>
            </button>
            <button
              onClick={() => downloadQRCodeSVG(svgString, certificate.certificate_number)}
              disabled={!svgString}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Vector (SVG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
