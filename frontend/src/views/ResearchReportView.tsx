import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Activity,
  Cpu,
  ShieldAlert,
  Share2,
  Calendar,
  Layers
} from 'lucide-react';
import { ReportObject, EEGAnalysisResult, MRIAnalysisResult, MultimodalAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

interface ResearchReportViewProps {
  activeSampleId?: string;
  eegResult: EEGAnalysisResult | null;
  mriResult: MRIAnalysisResult | null;
  fusionResult: MultimodalAnalysisResult | null;
  onGenerateReport: () => Promise<ReportObject | null>;
}

export const ResearchReportView: React.FC<ResearchReportViewProps> = ({
  activeSampleId = 'SUBJ-RESEARCH-001',
  eegResult,
  mriResult,
  fusionResult,
  onGenerateReport,
}) => {
  const [report, setReport] = useState<ReportObject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const rep = await onGenerateReport();
      if (rep) setReport(rep);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurofusion_report_${report.subject_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Clinical Research Analytics Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive synthesis of electrophysiology, 3D anatomical morphometry, and cross-modal decision fusion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Synthesizing Report...' : report ? 'Regenerate Report' : 'Generate Report'}
          </button>

          {report && (
            <>
              <button
                onClick={handleDownloadJSON}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all"
                title="Download JSON Report"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all"
                title="Print Report"
              >
                <Printer className="w-4 h-4 text-violet-400" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </>
          )}
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Report Document Container */}
      {report ? (
        <div id="printable-report" className="p-8 md:p-12 rounded-2xl glass-panel border border-slate-800 space-y-8 bg-slate-900/90 text-slate-200 max-w-4xl mx-auto shadow-2xl">
          {/* Report Header */}
          <div className="border-b border-slate-700 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
                <Brain className="w-4 h-4" />
                NEUROFUSION AI RESEARCH PLATFORM
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Multimodal Diagnostic Synthesis Report
              </h2>
              <span className="text-xs text-slate-400">
                Generated on: {report.timestamp}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-700 font-mono text-xs space-y-1">
              <div className="text-slate-400">Subject ID: <span className="text-white font-bold">{report.subject_id}</span></div>
              <div className="text-slate-400">Modalities: <span className="text-cyan-300">EEG + 3D MRI</span></div>
            </div>
          </div>

          {/* Multimodal Fusion Summary Box */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-violet-950/40 to-slate-900 border border-violet-500/30 space-y-3">
            <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider font-bold block">
              Primary Multimodal Synthesis
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                {report.multimodal_fusion.final_prediction}
              </h3>
              <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-mono">
                Confidence: {report.multimodal_fusion.confidence.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800">
              <span>Strategy: {report.multimodal_fusion.strategy}</span>
              <span className="text-violet-300">Synergy Gain: {report.multimodal_fusion.synergy_gain}</span>
            </div>
          </div>

          {/* Dual Modality Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EEG Section */}
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
                <Activity className="w-4 h-4" />
                EEG Electrophysiology Analysis
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Prediction:</span>
                  <span className="text-white font-semibold">{report.eeg_analysis.model_prediction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-emerald-400 font-mono font-bold">{report.eeg_analysis.confidence.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Preprocessing:</span>
                  <span className="text-slate-300 text-[10px]">{report.eeg_analysis.preprocessing}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Key Biomarkers</span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {report.eeg_analysis.key_biomarkers.map((bm, i) => (
                    <li key={i} className="text-[11px]">{bm}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* MRI Section */}
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
                <Brain className="w-4 h-4" />
                3D MRI Morphometry Analysis
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Prediction:</span>
                  <span className="text-white font-semibold">{report.mri_analysis.model_prediction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-cyan-400 font-mono font-bold">{report.mri_analysis.confidence.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Preprocessing:</span>
                  <span className="text-slate-300 text-[10px]">{report.mri_analysis.preprocessing}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Key Biomarkers</span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {report.mri_analysis.key_biomarkers.map((bm, i) => (
                    <li key={i} className="text-[11px]">{bm}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Explainable AI & Model Attribution */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
            <span className="font-bold text-slate-200 text-xs font-mono uppercase block text-cyan-400">
              Explainable AI Attribution Profile
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Top Salient EEG Channels:</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.explainable_ai.top_eeg_channels.map((ch) => (
                    <span key={ch} className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-xs">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Top Attributed Anatomical Regions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.explainable_ai.top_imaging_regions.map((reg) => (
                    <span key={reg} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs">
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
              {report.explainable_ai.attribution_standard}
            </p>
          </div>

          {/* Model Provenance */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono">
            <span className="font-bold text-slate-200 text-xs uppercase block text-violet-400">
              Model Provenance & Benchmark Reference
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div>EEG: <span className="text-slate-200">{report.model_provenance.eeg_model}</span></div>
              <div>MRI: <span className="text-slate-200">{report.model_provenance.mri_model}</span></div>
              <div>Fusion: <span className="text-slate-200">{report.model_provenance.multimodal_benchmark}</span></div>
            </div>
          </div>

          {/* Research Limitations & Boundary */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-amber-400 text-xs font-mono uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Scientific Limitations & Protocol Boundaries
            </span>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              {report.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
              <li>{report.severity_status}</li>
            </ul>
          </div>

          {/* Formal Clinical Disclaimer Footer */}
          <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-400 leading-relaxed font-mono">
            <p>{report.research_disclaimer}</p>
            <p className="mt-1">NEUROFUSION AI &bull; ACADEMIC RESEARCH PROTOTYPE &bull; NOT FOR MEDICAL USE</p>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl glass-panel border border-dashed border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-cyan-400">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Generate Research Report</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Synthesizes all current subject diagnostics, feature values, model predictions, and research disclaimers into a unified printable document.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-glow-cyan transition-all flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Synthesizing...' : 'Generate Report'}
          </button>
        </div>
      )}
    </div>
  );
};
