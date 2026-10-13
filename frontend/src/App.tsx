import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { PublicNavbar } from './components/public/PublicNavbar';
import { LandingPageView } from './views/LandingPageView';
import { DoctorWorkspaceView, DoctorSubPage } from './views/DoctorWorkspaceView';
import { DeveloperConsoleView, DeveloperTab } from './views/DeveloperConsoleView';
import { OverviewView } from './views/OverviewView';
import { DataInputView } from './views/DataInputView';
import { PredictionView } from './views/PredictionView';
import { ExplainabilityView } from './views/ExplainabilityView';
import { BrainConnectivityView } from './views/BrainConnectivityView';
import { EvaluationView } from './views/EvaluationView';
import { ModelComparisonView } from './views/ModelComparisonView';
import { SeverityEstimationView } from './views/SeverityEstimationView';
import { ResearchReportView } from './views/ResearchReportView';
import { RoleGatewayModal } from './components/auth/RoleGatewayModal';
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
  ReportObject,
  UserRole,
  UserProfile
} from './types';

export const App: React.FC = () => {
  // Navigation & Authentication
  const [activePage, setActivePage] = useState<NavigationPage>('landing');
  const [doctorSubPage, setDoctorSubPage] = useState<DoctorSubPage>('overview');
  const [developerSubPage, setDeveloperSubPage] = useState<DeveloperTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('doctor');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: 'USR-DOC-001',
    email: 'doctor@neurofusion.org',
    username: 'doctor',
    name: 'Dr. Elena Vance, MD, PhD',
    role: 'doctor',
    title: 'Lead Clinical Neuropsychiatrist',
    department: 'NeuroImaging Diagnostic Center',
    institution: 'Computational Neuroscience Institute',
    permissions: ['analysis:clinical', 'reports:generate', 'eeg:inspect', 'imaging:inspect']
  });

  // Global Pipeline State (Preserving 100% existing functionality)
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
      const user = await apiService.getCurrentUser().catch(() => null);
      if (user) {
        setCurrentUser(user);
        setActiveRole(user.role);
      }

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

      // Auto-load default baseline sample preset
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

  const handleRoleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    if (user.role === 'doctor') {
      setActivePage('doctor-workspace');
      setDoctorSubPage('overview');
    } else if (user.role === 'developer') {
      setActivePage('developer-console');
      setDeveloperSubPage('overview');
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
    setActivePage('landing');
  };

  const getPageTitle = (page: NavigationPage) => {
    switch (page) {
      case 'landing': return 'Computational Neuroscience Platform';
      case 'doctor-workspace': return 'Doctor Analysis Workspace';
      case 'developer-console': return 'Developer Research Lab';
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

  // If Public Landing Page is active, render the dedicated public experience
  if (activePage === 'landing') {
    return (
      <div className="min-h-screen bg-page text-body flex flex-col">
        {/* Public Website Navigation Bar */}
        <PublicNavbar
          onLoginClick={(role) => {
            if (role) setActiveRole(role);
            setIsRoleModalOpen(true);
          }}
        />

        {/* Public Hero, 3D Anatomy & Research Pipeline */}
        <div className="pt-20">
          <LandingPageView
            onEnterRole={(role) => {
              setActiveRole(role);
              if (role === 'doctor') {
                setActivePage('doctor-workspace');
                setDoctorSubPage('overview');
              } else {
                setActivePage('developer-console');
                setDeveloperSubPage('overview');
              }
            }}
            onExploreWorkspace={() => {
              if (activeRole === 'developer') {
                setActivePage('developer-console');
                setDeveloperSubPage('overview');
              } else {
                setActivePage('doctor-workspace');
                setDoctorSubPage('overview');
              }
            }}
          />
        </div>

        {/* Role-Based Authentication Gateway Modal */}
        <RoleGatewayModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSuccess={handleRoleAuthSuccess}
          initialRole={activeRole}
        />
      </div>
    );
  }

  // Authenticated Role-Specific Workspace
  return (
    <div className="min-h-screen bg-page text-body flex">

      {/* Sidebar Navigation (Tailored strictly to Doctor or Developer) */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        doctorSubPage={doctorSubPage}
        onSelectDoctorSubPage={setDoctorSubPage}
        developerSubPage={developerSubPage}
        onSelectDeveloperSubPage={setDeveloperSubPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        systemReady={statusData?.pipelines?.eeg_pipeline?.status === 'ready'}
        userRole={activeRole}
        onLogout={handleLogout}
        onReturnLanding={() => setActivePage('landing')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          pageTitle={getPageTitle(activePage)}
          activeSampleId={activeSampleId}
          statusData={statusData}
          onRefreshStatus={loadInitialData}
          currentUser={currentUser}
          activeRole={activeRole}
          onOpenRoleGateway={() => setIsRoleModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Doctor Workspace (Analysis-Centric) */}
          {activePage === 'doctor-workspace' && (
            <DoctorWorkspaceView
              currentSubPage={doctorSubPage}
              onNavigateSubPage={setDoctorSubPage}
              currentUser={currentUser}
            />
          )}

          {/* Developer / Researcher Console (Model-Centric Research Lab) */}
          {activePage === 'developer-console' && (
            <DeveloperConsoleView
              currentTab={developerSubPage}
              onNavigateTab={setDeveloperSubPage}
            />
          )}

          {/* Preserved Standalone Computational Views (Reusable) */}
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
            <SeverityEstimationView
              severityData={severityData}
              onRefreshSeverity={() => apiService.getSeverity().then(setSeverityData)}
              onNavigateToReport={() => setActivePage('report')}
            />
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

      {/* Role-Based Authentication Gateway Modal */}
      <RoleGatewayModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={handleRoleAuthSuccess}
        initialRole={activeRole}
      />
    </div>
  );
};

export default App;
