import React, { useState } from 'react';
import { HumanBody3D } from './HumanBody3D';
import { DigitalBrain } from './DigitalBrain';
import { ArrowDown, ArrowUp, Sparkles, Brain, User, ShieldCheck } from 'lucide-react';
import { Badge, Button, VerticalBars } from '../ui';

interface HumanToBrainTransitionProps {
  onEnterRoleGateway?: () => void;
  className?: string;
}

export const HumanToBrainTransition: React.FC<HumanToBrainTransitionProps> = ({
  onEnterRoleGateway,
  className = ''
}) => {
  const [transitionStage, setTransitionStage] = useState<'human' | 'nervous' | 'head' | 'brain'>('human');

  return (
    <div className={`space-y-6 font-sans text-body ${className}`}>
      {/* Stage Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-panel bg-white border border-border shadow-card">
        <div>
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
            CINEMATIC MULTISCALE ANATOMICAL TRAVERSAL
          </span>
          <h2 className="text-xl font-serif font-bold text-forest tracking-tight mt-1 flex items-center gap-2">
            <Brain className="w-5 h-5 text-forest" />
            Human Organism &rarr; Nervous System &rarr; Computational Brain
          </h2>
          <p className="text-xs text-body-light mt-1 font-sans">
            Seamlessly navigate from whole-body biological physiology into voxel-level neurocomputational analysis
          </p>
          <div className="mt-2">
            <VerticalBars bars={5} />
          </div>
        </div>

        {/* Transition Stages Switcher */}
        <div className="flex items-center gap-1 bg-panel-light p-1 rounded-full border border-border font-mono text-xs">
          {(['human', 'nervous', 'head', 'brain'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setTransitionStage(st)}
              className={`px-3 py-1.5 rounded-full capitalize transition-all ${
                transitionStage === st
                  ? 'bg-forest text-white font-bold shadow-sm'
                  : 'text-muted hover:text-forest'
              }`}
            >
              {st === 'human' && '1. Body'}
              {st === 'nervous' && '2. Spine & Nerves'}
              {st === 'head' && '3. Cranial Focus'}
              {st === 'brain' && '4. Digital Brain'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer Container */}
      <div className="relative w-full rounded-panel bg-page border border-border overflow-hidden min-h-[560px]">
        {transitionStage !== 'brain' ? (
          <div className="relative w-full h-[560px]">
            <HumanBody3D
              focusRegion={transitionStage === 'human' ? 'full' : transitionStage === 'nervous' ? 'spine' : 'head'}
              onTransitionToBrain={() => setTransitionStage('brain')}
              interactive={true}
            />

            {/* Stage Guidance Floater */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-card bg-white/95 border border-border shadow-card backdrop-blur-md">
              <div className="text-xs font-mono">
                <span className="text-forest font-bold block font-serif text-sm">
                  {transitionStage === 'human' && 'STAGE 01: MACROSCOPIC HUMAN PHYSIOLOGY'}
                  {transitionStage === 'nervous' && 'STAGE 02: CENTRAL & PERIPHERAL NERVOUS TRACTS'}
                  {transitionStage === 'head' && 'STAGE 03: CRANIAL CONVERGENCE & MNI-152 FRAME'}
                </span>
                <span className="text-body-light text-xs font-sans">
                  {transitionStage === 'human' && 'Orbital perspective of complete anatomical subject lattice.'}
                  {transitionStage === 'nervous' && 'Spinal cord ascending neural fiber tracts connecting to brainstem.'}
                  {transitionStage === 'head' && 'Cranial electrode placement matrix preparing for multi-planar parcellation.'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {transitionStage !== 'human' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTransitionStage(s => s === 'head' ? 'nervous' : 'human')}
                    className="font-mono text-xs"
                  >
                    <span>&larr; Previous</span>
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setTransitionStage(s => s === 'human' ? 'nervous' : s === 'nervous' ? 'head' : 'brain')}
                  className="font-mono text-xs shadow-sm"
                >
                  <span>{transitionStage === 'head' ? 'Enter 3D Brain' : 'Next Zoom &rarr;'}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <DigitalBrain />
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanToBrainTransition;
