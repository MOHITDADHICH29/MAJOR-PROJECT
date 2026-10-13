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
import { Badge, ChartColors, defaultTooltipStyle, VerticalBars } from '../components/ui';

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

  // Bar chart comparison data with muted medical palette
  const chartData = [
    { name: 'Multimodal Fusion', accuracy: 82.02, f1: 84.01, fill: ChartColors.eeg },
    { name: 'EEG Ensemble', accuracy: 77.43, f1: 76.75, fill: ChartColors.healthy },
    { name: 'EEG ExtraTrees', accuracy: 76.20, f1: 75.10, fill: '#3BAE84' },
    { name: 'EEG RandomForest', accuracy: 75.80, f1: 74.90, fill: '#4EBE94' },
    { name: 'EEG XGBoost', accuracy: 75.00, f1: 73.80, fill: '#62CCA5' },
    { name: 'MRI Ensemble', accuracy: 72.58, f1: 79.81, fill: ChartColors.mri },
    { name: 'MRI ExtraTrees', accuracy: 71.40, f1: 78.50, fill: '#5F7D9F' },
    { name: 'MRI RandomForest', accuracy: 70.80, f1: 77.90, fill: '#6F8CAF' },
    { name: 'Raw 1D-CNN (Old)', accuracy: 59.00, f1: 58.30, fill: '#9EAEA8' },
    { name: '3D Voxel CNN (Old)', accuracy: 36.36, f1: 0.00, fill: '#B5C3BE' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Multi-Model Architecture Comparison
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Standardized evaluation comparing baseline neural networks against calibrated soft-voting ensembles
          </p>
          <div className="mt-2">
            <VerticalBars bars={5} />
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-panel-light rounded-full border border-border text-xs font-sans">
          {(['all', 'eeg', 'mri', 'multimodal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedModality(tab)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition-all ${
                selectedModality === tab
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

      {/* Benchmark Highlight Banner */}
      <div className="p-6 rounded-panel bg-panel-alt border border-forest/30 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-forest text-white flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-forest font-bold block">
              Overall Benchmark Leader
            </span>
            <h2 className="text-xl font-serif font-bold text-forest">
              Synergistic Cross-Modal High-Confidence Decision Fusion
            </h2>
            <span className="text-xs text-body-light font-sans">
              Combines machine-invariant EEG spectral dynamics with 111-ROI MRI atlas morphometry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-muted uppercase block">Mean 5-CV Accuracy</span>
            <span className="text-2xl font-bold font-serif text-forest">82.02%</span>
          </div>
          <div className="text-right border-l border-border pl-6">
            <span className="text-[10px] text-muted uppercase block">Peak Fold Performance</span>
            <span className="text-2xl font-bold font-serif text-healthy">89.50%</span>
          </div>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-forest" />
              Classifier Performance Comparison (Accuracy &amp; F1-Score)
            </h3>
            <span className="text-xs text-body-light font-sans">
              Comparing 5-fold cross-validation results across all evaluated architectures
            </span>
          </div>
          <Badge variant="mint">5-Fold Stratified CV</Badge>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.grid} vertical={false} />
              <XAxis dataKey="name" stroke={ChartColors.axisText} tick={{ fontSize: 10, fill: ChartColors.axisText }} angle={-25} textAnchor="end" interval={0} />
              <YAxis stroke={ChartColors.axisText} tick={{ fontSize: 11, fill: ChartColors.axisText }} domain={[0, 100]} />
              <Tooltip contentStyle={defaultTooltipStyle} />
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
      <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
        <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-forest" />
          Benchmark Classifier Architecture Leaderboard
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted text-[10px] uppercase">
                <th className="pb-2.5">Model Architecture</th>
                <th className="pb-2.5">Modality</th>
                <th className="pb-2.5">Mean Accuracy</th>
                <th className="pb-2.5">Mean F1-Score</th>
                <th className="pb-2.5">Mean ROC-AUC</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-body">
              {displayedModels.map((row, idx) => (
                <tr key={idx} className="hover:bg-page transition-colors">
                  <td className="py-3 font-semibold text-forest flex items-center gap-2">
                    {idx === 0 && selectedModality === 'all' && (
                      <Trophy className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                    )}
                    <span>{row.model}</span>
                  </td>
                  <td className="py-3 text-muted">{row.modality}</td>
                  <td className="py-3 font-bold text-forest">{row.accuracy.toFixed(2)}%</td>
                  <td className="py-3 text-body">{row.f1.toFixed(4)}</td>
                  <td className="py-3 text-healthy font-semibold">{row.auc.toFixed(4)}</td>
                  <td className="py-3">
                    <Badge variant={
                      row.status.includes('Best') || row.status.includes('Highest')
                        ? 'healthy'
                        : row.status.includes('Superseded') || row.status.includes('Collapsed')
                        ? 'risk'
                        : 'neutral'
                    }>
                      {row.status}
                    </Badge>
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

export default ModelComparisonView;
