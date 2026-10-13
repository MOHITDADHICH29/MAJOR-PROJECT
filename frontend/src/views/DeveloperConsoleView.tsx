import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Cpu,
  Layers,
  BarChart2,
  GitBranch,
  Database,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  GitCompare,
  Activity,
  Play
} from 'lucide-react';
import { apiService } from '../services/api';
import {
  DeveloperModel,
  DeveloperExperiment,
  DeveloperDatasetsResponse,
  DeveloperErrorAnalysisResponse,
  EvaluationResponse,
  ModelComparisonResponse
} from '../types';
import { ResearchDisclaimer } from '../components/ResearchDisclaimer';
import { Card, StatCard, Badge, Button } from '../components/ui';
import { AdminDoctorReviewPanel } from '../components/auth/AdminDoctorReviewPanel';

export type DeveloperTab =
  | 'overview'
  | 'credentials'
  | 'datasets'
  | 'experiments'
  | 'models'
  | 'training'
  | 'metrics'
  | 'evaluation'
  | 'comparison'
  | 'explainability'
  | 'errors'
  | 'versions';

interface DeveloperConsoleViewProps {
  currentTab?: DeveloperTab;
  onNavigateTab?: (tab: DeveloperTab) => void;
}

export const DeveloperConsoleView: React.FC<DeveloperConsoleViewProps> = ({
  currentTab: externalTab,
  onNavigateTab
}) => {
  const [internalTab, setInternalTab] = useState<DeveloperTab>('overview');
  const activeTab = externalTab || internalTab;

  const setActiveTab = (tab: DeveloperTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [models, setModels] = useState<DeveloperModel[]>([]);
  const [experiments, setExperiments] = useState<DeveloperExperiment[]>([]);
  const [datasetsData, setDatasetsData] = useState<DeveloperDatasetsResponse | null>(null);
  const [errorAnalysis, setErrorAnalysis] = useState<DeveloperErrorAnalysisResponse | null>(null);
  const [evalData, setEvalData] = useState<EvaluationResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ModelComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const loadDeveloperData = async () => {
    setIsLoading(true);
    try {
      const [mdls, exps, dts, errs, ev, comp] = await Promise.all([
        apiService.getDeveloperModels().catch(() => []),
        apiService.getDeveloperExperiments().catch(() => []),
        apiService.getDeveloperDatasets().catch(() => null),
        apiService.getDeveloperErrorAnalysis().catch(() => null),
        apiService.getEvaluation().catch(() => null),
        apiService.getComparison().catch(() => null)
      ]);

      if (mdls) setModels(mdls);
      if (exps) setExperiments(exps);
      if (dts) setDatasetsData(dts);
      if (errs) setErrorAnalysis(errs);
      if (ev) setEvalData(ev);
      if (comp) setComparisonData(comp);
    } catch (e) {
      console.error('Error loading developer data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: DeveloperTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'credentials', label: 'Doctor Credentials' },
    { id: 'datasets', label: 'Datasets' },
    { id: 'experiments', label: 'Experiments' },
    { id: 'models', label: 'Models' },
    { id: 'training', label: 'Training Runs' },
    { id: 'metrics', label: '5-Fold CV' },
    { id: 'comparison', label: 'Architecture Comparison' },
    { id: 'explainability', label: 'Explainability' },
    { id: 'errors', label: 'Error Analysis' },
    { id: 'versions', label: 'Model Versions' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-body">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-forest" />
            <h1 className="text-2xl font-serif text-forest font-semibold tracking-tight">
              Developer &amp; ML Research Laboratory
            </h1>
          </div>
          <p className="text-xs text-body-light font-sans mt-0.5">
            Model laboratory, 5-fold cross-validation metrics, training configurations, and error attribution
          </p>
        </div>

        <Badge variant="mint">
          <GitBranch className="w-3.5 h-3.5 mr-1 text-forest" />
          <span>PyTorch &bull; Scikit-Learn &bull; MNI-152</span>
        </Badge>
      </div>

      <ResearchDisclaimer compact />

      {/* Navigation Sub-Tabs as Pill Segmented Control */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-full bg-panel-light border border-border font-sans text-xs overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full capitalize font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-forest text-white shadow-sm'
                : 'text-muted hover:text-forest hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="EEG 5-CV Accuracy"
              value="77.43%"
              sublabel="Peak: 84.00%"
              trend="AUC: 0.8578"
              variant="white"
            />
            <StatCard
              label="MRI Atlas Accuracy"
              value="72.58%"
              sublabel="Peak: 81.20%"
              trend="AUC: 0.7078"
              variant="white"
            />
            <StatCard
              label="Multimodal Fusion"
              value="82.02%"
              sublabel="Peak: 89.50%"
              trend="Synergy: +4.59%"
              variant="mint"
            />
            <StatCard
              label="Enrolled Cohort"
              value="201"
              sublabel="QC-Passed Subjects"
              trend="25 Excluded"
              variant="alt"
            />
          </div>

          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-3 font-sans text-xs">
            <span className="text-xs font-mono font-bold text-forest uppercase block">
              Research Benchmark &amp; Architecture Status
            </span>
            <p className="text-body-light leading-relaxed">
              NeuroFusion AI implements machine-invariant power spectral density (PSD) extraction to resolve multi-site sensor gain drift and 111-ROI anatomical atlas parcellation to eliminate majority-class collapse in 3D convolutional models. Decision fusion dynamically routes authority to the modality exhibiting highest confidence.
            </p>
          </div>
        </div>
      )}

      {/* TAB: DOCTOR CREDENTIALS (Admin/Dev Console) */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <AdminDoctorReviewPanel />
        </div>
      )}

      {/* TAB 2: DATASETS */}
      {activeTab === 'datasets' && datasetsData && (
        <div className="space-y-4">
          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
            <span className="text-xs font-mono font-bold text-forest uppercase block">
              Standardized Multi-Site Cohorts &amp; Manifests
            </span>
            <div className="space-y-3">
              {datasetsData.datasets.map((d, idx) => (
                <div key={idx} className="p-4 rounded-card bg-panel-light border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-forest text-sm">{d.name}</h4>
                    <Badge variant="mint">{d.accession}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-body">
                    <div>Modality: <strong>{d.modality}</strong></div>
                    <div>Samples: <strong>{d.sample_count}</strong></div>
                    <div>QC Pass Rate: <strong className="text-healthy">{d.qc_pass_rate}</strong></div>
                  </div>
                  <div className="text-[11px] font-mono text-muted pt-2 border-t border-border">
                    Preprocessing: {d.preprocessing_status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPERIMENTS */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          {experiments.map(exp => (
            <div key={exp.id} className="p-6 rounded-panel bg-white border border-border shadow-card space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-mono text-muted font-bold block">{exp.id}</span>
                  <h3 className="text-base font-serif font-semibold text-forest mt-0.5">{exp.title}</h3>
                </div>
                <Badge variant="healthy">{exp.status}</Badge>
              </div>
              <p className="text-body-light leading-relaxed">{exp.notes}</p>
              <div className="p-3.5 rounded-card bg-panel-light border border-border space-y-1 font-mono text-xs">
                {Object.entries(exp.hyperparameters).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-muted">
                    <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-forest font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: MODELS & CHECKPOINTS */}
      {(activeTab === 'models' || activeTab === 'versions') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 font-sans text-xs">
            {models.map(m => (
              <div key={m.id} className="p-6 rounded-panel bg-white border border-border shadow-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h3 className="text-base font-serif font-semibold text-forest">{m.name}</h3>
                    <span className="text-xs text-muted font-mono block mt-0.5">{m.architecture}</span>
                  </div>
                  <Badge variant="healthy">{m.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-body">
                  <div>
                    <span className="text-[10px] text-muted block">CHECKPOINT FILE:</span>
                    <span className="text-forest font-semibold">{m.checkpoint_file}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">FEATURE DIM:</span>
                    <span className="text-forest font-semibold">{m.feature_dim}-dim</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">MEAN CV ACCURACY:</span>
                    <span className="text-healthy font-bold">{m.mean_cv_accuracy.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">INFERENCE LATENCY:</span>
                    <span className="text-body font-semibold">{m.inference_latency_ms} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRAINING RUNS */}
      {activeTab === 'training' && (
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-forest uppercase">TRAINING RUN TELEMETRY</h3>
            <Badge variant="healthy">Converged (5 Folds)</Badge>
          </div>
          <div className="space-y-3">
            {[
              { run: 'RUN-EEG-ENSEMBLE-F1-5', epochs: '600 Estimators', loss: '0.241', valLoss: '0.288', acc: '84.00%', valAcc: '77.43%' },
              { run: 'RUN-MRI-ATLAS-EXTRATREES', epochs: '600 Estimators', loss: '0.312', valLoss: '0.354', acc: '81.20%', valAcc: '72.58%' },
              { run: 'RUN-MULTIMODAL-DECISION-FUSION', epochs: 'Hierarchical GridSearch', loss: '0.198', valLoss: '0.214', acc: '89.50%', valAcc: '82.02%' },
            ].map((r, i) => (
              <div key={i} className="p-4 rounded-card bg-panel-light border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-forest">{r.run}</span>
                  <span className="text-muted">{r.epochs}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-body">
                  <div>Train Loss: <strong className="text-forest">{r.loss}</strong></div>
                  <div>Val Loss: <strong className="text-forest">{r.valLoss}</strong></div>
                  <div>Train Acc: <strong className="text-forest">{r.acc}</strong></div>
                  <div>Val Acc: <strong className="text-healthy">{r.valAcc}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: 5-FOLD EVALUATION METRICS */}
      {(activeTab === 'metrics' || activeTab === 'evaluation') && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
            <h3 className="text-sm font-bold text-forest uppercase flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-forest" />
              Per-Fold Stratified Cross-Validation Breakdown (EEG Cohort n=124)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-muted text-[10px]">
                    <th className="py-2.5 px-3">FOLD</th>
                    <th className="py-2.5 px-3">ACCURACY</th>
                    <th className="py-2.5 px-3">F1-SCORE</th>
                    <th className="py-2.5 px-3">ROC-AUC</th>
                    <th className="py-2.5 px-3">TEST SAMPLES</th>
                    <th className="py-2.5 px-3">PREDICTION ACCURACY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(evalData?.eeg_5fold || [
                    { fold: 1, accuracy: 84.00, f1: 0.8462, auc: 0.9744, test_n: 25, correct: '21 / 25' },
                    { fold: 2, accuracy: 76.00, f1: 0.7273, auc: 0.8590, test_n: 25, correct: '19 / 25' },
                    { fold: 3, accuracy: 68.00, f1: 0.6667, auc: 0.7308, test_n: 25, correct: '17 / 25' },
                    { fold: 4, accuracy: 80.00, f1: 0.7826, auc: 0.8846, test_n: 25, correct: '20 / 25' },
                    { fold: 5, accuracy: 79.17, f1: 0.8148, auc: 0.8403, test_n: 24, correct: '19 / 24' },
                  ]).map((f) => (
                    <tr key={f.fold} className="hover:bg-page transition-colors">
                      <td className="py-2.5 px-3 font-bold text-forest">Fold {f.fold}</td>
                      <td className="py-2.5 px-3 text-healthy font-bold">{f.accuracy.toFixed(2)}%</td>
                      <td className="py-2.5 px-3 text-body">{f.f1.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-forest">{f.auc.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-muted">{f.test_n}</td>
                      <td className="py-2.5 px-3 text-forest font-semibold">{f.correct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MODEL COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4">
            <h3 className="text-sm font-bold text-forest uppercase flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-forest" />
              Machine Learning Architecture Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-muted text-[10px]">
                    <th className="py-2.5 px-3">MODEL ARCHITECTURE</th>
                    <th className="py-2.5 px-3">MODALITY</th>
                    <th className="py-2.5 px-3">ACCURACY</th>
                    <th className="py-2.5 px-3">F1-SCORE</th>
                    <th className="py-2.5 px-3">ROC-AUC</th>
                    <th className="py-2.5 px-3">BENCHMARK STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { model: 'Synergistic Cross-Modal Decision Fusion', modality: 'EEG + MRI', accuracy: 82.02, f1: 0.8401, auc: 0.8958, status: 'Benchmark Winner (89.5% Peak)' },
                    { model: 'Calibrated Soft-Voting Ensemble', modality: 'EEG', accuracy: 77.43, f1: 0.7675, auc: 0.8578, status: 'Best EEG Ensemble' },
                    { model: 'ExtraTrees Classifier (n=600)', modality: 'EEG', accuracy: 76.20, f1: 0.7510, auc: 0.8410, status: 'Trained' },
                    { model: '111-ROI Anatomical Atlas Ensemble', modality: 'MRI', accuracy: 72.58, f1: 0.7981, auc: 0.7078, status: 'Best MRI Ensemble' },
                    { model: 'Random Forest (n=600)', modality: 'MRI', accuracy: 70.80, f1: 0.7790, auc: 0.6920, status: 'Trained' },
                    { model: 'Raw 3D Voxel CNN (Baseline)', modality: 'MRI', accuracy: 36.36, f1: 0.0000, auc: 0.5357, status: 'Collapsed Baseline' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-page transition-colors">
                      <td className="py-2.5 px-3 font-bold text-forest">{row.model}</td>
                      <td className="py-2.5 px-3 text-muted">{row.modality}</td>
                      <td className="py-2.5 px-3 text-healthy font-bold">{row.accuracy.toFixed(2)}%</td>
                      <td className="py-2.5 px-3 text-body">{row.f1.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-forest">{row.auc.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-muted">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: EXPLAINABILITY */}
      {activeTab === 'explainability' && (
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-forest uppercase flex items-center gap-2">
            <Zap className="w-4 h-4 text-forest" />
            Permutation Saliency Feature Rankings
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Lateral Ventricular System (VBR)', modality: 'MRI', importance: 0.215, finding: 'Central CSF ventricular expansion detected' },
              { name: 'Frontal Theta/Alpha Slowing Ratio (F3/F4)', modality: 'EEG', importance: 0.185, finding: 'Elevated low-frequency theta with alpha suppression' },
              { name: 'DLPFC Gray Matter Density (Brodmann 9/46)', modality: 'MRI', importance: 0.182, finding: 'Prefrontal cortical thinning' },
              { name: 'Bilateral Alpha Asymmetry (F3 - F4)', modality: 'EEG', importance: 0.142, finding: 'Left-dominant desynchronization deficit' }
            ].map((feat, idx) => (
              <div key={idx} className="p-3.5 rounded-card bg-panel-light border border-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-forest">{feat.name}</span>
                  <span className="text-forest font-bold">{(feat.importance * 100).toFixed(1)}% Attribution</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-forest rounded-full" style={{ width: `${feat.importance * 350}%` }} />
                </div>
                <span className="text-[11px] text-body-light font-sans block">{feat.finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: ERROR ANALYSIS */}
      {activeTab === 'errors' && errorAnalysis && (
        <div className="p-6 rounded-panel bg-white border border-border shadow-card space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-forest uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Cross-Validation Error Analysis &amp; Artifact Attribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-card bg-panel-light border border-border space-y-3">
              <span className="text-xs font-bold text-forest block">EEG ERRORS (16 FP / 12 FN)</span>
              {errorAnalysis.eeg_errors.primary_causes.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] p-2.5 rounded-card bg-white border border-border">
                  <span className="text-body">{c.cause}</span>
                  <span className="text-warning font-bold">{c.percentage}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-card bg-panel-light border border-border space-y-3">
              <span className="text-xs font-bold text-mri block">MRI ERRORS (15 FP / 6 FN)</span>
              {errorAnalysis.mri_errors.primary_causes.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] p-2.5 rounded-card bg-white border border-border">
                  <span className="text-body">{c.cause}</span>
                  <span className="text-warning font-bold">{c.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeveloperConsoleView;
