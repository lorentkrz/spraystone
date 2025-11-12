import React from 'react';

const finishCards = [
  {
    id: 'natural-stone',
    title: 'Natural stone appearance (Spraystone)',
    subtitle: 'Premium natural stone appearance',
    gradient: 'linear-gradient(135deg, #C19A6B 0%, #D2B48C 30%, #F5DEB3 60%, #DEB887 100%)',
    icon: '🪨'
  },
  {
    id: 'smooth',
    title: 'Smooth or textured render',
    subtitle: 'Clean, modern finish',
    gradient: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 50%, #D3D3D3 100%)',
    icon: '⬜'
  },
  {
    id: 'other',
    title: 'Other finish (to be discussed)',
    subtitle: 'Custom solution',
    gradient: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 50%, #9E9E9E 100%)',
    icon: '🛠️'
  },
  {
    id: 'suggest',
    title: "I don't know / Suggest a suitable finish",
    subtitle: 'Get expert recommendation',
    gradient: 'linear-gradient(135deg, #90CAF9 0%, #64B5F6 50%, #42A5F5 100%)',
    icon: '💡'
  }
];

const Step5Finish = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">What finish or look do you want to apply?</h2>
        <p className="text-gray-600 text-center">Choose the aesthetic that matches your vision.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {finishCards.map((card) => {
          const selected = formData.finish === card.id;
          return (
            <button
              key={card.id}
              onClick={() => onChange({ target: { name: 'finish', value: card.id } })}
              className={`group overflow-hidden rounded-2xl text-left bg-white transition-all ${
                selected ? 'ring-2 ring-green-500 shadow-xl' : 'border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="h-40 w-full flex items-center justify-center"
                style={{ background: card.gradient }}
              >
                <div className="text-6xl">{card.icon}</div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-gray-900">{card.title}</div>
                <div className="text-sm text-gray-600">{card.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step5Finish;
