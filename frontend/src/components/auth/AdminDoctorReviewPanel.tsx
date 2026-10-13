import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Building,
  User,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Download,
  ExternalLink,
  Filter,
  History,
  Check
} from 'lucide-react';
import { apiService } from '../../services/api';
import { DoctorRegistrationRecord } from '../../types';
import { Button, Badge, Card } from '../ui';

export const AdminDoctorReviewPanel: React.FC = () => {
  const [registrations, setRegistrations] = useState<DoctorRegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Verification' | 'Approved' | 'Rejected'>('All');
  
  // Rejection modal state
  const [rejectingDoctor, setRejectingDoctor] = useState<DoctorRegistrationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiService.getDoctorRegistrations();
      setRegistrations(list);
    } catch (err: any) {
      setError('Unable to load registration queue. Administrative authentication required.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (doctorId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.reviewDoctorRegistration(doctorId, 'Approved', 'Approved by administrative review.');
      setActionMessage(res.message || 'Doctor registration approved.');
      await loadRegistrations();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to approve registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRejectModal = (doc: DoctorRegistrationRecord) => {
    setRejectingDoctor(doc);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectingDoctor) return;
    if (!rejectionReason.trim()) {
      setRejectionError('A specific rejection reason is required for administrative audit integrity.');
      return;
    }

    setIsLoading(true);
    setRejectionError(null);
    try {
      const res = await apiService.reviewDoctorRegistration(rejectingDoctor.id, 'Rejected', rejectionReason.trim());
      setActionMessage(res.message || 'Doctor registration rejected with documented reason.');
      setRejectingDoctor(null);
      setRejectionReason('');
      await loadRegistrations();
    } catch (err: any) {
      setRejectionError(err?.response?.data?.error || 'Failed to submit rejection.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.approval_status === statusFilter;
  });

  const pendingCount = registrations.filter(r => r.approval_status === 'Pending Verification').length;
  const approvedCount = registrations.filter(r => r.approval_status === 'Approved').length;
  const rejectedCount = registrations.filter(r => r.approval_status === 'Rejected').length;

  return (
    <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-6 text-xs font-sans text-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest" />
            <h3 className="text-xl font-serif text-forest font-semibold tracking-tight">
              Doctor Credential Management
            </h3>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Authorized Developer/Admin Console &bull; Inspect state licenses, enforce compliance, and review registrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="mint">ADMIN ACCESS LEVEL</Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadRegistrations}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </Button>
        </div>
      </div>

      {/* Protocol Notice */}
      <div className="p-3.5 rounded-card bg-panel-light border border-border text-[11px] font-mono text-muted leading-relaxed">
        <strong>Administrative Protocol:</strong> This console provides access-controlled credential management for medical licenses. Rejections require documented rationale recorded in audit history. Unauthorized accounts are prevented from accessing patient inference workspaces.
      </div>

      {error && (
        <div className="p-3 rounded-card bg-risk-light border border-risk/30 text-risk flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 rounded-card bg-healthy-light border border-healthy/30 text-healthy flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Tabs / Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              statusFilter === 'All'
                ? 'bg-forest text-white font-bold'
                : 'bg-panel-light text-muted hover:text-forest'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-80">({registrations.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Pending Verification')}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              statusFilter === 'Pending Verification'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-panel-light text-muted hover:text-amber-800'
            }`}
          >
            <span>Pending</span>
            <span className="text-[10px] opacity-80">({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              statusFilter === 'Approved'
                ? 'bg-healthy text-white font-bold'
                : 'bg-panel-light text-muted hover:text-healthy'
            }`}
          >
            <span>Approved</span>
            <span className="text-[10px] opacity-80">({approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              statusFilter === 'Rejected'
                ? 'bg-risk text-white font-bold'
                : 'bg-panel-light text-muted hover:text-risk'
            }`}
          >
            <span>Rejected</span>
            <span className="text-[10px] opacity-80">({rejectedCount})</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-muted">
          Showing {filteredRegistrations.length} of {registrations.length} records
        </span>
      </div>

      {/* Registration List */}
      <div className="space-y-4">
        {filteredRegistrations.length === 0 ? (
          <div className="p-8 text-center text-muted font-mono bg-panel-light rounded-card border border-border">
            No doctor registrations found matching filter "{statusFilter}".
          </div>
        ) : (
          filteredRegistrations.map((doc) => {
            const docUrl = apiService.getLicenseDocumentUrl(doc.license_filename);

            return (
              <div
                key={doc.id}
                className="p-5 rounded-card bg-panel-light border border-border space-y-4 hover:border-forest/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-forest">{doc.name}</span>
                      <Badge
                        variant={
                          doc.approval_status === 'Approved'
                            ? 'healthy'
                            : doc.approval_status === 'Rejected'
                            ? 'risk'
                            : 'warning'
                        }
                      >
                        {doc.approval_status}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted">
                      Doctor ID: {doc.id} &bull; Email: {doc.email} &bull; Registered: {doc.registration_date}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {doc.approval_status === 'Pending Verification' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(doc.id)}
                          disabled={isLoading}
                          className="shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Approve Access</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenRejectModal(doc)}
                          disabled={isLoading}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1 text-risk" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}
                    {doc.approval_status === 'Approved' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenRejectModal(doc)}
                        disabled={isLoading}
                      >
                        <span>Revoke / Reject</span>
                      </Button>
                    )}
                    {doc.approval_status === 'Rejected' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(doc.id)}
                        disabled={isLoading}
                      >
                        <span>Re-Approve Access</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">SEX</span>
                    <span className="text-forest font-semibold">{doc.sex || 'Not Specified'}</span>
                  </div>

                  <div className="p-3 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">HOSPITAL / CLINIC</span>
                    <span className="text-forest font-semibold truncate block" title={doc.hospital_name}>
                      {doc.hospital_name || 'Affiliated Medical Center'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">MEDICAL LICENSE #</span>
                    <span className="text-forest font-semibold">{doc.license_number}</span>
                  </div>

                  <div className="p-3 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">DOCUMENT UPLOAD</span>
                    {doc.has_license_document ? (
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest hover:underline font-semibold flex items-center gap-1 mt-0.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-forest" />
                        <span className="truncate">{doc.license_filename}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-muted">No document uploaded</span>
                    )}
                  </div>
                </div>

                {doc.hospital_address && (
                  <div className="text-[11px] text-muted font-sans">
                    <strong>Clinic Address:</strong> {doc.hospital_address}
                  </div>
                )}

                {/* Audit & Decision Log info if available */}
                {(doc.approval_notes || doc.reviewed_by || doc.reviewed_at) && (
                  <div className="p-3 rounded bg-white border border-border/80 text-[11px] font-mono text-muted flex items-start gap-2">
                    <History className="w-3.5 h-3.5 text-forest flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Audit Log:</strong> Reviewed by {doc.reviewed_by || 'Admin'} on {doc.reviewed_at || 'Recorded Date'}.
                      {doc.approval_notes && (
                        <div className="mt-0.5 text-body">
                          <em>Decision notes:</em> "{doc.approval_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal for documenting Rejection Reason */}
      {rejectingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-panel border border-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <XCircle className="w-5 h-5 text-risk" />
              <h4 className="text-lg font-serif font-semibold text-forest">
                Reject Doctor Credential &bull; {rejectingDoctor.name}
              </h4>
            </div>

            <p className="text-xs text-body-light leading-relaxed">
              In accordance with administrative compliance protocols, rejecting or revoking a physician's registration requires a documented justification recorded in the regulatory audit trail.
            </p>

            {rejectionError && (
              <div className="p-2.5 rounded bg-risk-light border border-risk/30 text-risk text-xs">
                {rejectionError}
              </div>
            )}

            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[11px] font-bold text-forest uppercase block">
                Required Rejection Reason / Deficiency Notes:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Medical license document illegible or expired; unverified institution affiliation; state registry number mismatch..."
                className="w-full h-24 p-3 rounded-card border border-border font-sans text-xs focus:outline-none focus:border-forest"
              />
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRejectingDoctor(null);
                  setRejectionReason('');
                  setRejectionError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                disabled={isLoading || !rejectionReason.trim()}
                className="bg-risk text-white hover:bg-risk/90"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorReviewPanel;
