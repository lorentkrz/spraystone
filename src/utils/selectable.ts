type ClassValue = string | false | null | undefined;

const cx = (...values: ClassValue[]): string =>
  values.filter(Boolean).join(' ');

export const selectableCardClass = (selected: boolean, className?: string) =>
  cx(
    'relative rounded-2xl border-2 bg-white transition-all select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'active:scale-[0.99]',
    selected
      ? 'border-[#d4a574] bg-[#fffaf2] shadow-lg ring-4 ring-[#d4a574]/30'
      : 'border-[#eadfcb] hover:border-[#d4a574]/70 hover:shadow-md',
    className
  );

export const selectableSegmentClass = (selected: boolean, className?: string) =>
  cx(
    'rounded-full border border-transparent transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'active:scale-[0.99]',
    selected
      ? 'border-[#d4a574]/40 bg-white text-[#2D2A26] shadow'
      : 'text-[#6B5E4F] hover:bg-white/60',
    className
  );
