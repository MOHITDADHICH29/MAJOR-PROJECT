/**
 * NeuroFusion AI — Offline / Firebase Fallback Mock Data
 * Used when Flask backend is unavailable (Firebase Hosting static deployment).
 * All types match the strict TypeScript interfaces in ../types/index.ts.
 *
 * Demo Credentials:
 *   Doctor:    doctor.demo@neurofusion.ai  / DoctorDemo2026!
 *   Developer: developer.demo@neurofusion.ai / DeveloperDemo2026!
 *   (Legacy)   doctor@neurofusion.org     / doctor123
 *   (Legacy)   developer@neurofusion.org  / developer123
 */

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
  UserProfile,
  DoctorRegistrationRecord,
  DeveloperModel,
  DeveloperExperiment,
  DeveloperDatasetsResponse,
  DeveloperErrorAnalysisResponse,
  AnalysisSession
} from '../types';

// Internal user type with password field
export interface MockUser extends UserProfile {
  password_hash: string;
}

// ─── User Store ────────────────────────────────────────────────────────────────
export const MOCK_USERS: Record<string, MockUser> = {
  'doctor.demo@neurofusion.ai': {
    id: 'USR-DOC-DEMO-001', email: 'doctor.demo@neurofusion.ai',
    username: 'doctor.demo', password_hash: 'DoctorDemo2026!',
    name: 'Dr. Elena Vance, MD, PhD', role: 'doctor', sex: 'Female',
    hospital_name: 'NeuroImaging Diagnostic Center',
    hospital_address: '742 Evergreen Terrace, Medical Sciences Suite 400',
    license_number: 'MED-NY-849204', license_filename: 'medical_license_vance_md.pdf',
    approval_status: 'Approved', title: 'Lead Clinical Neuropsychiatrist',
    department: 'NeuroImaging Diagnostic Center',
    institution: 'Computational Neuroscience Institute',
    permissions: ['analysis:create', 'analysis:read', 'analysis:clinical', 'reports:generate', 'reports:export'],
    registration_date: '2026-01-15 09:30 UTC'
  },
  'developer.demo@neurofusion.ai': {
    id: 'USR-DEV-DEMO-002', email: 'developer.demo@neurofusion.ai',
    username: 'developer.demo', password_hash: 'DeveloperDemo2026!',
    name: 'Alex Morgan, M.S.', role: 'developer',
    approval_status: 'Approved', title: 'Senior ML & Neuroinformatics Engineer',
    department: 'Multimodal Neural Dynamics Laboratory',
    institution: 'AI & Computational Neuroscience Lab',
    permissions: ['models:inspect', 'experiments:read', 'datasets:inspect', 'metrics:evaluate', 'errors:analyze', 'admin:review'],
    registration_date: '2026-01-10 14:15 UTC'
  },
  'doctor@neurofusion.org': {
    id: 'USR-DOC-001', email: 'doctor@neurofusion.org',
    username: 'doctor', password_hash: 'doctor123',
    name: 'Dr. Elena Vance, MD, PhD', role: 'doctor', sex: 'Female',
    hospital_name: 'NeuroImaging Diagnostic Center',
    hospital_address: '742 Evergreen Terrace, Medical Sciences Suite 400',
    license_number: 'MED-NY-849204', license_filename: 'medical_license_vance_md.pdf',
    approval_status: 'Approved', title: 'Lead Clinical Neuropsychiatrist',
    department: 'NeuroImaging Diagnostic Center',
    institution: 'Computational Neuroscience Institute',
    permissions: ['analysis:create', 'analysis:read', 'analysis:clinical', 'reports:generate', 'reports:export'],
    registration_date: '2026-01-15 09:30 UTC'
  },
  'developer@neurofusion.org': {
    id: 'USR-DEV-002', email: 'developer@neurofusion.org',
    username: 'developer', password_hash: 'developer123',
    name: 'Alex Morgan, M.S.', role: 'developer',
    approval_status: 'Approved', title: 'Senior ML & Neuroinformatics Engineer',
    department: 'Multimodal Neural Dynamics Laboratory',
    institution: 'AI & Computational Neuroscience Lab',
    permissions: ['models:inspect', 'experiments:read', 'datasets:inspect', 'metrics:evaluate', 'errors:analyze', 'admin:review'],
    registration_date: '2026-01-10 14:15 UTC'
  },
  'admin@neurofusion.org': {
    id: 'USR-ADM-000', email: 'admin@neurofusion.org',
    username: 'admin', password_hash: 'admin123',
    name: 'Clinical Review Administrator', role: 'developer',
    approval_status: 'Approved', title: 'Medical Credential Review Officer',
    department: 'Clinical Compliance & Credentialing',
    institution: 'Computational Neuroscience Institute',
    permissions: ['admin:review', 'models:inspect', 'experiments:read', 'datasets:inspect'],
    registration_date: '2026-01-01 08:00 UTC'
  }
};

// ─── Role permissions & allowed pages ─────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  doctor: ['analysis:create', 'analysis:read', 'analysis:clinical', 'reports:generate', 'reports:export'],
  developer: ['models:inspect', 'experiments:read', 'datasets:inspect', 'metrics:evaluate', 'errors:analyze', 'admin:review']
};

export const ROLE_ALLOWED_PAGES = {
  doctor: ['doctor-workspace', 'overview', 'data-input', 'prediction', 'explainability', 'connectivity', 'severity', 'report'],
  developer: ['developer-console', 'overview', 'data-input', 'prediction', 'explainability', 'connectivity', 'evaluation', 'comparison', 'severity', 'report']
};

