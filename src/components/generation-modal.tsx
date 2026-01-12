import React, { useEffect } from 'react';
import { Loader2, Timer } from 'lucide-react';
import { useI18n } from '@/i18n';

interface GenerationModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  statusText?: string;
}

const formatCountdown = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  secondsRemaining,
  totalSeconds,
  statusText,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const safeTotal = Math.max(1, totalSeconds || 1);
  const safeRemaining = Math.min(Math.max(0, secondsRemaining), safeTotal);
  const progressPct = Math.round(((safeTotal - safeRemaining) / safeTotal) * 100);
  const countdown = formatCountdown(safeRemaining);
  const statusLabel = statusText || t('results.generationPopup.status');

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[min(92vw,520px)] rounded-3xl border border-[#eadfcb] bg-white px-6 py-6 text-[#2D2A26] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c4955e]">
            {t('results.generationPopup.title')}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a574]/40 bg-[#fff6ea] px-3 py-1 text-xs font-semibold text-[#7a5b3d]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c4955e]/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#c4955e]" />
            </span>
            <span>{statusLabel}</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-[#6B5E4F]">
          {t('results.generationPopup.body')}
        </p>

        <div className="mt-4 flex items-center justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4a574]/30" />
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#d4a574]/15" />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-[#c4955e]" />
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#eadfcb] bg-[#fdf8f2] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6B5E4F]">
              <Timer className="h-4 w-4 text-[#c4955e]" />
              {t('results.generationPopup.timerLabel')}
            </div>
            <div className="text-xl font-bold text-[#2D2A26]" aria-live="polite">
              {countdown}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#d4a574] transition-[width] duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
