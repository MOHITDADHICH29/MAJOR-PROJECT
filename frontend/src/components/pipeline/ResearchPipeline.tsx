import React, { useState } from 'react';
import { Database, Cpu, Activity, Share2, Brain, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui';

interface ResearchPipelineProps {
  activeStage?: number;
  onSelectStage?: (stageIndex: number) => void;
  className?: string;
}

export const ResearchPipeline: React.FC<ResearchPipelineProps> = ({
  activeStage = 0,
  onSelectStage,
  className = ''
}) => {
  const [selected, setSelected] = useState(activeStage);

  const stages = [
    {
      num: '01',
      title: 'DATA ACQUISITION',
      subtitle: 'Multi-Modal Enrolment',
      icon: Database,
      details: '124 standardized 16-channel EEG recordings (128 Hz sampling) + 77 QC-passed 3D T1w MPRAGE MRI scans (ds004302 & ds005073 cohorts).',
      tags: ['10-20 EEG', '3.0T MRI', 'MNI-152']
    },
    {
      num: '02',
      title: 'PREPROCESSING',
      subtitle: 'Signal & Image Harmonization',
      icon: Cpu,
      details: '0.5-45 Hz Butterworth bandpass filtering, 50 Hz notch filter, artifact mitigation, affine volume resampling to 96x96x96 isotropic voxels, and intensity z-scoring.',
      tags: ['Butterworth', 'Z-Score', 'Resampling']
    },
    {
      num: '03',
      title: 'FEATURE EXTRACTION',
      subtitle: 'Biomarker Extraction',
      icon: Activity,
      details: 'Machine-invariant power spectral density (PSD), theta/alpha slowing ratios, 8 homologous asymmetry pairs, and 111-ROI anatomical atlas parcellation + 3D GLCM radiomics.',
      tags: ['432-dim EEG', '111-dim MRI', 'GLCM Radiomics']
    },
    {
      num: '04',
      title: 'MULTIMODAL FUSION',
      subtitle: 'Synergistic Decision Fusion',
      icon: Share2,
      details: 'Weighted cross-modal decision integration (55% EEG / 45% MRI) with concordance amplification, yielding +4.59% accuracy gain over single-modality baselines.',
      tags: ['Decision Fusion', 'Agreement Metric', '+4.59% Synergy']
    },
    {
      num: '05',
      title: 'MODEL INFERENCE',
      subtitle: 'Calibrated Soft-Voting',
      icon: Brain,
      details: 'Soft-voting ensemble across ExtraTrees (n=600), Random Forest (n=600), Regularized XGBoost, and SVM with RBF kernel, rigorously evaluated with 5-fold stratified CV.',
      tags: ['Soft-Voting', '5-Fold CV', '82.02% Mean Acc']
    },
    {
      num: '06',
      title: 'INTERPRETATION',
      subtitle: 'Biomarker Attribution',
      icon: CheckCircle2,
      details: 'Permutation saliency ranking identifying frontal theta/alpha slowing and lateral ventricular enlargement (VBR) as top discriminative features.',
      tags: ['SHAP', 'Saliency', 'Biomarkers']
    },
    {
      num: '07',
      title: 'REPORT GENERATION',
      subtitle: 'Research Documentation',
      icon: FileText,
      details: 'Comprehensive, audit-ready clinical research documentation incorporating patient metadata, model confidence, methodological limitations, and scientific disclaimers.',
      tags: ['JSON / Printable', 'Provenance', 'Audit Ready']
    }
  ];

  const handleSelect = (idx: number) => {
    setSelected(idx);
    onSelectStage?.(idx);
  };

  const current = stages[selected];
  const CurrentIcon = current.icon;

  return (
    <div className={`p-6 rounded-panel bg-white border border-border shadow-card space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block font-semibold">
            End-to-End Computational Pipeline
          </span>
          <h3 className="text-xl font-serif text-forest font-semibold tracking-tight mt-0.5">
            Research-Grade Multimodal Processing Workflow
          </h3>
        </div>
        <div className="font-mono text-xs text-muted">
          Stage <strong className="text-forest font-bold">{selected + 1} of {stages.length}</strong>
        </div>
      </div>

      {/* Pipeline Stages Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isSelected = selected === idx;
          return (
            <button
              key={st.num}
              onClick={() => handleSelect(idx)}
              className={`p-3 rounded-card border text-left transition-all ${
                isSelected
                  ? 'bg-panel-light border-forest shadow-sm'
                  : 'bg-white border-border hover:bg-page'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono ${isSelected ? 'text-forest font-bold' : 'text-muted'}`}>
                  {st.num}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-forest' : 'text-muted'}`} />
              </div>
              <div className={`text-xs font-serif font-semibold truncate ${isSelected ? 'text-forest' : 'text-body'}`}>
                {st.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Panel */}
      <div className="p-6 rounded-card bg-panel-light border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-forest">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted uppercase">STAGE {current.num}</span>
              <h4 className="text-lg font-serif font-semibold text-forest">{current.title}</h4>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {current.tags.map(tag => (
              <Badge key={tag} variant="mint">{tag}</Badge>
            ))}
          </div>
        </div>

        <p className="text-sm font-sans text-body-light leading-relaxed">
          {current.details}
        </p>
      </div>
    </div>
  );
};
export default ResearchPipeline;
