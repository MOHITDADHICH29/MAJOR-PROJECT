import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  Activity,
  Brain,
  Layers,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { DatasetSample, EEGAnalysisResult, MRIAnalysisResult } from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';

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

  const handleEegDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setEegFile(file);
      onUploadFile('eeg', file);
    }
  };

  const handleMriDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setMriFile(file);
      onUploadFile('mri', file);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-cyan-400" />
            Multimodal Data Ingestion & Preprocessing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload raw biosignals or select from validated cohorts (124 EEG + 77 MRI subjects)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(activeEEG || activeMRI) && (
            <button
              onClick={onProceedToPrediction}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs shadow-glow-cyan flex items-center gap-2 transition-all"
            >
              <span>Proceed to Prediction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Dual Upload / Ingestion Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EEG Ingestion Panel */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white">EEG Ingestion</h2>
                <span className="text-[11px] text-slate-400">10-20 Scalp Electrophysiology</span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {activeEEG ? 'STATUS: PROCESSED' : 'STATUS: WAITING'}
            </span>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleEegDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              activeEEG
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              id="eeg-file-input"
              className="hidden"
              accept=".npy,.edf,.fif,.csv,.tsv,.set"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setEegFile(e.target.files[0]);
                  onUploadFile('eeg', e.target.files[0]);
                }
              }}
            />
            <label htmlFor="eeg-file-input" className="cursor-pointer space-y-2 block">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                {activeEEG ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <UploadCloud className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  {eegFile ? eegFile.name : activeEEG ? `Subject: ${activeEEG.subject_id}` : 'Drag & Drop EEG Recording, or Browse'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Supported formats: .npy, .edf, .fif, .csv, .tsv, .set
                </span>
              </div>
            </label>
          </div>

          {/* Technical Specifications */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
              EEG Preprocessing Pipeline Spec
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
              <div>Sampling Rate: <span className="text-slate-200 font-mono">128 Hz</span></div>
              <div>Bandpass Filter: <span className="text-slate-200 font-mono">0.5 - 45 Hz</span></div>
              <div>Notch Filter: <span className="text-slate-200 font-mono">50 Hz Powerline</span></div>
              <div>Electrode Montage: <span className="text-slate-200 font-mono">16 Matched (10-20)</span></div>
              <div>Feature Space: <span className="text-slate-200 font-mono">352 Biomarkers</span></div>
              <div>Normalization: <span className="text-slate-200 font-mono">Z-Score per channel</span></div>
            </div>
          </div>
        </div>

        {/* MRI Ingestion Panel */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white">MRI / Neuroimaging Ingestion</h2>
                <span className="text-[11px] text-slate-400">3D T1w Structural Scans</span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {activeMRI ? 'STATUS: PROCESSED' : 'STATUS: WAITING'}
            </span>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMriDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              activeMRI
                ? 'border-cyan-500/40 bg-cyan-500/5'
                : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              id="mri-file-input"
              className="hidden"
              accept=".nii,.gz,.dcm"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setMriFile(e.target.files[0]);
                  onUploadFile('mri', e.target.files[0]);
                }
              }}
            />
            <label htmlFor="mri-file-input" className="cursor-pointer space-y-2 block">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                {activeMRI ? <CheckCircle2 className="w-5 h-5 text-cyan-400" /> : <UploadCloud className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  {mriFile ? mriFile.name : activeMRI ? `Subject: ${activeMRI.subject_id}` : 'Drag & Drop 3D NIfTI Scan, or Browse'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Supported formats: .nii, .nii.gz, .dcm
                </span>
              </div>
            </label>
          </div>

          {/* Technical Specifications */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
              MRI Preprocessing Pipeline Spec
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
              <div>Target Voxel Grid: <span className="text-slate-200 font-mono">96 x 96 x 96</span></div>
              <div>Atlas Mapping: <span className="text-slate-200 font-mono">111 Anatomical ROIs</span></div>
              <div>Intensity Norm: <span className="text-slate-200 font-mono">99th Percentile Clip</span></div>
              <div>Morphometry: <span className="text-slate-200 font-mono">VBR, DLPFC, ACC, STG</span></div>
              <div>Texture Analysis: <span className="text-slate-200 font-mono">3D GLCM Radiomics</span></div>
              <div>Quality Control: <span className="text-slate-200 font-mono">SNR &gt; 15 dB</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Dataset Browser */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              Validated Research Cohort Explorer
            </h2>
            <p className="text-xs text-slate-400">
              Click any benchmark subject to load raw features and evaluate the ML pipeline
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
            {(['all', 'eeg', 'mri'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSampleFilter(tab)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  sampleFilter === tab
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
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
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850/80 cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {sample.type}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  sample.label === 1
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}>
                  {sample.label_name}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-cyan-300">
                  {sample.id}
                </span>
                <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">
                  {sample.filename}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Click to analyze</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
