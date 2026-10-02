import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerProps {
  compact?: boolean;
}

export const ResearchDisclaimer: React.FC<DisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/80 font-mono">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span>Research prototype only. Not intended for standalone clinical diagnosis or treatment guidance.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-dark-800 to-dark-800 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed shadow-sm">
      <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-amber-300 block mb-0.5">Clinical & Medical Research Disclaimer</span>
        <p className="text-slate-300 text-[11px]">
          NeuroFusion AI is a research prototype for multimodal neuroimaging analysis. Model outputs are intended for research and demonstration purposes and should not be interpreted as a clinical diagnosis. This platform does not provide medical treatment recommendations.
        </p>
      </div>
    </div>
  );
};
