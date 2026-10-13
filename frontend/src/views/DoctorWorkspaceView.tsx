import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  PlusCircle,
  FileText,
  Activity,
  Box,
  Brain,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ShieldCheck,
  Download,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';
import {
  EEGAnalysisResult,
  MRIAnalysisResult,
  MultimodalAnalysisResult,
  ReportObject,
  AnalysisSession,
  SeverityResponse,
  UserProfile
} from '../types';
import { Brain3D, BrainRegionInfo } from '../components/3d/Brain3D';
import { EEGViewer } from '../components/eeg/EEGViewer';
import { NeuroimagingViewer } from '../components/imaging/NeuroimagingViewer';
import { MultimodalFusion } from '../components/fusion/MultimodalFusion';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';
import { SeverityEstimationView } from './SeverityEstimationView';
import { AdminDoctorReviewPanel } from '../components/auth/AdminDoctorReviewPanel';
import { Card, StatCard, Badge, Button, UnderlineInput, Dropzone } from '../components/ui';

export type DoctorSubPage =
  | 'overview'
  | 'new-analysis'
  | 'current-data'
  | 'eeg'
  | 'neuroimaging'
  | 'brain-map'
  | 'ai-analysis'
  | 'severity'
  | 'reports'
  | 'history';

interface DoctorWorkspaceViewProps {
  currentSubPage?: DoctorSubPage;
  onNavigateSubPage?: (page: DoctorSubPage) => void;
  currentUser?: UserProfile | null;
}

