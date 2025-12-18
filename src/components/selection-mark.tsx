import React from 'react';
import { Check } from 'lucide-react';

export interface SelectionMarkProps {
  isSelected: boolean;
}

export const SelectionMark: React.FC<SelectionMarkProps> = ({ isSelected }) => {
  if (!isSelected) return null;

  return (
    <div className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d4a574]/50 bg-white/90 text-[#c4955e] shadow-sm">
      <Check className="h-4 w-4" />
    </div>
  );
};

