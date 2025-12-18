import React from 'react';
import { Calendar } from 'lucide-react';
import type { StepProps, Timeline } from '@/types';
import { useI18n } from '@/i18n';
import { SelectionMark } from '@/components/selection-mark';
import { selectableCardClass } from '@/utils/selectable';

interface TimelineOption {
  id: Timeline;
}

const timelines: TimelineOption[] = [
  { id: 'asap' },
  { id: '1-3months' },
  { id: '>3months' },
  { id: 'tbd' },
];

export const Step8Timeline: React.FC<StepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-5 sm:mb-8">
        <h2 className="mb-3 text-center text-2xl font-bold text-gray-900">
          {t('steps.timeline.title')}
        </h2>
        <p className="text-center text-gray-600">{t('steps.timeline.subtitle')}</p>
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {timelines.map((timeline) => (
          <button
            key={timeline.id}
            type="button"
            onClick={() =>
              onChange({
                target: { name: 'timeline', value: timeline.id },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            className={selectableCardClass(
              formData.timeline === timeline.id,
              `flex items-center justify-center space-x-3 bg-white px-5 py-4 font-medium sm:px-6 sm:py-6 ${
                formData.timeline === timeline.id
                  ? 'text-[#2D2A26]'
                  : 'text-gray-700'
              }`
            )}
          >
            <SelectionMark isSelected={formData.timeline === timeline.id} />
            <Calendar className="h-5 w-5" />
            <span>{t(`steps.timeline.options.${timeline.id}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
