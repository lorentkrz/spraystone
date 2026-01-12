import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Euro, Loader2 } from 'lucide-react';
import { ImageModal } from './image-modal';
import { useI18n } from '@/i18n';
import type { FormData } from '@/types';
import { LanguageSwitcher } from '@/components/language-switcher';

type FinishId = Exclude<FormData['finish'], ''>;

interface ResultsPageProps {
  formData: FormData;
  imagePreview: string | null;
  generatedImage: string | null;
  activeGeneratedFinish: FinishId | null;
  result: string;
  isImageGenerating: boolean;
  imageGenerationStatus?: string;
  onRestart: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseNumber = (s: string | number | null | undefined): number | null => {
  if (!s) return null;
  const digits = String(s).replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : null;
};

const roundToNearest = (value: number, step: number) =>
  Math.round(value / step) * step;

const parseSurfaceAreaAverage = (
  sa: string | number | null | undefined
): number | null => {
  if (sa === undefined || sa === null) return null;
  if (typeof sa === 'number') return sa;
  const str = String(sa).trim();
  if (!str || str === 'unknown') return null;
  if (/^<\s*50/.test(str)) return 40;
  if (/^>\s*150/.test(str)) return 180;
  const range = str.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

const deriveFixedEstimateAmount = (
  text: string,
  surfaceArea: FormData['surfaceArea']
): number => {
  const totalRange =
    text.match(/TOTAL\s+PROJECT\s+COST[^\d]*([\d.,]+)\s*-\s*([\d.,]+)/i) ||
    text.match(/TOTAL[^\d]*([\d.,]+)\s*-\s*([\d.,]+)/i);
  if (totalRange) {
    const lo = parseNumber(totalRange[1]);
    const hi = parseNumber(totalRange[2]);
    if (lo && hi) {
      return roundToNearest((lo + hi) / 2, 100);
    }
  }

  const single = text.match(/TOTAL\s+PROJECT\s+COST[^\d]*([\d.,]+)/i);
  if (single) {
    const v = parseNumber(single[1]);
    if (v) return roundToNearest(v, 100);
  }

  const perM2 = text.match(
    /(?:\u20AC|\bEUR\b)?\s*([\d.,]+)\s*-\s*(?:\u20AC|\bEUR\b)?\s*([\d.,]+)\s*\/\s*m(?:\u00B2|2)/i
  );
  if (perM2) {
    const lo = parseNumber(perM2[1]);
    const hi = parseNumber(perM2[2]);
    const area = parseSurfaceAreaAverage(surfaceArea) || 100;
    if (lo && hi) {
      const avg = (lo + hi) / 2;
      return roundToNearest(avg * area, 100);
    }
  }

  const fallbackArea = parseSurfaceAreaAverage(surfaceArea) || 100;
  const fallbackRatePerM2 = 115;
  return roundToNearest(fallbackArea * fallbackRatePerM2, 100);
};

const extractVisualization = (text: string): string => {
  const visualMatch = text.match(
    /\*?\*?(?:BEFORE\/AFTER\s+)?VISUALIZATION\*?\*?:?\s*([\s\S]*?)(?=\*?\*?(?:RECOMMENDATIONS|PRICING|TIMELINE)\b|$)/i
  );
  return visualMatch ? visualMatch[1].trim() : '';
};

const LOAN_TAEG = 0.0699;

const loanCalcRate = (taeg: number) => (Math.pow(1 + taeg, 1 / 12) - 1) * 12;

const calculateMonthlyInstallment = (
  principal: number,
  months: number,
  taeg: number
): number | null => {
  if (!principal || principal <= 0 || !months || months <= 0) return null;
  const calcRate = loanCalcRate(taeg);
  const monthlyRate = calcRate / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

const LEGAL_MAX_DURATIONS = [
  { min: 200, max: 500, months: 18 },
  { min: 501, max: 2500, months: 24 },
  { min: 2501, max: 3700, months: 30 },
  { min: 3701, max: 5600, months: 36 },
  { min: 5601, max: 7500, months: 42 },
  { min: 7501, max: 10000, months: 48 },
  { min: 10001, max: 15000, months: 60 },
  { min: 15001, max: 20000, months: 84 },
  { min: 20001, max: Infinity, months: 120 },
] as const;

const getMaxDurationMonths = (amount: number): number => {
  for (const rule of LEGAL_MAX_DURATIONS) {
    if (amount >= rule.min && amount <= rule.max) return rule.months;
  }
  return 120;
};

const DURATION_OPTIONS = [18, 24, 30, 36, 42, 48, 60, 84, 120] as const;

export const ResultsPage: React.FC<ResultsPageProps> = ({
  formData,
  imagePreview,
  generatedImage,
  activeGeneratedFinish,
  result,
  isImageGenerating,
  imageGenerationStatus,
  onRestart,
}) => {
  const { t, locale } = useI18n();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');

  const formatEur = (value: number, options: Intl.NumberFormatOptions = {}) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      ...options,
    }).format(value);

  const openImageModal = (
    src: string,
    title: string,
    description: string
  ): void => {
    setModalImage(src);
    setModalTitle(title);
    setModalDescription(description);
    setModalOpen(true);
  };

  const visualizationText = useMemo(() => extractVisualization(result), [result]);

  const prettyFacade = formData.facadeType
    ? t(`steps.facadeType.options.${formData.facadeType}.label`)
    : '';

  const prettyCondition = formData.condition
    ? t(`steps.condition.options.${formData.condition}`)
    : '';

  const prettyFinish = formData.finish
    ? t(`steps.finish.options.${formData.finish}.title`)
    : '';

  const prettyTimeline = formData.timeline
    ? t(`steps.timeline.options.${formData.timeline}`)
    : '';

  const prettySurface = useMemo(() => {
    const sa = String(formData.surfaceArea || '').trim();
    if (!sa || sa === 'unknown') return t('common.toBeMeasured');
    if (/m\u00B2$/i.test(sa)) return sa;
    return `${sa} m\u00B2`;
  }, [formData.surfaceArea, t]);

  const fullName = useMemo(() => {
    return [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
  }, [formData.firstName, formData.lastName]);

  const prettyPhone = useMemo(() => {
    if (!formData.phone) return '';
    return `${formData.phonePrefix || ''} ${formData.phone}`.trim();
  }, [formData.phonePrefix, formData.phone]);

  const prettyTreatments = useMemo(() => {
    const treatments = formData.treatments || [];
    if (!treatments.length) return t('common.none');
    return treatments
      .map((tr) => t(`steps.treatments.options.${tr}.title`))
      .join(', ');
  }, [formData.treatments, t]);

  const callbackStatus = formData.callDuringDay
    ? t('pdf.callback.requested')
    : t('pdf.callback.notRequested');

  const fixedEstimateAmount = useMemo(
    () => deriveFixedEstimateAmount(result, formData.surfaceArea),
    [result, formData.surfaceArea]
  );
  const fixedEstimateLabel = useMemo(
    () => formatEur(fixedEstimateAmount, { maximumFractionDigits: 0 }),
    [fixedEstimateAmount, locale]
  );

  const maxDurationMonths = useMemo(
    () => getMaxDurationMonths(fixedEstimateAmount),
    [fixedEstimateAmount]
  );
  const availableDurations = useMemo(() => {
    const filtered = DURATION_OPTIONS.filter((m) => m <= maxDurationMonths);
    return filtered.length ? filtered : [maxDurationMonths];
  }, [maxDurationMonths]);

  const [loanDurationMonths, setLoanDurationMonths] = useState<number>(() =>
    Math.min(48, maxDurationMonths)
  );

  useEffect(() => {
    setLoanDurationMonths((prev) => clamp(prev, 1, maxDurationMonths));
  }, [maxDurationMonths]);

  const calcRate = useMemo(() => loanCalcRate(LOAN_TAEG), []);
  const installment = useMemo(
    () =>
      calculateMonthlyInstallment(
        fixedEstimateAmount,
        loanDurationMonths,
        LOAN_TAEG
      ),
    [fixedEstimateAmount, loanDurationMonths]
  );

  return (
    <>
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage || ''}
        title={modalTitle}
        description={modalDescription}
      />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col gap-3 p-3 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/spraystone-logo.png"
              alt="Spraystone"
              className="h-10 w-auto"
              onError={(e) =>
                (((e.target as HTMLImageElement).style.display = 'none'))
              }
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-[#2D2A26] sm:text-2xl">
                {t('results.title')}
              </h1>
              <p className="text-xs text-[#6B5E4F] sm:text-sm">
                {t('results.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-3xl border border-[#d4a574]/30 bg-white/80 p-3 shadow-xl md:p-4">
          <div className="min-h-0 flex-1">
            <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-[#eadfcb] bg-white shadow-sm">
                  <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        imagePreview
                          ? openImageModal(
                              imagePreview,
                              t('results.imageModal.beforeTitle'),
                              t('results.imageModal.beforeDescription')
                            )
                          : undefined
                      }
                      disabled={!imagePreview}
                      className="group relative w-full overflow-hidden rounded-xl border border-[#eadfcb] bg-[#fdf8f2] text-left shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ height: 'clamp(220px, 42vh, 420px)' }}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={t('results.beforeImageAlt')}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fdf8f2] to-white">
                          <div className="p-4 text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1dd]">
                              <Camera className="h-6 w-6 text-[#c4955e]" />
                            </div>
                            <p className="mb-1 text-xs font-semibold text-[#2D2A26]">
                              {t('results.awaitingPhotoTitle')}
                            </p>
                            <p className="mx-auto max-w-xs text-[11px] text-[#6B5E4F]">
                              {t('results.awaitingPhotoBody')}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#2D2A26]">
                            {t('results.beforeBadge')}
                          </div>
                          <div className="mt-2 line-clamp-2 text-[11px] text-white/90">
                            {prettyCondition || t('common.notSpecified')}
                          </div>
                        </div>
                        <div className="rounded-full bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#2D2A26] shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                          {t('results.preview.open')}
                        </div>
                      </div>
                    </button>

                    {generatedImage ? (
                      <button
                        type="button"
                        onClick={() =>
                          openImageModal(
                            generatedImage,
                            t('results.imageModal.afterTitle'),
                            t('results.imageModal.afterDescription', {
                              finish:
                                (activeGeneratedFinish
                                  ? t(
                                      `results.texture.options.${activeGeneratedFinish}`
                                    )
                                  : null) ||
                                prettyFinish ||
                                'Spraystone',
                            })
                          )
                        }
                        className="group relative w-full overflow-hidden rounded-xl border border-[#eadfcb] bg-[#fdf8f2] text-left shadow-sm transition hover:shadow-md"
                        style={{ height: 'clamp(220px, 42vh, 420px)' }}
                      >
                        <img
                          src={generatedImage}
                          alt={t('results.afterImageAlt')}
                          className="h-full w-full object-contain"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <div className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#2D2A26]">
                              {t('results.afterBadge')}
                            </div>
                            <div className="mt-2 line-clamp-2 text-[11px] text-white/90">
                              {visualizationText ||
                                t('results.afterSummaryFallback')}
                            </div>
                          </div>
                          <div className="rounded-full bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#2D2A26] shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                            {t('results.preview.open')}
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-[#eadfcb] bg-white shadow-sm"
                        style={{ height: 'clamp(220px, 42vh, 420px)' }}
                      >
                        <div className="absolute left-3 top-3 inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#2D2A26]">
                          {t('results.afterBadge')}
                        </div>
                        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1dd]">
                            {isImageGenerating ? (
                              <Loader2 className="h-6 w-6 animate-spin text-[#c4955e]" />
                            ) : (
                              <Camera className="h-6 w-6 text-[#c4955e]" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#2D2A26]">
                            {isImageGenerating
                              ? t('results.preview.generation.generatingTitle')
                              : t('results.previewSoonTitle')}
                          </p>
                          <p className="mt-1 max-w-xs text-[11px] text-[#6B5E4F]">
                            {isImageGenerating
                              ? imageGenerationStatus || t('results.preview.afterDisabled')
                              : t('results.previewSoonBody')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadfcb] bg-gradient-to-br from-[#fdf8f2] to-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c4955e]">
                        {t('results.investment.title')}
                      </p>
                      <p className="mt-1 text-xs text-[#6B5E4F]">
                        {t('results.investment.subtitle')}
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
                      <Euro className="h-7 w-7" style={{ color: '#D4A574' }} />
                    </div>
                  </div>


                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B5E4F]">
                      {t('results.investment.toggleFinancing')}
                    </p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                      <div className="text-4xl font-extrabold text-[#2D2A26]">
                        {typeof installment === 'number'
                          ? formatEur(installment ?? 0, {
                              maximumFractionDigits: 2,
                            })
                          : '--'}
                      </div>
                      <div className="text-sm font-semibold text-[#6B5E4F]">
                        {t('results.investment.installmentCaption')}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6B5E4F]">
                      <div>
                        <span className="font-semibold">
                          {t('results.investment.financedAmount')}
                        </span>{' '}
                        {fixedEstimateLabel}
                      </div>
                      <div>
                        <span className="font-semibold">
                          {t('results.investment.duration')}
                        </span>{' '}
                        {loanDurationMonths} {t('common.months')}
                      </div>
                      <div>
                        <span className="font-semibold">
                          {t('results.investment.rate')}
                        </span>{' '}
                        {(LOAN_TAEG * 100).toFixed(2)}%
                      </div>
                      <div>
                        <span className="font-semibold">
                          {t('results.investment.calcRate')}
                        </span>{' '}
                        {(calcRate * 100).toFixed(2)}%
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label
                        className="text-xs font-semibold text-[#6B5E4F]"
                        htmlFor="loan-duration"
                      >
                        {t('results.investment.durationLabel')}
                      </label>
                      <select
                        id="loan-duration"
                        value={loanDurationMonths}
                        onChange={(e) =>
                          setLoanDurationMonths(Number(e.target.value))
                        }
                        className="rounded-lg border border-[#d4a574]/40 bg-white px-3 py-2 text-sm font-semibold text-[#2D2A26] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]/40"
                      >
                        {availableDurations.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <details className="mt-3 rounded-xl border border-[#d4a574]/30 bg-white/60 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[#6B5E4F]">
                        {t('results.investment.legalMaxSummary')}
                      </summary>
                      <div className="mt-2">
                        <table className="w-full table-fixed text-xs text-[#2D2A26]">
                          <thead>
                            <tr className="text-left text-[#6B5E4F]">
                              <th className="pb-2 pr-4 font-semibold">
                                {t('results.investment.legalMax.amount')}
                              </th>
                              <th className="pb-2 font-semibold">
                                {t('results.investment.legalMax.duration')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {LEGAL_MAX_DURATIONS.map((row) => {
                              const range =
                                row.max === Infinity
                                  ? `${t('results.investment.legalMax.over')} ${formatEur(
                                      row.min,
                                      { maximumFractionDigits: 0 }
                                    )}`
                                  : `${formatEur(row.min, {
                                      maximumFractionDigits: 0,
                                    })} - ${formatEur(row.max, {
                                      maximumFractionDigits: 0,
                                    })}`;
                              return (
                                <tr
                                  key={`${row.min}-${row.max}`}
                                  className="border-t border-[#d4a574]/20"
                                >
                                  <td className="py-2 pr-4 break-words">
                                    {range}
                                  </td>
                                  <td className="py-2">
                                    {row.months} {t('common.months')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>

                  <div className="mt-4 border-t border-[#eadfcb] pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B5E4F]">
                      {t('results.investment.toggleTotal')}
                    </p>
                    <div className="mt-2 text-4xl font-extrabold text-[#2D2A26]">
                      {fixedEstimateLabel}
                    </div>
                    <div className="mt-1 text-xs text-[#6B5E4F]">
                      {t('results.investment.totalCaption')}
                    </div>
                  </div>

                <div className="mt-3 text-xs text-[#6B5E4F]">
                  {t('results.investment.disclaimer')}
                </div>
              </div>

              <div className="rounded-2xl border border-[#eadfcb] bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B5E4F]">
                  {t('results.summaryTitle')}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-[#2D2A26] sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.address')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {formData.address || t('common.notProvided')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.type')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {prettyFacade || t('common.notSpecified')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.surface')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {prettySurface}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.finish')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {prettyFinish || t('common.notSpecified')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.timeline')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {prettyTimeline || t('common.notSpecified')}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-[#6B5E4F]">
                  <span className="font-semibold">
                    {t('results.details.treatments')}
                  </span>{' '}
                  {prettyTreatments}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#2D2A26] sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.name')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {fullName || t('common.notProvided')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.email')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {formData.email || t('common.notProvided')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.phone')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {prettyPhone || t('common.notProvided')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#eadfcb] bg-[#fdf8f2] px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#6B5E4F]">
                      {t('results.details.callback')}
                    </div>
                    <div className="mt-0.5 truncate font-semibold">
                      {callbackStatus}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#eadfcb] bg-gradient-to-br from-[#fdf8f2] to-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#2D2A26]">
                    {t('results.next.title')}
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#c4955e] text-xs font-bold text-white">
                          {n}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#2D2A26]">
                            {t(`results.next.step${n}.title`)}
                          </div>
                          <div className="text-[11px] text-[#6B5E4F]">
                            {t(`results.next.step${n}.body`)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>


          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="button-press flex items-center justify-center space-x-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C4955E 100%)',
              }}
            >
              <span className="truncate">{t('results.actions.generateOther')}</span>
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="button-press hover-lift flex items-center justify-center space-x-2 rounded-xl border-2 bg-white px-4 py-3 text-sm font-semibold shadow-lg"
              style={{ borderColor: '#D4A574', color: '#2D2A26' }}
            >
              <span className="truncate">{t('results.actions.backToWebsite')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
