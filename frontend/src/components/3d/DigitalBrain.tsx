import React, { useState } from 'react';
import { Brain3D, BrainRegionInfo } from './Brain3D';
import { Layers, Activity, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui';

interface DigitalBrainProps {
  selectedChannel?: string | null;
  onSelectChannel?: (channel: string) => void;
  className?: string;
}

export type DigitalBrainState = 'RAW' | 'PROCESSED' | 'MAPPED' | 'ANALYZED' | 'INTERPRETED';

export const DigitalBrain: React.FC<DigitalBrainProps> = ({
  selectedChannel,
  onSelectChannel,
  className = ''
}) => {
  const [currentState, setCurrentState] = useState<DigitalBrainState>('ANALYZED');
  const [selectedRegion, setSelectedRegion] = useState<BrainRegionInfo | null>(null);

  const stateDetails: Record<DigitalBrainState, {
    title: string;
    desc: string;
    stageLabel: string;
    status: string;
    metrics: { label: string; value: string }[];
    disclaimer?: string;
    icon: any;
    color: string;
  }> = {
    RAW: {
      title: '01 / RAW INPUTS',
      stageLabel: 'Unprocessed Biological Substrate',
      desc: 'Raw neurological inputs before the primary processing and feature-representation stages.',
      status: 'Sensor streams acquired; no saliency maps or inferences calculated.',
      metrics: [
        { label: 'EEG Data Source', value: '16-Ch Microvolt Time-Series (128 Hz)' },
        { label: 'MRI Data Source', value: '3D T1w Unsegmented Voxel Matrix' },
        { label: 'Saliency / Inferences', value: 'None (Raw Baseline State)' }
      ],
      icon: Layers,
      color: 'text-muted'
    },
    PROCESSED: {
      title: '02 / PREPROCESSED DATA',
      stageLabel: 'Filtered & Harmonized Geometry',
      desc: 'Preprocessed EEG and imaging representations prepared for downstream analysis.',
      status: 'Artifact filtering, baseline drift correction, and 3D affine registration complete.',
      metrics: [
        { label: 'Signal Conditioning', value: '0.5 – 45.0 Hz Bandpass Filtered' },
        { label: 'Spatial Registration', value: '3D Affine to MNI-152 Standard Space' },
        { label: 'Tractography Synthesis', value: 'White Matter Fiber Density Bundles' }
      ],
      icon: Cpu,
      color: 'text-mri'
    },
    MAPPED: {
      title: '03 / ANATOMICAL ATLAS MAPPING',
      stageLabel: 'Spatial Coordinate Parcellation',
      desc: 'Spatial organization of imaging-derived features using the available anatomical atlas.',
      status: 'Cortical and subcortical parcel boundaries aligned to 10-20 electrode grid coordinates.',
      metrics: [
        { label: 'Cortical Atlas', value: '111-ROI Harvard-Oxford / AAL Standard' },
        { label: 'Electrode System', value: '10-20 Montage (19 Co-registered Nodes)' },
        { label: 'Stereotactic Frame', value: 'MNI-152 (1mm Isotropic Grid)' }
      ],
      icon: Activity,
      color: 'text-forest'
    },
    ANALYZED: {
      title: '04 / MODEL FEATURE ANALYSIS',
      stageLabel: 'Biomarker Extraction & Activation',
      desc: 'Model-based analysis of supported electrophysiological and neuroimaging features.',
      status: 'Quantified regional activation vectors, theta/alpha slowing, and ventricular dilation.',
      metrics: [
        { label: 'Frontal Spectral Slowing', value: 'θ/α Ratio 2.125 (Elevated)' },
        { label: 'Ventricular Hallmarks', value: 'VBR Expansion (+78.6% vs Norm)' },
        { label: 'Left Temporal Asymmetry', value: 'STG Volume Attenuation Detected' }
      ],
      icon: Sparkles,
      color: 'text-healthy'
    },
    INTERPRETED: {
      title: '05 / DECISION SYNTHESIS & EXPLANATION',
      stageLabel: 'Ensemble Consensus Prediction',
      desc: "Presentation of the model's supported outputs and available explanatory information.",
      status: 'Confidence-calibrated soft voting combining multimodal evidence with SHAP attributions.',
      metrics: [
        { label: 'Multimodal Consensus', value: '85.9% Schizophrenia Pattern' },
        { label: 'Modality Agreement', value: '94.2% Bilateral Concordance' },
        { label: 'Cross-Validation Benchmark', value: '82.02% 5-CV (89.5% Peak)' }
      ],
      disclaimer: 'Model explanations do not establish biological causation or a clinical diagnosis.',
      icon: CheckCircle2,
      color: 'text-forest'
    }
  };

  return (
    <div className={`p-6 rounded-panel bg-white border border-border shadow-card space-y-6 ${className}`}>
      {/* Header & State Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-healthy animate-pulse" />
            <h3 className="text-xl font-serif font-bold text-forest tracking-tight">
              Interactive Digital Brain Architecture
            </h3>
          </div>
          <p className="text-xs text-body-light mt-1 font-sans">
            Continuous 5-stage transformation from raw biological substrate to calibrated model inference
          </p>
        </div>

        {/* 5-State Selector Buttons as Serif Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-panel-light rounded-full border border-border font-mono text-[11px] overflow-x-auto">
          {(['RAW', 'PROCESSED', 'MAPPED', 'ANALYZED', 'INTERPRETED'] as const).map((st, idx) => {
            const isActive = currentState === st;
            return (
              <button
                key={st}
                onClick={() => setCurrentState(st)}
                className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-forest text-white font-bold shadow-sm'
                    : 'text-muted hover:text-forest'
                }`}
              >
                <span className="text-[9px] opacity-70">0{idx + 1}</span>
                <span className="font-serif capitalize tracking-wide">{st.toLowerCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3D Brain Viewport */}
      <div className="relative w-full aspect-[16/10] min-h-[460px] rounded-panel bg-page border border-border overflow-hidden">
        <Brain3D
          evolutionState={currentState}
          selectedChannel={selectedChannel}
          onSelectChannel={onSelectChannel}
          selectedRegionId={selectedRegion?.id}
          onSelectRegion={setSelectedRegion}
          showElectrodes={currentState !== 'RAW'}
          showTractography={currentState !== 'RAW'}
        />
      </div>

      {/* Active Stage Technical Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
        <div className="p-4 rounded-card bg-panel-light border border-border space-y-2">
          <span className="text-[10px] text-muted font-mono block uppercase tracking-wider">Pipeline Stage &bull; 0{['RAW', 'PROCESSED', 'MAPPED', 'ANALYZED', 'INTERPRETED'].indexOf(currentState) + 1}</span>
          <div className="flex items-center gap-2">
            {React.createElement(stateDetails[currentState].icon, {
              className: `w-4 h-4 ${stateDetails[currentState].color}`
            })}
            <span className={`font-serif font-bold text-sm text-forest`}>
              {stateDetails[currentState].title}
            </span>
          </div>
          <p className="text-xs text-body-light leading-relaxed">
            {stateDetails[currentState].desc}
          </p>
          <div className="text-[10px] font-mono text-forest/80 pt-1 border-t border-border/60">
            {stateDetails[currentState].status}
          </div>
        </div>

        <div className="p-4 rounded-card bg-panel-light border border-border space-y-2">
          <span className="text-[10px] text-muted font-mono block uppercase tracking-wider">Stage Metrics &amp; Telemetry</span>
          <div className="space-y-1.5 text-xs">
            {stateDetails[currentState].metrics.map((m, idx) => (
              <div key={idx} className="flex justify-between items-baseline py-0.5 border-b border-border/40 last:border-0 text-[11px]">
                <span className="text-muted">{m.label}:</span>
                <span className="text-forest font-semibold font-mono text-[11px] text-right ml-2">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-card bg-panel-light border border-border space-y-2">
          <span className="text-[10px] text-muted font-mono block uppercase tracking-wider">Scientific Context &amp; Controls</span>
          <div className="text-xs text-body-light space-y-1">
            <p>&bull; Rotate: Click &amp; drag across anatomical axes.</p>
            <p>&bull; Zoom: Mouse wheel to inspect subcortical nuclei.</p>
            <p>&bull; Select: Click any region or electrode node.</p>
          </div>
          {stateDetails[currentState].disclaimer && (
            <div className="p-2 rounded bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900 font-mono leading-tight mt-2">
              <strong>Notice:</strong> {stateDetails[currentState].disclaimer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalBrain;
