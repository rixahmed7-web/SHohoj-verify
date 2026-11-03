/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Admin Dashboard (Page E)
 */

import React, { useEffect, useState } from 'react';
import { Certificate, AdminSession, AuditLog } from '../types';
import { storageService } from '../services/storage';
import { CertificateFormModal } from './CertificateFormModal';
import { QRCodeModal } from './QRCodeModal';
import { InteractiveCertificate } from './InteractiveCertificate';
import { ShohojLogo } from './ShohojLogo';
import {
  FileText,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  QrCode,
  ExternalLink,
  Eye,
  LogOut,
  RefreshCw,
  Database,
  History,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Copy,
  Check,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { getVerificationUrl } from '../services/qr';

interface AdminDashboardProps {
  session: AdminSession;
  onLogout: () => void;
  onPreviewPublic: (certNumber: string, studentName: string) => void;
  onOpenSetupGuide?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  onLogout,
  onPreviewPublic,
  onOpenSetupGuide,
}) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'certificates' | 'audit' | 'database'>('certificates');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED'>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [qrCert, setQrCert] = useState<Certificate | null>(null);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  // Revoke Dialog Modal
  const [revokingCert, setRevokingCert] = useState<Certificate | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Password Change Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Supabase Custom Config
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState('');
  const [customAnonKey, setCustomAnonKey] = useState('');
  const [supabaseSavedMsg, setSupabaseSavedMsg] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    const list = await storageService.getAllCertificates();
    setCertificates(list);
    setAuditLogs(storageService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCerts = certificates.length;
  const validCerts = certificates.filter((c) => c.status === 'VALID').length;
  const revokedCerts = certificates.filter((c) => c.status === 'REVOKED').length;

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      c.certificate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    setEditingCert(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setIsFormModalOpen(true);
  };

  const handleFormSave = () => {
    loadData();
  };

  const handleInitiateRevoke = (cert: Certificate) => {
    setRevokingCert(cert);
    setRevocationReasonInput('Academic audit non-compliance or credential withdrawal.');
  };

  const handleConfirmRevoke = async () => {
    if (!revokingCert) return;
    setIsRevoking(true);
    try {
      await storageService.revokeCertificate(revokingCert.id, revocationReasonInput);
      setRevokingCert(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to revoke certificate');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReissue = async (cert: Certificate) => {
    if (confirm(`Reissue and restore certificate "${cert.certificate_number}" for ${cert.student_name}?`)) {
      try {
        await storageService.reissueCertificate(cert.id);
        loadData();
      } catch (e: any) {
        alert(e.message || 'Failed to reissue');
      }
    }
  };

  const handleCopyUrl = (cert: Certificate) => {
    const url = getVerificationUrl(cert.verification_token);
    navigator.clipboard.writeText(url);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (newPass !== confirmNewPass) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      await storageService.changeAdminPassword(session.user.admin_id, currentPass, newPass);
      setPassSuccess('Password successfully updated!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setCurrentPass('');
        setNewPass('');
        setConfirmNewPass('');
        setPassSuccess(null);
      }, 1500);
    } catch (e: any) {
      setPassError(e.message || 'Failed to update password');
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveCustomSupabaseConfig(customSupabaseUrl.trim(), customAnonKey.trim());
    setSupabaseSavedMsg(true);
    setTimeout(() => setSupabaseSavedMsg(false), 3000);
    loadData();
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shohoj_Aviation_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        storageService.importDataJSON(event.target?.result as string);
        loadData();
        alert('Database restored successfully from backup!');
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const supabaseStatus = storageService.getSupabaseStatus();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar Contract for Admin */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Zone 1: Brand wordmark & Console Label */}
            <div className="flex items-center gap-4">
              <ShohojLogo size="sm" variant="monochrome-white" />
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-slate-400 border-l border-slate-700 pl-4 font-mono">
                Admin Console
              </span>
            </div>

            {/* Zone 2: Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'certificates' ? 'bg-blue-800 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Certificates ({certificates.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'audit' ? 'bg-blue-800 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'database' ? 'bg-blue-800 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Cloud Database
              </button>
            </nav>

            {/* Zone 3: Admin Profile & Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                title="Change Password"
                className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded-md"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-300 hidden md:inline">
                {session.user.admin_id}
              </span>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-200 transition-colors border border-red-800/60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Total Issued Credentials
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {totalCerts}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700">
                Active Valid Certificates
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
                {validCerts}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-red-700">
                Revoked Credentials
              </span>
              <p className="text-2xl font-bold font-mono text-red-800 mt-1 tabular-nums">
                {revokedCerts}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-700 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* TAB 1: CERTIFICATES MANAGEMENT */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            {/* Toolbar: Search, Filter & Add Button */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, student name, or course..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({certificates.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('VALID')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === 'VALID' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Valid ({validCerts})
                  </button>
                  <button
                    onClick={() => setStatusFilter('REVOKED')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === 'REVOKED' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Revoked ({revokedCerts})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Issue New Certificate</span>
                </button>
              </div>
            </div>

            {/* Certificates Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Course Title</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCerts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-medium">No certificates found matching filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCerts.map((cert) => {
                        const isValid = cert.status === 'VALID';
                        return (
                          <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-950">
                              {cert.certificate_number}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                  {cert.student_photo_url ? (
                                    <img src={cert.student_photo_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-bold text-slate-500 text-xs">
                                      {cert.student_name[0]}
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-slate-900">{cert.student_name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs truncate text-slate-800">
                              {cert.course_title}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums">
                              {cert.issue_date}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm border ${
                                  isValid
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                                }`}
                              >
                                {cert.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Preview Public Verification */}
                                <button
                                  onClick={() => onPreviewPublic(cert.certificate_number, cert.student_name)}
                                  title="Test Public Verification"
                                  className="p-1.5 text-slate-500 hover:text-blue-900 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {/* Interactive Certificate Preview */}
                                <button
                                  onClick={() => setPreviewCert(cert)}
                                  title="View Official Certificate"
                                  className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* QR Code Modal */}
                                <button
                                  onClick={() => setQrCert(cert)}
                                  title="Download QR Code (PNG/SVG)"
                                  className="p-1.5 text-slate-500 hover:text-blue-900 transition-colors"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>

                                {/* Copy Link */}
                                <button
                                  onClick={() => handleCopyUrl(cert)}
                                  title="Copy Verification Link"
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 transition-colors"
                                >
                                  {copiedId === cert.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => handleEdit(cert)}
                                  title="Edit Certificate"
                                  className="p-1.5 text-slate-500 hover:text-blue-900 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Revoke / Reissue */}
                                {isValid ? (
                                  <button
                                    onClick={() => handleInitiateRevoke(cert)}
                                    title="Revoke Certificate"
                                    className="p-1.5 text-slate-400 hover:text-red-700 transition-colors"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReissue(cert)}
                                    title="Reissue / Restore Certificate"
                                    className="p-1.5 text-slate-400 hover:text-emerald-700 transition-colors"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Security & Operational Audit Log</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological tamper-evident trail of administrative mutations and verification queries.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {auditLogs.length} events logged
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                      {log.certificate_id && (
                        <span className="font-mono text-slate-600">
                          Cert: {log.certificate_id}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0 text-[11px] text-slate-500">
                    <span className="block font-medium text-slate-700">{log.actor}</span>
                    <span className="font-mono tabular-nums">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLOUD DATABASE & BACKUP */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <Database className="w-6 h-6 text-blue-800" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Database & Storage Configuration</h2>
                  <p className="text-xs text-slate-500">
                    Connect your free Supabase PostgreSQL project or utilize browser-backed persistence.
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-blue-950 block">Current Database Engine:</span>
                  <p className="text-xs text-slate-700 font-mono mt-0.5">{supabaseStatus.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenSetupGuide && (
                    <button
                      type="button"
                      onClick={onOpenSetupGuide}
                      className="px-3 py-1 text-xs font-semibold bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Setup Instructions
                    </button>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${supabaseStatus.isConfigured ? 'bg-emerald-800 text-white' : 'bg-amber-600 text-white'}`}>
                    {supabaseStatus.isConfigured ? 'Supabase Active' : 'Demo Sandbox Active'}
                  </span>
                </div>
              </div>

              {/* Configure Custom Supabase Form */}
              <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={customSupabaseUrl}
                    onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="text"
                    value={customAnonKey}
                    onChange={(e) => setCustomAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white"
                  />
                </div>

                {supabaseSavedMsg && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    ✓ Configuration saved! Testing connection...
                  </p>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Save & Connect Supabase
                </button>
              </form>
            </div>

            {/* Data Export / Import Backup */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">Institutional Backup & Disaster Recovery</h3>
              <p className="text-xs text-slate-600 mb-6">
                Export an encrypted JSON snapshot of all issued certificates and audit history, or restore from a previously verified archive.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download Database JSON Backup</span>
                </button>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 transition-colors cursor-pointer">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span>Restore from JSON Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Create / Edit Certificate */}
      {isFormModalOpen && (
        <CertificateFormModal
          isOpen={isFormModalOpen}
          initialCertificate={editingCert}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleFormSave}
        />
      )}

      {/* MODAL 2: QR Code Viewer & Download */}
      {qrCert && (
        <QRCodeModal
          certificate={qrCert}
          isOpen={Boolean(qrCert)}
          onClose={() => setQrCert(null)}
        />
      )}

      {/* MODAL 3: Interactive Certificate Preview */}
      {previewCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl p-4 sm:p-6 overflow-hidden">
            <InteractiveCertificate
              certificate={previewCert}
              onClose={() => setPreviewCert(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmation Dialog for Revoking Certificate */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">
              Revoke Certificate?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4">
              You are about to revoke <strong>{revokingCert.certificate_number}</strong> issued to <strong>{revokingCert.student_name}</strong>. The public verification page and QR code will immediately reflect this revocation.
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                Official Revocation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={revocationReasonInput}
                onChange={(e) => setRevocationReasonInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setRevokingCert(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Password Change Dialog */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Change Administrator Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Account: {session.user.admin_id}
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              {passError && (
                <p className="text-xs text-red-600 font-medium">{passError}</p>
              )}
              {passSuccess && (
                <p className="text-xs text-emerald-600 font-semibold">{passSuccess}</p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
