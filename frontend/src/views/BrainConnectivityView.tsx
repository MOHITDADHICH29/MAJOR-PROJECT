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
import { Badge, Button, VerticalBars } from '../components/ui';

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

  // Color mapping for correlation value: diverging muted rose to healthy green
  const getCellColor = (val: number) => {
    if (val > 0) {
      const alpha = Math.min(1, Math.max(0.12, val));
      return `rgba(46, 158, 115, ${alpha})`;
    } else {
      const alpha = Math.min(1, Math.max(0.12, Math.abs(val)));
      return `rgba(200, 71, 90, ${alpha * 0.85})`;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Functional Brain Connectivity &amp; Synchrony
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Empirical 10-20 EEG channel cross-correlation matrices and topological neural graphs
          </p>
          <div className="mt-2">
            <VerticalBars bars={5} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 font-mono text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Matrix</span>
          </Button>
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Interactive Control Panel */}
      <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-bold text-forest uppercase font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-forest" />
            Connectivity Filters &amp; Hyperparameters
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted">Active Synchrony Edges:</span>
            <Badge variant="healthy">{activeEdges.length}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-body">
              <span>Correlation Threshold (|r|):</span>
              <span className="font-mono text-forest font-semibold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.85"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-panel-light rounded-lg appearance-none cursor-pointer accent-forest"
            />
          </div>

          {/* Band Selector */}
          <div className="space-y-1.5">
            <label className="text-body block font-medium">Frequency Band:</label>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-panel-light border border-border text-body text-xs font-mono focus:outline-none focus:border-forest"
            >
              {connectivityData?.frequency_bands?.map((b) => (
                <option key={b} value={b}>{b}</option>
              )) || <option>broadband (0.5-45 Hz)</option>}
            </select>
          </div>

          {/* Channel Highlight Selector */}
          <div className="space-y-1.5">
            <label className="text-body block font-medium">Focus Electrode Node:</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-panel-light border border-border text-body text-xs font-mono focus:outline-none focus:border-forest"
            >
              <option value="All">All 19 Electrodes</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-body block font-medium">Display Layout:</label>
            <div className="grid grid-cols-3 gap-1 bg-panel-light p-1 rounded-full border border-border font-mono text-[10px]">
              {(['both', 'matrix', 'network'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`py-1 rounded-full capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-forest text-white font-bold shadow-sm'
                      : 'text-muted hover:text-forest'
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
          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-forest" />
                  19x19 Electrode Correlation Heatmap
                </h3>
                <span className="text-xs text-body-light font-sans">
                  Pairwise Pearson correlation coefficients (-1.0 to +1.0)
                </span>
              </div>
              <Badge variant="mint">Pearson r</Badge>
            </div>

            {matrix.length > 0 ? (
              <div className="overflow-x-auto pb-2 pt-2">
                <div className="inline-block min-w-[340px]">
                  {/* Top column labels */}
                  <div className="flex ml-8 mb-1">
                    {channels.map((ch, idx) => (
                      <div
                        key={idx}
                        className={`w-4 sm:w-5 text-[8px] font-mono text-center truncate ${
                          selectedChannel === ch ? 'text-forest font-bold' : 'text-muted'
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
                          selectedChannel === channels[rIdx] ? 'text-forest font-bold' : 'text-muted'
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
                              Math.abs(cellVal) >= threshold ? 'ring-1 ring-border' : 'opacity-70'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-muted font-sans">
                Connectivity matrix is not available for the current input/model.
              </div>
            )}

            {/* Matrix Legend */}
            <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] font-mono text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-risk" />
                Negative Sync (Anti-phase)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-healthy" />
                Positive Synchrony (Coherence)
              </span>
            </div>
          </div>
        )}

        {/* 2. Scalp 2D Network Topology Graph */}
        {(viewMode === 'both' || viewMode === 'network') && (
          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
                  <Network className="w-4 h-4 text-forest" />
                  Scalp 2D Network Graph
                </h3>
                <span className="text-xs text-body-light font-sans">
                  Anatomical 10-20 layout showing synchrony edges (|r| &ge; {threshold.toFixed(2)})
                </span>
              </div>
              <Badge variant="mint">10-20 Geometry</Badge>
            </div>

            {/* SVG 2D Head Map */}
            <div className="relative w-full aspect-square max-w-[380px] mx-auto bg-panel-light/60 rounded-full border border-border p-4 flex items-center justify-center">
              {/* Head Outline / Nose */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-t border-l border-border bg-white pointer-events-none" />

              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Outer Head Circle */}
                <circle cx="50" cy="50" r="46" fill="none" stroke="#D5E2DF" strokeWidth="1" strokeDasharray="3 3" />

                {/* Edges */}
                {activeEdges.map((edge, idx) => {
                  const p1 = coords[edge.from] || { x: 50, y: 50 };
                  const p2 = coords[edge.to] || { x: 50, y: 50 };
                  const strokeWidth = Math.max(0.75, Math.abs(edge.weight) * 2.2);
                  const isPos = edge.weight > 0;
                  return (
                    <line
                      key={idx}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={isPos ? '#2E9E73' : '#C8475A'}
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
                        fill={selectedChannel === ch ? '#1F4D45' : '#FFFFFF'}
                        stroke={selectedChannel === ch ? '#7CFF3F' : '#7A8A87'}
                        strokeWidth={selectedChannel === ch ? 1.5 : 1}
                        className="transition-all"
                      />
                      <text
                        x={pt.x}
                        y={pt.y + 1.2}
                        fontSize="3.0"
                        fontWeight="600"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fill={selectedChannel === ch ? '#FFFFFF' : '#1F4D45'}
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
              <div className="p-2.5 rounded-card bg-panel-light border border-border">
                <span className="text-[10px] text-muted block">Density Index</span>
                <span className="font-bold text-forest">
                  {((activeEdges.length / (channels.length * (channels.length - 1) / 2)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-card bg-panel-light border border-border">
                <span className="text-[10px] text-muted block">Mean Weight (|r|)</span>
                <span className="font-bold text-forest">
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

export default BrainConnectivityView;
