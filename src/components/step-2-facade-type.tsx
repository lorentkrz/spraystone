import React from 'react';
import type { StepProps } from '@/types';
import { useI18n } from '@/i18n';
import { SelectionMark } from '@/components/selection-mark';
import { selectableCardClass } from '@/utils/selectable';

const textureStyles: Record<string, React.CSSProperties> = {
  brick: {
    backgroundColor: '#b45a3c',
    backgroundImage:
      'linear-gradient(#00000010 2px, transparent 2px), linear-gradient(90deg, #00000010 2px, transparent 2px)',
    backgroundSize: '28px 14px, 56px 28px',
    backgroundPosition: '0 0, 0 7px'
  },
  render: {
    backgroundColor: '#eee2cf',
    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.08) 100%)'
  },
  concrete: {
    backgroundColor: '#7b8790',
    backgroundImage:
      'linear-gradient(#ffffff0d 1px, transparent 1px), linear-gradient(90deg, #ffffff0d 1px, transparent 1px)',
    backgroundSize: '32px 32px',
    filter: 'grayscale(0.1)'
  },
  painted: {
    backgroundColor: '#ffd065',
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)'
  },
  other: {
    backgroundColor: '#dcd4cb',
    backgroundImage:
      'linear-gradient(135deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.35) 75%, transparent 75%, transparent)',
    backgroundSize: '18px 18px'
  }
};

const descriptions: Record<string, string> = {
  brick: 'steps.facadeType.options.brick.description',
  render: 'steps.facadeType.options.render.description',
  concrete: 'steps.facadeType.options.concrete.description',
  painted: 'steps.facadeType.options.painted.description',
  other: 'steps.facadeType.options.other.description'
};

const labels: Record<string, string> = {
  brick: 'steps.facadeType.options.brick.label',
  render: 'steps.facadeType.options.render.label',
  concrete: 'steps.facadeType.options.concrete.label',
  painted: 'steps.facadeType.options.painted.label',
  other: 'steps.facadeType.options.other.label'
};

export const Step2FacadeType: React.FC<StepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-5 text-center sm:mb-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">{t('steps.facadeType.title')}</h2>
        <p className="text-gray-600">{t('steps.facadeType.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(labels) as Array<keyof typeof labels>).map((key) => {
          const isSelected = formData.facadeType === key;
          const textureStyle = textureStyles[key] || {};
          return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  onChange({ target: { name: 'facadeType', value: key } } as React.ChangeEvent<HTMLInputElement>)
                }
                className={selectableCardClass(
                  isSelected,
                  'group flex min-h-[clamp(120px,18vh,220px)] flex-col overflow-hidden text-left'
                )}
              >
                <SelectionMark isSelected={isSelected} />
                <div
                  className="flex h-[clamp(56px,10vh,128px)] items-center justify-center"
                  style={textureStyle}
                >
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700">
                    {t(labels[key])}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                  <p className="line-clamp-2 text-sm text-gray-600">{t(descriptions[key])}</p>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
};
