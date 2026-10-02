import React, { useState, useMemo } from 'react';
import {
  Share2,
  Sliders,
  Filter,
  Activity,
  Layers,
  Info,
  Maximize2,
  RefreshCw,
  Network
} from 'lucide-react';
import { ConnectivityMatrixResponse } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

interface BrainConnectivityViewProps {
  connectivityData: ConnectivityMatrixResponse | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const BrainConnectivityView: React.FC<BrainConnectivityViewProps> = ({
  connectivityData,
  onRefresh,
  isLoading,
}) => {
  const [threshold, setThreshold] = useState<number>(0.35);
  const [selectedBand, setSelectedBand] = useState<string>('broadband (0.5-45 Hz)');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'both' | 'matrix' | 'network'>('both');

  const channels = connectivityData?.channels || [
    'Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4',
    'O1', 'O2', 'F7', 'F8', 'T3', 'T4', 'T5', 'T6',
    'Fz', 'Cz', 'Pz'
  ];

  const matrix = connectivityData?.connectivity_matrix || [];
  const coords = connectivityData?.coordinates || {};

  // Compute active edges based on threshold
  const activeEdges = useMemo(() => {
    const edges: Array<{ from: string; to: string; weight: number }> = [];
    if (!matrix.length) return edges;

    for (let i = 0; i < channels.length; i++) {
      for (let j = i + 1; j < channels.length; j++) {
        const val = matrix[i]?.[j] ?? 0;
        if (Math.abs(val) >= threshold) {
          if (selectedChannel === 'All' || channels[i] === selectedChannel || channels[j] === selectedChannel) {
            edges.push({
              from: channels[i],
              to: channels[j],
              weight: val
            });
          }
        }
      }
    }
    return edges;
  }, [matrix, channels, threshold, selectedChannel]);

  // Color mapping for correlation value: from -1 (blue) to 0 (dark) to +1 (cyan/amber)
  const getCellColor = (val: number) => {
    if (val > 0) {
      const alpha = Math.min(1, Math.max(0.1, val));
      return `rgba(6, 182, 212, ${alpha})`;
    } else {
      const alpha = Math.min(1, Math.max(0.1, Math.abs(val)));
      return `rgba(239, 68, 68, ${alpha * 0.7})`;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-cyan-400" />
            Functional Brain Connectivity & Synchrony
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical 10-20 EEG channel cross-correlation matrices and topological neural graphs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-2 text-xs font-mono"
            title="Recalculate Connectivity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Interactive Control Panel */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Connectivity Filters & Hyperparameters
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Active Synchrony Edges:</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
              {activeEdges.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Correlation Threshold (|r|):</span>
              <span className="font-mono text-cyan-400 font-semibold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.85"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Band Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 block">Frequency Band:</label>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              {connectivityData?.frequency_bands?.map((b) => (
                <option key={b} value={b}>{b}</option>
              )) || <option>broadband (0.5-45 Hz)</option>}
            </select>
          </div>

          {/* Channel Highlight Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 block">Focus Electrode Node:</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All 19 Electrodes</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-slate-300 block">Display Layout:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 font-mono text-[10px]">
              {(['both', 'matrix', 'network'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`py-1 rounded capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualizations (Matrix + Network Graph) */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* 1. Interactive Heatmap Matrix */}
        {(viewMode === 'both' || viewMode === 'matrix') && (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  19x19 Electrode Correlation Heatmap
                </h3>
                <span className="text-[11px] text-slate-400">
                  Pairwise Pearson correlation coefficients (-1.0 to +1.0)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Pearson r</span>
            </div>

            {matrix.length > 0 ? (
              <div className="overflow-x-auto pb-2">
                <div className="inline-block min-w-[340px]">
                  {/* Top column labels */}
                  <div className="flex ml-8 mb-1">
                    {channels.map((ch, idx) => (
                      <div
                        key={idx}
                        className={`w-4 sm:w-5 text-[8px] font-mono text-center truncate ${
                          selectedChannel === ch ? 'text-cyan-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {ch}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {matrix.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center">
                      <div
                        className={`w-8 text-[9px] font-mono pr-1 text-right truncate ${
                          selectedChannel === channels[rIdx] ? 'text-cyan-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {channels[rIdx]}
                      </div>
                      <div className="flex gap-0.5">
                        {row.map((cellVal, cIdx) => (
                          <div
                            key={cIdx}
                            title={`${channels[rIdx]} - ${channels[cIdx]}: r = ${cellVal.toFixed(3)}`}
                            style={{ backgroundColor: getCellColor(cellVal) }}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-xs transition-transform hover:scale-125 hover:z-10 cursor-pointer ${
                              Math.abs(cellVal) >= threshold ? 'ring-1 ring-white/30' : 'opacity-60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                Connectivity matrix is not available for the current input/model.
              </div>
            )}

            {/* Matrix Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                Negative Sync (Anti-phase)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
                Positive Synchrony (Coherence)
              </span>
            </div>
          </div>
        )}

        {/* 2. Scalp 2D Network Topology Graph */}
        {(viewMode === 'both' || viewMode === 'network') && (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-violet-400" />
                  Scalp 2D Network Graph
                </h3>
                <span className="text-[11px] text-slate-400">
                  Anatomical 10-20 layout showing synchrony edges (|r| &ge; {threshold.toFixed(2)})
                </span>
              </div>
              <span className="text-[10px] font-mono text-violet-400 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                10-20 Geometry
              </span>
            </div>

            {/* SVG 2D Head Map */}
            <div className="relative w-full aspect-square max-w-[380px] mx-auto bg-slate-900/70 rounded-full border border-slate-800/80 p-4 flex items-center justify-center">
              {/* Head Outline / Nose */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-t border-l border-slate-700 bg-slate-900/90 pointer-events-none" />

              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Outer Head Circle */}
                <circle cx="50" cy="50" r="46" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

                {/* Edges */}
                {activeEdges.map((edge, idx) => {
                  const p1 = coords[edge.from] || { x: 50, y: 50 };
                  const p2 = coords[edge.to] || { x: 50, y: 50 };
                  const strokeWidth = Math.max(0.75, Math.abs(edge.weight) * 2.5);
                  const isPos = edge.weight > 0;
                  return (
                    <line
                      key={idx}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={isPos ? '#06B6D4' : '#F43F5E'}
                      strokeWidth={strokeWidth}
                      strokeOpacity={Math.min(0.9, Math.abs(edge.weight))}
                    />
                  );
                })}

                {/* Nodes */}
                {channels.map((ch) => {
                  const pt = coords[ch] || { x: 50, y: 50 };
                  const isSelected = selectedChannel === ch || selectedChannel === 'All';
                  return (
                    <g key={ch} className="cursor-pointer" onClick={() => setSelectedChannel(ch)}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={selectedChannel === ch ? 4.5 : 3.2}
                        fill={selectedChannel === ch ? '#06B6D4' : '#1E293B'}
                        stroke={selectedChannel === ch ? '#FFFFFF' : '#64748B'}
                        strokeWidth={selectedChannel === ch ? 1.5 : 1}
                        className="transition-all"
                      />
                      <text
                        x={pt.x}
                        y={pt.y + 1.2}
                        fontSize="3.2"
                        fontWeight="600"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fill={selectedChannel === ch ? '#070A12' : '#F1F5F9'}
                        className="pointer-events-none"
                      >
                        {ch}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Graph Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Density Index</span>
                <span className="font-bold text-slate-200">
                  {((activeEdges.length / (channels.length * (channels.length - 1) / 2)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Mean Weight (|r|)</span>
                <span className="font-bold text-cyan-400">
                  {activeEdges.length > 0
                    ? (activeEdges.reduce((acc, e) => acc + Math.abs(e.weight), 0) / activeEdges.length).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
