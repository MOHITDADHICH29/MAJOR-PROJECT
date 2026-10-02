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
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Multimodal Prediction & Confidence Scoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Independent electrophysiological and morphometric predictions combined via high-confidence decision fusion
          </p>
        </div>

        <div className="flex items-center gap-3">
          {eegResult && mriResult && !fusionResult && (
            <button
              onClick={onRunFusion}
              disabled={isFusing}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow-violet flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isFusing ? 'Computing Fusion...' : 'Run Decision Fusion'}
            </button>
          )}

          {fusionResult && (
            <button
              onClick={() => onNavigate('explainability')}
              className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <span>Explainable AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <ResearchDisclaimer />

      {/* Central Hero Result Card (Multimodal Fusion) */}
      {fusionResult ? (
        <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-dark-800 to-cyan-950/40 border border-cyan-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Multimodal Synergistic Consensus Prediction
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {fusionResult.prediction_label}
              </h2>
              <p className="text-xs text-slate-400">
                Decision Strategy: {fusionResult.fusion_method}
              </p>
            </div>

            {/* Confidence Gauge */}
            <div className="flex items-center gap-4 bg-slate-900/80 px-6 py-4 rounded-xl border border-slate-700/80">
              <div className="text-right">
                <span className="text-[11px] font-mono uppercase text-slate-400 block">Calibrated Confidence</span>
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
                  {fusionResult.confidence.toFixed(1)}%
                </span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 flex items-center justify-center font-bold text-xs text-white">
                <Percent className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Probability Breakdown Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-400">Healthy Control: {(fusionResult.probabilities.healthy_control * 100).toFixed(1)}%</span>
              <span className="text-amber-400">Schizophrenia Class: {(fusionResult.probabilities.schizophrenia * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${fusionResult.probabilities.healthy_control * 100}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${fusionResult.probabilities.schizophrenia * 100}%` }}
              />
            </div>
          </div>

          {/* Synergy & Contributions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">EEG Weight Factor</span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {(fusionResult.modality_contributions.eeg_weight * 100).toFixed(0)}% (Electrophysiology)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">MRI Weight Factor</span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {(fusionResult.modality_contributions.mri_weight * 100).toFixed(0)}% (Morphometry)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Synergistic Gain</span>
              <span className="text-sm font-bold text-violet-400 font-mono">
                {fusionResult.modality_contributions.cross_modal_synergy_gain}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl glass-panel border border-dashed border-slate-700 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Multimodal Fusion Ready</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {eegResult && mriResult
              ? 'Both EEG and MRI analyses are ready. Click "Run Decision Fusion" above to synthesize results.'
              : 'Load or upload both an EEG recording and an MRI scan in the Data Input section to activate cross-modal decision fusion.'}
          </p>
        </div>
      )}

      {/* Two Modality Blocks (EEG & MRI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EEG Block */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">EEG Modality Result</h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Electrophysiology
            </span>
          </div>

          {eegResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Model Prediction</span>
                <span className="text-base font-bold text-white block">
                  {eegResult.prediction_label}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Confidence: {eegResult.confidence.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Model:</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate max-w-[200px]">{eegResult.model_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subject:</span>
                  <span className="text-slate-200 font-mono text-[11px]">{eegResult.subject_id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Theta/Alpha Slowing Ratio:</span>
                  <span className="text-cyan-300 font-mono text-[11px]">{eegResult.metadata.theta_alpha_slowing_ratio}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Features Computed:</span>
                  <span className="text-slate-200 font-mono text-[11px]">{eegResult.features_extracted_count} biomarkers</span>
                </div>
              </div>

              {/* Mini probability gauge */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Control: {(eegResult.probabilities.healthy_control * 100).toFixed(1)}%</span>
                  <span>SZ: {(eegResult.probabilities.schizophrenia * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${eegResult.probabilities.healthy_control * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${eegResult.probabilities.schizophrenia * 100}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No EEG data loaded. Ingest an EEG sample to view prediction.
            </div>
          )}
        </div>

        {/* MRI Block */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">MRI Modality Result</h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              3D Morphometry
            </span>
          </div>

          {mriResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Model Prediction</span>
                <span className="text-base font-bold text-white block">
                  {mriResult.prediction_label}
                </span>
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  Confidence: {mriResult.confidence.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Model:</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate max-w-[200px]">{mriResult.model_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subject:</span>
                  <span className="text-slate-200 font-mono text-[11px]">{mriResult.subject_id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>VBR (Ventricular Ratio):</span>
                  <span className="text-cyan-300 font-mono text-[11px]">{mriResult.metadata.vbr_percent}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Atlas Parcellation:</span>
                  <span className="text-slate-200 font-mono text-[11px]">{mriResult.metadata.atlas_parcellation}</span>
                </div>
              </div>

              {/* Mini probability gauge */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Control: {(mriResult.probabilities.healthy_control * 100).toFixed(1)}%</span>
                  <span>SZ: {(mriResult.probabilities.schizophrenia * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${mriResult.probabilities.healthy_control * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${mriResult.probabilities.schizophrenia * 100}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No MRI scan loaded. Ingest an MRI scan to view prediction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
