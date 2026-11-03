/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - QR Code Generation & Verification Engine
 * Free tier, client-side & offline-capable. No third-party paid subscriptions.
 */

import QRCode from 'qrcode';

export interface QRCodeData {
  url: string;
  pngDataUrl: string;
  svgString: string;
}

export function getVerificationUrl(verificationToken: string): string {
  // Respect VITE_APP_URL or fallback to current browser origin
  const baseUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://verify.shohojaviation.com');
  // Both query param & path supported: /verify/:token or ?token=:token
  return `${baseUrl.replace(/\/$/, '')}/?token=${encodeURIComponent(verificationToken)}`;
}

export async function generateCertificateQRCode(verificationToken: string): Promise<QRCodeData> {
  const url = getVerificationUrl(verificationToken);

  // Generate ultra high-resolution PNG for crisp high-density print (e.g. 1024px)
  const pngDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H', // High error correction (30% recoverable)
    margin: 2,
    width: 1024,
    color: {
      dark: '#0B2545', // Premium Shohoj Aviation Academy deep navy
      light: '#FFFFFF',
    },
  });

  // Generate crisp vector SVG
  const svgString = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0B2545',
      light: '#FFFFFF',
    },
  });

  return {
    url,
    pngDataUrl,
    svgString,
  };
}

export function downloadQRCodePNG(pngDataUrl: string, certificateNumber: string) {
  const link = document.createElement('a');
  link.download = `QR_${certificateNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  link.href = pngDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadQRCodeSVG(svgString: string, certificateNumber: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `QR_${certificateNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
