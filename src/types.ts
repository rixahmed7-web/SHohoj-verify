/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Type Definitions
 */

export type CertificateStatus = 'VALID' | 'REVOKED';

export interface Certificate {
  id: string;
  certificate_number: string;
  student_name: string;
  student_photo_url?: string;
  course_title: string;
  course_duration: string;
  completion_date: string;
  issue_date: string;
  status: CertificateStatus;
  verification_token: string;
  certificate_file_url?: string;
  remarks?: string; // Private internal admin remarks (never exposed publicly)
  revocation_reason?: string;
  revocation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicVerificationResult {
  certificate_number: string;
  student_name: string;
  student_photo_url?: string;
  course_title: string;
  course_duration: string;
  completion_date: string;
  issue_date: string;
  status: CertificateStatus;
  verification_token: string;
  certificate_file_url?: string;
  revocation_reason?: string;
  revocation_date?: string;
}

export interface AuditLog {
  id: string;
  action: 'CREATE_CERTIFICATE' | 'UPDATE_CERTIFICATE' | 'REVOKE_CERTIFICATE' | 'REISSUE_CERTIFICATE' | 'DELETE_CERTIFICATE' | 'ADMIN_LOGIN' | 'PASSWORD_CHANGED' | 'PUBLIC_VERIFICATION_ATTEMPT' | 'DATA_IMPORT';
  certificate_id?: string;
  details: string;
  actor: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  admin_id: string;
  full_name: string;
  email: string;
  must_change_password: boolean;
  last_login_at?: string;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  expires_at: number; // Unix timestamp
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export type DatabaseMode = 'demo' | 'production';

export interface SystemConfigStatus {
  isConfigured: boolean;
  mode: DatabaseMode;
  missingVars: string[];
  supabaseUrl?: string;
}

