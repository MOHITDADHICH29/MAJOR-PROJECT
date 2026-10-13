import React, { useState, useRef, useEffect } from 'react';
import { Layers, Sliders, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Box } from 'lucide-react';
import { ROIAttribution } from '../../types';
import { Badge, Button } from '../ui';

interface NeuroimagingViewerProps {
  roiAttributions?: ROIAttribution[];
  subjectId?: string;
  className?: string;
}

export const NeuroimagingViewer: React.FC<NeuroimagingViewerProps> = ({
  roiAttributions = [],
  subjectId = 'sub-01',
  className = ''
}) => {
  const [activePlane, setActivePlane] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
  const [sliceIndex, setSliceIndex] = useState(48);
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.2);
  const [showRoiOverlay, setShowRoiOverlay] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Synthetic anatomical slice rendering simulating T1w MPRAGE tissue contrast (stays authentic grayscale)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep radiological background
    ctx.fillStyle = '#0F1514';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = 140 * zoomLevel;

    // Head / Skull outline (bright cortical bone on T1)
    ctx.save();
    ctx.filter = `brightness(${brightness * 100}%) contrast(${contrast * 100}%)`;

    ctx.strokeStyle = '#4A5B57';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (activePlane === 'axial') {
      ctx.ellipse(cx, cy, baseRadius * 0.9, baseRadius * 1.1, 0, 0, Math.PI * 2);
    } else if (activePlane === 'sagittal') {
      ctx.ellipse(cx, cy, baseRadius * 1.1, baseRadius * 0.95, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(cx, cy, baseRadius * 0.95, baseRadius * 0.95, 0, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Gray matter & White matter parenchymal fields
    const sliceFactor = 1.0 - Math.abs(sliceIndex - 48) / 48.0;
    const grad = ctx.createRadialGradient(cx, cy, 20 * zoomLevel, cx, cy, baseRadius * 0.85);
    grad.addColorStop(0, '#5A6B67');
    grad.addColorStop(0.4, '#2B3B37');
    grad.addColorStop(0.75, '#52635F');
    grad.addColorStop(0.9, '#1E2B28');
    grad.addColorStop(1, '#0F1514');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, baseRadius * 0.82 * sliceFactor, baseRadius * 0.95 * sliceFactor, 0, 0, Math.PI * 2);
    ctx.fill();

    // Central Ventricular Cavities (CSF is hypointense/dark on T1w)
    const ventScale = (1.0 + (sliceIndex > 40 && sliceIndex < 56 ? 0.35 : 0.05)) * zoomLevel;
    ctx.fillStyle = '#0F1514';
    ctx.beginPath();
    // Left & Right butterfly horns of lateral ventricles
    ctx.ellipse(cx - 24 * zoomLevel, cy - 8 * zoomLevel, 14 * ventScale, 28 * ventScale, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 24 * zoomLevel, cy - 8 * zoomLevel, 14 * ventScale, 28 * ventScale, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Third ventricle (midline slit)
    ctx.fillRect(cx - 3 * zoomLevel, cy - 12 * zoomLevel, 6 * zoomLevel, 32 * zoomLevel);

    ctx.restore();

    // 111-ROI Statistical Saliency / Heatmap Overlay
    if (showRoiOverlay) {
      ctx.save();
      // Lateral ventricle attribution halo (enlargement)
      const ventAttributionGrad = ctx.createRadialGradient(
        cx, cy, 10 * zoomLevel,
        cx, cy, 65 * zoomLevel
      );
      ventAttributionGrad.addColorStop(0, 'rgba(200, 71, 90, 0.55)'); // Muted rose
      ventAttributionGrad.addColorStop(0.7, 'rgba(200, 71, 90, 0.15)');
      ventAttributionGrad.addColorStop(1, 'rgba(200, 71, 90, 0)');

      ctx.fillStyle = ventAttributionGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 55 * zoomLevel, 45 * zoomLevel, 0, 0, Math.PI * 2);
      ctx.fill();

      // DLPFC (Prefrontal cortical attribution in muted slate-blue)
      if (activePlane === 'axial' || activePlane === 'sagittal') {
        const dlpfcGrad = ctx.createRadialGradient(
          cx, cy - 85 * zoomLevel, 10 * zoomLevel,
          cx, cy - 85 * zoomLevel, 45 * zoomLevel
        );
        dlpfcGrad.addColorStop(0, 'rgba(79, 109, 143, 0.6)'); // Muted slate-blue
        dlpfcGrad.addColorStop(1, 'rgba(79, 109, 143, 0)');
        ctx.fillStyle = dlpfcGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 85 * zoomLevel, 45 * zoomLevel, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Crosshairs
    ctx.strokeStyle = 'rgba(31, 77, 69, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anatomical orientation tags
    ctx.fillStyle = '#B9EDE6';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    if (activePlane === 'axial') {
      ctx.fillText('A (Anterior)', cx - 35, 24);
      ctx.fillText('P (Posterior)', cx - 35, h - 16);
      ctx.fillText('R (Right)', 16, cy + 4);
      ctx.fillText('L (Left)', w - 65, cy + 4);
    } else if (activePlane === 'sagittal') {
      ctx.fillText('S (Superior)', cx - 35, 24);
      ctx.fillText('I (Inferior)', cx - 35, h - 16);
      ctx.fillText('A (Anterior)', 16, cy + 4);
      ctx.fillText('P (Posterior)', w - 85, cy + 4);
    } else {
      ctx.fillText('S (Superior)', cx - 35, 24);
      ctx.fillText('I (Inferior)', cx - 35, h - 16);
      ctx.fillText('R (Right)', 16, cy + 4);
      ctx.fillText('L (Left)', w - 65, cy + 4);
    }
  }, [activePlane, sliceIndex, brightness, contrast, showRoiOverlay, zoomLevel]);

  return (
    <div className={`p-6 rounded-panel bg-white border border-border shadow-card space-y-6 ${className}`}>
      {/* Title & Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-mri" />
            <h3 className="text-xl font-serif text-forest font-semibold tracking-tight">
              Multi-Planar 3D Neuroimaging Suite
            </h3>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Volumetric T1w MPRAGE slice navigation &amp; 111-ROI morphometric atlas parcellation
          </p>
        </div>

        {/* Acquisition Metadata Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Badge variant="mint">MPRAGE 3D T1w</Badge>
          <Badge variant="mint">3.0 Tesla</Badge>
          <Badge variant="mri">96x96x96 Isotropic</Badge>
        </div>
      </div>

      {/* Plane Selection & Slice Controls in Light Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-panel-light p-3.5 rounded-card border border-border">
        {/* Orthogonal Plane Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-border font-sans text-xs w-full sm:w-auto">
          {(['axial', 'sagittal', 'coronal'] as const).map(p => (
            <button
              key={p}
              onClick={() => setActivePlane(p)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full capitalize font-medium transition-all ${
                activePlane === p
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-muted hover:text-forest'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Slice Scrubber */}
        <div className="flex items-center gap-3 w-full sm:w-72 font-mono text-xs">
          <span className="text-muted whitespace-nowrap">SLICE {sliceIndex}/96</span>
          <input
            type="range"
            min="0"
            max="95"
            value={sliceIndex}
            onChange={(e) => setSliceIndex(parseInt(e.target.value))}
            className="w-full h-1.5 bg-border rounded-full cursor-pointer accent-forest"
          />
        </div>

        {/* Overlay and Zoom Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRoiOverlay(!showRoiOverlay)}
            className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium flex items-center gap-1.5 transition-colors ${
              showRoiOverlay
                ? 'bg-forest text-white border-forest'
                : 'bg-white text-muted border-border hover:text-forest'
            }`}
            title="Toggle Saliency Overlay"
          >
            {showRoiOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Atlas Saliency</span>
          </button>

          <button
            onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.25))}
            className="p-2 rounded-full bg-white text-muted border border-border hover:text-forest hover:bg-panel-light transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(0.75, z - 0.25))}
            className="p-2 rounded-full bg-white text-muted border border-border hover:text-forest hover:bg-panel-light transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoomLevel(1.0); setBrightness(1.0); setContrast(1.2); }}
            className="p-2 rounded-full bg-white text-muted border border-border hover:text-forest hover:bg-panel-light transition-colors"
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slice Canvas Viewport in Light Outer Frame */}
      <div className="relative w-full aspect-square max-w-[480px] mx-auto bg-panel-light rounded-panel border border-border p-3 shadow-sm flex items-center justify-center">
        <div className="relative w-full h-full rounded-card overflow-hidden bg-black flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={460}
            height={460}
            className="w-full h-full block"
          />

          {/* Telemetry HUD */}
          <div className="absolute top-3 left-4 font-mono text-[10px] text-panel-dark pointer-events-none space-y-0.5">
            <div>SUBJECT: {subjectId}</div>
            <div>PLANE: {activePlane.toUpperCase()} &bull; SLICE {sliceIndex}</div>
          </div>

          <div className="absolute bottom-3 right-4 font-mono text-[9px] text-panel-dark/80 pointer-events-none">
            FOV: 240mm &bull; VOXEL: 1.0mm&sup3;
          </div>
        </div>
      </div>

      {/* Anatomical ROI Attribution Indicators with Muted Color Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-card bg-panel-light border border-border space-y-2.5">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider block font-semibold">
            Morphometric Model Attributions (111-ROI Atlas)
          </span>
          <div className="space-y-2 text-xs">
            {(roiAttributions.length > 0 ? roiAttributions : [
              { region: 'Lateral Ventricular System (VBR)', attribution_score: 0.88, finding: 'Central volume expansion detected', key: 'risk' },
              { region: 'Dorsolateral Prefrontal Cortex (DLPFC)', attribution_score: 0.81, finding: 'Bilateral density attenuation', key: 'mri' },
              { region: 'Superior Temporal Gyrus (STG)', attribution_score: 0.64, finding: 'Left temporal cortical thinning', key: 'neutral' }
            ]).map((roi, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 rounded-card bg-white border border-border">
                <div>
                  <span className="font-semibold text-forest block">{roi.region}</span>
                  <span className="text-[11px] text-body-light font-sans">{roi.finding}</span>
                </div>
                <Badge variant={idx === 0 ? 'risk' : 'mri'}>
                  {(roi.attribution_score * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Contrast / Windowing Sliders */}
        <div className="p-4 rounded-card bg-panel-light border border-border space-y-3">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5 font-semibold">
            <Sliders className="w-3.5 h-3.5 text-forest" />
            Radiological Window &amp; Level Controls
          </span>
          <div className="space-y-3 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between text-muted text-[11px]">
                <span>Brightness (Window Level):</span>
                <span className="text-forest font-semibold">{brightness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={brightness}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border rounded-full cursor-pointer accent-forest"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-muted text-[11px]">
                <span>Contrast (Window Width):</span>
                <span className="text-forest font-semibold">{contrast.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.2"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border rounded-full cursor-pointer accent-forest"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NeuroimagingViewer;
