import React from 'react';
import { MapPin, Home, AlertCircle, Ruler, Paintbrush, Camera, Droplets, Calendar, User, LucideIcon } from 'lucide-react';

interface StepConfig {
  id: number;
  name: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepConfig: StepConfig[] = [
  { id: 1, name: 'Address', icon: MapPin },
  { id: 2, name: 'Facade Type', icon: Home },
  { id: 3, name: 'Condition', icon: AlertCircle },
  { id: 4, name: 'Surface Area', icon: Ruler },
  { id: 5, name: 'Finish', icon: Paintbrush },
  { id: 6, name: 'Photo', icon: Camera },
  { id: 7, name: 'Treatments', icon: Droplets },
  { id: 8, name: 'Timeline', icon: Calendar },
  { id: 9, name: 'Contact', icon: User }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const safeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const progressPercent = totalSteps > 1 ? ((safeStep - 1) / (totalSteps - 1)) * 100 : 100;
  const completionPercent = Math.round((safeStep / totalSteps) * 100);

  const current = stepConfig.find((step) => step.id === safeStep);
  const prev = stepConfig.find((step) => step.id === safeStep - 1);
  const next = stepConfig.find((step) => step.id === safeStep + 1);

  return (
    <div className="mb-8 md:mb-10">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b59a7c] sm:text-xs">
        <span>
          Step {safeStep} / {totalSteps}
        </span>
        <span>{completionPercent}%</span>
      </div>

      <div className="mt-2">
        <div className="step-progress-rail relative h-1.5 w-full rounded-full">
          <div className="step-progress-fill absolute inset-y-0 left-0 rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[#8a7b6b] sm:text-xs">
        <span className="truncate">{prev?.name || 'Start'}</span>
        <span className="text-sm font-semibold text-[#2d2a26]">{current?.name}</span>
        <span className="truncate text-right">{next?.name || 'Finish'}</span>
      </div>
    </div>
  );
};
