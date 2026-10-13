import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Terminal,
  Shield,
  Lock,
  ArrowRight,
  X,
  AlertCircle,
  UserPlus,
  LogIn,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { apiService } from '../../services/api';
import { UserRole, UserProfile } from '../../types';
import { Button, UnderlineInput, Badge } from '../ui';
import { DoctorRegistrationForm } from './DoctorRegistrationForm';

interface RoleGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialRole?: UserRole;
}

type AuthMode = 'sign-in' | 'register-doctor' | 'pending-status';

const ROLE_CONFIGS: Record<UserRole, {
  title: string;
  subtitle: string;
  icon: any;
  emailPlaceholder: string;
  demoEmail: string;
  demoPass: string;
  badge: string;
}> = {
  doctor: {
    title: 'Doctor',
    subtitle: 'Clinical Analysis Workspace',
    icon: Stethoscope,
    emailPlaceholder: 'doctor.demo@neurofusion.ai',
    demoEmail: 'doctor.demo@neurofusion.ai',
    demoPass: 'DoctorDemo2026!',
    badge: 'CLINICAL SUITE',
  },
  developer: {
    title: 'Developer',
    subtitle: 'Model Development & Research Lab',
    icon: Terminal,
    emailPlaceholder: 'developer.demo@neurofusion.ai',
    demoEmail: 'developer.demo@neurofusion.ai',
    demoPass: 'DeveloperDemo2026!',
    badge: 'RESEARCH COMPUTING',
  }
};

