import React from 'react';
import { UploadCloud, AlertCircle, CheckCircle2, FileQuestion } from 'lucide-react';

/* Dropzone Component */
export interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  helperText?: string;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  accept,
  label = 'Upload Neuroimaging or Electrophysiology File',
  helperText = 'Accepts .npy, .eea, .edf, .nii, .nii.gz',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-all duration-200 ${
        isDragOver ? 'border-forest bg-panel-light' : 'border-border bg-white hover:border-forest/60 hover:bg-panel-light/40'
      } ${className}`}
    >
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-panel-light flex items-center justify-center text-forest">
          <UploadCloud className="w-6 h-6" />
        </div>
        <span className="text-sm font-medium font-sans text-forest mt-1">{label}</span>
        <span className="text-xs font-mono text-muted">{helperText}</span>
      </div>
    </div>
  );
};

/* Empty State Component */
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: any;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon: Icon = FileQuestion,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center rounded-card bg-panel-light border border-border ${className}`}>
      <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center text-muted mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-lg font-serif font-medium text-forest">{title}</h4>
      {description && <p className="text-xs sm:text-sm text-muted font-sans max-w-sm mt-1 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

/* Loader / Skeleton */
export const Loader: React.FC<{ label?: string; className?: string }> = ({
  label = 'Processing...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-3 ${className}`}>
      <div className="w-6 h-6 border-2 border-panel-dark border-t-forest rounded-full animate-spin" />
      <span className="text-xs font-mono text-muted tracking-wide">{label}</span>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-panel rounded-card ${className}`} />;
};

/* Toast / Alert Banner */
export interface AlertBannerProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  message,
  description,
  className = '',
}) => {
  const styles = {
    success: 'bg-healthy-light border-healthy/40 text-healthy',
    warning: 'bg-warning-light border-warning/40 text-warning',
    error: 'bg-risk-light border-risk/40 text-risk',
    info: 'bg-panel-light border-border text-forest',
  };

  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: AlertCircle,
    info: AlertCircle,
  };
  const Icon = icons[type];

  return (
    <div className={`p-4 rounded-card border flex items-start gap-3 ${styles[type]} ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-xs sm:text-sm">
        <div className="font-semibold">{message}</div>
        {description && <div className="mt-0.5 text-muted font-sans">{description}</div>}
      </div>
    </div>
  );
};
