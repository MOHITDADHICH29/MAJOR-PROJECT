import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { OverviewView } from './views/OverviewView';
import { DataInputView } from './views/DataInputView';
import { PredictionView } from './views/PredictionView';
import { ExplainabilityView } from './views/ExplainabilityView';
import { BrainConnectivityView } from './views/BrainConnectivityView';
import { EvaluationView } from './views/EvaluationView';
import { ModelComparisonView } from './views/ModelComparisonView';
import { SeverityEstimationView } from './views/SeverityEstimationView';
import { ResearchReportView } from './views/ResearchReportView';
import { apiService } from './services/api';
import {
  SystemStatusResponse,
  DatasetSample,
  EEGAnalysisResult,
  MRIAnalysisResult,
  MultimodalAnalysisResult,
  ConnectivityMatrixResponse,
  ExplainabilityData,
  EvaluationResponse,
  ModelComparisonResponse,
  SeverityResponse,
  ReportObject
} from './types';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Global state
  const [statusData, setStatusData] = useState<SystemStatusResponse | null>(null);
  const [samples, setSamples] = useState<DatasetSample[]>([]);
  const [activeSampleId, setActiveSampleId] = useState<string>('sch-norm-S10W1');
  const [activeEEG, setActiveEEG] = useState<EEGAnalysisResult | null>(null);
  const [activeMRI, setActiveMRI] = useState<MRIAnalysisResult | null>(null);
  const [activeFusion, setActiveFusion] = useState<MultimodalAnalysisResult | null>(null);
  
  const [connectivityData, setConnectivityData] = useState<ConnectivityMatrixResponse | null>(null);
  const [xaiData, setXaiData] = useState<ExplainabilityData | null>(null);
  const [evalData, setEvalData] = useState<EvaluationResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ModelComparisonResponse | null>(null);
  const [severityData, setSeverityData] = useState<SeverityResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFusing, setIsFusing] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [status, sampleList, conn, xai, evaluation, comparison, severity] = await Promise.all([
        apiService.getStatus().catch(() => null),
        apiService.getSamples().catch(() => []),
        apiService.getConnectivity().catch(() => null),
        apiService.getExplainability().catch(() => null),
        apiService.getEvaluation().catch(() => null),
        apiService.getComparison().catch(() => null),
        apiService.getSeverity().catch(() => null),
      ]);

      if (status) setStatusData(status);
      if (sampleList.length) setSamples(sampleList);
      if (conn) setConnectivityData(conn);
      if (xai) setXaiData(xai);
      if (evaluation) setEvalData(evaluation);
      if (comparison) setComparisonData(comparison);
      if (severity) setSeverityData(severity);

      // Auto-load default baseline sample preset for immediate presentation readiness
      if (sampleList.length > 0) {
        const defaultEeg = sampleList.find(s => s.type === 'eeg');
        const defaultMri = sampleList.find(s => s.type === 'mri') || {
          id: 'test_sub01',
          type: 'mri' as const,
          filename: 'test_sub01.nii.gz',
          label: 0,
          label_name: 'Healthy Control',
          relative_path: 'test_sub01.nii.gz'
        };

        if (defaultEeg) {
          apiService.analyzeEEG(defaultEeg.relative_path).then(res => setActiveEEG(res)).catch(() => null);
        }
        if (defaultMri) {
          apiService.analyzeMRI(defaultMri.relative_path).then(res => setActiveMRI(res)).catch(() => null);
        }
      }
    } catch (e) {
      console.error('Initial data loading error:', e);
    }
  };

  // Quick load sample preset
  const handleSelectSample = async (sample: DatasetSample) => {
    setIsLoading(true);
    setActiveSampleId(sample.id);
    try {
      if (sample.type === 'eeg') {
        const eegRes = await apiService.analyzeEEG(sample.relative_path);
        setActiveEEG(eegRes);
        if (activeMRI) {
          const fusion = await apiService.analyzeMultimodal(eegRes, activeMRI);
          setActiveFusion(fusion);
        }
      } else {
        const mriRes = await apiService.analyzeMRI(sample.relative_path);
        setActiveMRI(mriRes);
        if (activeEEG) {
          const fusion = await apiService.analyzeMultimodal(activeEEG, mriRes);
          setActiveFusion(fusion);
        }
      }
    } catch (e) {
      console.error('Error loading sample preset:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom file upload
  const handleUploadFile = async (type: 'eeg' | 'mri', file: File) => {
    setIsLoading(true);
    setActiveSampleId(file.name.split('.')[0]);
    try {
      if (type === 'eeg') {
        const res = await apiService.analyzeEEG(undefined, file);
        setActiveEEG(res);
        if (activeMRI) {
          const fusion = await apiService.analyzeMultimodal(res, activeMRI);
          setActiveFusion(fusion);
        }
      } else {
        const res = await apiService.analyzeMRI(undefined, file);
        setActiveMRI(res);
        if (activeEEG) {
          const fusion = await apiService.analyzeMultimodal(activeEEG, res);
          setActiveFusion(fusion);
        }
      }
    } catch (e) {
      console.error('File upload error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute multimodal fusion
  const handleRunFusion = async () => {
    if (!activeEEG || !activeMRI) return;
    setIsFusing(true);
    try {
      const res = await apiService.analyzeMultimodal(activeEEG, activeMRI);
      setActiveFusion(res);
    } catch (e) {
      console.error('Fusion error:', e);
    } finally {
      setIsFusing(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async (): Promise<ReportObject | null> => {
    try {
      return await apiService.generateReport(
        activeSampleId,
        activeEEG,
        activeMRI,
        activeFusion
      );
    } catch (e) {
      console.error('Report error:', e);
      return null;
    }
  };

  const getPageTitle = (page: NavigationPage) => {
    switch (page) {
      case 'overview': return 'Overview Dashboard';
      case 'data-input': return 'Data Input & Preprocessing';
      case 'prediction': return 'Model Predictions';
      case 'explainability': return 'Explainable AI & Biomarkers';
      case 'connectivity': return 'Functional Brain Connectivity';
      case 'evaluation': return '5-Fold Benchmark Evaluation';
      case 'comparison': return 'Architecture Comparison';
      case 'severity': return 'Severity Estimation Protocol';
      case 'report': return 'Clinical Research Report';
      default: return 'NeuroFusion AI';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        systemReady={statusData?.pipelines?.eeg_pipeline?.status === 'ready'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          pageTitle={getPageTitle(activePage)}
          activeSampleId={activeSampleId}
          statusData={statusData}
          onRefreshStatus={loadInitialData}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'overview' && (
            <OverviewView
              statusData={statusData}
              samples={samples}
              activeEEG={activeEEG}
              activeMRI={activeMRI}
              activeFusion={activeFusion}
              onNavigate={setActivePage}
              onQuickLoadSample={handleSelectSample}
              isLoading={isLoading}
            />
          )}

          {activePage === 'data-input' && (
            <DataInputView
              samples={samples}
              onSelectSample={handleSelectSample}
              onUploadFile={handleUploadFile}
              activeEEG={activeEEG}
              activeMRI={activeMRI}
              isLoading={isLoading}
              onProceedToPrediction={() => setActivePage('prediction')}
            />
          )}

          {activePage === 'prediction' && (
            <PredictionView
              eegResult={activeEEG}
              mriResult={activeMRI}
              fusionResult={activeFusion}
              onNavigate={setActivePage}
              onRunFusion={handleRunFusion}
              isFusing={isFusing}
            />
          )}

          {activePage === 'explainability' && (
            <ExplainabilityView
              xaiData={xaiData}
              eegResult={activeEEG}
              mriResult={activeMRI}
              fusionResult={activeFusion}
            />
          )}

          {activePage === 'connectivity' && (
            <BrainConnectivityView
              connectivityData={connectivityData}
              onRefresh={() => apiService.getConnectivity().then(setConnectivityData)}
              isLoading={isLoading}
            />
          )}

          {activePage === 'evaluation' && (
            <EvaluationView evalData={evalData} />
          )}

          {activePage === 'comparison' && (
            <ModelComparisonView comparisonData={comparisonData} />
          )}

          {activePage === 'severity' && (
            <SeverityEstimationView severityData={severityData} />
          )}

          {activePage === 'report' && (
            <ResearchReportView
              activeSampleId={activeSampleId}
              eegResult={activeEEG}
              mriResult={activeMRI}
              fusionResult={activeFusion}
              onGenerateReport={handleGenerateReport}
            />
          )}
        </main>
      </div>
    </div>
  );
};
export default App;
