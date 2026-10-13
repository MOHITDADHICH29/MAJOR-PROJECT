import axios from 'axios';
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
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

export const apiService = {
  async getStatus(): Promise<SystemStatusResponse> {
    const res = await api.get<SystemStatusResponse>('/status');
    return res.data;
  },

  async getSamples(): Promise<DatasetSample[]> {
    const res = await api.get<{ samples: DatasetSample[] }>('/dataset/samples');
    return res.data.samples;
  },

  async analyzeEEG(presetPath?: string, file?: File): Promise<EEGAnalysisResult> {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<EEGAnalysisResult>('/analyze/eeg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } else {
      const res = await api.post<EEGAnalysisResult>('/analyze/eeg', { preset_path: presetPath });
      return res.data;
    }
  },

  async analyzeMRI(presetPath?: string, file?: File): Promise<MRIAnalysisResult> {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<MRIAnalysisResult>('/analyze/mri', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } else {
      const res = await api.post<MRIAnalysisResult>('/analyze/mri', { preset_path: presetPath });
      return res.data;
    }
  },

  async analyzeMultimodal(eegResult: EEGAnalysisResult, mriResult: MRIAnalysisResult): Promise<MultimodalAnalysisResult> {
    const res = await api.post<MultimodalAnalysisResult>('/analyze/multimodal', {
      eeg_result: eegResult,
      mri_result: mriResult
    });
    return res.data;
  },

  async getConnectivity(): Promise<ConnectivityMatrixResponse> {
    const res = await api.get<ConnectivityMatrixResponse>('/connectivity');
    return res.data;
  },

  async getExplainability(): Promise<ExplainabilityData> {
    const res = await api.get<ExplainabilityData>('/explainability');
    return res.data;
  },

  async getEvaluation(): Promise<EvaluationResponse> {
    const res = await api.get<EvaluationResponse>('/evaluation');
    return res.data;
  },

  async getComparison(): Promise<ModelComparisonResponse> {
    const res = await api.get<ModelComparisonResponse>('/comparison');
    return res.data;
  },

  async getSeverity(): Promise<SeverityResponse> {
    const res = await api.get<SeverityResponse>('/severity');
    return res.data;
  },

  async generateReport(sampleId: string, eegAnalysis?: any, mriAnalysis?: any, fusionAnalysis?: any): Promise<ReportObject> {
    const res = await api.post<{ status: string; report: ReportObject }>('/report/generate', {
      sample_id: sampleId,
      eeg_analysis: eegAnalysis,
      mri_analysis: mriAnalysis,
      fusion_analysis: fusionAnalysis
    });
    return res.data.report;
  },

  // Role Authentication & Doctor Registration
  async registerDoctor(formData: FormData) {
    const res = await api.post('/auth/register-doctor', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async login(role: string, email?: string, password?: string) {
    const res = await api.post('/auth/login', { role, email, password });
    if (res.data?.token) {
      localStorage.setItem('neuro_token', res.data.token);
      localStorage.setItem('neuro_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getCurrentUser() {
    const token = localStorage.getItem('neuro_token');
    if (!token) return null;
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.user;
    } catch {
      localStorage.removeItem('neuro_token');
      localStorage.removeItem('neuro_user');
      return null;
    }
  },

  async logout() {
    const token = localStorage.getItem('neuro_token');
    try {
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      localStorage.removeItem('neuro_token');
      localStorage.removeItem('neuro_user');
    }
  },

  // Administrative Review System
  async getDoctorRegistrations() {
    const token = localStorage.getItem('neuro_token');
    const res = await api.get('/admin/doctor-registrations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data?.registrations || [];
  },

  async reviewDoctorRegistration(doctorId: string, status: 'Approved' | 'Rejected', notes?: string) {
    const token = localStorage.getItem('neuro_token');
    const res = await api.post(`/admin/doctor-registrations/${doctorId}/review`, { status, notes }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data;
  },

  getLicenseDocumentUrl(filename: string) {
    const token = localStorage.getItem('neuro_token') || '';
    return `/api/admin/license-document/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
  },

  // Doctor Analysis Workspace
  async getDoctorHistory() {
    const res = await api.get('/doctor/history');
    return res.data?.sessions || [];
  },

  async getDoctorAnalysisDetail(analysisId: string) {
    const res = await api.get(`/doctor/analysis/${analysisId}`);
    return res.data?.patient;
  },

  // Developer Research Laboratory
  async getDeveloperModels() {
    const res = await api.get('/developer/models');
    return res.data.models;
  },

  async getDeveloperExperiments() {
    const res = await api.get('/developer/experiments');
    return res.data.experiments;
  },

  async getDeveloperDatasets() {
    const res = await api.get('/developer/datasets');
    return res.data;
  },

  async getDeveloperErrorAnalysis() {
    const res = await api.get('/developer/error-analysis');
    return res.data;
  }
};
