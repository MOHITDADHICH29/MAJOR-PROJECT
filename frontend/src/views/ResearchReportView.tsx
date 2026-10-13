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
  ShieldAlert,
  Layers
} from 'lucide-react';
import { ReportObject, EEGAnalysisResult, MRIAnalysisResult, MultimodalAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';
import { Badge, Button } from '../components/ui';

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

  React.useEffect(() => {
    handleGenerate();
  }, []);

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
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Clinical Research Analytics Report
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Comprehensive synthesis of electrophysiology, 3D anatomical morphometry, and cross-modal decision fusion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>{isGenerating ? 'Synthesizing...' : report ? 'Regenerate' : 'Generate'}</span>
          </Button>

          {report && (
            <>
              <Button
                variant="mint"
                size="md"
                onClick={handleDownloadJSON}
                title="Download JSON Report"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>JSON Export</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handlePrint}
                className="shadow-sm"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                <span>Print Document</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Mint Backdrop hosting the Paper-like White Document */}
      <div className="p-4 sm:p-8 rounded-panel bg-panel-light border border-border">
        {report ? (
          <div id="printable-report" className="p-8 sm:p-12 rounded-panel bg-white border border-border shadow-card space-y-8 max-w-4xl mx-auto text-body">
            {/* Report Header */}
            <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-muted uppercase tracking-widest font-semibold block mb-1">
                  NEUROFUSION AI &bull; MULTIMODAL NEUROSCIENCE RESEARCH PLATFORM
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-forest font-semibold tracking-tight">
                  Multimodal Diagnostic Synthesis Report
                </h2>
                <span className="text-xs text-muted font-mono">
                  Generated: {report.timestamp}
                </span>
              </div>

              <div className="p-3 px-4 rounded-card bg-panel-light border border-border font-mono text-xs space-y-1">
                <div className="text-muted">Subject ID: <strong className="text-forest">{report.subject_id}</strong></div>
                <div className="text-muted">Protocol: <strong className="text-forest">EEG + 3D MRI</strong></div>
              </div>
            </div>

            {/* Multimodal Fusion Summary Box */}
            <div className="p-6 rounded-card bg-panel-alt border border-border space-y-3">
              <span className="text-[10px] font-mono text-forest uppercase tracking-wider font-bold block">
                Primary Multimodal Synthesis
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xl font-serif font-semibold text-forest">
                  {report.multimodal_fusion.final_prediction}
                </h3>
                <span className="text-xl font-serif font-bold text-forest font-mono">
                  Confidence: {report.multimodal_fusion.confidence.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-muted pt-2 border-t border-border">
                <span>Strategy: {report.multimodal_fusion.strategy}</span>
                <span className="text-healthy font-semibold">Synergy Gain: {report.multimodal_fusion.synergy_gain}</span>
              </div>
            </div>

            {/* Dual Modality Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EEG Section */}
              <div className="p-5 rounded-card bg-panel-light border border-border space-y-3">
                <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase font-mono">
                  <Activity className="w-4 h-4 text-forest" />
                  10-20 EEG Electrophysiology
                </div>
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-muted">Prediction:</span>
                    <strong className="text-body font-semibold">{report.eeg_analysis.model_prediction}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Confidence:</span>
                    <span className="text-forest font-mono font-bold">{report.eeg_analysis.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Preprocessing:</span>
                    <span className="text-body-light text-[11px] font-mono">{report.eeg_analysis.preprocessing}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] uppercase font-mono text-muted block mb-1">Key Biomarkers</span>
                  <ul className="space-y-1 text-xs text-body-light list-disc list-inside font-sans">
                    {report.eeg_analysis.key_biomarkers.map((bm, i) => (
                      <li key={i} className="text-[11px]">{bm}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* MRI Section */}
              <div className="p-5 rounded-card bg-panel-light border border-border space-y-3">
                <div className="flex items-center gap-2 text-mri font-bold text-xs uppercase font-mono">
                  <Brain className="w-4 h-4 text-mri" />
                  3D MRI Atlas Morphometry
                </div>
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-muted">Prediction:</span>
                    <strong className="text-body font-semibold">{report.mri_analysis.model_prediction}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Confidence:</span>
                    <span className="text-mri font-mono font-bold">{report.mri_analysis.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Atlas Space:</span>
                    <span className="text-body-light text-[11px] font-mono">{report.mri_analysis.preprocessing}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] uppercase font-mono text-muted block mb-1">Key Biomarkers</span>
                  <ul className="space-y-1 text-xs text-body-light list-disc list-inside font-sans">
                    {report.mri_analysis.key_biomarkers.map((bm, i) => (
                      <li key={i} className="text-[11px]">{bm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Explainable AI Attribution */}
            <div className="p-5 rounded-card bg-panel-light border border-border space-y-3 text-xs">
              <span className="font-semibold text-forest text-xs font-mono uppercase block">
                Explainable AI Attribution Profile (SHAP)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted block text-[11px] mb-1">Top Salient EEG Channels:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.explainable_ai.top_eeg_channels.map((ch) => (
                      <Badge key={ch} variant="mint">{ch}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted block text-[11px] mb-1">Top Attributed Anatomical Regions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.explainable_ai.top_imaging_regions.map((reg) => (
                      <Badge key={reg} variant="mri">{reg}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted italic pt-2 border-t border-border">
                {report.explainable_ai.attribution_standard}
              </p>
            </div>

            {/* Model Provenance */}
            <div className="p-5 rounded-card bg-panel-light border border-border space-y-2 text-xs font-mono">
              <span className="font-semibold text-forest text-xs uppercase block">
                Model Provenance &amp; Benchmark Reference
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted">
                <div>EEG: <span className="text-body font-semibold">{report.model_provenance.eeg_model}</span></div>
                <div>MRI: <span className="text-body font-semibold">{report.model_provenance.mri_model}</span></div>
                <div>Fusion: <span className="text-body font-semibold">{report.model_provenance.multimodal_benchmark}</span></div>
              </div>
            </div>

            {/* Final Diagnostic Conclusion Banner */}
            {report.diagnostic_conclusion && (() => {
              const dc = report.diagnostic_conclusion;
              const isPositive = dc.has_schizophrenia;
              return (
                <div className={`rounded-card overflow-hidden border ${isPositive ? 'border-risk/40 bg-risk-light' : 'border-healthy/40 bg-healthy-light'}`}>
                  <div className="p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {isPositive
                          ? <ShieldAlert className="w-6 h-6 text-risk shrink-0" />
                          : <CheckCircle2 className="w-6 h-6 text-healthy shrink-0" />
                        }
                        <div>
                          <span className={`block text-[10px] font-mono uppercase tracking-widest font-bold ${isPositive ? 'text-risk' : 'text-healthy'}`}>
                            Final Computational Verdict
                          </span>
                          <span className="text-2xl font-serif font-bold tracking-tight text-body">
                            {dc.verdict}
                          </span>
                        </div>
                      </div>
                      <Badge variant={isPositive ? 'risk' : 'healthy'}>
                        {dc.verdict_badge} &bull; {dc.confidence_pct.toFixed(1)}% Confidence
                      </Badge>
                    </div>

                    <p className="text-xs text-body-light leading-relaxed font-sans pt-2 border-t border-border">
                      {dc.clinical_summary}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Clinician Sign-off Block */}
            <div className="pt-8 border-t border-border flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs font-sans text-muted">
              <div>
                <div className="h-10 border-b border-border w-64 mb-2" />
                <span className="font-semibold text-body">Attending Neuropsychiatrist Signature</span>
                <span className="block text-[11px] text-muted">Dr. Elena Vance, MD, PhD &bull; License #CP-90214</span>
              </div>
              <div className="text-right font-mono text-[11px]">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span className="block text-muted">Institutional IRB #2026-089</span>
              </div>
            </div>

            {/* Formal Medical Disclaimer Footer */}
            <div className="pt-4 border-t border-border text-center text-[10px] text-muted leading-relaxed font-mono">
              <p>{report.research_disclaimer}</p>
              <p className="mt-1 font-semibold text-forest">NEUROFUSION AI &bull; MULTIMODAL NEUROSCIENCE RESEARCH PROTOCOL</p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4 max-w-lg mx-auto bg-white rounded-card border border-border shadow-card">
            <div className="w-12 h-12 rounded-full bg-panel-light flex items-center justify-center mx-auto text-forest">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-forest">Generate Clinical Report</h3>
              <p className="text-xs text-body-light mt-1 font-sans leading-relaxed">
                Synthesizes subject diagnostics, feature values, model predictions, and research disclaimers into a unified printable document.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="shadow-sm mx-auto"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Clinical Report'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchReportView;
