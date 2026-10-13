import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause } from 'lucide-react';
import { Badge, Button } from '../ui';

interface EEGViewerProps {
  selectedChannel: string;
  onSelectChannel: (channel: string) => void;
  channelImportance?: Array<{ channel: string; importance: number; power?: number }>;
  bandPowers?: Record<string, number>;
  className?: string;
}

export const EEG_CHANNELS = [
  'Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8',
  'T3', 'C3', 'Cz', 'C4', 'T4',
  'T5', 'P3', 'Pz', 'P4', 'T6',
  'O1', 'O2'
];

export const EEGViewer: React.FC<EEGViewerProps> = ({
  selectedChannel,
  onSelectChannel,
  channelImportance = [],
  bandPowers,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  // Default band powers if not provided
  const activeBands = bandPowers || {
    delta: 0.26,
    theta: 0.32,
    alpha: 0.18,
    beta: 0.16,
    gamma: 0.08
  };

  // Importance lookup
  const importanceMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    channelImportance.forEach(item => {
      map[item.channel] = item.importance;
    });
    return map;
  }, [channelImportance]);

  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const timeOffsetRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPlayingRef.current) {
        // Delta-time based smooth progression: ~45% of original speed
        const baseSpeed = 0.85;
        timeOffsetRef.current += dt * baseSpeed * speedRef.current;
      }

      const localTime = timeOffsetRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Clean white medical background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      // Soft medical EEG grid lines (#E3ECE9)
      ctx.strokeStyle = '#E3ECE9';
      ctx.lineWidth = 1;
      const colStep = 40;
      for (let x = 0; x < w; x += colStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Display 8 priority channels simultaneously
      const displayChannels = [
        selectedChannel,
        ...EEG_CHANNELS.filter(c => c !== selectedChannel).slice(0, 7)
      ];

      const rowHeight = h / displayChannels.length;

      displayChannels.forEach((ch, idx) => {
        const isSelected = ch === selectedChannel;
        const centerY = idx * rowHeight + rowHeight / 2;

        // Active channel highlight background strip
        if (isSelected) {
          ctx.fillStyle = '#E8F1EF';
          ctx.fillRect(0, idx * rowHeight, w, rowHeight);
        }

        // Channel baseline separator
        ctx.strokeStyle = isSelected ? '#C9D6D3' : '#EDF3F1';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();

        // Waveform generation: dark green for active, muted slate/green for others
        ctx.beginPath();
        ctx.lineWidth = isSelected ? 2.0 : 1.2;
        ctx.strokeStyle = isSelected ? '#1F4D45' : '#7A8A87';

        const amp = (rowHeight * 0.35) * (isSelected ? 1.25 : 0.85);

        for (let x = 0; x < w; x += 2) {
          // Continuous, synchronized wave components with subtle high-freq harmonics
          const t = localTime + x * 0.012;
          const delta = Math.sin(t * 1.2 + idx * 0.6) * 0.42;
          const theta = Math.sin(t * 3.6 + idx * 0.5) * 0.60;
          const alpha = Math.sin(t * 9.2 + idx * 0.8) * (ch.startsWith('O') ? 0.75 : 0.38);
          const beta = Math.sin(t * 18.0) * 0.12;
          const noise = Math.sin(t * 28.0 + x * 0.05) * 0.04;

          const y = centerY + (delta + theta + alpha + beta + noise) * amp;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Monospace label on left
        ctx.fillStyle = isSelected ? '#1F4D45' : '#7A8A87';
        ctx.font = isSelected ? 'bold 11px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
        ctx.fillText(ch, 12, centerY - 6);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedChannel, importanceMap]);

  // Compute slowing ratio
  const thetaAlphaRatio = (activeBands.theta / Math.max(0.01, activeBands.alpha)).toFixed(2);

  return (
    <div className={`p-6 rounded-panel bg-white border border-border shadow-card space-y-6 ${className}`}>
      {/* Title & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-forest" />
            <h3 className="text-xl font-serif text-forest font-semibold tracking-tight">
              Electrophysiological 10-20 Signal Monitor
            </h3>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Machine-invariant resting-state EEG with signature channel-to-brain coregistration
          </p>
        </div>

        {/* Playback Controls & Sampling Badge */}
        <div className="flex items-center gap-3">
          <Badge variant="mint">
            128 Hz &bull; 0.5-45 Hz Bandpass
          </Badge>

          <div className="flex items-center gap-1 bg-panel-light p-1 rounded-full border border-border">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-full text-forest hover:bg-white transition-colors"
              title={isPlaying ? 'Pause signal' : 'Stream signal'}
              aria-label={isPlaying ? 'Pause signal' : 'Stream signal'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSpeed(s => s === 0.5 ? 1 : s === 1 ? 2 : 0.5)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-forest hover:bg-white transition-colors"
              title="Toggle playback speed"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>

      {/* 10-20 Electrode Channel Selector Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
            Select Electrode Coordinate:
          </span>
          <span className="text-xs font-mono text-forest">
            Active Channel: <strong className="font-bold">{selectedChannel}</strong>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EEG_CHANNELS.map(ch => {
            const isSelected = ch === selectedChannel;
            const imp = importanceMap[ch];
            return (
              <button
                key={ch}
                onClick={() => onSelectChannel(ch)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-forest text-white shadow-sm'
                    : 'bg-panel-light text-body hover:text-forest hover:bg-panel border border-border'
                }`}
              >
                <span>{ch}</span>
                {imp !== undefined && (
                  <span className={`text-[9px] px-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'text-forest bg-white'}`}>
                    {(imp * 100).toFixed(0)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Waveform Canvas Viewport (White Background + Soft Grid + Dark Green Waveforms) */}
      <div className="relative w-full h-[280px] bg-white rounded-card border border-border overflow-hidden shadow-sm">
        <canvas
          ref={canvasRef}
          width={800}
          height={280}
          className="w-full h-full block"
        />

        {/* Scale indicator */}
        <div className="absolute top-3 right-4 font-mono text-[10px] text-muted flex items-center gap-2 pointer-events-none">
          <span>VERTICAL SCALE: &plusmn;50 &mu;V</span>
          <span>&bull;</span>
          <span>EPOCH: 4.0 SEC</span>
        </div>

        {/* Disclaimer footer inside canvas box */}
        <div className="absolute bottom-2 left-4 right-4 text-[9px] font-mono text-muted/80 pointer-events-none flex items-center justify-between">
          <span>RESEARCH STREAM: 10-20 ELECTRODES</span>
          <span>Not an individual patient diagnostic measurement</span>
        </div>
      </div>

      {/* Relative Band Power & Theta/Alpha Slowing Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        {Object.entries(activeBands).map(([band, fraction]) => {
          const isElevated = (band === 'theta' || band === 'delta') && fraction > 0.25;
          return (
            <div key={band} className="p-3 rounded-card bg-panel-light border border-border space-y-1">
              <div className="flex justify-between items-center text-[10px] text-muted uppercase">
                <span>{band}</span>
                {isElevated && (
                  <span className="text-[9px] text-risk font-bold">ELEVATED</span>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-forest">{(fraction * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-muted">PSD</span>
              </div>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isElevated ? 'bg-risk' : 'bg-forest'}`}
                  style={{ width: `${Math.min(100, fraction * 250)}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Theta/Alpha Slowing Ratio Card */}
        <div className="p-3 rounded-card bg-panel-alt border border-border space-y-1 col-span-2 sm:col-span-1">
          <div className="flex justify-between items-center text-[10px] text-forest font-semibold uppercase">
            <span>&theta;/&alpha; SLOWING</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-forest">{thetaAlphaRatio}</span>
            <span className="text-[10px] text-forest">RATIO</span>
          </div>
          <div className="text-[9px] text-muted font-sans truncate">
            {Number(thetaAlphaRatio) > 1.8 ? 'Slow-wave deficit' : 'Normative baseline'}
          </div>
        </div>
      </div>
    </div>
  );
};
export default EEGViewer;
