import React from 'react';
import { Droplets, Sparkles, X, HelpCircle } from 'lucide-react';

const options = [
  { id: 'water-repellent', title: 'Water-repellent protection', subtitle: 'Anti-moisture treatment for long-lasting protection', icon: Droplets, color: 'bg-blue-500' },
  { id: 'anti-stain', title: 'Anti-stain / Anti-pollution treatment', subtitle: "Keeps your facade clean and protected from stains", icon: Sparkles, color: 'bg-purple-500' },
  { id: 'none', title: 'No / Not necessary', subtitle: 'Skip additional treatments', icon: X, color: 'bg-gray-500' },
  { id: 'unknown', title: "I don't know yet", subtitle: 'Get expert advice on recommended treatments', icon: HelpCircle, color: 'bg-orange-500' },
];

const Step7Treatments = ({ formData, onTreatmentChange }) => {
  const isSelected = (id) => formData.treatments.includes(id);

  const handleClick = (id) => {
    if (id === 'none' || id === 'unknown') {
      // Clear selections for neutral choices
      if (formData.treatments.length > 0) {
        onTreatmentChange('__clear_all__');
      }
      return;
    }
    onTreatmentChange(id);
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Would you like to add a complementary treatment?</h2>
        <p className="text-gray-600">Select one or more treatments to enhance your facade's protection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = isSelected(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => handleClick(opt.id)}
              className={`flex items-center p-5 rounded-2xl text-left transition-all bg-white ${
                selected ? 'ring-2 ring-green-500 shadow-lg' : 'border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mr-4 ${opt.color}`}> 
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{opt.title}</div>
                <div className="text-sm text-gray-600">{opt.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step7Treatments;
