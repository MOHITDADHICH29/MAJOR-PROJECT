import React, { useState } from 'react';
import {
  UploadCloud,
  Activity,
  Brain,
  CheckCircle2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { DatasetSample, EEGAnalysisResult, MRIAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';
import { Badge, Button, Dropzone } from '../components/ui';

interface DataInputViewProps {
  samples: DatasetSample[];
  onSelectSample: (sample: DatasetSample) => void;
  onUploadFile: (type: 'eeg' | 'mri', file: File) => void;
  activeEEG: EEGAnalysisResult | null;
  activeMRI: MRIAnalysisResult | null;
  isLoading: boolean;
  onProceedToPrediction: () => void;
}

export const DataInputView: React.FC<DataInputViewProps> = ({
  samples,
  onSelectSample,
  onUploadFile,
  activeEEG,
  activeMRI,
  isLoading,
  onProceedToPrediction,
}) => {
  const [eegFile, setEegFile] = useState<File | null>(null);
  const [mriFile, setMriFile] = useState<File | null>(null);
  const [sampleFilter, setSampleFilter] = useState<'all' | 'eeg' | 'mri'>('all');

  const filteredSamples = samples.filter(s => sampleFilter === 'all' || s.type === sampleFilter);

  const handleEegUpload = (file: File) => {
    setEegFile(file);
    onUploadFile('eeg', file);
  };

  const handleMriUpload = (file: File) => {
    setMriFile(file);
    onUploadFile('mri', file);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Multimodal Data Ingestion &amp; Preprocessing
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Upload raw biosignals or select from validated cohorts (124 EEG + 77 MRI subjects)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(activeEEG || activeMRI) && (
            <Button
              variant="primary"
              size="md"
              onClick={onProceedToPrediction}
              className="shadow-sm"
            >
              <span>Proceed to Prediction</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Dual Upload / Ingestion Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EEG Ingestion Panel */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-panel-light text-forest flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-base text-forest">10-20 EEG Ingestion</h2>
                <span className="text-xs text-muted">Scalp Electrophysiology</span>
              </div>
            </div>
            <Badge variant={activeEEG ? 'healthy' : 'neutral'}>
              {activeEEG ? 'Processed' : 'Waiting'}
            </Badge>
          </div>

          {/* Dropzone */}
          <Dropzone
            label={eegFile ? eegFile.name : activeEEG ? `Subject: ${activeEEG.subject_id}` : 'Upload 10-20 EEG Recording'}
            helperText="Supports .npy, .edf, .fif, .csv, .set"
            onFileSelect={handleEegUpload}
          />

          {/* Technical Specifications */}
          <div className="p-4 rounded-card bg-panel-light border border-border space-y-2 text-xs">
            <span className="font-semibold text-forest block text-[11px] font-mono uppercase tracking-wider">
              EEG Preprocessing Pipeline Spec
            </span>
            <div className="grid grid-cols-2 gap-2 text-muted text-[11px] font-mono">
              <div>Sampling Rate: <span className="text-body font-semibold">128 Hz</span></div>
              <div>Bandpass Filter: <span className="text-body font-semibold">0.5 - 45 Hz</span></div>
              <div>Notch Filter: <span className="text-body font-semibold">50 Hz Powerline</span></div>
              <div>Montage: <span className="text-body font-semibold">16 Matched (10-20)</span></div>
              <div>Feature Space: <span className="text-body font-semibold">432 Biomarkers</span></div>
              <div>Normalization: <span className="text-body font-semibold">Z-Score per channel</span></div>
            </div>
          </div>
        </div>

        {/* MRI Ingestion Panel */}
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-panel-light text-mri flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-base text-forest">MRI Neuroimaging Ingestion</h2>
                <span className="text-xs text-muted">3D T1w Structural Scans</span>
              </div>
            </div>
            <Badge variant={activeMRI ? 'mri' : 'neutral'}>
              {activeMRI ? 'Processed' : 'Waiting'}
            </Badge>
          </div>

          {/* Dropzone */}
          <Dropzone
            label={mriFile ? mriFile.name : activeMRI ? `Subject: ${activeMRI.subject_id}` : 'Upload 3D NIfTI Structural Scan'}
            helperText="Supports .nii, .nii.gz, .dcm"
            onFileSelect={handleMriUpload}
          />

          {/* Technical Specifications */}
          <div className="p-4 rounded-card bg-panel-light border border-border space-y-2 text-xs">
            <span className="font-semibold text-forest block text-[11px] font-mono uppercase tracking-wider">
              MRI Preprocessing Pipeline Spec
            </span>
            <div className="grid grid-cols-2 gap-2 text-muted text-[11px] font-mono">
              <div>Voxel Grid: <span className="text-body font-semibold">96 x 96 x 96</span></div>
              <div>Atlas Mapping: <span className="text-body font-semibold">111 Anatomical ROIs</span></div>
              <div>Intensity Norm: <span className="text-body font-semibold">99th Percentile Clip</span></div>
              <div>Morphometry: <span className="text-body font-semibold">VBR, DLPFC, ACC, STG</span></div>
              <div>Texture Analysis: <span className="text-body font-semibold">3D GLCM Radiomics</span></div>
              <div>Quality Control: <span className="text-body font-semibold">SNR &gt; 15 dB</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Dataset Browser */}
      <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-semibold text-forest flex items-center gap-2">
              <Database className="w-4 h-4 text-forest" />
              Validated Research Cohort Explorer
            </h2>
            <p className="text-xs text-body-light font-sans">
              Click any benchmark subject to load raw features and evaluate the ML pipeline
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-panel-light rounded-full border border-border text-xs font-sans">
            {(['all', 'eeg', 'mri'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSampleFilter(tab)}
                className={`px-3 py-1 rounded-full capitalize font-medium transition-all ${
                  sampleFilter === tab
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-muted hover:text-forest'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredSamples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="p-3.5 rounded-card bg-panel-light border border-border hover:border-forest/60 hover:bg-white cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <Badge variant="mint">{sample.type}</Badge>
                <Badge variant={sample.label === 1 ? 'warning' : 'healthy'}>
                  {sample.label_name}
                </Badge>
              </div>

              <div>
                <span className="text-xs font-bold text-forest block truncate group-hover:text-forest-dark font-mono">
                  {sample.id}
                </span>
                <span className="text-[10px] text-muted block truncate font-mono mt-0.5">
                  {sample.filename}
                </span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted font-sans">
                <span>Select Subject</span>
                <ArrowRight className="w-3.5 h-3.5 text-forest group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DataInputView;