// ─── System Status ─────────────────────────────────────────────────────────────
export const MOCK_SYSTEM_STATUS: SystemStatusResponse = {
  system_name: 'NeuroFusion AI',
  subtitle: 'Multimodal Schizophrenia Detection Platform',
  version: '1.0.0-research',
  pipelines: {
    eeg_pipeline: { name: 'EEG Electrophysiology Pipeline', status: 'ready', model: 'Machine-Invariant Soft-Voting Ensemble (352-dim)', mean_accuracy: '77.43%', peak_accuracy: '84.00%', dataset_size: 124 },
    mri_pipeline: { name: '3D Anatomical MRI Morphometry', status: 'ready', model: '111-ROI Anatomical Atlas & GLCM Radiomics', mean_accuracy: '72.58%', peak_accuracy: '81.20%', dataset_size: 77 },
    fusion_pipeline: { name: 'Multimodal Synergistic Cross-Modal Decision Fusion', status: 'ready', strategy: 'High-Confidence Hierarchical Decision Fusion', mean_accuracy: '82.02%', peak_accuracy: '89.50%', cohort_size: 201 },
    explainability: { name: 'Explainable AI (XAI) & Biomarker Attribution', status: 'ready', methods: ['Input Gradients', 'Feature Importance Ranking', 'Bilateral Asymmetry', 'VBR Volumetrics'] },
    reporting: { name: 'Clinical Laboratory Summary Generation', status: 'ready', format: ['Interactive Web Preview', 'Clinical JSON', 'Print-Optimized PDF'] }
  },
  disclaimer: 'NeuroFusion AI is an exploratory computational neuroscience research system.'
};

// ─── Dataset Samples ───────────────────────────────────────────────────────────
export const MOCK_DATASET_SAMPLES: DatasetSample[] = [
  { id: 'sch-norm-S10W1', type: 'eeg', filename: 'sch-norm-S10W1_clean.npy', label: 0, label_name: 'Healthy Control', relative_path: 'data/processed/eeg/standardized/sch-norm-S10W1_clean.npy' },
  { id: 'sch-sz-S10W1', type: 'eeg', filename: 'sch-sz-S10W1_clean.npy', label: 1, label_name: 'Schizophrenia', relative_path: 'data/processed/eeg/standardized/sch-sz-S10W1_clean.npy' },
  { id: 'test_sub01', type: 'mri', filename: 'test_sub01.nii.gz', label: 0, label_name: 'Healthy Control', relative_path: 'test_sub01.nii.gz' },
  { id: 'test_sub02', type: 'mri', filename: 'test_sub02.nii.gz', label: 1, label_name: 'Schizophrenia', relative_path: 'test_sub02.nii.gz' }
];

// ─── EEG Analysis Results ──────────────────────────────────────────────────────
export const MOCK_EEG_RESULT: EEGAnalysisResult = {
  status: 'success', subject_id: 'SUBJ-4302-01', modality: 'EEG',
  model_name: 'Machine-Invariant Soft-Voting Ensemble (352-dim)',
  predicted_class: 1, prediction_label: 'Schizophrenia-associated pattern detected',
  confidence: 84.6, probabilities: { healthy_control: 0.154, schizophrenia: 0.846 },
  features_extracted_count: 352,
  metadata: { sampling_rate_hz: 128, channels: 19, duration_sec: 60, theta_alpha_slowing_ratio: 2.14 },
  channel_importance: [
    { channel: 'F3', importance: 0.94, power: 18.4 }, { channel: 'F4', importance: 0.86, power: 14.1 },
    { channel: 'T3', importance: 0.78, power: 12.6 }, { channel: 'T4', importance: 0.72, power: 11.2 },
    { channel: 'C3', importance: 0.65, power: 10.5 }, { channel: 'C4', importance: 0.58, power: 9.8 },
    { channel: 'F7', importance: 0.54, power: 8.9 },  { channel: 'F8', importance: 0.51, power: 8.4 },
    { channel: 'P3', importance: 0.44, power: 7.6 },  { channel: 'P4', importance: 0.39, power: 7.1 }
  ],
  band_powers: { delta: 22.4, theta: 31.8, alpha: 18.6, beta: 19.2, gamma: 8.0 },
  disclaimer: 'Research use only. Not validated for clinical diagnosis.'
};

export const MOCK_EEG_HEALTHY: EEGAnalysisResult = {
  status: 'success', subject_id: 'SUBJ-CTRL-01', modality: 'EEG',
  model_name: 'Machine-Invariant Soft-Voting Ensemble (352-dim)',
  predicted_class: 0, prediction_label: 'Healthy control pattern detected',
  confidence: 87.2, probabilities: { healthy_control: 0.872, schizophrenia: 0.128 },
  features_extracted_count: 352,
  metadata: { sampling_rate_hz: 128, channels: 19, duration_sec: 60, theta_alpha_slowing_ratio: 1.12 },
  channel_importance: [
    { channel: 'F3', importance: 0.71, power: 12.1 }, { channel: 'F4', importance: 0.68, power: 11.8 },
    { channel: 'T3', importance: 0.61, power: 10.4 }, { channel: 'T4', importance: 0.58, power: 10.1 },
    { channel: 'C3', importance: 0.52, power: 9.2 },  { channel: 'C4', importance: 0.49, power: 8.9 },
    { channel: 'Cz', importance: 0.45, power: 8.1 },  { channel: 'Fz', importance: 0.42, power: 7.8 }
  ],
  band_powers: { delta: 14.2, theta: 16.4, alpha: 31.8, beta: 28.6, gamma: 9.0 },
  disclaimer: 'Research use only. Not validated for clinical diagnosis.'
};

