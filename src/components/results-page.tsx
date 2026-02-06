import React, { useMemo, useState } from 'react';
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

const DEFAULT_SURFACE_AREA = 100;
const DEFAULT_PRICE_PER_M2 = 130;
const PRICE_PER_M2_BY_FINISH: Record<string, number> = {
  'natural-stone': 130,
  smooth: 130,
  textured: 130,
  'gris-bleue': 130,
  'gris-bleue-nuancee': 130,
  brick: 140,
  suggest: 130,
  other: 130,
};

const getPricePerM2 = (finish: FormData['finish']) =>
  PRICE_PER_M2_BY_FINISH[finish || 'natural-stone'] ?? DEFAULT_PRICE_PER_M2;

const extractVisualization = (text: string): string => {
  const visualMatch = text.match(
    /\*?\*?(?:BEFORE\/AFTER\s+)?VISUALIZATION\*?\*?:?\s*([\s\S]*?)(?=\*?\*?(?:RECOMMENDATIONS|PRICING|TIMELINE)\b|$)/i
  );
  return visualMatch ? visualMatch[1].trim() : '';
};

const MIN_MONTHS = 12;
const MAX_MONTHS = 120;
const MONTH_STEP = 6;
const MIN_SURFACE = 20;
const MAX_SURFACE = 300;
const SURFACE_STEP = 5;

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

  const formatTvac = (value: number) => {
    const normalized = Number.isFinite(value) ? value : 0;
    const [intPart, decimalPart] = normalized.toFixed(2).split('.');
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withThousands},${decimalPart} € TVAC`;
  };

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

  const prettyTreatments = useMemo(() => {
    const treatments = formData.treatments || [];
    if (!treatments.length) return t('common.none');
    return treatments
      .map((tr) => t(`steps.treatments.options.${tr}.title`))
      .join(', ');
  }, [formData.treatments, t]);
  const summaryRows = [
    {
      label: t('results.details.address'),
      value: formData.address || t('common.notProvided'),
    },
    {
      label: t('results.details.type'),
      value: prettyFacade || t('common.notSpecified'),
    },
    {
      label: t('results.details.surface'),
      value: prettySurface,
    },
    {
      label: t('results.details.finish'),
      value: prettyFinish || t('common.notSpecified'),
    },
    {
      label: t('results.details.timeline'),
      value: prettyTimeline || t('common.notSpecified'),
    },
    {
      label: t('results.details.treatments'),
      value: prettyTreatments,
    },
  ];

  const surfaceAreaValue = useMemo(
    () => parseSurfaceAreaAverage(formData.surfaceArea),
    [formData.surfaceArea]
  );
  const effectiveSurfaceArea = surfaceAreaValue ?? DEFAULT_SURFACE_AREA;
  const pricePerM2 = useMemo(
    () => getPricePerM2(formData.finish),
    [formData.finish]
  );
  const [loanDurationMonths, setLoanDurationMonths] = useState<number>(36);
  const [adjustedSurface, setAdjustedSurface] = useState<number>(effectiveSurfaceArea);
  const [surfaceInput, setSurfaceInput] = useState<string>(String(effectiveSurfaceArea));

  const handleSurfaceSlider = (value: number) => {
    const clamped = clamp(value, MIN_SURFACE, MAX_SURFACE);
    setAdjustedSurface(clamped);
    setSurfaceInput(String(clamped));
  };

  const handleSurfaceInput = (raw: string) => {
    setSurfaceInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= MIN_SURFACE && num <= MAX_SURFACE) {
      setAdjustedSurface(num);
    }
  };

  const handleSurfaceBlur = () => {
    const num = parseInt(surfaceInput, 10);
    if (isNaN(num) || num < MIN_SURFACE) {
      setAdjustedSurface(MIN_SURFACE);
      setSurfaceInput(String(MIN_SURFACE));
    } else if (num > MAX_SURFACE) {
      setAdjustedSurface(MAX_SURFACE);
      setSurfaceInput(String(MAX_SURFACE));
    } else {
      setAdjustedSurface(num);
      setSurfaceInput(String(num));
    }
  };

  const totalEstimate = useMemo(
    () => roundToNearest(adjustedSurface * pricePerM2, 10),
    [adjustedSurface, pricePerM2]
  );

  const totalEstimateLabel = useMemo(
    () => formatTvac(totalEstimate),
    [totalEstimate]
  );

  const monthlyInstallment = useMemo(() => {
    if (!totalEstimate || !loanDurationMonths) return null;
    return totalEstimate / loanDurationMonths;
  }, [totalEstimate, loanDurationMonths]);

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
              <h1 className="truncate text-2xl font-extrabold text-[#1F1B16] sm:text-3xl">
                {t('results.title')}
              </h1>
              <p className="text-sm font-medium text-[#5A4C3C]">
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

                <div className="rounded-2xl border border-[#eadfcb] bg-gradient-to-br from-[#fdf8f2] to-white p-5 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c4955e]">
                        {t('results.investment.title')}
                      </p>
                      <p className="mt-1 text-sm text-[#6B5E4F]">
                        {t('results.investment.subtitle')}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-md">
                      <Euro className="h-6 w-6" style={{ color: '#D4A574' }} />
                    </div>
                  </div>

                  {/* Surface area controls */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B5E4F]"
                        htmlFor="surface-input"
                      >
                        {t('results.investment.adjustSurfaceLabel')}
                      </label>
                      <div className="flex items-baseline gap-1 rounded-xl border border-[#eadfcb] bg-white px-3 py-1.5 shadow-sm transition-colors focus-within:border-[#d4a574] focus-within:ring-2 focus-within:ring-[#d4a574]/20">
                        <input
                          id="surface-input"
                          type="number"
                          inputMode="numeric"
                          min={MIN_SURFACE}
                          max={MAX_SURFACE}
                          value={surfaceInput}
                          onChange={(e) => handleSurfaceInput(e.target.value)}
                          onBlur={handleSurfaceBlur}
                          className="w-14 bg-transparent text-right text-lg font-extrabold text-[#2D2A26] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-sm font-semibold text-[#6B5E4F]">m{'\u00B2'}</span>
                      </div>
                    </div>
                    <input
                      id="surface-slider"
                      type="range"
                      min={MIN_SURFACE}
                      max={MAX_SURFACE}
                      step={SURFACE_STEP}
                      value={adjustedSurface}
                      onChange={(e) => handleSurfaceSlider(Number(e.target.value))}
                      className="mt-3 w-full accent-[#d4a574]"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-[#6B5E4F]">
                      <span>{MIN_SURFACE} m{'\u00B2'}</span>
                      <span>{MAX_SURFACE} m{'\u00B2'}</span>
                    </div>
                  </div>

                  {/* Total price */}
                  <div className="mt-5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#6B5E4F]">
                      {t('results.investment.toggleTotal')}
                    </p>
                    <div className="mt-1 text-5xl font-extrabold tracking-tight text-[#1F1B16]">
                      {totalEstimateLabel}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-5 border-t border-[#eadfcb]" />

                  {/* Monthly payment */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B5E4F]">
                      {t('results.investment.monthlyTitle')}
                    </p>
                    <span className="rounded-full border border-[#eadfcb] bg-white px-3 py-1 text-[10px] font-semibold text-[#6B5E4F]">
                      {loanDurationMonths} {t('common.months')}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                    <div className="text-3xl font-extrabold text-[#2D2A26]">
                      {monthlyInstallment !== null
                        ? formatEur(monthlyInstallment, {
                            maximumFractionDigits: 2,
                          })
                        : '--'}
                    </div>
                    <div className="text-sm font-semibold text-[#6B5E4F]">
                      {t('results.investment.perMonth')}
                    </div>
                  </div>
                  <div className="mt-0.5 text-xs text-[#6B5E4F]">
                    {t('results.investment.monthlyCaption', {
                      months: loanDurationMonths,
                    })}
                  </div>

                  {/* Duration slider */}
                  <div className="mt-4">
                    <label
                      className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B5E4F]"
                      htmlFor="loan-duration"
                    >
                      {t('results.investment.durationLabel')}
                    </label>
                    <input
                      id="loan-duration"
                      type="range"
                      min={MIN_MONTHS}
                      max={MAX_MONTHS}
                      step={MONTH_STEP}
                      value={loanDurationMonths}
                      onChange={(e) =>
                        setLoanDurationMonths(
                          clamp(Number(e.target.value), MIN_MONTHS, MAX_MONTHS)
                        )
                      }
                      className="mt-2 w-full accent-[#d4a574]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] font-semibold text-[#6B5E4F]">
                      <span>{MIN_MONTHS} {t('common.months')}</span>
                      <span>{MAX_MONTHS} {t('common.months')}</span>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-5 text-[11px] text-[#6B5E4F]">
                    {t('results.investment.disclaimer')}
                  </div>
              </div>

              <div className="rounded-2xl border border-[#eadfcb] bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B5E4F]">
                  {t('results.summaryTitle')}
                </p>
                <div className="mt-3 divide-y divide-[#eadfcb] rounded-xl border border-[#eadfcb] bg-[#fdf8f2] text-xs text-[#2D2A26]">
                  {summaryRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-start justify-between gap-3 px-3 py-2 transition hover:bg-white/70"
                    >
                      <span className="font-semibold text-[#6B5E4F]">
                        {row.label}
                      </span>
                      <span className="text-right font-bold text-[#1F1B16]">
                        {row.value}
                      </span>
                    </div>
                  ))}
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
