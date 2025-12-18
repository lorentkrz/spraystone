import React from 'react';
import { Droplets, Sparkles, X, HelpCircle, type LucideIcon } from 'lucide-react';
import type { Step7TreatmentsProps, Treatment } from '@/types';
import { useI18n } from '@/i18n';
import { SelectionMark } from '@/components/selection-mark';
import { selectableCardClass } from '@/utils/selectable';

interface TreatmentOptionMeta {
  id: Treatment;
  icon: LucideIcon;
  color: string;
}

const options: TreatmentOptionMeta[] = [
  { id: 'water-repellent', icon: Droplets, color: 'bg-blue-500' },
  { id: 'anti-stain', icon: Sparkles, color: 'bg-purple-500' },
  { id: 'none', icon: X, color: 'bg-gray-500' },
  { id: 'unknown', icon: HelpCircle, color: 'bg-orange-500' },
];

export const Step7Treatments: React.FC<Step7TreatmentsProps> = ({
  formData,
  onTreatmentChange,
}) => {
  const { t } = useI18n();
  const isSelected = (id: Treatment): boolean => formData.treatments.includes(id);

  return (
    <div>
      <div className="mb-5 text-center sm:mb-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {t('steps.treatments.title')}
        </h2>
        <p className="text-gray-600">{t('steps.treatments.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = isSelected(opt.id);
          const title = t(`steps.treatments.options.${opt.id}.title`);
          const subtitle = t(`steps.treatments.options.${opt.id}.subtitle`);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTreatmentChange(opt.id)}
              className={selectableCardClass(
                selected,
                'flex items-center p-4 text-left sm:p-5'
              )}
            >
              <SelectionMark isSelected={selected} />
              <div
                className={`mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white ${opt.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{title}</div>
                <div className="line-clamp-2 text-sm text-gray-600">
                  {subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
