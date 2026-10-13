import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  ArrowRight,
  ShieldAlert,
  Building,
  User,
  CreditCard,
  Lock,
  Mail
} from 'lucide-react';
import { apiService } from '../../services/api';
import { Button, UnderlineInput } from '../ui';

interface DoctorRegistrationFormProps {
  onSuccess: (message: string, registeredDoctor: any) => void;
  onSwitchToSignIn: () => void;
}

export const DoctorRegistrationForm: React.FC<DoctorRegistrationFormProps> = ({
  onSuccess,
  onSwitchToSignIn
}) => {
  // Professional Details
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'Female' | 'Male' | 'Non-Binary' | 'Other' | 'Prefer not to say'>('Female');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Medical License File
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed: JPG, JPEG, PNG, WebP, PDF
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isSupported = allowed.includes(file.type) || ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext || '');

    if (!isSupported) {
      setError('Unsupported file type. Please upload a JPG, JPEG, PNG, WebP, or PDF document.');
      return;
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit. Please upload a smaller document.');
      return;
    }

    setError(null);
    setLicenseFile(file);

    if (file.type === 'application/pdf' || ext === 'pdf') {
      setIsPdf(true);
      setLicensePreviewUrl(null);
    } else {
      setIsPdf(false);
      const preview = URL.createObjectURL(file);
      setLicensePreviewUrl(preview);
    }
  };

  const handleRemoveFile = () => {
    if (licensePreviewUrl) {
      URL.revokeObjectURL(licensePreviewUrl);
    }
    setLicenseFile(null);
    setLicensePreviewUrl(null);
    setIsPdf(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!sex) {
      setError('Sex is required and must be explicitly selected.');
      return;
    }
    if (!hospitalName.trim()) {
      setError('Hospital or Clinic name is required.');
      return;
    }
    if (!hospitalAddress.trim()) {
      setError('Hospital or Clinic address is required.');
      return;
    }
    if (!licenseNumber.trim()) {
      setError('Medical license number is required.');
      return;
    }
    if (!licenseFile) {
      setError('A medical license document upload (JPG, PNG, WebP, or PDF) is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    setUploadProgress(40);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('sex', sex);
      formData.append('hospital_name', hospitalName.trim());
      formData.append('hospital_address', hospitalAddress.trim());
      formData.append('license_number', licenseNumber.trim());
      formData.append('license_document', licenseFile);
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);

      setUploadProgress(75);
      const res = await apiService.registerDoctor(formData);
      setUploadProgress(100);

      if (res.status === 'success') {
        onSuccess(
          res.message ||
            'Your registration has been submitted successfully. Your medical credentials are pending verification. Access to the protected doctor portal will be available after approval.',
          res.doctor
        );
      } else {
        setError(res.error || 'Failed to submit registration. Please check fields.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Registration service encountered an error. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans text-body">
      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-card bg-risk-light border border-risk/30 text-risk flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* SECTION 1: PROFESSIONAL CREDENTIALS */}
      <div className="p-4 rounded-card bg-panel-light border border-border space-y-4">
        <div className="flex items-center gap-2 text-forest font-semibold border-b border-border pb-2">
          <Building className="w-4 h-4 text-forest" />
          <span className="uppercase font-mono text-[11px] tracking-wider">
            1. Professional &amp; Institutional Details
          </span>
        </div>

        <UnderlineInput
          label="Doctor Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dr. Marcus Vance, MD"
          required
        />

        {/* Explicit Sex Selection */}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider font-mono text-muted block">
            Sex (Required — Explicit Selection)
          </label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as any)}
            className="input-underline w-full text-xs font-sans bg-transparent py-2 border-b border-border focus:border-forest outline-none text-forest font-medium"
            required
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <UnderlineInput
          label="Hospital / Clinic Name"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="e.g., Massachusetts Neuropsychiatric Institute"
          required
        />

        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider font-mono text-muted block">
            Hospital / Clinic Address
          </label>
          <textarea
            rows={2}
            value={hospitalAddress}
            onChange={(e) => setHospitalAddress(e.target.value)}
            placeholder="e.g., 750 Longwood Avenue, Boston, MA 02115, USA"
            className="w-full text-xs font-sans p-2.5 rounded-card bg-white border border-border focus:border-forest outline-none text-forest placeholder:text-muted resize-none"
            required
          />
        </div>

        <UnderlineInput
          label="Medical License Number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="e.g., MD-849204-STATE"
          required
        />

        {/* Document Upload Box */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] uppercase tracking-wider font-mono text-muted block">
            Medical License Document (Required &bull; Private &amp; Secure)
          </label>

          {!licenseFile ? (
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border hover:border-forest rounded-card cursor-pointer bg-white transition-colors">
              <Upload className="w-5 h-5 text-muted mb-1.5" />
              <span className="font-medium text-forest text-xs">Click to upload license credential</span>
              <span className="text-[10px] text-muted font-mono mt-0.5">
                Supports JPG, JPEG, PNG, WebP, PDF (Max 10MB)
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </label>
          ) : (
            <div className="p-3.5 rounded-card bg-white border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-forest flex-shrink-0" />
                  <span className="font-mono text-xs font-semibold text-forest truncate">
                    {licenseFile.name}
                  </span>
                  <span className="text-[10px] text-muted font-mono">
                    ({(licenseFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-muted hover:text-risk p-1 rounded transition-colors"
                  title="Replace document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image Preview if image format */}
              {licensePreviewUrl && !isPdf && (
                <div className="relative w-full max-h-48 rounded overflow-hidden border border-border bg-panel-light flex items-center justify-center">
                  <img
                    src={licensePreviewUrl}
                    alt="Medical License Preview"
                    className="max-h-48 object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-forest/80 text-white text-[9px] font-mono px-2 py-0.5 rounded">
                    CREDENTIAL PREVIEW
                  </div>
                </div>
              )}

              {isPdf && (
                <div className="p-2.5 rounded bg-panel-light border border-border flex items-center gap-2 text-xs font-mono text-forest">
                  <CheckCircle2 className="w-4 h-4 text-healthy" />
                  <span>PDF Document Attached &bull; Securely Encrypted</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span>Document safely retained for review</span>
                <label className="text-forest hover:underline cursor-pointer flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Document</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-forest" />
            <span>Documents are privately archived for administrative document review and never publicly exposed.</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACCOUNT CREDENTIALS */}
      <div className="p-4 rounded-card bg-panel-light border border-border space-y-4">
        <div className="flex items-center gap-2 text-forest font-semibold border-b border-border pb-2">
          <Lock className="w-4 h-4 text-forest" />
          <span className="uppercase font-mono text-[11px] tracking-wider">
            2. Account Login Credentials
          </span>
        </div>

        <UnderlineInput
          label="Professional Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="doctor.name@hospital.org"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UnderlineInput
            label="Password (min. 6 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />
          <UnderlineInput
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>Uploading Credential Documentation...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-forest transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submission Actions */}
      <div className="space-y-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          className="shadow-sm"
        >
          <span>{isLoading ? 'Submitting Registration...' : 'Submit Registration'}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-xs text-forest hover:underline font-sans font-medium"
          >
            Already registered? Sign In
          </button>
        </div>
      </div>
    </form>
  );
};

export default DoctorRegistrationForm;
