import React from 'react';
import { MapPin, Home, AlertCircle, Ruler, Paintbrush, Camera, Droplets, Calendar, User, LucideIcon } from 'lucide-react';
import { ElasticProgress } from '@/components/elastic-progress';
import { useI18n } from '@/i18n';

interface StepConfig {
  id: number;
  nameKey: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepConfig: StepConfig[] = [
  { id: 1, nameKey: 'steps.address.name', icon: MapPin },
  { id: 2, nameKey: 'steps.facadeType.name', icon: Home },
  { id: 3, nameKey: 'steps.condition.name', icon: AlertCircle },
  { id: 4, nameKey: 'steps.surface.name', icon: Ruler },
  { id: 5, nameKey: 'steps.finish.name', icon: Paintbrush },
  { id: 6, nameKey: 'steps.photo.name', icon: Camera },
  { id: 7, nameKey: 'steps.treatments.name', icon: Droplets },
  { id: 8, nameKey: 'steps.timeline.name', icon: Calendar },
  { id: 9, nameKey: 'steps.contact.name', icon: User }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const { t } = useI18n();
  const safeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const progressPercent = totalSteps > 1 ? ((safeStep - 1) / (totalSteps - 1)) * 100 : 100;
  const completionPercent = Math.round((safeStep / totalSteps) * 100);

  const current = stepConfig.find((step) => step.id === safeStep);
  const prev = stepConfig.find((step) => step.id === safeStep - 1);
  const next = stepConfig.find((step) => step.id === safeStep + 1);
  const currentName = current ? t(current.nameKey) : '';
  const prevName = prev ? t(prev.nameKey) : t('stepIndicator.start');
  const nextName = next ? t(next.nameKey) : t('stepIndicator.finish');
  const CurrentIcon = current?.icon;

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b59a7c] sm:text-xs">
        <span>{t('stepIndicator.step', { current: safeStep, total: totalSteps })}</span>
        <span>{completionPercent}%</span>
      </div>

      <div className="mt-2">
        <ElasticProgress
          value={progressPercent}
          displayValue={completionPercent}
          showValue={false}
        />
      </div>

      <div className="mt-2 grid grid-cols-[1fr,auto,1fr] items-center gap-2 text-[11px] text-[#8a7b6b] sm:text-xs">
        <span className="truncate">{prevName}</span>
        <span className="inline-flex max-w-[12rem] items-center gap-2 rounded-full border border-[#d4a574]/50 bg-[#fff7ec] px-3 py-1 text-xs font-semibold text-[#2d2a26] shadow-sm">
          {CurrentIcon ? <CurrentIcon className="h-4 w-4 text-[#c4955e]" /> : null}
          <span className="truncate">{currentName}</span>
        </span>
        <span className="truncate text-right">{nextName}</span>
      </div>
    </div>
  );
};
