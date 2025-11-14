import React from 'react';
import type { StepProps } from '@/types';

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
  brick: 'Visible joints, warm clay modules, textured relief.',
  render: 'Smooth mineral render over insulation layer.',
  concrete: 'Concrete blocks or prefab panels with grid joints.',
  painted: 'Painted facade or cladding with uniform coat.',
  other: 'Natural stone, wood, or a mixed-material envelope.'
};

const labels: Record<string, string> = {
  brick: 'Brick / masonry',
  render: 'Render / plaster',
  concrete: 'Concrete block',
  painted: 'Painted facade',
  other: 'Other or mixed'
};

export const Step2FacadeType: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">What type of facade do you have?</h2>
        <p className="text-gray-600">Select the base material that most closely matches your exterior.</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(200px,1fr)] gap-4 min-w-[min(520px,100%)]">
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
                className={`group flex min-h-[220px] flex-col overflow-hidden rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#d4a574] shadow-xl'
                    : 'border-gray-200 hover:border-[#d4a574]/70 hover:shadow-lg'
                }`}
              >
                <div className="flex h-32 items-center justify-center" style={textureStyle}>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700">
                    {labels[key]}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <p className="text-sm text-gray-600">{descriptions[key]}</p>
                  {isSelected && (
                    <span className="text-xs font-bold uppercase tracking-wide text-[#c4955e]">Selected</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