export const RoleGatewayModal: React.FC<RoleGatewayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'doctor'
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(ROLE_CONFIGS[initialRole]?.demoEmail || '');
  const [password, setPassword] = useState(ROLE_CONFIGS[initialRole]?.demoPass || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Registration success message / pending doctor details
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [pendingDoctorInfo, setPendingDoctorInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setEmail(ROLE_CONFIGS[initialRole]?.demoEmail || '');
      setPassword(ROLE_CONFIGS[initialRole]?.demoPass || '');
      setError(null);
      setAuthMode('sign-in');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const roleConfigs = ROLE_CONFIGS;

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(roleConfigs[role].demoEmail);
    setPassword(roleConfigs[role].demoPass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.login(
        selectedRole,
        email || roleConfigs[selectedRole].demoEmail,
        password || roleConfigs[selectedRole].demoPass
      );

      if (res.status === 'success' && res.user) {
        // Check approval status for doctors
        if (res.user.role === 'doctor' && res.user.approval_status === 'Pending Verification') {
          setPendingDoctorInfo(res.user);
          setStatusMessage(
            'Your medical credentials are currently pending administrative review. Access to protected patient analysis, EEG, MRI, and multimodal inference tools will be enabled upon administrator approval.'
          );
          setAuthMode('pending-status');
          return;
        }

        onSuccess(res.user);
        onClose();
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      if (err?.response?.data?.approval_status === 'Rejected') {
        setError('Your medical registration was reviewed and rejected. Protected clinical analysis features are unavailable.');
      } else {
        setError(err?.response?.data?.error || err?.message || 'Authentication error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSuccess = (message: string, doctor: any) => {
    setStatusMessage(message);
    setPendingDoctorInfo(doctor);
    setAuthMode('pending-status');
  };

  const cfg = roleConfigs[selectedRole];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft translucent scrim */}
      <div
        className="fixed inset-0 bg-forest/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${
          authMode === 'register-doctor' ? 'max-w-2xl' : 'max-w-lg'
        } bg-white border border-border rounded-panel shadow-modal p-6 sm:p-8 space-y-6 z-10 max-h-[90vh] overflow-y-auto animate-fade-in-up`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-muted hover:text-forest transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center pr-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted font-semibold">
            SECURE ACCESS GATEWAY
          </span>
          <h2 className="text-3xl font-serif text-forest font-semibold">
            {authMode === 'register-doctor'
              ? 'Doctor Portal Registration'
              : authMode === 'pending-status'
              ? 'Verification Status'
              : 'Enter NeuroFusion Platform'}
          </h2>
          <p className="text-xs text-body-light font-sans">
            {authMode === 'register-doctor'
              ? 'Submit verified medical credentials and hospital affiliation for clinical access review.'
              : authMode === 'pending-status'
              ? 'Your professional credentials have been recorded in the administrative review queue.'
              : 'Sign in to access clinical analysis or research laboratory workspace.'}
          </p>
        </div>

        {/* Doctor Mode Navigation: Sign In vs Register as Doctor */}
        {authMode !== 'pending-status' && (
          <div className="flex border-b border-border pb-3 justify-center gap-6 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setAuthMode('sign-in');
                setError(null);
              }}
              className={`flex items-center gap-1.5 pb-1 border-b-2 font-medium transition-all ${
                authMode === 'sign-in'
                  ? 'border-forest text-forest font-bold'
                  : 'border-transparent text-muted hover:text-forest'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register-doctor');
                setSelectedRole('doctor');
                setError(null);
              }}
              className={`flex items-center gap-1.5 pb-1 border-b-2 font-medium transition-all ${
                authMode === 'register-doctor'
                  ? 'border-forest text-forest font-bold'
                  : 'border-transparent text-muted hover:text-forest'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register as a Doctor</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: SIGN IN FORM */}
        {/* ============================================================== */}
        {authMode === 'sign-in' && (
          <div className="space-y-5">
            {/* Role Toggle as Pill Segmented Control */}
            <div className="p-1 rounded-full bg-panel-light border border-border flex gap-1">
              {(['doctor', 'developer'] as const).map((role) => {
                const isSelected = selectedRole === role;
                const rCfg = roleConfigs[role];
                const Icon = rCfg.icon;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-sans font-medium transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-forest text-white shadow-sm'
                        : 'text-body hover:text-forest hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{rCfg.title}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleLogin} className="space-y-5 pt-1">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-muted">
                  Role: <strong className="text-forest font-semibold">{cfg.title}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleRoleToggle(selectedRole)}
                  className="text-forest hover:underline text-[11px] font-mono"
                >
                  Fill Demo Credentials
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-card bg-risk-light border border-risk/30 text-risk text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-4">
                <UnderlineInput
                  label="Professional Identifier / Email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={cfg.emailPlaceholder}
                  required
                />

                <div className="relative">
                  <UnderlineInput
                    label="Security Passkey"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-muted absolute right-1 bottom-3" />
                </div>
              </div>

              {/* Primary Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="shadow-sm mt-4"
              >
                <span>
                  {isLoading ? 'Verifying Credentials...' : `Enter ${cfg.title} Workspace`}
                </span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="pt-2 flex flex-col items-center gap-2 text-xs font-sans text-muted">
                {selectedRole === 'doctor' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register-doctor');
                      setError(null);
                    }}
                    className="text-forest hover:underline font-medium"
                  >
                    New doctor? Register as a Doctor &rarr;
                  </button>
                )}
                <p className="text-[11px] font-mono text-muted text-center">
                  Demo: <span className="text-forest">doctor.demo@neurofusion.ai</span> &bull; <span className="text-forest">developer.demo@neurofusion.ai</span>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DOCTOR REGISTRATION FORM */}
        {/* ============================================================== */}
        {authMode === 'register-doctor' && (
          <DoctorRegistrationForm
            onSuccess={handleRegistrationSuccess}
            onSwitchToSignIn={() => {
              setAuthMode('sign-in');
              setError(null);
            }}
          />
        )}

        {/* ============================================================== */}
        {/* VIEW 3: REGISTRATION SUBMITTED / PENDING STATUS */}
        {/* ============================================================== */}
        {authMode === 'pending-status' && (
          <div className="space-y-6 text-center py-2 animate-fade-in-up">
            <div className="w-14 h-14 mx-auto rounded-full bg-warning-light border border-warning/40 flex items-center justify-center text-warning">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <Badge variant="warning">STATUS: PENDING VERIFICATION</Badge>
              <h3 className="text-xl font-serif font-semibold text-forest">
                Credentials Under Administrative Review
              </h3>
              <p className="text-xs text-body font-sans leading-relaxed max-w-md mx-auto">
                {statusMessage ||
                  'Your registration has been submitted successfully. Your medical credentials are pending verification. Access to the protected doctor portal will be available after approval.'}
              </p>
            </div>

            {pendingDoctorInfo && (
              <div className="p-4 rounded-card bg-panel-light border border-border text-left font-mono text-xs space-y-1.5 max-w-md mx-auto">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Physician Name:</span>
                  <span className="text-forest font-semibold">{pendingDoctorInfo.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Account Email:</span>
                  <span className="text-forest font-semibold">{pendingDoctorInfo.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Review Protocol:</span>
                  <span className="text-muted">Administrative Document Review</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Portal Privileges:</span>
                  <span className="text-warning font-semibold">Protected Analysis Gated</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setAuthMode('sign-in');
                  setError(null);
                }}
              >
                <span>Back to Sign In</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onClose}
              >
                <span>Understood, Close</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleGatewayModal;
