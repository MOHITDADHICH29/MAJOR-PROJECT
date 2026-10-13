import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  Layers,
  Activity,
  Brain,
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
import { Badge, ChartColors, defaultTooltipStyle } from '../components/ui';

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
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Empirical Evaluation &amp; Cross-Validation Benchmarks
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            5-fold stratified cross-validation performance, confusion matrices, and ROC-AUC curves
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-panel-light rounded-full border border-border text-xs font-sans">
          {(['all', 'eeg', 'mri', 'multimodal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveModality(tab)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition-all ${
                activeModality === tab
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-muted hover:text-forest'
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
        {summary.map((item, idx) => {
          const isFusion = item.modality.includes('Multimodal');
          return (
            <div
              key={idx}
              className={`p-6 rounded-panel border space-y-4 shadow-card ${
                isFusion
                  ? 'bg-panel-alt border-forest/40'
                  : 'bg-white border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-forest uppercase font-mono tracking-wide">
                  {item.modality}
                </span>
                <Badge variant={isFusion ? 'forest' : 'mint'}>
                  Peak: {item.peak_accuracy.toFixed(1)}%
                </Badge>
              </div>

              <div>
                <span className="text-3xl font-serif font-bold text-forest tracking-tight">
                  {item.mean_cv_accuracy.toFixed(2)}%
                </span>
                <span className="text-xs text-muted font-mono ml-1.5">
                  &plusmn; {item.cv_accuracy_std.toFixed(2)}%
                </span>
                <span className="block text-[11px] text-body-light mt-0.5 font-sans">
                  {item.principle}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center font-mono text-xs">
                <div className="p-2 rounded-card bg-panel-light">
                  <span className="text-[10px] text-muted block">F1-Score</span>
                  <span className="font-semibold text-body">{item.mean_f1.toFixed(4)}</span>
                </div>
                <div className="p-2 rounded-card bg-panel-light">
                  <span className="text-[10px] text-muted block">ROC-AUC</span>
                  <span className="font-semibold text-forest">{item.mean_auc.toFixed(4)}</span>
                </div>
                <div className="p-2 rounded-card bg-panel-light">
                  <span className="text-[10px] text-muted block">Correct</span>
                  <span className="font-semibold text-healthy">{item.correct_predictions}</span>
                </div>
              </div>

              {item.qc_excluded_count && (
                <div className="p-2.5 rounded-card bg-warning-light border border-warning/30 text-[10px] text-warning font-mono">
                  &dagger; {item.qc_excluded_count} scans excluded via automated QC ({item.qc_exclusion_reason})
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ROC Curves & 5-Fold Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curves Chart */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-forest" />
                Receiver Operating Characteristic (ROC)
              </h3>
              <span className="text-xs text-body-light">
                Sensitivity vs. (1 - Specificity) across diagnostic thresholds
              </span>
            </div>
            <Badge variant="mint">AUC 0.8958</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocPoints} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.grid} />
                <XAxis dataKey="fpr" stroke={ChartColors.axisText} tick={{ fontSize: 11 }} label={{ value: 'False Positive Rate', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: ChartColors.axisText }} />
                <YAxis stroke={ChartColors.axisText} tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: ChartColors.axisText }} />
                <Tooltip contentStyle={defaultTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="multimodal" name="Multimodal (AUC 0.8958)" stroke={ChartColors.eeg} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="eeg" name="EEG Only (AUC 0.8578)" stroke={ChartColors.healthy} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="mri" name="MRI Only (AUC 0.7078)" stroke={ChartColors.mri} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5-Fold Stratified Breakdown Table */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-forest" />
              EEG 5-Fold Stratified Cross-Validation
            </h3>
            <span className="text-xs font-mono text-muted">N=124 Subjects</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted text-[10px] uppercase">
                  <th className="pb-2">Fold</th>
                  <th className="pb-2">Accuracy</th>
                  <th className="pb-2">F1-Score</th>
                  <th className="pb-2">ROC-AUC</th>
                  <th className="pb-2">Holdout (n)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-body">
                {(evalData?.eeg_5fold || [
                  { fold: 1, accuracy: 84.00, f1: 0.8462, auc: 0.9744, correct: '21 / 25' },
                  { fold: 2, accuracy: 76.00, f1: 0.7273, auc: 0.8590, correct: '19 / 25' },
                  { fold: 3, accuracy: 68.00, f1: 0.6667, auc: 0.7308, correct: '17 / 25' },
                  { fold: 4, accuracy: 80.00, f1: 0.7826, auc: 0.8846, correct: '20 / 25' },
                  { fold: 5, accuracy: 79.17, f1: 0.8148, auc: 0.8403, correct: '19 / 24' },
                ]).map((f) => (
                  <tr key={f.fold} className="hover:bg-page transition-colors">
                    <td className="py-2.5 font-bold text-forest">Fold {f.fold}</td>
                    <td className="py-2.5 text-healthy font-semibold">{f.accuracy.toFixed(2)}%</td>
                    <td className="py-2.5">{f.f1.toFixed(4)}</td>
                    <td className="py-2.5 text-forest">{f.auc.toFixed(4)}</td>
                    <td className="py-2.5 text-muted">{f.correct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-card bg-panel-light border border-border text-xs text-muted flex items-center justify-between font-mono">
            <span>Ensemble Mean: <strong className="text-forest">77.43% &plusmn; 5.36%</strong></span>
            <span>Peak Fold: <strong className="text-healthy">84.00%</strong></span>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Heatmap (Single-Hue Green Scale) */}
      {cm && (
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
            <Layers className="w-4 h-4 text-forest" />
            Confusion Matrices Across Modalities (Single-Hue Green Scale)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {[
              { label: 'EEG Only (N=124)', matrix: cm.eeg, acc: '77.43%' },
              { label: 'MRI Only (N=77)', matrix: cm.mri, acc: '72.58%' },
              { label: 'Multimodal Fusion (N=201)', matrix: cm.multimodal, acc: '82.02%' },
            ].map((item, idx) => (
              <div key={idx} className="p-5 rounded-card bg-panel-light border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-forest">{item.label}</span>
                  <Badge variant="healthy">{item.acc}</Badge>
                </div>

                {/* Single-hue green matrix cells */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-3 rounded-card bg-white border border-healthy/40 text-forest">
                    <span className="text-[10px] text-muted block">True Positive (SZ)</span>
                    <span className="text-lg font-bold text-forest">{item.matrix.tp}</span>
                  </div>
                  <div className="p-3 rounded-card bg-white border border-border text-muted">
                    <span className="text-[10px] text-muted block">False Positive</span>
                    <span className="text-lg font-bold text-risk">{item.matrix.fp}</span>
                  </div>
                  <div className="p-3 rounded-card bg-white border border-border text-muted">
                    <span className="text-[10px] text-muted block">False Negative</span>
                    <span className="text-lg font-bold text-warning">{item.matrix.fn}</span>
                  </div>
                  <div className="p-3 rounded-card bg-white border border-healthy/40 text-forest">
                    <span className="text-[10px] text-muted block">True Negative (HC)</span>
                    <span className="text-lg font-bold text-healthy">{item.matrix.tn}</span>
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
export default EvaluationView;
