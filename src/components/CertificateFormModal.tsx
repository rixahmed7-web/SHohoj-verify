/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Certificate Management Form (Page F)
 */

import React, { useState } from 'react';
import { Certificate, CertificateStatus } from '../types';
import { storageService } from '../services/storage';
import {
  X,
  Upload,
  User,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface CertificateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cert: Certificate) => void;
  initialCertificate?: Certificate | null;
}

const COURSE_PRESETS = [
  'GDS Amadeus & Sabre Airline Reservation and Ticketing',
  'Professional Cabin Crew & In-Flight Service Management',
  'Flight Operations Officer & Ground Handling Certification',
  'IATA Travel Agency Operations & International Air Fare Calculation',
  'Airport Passenger Ground Service & Ramp Handling',
  'Aviation Security & Air Cargo Operations',
];

export const CertificateFormModal: React.FC<CertificateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCertificate,
}) => {
  const isEditing = Boolean(initialCertificate);

  const [studentName, setStudentName] = useState(initialCertificate?.student_name || '');
  const [certNumber, setCertNumber] = useState(initialCertificate?.certificate_number || '');
  const [courseTitle, setCourseTitle] = useState(initialCertificate?.course_title || COURSE_PRESETS[0]);
  const [courseDuration, setCourseDuration] = useState(initialCertificate?.course_duration || '3 Months (120 Hours)');
  const [completionDate, setCompletionDate] = useState(initialCertificate?.completion_date || new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(initialCertificate?.issue_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<CertificateStatus>(initialCertificate?.status || 'VALID');
  const [studentPhotoUrl, setStudentPhotoUrl] = useState(initialCertificate?.student_photo_url || '');
  const [certificateFileUrl, setCertificateFileUrl] = useState(initialCertificate?.certificate_file_url || '');
  const [remarks, setRemarks] = useState(initialCertificate?.remarks || '');
  const [revocationReason, setRevocationReason] = useState(initialCertificate?.revocation_reason || '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Auto-generate certificate number matching convention: SAA-[COURSE_CODE]-[YEAR]-[SEQ]
  const handleAutoGenerateId = () => {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    let code = 'GDS';
    if (courseTitle.includes('Cabin')) code = 'CABIN';
    else if (courseTitle.includes('Flight Operations')) code = 'FLTOPS';
    else if (courseTitle.includes('IATA') || courseTitle.includes('Travel')) code = 'TRV';
    else if (courseTitle.includes('Airport') || courseTitle.includes('Ramp')) code = 'GROUND';

    setCertNumber(`SAA-${code}-${year}-${randomSeq}`);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMessage(null);
    try {
      const dataUrl = await storageService.uploadFile(file);
      setStudentPhotoUrl(dataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const dataUrl = await storageService.uploadFile(file);
      setCertificateFileUrl(dataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentName.trim()) {
      setErrorMessage('Student Full Name is required.');
      return;
    }
    if (!certNumber.trim()) {
      setErrorMessage('Certificate Number is required.');
      return;
    }
    if (!courseTitle.trim()) {
      setErrorMessage('Course Title is required.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && initialCertificate) {
        const updated = await storageService.updateCertificate(initialCertificate.id, {
          certificate_number: certNumber.trim().toUpperCase(),
          student_name: studentName.trim(),
          student_photo_url: studentPhotoUrl,
          course_title: courseTitle.trim(),
          course_duration: courseDuration.trim(),
          completion_date: completionDate,
          issue_date: issueDate,
          status,
          remarks: remarks.trim(),
          revocation_reason: status === 'REVOKED' ? revocationReason.trim() : undefined,
          revocation_date: status === 'REVOKED' ? (initialCertificate.revocation_date || new Date().toISOString()) : undefined,
          certificate_file_url: certificateFileUrl,
        });
        onSave(updated);
      } else {
        const created = await storageService.createCertificate({
          certificate_number: certNumber.trim().toUpperCase(),
          student_name: studentName.trim(),
          student_photo_url: studentPhotoUrl,
          course_title: courseTitle.trim(),
          course_duration: courseDuration.trim(),
          completion_date: completionDate,
          issue_date: issueDate,
          status,
          remarks: remarks.trim(),
          certificate_file_url: certificateFileUrl,
        });
        onSave(created);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save certificate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">
              {isEditing ? 'Edit Certificate Record' : 'Issue New Aviation Certificate'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Student Info & Photo Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {/* Photo preview & upload */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-40 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group">
                {studentPhotoUrl ? (
                  <img
                    src={studentPhotoUrl}
                    alt="Cadet Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] block font-medium">No Photo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-xs font-semibold p-2 text-center">
                  <Upload className="w-4 h-4 mb-1" />
                  <span>{studentPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 5MB</span>
            </div>

            {/* Student Name & Certificate ID */}
            <div className="sm:col-span-2 space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed Chowdhury"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs uppercase font-bold text-slate-700">
                    Certificate Number <span className="text-red-500">*</span>
                  </label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateId}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Auto-Generate ID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. SAA-GDS-TRV-2026-001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Course Title with Presets */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
              Course Title / Program of Study <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              list="course-presets-list"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
            <datalist id="course-presets-list">
              {COURSE_PRESETS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* Duration, Completion Date, Issue Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                Course Duration
              </label>
              <input
                type="text"
                value={courseDuration}
                onChange={(e) => setCourseDuration(e.target.value)}
                placeholder="e.g. 3 Months (120 Hours)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                Completion Date
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
                Certificate Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Certificate Status Selector */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
              Certificate Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="VALID"
                  checked={status === 'VALID'}
                  onChange={() => setStatus('VALID')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-emerald-800">VALID</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="REVOKED"
                  checked={status === 'REVOKED'}
                  onChange={() => setStatus('REVOKED')}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-red-800">REVOKED</span>
              </label>
            </div>
          </div>

          {/* If Revoked: Revocation Reason */}
          {status === 'REVOKED' && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <label className="block text-xs font-bold text-red-900">
                Revocation Reason (Published on Verification Result)
              </label>
              <textarea
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                placeholder="State official reason for certificate revocation..."
                rows={2}
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-md text-xs text-slate-900 focus:outline-hidden"
              />
            </div>
          )}

          {/* Private Internal Remarks (Admin only) */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
              Private Internal Remarks <span className="text-slate-400 font-normal lowercase">(never exposed to public)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Internal instructor notes, batch reference, or compliance audit details..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
            />
          </div>

          {/* Optional Certificate Scan/PDF attachment */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-700 mb-1">
              Official PDF or High-Res Scan Attachment
            </label>
            <div className="flex items-center gap-3">
              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-medium text-slate-700 cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Choose PDF / Image</span>
                <input
                  type="file"
                  accept="application/pdf, image/jpeg, image/png"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
              </label>
              {certificateFileUrl && (
                <span className="text-xs text-emerald-700 font-medium">
                  ✓ Document attached
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Certificate' : 'Save & Issue Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
