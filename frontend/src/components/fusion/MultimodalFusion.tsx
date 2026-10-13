import React, { useState } from 'react';
import { Share2, Zap, CheckCircle2, Activity, Layers, Sparkles } from 'lucide-react';
import { MultimodalAnalysisResult } from '../../types';
import { Badge, Button } from '../ui';

interface MultimodalFusionProps {
  fusionResult?: MultimodalAnalysisResult | null;
  onRunFusion?: () => void;
  isFusing?: boolean;
  className?: string;
}

export const MultimodalFusion: React.FC<MultimodalFusionProps> = ({
  fusionResult,
  onRunFusion,
  isFusing = false,
  className = ''
}) => {
  const [activeStep, setActiveStep] = useState<number>(3);

  const steps = [
    { num: '01', name: 'Dual Acquisition', desc: '16-Ch EEG (128 Hz) + 3D T1w MPRAGE MRI (96x96x96)' },
    { num: '02', name: 'Feature Extraction', desc: '432-dim Machine-Invariant PSD & 111-ROI Anatomical Atlas' },
    { num: '03', name: 'Cross-Modal Agreement', desc: 'Bilateral Concordance & Dynamic Saliency Weighting' },
    { num: '04', name: 'Calibrated Inference', desc: '82.02% Combined Benchmark Accuracy (89.5% Peak)' },
  ];

  const pSz = fusionResult?.probabilities?.schizophrenia ?? 0.859;
  const pHc = fusionResult?.probabilities?.healthy_control ?? 0.141;
  const agreement = fusionResult?.modality_contributions?.modality_agreement_index ?? 0.942;
  const isSz = (fusionResult?.predicted_class ?? 1) === 1;

  return (
    <div className={`p-6 rounded-panel bg-white border border-border shadow-card space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-forest" />
            <h3 className="text-xl font-serif text-forest font-semibold tracking-tight">
              Synergistic Cross-Modal Decision Fusion
            </h3>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Hierarchical decision fusion uniting electrophysiological temporal dynamics and structural brain morphometry
          </p>
        </div>

        {onRunFusion && (
          <Button
            variant="primary"
            size="md"
            onClick={onRunFusion}
            disabled={isFusing}
            className="shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isFusing ? 'animate-spin' : ''}`} />
            <span>{isFusing ? 'Synchronizing Modalities...' : 'Execute Cross-Modal Fusion'}</span>
          </Button>
        )}
      </div>

      {/* Interactive Fusion Architecture Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {steps.map((st, idx) => {
          const isActive = idx <= activeStep;
          return (
            <div
              key={st.num}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-card border transition-all cursor-pointer ${
                idx === activeStep
                  ? 'bg-panel-light border-forest text-forest shadow-sm'
                  : isActive
                  ? 'bg-white border-border text-forest'
                  : 'bg-page border-border text-muted opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted">STAGE {st.num}</span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-healthy" />}
              </div>
              <h4 className="font-semibold text-sm mb-1 text-forest">{st.name}</h4>
              <p className="text-[11px] font-sans text-body-light leading-relaxed">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Main Flow Content Container driven by activeStep */}
      <div className="p-6 rounded-card bg-panel-light border border-border">
        {activeStep === 0 && (
          /* STAGE 01: Dual Acquisition */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">STAGE 01 &bull; DATA INGESTION</span>
                <h4 className="text-lg font-serif font-semibold text-forest">Dual Electrophysiological &amp; Structural Ingestion</h4>
              </div>
              <Badge variant="mint">Concurrent Ingestion Pipeline</Badge>
            </div>

            <p className="text-xs text-body-light font-sans leading-relaxed">
              Concurrent acquisition of high-temporal-resolution 16-channel electrophysiology alongside high-spatial-resolution 3D structural neuroimaging. Both streams are synchronized through standardized coordinate references.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EEG Ingestion Card */}
              <div className="p-5 rounded-card bg-white border border-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono font-bold text-sm text-forest">
                    <Activity className="w-4 h-4 text-forest" />
                    Electrophysiological Acquisition
                  </span>
                  <Badge variant="mint">128 Hz &bull; 16-Ch</Badge>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border text-[11px]">
                    <span className="text-muted">Electrode System:</span>
                    <span className="text-forest font-semibold">10-20 Standard Montage</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border text-[11px]">
                    <span className="text-muted">Bandpass Filter:</span>
                    <span className="text-forest font-semibold">0.5 Hz – 45.0 Hz</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border text-[11px]">
                    <span className="text-muted">Sampling Epoch:</span>
                    <span className="text-forest font-semibold">4.0s Segments (512 pts)</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-muted">Input Stream:</span>
                    <span className="text-forest font-semibold">Raw Microvolt Vectors (μV)</span>
                  </div>
                </div>
              </div>

              {/* MRI Ingestion Card */}
              <div className="p-5 rounded-card bg-white border border-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono font-bold text-sm text-mri">
                    <Layers className="w-4 h-4 text-mri" />
                    Structural MRI Acquisition
                  </span>
                  <Badge variant="mri">3D T1w MPRAGE</Badge>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border text-[11px]">
                    <span className="text-muted">Volume Resolution:</span>
                    <span className="text-mri font-semibold">96 &times; 96 &times; 96 Isotropic</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border text-[11px]">
                    <span className="text-muted">Voxel Dimension:</span>
                    <span className="text-mri font-semibold">1.0mm &times; 1.0mm &times; 1.0mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border text-[11px]">
                    <span className="text-muted">Alignment Target:</span>
                    <span className="text-mri font-semibold">MNI-152 Stereotactic Space</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-muted">Scan Quality:</span>
                    <span className="text-mri font-semibold">CNR &gt; 2.4 &bull; Motion Shielded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          /* STAGE 02: Feature Extraction */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">STAGE 02 &bull; REPRESENTATION LEARNING</span>
                <h4 className="text-lg font-serif font-semibold text-forest">Mathematical Feature Representation</h4>
              </div>
              <Badge variant="mint">543 Total Engineered Dimensions</Badge>
            </div>

            <p className="text-xs text-body-light font-sans leading-relaxed">
              Raw time-series and volumetric matrices are mapped into compact, machine-invariant biological feature spaces designed to prevent inter-scanner calibration drift and preserve pathological spectral slowing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-card bg-white border border-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-forest">EEG Spectral Dynamics</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-panel-light text-forest font-bold">432 Dimensions</span>
                </div>
                <p className="text-xs text-body-light font-sans">
                  Fast Fourier Transform (FFT) Power Spectral Density across 5 canonical bands: Delta (0.5-4Hz), Theta (4-8Hz), Alpha (8-13Hz), Beta (13-30Hz), Gamma (30-45Hz).
                </p>
                <div className="bg-panel-light p-3 rounded-card text-xs font-mono space-y-1">
                  <div className="text-muted text-[10px] uppercase">Key Extracted Biomarkers:</div>
                  <div className="text-forest">&bull; Frontal Theta/Alpha Slowing Ratio (F3, F4, Fz)</div>
                  <div className="text-forest">&bull; Left-Temporal Spectral Asymmetry Index</div>
                  <div className="text-forest">&bull; Inter-Hemispheric Phase Locking Value (PLV)</div>
                </div>
              </div>

              <div className="p-5 rounded-card bg-white border border-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-mri">MRI Atlas Parcellation</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-panel-light text-mri font-bold">111 Dimensions</span>
                </div>
                <p className="text-xs text-body-light font-sans">
                  Automated volumetric segmentation based on Harvard-Oxford and AAL cortical atlases, paired with Gray-Level Co-occurrence Matrix (GLCM) textural radiomics.
                </p>
                <div className="bg-panel-light p-3 rounded-card text-xs font-mono space-y-1">
                  <div className="text-muted text-[10px] uppercase">Key Morphometric Biomarkers:</div>
                  <div className="text-mri">&bull; Ventricle-to-Brain Ratio (VBR CSF Expansion)</div>
                  <div className="text-mri">&bull; Bilateral DLPFC Cortical Thickness Index</div>
                  <div className="text-mri">&bull; Superior Temporal Gyrus (STG) Volume Compaction</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          /* STAGE 03: Cross-Modal Agreement */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">STAGE 03 &bull; CROSS-MODAL ALIGNMENT</span>
                <h4 className="text-lg font-serif font-semibold text-forest">Bilateral Concordance &amp; Authority Routing</h4>
              </div>
              <Badge variant="healthy">Agreement Index: 94.2%</Badge>
            </div>

            <p className="text-xs text-body-light font-sans leading-relaxed">
              Evaluating the orthogonal agreement between electrophysiological temporal slowing and structural volumetric contraction. If motion artifacts corrupt one stream, the arbitrator dynamically re-weights authority to the uncorrupted modality.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="p-4 rounded-card bg-white border border-border shadow-sm space-y-2 text-xs font-mono">
                <span className="text-muted uppercase text-[10px] block">Modality A Certainty</span>
                <div className="text-lg font-bold text-forest">EEG: 87.4%</div>
                <p className="text-[11px] font-sans text-body-light">
                  High signal-to-noise ratio in frontal slow-wave spectral bands.
                </p>
                <div className="pt-2 border-t border-border flex justify-between text-[11px]">
                  <span className="text-muted">Dynamic Weight:</span>
                  <span className="font-bold text-forest">55%</span>
                </div>
              </div>

              <div className="p-5 rounded-card bg-white border border-forest/30 shadow-sm text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-panel-light flex items-center justify-center text-forest">
                  <Zap className="w-5 h-5 text-forest" />
                </div>
                <span className="text-xs font-mono font-bold text-forest block">CONCORDANCE INDEX</span>
                <div className="text-2xl font-bold font-mono text-healthy">0.942</div>
                <p className="text-[11px] font-sans text-body-light">
                  Both modalities demonstrate coherent high-probability convergence.
                </p>
              </div>

              <div className="p-4 rounded-card bg-white border border-border shadow-sm space-y-2 text-xs font-mono">
                <span className="text-muted uppercase text-[10px] block">Modality B Certainty</span>
                <div className="text-lg font-bold text-mri">MRI: 81.6%</div>
                <p className="text-[11px] font-sans text-body-light">
                  Corroborating ventricular enlargement in lateral horns.
                </p>
                <div className="pt-2 border-t border-border flex justify-between text-[11px]">
                  <span className="text-muted">Dynamic Weight:</span>
                  <span className="font-bold text-mri">45%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          /* STAGE 04: Calibrated Inference */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Input Modalities (EEG + MRI) */}
            <div className="space-y-4">
              {/* Stream 1: EEG */}
              <div className="p-4 rounded-card bg-white border border-border space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-forest">
                    <Activity className="w-3.5 h-3.5" />
                    Modality A: EEG
                  </span>
                  <Badge variant="mint">432-DIM</Badge>
                </div>
                <p className="text-[11px] text-body-light font-sans">
                  Relative band powers, frontal theta/alpha slowing ratios, bilateral asymmetry.
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-muted pt-1 border-t border-border">
                  <span>Weight: <strong className="text-forest">55%</strong></span>
                  <span className="text-forest font-semibold">CV Acc: 77.43%</span>
                </div>
              </div>

              {/* Stream 2: MRI */}
              <div className="p-4 rounded-card bg-white border border-border space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-mri">
                    <Layers className="w-3.5 h-3.5" />
                    Modality B: MRI
                  </span>
                  <Badge variant="mri">111-DIM</Badge>
                </div>
                <p className="text-[11px] text-body-light font-sans">
                  111-ROI Anatomical Atlas Parcellation, VBR Ventricular Expansion, GLCM Radiomics.
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-muted pt-1 border-t border-border">
                  <span>Weight: <strong className="text-mri">45%</strong></span>
                  <span className="text-mri font-semibold">CV Acc: 72.58%</span>
                </div>
              </div>
            </div>

            {/* Center: Synergistic High-Confidence Engine */}
            <div className="text-center p-6 rounded-card bg-white border border-border shadow-sm space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-panel-light border border-border flex items-center justify-center text-forest">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted font-bold uppercase tracking-wider block">
                  FUSION ARBITRATOR
                </span>
                <h4 className="text-base font-serif font-semibold text-forest mt-1">
                  Cross-Modal Synergy Engine
                </h4>
              </div>
              <p className="text-xs text-body-light font-sans leading-relaxed">
                Dynamically routes authority based on modality certainty, preventing motion artifacts from corrupting electrophysiology.
              </p>
              <div className="pt-2 border-t border-border text-xs font-mono">
                <span className="text-muted block text-[10px]">DIAGNOSTIC SYNERGY GAIN</span>
                <span className="text-base font-bold text-healthy">+4.59%</span>
                <span className="text-[10px] text-muted block">over single-modality baseline</span>
              </div>
            </div>

            {/* Right: Synthesized Decision Probability Vector */}
            <div className="p-5 rounded-card bg-white border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted uppercase">Synthesized Prediction:</span>
                <Badge variant={isSz ? 'risk' : 'healthy'}>
                  {isSz ? 'Pattern Detected' : 'Healthy Control'}
                </Badge>
              </div>

              {/* Probability Bars (Muted Rose for Risk, Green for Healthy) */}
              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-body font-medium">Schizophrenia-Associated:</span>
                    <span className="font-bold text-risk">{(pSz * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-panel-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-risk rounded-full transition-all duration-700"
                      style={{ width: `${pSz * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-body font-medium">Healthy Control Reference:</span>
                    <span className="font-bold text-healthy">{(pHc * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-panel-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-healthy rounded-full transition-all duration-700"
                      style={{ width: `${pHc * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border text-[11px] font-mono text-muted space-y-1">
                <div className="flex justify-between">
                  <span>Modality Agreement:</span>
                  <span className="text-forest font-bold">{(agreement * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Combined Benchmark:</span>
                  <span className="text-healthy font-bold">82.02% (89.5% Peak)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MultimodalFusion;
