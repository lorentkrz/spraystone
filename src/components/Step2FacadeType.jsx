import React from 'react';

const facadeTypes = [
  {
    id: 'brick',
    label: 'Brick',
    gradient: 'linear-gradient(135deg, #8B4513 0%, #CD853F 50%, #D2691E 100%)',
    icon: '🧱'
  },
  {
    id: 'render',
    label: 'Render / Plaster',
    gradient: 'linear-gradient(135deg, #E8D5B7 0%, #F5DEB3 50%, #DEB887 100%)',
    icon: '🏠'
  },
  {
    id: 'concrete',
    label: 'Concrete Block',
    gradient: 'linear-gradient(135deg, #708090 0%, #778899 50%, #696969 100%)',
    icon: '⬜'
  },
  {
    id: 'painted',
    label: 'Painted Facade',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
    icon: '🎨'
  },
  {
    id: 'other',
    label: 'Other (to be discussed)',
    gradient: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 50%, #9E9E9E 100%)',
    icon: '❓'
  }
];

const Step2FacadeType = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          What type of facade do you have?
        </h2>
        <p className="text-gray-600 text-center">
          Choose the option that best matches your current facade
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {facadeTypes.map((type) => {
          const isSelected = formData.facadeType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onChange({ target: { name: 'facadeType', value: type.id } })}
              className={`group relative overflow-hidden rounded-xl transition-all bg-white ${
                isSelected
                  ? 'ring-2 ring-green-500 shadow-lg scale-[1.02]'
                  : 'border border-gray-200 hover:border-green-300 hover:shadow-md'
              }`}
            >
              <div 
                className="h-28 w-full flex items-center justify-center"
                style={{ background: type.gradient }}
              >
                <div className="text-5xl">{type.icon}</div>
              </div>
              <div className="p-3 text-center">
                <span className="font-semibold text-gray-900 text-sm">{type.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step2FacadeType;