// ─── MRI Analysis Results ──────────────────────────────────────────────────────
export const MOCK_MRI_RESULT: MRIAnalysisResult = {
  status: 'success', subject_id: 'SUBJ-4302-01', modality: 'MRI',
  model_name: '111-ROI Anatomical Atlas & GLCM Radiomics Ensemble',
  predicted_class: 1, prediction_label: 'Schizophrenia-associated pattern detected',
  confidence: 81.2, probabilities: { healthy_control: 0.188, schizophrenia: 0.812 },
  features_extracted_count: 111,
  metadata: { target_dimensions: '96 x 96 x 96 (Isotropic)', atlas_parcellation: 'Harvard-Oxford 111-ROI + AAL3', radiomics_texture: 'GLCM 3D (Contrast, Energy, Homogeneity, Correlation)', vbr_percent: 4.82 },
  roi_attributions: [
    { region: 'Lateral Ventricular Enlargement (VBR)', attribution_score: 0.215, finding: 'Ventricular enlargement (+34.2% above reference)' },
    { region: 'DLPFC Gray Matter Density (Brodmann 9/46)', attribution_score: 0.182, finding: 'Prefrontal thinning (-14.8% cortical density)' },
    { region: 'Superior Temporal Gyrus (STG Left)', attribution_score: 0.146, finding: 'Left hemisphere volume reduction (-12.4%)' },
    { region: 'Anterior Cingulate Cortex (ACC)', attribution_score: 0.128, finding: 'Midline density deficit (-9.6%)' },
    { region: 'Hippocampal Formation (Bilateral)', attribution_score: 0.115, finding: 'Bilateral volume loss (-8.9%)' },
    { region: '3D GLCM Radiomics Homogeneity', attribution_score: 0.084, finding: 'Cortical microstructural drift' },
    { region: 'Insula Cortical Thickness', attribution_score: 0.072, finding: 'Bilateral thinning detected' },
    { region: 'Thalamic Asymmetry Index', attribution_score: 0.058, finding: 'Subcortical relay disruption' }
  ],
  disclaimer: 'Research use only. Not validated for clinical diagnosis.'
};

export const MOCK_MRI_HEALTHY: MRIAnalysisResult = {
  status: 'success', subject_id: 'SUBJ-CTRL-01', modality: 'MRI',
  model_name: '111-ROI Anatomical Atlas & GLCM Radiomics Ensemble',
  predicted_class: 0, prediction_label: 'Healthy control pattern detected',
  confidence: 82.5, probabilities: { healthy_control: 0.825, schizophrenia: 0.175 },
  features_extracted_count: 111,
  metadata: { target_dimensions: '96 x 96 x 96 (Isotropic)', atlas_parcellation: 'Harvard-Oxford 111-ROI + AAL3', radiomics_texture: 'GLCM 3D (Contrast, Energy, Homogeneity, Correlation)', vbr_percent: 2.18 },
  roi_attributions: [
    { region: 'Lateral Ventricular Volume (VBR)', attribution_score: 0.18, finding: 'Within normative reference range (2.18%)' },
    { region: 'DLPFC Gray Matter Density (Brodmann 9/46)', attribution_score: 0.16, finding: 'Preserved prefrontal cortical density' },
    { region: 'Superior Temporal Gyrus (STG)', attribution_score: 0.13, finding: 'Bilateral volume within normative bounds' },
    { region: 'Anterior Cingulate Cortex (ACC)', attribution_score: 0.11, finding: 'Midline cortical integrity preserved' }
  ],
  disclaimer: 'Research use only. Not validated for clinical diagnosis.'
};

// ─── Multimodal Fusion Result ──────────────────────────────────────────────────
export const MOCK_FUSION_RESULT: MultimodalAnalysisResult = {
  status: 'success',
  fusion_method: 'High-Confidence Hierarchical Decision Fusion with Agreement Weighting',
  modalities_used: ['EEG (19-Channel 10-20)', '3D T1-Weighted MRI (111-ROI Atlas)'],
  predicted_class: 1, prediction_label: 'Schizophrenia-associated pattern detected',
  confidence: 88.7, probabilities: { healthy_control: 0.113, schizophrenia: 0.887 },
  modality_contributions: { eeg_weight: 0.55, mri_weight: 0.45, cross_modal_synergy_gain: '+4.59% over single-modality baseline', modality_agreement_index: 0.941 },
  disclaimer: 'Research use only. Multimodal fusion output for computational research purposes.'
};

// ─── Connectivity Matrix ───────────────────────────────────────────────────────
const CHAN_COORDS: Record<string, { x: number; y: number }> = {
  Fp1: { x: -0.3, y: 0.8 }, Fp2: { x: 0.3, y: 0.8 },
  F3:  { x: -0.4, y: 0.5 }, F4:  { x: 0.4, y: 0.5 },
  C3:  { x: -0.5, y: 0.0 }, C4:  { x: 0.5, y: 0.0 },
  P3:  { x: -0.4, y: -0.5 }, P4:  { x: 0.4, y: -0.5 },
  O1:  { x: -0.25, y: -0.85 }, O2: { x: 0.25, y: -0.85 },
  F7:  { x: -0.75, y: 0.4 }, F8:  { x: 0.75, y: 0.4 },
  T3:  { x: -0.85, y: 0.0 }, T4:  { x: 0.85, y: 0.0 },
  T5:  { x: -0.75, y: -0.4 }, T6: { x: 0.75, y: -0.4 },
  Fz:  { x: 0.0, y: 0.5 }, Cz: { x: 0.0, y: 0.0 }, Pz: { x: 0.0, y: -0.5 }
};

