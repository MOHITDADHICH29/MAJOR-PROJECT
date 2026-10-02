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

export interface SeverityResponse {
  status: string;
  available: boolean;
  message: string;
  scientific_rationale: string;
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
  severity_status: string;
  model_provenance: {
    eeg_model: string;
    mri_model: string;
    multimodal_benchmark: string;
  };
  limitations: string[];
  research_disclaimer: string;
}
