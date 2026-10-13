import React, { useState, Suspense, lazy } from 'react';
import {
  Brain,
  Activity,
  Layers,
  Share2,
  ChevronDown,
  ArrowRight,
  Stethoscope,
  Terminal,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Database,
  BarChart2,
  FileText,
  Sliders,
  Download,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Send,
  ExternalLink
} from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EEGViewer } from '../components/eeg/EEGViewer';
import { NeuroimagingViewer } from '../components/imaging/NeuroimagingViewer';
import { MultimodalFusion } from '../components/fusion/MultimodalFusion';
import { ResearchPipeline } from '../components/pipeline/ResearchPipeline';
import { UserRole } from '../types';
import { VerticalBars, SectionHeader, Card, StatCard, Badge, Button, UnderlineInput } from '../components/ui';

// Lazy-load Three.js components
const HumanBody3D = lazy(() =>
  import('../components/3d/HumanBody3D').then(m => ({ default: m.HumanBody3D }))
);
const HumanToBrainTransition = lazy(() =>
  import('../components/3d/HumanToBrainTransition').then(m => ({ default: m.HumanToBrainTransition }))
);
const DigitalBrain = lazy(() =>
  import('../components/3d/DigitalBrain').then(m => ({ default: m.DigitalBrain }))
);

const ThreeJsFallback = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[320px] text-muted">
    <Activity className="w-8 h-8 animate-pulse text-forest" />
    <span className="text-xs font-mono text-muted">{label}</span>
  </div>
);

