import React, { useState } from 'react';
import type { StepProps } from '@/types';

type TabType = 'exact' | 'estimate' | 'unknown';

interface RangeOption {
  label: string;
  value: string;
}

export const Step4Surface: React.FC<StepProps> = ({ formData, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('exact');

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
    if (tab === 'unknown') {
      onChange({ target: { name: 'surfaceArea', value: 'unknown' } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleRangeSelect = (range: string): void => {
    onChange({ target: { name: 'surfaceArea', value: range } } as React.ChangeEvent<HTMLInputElement>);
  };

  const rangeOptions: RangeOption[] = [
    { label: 'Less than 50 m²', value: '<50' },
    { label: '50 – 100 m²', value: '50-100' },
    { label: '100 – 150 m²', value: '100-150' },
    { label: 'More than 150 m²', value: '>150' }
  ];

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">What is the surface area to be treated?</h2>
        <p className="text-gray-600">This helps us refine the quote — the more precise, the clearer the Spraystone plan.</p>
      </div>

      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          {(['exact', 'estimate', 'unknown'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-full px-8 py-3 text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white text-green-600 shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'exact' ? 'Exact value' : tab === 'estimate' ? 'Estimate' : "I don't know"}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[220px]">
        {activeTab === 'exact' && (
          <div className="mx-auto max-w-md">
            <label className="mb-3 block text-center font-medium text-gray-700">Enter surface area in m²</label>
            <div className="relative">
              <input
                type="number"
                name="surfaceArea"
                value={formData.surfaceArea && !isNaN(Number(formData.surfaceArea)) ? formData.surfaceArea : ''}
                onChange={(e) => {
                  setActiveTab('exact');
                  onChange(e);
                }}
                placeholder="e.g., 96"
                className="w-full rounded-xl border border-gray-300 px-6 py-4 text-lg text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500"
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
                onClick={() => handleRangeSelect(range.value)}
                className={`rounded-2xl border px-6 py-5 text-sm font-semibold transition-all ${
                  formData.surfaceArea === range.value
                    ? 'border-[#d4a574] bg-white text-[#c4955e] shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'unknown' && (
          <div className="py-12 text-center">
            <div className="mx-auto max-w-md rounded-2xl border border-blue-200 bg-blue-50 p-8">
              <p className="mb-2 font-semibold text-blue-900">No worries!</p>
              <p className="text-sm text-blue-700">
                Upload a clear facade photo and our team will approximate the area during the on-site visit.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-dashed border-[#d4a574]/60 bg-[#fdf8f2] p-4 text-sm text-[#6b5e4f] sm:grid-cols-2">
        <div>
          <p className="font-semibold text-[#c4955e]">Quick tip</p>
          <p>Measure width × height for each facade segment, subtract openings, then sum everything up.</p>
        </div>
        <div>
          <p className="font-semibold text-[#c4955e]">Need help?</p>
          <p>Choose “I don’t know” and we’ll bring laser measurement tools during the site visit.</p>
        </div>
      </div>
    </div>
  );
};

