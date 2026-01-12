import React from 'react';
import { ElasticProgress } from '@/components/elastic-progress';
import { useI18n } from '@/i18n';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const { t } = useI18n();
  const safeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const progressPercent = totalSteps > 1 ? ((safeStep - 1) / (totalSteps - 1)) * 100 : 100;
  const completionPercent = Math.round((safeStep / totalSteps) * 100);

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
    </div>
  );
};
