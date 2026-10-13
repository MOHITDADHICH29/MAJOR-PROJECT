import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerProps {
  compact?: boolean;
}

export const ResearchDisclaimer: React.FC<DisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-card bg-warning-light border border-warning/30 text-xs text-body leading-relaxed shadow-sm">
      <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-warning block mb-0.5 font-sans">
          Clinical &amp; Medical Research Disclaimer
        </span>
        <p className="text-body-light text-[11px] font-sans">
          NeuroFusion AI is an investigational decision-support prototype. Model outputs represent computational estimates evaluated on OpenNeuro cohorts and do not constitute an autonomous medical diagnosis. DSM-5 / ICD-11 psychiatric evaluation is required for clinical care.
        </p>
      </div>
    </div>
  );
};
export default ResearchDisclaimer;
