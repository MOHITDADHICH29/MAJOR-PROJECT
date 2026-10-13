import React, { useEffect, useState } from 'react';
import {
  Database,
  RefreshCw,
  Stethoscope,
  Terminal,
  LogOut,
  ChevronDown,
  Search
} from 'lucide-react';
import { SystemStatusResponse, UserProfile, UserRole } from '../types';
import { Badge } from './ui';

interface TopNavbarProps {
  pageTitle: string;
  activeSampleId?: string;
  statusData?: SystemStatusResponse | null;
  onRefreshStatus?: () => void;
  currentUser?: UserProfile | null;
  onOpenRoleGateway?: () => void;
  onLogout?: () => void;
  activeRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  pageTitle,
  activeSampleId,
  statusData,
  onRefreshStatus,
  currentUser,
  onOpenRoleGateway,
  onLogout,
  activeRole = 'doctor',
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const eegOk = statusData?.pipelines?.eeg_pipeline?.status === 'ready';
  const mriOk = statusData?.pipelines?.mri_pipeline?.status === 'ready';
  const fusionOk = statusData?.pipelines?.fusion_pipeline?.status === 'ready';

  return (
    <header className="h-16 px-6 border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between">
      {/* Page Title & Breadcrumb Context */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
            <span>NeuroFusion AI</span>
            <span>/</span>
            <span className="text-forest capitalize">{activeRole} Workspace</span>
          </div>
          <h1 className="text-xl font-serif font-semibold tracking-tight text-forest capitalize">
            {pageTitle}
          </h1>
        </div>

        <Badge variant="mint" className="hidden lg:inline-flex ml-2">
          MNI-152 Harmonized
        </Badge>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Modality Status Badges */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-panel-light border border-border text-xs font-mono">
          <div className="flex items-center gap-1.5" title="EEG Machine-Invariant Ensemble">
            <span className={`w-2 h-2 rounded-full ${eegOk ? 'bg-healthy' : 'bg-risk'}`} />
            <span className="text-forest font-semibold">EEG</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5" title="MRI 111-ROI Atlas Parcellation">
            <span className={`w-2 h-2 rounded-full ${mriOk ? 'bg-mri' : 'bg-risk'}`} />
            <span className="text-mri font-semibold">MRI</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5" title="Multimodal Synergistic Decision Fusion">
            <span className={`w-2 h-2 rounded-full ${fusionOk ? 'bg-forest' : 'bg-risk'}`} />
            <span className="text-forest font-semibold">Fusion</span>
          </div>
        </div>

        {/* Current Active Sample */}
        {activeSampleId && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-border text-xs text-forest font-mono">
            <Database className="w-3.5 h-3.5 text-muted" />
            <span className="font-semibold">{activeSampleId}</span>
          </div>
        )}

        {/* UTC Clock */}
        <span className="text-xs font-mono text-muted hidden xl:inline">
          {timeStr}
        </span>

        {/* Refresh button */}
        {onRefreshStatus && (
          <button
            onClick={onRefreshStatus}
            className="p-2 rounded-full text-muted hover:text-forest hover:bg-panel-light transition-colors"
            title="Refresh System Status"
            aria-label="Refresh System Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Role Selector Gateway Button */}
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <button
            onClick={onOpenRoleGateway}
            className="px-3.5 py-1.5 rounded-full bg-panel-light hover:bg-panel border border-border font-sans text-xs text-forest transition-all flex items-center gap-1.5 font-medium"
            title="Switch Workspace Role"
          >
            {activeRole === 'doctor' && <Stethoscope className="w-3.5 h-3.5 text-forest" />}
            {activeRole === 'developer' && <Terminal className="w-3.5 h-3.5 text-forest" />}

            <span className="capitalize">
              {activeRole}
            </span>
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>

          {/* User Profile Avatar */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-serif font-bold text-xs shadow-sm"
                title={`${currentUser.name} (${currentUser.title})`}
              >
                {currentUser.name.charAt(0)}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-full text-muted hover:text-risk hover:bg-risk-light transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenRoleGateway}
              className="text-xs font-sans text-forest hover:underline font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
export default TopNavbar;
