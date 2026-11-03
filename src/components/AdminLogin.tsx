/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Dedicated Admin Login (Page D)
 * Configured Initial Credentials:
 * Admin ID: Hriidoo
 * Initial Password: 21368574
 * Enforces mandatory password change on first login!
 */

import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { AdminSession } from '../types';
import { ShohojLogo } from './ShohojLogo';
import { Lock, ShieldAlert, KeyRound, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (session: AdminSession) => void;
  onBackToPublic: () => void;
  onOpenSetupGuide?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToPublic,
  onOpenSetupGuide,
}) => {
  const configStatus = storageService.getConfigStatus();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mandatory First-Login Password Change State
  const [pendingSession, setPendingSession] = useState<AdminSession | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!adminId.trim() || !password) {
      setErrorMessage('Please enter both Admin ID and password.');
      return;
    }

    setLoading(true);
    try {
      const session = await storageService.loginAdmin(adminId, password);
      // Check if mandatory password change is required on initial login
      if (session.user.must_change_password) {
        setPendingSession(session);
      } else {
        onLoginSuccess(session);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);

    if (newPassword.length < 8) {
      setPasswordChangeError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    if (newPassword === '21368574') {
      setPasswordChangeError('You cannot reuse the default initial password. Please choose a new secure password.');
      return;
    }

    if (!pendingSession) return;

    setIsChangingPassword(true);
    try {
      await storageService.changeAdminPassword(pendingSession.user.admin_id, password, newPassword);
      const updatedSession = storageService.getSession();
      if (updatedSession) {
        onLoginSuccess(updatedSession);
      }
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // If forced password change on first login
  if (pendingSession) {
    return (
      <div className="w-full max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-8">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-700 border border-amber-200">
            <KeyRound className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-center text-slate-900 mb-1">
            Mandatory Password Change
          </h2>
          <p className="text-xs text-center text-slate-600 mb-6 leading-relaxed">
            As a security requirement for Shohoj Aviation Academy administrators, you must replace your initial default password upon first login.
          </p>

          <form onSubmit={handleMandatoryPasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                New Secure Password
              </label>
              <input
                type="password"
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {passwordChangeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordChangeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-sm shadow-md transition-colors cursor-pointer"
            >
              {isChangingPassword ? 'Securing Account...' : 'Set Password & Enter Dashboard'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => onLoginSuccess(pendingSession)}
                className="text-xs text-slate-500 hover:text-blue-900 font-medium transition-colors cursor-pointer"
              >
                Skip for now & enter dashboard &rarr;
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#091B36] text-white p-6 sm:p-8 text-center border-b border-blue-950">
          <div className="flex justify-center mb-4">
            <ShohojLogo size="md" variant="monochrome-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Staff & Administrator Portal</h1>
          <p className="text-xs text-slate-300 mt-1">
            Shohoj Aviation Academy Certificate Authority
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Missing Configuration Notice if not configured */}
          {!configStatus.isConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-950 block">
                    Real Database Authentication Disabled
                  </strong>
                  <p className="mt-0.5 leading-relaxed text-amber-900">
                    Environment variables (<span className="font-mono text-[10px] bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</span>) are not set. Production database verification and remote Supabase authentication are disabled.
                  </p>
                  {onOpenSetupGuide && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={onOpenSetupGuide}
                        className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                      >
                        View Setup Instructions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="adminId"
                  className="block text-xs uppercase font-bold tracking-wider text-slate-700"
                >
                  Admin User ID <span className="text-red-500">*</span>
                </label>
                {!configStatus.isConfigured && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Demo Mode
                  </span>
                )}
              </div>
              <input
                id="adminId"
                type="text"
                autoComplete="username"
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter Admin ID"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase font-bold tracking-wider text-slate-700 mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter Password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>
                    {configStatus.isConfigured
                      ? 'Authenticate & Enter Console'
                      : 'Enter Demo Administrator Console'}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBackToPublic}
              className="text-xs font-semibold text-slate-600 hover:text-blue-900 transition-colors cursor-pointer"
            >
              ← Back to Public Verification Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
