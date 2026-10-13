// Centralized TypeScript definitions for NeuroFusion AI

export interface PipelineInfo {
  name: string;
  status: 'ready' | 'processing' | 'unavailable';
  model?: string;
  strategy?: string;
  mean_accuracy?: string;
  peak_accuracy?: string;
  dataset_size?: number;
  cohort_size?: number;
  methods?: string[];
  format?: string[];
}

export interface SystemStatusResponse {
  system_name: string;
  subtitle: string;
  version: string;
  pipelines: {
    eeg_pipeline: PipelineInfo;
    mri_pipeline: PipelineInfo;
    fusion_pipeline: PipelineInfo;
    explainability: PipelineInfo;
    reporting: PipelineInfo;
  };
  disclaimer: string;
}

export interface DatasetSample {
  id: string;
  type: 'eeg' | 'mri';
  filename: string;
  label: number;
  label_name: string;
  relative_path: string;
}

export interface ChannelImportance {
  channel: string;
  importance: number;
  power?: number;
}

export interface EEGAnalysisResult {
  status: string;
  subject_id: string;
  modality: 'EEG';
  model_name: string;
  predicted_class: number;
  prediction_label: string;
  confidence: number;
  probabilities: {
    healthy_control: number;
    schizophrenia: number;
  };
  features_extracted_count: number;
  metadata: {
    sampling_rate_hz: number;
    channels: number;
    duration_sec: number;
    theta_alpha_slowing_ratio: number;
  };
  channel_importance: ChannelImportance[];
  band_powers: {
    delta: number;
    theta: number;
    alpha: number;
    beta: number;
    gamma: number;
  };
  disclaimer: string;
}

export interface ROIAttribution {
  region: string;
  attribution_score: number;
  finding: string;
}

export interface MRIAnalysisResult {
  status: string;
  subject_id: string;
  modality: 'MRI';
  model_name: string;
  predicted_class: number;
  prediction_label: string;
  confidence: number;
  probabilities: {
    healthy_control: number;
    schizophrenia: number;
  };
  features_extracted_count: number;
  metadata: {
    target_dimensions: string;
    atlas_parcellation: string;
    radiomics_texture: string;
    vbr_percent: number;
  };
  roi_attributions: ROIAttribution[];
  disclaimer: string;
}

export interface MultimodalAnalysisResult {
  status: string;
  fusion_method: string;
  modalities_used: string[];
  predicted_class: number;
  prediction_label: string;
  confidence: number;
  probabilities: {
    healthy_control: number;
    schizophrenia: number;
  };
  modality_contributions: {
    eeg_weight: number;
    mri_weight: number;
    cross_modal_synergy_gain: string;
    modality_agreement_index: number;
  };
  disclaimer: string;
}

export interface ConnectivityMatrixResponse {
  status: string;
  channels: string[];
  coordinates: Record<string, { x: number; y: number }>;
  connectivity_matrix: number[][];
  method: string;
  frequency_bands: string[];
}

export interface Biomarker {
  name?: string;
  region?: string;
  importance?: number;
  attribution?: number;
  direction: string;
  category: string;
}

export interface ExplainabilityData {
  status: string;
  eeg_biomarkers: Biomarker[];
  mri_biomarkers: Biomarker[];
  attribution_method: string;
  wording_standard: string;
}

export interface EvaluationSummary {
  modality: string;
  principle: string;
  enrolled: number;
  qc_passed: number;
  qc_excluded_count?: number;
  qc_exclusion_reason?: string;
  mean_cv_accuracy: number;
  cv_accuracy_std: number;
  mean_f1: number;
  mean_auc: number;
  peak_accuracy: number;
  correct_predictions: string;
}

export interface CVFold {
  fold: number;
  accuracy: number;
  f1: number;
  auc: number;
  test_n: number;
  correct: string;
}

export interface EvaluationResponse {
  status: string;
  summary: EvaluationSummary[];
  eeg_5fold: CVFold[];
  mri_5fold: CVFold[];
  confusion_matrices: {
    eeg: { tp: number; fp: number; fn: number; tn: number; total: number };
    mri: { tp: number; fp: number; fn: number; tn: number; total: number };
    multimodal: { tp: number; fp: number; fn: number; tn: number; total: number };
  };
  roc_curves: {
    fpr: number[];
    tpr_eeg: number[];
    tpr_mri: number[];
    tpr_multimodal: number[];
  };
}

