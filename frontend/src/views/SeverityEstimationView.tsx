import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Layers,
  Lock,
  Calendar,
  FileQuestion,
  Brain
} from 'lucide-react';
import { SeverityResponse } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

interface SeverityEstimationViewProps {
  severityData: SeverityResponse | null;
}

export const SeverityEstimationView: React.FC<SeverityEstimationViewProps> = ({ severityData }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Clinical Severity Estimation Protocol
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardized psychiatric symptom scale analysis (PANSS / BPRS dimensional scoring)
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <Lock className="w-3.5 h-3.5" />
          RESEARCH BOUNDARY: DISABLED
        </span>
      </div>

      <ResearchDisclaimer />

      {/* Main Official Status Card */}
      <div className="p-8 rounded-2xl glass-panel border border-amber-500/25 space-y-6 text-center max-w-3xl mx-auto my-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Severity Estimation is Not Currently Available in this Research Pipeline
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto">
            {severityData?.scientific_rationale ||
              'The current dataset cohorts (ds004302, ds005073, and EEG button-tone datasets) contain diagnostic categorical labels (Healthy Control vs. Schizophrenia) but do not include standardized continuous clinical symptom scale ratings. In accordance with clinical research protocol guidelines, artificial severity scores are strictly withheld.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2 font-mono text-slate-400">
          <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
            Diagnostic Classification vs. Symptom Severity Distinction
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-emerald-400 font-bold block mb-1">Active Pipeline: Categorical Diagnosis</span>
              <p className="text-slate-300 text-[10px] leading-normal">
                Delineates statistical membership between Healthy Control and Schizophrenia patterns using 352-dim electrophysiology and 111-dim anatomical atlas features.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">Reserved Scope: Continuous PANSS Rating</span>
              <p className="text-slate-300 text-[10px] leading-normal">
                Predicts numerical Positive, Negative, and General psychopathology severity subscores (30-210 scale). Requires validated prospective clinical trial annotations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prospective Research Roadmap */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          Clinical Severity Integration Roadmap
        </h3>
        <p className="text-xs text-slate-400">
          Future clinical cohorts and data requirements needed to enable continuous psychiatric symptom grading
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">1. PANSS Scales</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Acquisition of paired Positive and Negative Syndrome Scale ratings (7 positive, 7 negative, 16 general items) administered by trained raters.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">2. Multimodal Regression</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Transition from discrete binary classification to multi-target Ridge / Gradient Boosted Regression for continuous symptom index estimation.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">3. Pharmacotherapy Covariates</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Incorporation of chlorpromazine (CPZ) equivalent daily dosage logs to decouple medication-induced EEG slowing from primary illness severity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
