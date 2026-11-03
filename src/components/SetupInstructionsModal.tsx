/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Setup Instructions Modal
 * Displays clear step-by-step instructions to configure Supabase and environment variables.
 */

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Terminal, Database, Key, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storage';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Quick live test connection inputs
  const [testUrl, setTestUrl] = useState('');
  const [testKey, setTestKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const envTemplate = `# Shohoj Aviation Academy - Environment Configuration
VITE_APP_URL="https://verify.shohojaviation.com"

# Supabase PostgreSQL & Storage (Free Tier)
# Found in: Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleQuickConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim() || !testKey.trim()) return;
    storageService.saveCustomSupabaseConfig(testUrl.trim(), testKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onConfigSaved) onConfigSaved();
      onClose();
    }, 1200);
  };

  const configStatus = storageService.getConfigStatus();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 text-slate-900">
        {/* Header */}
        <div className="bg-[#091B36] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Database & Environment Setup</h2>
              <p className="text-xs text-slate-300">
                Shohoj Aviation Academy Certificate Verification Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-md"
            aria-label="Close setup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Current Status Banner */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <strong className="font-bold text-amber-950 block text-sm mb-0.5">
                {configStatus.isConfigured ? 'Production Database Connected' : 'Running in Demo Mode (Local Sandbox)'}
              </strong>
              {configStatus.isConfigured ? (
                <span>Your application is communicating with your remote Supabase instance.</span>
              ) : (
                <span>
                  Environment variables (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950">VITE_SUPABASE_ANON_KEY</code>) have not been configured. The website preview runs smoothly on authentic pre-seeded demo records without crashing. Follow the 3 steps below to activate real production verification and admin authentication.
                </span>
              )}
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Setup Instructions (Free Tier)
            </h3>

            {/* Step 1 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-sm">Step 1: Create a Free Supabase Project</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                >
                  <span>supabase.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p>
                Sign up for a free Supabase account and click <strong>"New Project"</strong>. Choose a name (e.g. <span className="font-mono">shohoj-aviation</span>) and set a secure database password.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
              <span className="font-bold text-blue-900 text-sm block">Step 2: Run Database Schema in SQL Editor</span>
              <p>
                In your Supabase project dashboard, click <strong>SQL Editor</strong> in the left sidebar, paste the contents of <span className="font-mono font-semibold">/supabase/schema.sql</span>, and click <strong>Run</strong>.
              </p>
              <p className="text-[11px] text-slate-500">
                This automatically creates the <code className="font-mono">certificates</code> table, Row Level Security (RLS) policies, public verification stored procedure, and storage buckets.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-sm">Step 3: Configure Environment Variables</span>
                <button
                  onClick={handleCopyEnv}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedEnv ? 'Copied' : 'Copy .env Template'}</span>
                </button>
              </div>
              <p>
                In Supabase, go to <strong>Project Settings</strong> &rarr; <strong>API</strong>. Copy your <strong>Project URL</strong> and <strong>Project API key (anon public)</strong> into your <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">.env</code> file:
              </p>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                {envTemplate}
              </pre>
            </div>
          </div>

          {/* Quick Connect Form for Live Preview Testing */}
          <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 mb-1">
              Connect Directly in Browser Preview (Optional)
            </h4>
            <p className="text-xs text-slate-600 mb-4">
              You can also test your remote database connection right now by entering your credentials below:
            </p>

            <form onSubmit={handleQuickConnect} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://xyzabcdef.supabase.co"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-700 mb-1">
                  Supabase Anon Public Key
                </label>
                <input
                  type="text"
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {savedSuccess && (
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Connected successfully! Reloading...</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Connect Database
                </button>
                {configStatus.isConfigured && (
                  <button
                    type="button"
                    onClick={() => {
                      storageService.clearCustomSupabaseConfig();
                      if (onConfigSaved) onConfigSaved();
                      onClose();
                    }}
                    className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    Switch Back to Demo Mode
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Preview will continue functioning with demo data.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Continue in Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
};
