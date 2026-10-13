import React from 'react';
import {
  Cpu,
  Activity,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  ShieldAlert,
  Percent
} from 'lucide-react';
import { EEGAnalysisResult, MRIAnalysisResult, MultimodalAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';
import { Badge, Button, VerticalBars } from '../components/ui';

interface PredictionViewProps {
  eegResult: EEGAnalysisResult | null;
  mriResult: MRIAnalysisResult | null;
  fusionResult: MultimodalAnalysisResult | null;
  onNavigate: (page: any) => void;
  onRunFusion: () => void;
  isFusing: boolean;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  eegResult,
  mriResult,
  fusionResult,
  onNavigate,
  onRunFusion,
  isFusing,
}) => {
  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Multimodal Prediction &amp; Confidence Scoring
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Independent electrophysiological and morphometric predictions combined via high-confidence decision fusion
          </p>
          <div className="mt-2">
            <VerticalBars bars={5} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {eegResult && mriResult && !fusionResult && (
            <Button
              variant="primary"
              size="md"
              onClick={onRunFusion}
              disabled={isFusing}
              className="flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isFusing ? 'Computing Fusion...' : 'Run Decision Fusion'}</span>
            </Button>
          )}

          {fusionResult && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('explainability')}
              className="flex items-center gap-2"
            >
              <span>Explainable AI</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Central Hero Result Card (Multimodal Fusion) */}
      {fusionResult ? (
        <div className="p-8 rounded-panel bg-panel-alt border border-forest/30 shadow-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest/15 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-mono tracking-widest text-forest uppercase font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Multimodal Synergistic Consensus Prediction
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest tracking-tight">
                {fusionResult.prediction_label}
              </h2>
              <p className="text-xs text-body-light font-sans">
                Decision Strategy: {fusionResult.fusion_method}
              </p>
            </div>

            {/* Confidence Gauge */}
            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-card border border-border shadow-sm">
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-muted block">Calibrated Confidence</span>
                <span className="text-3xl font-bold font-serif text-forest">
                  {fusionResult.confidence.toFixed(1)}%
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-panel-light text-forest flex items-center justify-center font-bold text-xs">
                <Percent className="w-5 h-5 text-forest" />
              </div>
            </div>
          </div>

          {/* Probability Breakdown Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-healthy font-semibold">Healthy Control: {(fusionResult.probabilities.healthy_control * 100).toFixed(1)}%</span>
              <span className="text-risk font-semibold">Schizophrenia Class: {(fusionResult.probabilities.schizophrenia * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white border border-border overflow-hidden flex">
              <div
                className="h-full bg-healthy transition-all duration-700"
                style={{ width: `${fusionResult.probabilities.healthy_control * 100}%` }}
              />
              <div
                className="h-full bg-risk transition-all duration-700"
                style={{ width: `${fusionResult.probabilities.schizophrenia * 100}%` }}
              />
            </div>
          </div>

          {/* Synergy & Contributions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-card bg-white border border-border">
              <span className="text-[11px] text-muted block">EEG Weight Factor</span>
              <span className="text-sm font-bold text-forest font-mono">
                {(fusionResult.modality_contributions.eeg_weight * 100).toFixed(0)}% (Electrophysiology)
              </span>
            </div>
            <div className="p-4 rounded-card bg-white border border-border">
              <span className="text-[11px] text-muted block">MRI Weight Factor</span>
              <span className="text-sm font-bold text-mri font-mono">
                {(fusionResult.modality_contributions.mri_weight * 100).toFixed(0)}% (Morphometry)
              </span>
            </div>
            <div className="p-4 rounded-card bg-white border border-border">
              <span className="text-[11px] text-muted block">Synergistic Gain</span>
              <span className="text-sm font-bold text-forest font-mono">
                {fusionResult.modality_contributions.cross_modal_synergy_gain}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-panel bg-panel-light border border-dashed border-border text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center mx-auto text-muted">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-serif font-bold text-forest">Multimodal Fusion Ready</h3>
          <p className="text-xs text-body-light max-w-md mx-auto font-sans">
            {eegResult && mriResult
              ? 'Both EEG and MRI analyses are ready. Click "Run Decision Fusion" above to synthesize results.'
              : 'Load or upload both an EEG recording and an MRI scan in the Data Input section to activate cross-modal decision fusion.'}
          </p>
        </div>
      )}

      {/* Two Modality Blocks (EEG & MRI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EEG Block */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-panel-light text-forest flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-base text-forest">EEG Modality Result</h3>
                <span className="text-xs text-muted">Electrophysiology</span>
              </div>
            </div>
            <Badge variant="mint">EEG Model</Badge>
          </div>

          {eegResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-card bg-panel-light border border-border space-y-1">
                <span className="text-[10px] font-mono uppercase text-muted">Model Prediction</span>
                <span className="text-base font-serif font-bold text-forest block">
                  {eegResult.prediction_label}
                </span>
                <span className="text-xs font-mono text-healthy font-semibold">
                  Confidence: {eegResult.confidence.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between text-body-light">
                  <span>Model:</span>
                  <span className="text-forest font-mono text-[11px] truncate max-w-[200px]">{eegResult.model_name}</span>
                </div>
                <div className="flex justify-between text-body-light">
                  <span>Subject:</span>
                  <span className="text-body font-mono text-[11px]">{eegResult.subject_id}</span>
                </div>
                <div className="flex justify-between text-body-light">
                  <span>Theta/Alpha Slowing Ratio:</span>
                  <span className="text-forest font-mono text-[11px] font-bold">{eegResult.metadata.theta_alpha_slowing_ratio}</span>
                </div>
                <div className="flex justify-between text-body-light">
                  <span>Features Computed:</span>
                  <span className="text-body font-mono text-[11px]">{eegResult.features_extracted_count} biomarkers</span>
                </div>
              </div>

              {/* Mini probability gauge */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-mono text-muted mb-1">
                  <span>Control: {(eegResult.probabilities.healthy_control * 100).toFixed(1)}%</span>
                  <span>SZ: {(eegResult.probabilities.schizophrenia * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-panel-light overflow-hidden flex">
                  <div className="h-full bg-healthy" style={{ width: `${eegResult.probabilities.healthy_control * 100}%` }} />
                  <div className="h-full bg-risk" style={{ width: `${eegResult.probabilities.schizophrenia * 100}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted font-sans">
              No EEG data loaded. Ingest an EEG sample to view prediction.
            </div>
          )}
        </div>

        {/* MRI Block */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-panel-light text-mri flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-base text-forest">MRI Modality Result</h3>
                <span className="text-xs text-muted">3D Morphometry</span>
              </div>
            </div>
            <Badge variant="mri">MRI Model</Badge>
          </div>

          {mriResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-card bg-panel-light border border-border space-y-1">
                <span className="text-[10px] font-mono uppercase text-muted">Model Prediction</span>
                <span className="text-base font-serif font-bold text-forest block">
                  {mriResult.prediction_label}
                </span>
                <span className="text-xs font-mono text-mri font-semibold">
                  Confidence: {mriResult.confidence.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between text-body-light">
                  <span>Model:</span>
                  <span className="text-forest font-mono text-[11px] truncate max-w-[200px]">{mriResult.model_name}</span>
                </div>
                <div className="flex justify-between text-body-light">
                  <span>Subject:</span>
                  <span className="text-body font-mono text-[11px]">{mriResult.subject_id}</span>
                </div>
                <div className="flex justify-between text-body-light">
                  <span>VBR (Ventricular Ratio):</span>
                  <span className="text-mri font-mono text-[11px] font-bold">{mriResult.metadata.vbr_percent}%</span>
                </div>
                <div className="flex justify-between text-body-light">
                  <span>Atlas Parcellation:</span>
                  <span className="text-body font-mono text-[11px]">{mriResult.metadata.atlas_parcellation}</span>
                </div>
              </div>

              {/* Mini probability gauge */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-mono text-muted mb-1">
                  <span>Control: {(mriResult.probabilities.healthy_control * 100).toFixed(1)}%</span>
                  <span>SZ: {(mriResult.probabilities.schizophrenia * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-panel-light overflow-hidden flex">
                  <div className="h-full bg-healthy" style={{ width: `${mriResult.probabilities.healthy_control * 100}%` }} />
                  <div className="h-full bg-risk" style={{ width: `${mriResult.probabilities.schizophrenia * 100}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted font-sans">
              No MRI scan loaded. Ingest an MRI scan to view prediction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionView;