interface LandingPageViewProps {
  onEnterRole: (role: UserRole) => void;
  onExploreWorkspace: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterRole,
  onExploreWorkspace
}) => {
  const [activeEegChannel, setActiveEegChannel] = useState<string>('F3');
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [activeOfferingIndex, setActiveOfferingIndex] = useState(0);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const researchScopes = [
    {
      scope: 'MULTIMODAL METHODOLOGY',
      statement: 'Building a Multimodal Framework for Neuroscience Research',
      paragraph: 'NeuroFusion AI explores the integration of electrophysiological signals and neuroimaging-derived features through machine-learning models. Its research workflow focuses on multimodal analysis, model evaluation, and interpretable presentation of computational results.',
      attribution: 'NeuroFusion AI Research Platform',
      context: 'Research-Oriented Framework • Computational Neuroscience',
      info: 'Research-oriented framework • EEG and neuroimaging • Model evaluation and explainability'
    },
    {
      scope: 'ELECTROPHYSIOLOGICAL DYNAMICS',
      statement: 'Machine-Invariant Resting-State EEG Frequency Modeling',
      paragraph: 'Investigating spectral band power distribution, frontal theta/alpha slowing ratios, and inter-hemispheric coherence patterns using standardized 10-20 electrode coordinate coregistration to evaluate reproducible temporal features.',
      attribution: 'NeuroFusion AI Research Platform',
      context: 'Signal Processing & Frequency Domain Analysis',
      info: '10-20 electrode system • Relative band power PSD • Machine-invariant spectral features'
    },
    {
      scope: 'STRUCTURAL MORPHOMETRY',
      statement: '3D Anatomical Atlas Parcellation & Ventricular Saliency',
      paragraph: 'Evaluating volumetric morphometry through 111-ROI Harvard-Oxford and AAL atlas parcellation, quantifying lateral ventricular expansion (VBR) and cortical thickness patterns in standardized MNI-152 space.',
      attribution: 'NeuroFusion AI Research Platform',
      context: 'Volumetric Morphometry & Atlas Coregistration',
      info: 'MNI-152 coordinate space • 111-ROI anatomical atlas • High-resolution morphometric analysis'
    }
  ];

  const offerings = [
    {
      title: '16-Channel 10-20 EEG Analysis',
      desc: 'Machine-invariant relative band power, theta/alpha slowing ratios, and hemispheric asymmetry computations.',
      badge: 'Electrophysiology',
      metric: '77.43% 5-CV',
      icon: Activity
    },
    {
      title: '3D Anatomical Atlas Parcellation',
      desc: '111-ROI volumetric morphometry focusing on DLPFC, ACC, STG, and Ventricle-to-Brain Ratio expansion.',
      badge: 'Structural MRI',
      metric: '72.58% 5-CV',
      icon: Brain
    },
    {
      title: 'Synergistic Decision Fusion',
      desc: 'Cross-modal confidence routing balancing physiological microstate signals with structural neuropil atrophy.',
      badge: 'Multimodal AI',
      metric: '82.02% Combined',
      icon: Layers
    },
    {
      title: 'Local & Global Explainability',
      desc: 'SHAP biomarker importance ranking revealing top electrophysiological and morphological indicators.',
      badge: 'Explainable AI',
      metric: 'Verified Saliency',
      icon: Sparkles
    },
    {
      title: 'PANSS-Aligned Severity Profiling',
      desc: 'Cognitive, negative, and positive symptom divergence estimation mapped to functional connectivity.',
      badge: 'Clinical Stratification',
      metric: 'Multi-Axis Score',
      icon: Sliders
    },
    {
      title: 'Automated Research Reporting',
      desc: 'Print-ready and archival clinical summaries with biomarker attribution and validation sign-offs.',
      badge: 'Documentation',
      metric: 'PDF & Print Export',
      icon: FileText
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 text-body font-sans selection:bg-panel-dark selection:text-forest">
      {/* =========================================================================
          01: HERO SECTION
          Left = Serif headline, one sentence, "Explore Now" pill, small overlapping thumbnail
          Right = Tall pale-mint panel with live 3D brain, soft light texture, lime glow
         ========================================================================= */}
      <section id="hero" className="relative pt-6 sm:pt-10 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-panel-light border border-border text-forest text-xs font-mono tracking-wide">
              <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
              <span>NEUROFUSION AI &bull; MULTIMODAL NEUROSCIENCE</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-forest tracking-tight font-medium leading-[1.08]">
                Decoding the Signals of the Schizophrenic Brain
              </h1>
              <div className="flex items-center gap-2 pt-1">
                <VerticalBars />
                <span className="text-xs font-mono uppercase tracking-widest text-muted font-semibold">
                  Multimodal EEG &amp; 3D Neuroimaging Platform
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-body-light font-sans leading-relaxed max-w-xl">
              An evidence-based computational framework uniting machine-invariant electrophysiological biomarkers, 3D anatomical atlas parcellation, and synergistic cross-modal decision fusion to detect schizophrenia with verified empirical precision.
            </p>

            {/* Pill CTA Button & Secondary Navigation */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onExploreWorkspace}
                className="shadow-sm"
              >
                <span>Explore Now</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => scrollToSection('benefits')}
              >
                <span>View Research Evidence</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Small Overlapping Multimodal Thumbnail Card */}
            <div className="pt-4 max-w-md">
              <div className="p-3.5 rounded-panel bg-white border border-border flex items-center gap-4 shadow-card">
                <div className="w-12 h-12 rounded-card bg-panel-light flex items-center justify-center text-forest flex-shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-forest">Cross-Modal Harmonization</span>
                    <span className="text-[11px] font-mono text-healthy font-semibold">82.02% CV</span>
                  </div>
                  <p className="text-[11px] text-muted truncate mt-0.5 font-sans">
                    16-channel EEG slowing + 111-ROI volumetric atlas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tall Pale-Mint Panel with Live 3D Brain */}
          <div className="lg:col-span-5 relative w-full aspect-[4/5] min-h-[480px] max-h-[620px] rounded-panel bg-panel-light border border-border overflow-hidden shadow-card flex flex-col justify-between p-4">
            {/* Subtle soft texture badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-border text-[11px] font-mono text-forest backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-lime shadow-lime-glow" />
              <span>LIVE WEBGL CORTEX</span>
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-border text-[11px] font-mono text-muted backdrop-blur-sm">
              <span>F3 ACTIVE</span>
            </div>

            {/* 3D Brain Mesh Canvas */}
            <div className="w-full h-full">
              <ErrorBoundary componentName="3D Brain" fallback={<ThreeJsFallback label="3D Cortex Model" />}>
                <Suspense fallback={<ThreeJsFallback label="Loading Neuroanatomy Mesh…" />}>
                  <DigitalBrain
                    selectedChannel={activeEegChannel}
                    onSelectChannel={setActiveEegChannel}
                    className="border-none bg-transparent shadow-none p-0 h-full"
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02: BENEFITS SECTION
          3 staggered stat cards (82.02% mean CV accuracy, 0.8958 ROC-AUC, 201 QC-passed subjects)
         ========================================================================= */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 space-y-8">
        <SectionHeader
          eyebrow="Clinical & Statistical Validation"
          title="Verified Empirical Benchmarks"
          subtitle="Trained and rigorously evaluated across standardized multi-site cohorts adhering to 5-fold stratified cross-validation."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Stat Card 1: Accuracy */}
          <div className="transform md:translate-y-0">
            <StatCard
              label="Multimodal Decision Fusion"
              value="82.02%"
              sublabel="5-Fold Stratified Cross-Validation"
              trend="89.50% Peak Fold"
              variant="alt"
              className="h-full bg-panel shadow-sm"
            />
          </div>

          {/* Stat Card 2: ROC-AUC (Staggered slightly) */}
          <div className="transform md:translate-y-3">
            <StatCard
              label="Discrimination Index"
              value="0.8958"
              sublabel="Mean Area Under Receiver Curve"
              trend="F1: 0.8401"
              variant="mint"
              className="h-full bg-panel-light shadow-sm"
            />
          </div>

          {/* Stat Card 3: Standardized Cohort */}
          <div className="transform md:translate-y-6">
            <StatCard
              label="Quality-Controlled Cohort"
              value="201"
              sublabel="Multi-Site Subjects Enrolled"
              trend="25 Excluded (QC)"
              variant="white"
              className="h-full bg-white shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          03: CORE OFFERINGS
          Serif heading, mint band, card carousel (EEG, 3D MRI, Fusion AI, Explainability, Severity, Reports)
         ========================================================================= */}
      <section id="services" className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Integrated Diagnostic Tools"
            title="Core Clinical & Research Offerings"
            subtitle="Six interconnected diagnostic layers designed to eliminate ambiguity in psychiatric evaluation."
          />
          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveOfferingIndex(prev => Math.max(0, prev - 1))}
              disabled={activeOfferingIndex === 0}
              className="p-2 rounded-full border border-border bg-white text-forest hover:bg-panel-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous offering"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveOfferingIndex(prev => Math.min(offerings.length - 3, prev + 1))}
              disabled={activeOfferingIndex >= offerings.length - 3}
              className="p-2 rounded-full border border-border bg-white text-forest hover:bg-panel-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next offering"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mint Gradient Band Background */}
        <div className="p-1 rounded-panel bg-mint-band">
          <div className="p-6 sm:p-8 bg-page rounded-[5px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.slice(activeOfferingIndex, activeOfferingIndex + 3).map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={idx}
                  variant="white"
                  hoverable
                  className="flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-panel-light flex items-center justify-center text-forest">
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="mint">{item.badge}</Badge>
                    </div>
                    <h3 className="text-xl font-serif font-semibold text-forest">
                      {item.title}
                    </h3>
                    <p className="text-xs text-body-light leading-relaxed font-sans">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                    <span className="text-muted">Metric:</span>
                    <span className="text-forest font-semibold">{item.metric}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          04: KEY FEATURES / LIVE DEMOS
          Centered heading + bars divider, alternating blocks hosting 16-ch EEG, tri-planar MRI, fusion simulator
         ========================================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <SectionHeader
            align="center"
            eyebrow="Interactive Medical Suite"
            title="Key Diagnostic Workstations"
            subtitle="Explore high-resolution electrophysiological waveforms, tri-planar volumetric slices, and confidence-calibrated decision fusion."
          />
        </div>

        {/* Demo 1: 16-Channel EEG Viewer */}
        <div id="demos" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Workstation 01</span>
              <h3 className="text-2xl font-serif text-forest font-semibold">16-Channel Electrophysiology Spectrum</h3>
            </div>
            <Badge variant="healthy">0.5 - 45 Hz Bandpassed</Badge>
          </div>
          <div className="rounded-panel bg-white border border-border p-4 shadow-card">
            <EEGViewer
              selectedChannel={activeEegChannel}
              onSelectChannel={setActiveEegChannel}
            />
          </div>
        </div>

        {/* Demo 2: Tri-Planar MRI Slicer */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Workstation 02</span>
              <h3 className="text-2xl font-serif text-forest font-semibold">Tri-Planar Structural Neuroimaging Slicer</h3>
            </div>
            <Badge variant="mri">111 Anatomical Atlas ROIs</Badge>
          </div>
          <div className="rounded-panel bg-white border border-border p-4 shadow-card">
            <NeuroimagingViewer />
          </div>
        </div>

        {/* Demo 3: Multimodal Decision Fusion */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Workstation 03</span>
              <h3 className="text-2xl font-serif text-forest font-semibold">Synergistic Multimodal Decision Fusion</h3>
            </div>
            <Badge variant="forest">Confidence-Calibrated Soft Voting</Badge>
          </div>
          <div className="rounded-panel bg-white border border-border p-4 shadow-card">
            <MultimodalFusion />
          </div>
        </div>
      </section>

      {/* =========================================================================
          05: HUMAN TO BRAIN TRANSITION SECTION
          Full pale panel with 3D transition
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-panel bg-panel-light border border-border p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-muted">Micro-to-Macro Traversal</span>
              <h3 className="text-2xl sm:text-3xl font-serif text-forest font-semibold mt-1">
                From Whole-Body Coordinate Space to Cranial Saliency
              </h3>
            </div>
            <Badge variant="mint">WebGL Spatial Registration</Badge>
          </div>

          <div className="rounded-card bg-white border border-border overflow-hidden min-h-[440px]">
            <ErrorBoundary componentName="Human-to-Brain Transition" fallback={<ThreeJsFallback label="3D Traversal" />}>
              <Suspense fallback={<ThreeJsFallback label="Loading 3D Anatomy Traversal…" />}>
                <HumanToBrainTransition />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06: RESULTS & BENCHMARK BARS
          EEG 77.43% / MRI 72.58% / Fusion 82.02% as muted green bars
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <SectionHeader
          eyebrow="Cross-Validation Metrics"
          title="Comparative Modality Accuracy"
          subtitle="Empirical proof demonstrating that multimodal decision fusion consistently outperforms single-modality baselines."
        />

        <div className="p-6 sm:p-8 rounded-panel bg-white border border-border shadow-card space-y-6">
          {/* Fusion Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-forest">Multimodal Fusion (EEG + MRI)</span>
              <span className="text-forest font-bold text-sm">82.02% (Peak: 89.50%)</span>
            </div>
            <div className="w-full h-4 bg-panel-light rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-forest rounded-full transition-all duration-1000 ease-out"
                style={{ width: '82.02%' }}
              />
            </div>
            <span className="text-[11px] text-muted font-sans">
              Dynamic authority delegation prevents noisy MRI scans from corrupting high-certainty EEG predictions.
            </span>
          </div>

          {/* EEG Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-body">EEG-Only Pipeline</span>
              <span className="text-body font-bold text-sm">77.43% (Peak: 84.00%)</span>
            </div>
            <div className="w-full h-4 bg-panel-light rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-healthy rounded-full transition-all duration-1000 ease-out"
                style={{ width: '77.43%' }}
              />
            </div>
            <span className="text-[11px] text-muted font-sans">
              Machine-invariant relative band powers and theta/alpha frontal slowing indices.
            </span>
          </div>

          {/* MRI Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-body">MRI-Only Pipeline</span>
              <span className="text-body font-bold text-sm">72.58% (Peak: 81.20%)</span>
            </div>
            <div className="w-full h-4 bg-panel-light rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-mri rounded-full transition-all duration-1000 ease-out"
                style={{ width: '72.58%' }}
              />
            </div>
            <span className="text-[11px] text-muted font-sans">
              111-ROI volumetric parcellation + Ventricle-to-Brain Ratio expansion metrics.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          07: ROLE GATEWAY
          Two large panels (Doctor Workspace, Developer Console)
         ========================================================================= */}
      <section id="roles" className="max-w-6xl mx-auto px-4 space-y-8">
        <SectionHeader
          align="center"
          eyebrow="Segregated Professional Portals"
          title="Select Your Designated Workspace"
          subtitle="NeuroFusion AI cleanly isolates clinical diagnostic workflows from developer model training pipelines."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Doctor Portal Card */}
          <Card
            variant="mint"
            className="p-8 flex flex-col justify-between space-y-6 hover:shadow-card-hover transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center text-forest">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-muted uppercase tracking-wider block">CLINICAL SUITE</span>
                <h3 className="text-2xl font-serif text-forest font-semibold mt-1">Doctor Workspace</h3>
                <span className="text-xs text-muted font-mono">Analysis-Centric Diagnostic Portal</span>
              </div>
              <p className="text-xs sm:text-sm text-body-light font-sans leading-relaxed">
                Review active patient cohorts, inspect interactive 10-20 EEG waveforms and tri-planar MRI slices, compute PANSS-aligned severity stratifications, and generate clinical research reports.
              </p>
              <ul className="text-xs font-sans text-body space-y-2 pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                  <span>Individual patient file upload &amp; automated validation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                  <span>3D anatomical brain maps &amp; atrophy localization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                  <span>Print-ready clinical research summaries with clinician sign-off</span>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onEnterRole('doctor')}
            >
              <span>Enter Doctor Workspace</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Card>

          {/* Developer / Researcher Card */}
          <Card
            variant="alt"
            className="p-8 flex flex-col justify-between space-y-6 hover:shadow-card-hover transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center text-forest">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-muted uppercase tracking-wider block">ENGINEERING LAB</span>
                <h3 className="text-2xl font-serif text-forest font-semibold mt-1">Developer Console</h3>
                <span className="text-xs text-muted font-mono">Model Research &amp; Benchmark Lab</span>
              </div>
              <p className="text-xs sm:text-sm text-body-light font-sans leading-relaxed">
                Inspect 226 multi-site subject manifests, examine 5-fold stratified cross-validation matrices, audit saved model checkpoint weights, analyze SHAP feature attributions, and diagnose misclassified outliers.
              </p>
              <ul className="text-xs font-sans text-body space-y-2 pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                  <span>Complete dataset manifest with QC exclusion filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                  <span>ROC-AUC curves, confusion matrices, and fold metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                  <span>Global SHAP feature importance &amp; model version control</span>
                </li>
              </ul>
            </div>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onEnterRole('developer')}
            >
              <span>Enter Developer Console</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          08: FOREST-GREEN RESEARCH SCOPE & VALIDATION SECTION
          Deep green (#557A74 / #1F4D45) for validation/research notes with slider, arrows, dots
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-panel bg-deep text-white p-8 sm:p-12 relative overflow-hidden shadow-card">
          <div className="max-w-3xl space-y-6 relative z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-panel-dark font-semibold">
              RESEARCH SCOPE &amp; VALIDATION
            </span>

            <h3 className="text-2xl sm:text-3xl font-serif font-normal leading-relaxed text-white">
              {researchScopes[activeStoryIndex].statement}
            </h3>

            <p className="text-sm sm:text-base font-sans leading-relaxed text-panel-light">
              {researchScopes[activeStoryIndex].paragraph}
            </p>

            <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-serif text-lg font-semibold text-white">
                  {researchScopes[activeStoryIndex].attribution}
                </div>
                <div className="text-xs font-sans text-panel-light">
                  {researchScopes[activeStoryIndex].context}
                </div>
                <div className="text-xs font-mono text-panel-dark mt-1">
                  {researchScopes[activeStoryIndex].info}
                </div>
              </div>

              {/* Slider Controls: Arrows & Dots */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveStoryIndex(prev => (prev === 0 ? researchScopes.length - 1 : prev - 1))}
                  className="p-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
                  aria-label="Previous research scope"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {researchScopes.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStoryIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeStoryIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setActiveStoryIndex(prev => (prev === researchScopes.length - 1 ? 0 : prev + 1))}
                  className="p-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
                  aria-label="Next research scope"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          09: COLLABORATION SECTION & INQUIRY FORM
          White card on mint panel, action buttons, underline inputs
         ========================================================================= */}
      <section id="about" className="max-w-4xl mx-auto px-4">
        <div className="rounded-panel bg-panel-light border border-border p-8 sm:p-12">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-muted">RESEARCH PARTNERSHIP</span>
              <h3 className="text-3xl font-serif text-forest font-semibold">
                Collaborate with NeuroFusion AI
              </h3>
              <p className="text-xs sm:text-sm text-body-light font-sans leading-relaxed">
                Explore research collaboration, academic projects, and responsible development of multimodal neuroscience analysis tools. Connect with the NeuroFusion AI project team to discuss research objectives, technical integration, and opportunities for further evaluation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('collaboration-form');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-mono text-xs shadow-sm"
                >
                  Discuss Research Collaboration
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('pipeline');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-mono text-xs"
                >
                  Explore the Research Framework
                </Button>
              </div>
            </div>

            {contactSubmitted ? (
              <div className="p-6 rounded-card bg-healthy-light border border-healthy/30 text-center space-y-2 animate-fade-in-up">
                <CheckCircle2 className="w-8 h-8 text-healthy mx-auto" />
                <h4 className="text-lg font-serif font-semibold text-forest">Thank you for your inquiry.</h4>
                <p className="text-xs font-sans text-body-light">
                  Our clinical research informatics team will review your message and reply within 24 hours.
                </p>
              </div>
            ) : (
              <form id="collaboration-form" onSubmit={handleContactSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-card border border-border shadow-card scroll-mt-24">
                <UnderlineInput
                  label="Investigator / Clinician Name"
                  placeholder="e.g. Dr. Arthur Miller, MD"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />

                <UnderlineInput
                  label="Institutional Email"
                  type="email"
                  placeholder="e.g. miller@neuro-institute.org"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-muted">
                    Clinical Research Focus / Message
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your dataset, research cohort, or collaboration inquiry..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="input-underline w-full text-sm font-sans resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  className="shadow-sm mt-4"
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  <span>Submit Research Inquiry</span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10: FOOTER
          Privacy Policy, Accessibility, "Research use only - not a medical device"
         ========================================================================= */}
      <footer className="max-w-7xl mx-auto px-4 pt-12 border-t border-border text-center space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-sans text-muted">
          <a href="#hero" className="hover:text-forest transition-colors">About Platform</a>
          <span>&bull;</span>
          <a href="#hero" className="hover:text-forest transition-colors">Privacy Policy</a>
          <span>&bull;</span>
          <a href="#hero" className="hover:text-forest transition-colors">Accessibility Standards (WCAG AA)</a>
          <span>&bull;</span>
          <a href="#hero" className="hover:text-forest transition-colors">Institutional Licensing</a>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-mono text-forest font-semibold">
            NEUROFUSION AI &bull; MULTIMODAL NEUROSCIENCE RESEARCH PLATFORM
          </p>
          <p className="text-[11px] text-muted font-sans max-w-xl mx-auto">
            Strictly intended for clinical research and academic neuroscience study. Not an autonomous diagnostic medical device. DSM-5 / ICD-11 psychiatric evaluation required for formal diagnosis.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageView;
