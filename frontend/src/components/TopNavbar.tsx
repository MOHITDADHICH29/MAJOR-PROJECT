import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Database, UserCheck, RefreshCw } from 'lucide-react';
import { SystemStatusResponse } from '../types';

interface TopNavbarProps {
  pageTitle: string;
  activeSampleId?: string;
  statusData?: SystemStatusResponse | null;
  onRefreshStatus?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  pageTitle,
  activeSampleId,
  statusData,
  onRefreshStatus,
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
    <header className="h-16 px-6 border-b border-slate-800/80 bg-dark-900/60 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight text-white capitalize flex items-center gap-2">
          {pageTitle}
        </h1>
        <span className="hidden md:inline-flex text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Research Prototype
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Modality Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5" title="EEG Machine-Invariant Ensemble">
            <span className={`w-2 h-2 rounded-full ${eegOk ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-rose-500'}`} />
            <span className="text-slate-300">EEG</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5" title="MRI 111-ROI Atlas Parcellation">
            <span className={`w-2 h-2 rounded-full ${mriOk ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-rose-500'}`} />
            <span className="text-slate-300">MRI</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5" title="Multimodal Synergistic Decision Fusion">
            <span className={`w-2 h-2 rounded-full ${fusionOk ? 'bg-cyan-400 shadow-glow-cyan' : 'bg-rose-500'}`} />
            <span className="text-slate-300">Fusion</span>
          </div>
        </div>

        {/* Current Active Sample */}
        {activeSampleId && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-mono">
            <Database className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Active:</span>
            <span className="font-semibold">{activeSampleId}</span>
          </div>
        )}

        {/* Clock */}
        <span className="text-xs font-mono text-slate-400 hidden sm:inline">
          {timeStr}
        </span>

        {/* Refresh button */}
        {onRefreshStatus && (
          <button
            onClick={onRefreshStatus}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
            title="Refresh System Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Researcher Persona */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
            RES
          </div>
        </div>
      </div>
    </header>
  );
};
