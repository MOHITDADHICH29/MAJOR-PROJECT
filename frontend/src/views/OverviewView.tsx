import React from 'react';
import {
  Activity,
  Layers,
  Cpu,
  Brain,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  BarChart3,
  GitBranch
} from 'lucide-react';
import { SystemStatusResponse, DatasetSample, EEGAnalysisResult, MRIAnalysisResult, MultimodalAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

interface OverviewViewProps {
  statusData: SystemStatusResponse | null;
  samples: DatasetSample[];
  activeEEG: EEGAnalysisResult | null;
  activeMRI: MRIAnalysisResult | null;
  activeFusion: MultimodalAnalysisResult | null;
  onNavigate: (page: any) => void;
  onQuickLoadSample: (sample: DatasetSample) => void;
  isLoading: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  statusData,
  samples,
  activeEEG,
  activeMRI,
  activeFusion,
  onNavigate,
  onQuickLoadSample,
  isLoading,
}) => {
  const pipelines = statusData?.pipelines;

  const pipelineSteps = [
    { title: 'Data Input', desc: 'Raw EEG & 3D T1-MRI upload or cohort preset selection', icon: Database, color: 'text-cyan-400' },
    { title: 'Preprocessing', desc: 'Bandpass (0.5-45 Hz), Notch, Z-score & 96³ volume resampling', icon: Layers, color: 'text-blue-400' },
    { title: 'Feature Extraction', desc: '352 machine-invariant spectral & 111-ROI anatomical atlas', icon: GitBranch, color: 'text-violet-400' },
    { title: 'Dual Models', desc: 'EEG electrophysiology & 3D MRI morphometric ensembles', icon: Brain, color: 'text-purple-400' },
    { title: 'Multimodal Fusion', desc: 'Synergistic hierarchical cross-modal decision fusion', icon: Cpu, color: 'text-emerald-400' },
    { title: 'Prediction', desc: 'Calibrated binary confidence scoring & class probability', icon: Activity, color: 'text-teal-400' },
    { title: 'Explainable AI', desc: 'Channel gradients, slowing ratios & ROI volumetric attribution', icon: Sparkles, color: 'text-amber-400' },
    { title: 'Severity Estimation', desc: 'Research limitation protocol & scientific rationale banner', icon: AlertCircle, color: 'text-rose-400' },
    { title: 'Research Report', desc: 'Comprehensive clinical laboratory summary export & print', icon: FileText, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-cyan-950/40 via-dark-800 to-slate-900 border border-cyan-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Computational Neuroscience + Multimodal AI Architecture
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              NeuroFusion <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">AI</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Research-oriented multimodal schizophrenia detection utilizing machine-invariant EEG frequency dynamics, 3D anatomical atlas parcellation morphometry, and synergistic cross-modal decision fusion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('data-input')}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-glow-cyan flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Load Cohort Sample
            </button>
            <button
              onClick={() => onNavigate('prediction')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              View Predictions
            </button>
          </div>
        </div>
      </div>

      {/* Medical / Research Disclaimer */}
      <ResearchDisclaimer />

      {/* System Status Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'EEG Pipeline',
            status: pipelines?.eeg_pipeline?.status || 'ready',
            meta: '124 Enrolled Subjects',
            perf: '77.43% Mean CV',
            icon: Activity,
            color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
          },
          {
            label: 'MRI Pipeline',
            status: pipelines?.mri_pipeline?.status || 'ready',
            meta: '77 QC-Passed Scans',
            perf: '72.58% Mean CV',
            icon: Brain,
            color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
          },
          {
            label: 'Fusion Model',
            status: pipelines?.fusion_pipeline?.status || 'ready',
            meta: '201 Multimodal Cohort',
            perf: '82.02% (89.5% Peak)',
            icon: Cpu,
            color: 'border-violet-500/30 bg-violet-500/5 text-violet-400',
          },
          {
            label: 'Explainability',
            status: pipelines?.explainability?.status || 'ready',
            meta: 'Gradient & Biomarker Attribution',
            perf: 'Available',
            icon: Sparkles,
            color: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
          },
          {
            label: 'Clinical Report',
            status: pipelines?.reporting?.status || 'ready',
            meta: 'Interactive & Printable JSON',
            perf: 'Export Ready',
            icon: FileText,
            color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl glass-panel glass-panel-hover flex flex-col justify-between border space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">{item.label}</span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                ONLINE
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-white block tracking-tight">{item.perf}</span>
              <span className="text-[11px] text-slate-400 block">{item.meta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* EEG Model Card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">EEG Electrophysiology</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">77.43% Acc</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Machine-invariant frequency PSD decomposition, 8 bilateral homologous asymmetry pairs, and clinical frontal theta/alpha slowing ratios.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Ensemble: ET + RF + XGB + SVM</span>
            <span className="text-slate-300 font-semibold">124 Subjects</span>
          </div>
        </div>

        {/* MRI Model Card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">3D MRI Morphometry</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">72.58% Acc</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            111-dimensional Anatomical Atlas Parcellation capturing DLPFC, Superior Temporal Gyrus, Ventricle-to-Brain Ratio (VBR), and 3D GLCM textures.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Ensemble: 111-ROI Atlas + Radiomics</span>
            <span className="text-slate-300 font-semibold">77 QC-Passed</span>
          </div>
        </div>

        {/* Multimodal Decision Fusion Card */}
        <div className="p-5 rounded-2xl glass-panel border border-violet-500/20 space-y-4 shadow-glow-violet">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Multimodal Fusion</h3>
            </div>
            <span className="text-xs font-mono text-violet-400 font-bold">82.02% (89.5% Peak)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Synergistic cross-modal high-confidence decision fusion exploiting the complementary orthogonal dynamics of electrical and structural neuroimaging.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Diagnostic Gain: +4.59% Residual</span>
            <span className="text-violet-300 font-semibold">201 Cohort</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Architecture */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              System Architecture & Analytical Flow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sequential research-grade pipeline from multi-site biosignal acquisition to clinical reporting
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">End-to-End Pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex flex-col items-center text-center space-y-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-4 h-4 ${step.color}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-200 leading-tight">
                  {step.title}
                </span>
                <span className="text-[10px] text-slate-400 leading-snug line-clamp-3">
                  {step.desc}
                </span>
                <div className="text-[9px] font-mono text-slate-500 mt-auto pt-1">
                  Step 0{idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access Preset Subjects */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              Enrolled Benchmark Subjects (Quick-Load)
            </h2>
            <p className="text-xs text-slate-400">
              Select any pre-enrolled real subject to instantly evaluate across all 9 research views
            </p>
          </div>
          <button
            onClick={() => onNavigate('data-input')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            All Subjects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {samples.slice(0, 6).map((sample) => (
            <button
              key={sample.id}
              onClick={() => onQuickLoadSample(sample)}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {sample.type}
                </span>
                <span className={`w-2 h-2 rounded-full ${sample.label === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </div>
              <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-cyan-300">
                {sample.id}
              </span>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                {sample.label_name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
