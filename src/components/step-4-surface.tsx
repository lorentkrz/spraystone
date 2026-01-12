import React, { useMemo, useState } from 'react';
import type { StepProps } from '@/types';
import { useI18n } from '@/i18n';
import { SelectionMark } from '@/components/selection-mark';
import { selectableCardClass, selectableSegmentClass } from '@/utils/selectable';

type TabType = 'exact' | 'estimate' | 'unknown';

interface RangeOption {
  label: string;
  value: string;
}

const inferActiveTab = (surfaceArea: string): TabType => {
  const sa = surfaceArea.trim();
  if (!sa) return 'exact';
  if (sa === 'unknown') return 'unknown';
  if (/^<50$|^\d+\s*-\s*\d+$|^>150$/.test(sa)) return 'estimate';
  return 'exact';
};

export const Step4Surface: React.FC<StepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<TabType>(() =>
    inferActiveTab(String(formData.surfaceArea || ''))
  );

  const rangeOptions: RangeOption[] = useMemo(
    () => [
      { label: t('steps.surface.estimate.options.lt50'), value: '<50' },
      { label: t('steps.surface.estimate.options.50to100'), value: '50-100' },
      { label: t('steps.surface.estimate.options.100to150'), value: '100-150' },
      { label: t('steps.surface.estimate.options.gt150'), value: '>150' },
    ],
    [t]
  );

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);

    if (tab === 'unknown') {
      onChange({
        target: { name: 'surfaceArea', value: 'unknown' },
      } as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    if (formData.surfaceArea === 'unknown') {
      onChange({
        target: { name: 'surfaceArea', value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleRangeSelect = (range: string): void => {
    onChange({
      target: { name: 'surfaceArea', value: range },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div>
      <div className="mb-5 text-center sm:mb-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {t('steps.surface.title')}
        </h2>
        <p className="text-gray-600">{t('steps.surface.subtitle')}</p>
      </div>

      <div className="mb-5 flex justify-center sm:mb-8">
        <div className="inline-flex rounded-full border border-[#eadfcb] bg-[#fdf8f2] p-1 shadow-sm">
          {(['exact', 'estimate', 'unknown'] as TabType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={selectableSegmentClass(
                activeTab === tab,
                'px-6 py-2 text-sm font-medium sm:px-8 sm:py-3'
              )}
            >
              {t(`steps.surface.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0">
        {activeTab === 'exact' && (
          <div className="mx-auto max-w-md">
            <label className="mb-3 block text-center font-medium text-gray-700">
              {t('steps.surface.exact.label')}
            </label>
            <div className="relative">
              <input
                type="number"
                name="surfaceArea"
                value={
                  formData.surfaceArea && !isNaN(Number(formData.surfaceArea))
                    ? formData.surfaceArea
                    : ''
                }
                onChange={(e) => {
                  setActiveTab(inferActiveTab(String(e.target.value || '')));
                  onChange(e);
                }}
                placeholder={t('steps.surface.exact.placeholder')}
                className="w-full rounded-xl border border-gray-300 px-5 py-3 text-lg text-gray-900 sm:px-6 sm:py-4"
                min={0}
              />
              <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                m²
              </span>
            </div>
          </div>
        )}

        {activeTab === 'estimate' && (
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4">
            {rangeOptions.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => handleRangeSelect(range.value)}
                className={selectableCardClass(
                  formData.surfaceArea === range.value,
                  `px-5 py-4 text-center text-sm font-semibold sm:px-6 sm:py-5 ${
                    formData.surfaceArea === range.value
                      ? 'text-[#2D2A26]'
                      : 'text-gray-700'
                  }`
                )}
              >
                <SelectionMark isSelected={formData.surfaceArea === range.value} />
                {range.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'unknown' && (
          <div className="py-8 text-center">
            <div className="mx-auto max-w-md rounded-2xl border border-[#d4a574]/40 bg-[#fdf8f2] p-8">
              <p className="mb-2 font-semibold text-[#2d2a26]">
                {t('steps.surface.unknown.title')}
              </p>
              <p className="text-sm text-[#6b5e4f]">
                {t('steps.surface.unknown.body')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-[#d4a574]/60 bg-[#fdf8f2] p-3 text-xs text-[#6b5e4f] sm:grid-cols-2">
        <div>
          <p className="font-semibold text-[#c4955e]">
            {t('steps.surface.tips.quickTitle')}
          </p>
          <p>{t('steps.surface.tips.quickBody')}</p>
        </div>
        <div>
          <p className="font-semibold text-[#c4955e]">
            {t('steps.surface.tips.helpTitle')}
          </p>
          <p>{t('steps.surface.tips.helpBody')}</p>
        </div>
      </div>
    </div>
  );
};
