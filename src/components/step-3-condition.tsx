import React from 'react';
import { AlertCircle, Droplets, CheckCircle, HelpCircle, LucideIcon } from 'lucide-react';
import type { StepProps } from '@/types';
import { useI18n } from '@/i18n';
import { SelectionMark } from '@/components/selection-mark';
import { selectableCardClass } from '@/utils/selectable';

interface ConditionOption {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const conditions: ConditionOption[] = [
  { id: 'cracks', label: 'steps.condition.options.cracks', icon: AlertCircle, color: '#EF4444' },
  { id: 'moss', label: 'steps.condition.options.moss', icon: Droplets, color: '#3B82F6' },
  { id: 'good', label: 'steps.condition.options.good', icon: CheckCircle, color: '#10B981' },
  { id: 'unknown', label: 'steps.condition.options.unknown', icon: HelpCircle, color: '#6B7280' },
];

export const Step3Condition: React.FC<StepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-5 sm:mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          {t('steps.condition.title')}
        </h2>
        <p className="text-gray-600 text-center">
          {t('steps.condition.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {conditions.map((cond) => {
          const Icon = cond.icon;
          const isSelected = formData.condition === cond.id;
          return (
            <button
              key={cond.id}
              type="button"
              onClick={() => onChange({ target: { name: 'condition', value: cond.id } } as React.ChangeEvent<HTMLInputElement>)}
              className={selectableCardClass(isSelected, 'group p-4 sm:p-6')}
            >
              <SelectionMark isSelected={isSelected} />
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: cond.color }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="font-semibold text-gray-900 text-center text-sm">
                {t(cond.label)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
