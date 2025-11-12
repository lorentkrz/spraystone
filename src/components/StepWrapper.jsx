import React from 'react';

const StepWrapper = ({ children, currentStep }) => {
  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <div key={currentStep}>
        {children}
      </div>
    </div>
  );
};

export default StepWrapper;
