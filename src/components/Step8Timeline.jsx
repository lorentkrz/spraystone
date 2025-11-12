import React from 'react';
import { Calendar } from 'lucide-react';

const timelines = [
  { id: 'asap', label: 'As soon as possible' },
  { id: '1-3months', label: 'In 1 to 3 months' },
  { id: '>3months', label: 'In more than 3 months' },
  { id: 'tbd', label: 'To be determined' },
];

const Step6Timeline = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          What is your desired timeline for the work?
        </h2>
        <p className="text-gray-600 text-center">
          This helps us schedule your project effectively
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {timelines.map((timeline) => (
          <button
            key={timeline.id}
            onClick={() => onChange({ target: { name: 'timeline', value: timeline.id } })}
            className={`py-6 px-6 rounded-2xl font-medium transition-all flex items-center justify-center space-x-3 ${
              formData.timeline === timeline.id
                ? 'bg-white ring-2 ring-green-500 text-green-600 shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>{timeline.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step6Timeline;