export const MOCK_CONNECTIVITY: ConnectivityMatrixResponse = {
  status: 'success',
  channels: ['Fp1','Fp2','F3','F4','C3','C4','P3','P4','O1','O2','F7','F8','T3','T4','T5','T6','Fz','Cz','Pz'],
  coordinates: CHAN_COORDS,
  connectivity_matrix: Array.from({ length: 19 }, (_, i) =>
    Array.from({ length: 19 }, (_, j) => {
      if (i === j) return 1.0;
      const dist = Math.abs(i - j);
      return Math.round((Math.cos(dist * 0.4) * 0.6 + 0.2) * 100) / 100;
    })
  ),
  method: 'Pearson Functional Cross-Correlation (r)',
  frequency_bands: ['broadband (0.5-45 Hz)', 'delta (0.5-4 Hz)', 'theta (4-8 Hz)', 'alpha (8-13 Hz)', 'beta (13-30 Hz)', 'gamma (30-45 Hz)']
};

// ─── Explainability ────────────────────────────────────────────────────────────
export const MOCK_EXPLAINABILITY: ExplainabilityData = {
  status: 'success',
  eeg_biomarkers: [
    { name: 'Frontal Theta/Alpha Slowing Ratio (F3/F4)', importance: 0.185, direction: 'Elevated in SZ (p < 0.001)', category: 'Electrophysiology' },
    { name: 'Bilateral Alpha Asymmetry (F3 - F4)', importance: 0.142, direction: 'Left Alpha Deficit', category: 'Hemispheric Balance' },
    { name: 'Temporal Bilateral Coherence (T3 - T4)', importance: 0.118, direction: 'Reduced Functional Sync', category: 'Connectivity' },
    { name: 'Slow/Fast Power Ratio (Delta+Theta)/(Alpha+Beta)', importance: 0.104, direction: 'Global Cortical Slowing', category: 'Electrophysiology' },
    { name: 'Central Beta-Band Spectral Entropy (Cz/C3)', importance: 0.092, direction: 'Decreased Signal Complexity', category: 'Entropy' },
    { name: 'Peak Alpha Frequency (PAF) Shift', importance: 0.081, direction: 'Sub-harmonic deceleration', category: 'Oscillatory' },
    { name: 'Occipital Alpha Power Attenuation (O1/O2)', importance: 0.076, direction: 'Desynchronized Resting Alpha', category: 'Spectral' },
    { name: 'Bilateral Parietal Asymmetry (P3 - P4)', importance: 0.065, direction: 'Parieto-temporal Disconnection', category: 'Hemispheric Balance' }
  ],
  mri_biomarkers: [
    { region: 'Ventricle-to-Brain Ratio (VBR)', attribution: 0.215, direction: 'Ventricular Enlargement (+34.2%)', category: 'Ventricular System' },
    { region: 'DLPFC Gray Matter Density (Brodmann 9/46)', attribution: 0.182, direction: 'Prefrontal Thinning (p < 0.005)', category: 'Frontal Cortex' },
    { region: 'Superior Temporal Gyrus (STG) Volume', attribution: 0.146, direction: 'Left Hemisphere Reduction', category: 'Auditory Cortex' },
    { region: 'Anterior Cingulate Cortex (ACC) Volume', attribution: 0.128, direction: 'Midline Density Deficit', category: 'Limbic/Salience' },
    { region: 'Hippocampal Formation Volume', attribution: 0.115, direction: 'Bilateral Volume Loss', category: 'Medial Temporal' },
    { region: '3D GLCM Radiomics Homogeneity', attribution: 0.084, direction: 'Cortical Microstructural Drift', category: 'Radiomics Texture' },
    { region: 'Insula Cortical Thickness', attribution: 0.072, direction: 'Bilateral Thinning', category: 'Salience Network' },
    { region: 'Thalamic Asymmetry Index', attribution: 0.058, direction: 'Subcortical Relay Disruption', category: 'Subcortical' }
  ],
  attribution_method: 'Integrated Feature Importance & Permutation Saliency',
  wording_standard: 'This region received higher model attribution in the ensemble classifier.'
};

