import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  Layers,
  Activity,
  Brain,
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  TrendingUp,
  GitBranch
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { EvaluationResponse } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

interface EvaluationViewProps {
  evalData: EvaluationResponse | null;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ evalData }) => {
  const [activeModality, setActiveModality] = useState<'all' | 'eeg' | 'mri' | 'multimodal'>('all');

  const summary = evalData?.summary || [];
  const cm = evalData?.confusion_matrices;

  // ROC Curve Data points
  const rocPoints = evalData?.roc_curves
    ? evalData.roc_curves.fpr.map((fpr, i) => ({
        fpr,
        eeg: evalData.roc_curves.tpr_eeg[i],
        mri: evalData.roc_curves.tpr_mri[i],
        multimodal: evalData.roc_curves.tpr_multimodal[i],
      }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LineChartIcon className="w-6 h-6 text-cyan-400" />
            Empirical Evaluation & Cross-Validation Benchmarks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            5-fold stratified cross-validation performance, confusion matrices, and ROC-AUC curves
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          {(['all', 'eeg', 'mri', 'multimodal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveModality(tab)}
              className={`px-3 py-1 rounded-lg capitalize transition-all ${
                activeModality === tab
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Summary Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {summary.map((item, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl glass-panel border space-y-4 ${
              item.modality.includes('Multimodal')
                ? 'border-violet-500/40 shadow-glow-violet bg-violet-950/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                {item.modality}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                item.modality.includes('Multimodal')
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                Peak: {item.peak_accuracy.toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {item.mean_cv_accuracy.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-400 font-mono ml-1.5">
                &plusmn; {item.cv_accuracy_std.toFixed(2)}%
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                {item.principle}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-xs">
              <div className="p-1.5 rounded-lg bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">F1-Score</span>
                <span className="font-bold text-slate-200">{item.mean_f1.toFixed(4)}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">ROC-AUC</span>
                <span className="font-bold text-cyan-400">{item.mean_auc.toFixed(4)}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">Correct</span>
                <span className="font-bold text-emerald-400">{item.correct_predictions}</span>
              </div>
            </div>

            {item.qc_excluded_count && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 font-mono">
                &dagger; {item.qc_excluded_count} scans excluded via automated QC ({item.qc_exclusion_reason})
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ROC Curves & 5-Fold Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curves Chart */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Receiver Operating Characteristic (ROC)
              </h3>
              <span className="text-[11px] text-slate-400">
                Sensitivity vs. (1 - Specificity) across diagnostic thresholds
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              AUC Benchmark
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocPoints} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="fpr" stroke="#9CA3AF" tick={{ fontSize: 11 }} label={{ value: 'False Positive Rate', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="multimodal" name="Multimodal (AUC 0.8958)" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="eeg" name="EEG Only (AUC 0.8578)" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="mri" name="MRI Only (AUC 0.7078)" stroke="#06B6D4" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5-Fold Stratified Breakdown Table */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              EEG 5-Fold Stratified Cross-Validation
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">N=124 Subjects</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="pb-2">Fold</th>
                  <th className="pb-2">Accuracy</th>
                  <th className="pb-2">F1-Score</th>
                  <th className="pb-2">ROC-AUC</th>
                  <th className="pb-2">Holdout (n)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {evalData?.eeg_5fold?.map((f) => (
                  <tr key={f.fold} className="hover:bg-slate-800/40">
                    <td className="py-2 font-bold text-cyan-400">Fold {f.fold}</td>
                    <td className="py-2">{f.accuracy.toFixed(2)}%</td>
                    <td className="py-2">{f.f1.toFixed(4)}</td>
                    <td className="py-2 text-emerald-400">{f.auc.toFixed(4)}</td>
                    <td className="py-2 text-slate-400">{f.correct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Ensemble Mean: <strong className="text-white">77.43% &plusmn; 5.36%</strong></span>
            <span>Peak Fold 1: <strong className="text-emerald-400">84.00%</strong></span>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Breakdown */}
      {cm && (
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Confusion Matrices Across Modalities
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {[
              { label: 'EEG Only (N=124)', matrix: cm.eeg, acc: '77.43%' },
              { label: 'MRI Only (N=77)', matrix: cm.mri, acc: '72.58%' },
              { label: 'Multimodal Fusion (N=201)', matrix: cm.multimodal, acc: '82.02%' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span className="text-cyan-400 font-bold">{item.acc}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">True Positive (SZ)</span>
                    <span className="text-base font-bold text-emerald-400">{item.matrix.tp}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] text-slate-400 block">False Positive</span>
                    <span className="text-base font-bold text-rose-400">{item.matrix.fp}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block">False Negative</span>
                    <span className="text-base font-bold text-amber-400">{item.matrix.fn}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">True Negative (HC)</span>
                    <span className="text-base font-bold text-emerald-400">{item.matrix.tn}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
