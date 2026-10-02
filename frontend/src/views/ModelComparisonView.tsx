import React, { useState } from 'react';
import {
  GitCompare,
  Activity,
  Brain,
  Cpu,
  Trophy,
  BarChart2,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ModelComparisonResponse, ModelComparisonRow } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

interface ModelComparisonViewProps {
  comparisonData: ModelComparisonResponse | null;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({ comparisonData }) => {
  const [selectedModality, setSelectedModality] = useState<'all' | 'eeg' | 'mri' | 'multimodal'>('all');

  const eegModels = comparisonData?.eeg_models || [];
  const mriModels = comparisonData?.mri_models || [];
  const multiModels = comparisonData?.multimodal_models || [];

  let displayedModels: ModelComparisonRow[] = [];
  if (selectedModality === 'all') {
    displayedModels = [...multiModels, ...eegModels, ...mriModels];
  } else if (selectedModality === 'eeg') {
    displayedModels = eegModels;
  } else if (selectedModality === 'mri') {
    displayedModels = mriModels;
  } else {
    displayedModels = multiModels;
  }

  // Bar chart comparison data
  const chartData = [
    { name: 'Multimodal Fusion', accuracy: 82.02, f1: 84.01, fill: '#8B5CF6' },
    { name: 'EEG Ensemble', accuracy: 77.43, f1: 76.75, fill: '#10B981' },
    { name: 'EEG ExtraTrees', accuracy: 76.20, f1: 75.10, fill: '#059669' },
    { name: 'EEG RandomForest', accuracy: 75.80, f1: 74.90, fill: '#047857' },
    { name: 'EEG XGBoost', accuracy: 75.00, f1: 73.80, fill: '#065F46' },
    { name: 'MRI Ensemble', accuracy: 72.58, f1: 79.81, fill: '#06B6D4' },
    { name: 'MRI ExtraTrees', accuracy: 71.40, f1: 78.50, fill: '#0891B2' },
    { name: 'MRI RandomForest', accuracy: 70.80, f1: 77.90, fill: '#0E7490' },
    { name: 'Raw 1D-CNN (Old)', accuracy: 59.00, f1: 58.30, fill: '#64748B' },
    { name: '3D Voxel CNN (Old)', accuracy: 36.36, f1: 0.00, fill: '#475569' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-cyan-400" />
            Multi-Model Architecture Comparison
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardized evaluation comparing baseline neural networks against calibrated soft-voting ensembles
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          {(['all', 'eeg', 'mri', 'multimodal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedModality(tab)}
              className={`px-3 py-1 rounded-lg capitalize transition-all ${
                selectedModality === tab
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

      {/* Benchmark Highlight Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-dark-800 to-slate-900 border border-violet-500/30 shadow-glow-violet flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 font-bold block">
              Overall Benchmark Leader
            </span>
            <h2 className="text-lg font-black text-white">
              Synergistic Cross-Modal High-Confidence Decision Fusion
            </h2>
            <span className="text-xs text-slate-300">
              Combines machine-invariant EEG spectral dynamics with 111-ROI MRI atlas morphometry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Mean 5-CV Accuracy</span>
            <span className="text-2xl font-extrabold text-violet-300">82.02%</span>
          </div>
          <div className="text-right border-l border-slate-700 pl-6">
            <span className="text-[10px] text-slate-400 uppercase block">Peak Fold Performance</span>
            <span className="text-2xl font-extrabold text-emerald-400">89.50%</span>
          </div>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Classifier Performance Comparison (Accuracy & F1-Score)
            </h3>
            <span className="text-[11px] text-slate-400">
              Comparing 5-fold cross-validation results across all evaluated architectures
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">5-Fold Stratified CV</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="accuracy" name="Accuracy (%)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-acc-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Comparison Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          Benchmark Classifier Architecture Leaderboard
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="pb-2.5">Model Architecture</th>
                <th className="pb-2.5">Modality</th>
                <th className="pb-2.5">Mean Accuracy</th>
                <th className="pb-2.5">Mean F1-Score</th>
                <th className="pb-2.5">Mean ROC-AUC</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayedModels.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-semibold text-slate-200 flex items-center gap-2">
                    {idx === 0 && selectedModality === 'all' && (
                      <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                    <span>{row.model}</span>
                  </td>
                  <td className="py-3 text-slate-400">{row.modality}</td>
                  <td className="py-3 font-bold text-cyan-300">{row.accuracy.toFixed(2)}%</td>
                  <td className="py-3 text-slate-200">{row.f1.toFixed(4)}</td>
                  <td className="py-3 text-emerald-400">{row.auc.toFixed(4)}</td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      row.status.includes('Best') || row.status.includes('Highest')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
                        : row.status.includes('Superseded') || row.status.includes('Collapsed')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
