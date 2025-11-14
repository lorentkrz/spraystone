import React from 'react';

interface StepWrapperProps {
  children: React.ReactNode;
  currentStep: number;
}

export const StepWrapper: React.FC<StepWrapperProps> = ({ children, currentStep }) => {
  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <div key={currentStep}>
        {children}
      </div>
    </div>
  );
};
