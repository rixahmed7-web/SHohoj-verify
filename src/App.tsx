/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Certificate Verification System
 * Complete full-stack responsive web application.
 */

import React, { useEffect, useState } from 'react';
import { PublicNavbar } from './components/PublicNavbar';
import { PublicVerificationHome } from './components/PublicVerificationHome';
import { VerificationResultView } from './components/VerificationResultView';
import { QRVerificationHandler } from './components/QRVerificationHandler';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { VerificationGuide } from './components/VerificationGuide';
import { AcademyFooter } from './components/AcademyFooter';
import { SetupInstructionsModal } from './components/SetupInstructionsModal';
import { storageService } from './services/storage';
import { AdminSession, PublicVerificationResult } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'result' | 'admin' | 'how-to'>('home');
  const [qrToken, setQrToken] = useState<string | null>(null);

  // Search Results State
  const [searchedCertNumber, setSearchedCertNumber] = useState('');
  const [searchedStudentName, setSearchedStudentName] = useState('');
  const [verificationResult, setVerificationResult] = useState<PublicVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin Auth State
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  // Setup Guide Modal (accessible inside Admin Dashboard)
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  // Check URL on load for QR token or direct /admin routing
  useEffect(() => {
    // 1. Check existing session
    const activeSession = storageService.getSession();
    if (activeSession) {
      setAdminSession(activeSession);
    }

    // 2. Check query params or pathname for QR token
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = urlParams.get('token');

    // Or path matching /verify/:token
    const path = window.location.pathname;
    const pathMatch = path.match(/\/verify\/([^/]+)/);
    const tokenFromPath = pathMatch ? pathMatch[1] : null;

    const detectedToken = tokenFromQuery || tokenFromPath;
    if (detectedToken) {
      setQrToken(detectedToken);
      return;
    }

    // 3. Check for admin route in hash or pathname
    if (path.startsWith('/admin') || window.location.hash === '#admin') {
      setCurrentView('admin');
    }
  }, []);

  // Handle Public Search Verification
  const handleVerify = async (certNumber: string, studentName: string) => {
    setIsVerifying(true);
    setSearchedCertNumber(certNumber);
    setSearchedStudentName(studentName);

    try {
      const result = await storageService.verifyCertificate(certNumber, studentName);
      setVerificationResult(result);
      setCurrentView('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      setVerificationResult(null);
      setCurrentView('result');
    } finally {
      setIsVerifying(false);
    }
  };

  // QR verification callback when student name is confirmed
  const handleQRVerified = (result: PublicVerificationResult | null, certNum: string, stuName: string) => {
    setQrToken(null);
    // Clean URL query params without reloading
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    setSearchedCertNumber(certNum);
    setSearchedStudentName(stuName);
    setVerificationResult(result);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = (session: AdminSession) => {
    setAdminSession(session);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    storageService.logoutAdmin();
    setAdminSession(null);
    setCurrentView('home');
  };

  const handlePreviewFromAdmin = (certNum: string, stuName: string) => {
    handleVerify(certNum, stuName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* If QR Code was scanned via smartphone, present dedicated QR confirmation gate */}
      {qrToken ? (
        <main className="flex-1 flex flex-col justify-center py-10 bg-slate-100">
          <QRVerificationHandler
            token={qrToken}
            onVerified={handleQRVerified}
            onCancel={() => {
              setQrToken(null);
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
              setCurrentView('home');
            }}
          />
        </main>
      ) : currentView === 'admin' && adminSession ? (
        /* Authenticated Admin Dashboard */
        <AdminDashboard
          session={adminSession}
          onLogout={handleAdminLogout}
          onPreviewPublic={handlePreviewFromAdmin}
          onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        />
      ) : (
        /* Public Portal Layout with Unified Navbar & Footer */
        <>
          <PublicNavbar
            currentView={currentView === 'result' ? 'home' : currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isAdminLoggedIn={Boolean(adminSession)}
          />

          <main className="flex-1 flex flex-col">
            {currentView === 'home' && (
              <PublicVerificationHome
                onVerify={handleVerify}
                isLoading={isVerifying}
                prefilledCertNumber={searchedCertNumber}
              />
            )}

            {currentView === 'result' && (
              <VerificationResultView
                result={verificationResult}
                searchedCertNumber={searchedCertNumber}
                searchedStudentName={searchedStudentName}
                onResetSearch={() => {
                  setCurrentView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentView === 'admin' && !adminSession && (
              <div className="py-12 bg-slate-100 flex-1 flex flex-col justify-center">
                <AdminLogin
                  onLoginSuccess={handleAdminLoginSuccess}
                  onBackToPublic={() => setCurrentView('home')}
                />
              </div>
            )}

            {currentView === 'how-to' && (
              <VerificationGuide
                onStartVerify={() => {
                  setCurrentView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>

          <AcademyFooter />
        </>
      )}

      {/* Setup Instructions Modal for Admin */}
      <SetupInstructionsModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />
    </div>
  );
}