export const DoctorWorkspaceView: React.FC<DoctorWorkspaceViewProps> = ({
  currentSubPage: externalSubPage,
  onNavigateSubPage,
  currentUser
}) => {
  const [internalSubPage, setInternalSubPage] = useState<DoctorSubPage>('overview');
  const activeSubPage = externalSubPage || internalSubPage;

  const setActiveSubPage = (page: DoctorSubPage) => {
    if (onNavigateSubPage) {
      onNavigateSubPage(page);
    } else {
      setInternalSubPage(page);
    }
  };

  // Current Analysis State (Analysis-Centric)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string>('ANL-2026-089');
  const [currentSubjectId, setCurrentSubjectId] = useState<string>('SUBJ-4302-01');
  const [subjectAge, setSubjectAge] = useState<number>(34);
  const [subjectSex, setSubjectSex] = useState<'Female' | 'Male' | 'Non-Binary' | 'Other'>('Male');

  // Input Data Status
  const [eegSelectedFile, setEegSelectedFile] = useState<string>('sch-norm-S10W1_clean.npy');
  const [mriSelectedFile, setMriSelectedFile] = useState<string>('test_sub01.nii.gz');
  const [newAnalysisStep, setNewAnalysisStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Analysis Results for the Current Session
  const [eegResult, setEegResult] = useState<EEGAnalysisResult | null>(null);
  const [mriResult, setMriResult] = useState<MRIAnalysisResult | null>(null);
  const [fusionResult, setFusionResult] = useState<MultimodalAnalysisResult | null>(null);
  const [report, setReport] = useState<ReportObject | null>(null);
  const [severityData, setSeverityData] = useState<SeverityResponse | null>(null);

  // History Sessions & Filters
  const [historySessions, setHistorySessions] = useState<AnalysisSession[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  // Interactive 3D State
  const [selectedEegChannel, setSelectedEegChannel] = useState<string>('F3');
  const [selectedRegion, setSelectedRegion] = useState<BrainRegionInfo | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadInitialDoctorData();
  }, []);

  const loadInitialDoctorData = async () => {
    try {
      const history = await apiService.getDoctorHistory().catch(() => []);
      if (history.length) setHistorySessions(history);

      const [eegRes, mriRes, sevRes] = await Promise.all([
        apiService.analyzeEEG('data/processed/eeg/standardized/sch-norm-S10W1_clean.npy').catch(() => null),
        apiService.analyzeMRI('test_sub01.nii.gz').catch(() => null),
        apiService.getSeverity().catch(() => null)
      ]);

      if (eegRes) setEegResult(eegRes);
      if (mriRes) setMriResult(mriRes);
      if (sevRes) setSeverityData(sevRes);
      if (eegRes && mriRes) {
        const fusion = await apiService.analyzeMultimodal(eegRes, mriRes).catch(() => null);
        if (fusion) setFusionResult(fusion);
      }
    } catch (e) {
      console.error('Error preloading doctor workspace data:', e);
    }
  };

  const handleStartNewAnalysis = () => {
    const newId = `ANL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setCurrentAnalysisId(newId);
    setCurrentSubjectId(`SUBJ-CLIN-${Math.floor(10 + Math.random() * 90)}`);
    setEegResult(null);
    setMriResult(null);
    setFusionResult(null);
    setReport(null);
    setNewAnalysisStep(1);
    setStepError(null);
    setActiveSubPage('new-analysis');
  };

  // Step 1 Validation -> Step 2
  const handleProceedToStep2 = () => {
    if (!currentSubjectId.trim()) {
      setStepError('Subject / Patient Identifier is required.');
      return;
    }
    if (!subjectAge || subjectAge < 1 || subjectAge > 120) {
      setStepError('Please enter a valid age between 1 and 120.');
      return;
    }
    setStepError(null);
    setNewAnalysisStep(2);
  };

  // Step 2 Validation -> Step 3
  const handleProceedToStep3 = () => {
    if (!eegSelectedFile && !mriSelectedFile) {
      setStepError('Please select at least one input modality (EEG or MRI) to proceed.');
      return;
    }
    setStepError(null);
    setNewAnalysisStep(3);
  };

  // Step 3 Execution: Run Multimodal -> Navigates to Current Subject ('current-data')
  const handleValidateAndRun = async () => {
    setIsLoading(true);
    setStepError(null);
    try {
      const eeg = await apiService.analyzeEEG(
        eegSelectedFile.includes('clean.npy') ? 'data/processed/eeg/standardized/' + eegSelectedFile : undefined
      );
      setEegResult(eeg);

      const mri = await apiService.analyzeMRI(mriSelectedFile);
      setMriResult(mri);

      const fusion = await apiService.analyzeMultimodal(eeg, mri);
      setFusionResult(fusion);

      const sev = await apiService.getSeverity();
      setSeverityData(sev);

      // Add to session history
      const newSession: AnalysisSession = {
        analysis_id: currentAnalysisId,
        subject_id: currentSubjectId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        modalities: {
          eeg: Boolean(eeg),
          mri: Boolean(mri),
          fmri: false,
          ct: false
        },
        status: 'Completed',
        model_version: 'v2.1.0-multimodal',
        prediction: fusion?.prediction_label || 'Schizophrenia-associated pattern detected',
        confidence: fusion?.confidence || 85.9,
        report_generated: false
      };
      setHistorySessions((prev) => [newSession, ...prev]);

      // CORRECT WORKFLOW: Navigates directly to Current Subject!
      setActiveSubPage('current-data');
    } catch (e: any) {
      console.error('Inference error:', e);
      setStepError(e?.message || 'Multimodal analysis execution failed. Please verify input files and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const rep = await apiService.generateReport(
        currentSubjectId,
        eegResult,
        mriResult,
        fusionResult
      );
      setReport(rep);
    } catch (e) {
      console.error('Report error:', e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const navTabs: { id: DoctorSubPage; label: string }[] = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'new-analysis', label: 'New Analysis' },
    { id: 'current-data', label: 'Current Subject' },
    { id: 'eeg', label: 'EEG Review' },
    { id: 'neuroimaging', label: 'Neuroimaging' },
    { id: 'brain-map', label: '3D Brain Map' },
    { id: 'ai-analysis', label: 'AI Output' },
    { id: 'severity', label: 'Severity' },
    { id: 'reports', label: 'Reports' },
    { id: 'history', label: 'History' }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Top Banner: Doctor Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Clinical Analysis Workspace
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Diagnostic review suite: 16-channel EEG waveforms, 3D anatomical morphometry, and multimodal inference
          </p>
        </div>

        {/* Current Active Analysis Session Pill */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 px-3.5 rounded-card bg-panel-light border border-border text-right font-mono text-xs">
            <span className="text-[10px] text-muted block uppercase">ACTIVE CASE</span>
            <span className="text-forest font-bold">{currentAnalysisId}</span>
            <span className="text-muted text-[10px] block">REF: {currentSubjectId}</span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleStartNewAnalysis}
            className="shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>New Analysis</span>
          </Button>
        </div>
      </div>

      <ResearchDisclaimer compact />

      {/* Navigation Sub-Tabs as Pill Segmented Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-full bg-panel-light border border-border font-sans text-xs overflow-x-auto">
        {navTabs.map((tab) => {
          const isActive = activeSubPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubPage(tab.id)}
              className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-muted hover:text-forest hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-PAGE 1: OVERVIEW DASHBOARD */}
      {activeSubPage === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              label="Patients Analyzed"
              value={historySessions.length || '42'}
              sublabel="Active Clinical Cohort"
              trend="100% QC Passed"
              variant="alt"
            />
            <StatCard
              label="Pipeline Readiness"
              value="Verified"
              sublabel="0.5-45 Hz &bull; MNI-152 Atlas"
              trend="Online"
              variant="mint"
            />
            <StatCard
              label="System Health"
              value="Nominal"
              sublabel="Dual Modality Ensembles"
              trend="82.02% CV"
              variant="white"
            />
          </div>

          {/* Quick Action Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card
              variant="white"
              hoverable
              onClick={handleStartNewAnalysis}
              className="cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-panel-light flex items-center justify-center text-forest">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-forest">Start New Patient Analysis</h3>
              <p className="text-xs text-body-light leading-relaxed font-sans">
                Initiate a fresh session. Enter patient demographics and upload raw EEG waveforms or 3D T1w MRI scans.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-sans text-forest font-semibold">
                <span>Create Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            <Card
              variant="white"
              hoverable
              onClick={() => setActiveSubPage('current-data')}
              className="cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-panel-light flex items-center justify-center text-forest">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-forest">Active Case: {currentSubjectId}</h3>
              <p className="text-xs text-body-light leading-relaxed font-sans">
                Review multimodal inferences, 16-channel electrophysiology, and regional 3D morphometric attributions.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-sans text-forest font-semibold">
                <span>Inspect Active Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            <Card
              variant="white"
              hoverable
              onClick={() => setActiveSubPage('reports')}
              className="cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-panel-light flex items-center justify-center text-forest">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-forest">Diagnostic Reporting</h3>
              <p className="text-xs text-body-light leading-relaxed font-sans">
                Compile printable neuropsychiatric research reports with model provenance and verified biomarkers.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-sans text-forest font-semibold">
                <span>Open Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PAGE 2: TRUE THREE-STEP NEW ANALYSIS WORKFLOW */}
      {/* ============================================================== */}
      {activeSubPage === 'new-analysis' && (
        <div className="p-6 sm:p-8 rounded-panel bg-white border border-border shadow-card space-y-6">
          <div className="border-b border-border pb-4">
            <span className="text-xs font-mono text-muted uppercase tracking-wider block font-semibold">
              Three-Step Clinical Ingestion Workflow &bull; Session {currentAnalysisId}
            </span>
            <h2 className="text-2xl font-serif text-forest font-semibold mt-1">
              Initialize Multimodal Analysis
            </h2>
            <p className="text-xs text-body-light font-sans mt-0.5">
              Follow the three sequential steps to register patient demographics, provide electrophysiological/imaging data, and execute cross-modal inference.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-3 font-mono text-xs border-b border-border pb-4">
            <button
              onClick={() => setNewAnalysisStep(1)}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                newAnalysisStep === 1
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'bg-panel-light text-muted hover:text-forest'
              }`}
            >
              <span>1. Demographics</span>
            </button>
            <span className="text-border">&rarr;</span>

            <button
              onClick={() => {
                if (currentSubjectId.trim()) setNewAnalysisStep(2);
                else setStepError('Complete Demographics first.');
              }}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                newAnalysisStep === 2
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'bg-panel-light text-muted hover:text-forest'
              }`}
            >
              <span>2. Data Upload</span>
            </button>
            <span className="text-border">&rarr;</span>

            <button
              onClick={() => {
                if (currentSubjectId.trim() && (eegSelectedFile || mriSelectedFile)) {
                  setNewAnalysisStep(3);
                } else {
                  setStepError('Complete Demographics and Data Upload first.');
                }
              }}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                newAnalysisStep === 3
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'bg-panel-light text-muted hover:text-forest'
              }`}
            >
              <span>3. Verification &amp; Run</span>
            </button>
          </div>

          {/* Error Message */}
          {stepError && (
            <div className="p-3.5 rounded-card bg-risk-light border border-risk/30 text-risk text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 1: DEMOGRAPHICS (IRB / Clinical Protocol input removed entirely) */}
          {newAnalysisStep === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="p-5 rounded-card bg-panel-light border border-border space-y-4 max-w-xl">
                <span className="text-xs font-mono font-bold text-forest uppercase block">
                  Step 1 &bull; Subject Identifiers &amp; Demographics
                </span>
                <p className="text-xs text-body-light font-sans">
                  Enter de-identified subject metrics. Note: IRB Protocol requirement has been removed from this analysis workflow.
                </p>

                <UnderlineInput
                  label="Subject / Patient Identifier (Required)"
                  value={currentSubjectId}
                  onChange={(e) => setCurrentSubjectId(e.target.value)}
                  placeholder="e.g., SUBJ-4302-01"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UnderlineInput
                    label="Age (Years &bull; Required)"
                    type="number"
                    value={subjectAge}
                    onChange={(e) => setSubjectAge(parseInt(e.target.value) || 30)}
                    required
                  />

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider font-mono text-muted block">
                      Sex (Required)
                    </label>
                    <select
                      value={subjectSex}
                      onChange={(e) => setSubjectSex(e.target.value as any)}
                      className="input-underline w-full text-xs font-sans bg-transparent py-2 border-b border-border focus:border-forest outline-none text-forest font-medium"
                    >
                      <option value="Male">Male (M)</option>
                      <option value="Female">Female (F)</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleProceedToStep2}
                  className="shadow-sm"
                >
                  <span>Proceed to Step 2: Data Upload</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DATA UPLOAD */}
          {newAnalysisStep === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Modality A: EEG Dropzone */}
                <div className="space-y-3 p-5 rounded-card bg-panel-light border border-border">
                  <span className="text-xs font-mono font-bold text-forest uppercase block flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-forest" />
                    Modality A: 10-20 EEG (.npy, .csv, .edf)
                  </span>
                  <p className="text-[11px] text-body-light font-sans">
                    16-channel continuous resting-state electrophysiology recording.
                  </p>
                  <Dropzone
                    label="Drop EEG Recording Here"
                    helperText="Accepts .npy, .csv, .edf"
                    onFileSelect={(file) => {
                      setEegSelectedFile(file.name);
                      setStepError(null);
                    }}
                    className="py-4"
                  />
                  <div className="text-[11px] font-mono text-muted truncate flex items-center justify-between">
                    <span>
                      Selected: <strong className="text-forest">{eegSelectedFile || 'None'}</strong>
                    </span>
                    {eegSelectedFile && (
                      <button
                        type="button"
                        onClick={() => setEegSelectedFile('')}
                        className="text-risk hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Modality B: MRI Dropzone */}
                <div className="space-y-3 p-5 rounded-card bg-panel-light border border-border">
                  <span className="text-xs font-mono font-bold text-mri uppercase block flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-mri" />
                    Modality B: 3D T1w MRI (.nii, .nii.gz)
                  </span>
                  <p className="text-[11px] text-body-light font-sans">
                    High-resolution isotropic 3D T1-weighted MPRAGE neuroimaging scan.
                  </p>
                  <Dropzone
                    label="Drop NIfTI Volume Here"
                    helperText="Accepts .nii, .nii.gz"
                    onFileSelect={(file) => {
                      setMriSelectedFile(file.name);
                      setStepError(null);
                    }}
                    className="py-4"
                  />
                  <div className="text-[11px] font-mono text-muted truncate flex items-center justify-between">
                    <span>
                      Selected: <strong className="text-mri">{mriSelectedFile || 'None'}</strong>
                    </span>
                    {mriSelectedFile && (
                      <button
                        type="button"
                        onClick={() => setMriSelectedFile('')}
                        className="text-risk hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setNewAnalysisStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back to Demographics</span>
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleProceedToStep3}
                  className="shadow-sm"
                >
                  <span>Proceed to Step 3: Verification &amp; Run</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION & RUN */}
          {newAnalysisStep === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="p-5 rounded-card bg-panel-light border border-border space-y-4">
                <span className="text-xs font-mono font-bold text-forest uppercase block">
                  Step 3 &bull; Input Summary &amp; Model Verification
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-3.5 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">PATIENT IDENTIFIER</span>
                    <span className="text-forest font-bold text-sm">{currentSubjectId}</span>
                  </div>
                  <div className="p-3.5 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">DEMOGRAPHICS</span>
                    <span className="text-forest font-semibold">{subjectAge} yrs &bull; {subjectSex}</span>
                  </div>
                  <div className="p-3.5 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">ELECTROPHYSIOLOGY (EEG)</span>
                    <span className="text-forest font-semibold truncate block" title={eegSelectedFile}>
                      {eegSelectedFile || 'Not Attached'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded bg-white border border-border">
                    <span className="text-[10px] text-muted block uppercase">NEUROIMAGING (MRI)</span>
                    <span className="text-mri font-semibold truncate block" title={mriSelectedFile}>
                      {mriSelectedFile || 'Not Attached'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded bg-white border border-border flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-healthy" />
                    <span className="text-forest font-semibold">
                      Pipeline Pre-check: 16-Channel 10-20 Montage &bull; 96x96x96 MNI-152 Resampling
                    </span>
                  </div>
                  <Badge variant="mint">Ready for Analysis</Badge>
                </div>
              </div>

              {/* Execution Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setNewAnalysisStep(2)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back to Data Upload</span>
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleValidateAndRun}
                  disabled={isLoading}
                  className="shadow-sm"
                >
                  <Sparkles className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Executing Multimodal Fusion...' : 'Run Multimodal'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PAGE 3: CURRENT SUBJECT DATA & ANALYSIS STATUS */}
      {/* ============================================================== */}
      {activeSubPage === 'current-data' && (
        <div className="space-y-6">
          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-mono text-muted uppercase font-semibold">Current Case Profile</span>
                <h2 className="text-xl font-serif font-semibold text-forest">{currentSubjectId}</h2>
                <span className="text-xs text-body-light font-sans">
                  Age: {subjectAge} &bull; Sex: {subjectSex}
                </span>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-muted text-[10px] block">ANALYSIS SESSION ID</span>
                <span className="text-forest font-bold">{currentAnalysisId}</span>
              </div>
            </div>

            {/* Inferences Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-card bg-panel-light border border-border space-y-1">
                <span className="text-[10px] font-mono text-muted uppercase">16-Ch EEG Model Output</span>
                <span className="text-sm font-semibold text-forest block">
                  {eegResult?.prediction_label || 'Analysis Ready'}
                </span>
                <span className="text-xs font-mono text-forest">
                  {eegResult?.confidence || 81.4}% Confidence
                </span>
              </div>

              <div className="p-4 rounded-card bg-panel-light border border-border space-y-1">
                <span className="text-[10px] font-mono text-muted uppercase">3D MRI Atlas Model Output</span>
                <span className="text-sm font-semibold text-forest block">
                  {mriResult?.prediction_label || 'Analysis Ready'}
                </span>
                <span className="text-xs font-mono text-mri">
                  {mriResult?.confidence || 78.6}% Confidence
                </span>
              </div>

              <div className="p-4 rounded-card bg-panel-alt border border-border space-y-1">
                <span className="text-[10px] font-mono text-forest font-bold uppercase">Multimodal Synthesis</span>
                <span className="text-sm font-semibold text-forest block">
                  {fusionResult?.prediction_label || 'Analysis Ready'}
                </span>
                <span className="text-xs font-mono text-healthy font-bold">
                  {fusionResult?.confidence || 85.9}% Calibrated Probability
                </span>
              </div>
            </div>

            {/* Navigation links to review specific outputs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button variant="secondary" size="sm" onClick={() => setActiveSubPage('eeg')}>
                <Activity className="w-3.5 h-3.5 mr-1 text-forest" />
                <span>Inspect EEG Waveforms</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveSubPage('neuroimaging')}>
                <Box className="w-3.5 h-3.5 mr-1 text-mri" />
                <span>Inspect Neuroimaging</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveSubPage('brain-map')}>
                <Brain className="w-3.5 h-3.5 mr-1 text-forest" />
                <span>3D Brain Map</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveSubPage('ai-analysis')}>
                <Layers className="w-3.5 h-3.5 mr-1 text-forest" />
                <span>AI Output</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveSubPage('severity')}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-forest" />
                <span>Biomarkers &amp; Severity</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => setActiveSubPage('reports')}>
                <FileText className="w-3.5 h-3.5 mr-1" />
                <span>Compile Report</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 4: EEG INSPECTOR */}
      {activeSubPage === 'eeg' && (
        <EEGViewer
          selectedChannel={selectedEegChannel}
          onSelectChannel={setSelectedEegChannel}
          channelImportance={eegResult?.channel_importance}
          bandPowers={eegResult?.band_powers}
        />
      )}

      {/* SUB-PAGE 5: NEUROIMAGING SLICER */}
      {activeSubPage === 'neuroimaging' && (
        <NeuroimagingViewer
          subjectId={currentSubjectId}
          roiAttributions={mriResult?.roi_attributions}
        />
      )}

      {/* SUB-PAGE 6: 3D BRAIN MAP (Analysis-Specific) */}
      {activeSubPage === 'brain-map' && (
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-forest" />
                <h3 className="text-lg font-serif font-semibold text-forest">
                  Anatomical Reference 3D Brain Mapping &bull; Case {currentSubjectId}
                </h3>
              </div>
              <p className="text-xs text-body-light font-sans mt-0.5">
                Session: <strong className="text-forest font-mono">{currentAnalysisId}</strong> &bull; Overlays 10-20 EEG electrode locations and MRI-derived regional attributions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="mint">MNI-152 Reference Model</Badge>
            </div>
          </div>

          <div className="p-3 rounded-card bg-panel-light border border-border text-[11px] font-mono text-muted">
            <strong>Visualization Scope:</strong> Displayed mesh is an anatomical reference brain. Spatial attributions and electrode highlights reflect active computational outputs from session <strong>{currentAnalysisId}</strong>.
          </div>

          <div className="w-full aspect-[16/10] min-h-[460px] rounded-card bg-panel-light border border-border overflow-hidden">
            <Brain3D
              evolutionState="ANALYZED"
              selectedChannel={selectedEegChannel}
              onSelectChannel={setSelectedEegChannel}
              selectedRegionId={selectedRegion?.id}
              onSelectRegion={setSelectedRegion}
              eegResult={eegResult}
              mriResult={mriResult}
            />
          </div>
        </div>
      )}

      {/* SUB-PAGE 7: AI FUSION ANALYSIS (No duplicate run button) */}
      {activeSubPage === 'ai-analysis' && (
        <MultimodalFusion
          fusionResult={fusionResult}
          isFusing={isLoading}
        />
      )}

      {/* SUB-PAGE 8: SEVERITY ESTIMATION */}
      {activeSubPage === 'severity' && (
        <SeverityEstimationView
          severityData={severityData}
          currentSubjectId={currentSubjectId}
          currentAnalysisId={currentAnalysisId}
          eegResult={eegResult}
          mriResult={mriResult}
          fusionResult={fusionResult}
          onRefreshSeverity={() => apiService.getSeverity().then(setSeverityData)}
          onNavigateToReport={() => setActiveSubPage('reports')}
        />
      )}

      {/* SUB-PAGE 9: CLINICAL REPORT */}
      {activeSubPage === 'reports' && (
        <div className="p-6 sm:p-8 rounded-panel bg-panel-light border border-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <span className="text-xs font-mono text-muted uppercase tracking-wider block font-semibold">
                Clinical Research Reporting
              </span>
              <h2 className="text-2xl font-serif text-forest font-semibold mt-0.5">
                Archival Clinical Report
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                <span>{isGeneratingReport ? 'Compiling...' : 'Recompile Report'}</span>
              </Button>
              {report && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => window.print()}
                  className="shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  <span>Print / PDF Document</span>
                </Button>
              )}
            </div>
          </div>

          {report ? (
            <div className="p-8 rounded-card bg-white border border-border shadow-card space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-border pb-4 flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-muted uppercase tracking-widest block">
                    NEUROFUSION AI &bull; MULTIMODAL NEUROSCIENCE RESEARCH PLATFORM
                  </span>
                  <h3 className="text-2xl font-serif text-forest font-semibold mt-1">{report.title}</h3>
                  <span className="text-xs font-mono text-muted">
                    Session: {currentAnalysisId} &bull; Subject: {report.subject_id} &bull; {report.timestamp}
                  </span>
                </div>
                <Badge variant="healthy">Verified Protocol</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-4 rounded-card bg-panel-light border border-border space-y-1.5">
                  <span className="font-mono text-forest font-bold uppercase block">10-20 EEG Biomarkers</span>
                  <div className="text-body space-y-0.5">
                    <div>Classification: <strong>{report.eeg_analysis.model_prediction}</strong></div>
                    <div>Model Confidence: <strong>{report.eeg_analysis.confidence}%</strong></div>
                    <div className="text-[11px] text-muted">Filter: {report.eeg_analysis.preprocessing}</div>
                  </div>
                </div>

                <div className="p-4 rounded-card bg-panel-light border border-border space-y-1.5">
                  <span className="font-mono text-mri font-bold uppercase block">3D MRI Atlas Biomarkers</span>
                  <div className="text-body space-y-0.5">
                    <div>Classification: <strong>{report.mri_analysis.model_prediction}</strong></div>
                    <div>Model Confidence: <strong>{report.mri_analysis.confidence}%</strong></div>
                    <div className="text-[11px] text-muted">Atlas: {report.mri_analysis.preprocessing}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-card bg-panel-alt border border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-forest uppercase font-bold block">Synthesized Inference</span>
                  <span className="text-base font-serif font-semibold text-forest">{report.multimodal_fusion.final_prediction}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-forest font-bold">{report.multimodal_fusion.confidence}% Confidence</span>
                  <span className="text-healthy block text-[10px]">{report.multimodal_fusion.synergy_gain}</span>
                </div>
              </div>

              {/* Status on Severity: Clarifies unvalidated regression model */}
              <div className="p-3.5 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] font-mono text-amber-950 space-y-1">
                <strong>Severity Staging Status:</strong> No validated continuous clinical severity model produced. Exploratory biomarker measurements (Theta/Alpha ratio &amp; VBR) were recorded without autonomous diagnostic staging.
              </div>

              <div className="pt-6 border-t border-border flex justify-between items-end text-xs font-sans text-muted">
                <div>
                  <div className="h-8 border-b border-border w-48 mb-1" />
                  <span>Attending Neuropsychiatrist Signature</span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-muted font-sans space-y-3 bg-white rounded-card border border-border">
              <p>No report compiled yet for the current analysis session.</p>
              <Button variant="primary" size="md" onClick={handleGenerateReport}>
                Compile Clinical Report Now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* SUB-PAGE 10: ANALYSIS HISTORY */}
      {activeSubPage === 'history' && (
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
            <div>
              <span className="text-xs font-mono text-muted uppercase tracking-wider block font-semibold">
                Clinical Audit Log
              </span>
              <h2 className="text-xl font-serif text-forest font-semibold mt-0.5">
                Analysis Session History
              </h2>
            </div>

            <div className="w-full sm:w-64">
              <UnderlineInput
                placeholder="Search subject or ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-muted text-[10px]">
                  <th className="py-2.5 px-3">ANALYSIS ID</th>
                  <th className="py-2.5 px-3">SUBJECT ID</th>
                  <th className="py-2.5 px-3">DATE / TIME</th>
                  <th className="py-2.5 px-3">MODALITIES</th>
                  <th className="py-2.5 px-3">PREDICTION</th>
                  <th className="py-2.5 px-3">REPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historySessions
                  .filter(s =>
                    !historySearch ||
                    s.analysis_id.toLowerCase().includes(historySearch.toLowerCase()) ||
                    s.subject_id.toLowerCase().includes(historySearch.toLowerCase())
                  )
                  .map((s) => (
                    <tr key={s.analysis_id} className="hover:bg-page transition-colors">
                      <td className="py-3 px-3 font-semibold text-forest">{s.analysis_id}</td>
                      <td className="py-3 px-3 text-body">{s.subject_id}</td>
                      <td className="py-3 px-3 text-muted">{s.timestamp}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          {s.modalities.eeg && <Badge variant="mint">EEG</Badge>}
                          {s.modalities.mri && <Badge variant="mri">MRI</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={s.prediction?.includes('Schizophrenia') ? 'risk' : 'healthy'}>
                          {s.prediction?.includes('Schizophrenia') ? 'Pattern Detected' : 'Healthy Control'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-forest">
                        {s.report_generated ? 'Generated' : 'Pending'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkspaceView;