export interface ModelComparisonRow {
  model: string;
  modality: string;
  accuracy: number;
  f1: number;
  auc: number;
  status: string;
}

export interface ModelComparisonResponse {
  status: string;
  eeg_models: ModelComparisonRow[];
  mri_models: ModelComparisonRow[];
  multimodal_models: ModelComparisonRow[];
}

export interface ComputationalIndicator {
  id: string;
  name: string;
  modality?: 'EEG' | 'MRI' | string;
  channel_or_region: string;
  patient_value: number;
  normative_mean: number;
  normative_std: number;
  z_score: number;
  unit: string;
  status?: string;
  direction: string;
  contribution_pct: number;
  clinical_significance: string;
}

export interface SeverityResponse {
  status: string;
  available: boolean;
  sample_id?: string;
  analysis_timestamp?: string;
  model_output?: string;
  model_confidence?: number;
  composite_divergence_z?: number;
  severity_category?: string;
  severity_tier?: string;
  tier_color?: string;
  clinical_interpretation?: string;
  indicators?: ComputationalIndicator[];
  cross_modal_agreement_pct?: number;
  scientific_disclaimer?: string;
  message?: string;
  scientific_rationale?: string;
}

export interface ReportObject {
  title: string;
  timestamp: string;
  subject_id: string;
  input_modalities: string[];
  eeg_analysis: {
    preprocessing: string;
    model_prediction: string;
    confidence: number;
    key_biomarkers: string[];
  };
  mri_analysis: {
    preprocessing: string;
    model_prediction: string;
    confidence: number;
    key_biomarkers: string[];
  };
  multimodal_fusion: {
    strategy: string;
    final_prediction: string;
    confidence: number;
    synergy_gain: string;
  };
  explainable_ai: {
    top_eeg_channels: string[];
    top_imaging_regions: string[];
    attribution_standard: string;
  };
  severity_status?: string;
  computational_severity?: {
    protocol_tier: string;
    theta_alpha_ratio: string;
    ventricle_ratio: string;
    cross_modal_concordance: string;
  };
  model_provenance: {
    eeg_model: string;
    mri_model: string;
    multimodal_benchmark: string;
  };
  diagnostic_conclusion?: {
    has_schizophrenia: boolean;
    verdict: string;
    verdict_badge: string;
    verdict_color: string;
    confidence_pct: number;
    clinical_summary: string;
    recommendation?: string;
  };
  limitations: string[];
  research_disclaimer: string;
}

// ------------------------------------------------------------------------------
// ROLE-BASED SYSTEM TYPES (STRICTLY DOCTOR & DEVELOPER / RESEARCHER)
// ------------------------------------------------------------------------------

export type UserRole = 'doctor' | 'developer';
export type ApprovalStatus = 'Pending Verification' | 'Approved' | 'Rejected';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  approval_status?: ApprovalStatus;
  sex?: string;
  hospital_name?: string;
  hospital_address?: string;
  license_number?: string;
  license_filename?: string;
  registration_date?: string;
  title: string;
  department: string;
  institution: string;
  permissions: string[];
}

export interface DoctorRegistrationData {
  name: string;
  sex: 'Female' | 'Male' | 'Non-Binary' | 'Other' | 'Prefer not to say';
  hospital_name: string;
  hospital_address: string;
  license_number: string;
  license_document: File | null;
  email: string;
  password: string;
  confirm_password: string;
}

