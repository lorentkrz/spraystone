import React from 'react';
import { MapPin, Home, AlertCircle, Ruler, Paintbrush, Camera, Droplets, Calendar, User, Check } from 'lucide-react';

const stepConfig = [
  { id: 1, name: 'Address', icon: MapPin },
  { id: 2, name: 'Facade Type', icon: Home },
  { id: 3, name: 'Condition', icon: AlertCircle },
  { id: 4, name: 'Surface Area', icon: Ruler },
  { id: 5, name: 'Finish', icon: Paintbrush },
  { id: 6, name: 'Photo', icon: Camera },
  { id: 7, name: 'Treatments', icon: Droplets },
  { id: 8, name: 'Timeline', icon: Calendar },
  { id: 9, name: 'Contact', icon: User }
];

const StepIndicator = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-10">
      {/* Professional Stepper with Clean Animations */}
      <div className="relative px-4">
        {/* Background Line */}
        <div 
          className="absolute top-4 left-0 right-0 h-0.5"
          style={{ backgroundColor: '#E8DCC8' }}
        />
        
        {/* Progress Line - Animated */}
        <div 
          className="absolute top-4 left-0 h-0.5"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #D4A574 0%, #B8936A 100%)',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(212, 165, 116, 0.3)'
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between items-center">
          {stepConfig.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const StepIcon = step.icon;
            
            return (
              <div
                key={step.id}
                className="group relative flex flex-col items-center"
              >
                {/* Circle with Hover */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center relative z-10 cursor-pointer"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? '#D4A574' : '#FFFFFF',
                    border: isCompleted || isCurrent ? 'none' : '1.5px solid #D4A574',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isCurrent ? '0 2px 8px rgba(212, 165, 116, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  ) : (
                    <StepIcon 
                      className="w-4 h-4" 
                      style={{ 
                        color: isCurrent ? '#FFFFFF' : '#D4A574',
                        transition: 'color 0.3s ease'
                      }}
                      strokeWidth={2} 
                    />
                  )}
                </div>
                
                {/* Hover Tooltip - Useful */}
                <div 
                  className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    transform: 'translateX(-50%) translateY(4px)',
                  }}
                >
                  <div 
                    className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: '#2D2A26',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {step.name}
                  </div>
                </div>
                
                {/* Current Step Label */}
                {isCurrent && (
                  <div 
                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    style={{
                      animation: 'fadeInUp 0.3s ease-out'
                    }}
                  >
                    <div className="text-xs font-semibold" style={{ color: '#D4A574' }}>
                      {step.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
