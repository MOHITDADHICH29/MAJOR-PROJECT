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
import { Badge, Button, VerticalBars } from '../components/ui';

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

  const pipelineSteps: { title: string; desc: string; icon: any; color: string; page: any }[] = [
    { title: 'Data Input', desc: 'Raw EEG & 3D T1-MRI upload or cohort preset selection', icon: Database, color: 'text-forest', page: 'data-input' },
    { title: 'Preprocessing', desc: 'Bandpass (0.5-45 Hz), Notch, Z-score & 96³ resampling', icon: Layers, color: 'text-mri', page: 'data-input' },
    { title: 'Feature Extraction', desc: '432 machine-invariant spectral & 111-ROI atlas', icon: GitBranch, color: 'text-forest', page: 'prediction' },
    { title: 'Dual Models', desc: 'EEG electrophysiology & 3D MRI morphometric ensembles', icon: Brain, color: 'text-mri', page: 'prediction' },
    { title: 'Multimodal Fusion', desc: 'Synergistic hierarchical cross-modal decision fusion', icon: Cpu, color: 'text-forest', page: 'prediction' },
    { title: 'Prediction', desc: 'Calibrated binary confidence scoring & class probability', icon: Activity, color: 'text-healthy', page: 'prediction' },
    { title: 'Explainable AI', desc: 'Channel gradients, slowing ratios & ROI attribution', icon: Sparkles, color: 'text-warning', page: 'explainability' },
    { title: 'Severity Estimation', desc: 'Multi-system Z-score divergence & biomarker stratification', icon: AlertCircle, color: 'text-risk', page: 'severity' },
    { title: 'Research Report', desc: 'Clinical laboratory summary export & print stylesheet', icon: FileText, color: 'text-forest', page: 'report' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Header Banner */}
      <div className="p-8 rounded-panel bg-panel-alt border border-forest/30 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border text-forest text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-forest" />
              Computational Neuroscience &amp; Multimodal AI Architecture
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-forest">
              NeuroFusion <span className="font-serif italic font-normal text-deep">AI</span>
            </h1>
            <p className="text-body-light text-sm max-w-2xl leading-relaxed font-sans">
              Research-oriented multimodal schizophrenia detection utilizing machine-invariant EEG frequency dynamics, 3D anatomical atlas parcellation morphometry, and synergistic cross-modal decision fusion.
            </p>
            <div className="pt-1">
              <VerticalBars bars={5} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('data-input')}
              className="flex items-center gap-2 shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>Load Cohort Sample</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('prediction')}
              className="flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-forest" />
              <span>View Predictions</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Medical / Research Disclaimer */}
      <ResearchDisclaimer compact />

      {/* System Status Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'EEG Pipeline',
            status: pipelines?.eeg_pipeline?.status || 'ready',
            meta: '124 Enrolled Subjects',
            perf: '77.43% Mean CV',
            icon: Activity,
          },
          {
            label: 'MRI Pipeline',
            status: pipelines?.mri_pipeline?.status || 'ready',
            meta: '77 QC-Passed Scans',
            perf: '72.58% Mean CV',
            icon: Brain,
          },
          {
            label: 'Fusion Model',
            status: pipelines?.fusion_pipeline?.status || 'ready',
            meta: '201 Multimodal Cohort',
            perf: '82.02% (89.5% Peak)',
            icon: Cpu,
          },
          {
            label: 'Explainability',
            status: pipelines?.explainability?.status || 'ready',
            meta: 'Gradient & Biomarker Attribution',
            perf: 'Available',
            icon: Sparkles,
          },
          {
            label: 'Clinical Report',
            status: pipelines?.reporting?.status || 'ready',
            meta: 'Print-Ready Dossier',
            perf: 'Export Ready',
            icon: FileText,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-panel bg-white border border-border shadow-card flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-forest font-serif">{item.label}</span>
              <Badge variant="healthy">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                ONLINE
              </Badge>
            </div>
            <div>
              <span className="text-xl font-serif font-bold text-forest block tracking-tight">{item.perf}</span>
              <span className="text-[11px] text-muted block font-mono mt-0.5">{item.meta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* EEG Model Card */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-panel-light text-forest flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-base text-forest">EEG Electrophysiology</h3>
                <span className="text-xs text-muted">Scalp Dynamics</span>
              </div>
            </div>
            <Badge variant="healthy">77.43% Acc</Badge>
          </div>
          <p className="text-xs text-body-light leading-relaxed font-sans">
            Machine-invariant frequency PSD decomposition, 8 bilateral homologous asymmetry pairs, and clinical frontal theta/alpha slowing ratios.
          </p>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span>Ensemble: ET + RF + XGB + SVM</span>
            <span className="text-body font-semibold">124 Subjects</span>
          </div>
        </div>

        {/* MRI Model Card */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-panel-light text-mri flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-base text-forest">3D MRI Morphometry</h3>
                <span className="text-xs text-muted">Structural Atlas</span>
              </div>
            </div>
            <Badge variant="mri">72.58% Acc</Badge>
          </div>
          <p className="text-xs text-body-light leading-relaxed font-sans">
            111-dimensional Anatomical Atlas Parcellation capturing DLPFC, Superior Temporal Gyrus, Ventricle-to-Brain Ratio (VBR), and 3D GLCM textures.
          </p>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span>Ensemble: 111-ROI Atlas + Radiomics</span>
            <span className="text-body font-semibold">77 QC-Passed</span>
          </div>
        </div>

        {/* Multimodal Decision Fusion Card */}
        <div className="p-6 rounded-panel bg-panel-alt border border-forest/40 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white text-forest flex items-center justify-center border border-forest/20">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-base text-forest">Multimodal Fusion</h3>
                <span className="text-xs text-muted">Synergistic Consensus</span>
              </div>
            </div>
            <Badge variant="forest">82.02% (89.5% Peak)</Badge>
          </div>
          <p className="text-xs text-body-light leading-relaxed font-sans">
            Synergistic cross-modal high-confidence decision fusion exploiting the complementary orthogonal dynamics of electrical and structural neuroimaging.
          </p>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span>Diagnostic Gain: +4.59% Residual</span>
            <span className="text-forest font-semibold">201 Cohort</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Architecture */}
      <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-semibold text-forest tracking-tight flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-forest" />
              System Architecture &amp; Analytical Flow
            </h2>
            <p className="text-xs text-body-light font-sans mt-0.5">
              Sequential research-grade pipeline from multi-site biosignal acquisition to clinical reporting
            </p>
          </div>
          <Badge variant="mint">End-to-End Pipeline</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(step.page)}
                className="p-3.5 rounded-card bg-panel-light border border-border hover:border-forest/60 hover:bg-white transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-forest transition-transform">
                  <Icon className={`w-4 h-4 ${step.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-forest leading-tight font-serif">
                  {step.title}
                </span>
                <span className="text-[10px] text-body-light leading-snug line-clamp-3 font-sans">
                  {step.desc}
                </span>
                <div className="text-[9px] font-mono text-muted mt-auto pt-1 group-hover:text-forest">
                  Step 0{idx + 1} &rarr;
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Access Preset Subjects */}
      <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
              <Database className="w-4 h-4 text-forest" />
              Enrolled Benchmark Subjects (Quick-Load)
            </h2>
            <p className="text-xs text-body-light font-sans mt-0.5">
              Select any pre-enrolled real subject to evaluate across all research views
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('data-input')}
            className="text-xs text-forest hover:underline flex items-center gap-1"
          >
            All Subjects <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {samples.slice(0, 6).map((sample) => (
            <button
              key={sample.id}
              onClick={() => onQuickLoadSample(sample)}
              disabled={isLoading}
              className="p-3 rounded-card bg-panel-light border border-border hover:border-forest/60 hover:bg-white text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="mint">{sample.type}</Badge>
                <span className={`w-2 h-2 rounded-full ${sample.label === 1 ? 'bg-risk' : 'bg-healthy'}`} />
              </div>
              <span className="text-xs font-semibold text-forest block truncate font-mono">
                {sample.id}
              </span>
              <span className="text-[10px] text-muted block truncate mt-0.5 font-sans">
                {sample.label_name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