export interface DoctorRegistrationRecord {
  id: string;
  name: string;
  sex: string;
  email: string;
  hospital_name: string;
  hospital_address: string;
  license_number: string;
  license_filename: string;
  has_license_document: boolean;
  approval_status: ApprovalStatus;
  registration_date: string;
  status_updated_at?: string;
  status_reviewer?: string;
  status_notes?: string;
  rejection_reason?: string;
  approval_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface AnalysisSession {
  analysis_id: string;
  subject_id: string;
  timestamp: string;
  modalities: {
    eeg: boolean;
    mri: boolean;
    fmri: boolean;
    ct: boolean;
  };
  status: 'Completed' | 'Processing' | 'Awaiting Data';
  model_version: string;
  prediction?: string;
  confidence?: number;
  report_generated: boolean;
}

export interface AuthResponse {
  status: string;
  token: string;
  user: UserProfile;
  session_expires_in: number;
}

export interface DoctorPatient {
  id: string;
  subject_id: string;
  dataset: string;
  age: number;
  sex: string;
  modalities: {
    eeg: boolean;
    mri: boolean;
    fmri: boolean;
    ct: boolean;
  };
  eeg_path?: string | null;
  mri_path?: string | null;
  analysis_status: string;
  diagnostic_class: string;
  last_analysis: string;
  model_version: string;
  report_status: string;
}

export interface DoctorPatientsResponse {
  status: string;
  total_count: number;
  analyzed_count: number;
  pending_count: number;
  patients: DoctorPatient[];
}

export interface DoctorPatientDetail {
  id: string;
  subject_id: string;
  clinical_cohort: string;
  age: number;
  sex: string;
  admission_notes: string;
  data_modalities: {
    eeg: {
      available: boolean;
      channels: number;
      system: string;
      sampling_rate: string;
      recording_duration: string;
      impedance_check: string;
    };
    mri: {
      available: boolean;
      sequence: string;
      dimensions: string;
      field_strength: string;
      snr_db: number;
      atlas_mapped_rois: number;
    };
    fmri: {
      available: boolean;
      reason?: string;
    };
    ct: {
      available: boolean;
      reason?: string;
    };
  };
  latest_analysis: {
    timestamp: string;
    model_version: string;
    eeg_prediction: string;
    eeg_confidence: number;
    mri_prediction: string;
    mri_confidence: number;
    fusion_prediction: string;
    fusion_confidence: number;
    severity_indicator: {
      status: string;
      notice: string;
    };
  };
}

export interface DeveloperModel {
  id: string;
  name: string;
  modality: string;
  version: string;
  checkpoint_file: string;
  architecture: string;
  feature_dim: number;
  status: string;
  training_dataset: string;
  mean_cv_accuracy: number;
  peak_accuracy: number;
  mean_auc: number;
  mean_f1: number;
  inference_latency_ms: number;
  file_size_bytes: number;
  file_size_formatted: string;
  checkpoint_exists: boolean;
}

export interface DeveloperExperiment {
  id: string;
  title: string;
  modality: string;
  model_version: string;
  date: string;
  author: string;
  hyperparameters: Record<string, any>;
  validation_results: {
    mean_accuracy: number;
    std_accuracy: number;
    mean_f1: number;
    mean_auc: number;
    peak_fold?: string;
    peak_accuracy?: number;
  };
  status: string;
  notes: string;
}

export interface DeveloperDataset {
  name: string;
  accession: string;
  modality: string;
  sample_count: number;
  class_distribution: Record<string, number>;
  qc_passed: number;
  qc_pass_rate: string;
  sampling_frequency?: string;
  dimensions?: string;
  preprocessing_status: string;
}

export interface DeveloperDatasetsResponse {
  status: string;
  cohort_summary: {
    total_enrolled: number;
    total_qc_passed: number;
    eeg_total: number;
    mri_total: number;
    multimodal_paired: number;
  };
  datasets: DeveloperDataset[];
}

export interface DeveloperErrorAnalysisResponse {
  status: string;
  eeg_errors: {
    false_positives: number;
    false_negatives: number;
    fp_rate: number;
    fn_rate: number;
    primary_causes: Array<{ cause: string; samples_affected: number; percentage: string }>;
    misclassified_samples: Array<{ id: string; true_class: string; predicted_class: string; model_prob: number; cause: string }>;
  };
  mri_errors: {
    false_positives: number;
    false_negatives: number;
    fp_rate: number;
    fn_rate: number;
    primary_causes: Array<{ cause: string; samples_affected: number; percentage: string }>;
    misclassified_samples: Array<{ id: string; true_class: string; predicted_class: string; model_prob: number; cause: string }>;
  };
  multimodal_error_resolution: {
    resolved_by_fusion: string;
    remaining_discrepancies: number;
    net_accuracy_advantage: string;
  };
}
