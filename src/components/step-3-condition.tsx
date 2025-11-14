import React from 'react';
import { AlertCircle, Droplets, CheckCircle, HelpCircle, LucideIcon } from 'lucide-react';
import type { StepProps } from '@/types';

interface ConditionOption {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const conditions: ConditionOption[] = [
  { id: 'cracks', label: 'Visible cracks or peeling', icon: AlertCircle, color: '#EF4444' },
  { id: 'moss', label: 'Presence of moss, moisture, or stains', icon: Droplets, color: '#3B82F6' },
  { id: 'good', label: 'Appears to be in good condition', icon: CheckCircle, color: '#10B981' },
  { id: 'unknown', label: "I don't know", icon: HelpCircle, color: '#6B7280' },
];

export const Step3Condition: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          What is the current condition of your facade?
        </h2>
        <p className="text-gray-600 text-center">
          This helps us identify potential repairs or prior treatments needed
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {conditions.map((cond) => {
          const Icon = cond.icon;
          const isSelected = formData.condition === cond.id;
          return (
            <button
              key={cond.id}
              onClick={() => onChange({ target: { name: 'condition', value: cond.id } } as React.ChangeEvent<HTMLInputElement>)}
              className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                isSelected
                  ? 'ring-2 ring-green-500 shadow-lg bg-white scale-[1.02]'
                  : 'bg-white shadow-md hover:shadow-lg border border-gray-200 hover:border-green-300'
              }`}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: cond.color }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="font-semibold text-gray-900 text-center text-sm">
                {cond.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
