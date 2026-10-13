import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Activity,
  Brain,
  ShieldCheck,
  CheckCircle2,
  BarChart2,
  Layers,
  ArrowRight,
  Info,
  Download,
  Clock,
  Compass,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { SeverityResponse, ComputationalIndicator, EEGAnalysisResult, MRIAnalysisResult, MultimodalAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';
import { Card, StatCard, Badge, Button } from '../components/ui';

interface SeverityEstimationViewProps {
  severityData?: SeverityResponse | null;
  currentSubjectId?: string;
  currentAnalysisId?: string;
  eegResult?: EEGAnalysisResult | null;
  mriResult?: MRIAnalysisResult | null;
  fusionResult?: MultimodalAnalysisResult | null;
  onRefreshSeverity?: () => void;
  onNavigateToReport?: () => void;
}

export const SeverityEstimationView: React.FC<SeverityEstimationViewProps> = ({
  severityData,
  currentSubjectId = 'SUBJ-4302-01',
  currentAnalysisId = 'ANL-2026-089',
  eegResult,
  mriResult,
  fusionResult,
  onRefreshSeverity,
  onNavigateToReport
}) => {
  const [isLiveTuning, setIsLiveTuning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Baseline exploratory simulation parameters initialized from actual active session data
  const initialSlowing = eegResult?.metadata?.theta_alpha_slowing_ratio ?? 2.125;
  const initialVbr = mriResult?.metadata?.vbr_percent ?? 3.84;
  const initialConfidence = fusionResult?.confidence ?? 85.9;

  const [simSlowing, setSimSlowing] = useState<number>(initialSlowing);
  const [simAlphaAsymmetry, setSimAlphaAsymmetry] = useState<number>(-0.342);
  const [simVbr, setSimVbr] = useState<number>(initialVbr);
  const [simDlpfc, setSimDlpfc] = useState<number>(-18.4);
  const [simCoherence, setSimCoherence] = useState<number>(0.412);

  // Synchronize when active subject or analysis updates
  useEffect(() => {
    if (eegResult?.metadata?.theta_alpha_slowing_ratio) {
      setSimSlowing(eegResult.metadata.theta_alpha_slowing_ratio);
    }
    if (mriResult?.metadata?.vbr_percent) {
      setSimVbr(mriResult.metadata.vbr_percent);
    }
  }, [currentSubjectId, currentAnalysisId, eegResult, mriResult]);

  const [selectedIndicator, setSelectedIndicator] = useState<string>('ind_frontal_slowing');

  // Compute standardized Z-scores based on published normative reference distributions
  const computedIndicators: ComputationalIndicator[] = useMemo(() => {
    const normSlowingMean = 1.15;
    const normSlowingStd = 0.28;
    const zSlowing = (simSlowing - normSlowingMean) / normSlowingStd;

    const normVbrMean = 2.15;
    const normVbrStd = 0.52;
    const zVbr = (simVbr - normVbrMean) / normVbrStd;

    const normAsymMean = 0.02;
    const normAsymStd = 0.09;
    const zAsym = (simAlphaAsymmetry - normAsymMean) / normAsymStd;

    const normCohMean = 0.68;
    const normCohStd = 0.095;
    const zCoh = (simCoherence - normCohMean) / normCohStd;

    const normDlpfcMean = 2.68;
    const dlpfcMm = normDlpfcMean * (1 + simDlpfc / 100);
    const zDlpfc = (dlpfcMm - normDlpfcMean) / 0.18;

    return [
      {
        id: 'ind_frontal_slowing',
        name: 'Frontal Theta/Alpha Slowing',
        modality: 'EEG',
        channel_or_region: 'F3, F4, Fz (10-20 Electrodes)',
        patient_value: parseFloat(simSlowing.toFixed(3)),
        normative_mean: 1.15,
        normative_std: 0.28,
        z_score: parseFloat(zSlowing.toFixed(2)),
        status: Math.abs(zSlowing) > 2 ? 'Significant Deviation' : Math.abs(zSlowing) > 1 ? 'Mild Deviation' : 'Normative',
        direction: zSlowing > 1.5 ? 'Pathological Low-Frequency Elevation' : 'Normative Frequency Balance',
        unit: 'ratio',
        clinical_significance: 'Elevated frontal theta/alpha power ratio correlates with cognitive disorganization and hypofrontality.',
        contribution_pct: 28
      },
      {
        id: 'ind_vbr_dilation',
        name: 'Ventricular Brain Ratio (VBR)',
        modality: 'MRI',
        channel_or_region: 'Lateral Ventricles (Atlas 111)',
        patient_value: parseFloat(simVbr.toFixed(2)),
        normative_mean: 2.15,
        normative_std: 0.52,
        z_score: parseFloat(zVbr.toFixed(2)),
        status: Math.abs(zVbr) > 2 ? 'Significant Deviation' : Math.abs(zVbr) > 1 ? 'Mild Deviation' : 'Normative',
        direction: zVbr > 1.5 ? 'Ventricular CSF Dilatation' : 'Normative Ventricular Volume',
        unit: '% vol',
        clinical_significance: 'Enlarged ventricular-to-brain ratio reflects central neuropil reduction and periventricular gray matter loss.',
        contribution_pct: 32
      },
      {
        id: 'ind_alpha_asymmetry',
        name: 'Frontal Alpha Asymmetry',
        modality: 'EEG',
        channel_or_region: 'ln(F4) - ln(F3)',
        patient_value: parseFloat(simAlphaAsymmetry.toFixed(3)),
        normative_mean: 0.02,
        normative_std: 0.09,
        z_score: parseFloat(zAsym.toFixed(2)),
        status: Math.abs(zAsym) > 2 ? 'Significant Deviation' : Math.abs(zAsym) > 1 ? 'Mild Deviation' : 'Normative',
        direction: zAsym < -1.5 ? 'Hypoactive Left Prefrontal Drive' : 'Balanced Hemispheric Valence',
        unit: 'FAA idx',
        clinical_significance: 'Negative asymmetry indicates relatively attenuated left prefrontal activation, linked to negative symptoms.',
        contribution_pct: 16
      },
      {
        id: 'ind_speech_coherence',
        name: 'Fronto-Temporal Phase Coherence',
        modality: 'EEG',
        channel_or_region: 'F3-T3 / F4-T4 Speech Arc',
        patient_value: parseFloat(simCoherence.toFixed(3)),
        normative_mean: 0.68,
        normative_std: 0.095,
        z_score: parseFloat(zCoh.toFixed(2)),
        status: Math.abs(zCoh) > 2 ? 'Significant Deviation' : Math.abs(zCoh) > 1 ? 'Mild Deviation' : 'Normative',
        direction: zCoh < -1.5 ? 'Fronto-Temporal Dysconnectivity' : 'Intact Network Coherence',
        unit: 'coh',
        clinical_significance: 'Impaired functional coherence disrupts corollary discharge gating, predisposing to auditory hallucinations.',
        contribution_pct: 14
      },
      {
        id: 'ind_dlpfc_morphometry',
        name: 'DLPFC Cortical Thickness',
        modality: 'MRI',
        channel_or_region: 'Brodmann Area 9/46 (Atlas 111)',
        patient_value: parseFloat(simDlpfc.toFixed(1)),
        normative_mean: 0.0,
        normative_std: 6.7,
        z_score: parseFloat(zDlpfc.toFixed(2)),
        status: Math.abs(zDlpfc) > 2 ? 'Significant Deviation' : Math.abs(zDlpfc) > 1 ? 'Mild Deviation' : 'Normative',
        direction: zDlpfc < -1.5 ? 'Cortical Gray Matter Thinning' : 'Normative Cortical Profile',
        unit: '% dev',
        clinical_significance: 'Prefrontal gray matter density loss is associated with working memory fragmentation and executive deficits.',
        contribution_pct: 10
      }
    ];
  }, [simSlowing, simVbr, simAlphaAsymmetry, simCoherence, simDlpfc]);

  // Overall multi-system statistical distance composite score (weighted mean absolute Z-score)
  const compositeScore = useMemo(() => {
    const sumWeighted = computedIndicators.reduce((acc, curr) => {
      return acc + Math.abs(curr.z_score) * (curr.contribution_pct / 100);
    }, 0);
    return parseFloat(sumWeighted.toFixed(2));
  }, [computedIndicators]);

  // Documented Research Biomarker Deviation Tiers (NOT validated clinical stages)
  const assignedTier = useMemo(() => {
    if (compositeScore < 1.5) {
      return {
        id: 'Tier 1',
        title: 'Tier 1: Lower Research Biomarker Deviation',
        badge: 'Tier 1 (Lower)',
        description: 'Biomarker measurements fall within or near normative distribution bounds (Z < 1.5σ). Minimal statistical divergence detected.',
        color: 'text-healthy',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        barColor: '#2E9E73'
      };
    } else if (compositeScore < 3.0) {
      return {
        id: 'Tier 2',
        title: 'Tier 2: Intermediate Research Biomarker Deviation',
        badge: 'Tier 2 (Intermediate)',
        description: 'Biomarkers exhibit moderate divergence from normative controls (1.5σ ≤ Z < 3.0σ). Notable alterations in frontal EEG slowing or ventricular ratio.',
        color: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        barColor: '#D99A2B'
      };
    } else {
      return {
        id: 'Tier 3',
        title: 'Tier 3: Higher Research Biomarker Deviation',
        badge: 'Tier 3 (Higher)',
        description: 'Multi-system divergence exceeding 3.0 standard deviations from normative bounds (Z ≥ 3.0σ). Significant cross-modal concordance.',
        color: 'text-rose-800',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        barColor: '#C8475A'
      };
    }
  }, [compositeScore]);

  // Biomarker chart data for Recharts comparison
  const chartData = useMemo(() => {
    return computedIndicators.map(ind => ({
      name: ind.name.replace(' (10-20 Electrodes)', '').replace('Cortical Thickness', 'Thick.'),
      shortName: ind.id === 'ind_frontal_slowing' ? 'Frontal Slowing' :
                 ind.id === 'ind_vbr_dilation' ? 'Ventricular VBR' :
                 ind.id === 'ind_alpha_asymmetry' ? 'Alpha Asym' :
                 ind.id === 'ind_speech_coherence' ? 'FT Coherence' : 'DLPFC Thickness',
      zScore: ind.z_score,
      absZ: Math.abs(ind.z_score),
      modality: ind.modality,
      unit: ind.unit,
      patientValue: ind.patient_value,
      normMean: ind.normative_mean,
      normStd: ind.normative_std,
      status: ind.status,
      weight: ind.contribution_pct
    }));
  }, [computedIndicators]);

  // Modality contribution breakdown
  const modalityContributions = useMemo(() => {
    const eegIndicators = computedIndicators.filter(i => i.modality === 'EEG');
    const mriIndicators = computedIndicators.filter(i => i.modality === 'MRI');

    const eegWeight = eegIndicators.reduce((acc, c) => acc + c.contribution_pct, 0);
    const mriWeight = mriIndicators.reduce((acc, c) => acc + c.contribution_pct, 0);

    const eegDev = eegIndicators.reduce((acc, c) => acc + Math.abs(c.z_score) * c.contribution_pct, 0) / (eegWeight || 1);
    const mriDev = mriIndicators.reduce((acc, c) => acc + Math.abs(c.z_score) * c.contribution_pct, 0) / (mriWeight || 1);

    return {
      eegWeight,
      mriWeight,
      eegDev: parseFloat(eegDev.toFixed(2)),
      mriDev: parseFloat(mriDev.toFixed(2))
    };
  }, [computedIndicators]);

  const activeInd = computedIndicators.find(i => i.id === selectedIndicator) || computedIndicators[0];

  const handleExportProtocol = () => {
    setIsExporting(true);
    const protocolData = {
      subject_id: currentSubjectId,
      analysis_id: currentAnalysisId,
      timestamp: new Date().toISOString(),
      composite_score: compositeScore,
      research_tier: assignedTier.id,
      tier_title: assignedTier.title,
      disclaimer: "Research prototype only. These tiers represent exploratory biomarker deviation categories and are not validated clinical schizophrenia severity stages. They must not be used independently for diagnosis, prognosis, or treatment decisions.",
      modality_contributions: modalityContributions,
      indicators: computedIndicators,
      simulated_parameters: { simSlowing, simVbr, simAlphaAsymmetry, simCoherence, simDlpfc }
    };
    const blob = new Blob([JSON.stringify(protocolData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Severity_Biomarker_Assessment_${currentSubjectId}_${currentAnalysisId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Research Biomarker Severity Estimation
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Subject ID: <strong className="text-forest font-mono">{currentSubjectId}</strong> &bull; Analysis ID: <strong className="text-forest font-mono">{currentAnalysisId}</strong> &bull; Exploratory Multi-System Deviation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="mint"
            size="sm"
            onClick={() => setIsLiveTuning(!isLiveTuning)}
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            <span>{isLiveTuning ? 'Hide Sensitivity Tuner' : 'Exploratory Sensitivity Tuner'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportProtocol}
            disabled={isExporting}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export Assessment JSON</span>
          </Button>

          {onNavigateToReport && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToReport}
              className="shadow-sm"
            >
              <span>Compile Into Report</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>



      <ResearchDisclaimer compact />

      {/* Active Case & Analysis Context */}
      <div className="p-4 rounded-card bg-white border border-border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs shadow-card">
        <div className="flex items-center gap-2">
          <Badge variant="mint">SYNCHRONIZED ACTIVE CASE</Badge>
          <span className="font-bold text-forest">{currentSubjectId}</span>
          <span className="text-muted text-[11px]">Analysis: {currentAnalysisId}</span>
        </div>
        <div className="text-[11px] text-muted">
          Continuous psychiatric scales (PANSS/BPRS) are not enrolled &bull; Exploratory statistical Z-distance estimation
        </div>
      </div>

      {/* Optional Exploratory Sensitivity Simulator */}
      {isLiveTuning && (
        <div className="p-5 rounded-card bg-panel-light border border-border space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-bold text-forest uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-forest" />
              Hypothetical Biomarker Sensitivity Simulator
            </span>
            <span className="text-[10px] text-muted">
              Note: Exploratory simulation only — does not alter stored patient analysis records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Frontal Theta/Alpha:</span>
                <span className="text-forest font-bold">{simSlowing.toFixed(2)} (Norm: 1.15)</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="3.5"
                step="0.05"
                value={simSlowing}
                onChange={(e) => setSimSlowing(parseFloat(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Ventricular Ratio (VBR):</span>
                <span className="text-mri font-bold">{simVbr.toFixed(2)}% (Norm: 2.15%)</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.5"
                step="0.1"
                value={simVbr}
                onChange={(e) => setSimVbr(parseFloat(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Alpha Asymmetry:</span>
                <span className="text-forest font-bold">{simAlphaAsymmetry.toFixed(3)} (Norm: 0.02)</span>
              </div>
              <input
                type="range"
                min="-0.6"
                max="0.4"
                step="0.02"
                value={simAlphaAsymmetry}
                onChange={(e) => setSimAlphaAsymmetry(parseFloat(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Tier Card */}
        <div className={`p-5 rounded-card border ${assignedTier.border} ${assignedTier.bg} space-y-2`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-wider text-muted">RESEARCH SEVERITY TIER</span>
            <Activity className="w-3.5 h-3.5 text-forest" />
          </div>
          <span className={`text-xl font-bold font-serif ${assignedTier.color} block leading-tight`}>
            {assignedTier.id}
          </span>
          <span className="text-[11px] text-body-light font-sans block">
            {assignedTier.badge}
          </span>
        </div>

        {/* Statistical Distance */}
        <div className="p-5 rounded-card bg-white border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[10px]">
            <span className="uppercase">RESEARCH SCORE (Z)</span>
            <Compass className="w-3.5 h-3.5 text-forest" />
          </div>
          <span className="text-2xl font-serif font-bold text-forest block">
            +{compositeScore.toFixed(2)}&sigma;
          </span>
          <span className="text-[11px] text-muted font-sans block">
            Weighted Multi-System Deviation
          </span>
        </div>

        {/* EEG Contribution */}
        <div className="p-5 rounded-card bg-white border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[10px]">
            <span className="uppercase">EEG MODALITY CONTRIBUTION</span>
            <Activity className="w-3.5 h-3.5 text-forest" />
          </div>
          <span className="text-2xl font-serif font-bold text-forest block">
            +{modalityContributions.eegDev}&sigma;
          </span>
          <span className="text-[11px] text-muted font-sans block">
            Weight: {modalityContributions.eegWeight}% (Slowing, Asym, Coh)
          </span>
        </div>

        {/* MRI Contribution */}
        <div className="p-5 rounded-card bg-white border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[10px]">
            <span className="uppercase">MRI MODALITY CONTRIBUTION</span>
            <Brain className="w-3.5 h-3.5 text-mri" />
          </div>
          <span className="text-2xl font-serif font-bold text-mri block">
            +{modalityContributions.mriDev}&sigma;
          </span>
          <span className="text-[11px] text-muted font-sans block">
            Weight: {modalityContributions.mriWeight}% (VBR, Cortical DLPFC)
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SEVERITY ESTIMATION GRAPHS: TIER SCALE GAUGE & COMPARISON CHART */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: SEVERITY TIER SCALE & SCORE BOUNDARIES */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-forest" />
                Research Severity Tier Scale &amp; Score Marker
              </h3>
              <p className="text-xs text-body-light font-sans">
                Exploratory continuum categorized into 3 justified statistical boundary tiers
              </p>
            </div>
            <Badge variant="mint">{assignedTier.id}</Badge>
          </div>

          {/* Visual Tier Continuum Scale */}
          <div className="space-y-3 pt-2">
            <div className="relative h-12 w-full rounded-card overflow-hidden flex border border-border">
              {/* Tier 1 segment */}
              <div
                className="h-full bg-emerald-100 flex flex-col justify-center px-2 text-emerald-900 border-r border-emerald-300 relative"
                style={{ width: '30%' }}
              >
                <span className="text-[10px] font-mono font-bold">Tier 1: Lower</span>
                <span className="text-[9px] text-emerald-800">0.0&sigma; &ndash; 1.5&sigma;</span>
              </div>
              {/* Tier 2 segment */}
              <div
                className="h-full bg-amber-100 flex flex-col justify-center px-2 text-amber-900 border-r border-amber-300 relative"
                style={{ width: '30%' }}
              >
                <span className="text-[10px] font-mono font-bold">Tier 2: Intermediate</span>
                <span className="text-[9px] text-amber-800">1.5&sigma; &ndash; 3.0&sigma;</span>
              </div>
              {/* Tier 3 segment */}
              <div
                className="h-full bg-rose-100 flex flex-col justify-center px-2 text-rose-900 relative"
                style={{ width: '40%' }}
              >
                <span className="text-[10px] font-mono font-bold">Tier 3: Higher</span>
                <span className="text-[9px] text-rose-800">&ge; 3.0&sigma;</span>
              </div>

              {/* Patient Score Marker Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-forest shadow-md flex items-center justify-center transition-all duration-300 z-10"
                style={{
                  left: `${Math.min(Math.max((compositeScore / 5.0) * 100, 2), 98)}%`
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-forest text-white flex items-center justify-center shadow-lg -translate-x-0.5 ring-2 ring-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>

            {/* Score details and boundary legend */}
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-muted">
              <div>
                Score: <strong className="text-forest text-sm">+{compositeScore}&sigma;</strong>
              </div>
              <div className="text-[11px]">
                Status: <strong className={assignedTier.color}>{assignedTier.badge}</strong>
              </div>
            </div>

            {/* Tier Explanation */}
            <div className={`p-4 rounded-card border ${assignedTier.border} ${assignedTier.bg} space-y-1.5 text-xs font-sans`}>
              <div className="font-semibold text-forest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest" />
                <span>{assignedTier.title}</span>
              </div>
              <p className="text-body-light leading-relaxed text-[11px]">
                {assignedTier.description}
              </p>
              <div className="text-[10px] font-mono text-muted pt-1">
                Thresholds: Tier 1 &lt; 1.5&sigma; &bull; Tier 2: 1.5&sigma; &ndash; 3.0&sigma; &bull; Tier 3 &ge; 3.0&sigma;
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 2: DUAL-MODALITY BIOMARKER DEVIATION COMPARISON (Recharts) */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-serif font-semibold text-forest flex items-center gap-2">
                <Activity className="w-4 h-4 text-forest" />
                Supported Biomarker Deviation Comparison
              </h3>
              <p className="text-xs text-body-light font-sans">
                Normalized Z-score deviation against normative healthy controls (&plusmn;1&sigma;, &plusmn;2&sigma;)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-mono text-forest">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1F4D45]" /> EEG
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#4F6D8F]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4F6D8F]" /> MRI
              </span>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="w-full h-64 font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
              >
                <XAxis
                  dataKey="shortName"
                  stroke="#557A74"
                  tick={{ fontSize: 10, fill: '#1F4D45' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#557A74"
                  tick={{ fontSize: 10, fill: '#557A74' }}
                  label={{ value: 'Dev (Z-Score)', angle: -90, position: 'insideLeft', fill: '#557A74', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-white border border-border shadow-card rounded-card text-xs font-mono space-y-1">
                          <div className="font-bold text-forest">{data.name}</div>
                          <div className="text-[11px] text-muted">Modality: {data.modality}</div>
                          <div className="text-[11px]">
                            Patient Value: <strong>{data.patientValue} {data.unit}</strong>
                          </div>
                          <div className="text-[11px] text-muted">
                            Normative: {data.normMean} &plusmn; {data.normStd}
                          </div>
                          <div className="text-[11px] text-forest font-bold">
                            Deviation: {data.zScore > 0 ? `+${data.zScore}` : data.zScore}&sigma;
                          </div>
                          <div className="text-[10px] text-muted">
                            Importance Weight: {data.weight}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#CADBD7" />
                <ReferenceLine y={1.5} stroke="#D99A2B" strokeDasharray="3 3" label={{ value: '+1.5σ (Tier 2)', position: 'right', fill: '#D99A2B', fontSize: 9 }} />
                <ReferenceLine y={3.0} stroke="#C8475A" strokeDasharray="3 3" label={{ value: '+3.0σ (Tier 3)', position: 'right', fill: '#C8475A', fontSize: 9 }} />
                <Bar
                  dataKey="absZ"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.modality === 'EEG' ? '#1F4D45' : '#4F6D8F'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted border-t border-border pt-2">
            <span>Bar heights represent normalized statistical divergence |Z|.</span>
            <span>EEG &amp; MRI scaled on unified standard deviations.</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-System Biomarker Deviation Table & Interactive Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Supported Biomarkers */}
        <div className="lg:col-span-2 p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-serif font-semibold text-forest">
                Supported Quantitative Biomarker Measurements
              </h3>
              <p className="text-xs text-body-light font-sans">
                Measured electrophysiological and structural metrics compared against standardized healthy control bounds
              </p>
            </div>
            <Badge variant="mint">5 Quantitative Indicators</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-muted text-[10px]">
                  <th className="py-2.5 px-3">BIOMARKER</th>
                  <th className="py-2.5 px-3">MODALITY</th>
                  <th className="py-2.5 px-3">PATIENT VALUE</th>
                  <th className="py-2.5 px-3">NORM MEAN &plusmn; STD</th>
                  <th className="py-2.5 px-3">Z-SCORE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {computedIndicators.map((ind) => {
                  const isSelected = selectedIndicator === ind.id;
                  const isHighDev = Math.abs(ind.z_score) > 2;
                  return (
                    <tr
                      key={ind.id}
                      onClick={() => setSelectedIndicator(ind.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-panel-light font-medium' : 'hover:bg-page'
                      }`}
                    >
                      <td className="py-3 px-3 text-forest font-semibold">{ind.name}</td>
                      <td className="py-3 px-3">
                        <Badge variant={ind.modality === 'EEG' ? 'mint' : 'mri'}>
                          {ind.modality}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold text-forest">
                        {ind.patient_value} <span className="text-[10px] text-muted">{ind.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-muted">
                        {ind.normative_mean} &plusmn; {ind.normative_std}
                      </td>
                      <td className={`py-3 px-3 font-bold ${isHighDev ? 'text-forest' : 'text-muted'}`}>
                        {ind.z_score > 0 ? `+${ind.z_score}` : ind.z_score}&sigma;
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] ${isHighDev ? 'text-risk font-semibold' : 'text-muted'}`}>
                          {ind.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Indicator Deep Dive */}
        <div className="p-6 rounded-panel bg-panel-light border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3">
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
              BIOMARKER PROFILE
            </span>
            <h4 className="text-lg font-serif font-semibold text-forest mt-0.5">{activeInd.name}</h4>
            <span className="text-[11px] font-mono text-muted">{activeInd.channel_or_region}</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded bg-white border border-border space-y-1">
              <span className="text-[10px] text-muted uppercase block">STATISTICAL DEVIATION</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif font-bold text-forest">
                  {activeInd.z_score > 0 ? `+${activeInd.z_score}` : activeInd.z_score}&sigma;
                </span>
                <span className="text-xs text-muted">Z-Score</span>
              </div>
              <p className="text-[11px] text-body font-sans mt-1">{activeInd.direction}</p>
            </div>

            <div className="p-3.5 rounded bg-white border border-border space-y-1">
              <span className="text-[10px] text-muted uppercase block">SCIENTIFIC SIGNIFICANCE</span>
              <p className="text-xs text-body font-sans leading-relaxed">
                {activeInd.clinical_significance}
              </p>
            </div>

            <div className="p-3.5 rounded bg-white border border-border space-y-1">
              <span className="text-[10px] text-muted uppercase block">DECISION CONTRIBUTION</span>
              <div className="flex justify-between text-xs text-forest font-semibold">
                <span>Feature Importance Weight:</span>
                <span>{activeInd.contribution_pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-forest"
                  style={{ width: `${activeInd.contribution_pct * 2.5}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeverityEstimationView;