// ─── Evaluation ────────────────────────────────────────────────────────────────
export const MOCK_EVALUATION: EvaluationResponse = {
  status: 'success',
  summary: [
    { modality: 'EEG Only', principle: 'Machine-Invariant Frequency PSD, Slowing Ratios & Asymmetry', enrolled: 124, qc_passed: 124, mean_cv_accuracy: 77.43, cv_accuracy_std: 5.36, mean_f1: 0.7675, mean_auc: 0.8578, peak_accuracy: 84.00, correct_predictions: '96 / 124' },
    { modality: 'MRI Only', principle: '3D Anatomical Atlas Parcellation (111 ROIs) & Radiomics', enrolled: 102, qc_passed: 77, qc_excluded_count: 25, qc_exclusion_reason: 'Low SNR (<15dB), severe head positioning, or FOV truncation', mean_cv_accuracy: 72.58, cv_accuracy_std: 6.93, mean_f1: 0.7981, mean_auc: 0.7078, peak_accuracy: 81.20, correct_predictions: '56 / 77' },
    { modality: 'Multimodal Fusion', principle: 'Synergistic Cross-Modal High-Confidence Decision Fusion', enrolled: 226, qc_passed: 201, mean_cv_accuracy: 82.02, cv_accuracy_std: 4.12, mean_f1: 0.8401, mean_auc: 0.8958, peak_accuracy: 89.50, correct_predictions: '165 / 201' }
  ],
  eeg_5fold: [
    { fold: 1, accuracy: 84.00, f1: 0.8462, auc: 0.9744, test_n: 25, correct: '21 / 25' },
    { fold: 2, accuracy: 76.00, f1: 0.7273, auc: 0.8590, test_n: 25, correct: '19 / 25' },
    { fold: 3, accuracy: 68.00, f1: 0.6667, auc: 0.7308, test_n: 25, correct: '17 / 25' },
    { fold: 4, accuracy: 80.00, f1: 0.7826, auc: 0.8846, test_n: 25, correct: '20 / 25' },
    { fold: 5, accuracy: 79.17, f1: 0.8148, auc: 0.8403, test_n: 24, correct: '19 / 24' }
  ],
  mri_5fold: [
    { fold: 1, accuracy: 75.00, f1: 0.8333, auc: 0.8833, test_n: 16, correct: '12 / 16' },
    { fold: 2, accuracy: 81.20, f1: 0.8571, auc: 0.7667, test_n: 16, correct: '13 / 16' },
    { fold: 3, accuracy: 66.67, f1: 0.7273, auc: 0.6667, test_n: 15, correct: '10 / 15' },
    { fold: 4, accuracy: 73.33, f1: 0.8000, auc: 0.6500, test_n: 15, correct: '11 / 15' },
    { fold: 5, accuracy: 66.67, f1: 0.7727, auc: 0.5722, test_n: 15, correct: '10 / 15' }
  ],
  confusion_matrices: {
    eeg: { tn: 52, fp: 12, fn: 16, tp: 44, total: 124 },
    mri: { tn: 19, fp: 16, fn: 5, tp: 37, total: 77 },
    multimodal: { tn: 78, fp: 18, fn: 18, tp: 87, total: 201 }
  },
  roc_curves: {
    fpr: [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    tpr_eeg: [0.0, 0.35, 0.55, 0.68, 0.78, 0.83, 0.86, 0.90, 0.93, 0.96, 0.98, 0.99, 1.0, 1.0],
    tpr_mri: [0.0, 0.22, 0.40, 0.52, 0.62, 0.70, 0.74, 0.79, 0.84, 0.89, 0.92, 0.96, 0.98, 1.0],
    tpr_multimodal: [0.0, 0.48, 0.70, 0.82, 0.88, 0.91, 0.94, 0.96, 0.98, 0.99, 1.0, 1.0, 1.0, 1.0]
  }
};

// ─── Model Comparison ─────────────────────────────────────────────────────────
export const MOCK_COMPARISON: ModelComparisonResponse = {
  status: 'success',
  eeg_models: [
    { model: 'Soft-Voting Ensemble (ET+RF+XGB+SVM)', modality: 'EEG', accuracy: 77.43, f1: 0.7675, auc: 0.8578, status: 'Production Benchmark' },
    { model: 'ExtraTrees (600 estimators)', modality: 'EEG', accuracy: 76.20, f1: 0.7510, auc: 0.8410, status: 'Sub-model' },
    { model: 'Random Forest (600 estimators)', modality: 'EEG', accuracy: 75.80, f1: 0.7490, auc: 0.8390, status: 'Sub-model' },
    { model: 'XGBoost (eta=0.05, depth=4)', modality: 'EEG', accuracy: 75.00, f1: 0.7380, auc: 0.8250, status: 'Sub-model' },
    { model: 'Raw 1D-CNN (Old Pipeline)', modality: 'EEG', accuracy: 59.00, f1: 0.5830, auc: 0.6410, status: 'Superseded Baseline' }
  ],
  mri_models: [
    { model: '111-ROI Atlas & Radiomics Ensemble', modality: 'MRI', accuracy: 72.58, f1: 0.7981, auc: 0.7078, status: 'Production Benchmark' },
    { model: 'ExtraTrees Atlas Parcellation', modality: 'MRI', accuracy: 71.40, f1: 0.7850, auc: 0.6940, status: 'Sub-model' },
    { model: 'Random Forest Atlas Parcellation', modality: 'MRI', accuracy: 70.80, f1: 0.7790, auc: 0.6880, status: 'Sub-model' },
    { model: 'Raw 3D Voxel CNN (Baseline)', modality: 'MRI', accuracy: 36.36, f1: 0.0000, auc: 0.5357, status: 'Majority-Class Collapsed' }
  ],
  multimodal_models: [
    { model: 'High-Confidence Hierarchical Decision Fusion', modality: 'Multimodal', accuracy: 82.02, f1: 0.8401, auc: 0.8958, status: 'Top Performer (+4.59%)' },
    { model: 'Concatenation Feature Fusion', modality: 'Multimodal', accuracy: 78.40, f1: 0.7920, auc: 0.8460, status: 'Comparison Baseline' }
  ]
};

// ─── Severity ──────────────────────────────────────────────────────────────────
export const MOCK_SEVERITY: SeverityResponse = {
  status: 'success', available: true,
  sample_id: 'SUBJ-4302-01', analysis_timestamp: new Date().toISOString(),
  composite_divergence_z: 2.34, severity_category: 'Tier 3 — High Multimodal Deviation',
  severity_tier: 'Tier 3', tier_color: '#E5824A',
  clinical_interpretation: 'High multi-system biomarker deviation above normative reference distribution',
  cross_modal_agreement_pct: 94.1,
  scientific_disclaimer: 'Exploratory biomarker divergence categories only. Not validated clinical staging.'
};

// ─── Report ────────────────────────────────────────────────────────────────────
export const MOCK_REPORT: ReportObject = {
  title: 'Multimodal Diagnostic Synthesis Report',
  timestamp: new Date().toLocaleString(),
  subject_id: 'SUBJ-4302-01',
  input_modalities: ['19-Channel 10-20 EEG', '3D T1-Weighted MRI (111-ROI)'],
  eeg_analysis: {
    preprocessing: 'Butterworth 0.5-45 Hz + 50 Hz Notch + Z-Score (128 Hz)',
    model_prediction: 'Schizophrenia-associated pattern detected', confidence: 84.6,
    key_biomarkers: ['Theta/Alpha Slowing Ratio 2.14 (+42%)', 'Bilateral Frontal Alpha Asymmetry -0.28', 'Temporal Coherence T3-T4: 0.41', 'Spectral Entropy Cz/C3: 0.68']
  },
  mri_analysis: {
    preprocessing: 'MNI-152 Affine Registration + 111-ROI Harvard-Oxford Atlas',
    model_prediction: 'Schizophrenia-associated pattern detected', confidence: 81.2,
    key_biomarkers: ['VBR 4.82% (+34.2%)', 'Left DLPFC Gray Matter -14.8%', 'Superior Temporal Gyrus -12.4%', 'Anterior Cingulate Cortex -9.6%']
  },
  multimodal_fusion: {
    strategy: 'High-Confidence Hierarchical Decision Fusion with Agreement Weighting',
    final_prediction: 'Schizophrenia-associated pattern detected',
    confidence: 88.7, synergy_gain: '+4.59% over single-modality baseline'
  },
  explainable_ai: {
    top_eeg_channels: ['F3 (0.94)', 'F4 (0.86)', 'T3 (0.78)', 'T4 (0.72)', 'C3 (0.65)'],
    top_imaging_regions: ['VBR (0.215)', 'L-DLPFC (0.182)', 'L-STG (0.146)', 'ACC (0.128)', 'Hippocampus (0.115)'],
    attribution_standard: 'Integrated Feature Importance & Permutation Saliency. This region received higher model attribution.'
  },
  severity_status: 'Tier 3 — High Multimodal Deviation',
  computational_severity: { protocol_tier: 'Tier 3 (Z = 2.34)', theta_alpha_ratio: '2.14 (Z = +2.58)', ventricle_ratio: '4.82% (Z = +2.84)', cross_modal_concordance: '94.1% agreement' },
  model_provenance: {
    eeg_model: 'Machine-Invariant Soft-Voting Ensemble v2.0 (77.43% mean CV)',
    mri_model: '111-ROI Atlas & Radiomics Ensemble v2.0 (72.58% mean CV)',
    multimodal_benchmark: 'Hierarchical Decision Fusion v2.1 (82.02% mean CV, 89.5% peak)'
  },
  diagnostic_conclusion: {
    has_schizophrenia: true, verdict: 'Schizophrenia-associated pattern detected',
    verdict_badge: 'HIGH CONFIDENCE POSITIVE', verdict_color: '#C94040', confidence_pct: 88.7,
    clinical_summary: 'High-confidence concordance between frontal electrophysiological slowing (84.6%) and lateral ventricular dilation / prefrontal thinning (81.2%).',
    recommendation: 'Review synthesized deviations with senior clinical psychiatry team for comprehensive diagnostic correlation.'
  },
  limitations: [
    'Cross-site scanner variance may affect uncalibrated raw recordings.',
    'Cohort limited to adult subjects under resting-state conditions.',
    'Does not account for concurrent pharmacotherapy or antipsychotic dosage levels.'
  ],
  research_disclaimer: 'NeuroFusion AI is a computational neuroscience research platform. Outputs are for scientific research and demonstration only.'
};

// ─── Doctor History ────────────────────────────────────────────────────────────
export const MOCK_DOCTOR_HISTORY: AnalysisSession[] = [
  { analysis_id: 'ANL-2026-001', subject_id: 'SUBJ-4302-01', timestamp: '2026-09-28 14:22 UTC', modalities: { eeg: true, mri: true, fmri: false, ct: false }, status: 'Completed', model_version: 'v2.1.0-multimodal', prediction: 'Schizophrenia-associated pattern detected', confidence: 85.9, report_generated: true },
  { analysis_id: 'ANL-2026-002', subject_id: 'SUBJ-4302-04', timestamp: '2026-09-29 09:15 UTC', modalities: { eeg: true, mri: true, fmri: false, ct: false }, status: 'Completed', model_version: 'v2.1.0-multimodal', prediction: 'Healthy control pattern detected', confidence: 88.4, report_generated: true },
  { analysis_id: 'ANL-2026-003', subject_id: 'SUBJ-EEG-10W1', timestamp: '2026-09-30 11:40 UTC', modalities: { eeg: true, mri: false, fmri: false, ct: false }, status: 'Completed', model_version: 'v2.0.0-eeg-ensemble', prediction: 'Healthy control pattern detected', confidence: 81.2, report_generated: false },
  { analysis_id: 'ANL-2026-004', subject_id: 'SUBJ-5073-12', timestamp: '2026-10-01 16:05 UTC', modalities: { eeg: true, mri: true, fmri: true, ct: false }, status: 'Completed', model_version: 'v2.1.0-multimodal', prediction: 'Schizophrenia-associated pattern detected', confidence: 83.7, report_generated: true }
];

// ─── Doctor Registrations ──────────────────────────────────────────────────────
export const MOCK_DOCTOR_REGISTRATIONS: DoctorRegistrationRecord[] = [
  { id: 'USR-DOC-DEMO-001', name: 'Dr. Elena Vance, MD, PhD', sex: 'Female', email: 'doctor.demo@neurofusion.ai', hospital_name: 'NeuroImaging Diagnostic Center', hospital_address: '742 Evergreen Terrace, Medical Sciences Suite 400', license_number: 'MED-NY-849204', license_filename: 'medical_license_vance_md.pdf', has_license_document: true, approval_status: 'Approved', registration_date: '2026-01-15 09:30 UTC', status_updated_at: '2026-01-16 11:00 UTC', status_reviewer: 'SYSTEM_ADMIN', approval_notes: 'Verified against NY State Medical Licensing Board.' },
  { id: 'USR-DOC-003', name: 'Dr. Marcus Thorne, MD', sex: 'Male', email: 'dr.thorne@mountsinai.org', hospital_name: 'Mount Sinai Psychiatric Institute', hospital_address: 'One Gustave L. Levy Place, New York, NY 10029', license_number: 'MED-NY-918234', license_filename: 'license_thorne_board_cert.pdf', has_license_document: true, approval_status: 'Pending Verification', registration_date: '2026-10-12 18:40 UTC', status_notes: 'Awaiting credential verification.' }
];

// ─── Developer Models ──────────────────────────────────────────────────────────
export const MOCK_DEVELOPER_MODELS: DeveloperModel[] = [
  { id: 'mdl-eeg-ensemble-v2', name: 'Machine-Invariant Soft-Voting Ensemble', modality: 'EEG Time-Series', version: 'v2.0.0', checkpoint_file: 'eeg_cv_ensemble.pkl', architecture: 'Calibrated Soft-Voting (ExtraTrees-600 + RF-600 + XGBoost + SVM-RBF)', feature_dim: 352, status: 'Production Benchmark', training_dataset: 'Schizophrenia EEG Multi-Site (124 subjects)', mean_cv_accuracy: 77.43, peak_accuracy: 84.00, mean_auc: 0.8578, mean_f1: 0.7675, inference_latency_ms: 14.2, file_size_bytes: 42180000, file_size_formatted: '40.22 MB', checkpoint_exists: true },
  { id: 'mdl-mri-atlas-v2', name: '111-ROI Anatomical Atlas & Radiomics Ensemble', modality: '3D T1w Anatomical MRI', version: 'v2.0.0', checkpoint_file: 'mri_morphometric_ensemble.pkl', architecture: 'Soft-Voting Atlas Ensemble (ExtraTrees + RF + Regularized XGBoost)', feature_dim: 111, status: 'Production Benchmark', training_dataset: 'ds004302 & ds005073 Harmonized MRI (77 QC-Passed)', mean_cv_accuracy: 72.58, peak_accuracy: 81.20, mean_auc: 0.7078, mean_f1: 0.7981, inference_latency_ms: 86.5, file_size_bytes: 28400000, file_size_formatted: '27.08 MB', checkpoint_exists: true },
  { id: 'mdl-multimodal-fusion-v2', name: 'Synergistic Cross-Modal Decision Fusion', modality: 'Multimodal (EEG + MRI)', version: 'v2.1.0', checkpoint_file: 'early_fusion_multimodal_best.pt', architecture: 'High-Confidence Hierarchical Decision Fusion with Agreement Weighting', feature_dim: 463, status: 'Highest Benchmark (Top Performer)', training_dataset: 'Combined Multimodal Cohort (201 QC-Passed)', mean_cv_accuracy: 82.02, peak_accuracy: 89.50, mean_auc: 0.8958, mean_f1: 0.8401, inference_latency_ms: 98.4, file_size_bytes: 14500000, file_size_formatted: '13.83 MB', checkpoint_exists: true }
];

// ─── Developer Experiments ─────────────────────────────────────────────────────
export const MOCK_DEVELOPER_EXPERIMENTS: DeveloperExperiment[] = [
  { id: 'EXP-2026-089', title: 'Machine-Invariant Feature Extraction with 5-Fold CV', modality: 'EEG', model_version: 'v2.0.0', date: '2026-09-15', author: 'NeuroFusion Research Team', hyperparameters: { sampling_rate: 128, n_channels: 19, cv_strategy: '5-Fold Stratified Group-KFold' }, validation_results: { mean_accuracy: 77.43, std_accuracy: 5.36, mean_f1: 0.7675, mean_auc: 0.8578, peak_fold: 'Fold 1 (84.00% Accuracy)' }, status: 'Completed / Validated', notes: 'Machine-invariant PSD eliminates cross-device sensor gain variance.' },
  { id: 'EXP-2026-094', title: '111-ROI Anatomical Atlas Parcellation & 3D Radiomics', modality: 'MRI', model_version: 'v2.0.0', date: '2026-09-20', author: 'NeuroFusion Research Team', hyperparameters: { target_grid: '96x96x96', atlas: '111 ROIs', radiomics: 'GLCM 3D' }, validation_results: { mean_accuracy: 72.58, std_accuracy: 6.93, mean_f1: 0.7981, mean_auc: 0.7078, peak_fold: 'Fold 2 (81.20% Accuracy)' }, status: 'Completed / Validated', notes: 'Solved 3D CNN majority-class collapse (36.36% -> 72.58%).' },
  { id: 'EXP-2026-101', title: 'Cross-Modal Synergistic High-Confidence Decision Fusion', modality: 'Multimodal (EEG + MRI)', model_version: 'v2.1.0', date: '2026-09-24', author: 'NeuroFusion Research Team', hyperparameters: { eeg_weight: 0.55, mri_weight: 0.45, agreement_boost: 0.05 }, validation_results: { mean_accuracy: 82.02, std_accuracy: 4.12, mean_f1: 0.8401, mean_auc: 0.8958, peak_accuracy: 89.50 }, status: 'Completed / Benchmark Winner', notes: '+4.59% diagnostic gain over single-modality baseline.' }
];

// ─── Developer Datasets ────────────────────────────────────────────────────────
export const MOCK_DEVELOPER_DATASETS: DeveloperDatasetsResponse = {
  status: 'success',
  cohort_summary: { total_enrolled: 226, total_qc_passed: 201, eeg_total: 124, mri_total: 77, multimodal_paired: 201 },
  datasets: [
    { name: 'Schizophrenia Multi-Site EEG Cohort', accession: 'OpenNeuro / Local Standardized', modality: '19-Channel 10-20 EEG', sample_count: 124, class_distribution: { 'Healthy Controls': 64, 'Schizophrenia Spectrum': 60 }, qc_passed: 124, qc_pass_rate: '100.0%', sampling_frequency: '128 Hz', preprocessing_status: 'Butterworth 0.5-45 Hz + 50 Hz Notch + Z-Score Standardized' },
    { name: 'OpenNeuro ds004302 (Structural MRI)', accession: 'ds004302', modality: '3D T1-Weighted MRI', sample_count: 71, class_distribution: { 'Healthy Controls': 35, 'Schizophrenia Spectrum': 36 }, qc_passed: 52, qc_pass_rate: '73.2%', dimensions: '96 x 96 x 96 (Isotropic)', preprocessing_status: 'Affine Registration + 111-ROI Atlas Parcellation' },
    { name: 'OpenNeuro ds005073 (Harmonized MRI)', accession: 'ds005073', modality: '3D T1-Weighted MRI', sample_count: 31, class_distribution: { 'Healthy Controls': 15, 'Schizophrenia Spectrum': 16 }, qc_passed: 25, qc_pass_rate: '80.6%', dimensions: '96 x 96 x 96 (Isotropic)', preprocessing_status: 'Atlas Mapped & Harmonized' }
  ]
};

// ─── Developer Error Analysis ──────────────────────────────────────────────────
export const MOCK_DEVELOPER_ERROR_ANALYSIS: DeveloperErrorAnalysisResponse = {
  status: 'success',
  eeg_errors: {
    false_positives: 16, false_negatives: 12, fp_rate: 0.25, fn_rate: 0.20,
    primary_causes: [
      { cause: 'Severe Frontal Muscle / Blink Artifacts (Fp1, Fp2)', samples_affected: 7, percentage: '43.8%' },
      { cause: 'Borderline PAF Slowing (Normal Senior Variant)', samples_affected: 5, percentage: '31.2%' },
      { cause: 'High-Frequency Ground Impedance Drift (>15 kOhm)', samples_affected: 4, percentage: '25.0%' }
    ],
    misclassified_samples: [
      { id: 'sch-sz-S145W1', true_class: 'Schizophrenia (1)', predicted_class: 'Healthy (0)', model_prob: 0.44, cause: 'Preserved alpha rhythm without slow wave emergence' },
      { id: 'sch-sz-S183W1', true_class: 'Schizophrenia (1)', predicted_class: 'Healthy (0)', model_prob: 0.47, cause: 'Near-threshold theta power' },
      { id: 'sch-norm-S173W1', true_class: 'Healthy (0)', predicted_class: 'Schizophrenia (1)', model_prob: 0.54, cause: 'Mild frontal slowing due to drowsy recording segment' }
    ]
  },
  mri_errors: {
    false_positives: 15, false_negatives: 6, fp_rate: 0.19, fn_rate: 0.13,
    primary_causes: [
      { cause: 'Benign Age-Related Ventricular Dilation (VBR > 3.5% without psychosis)', samples_affected: 8, percentage: '53.3%' },
      { cause: 'Incomplete Atlas Skull Stripping at Temporal Poles', samples_affected: 4, percentage: '26.7%' },
      { cause: 'Subtle Gray-White Contrast Blurring (<18 dB SNR)', samples_affected: 3, percentage: '20.0%' }
    ],
    misclassified_samples: [
      { id: 'sub-18', true_class: 'Healthy (0)', predicted_class: 'Schizophrenia (1)', model_prob: 0.58, cause: 'Incidental benign lateral ventricular asymmetry' },
      { id: 'sub-27', true_class: 'Schizophrenia (1)', predicted_class: 'Healthy (0)', model_prob: 0.41, cause: 'Early-stage with preserved prefrontal cortical thickness' }
    ]
  },
  multimodal_error_resolution: {
    resolved_by_fusion: '18 samples misclassified by a single modality were correctly rectified by the synergistic cross-modal agreement protocol.',
    remaining_discrepancies: 18,
    net_accuracy_advantage: '+4.59% over single-modality baseline'
  }
};
