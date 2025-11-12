import React, { useState } from 'react';

const Step4Surface = ({ formData, onChange }) => {
  const [activeTab, setActiveTab] = useState('exact');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'unknown') {
      onChange({ target: { name: 'surfaceArea', value: 'unknown' } });
    }
  };

  const handleRangeSelect = (range) => {
    onChange({ target: { name: 'surfaceArea', value: range } });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          What is the surface area to be treated?
        </h2>
        <p className="text-gray-600 text-center">
          This helps us refine the quote — accuracy depends on your knowledge
        </p>
      </div>

      {/* Tab Selection */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => handleTabChange('exact')}
            className={`px-8 py-3 rounded-full font-medium transition-all ${
              activeTab === 'exact'
                ? 'bg-white text-green-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exact value
          </button>
          <button
            onClick={() => handleTabChange('estimate')}
            className={`px-8 py-3 rounded-full font-medium transition-all ${
              activeTab === 'estimate'
                ? 'bg-white text-green-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Estimate
          </button>
          <button
            onClick={() => handleTabChange('unknown')}
            className={`px-8 py-3 rounded-full font-medium transition-all ${
              activeTab === 'unknown'
                ? 'bg-white text-green-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            I don't know
          </button>
        </div>
      </div>

      {/* Content based on tab */}
      <div className="min-h-[200px]">
        {activeTab === 'exact' && (
          <div className="max-w-md mx-auto">
            <label className="block text-gray-700 font-medium mb-3 text-center">
              Enter surface area in m²
            </label>
            <div className="relative">
              <input
                type="number"
                name="surfaceArea"
                value={formData.surfaceArea && !isNaN(formData.surfaceArea) ? formData.surfaceArea : ''}
                onChange={(e) => {
                  setActiveTab('exact');
                  onChange(e);
                }}
                placeholder="e.g., 96"
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 text-lg pr-16"
              />
              <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                m²
              </span>
            </div>
          </div>
        )}

        {activeTab === 'estimate' && (
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Less than 50m2', value: '<50' },
              { label: '50 - 100m2', value: '50-100' },
              { label: '100 - 150m2', value: '100-150' },
              { label: 'More than 150m2', value: '>150' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => handleRangeSelect(range.value)}
                className={`py-6 px-6 rounded-2xl font-medium transition-all ${
                  formData.surfaceArea === range.value
                    ? 'bg-white ring-2 ring-green-500 text-green-600 shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'unknown' && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-2xl p-8">
              <p className="text-blue-900 font-medium mb-2">No problem!</p>
              <p className="text-blue-700 text-sm">
                Our team will estimate the surface area during the on-site visit and provide an accurate quote.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4Surface;
