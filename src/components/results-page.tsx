import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Camera,
  ChevronRight,
  Euro,
  Loader2,
  MapPin,
} from 'lucide-react';
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

const extractVisualization = (text: string): string => {
  const visualMatch = text.match(
    /\*?\*?(?:BEFORE\/AFTER\s+)?VISUALIZATION\*?\*?:?\s*([\s\S]*?)(?=\*?\*?(?:RECOMMENDATIONS|PRICING|TIMELINE)\b|$)/i
  );
  return visualMatch ? visualMatch[1].trim() : '';
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

const MIN_MONTHS = 12;
const MONTH_STEP = 6;
const MIN_SURFACE = 20;
const MAX_SURFACE = 500;
const SURFACE_STEP = 1;
const ANNUAL_TAEG_RATE = Number(import.meta.env.VITE_FINANCING_TAEG || 0.0699);

const LEGAL_DURATION_BRACKETS = [
  { min: 200, max: 500, maxMonths: 18 },
  { min: 501, max: 2500, maxMonths: 24 },
  { min: 2501, max: 3700, maxMonths: 30 },
  { min: 3701, max: 5600, maxMonths: 36 },
  { min: 5601, max: 7500, maxMonths: 42 },
  { min: 7501, max: 10000, maxMonths: 48 },
  { min: 10001, max: 15000, maxMonths: 60 },
  { min: 15001, max: 20000, maxMonths: 84 },
  { min: 20001, max: Number.POSITIVE_INFINITY, maxMonths: 120 },
] as const;

const getLegalMaxMonths = (amount: number): number => {
  const normalized = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const bracket = LEGAL_DURATION_BRACKETS.find(
    (row) => normalized >= row.min && normalized <= row.max
  );
  return bracket?.maxMonths ?? MIN_MONTHS;
};

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
    return `${formatEur(normalized, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} TVAC`;
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

  const durationMaxMonths = useMemo(
    () => getLegalMaxMonths(totalEstimate),
    [totalEstimate]
  );

  useEffect(() => {
    setLoanDurationMonths((prev) => clamp(prev, MIN_MONTHS, durationMaxMonths));
  }, [durationMaxMonths]);

  const monthlyInstallment = useMemo(() => {
    if (!totalEstimate || !loanDurationMonths) return null;
    if (ANNUAL_TAEG_RATE <= 0) return totalEstimate / loanDurationMonths;

    const monthlyRate = Math.pow(1 + ANNUAL_TAEG_RATE, 1 / 12) - 1;
    if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) {
      return totalEstimate / loanDurationMonths;
    }

    const denominator = 1 - Math.pow(1 + monthlyRate, -loanDurationMonths);
    if (!Number.isFinite(denominator) || denominator === 0) {
      return totalEstimate / loanDurationMonths;
    }

    return (totalEstimate * monthlyRate) / denominator;
  }, [totalEstimate, loanDurationMonths]);

  const monthlyInstallmentLabel =
    monthlyInstallment !== null
      ? formatEur(monthlyInstallment, {
          maximumFractionDigits: 2,
        })
      : '--';

  const cardShell =
    'rounded-2xl border border-[#e1d4c1] bg-white shadow-[0_10px_30px_rgba(50,35,18,0.08)]';

  const topFacts = [
    {
      label: t('results.details.address'),
      value: formData.address || t('common.notProvided'),
    },
    {
      label: t('results.details.finish'),
      value: prettyFinish || t('common.notSpecified'),
    },
    {
      label: t('results.details.timeline'),
      value: prettyTimeline || t('common.notSpecified'),
    },
  ];

  const overviewStats = [
    {
      label: t('results.details.surface'),
      value: `${adjustedSurface} m\u00B2`,
    },
    {
      label: t('results.investment.toggleTotal'),
      value: totalEstimateLabel,
    },
    {
      label: t('results.investment.monthlyTitle'),
      value:
        monthlyInstallment !== null
          ? `${monthlyInstallmentLabel} ${t('results.investment.perMonth')}`
          : '--',
    },
  ];

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={onRestart}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#1f1a14] bg-[#1f1a14] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2b2218] hover:shadow-md"
      >
        <span>{t('results.actions.generateOther')}</span>
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#d9c7ae] bg-white px-5 py-2.5 text-sm font-bold text-[#2d241b] shadow-sm transition hover:bg-[#faf6f0] hover:shadow-md"
      >
        <span>{t('results.actions.backToWebsite')}</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </>
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

      <div className="relative min-h-[100dvh] bg-gradient-to-br from-[#F5F1E8] via-[#E8DCC8] to-[#fdf8f2]">
        <div className="relative mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute -left-20 top-6 h-36 w-36 rounded-full bg-white/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-20 h-32 w-32 rounded-full bg-[#e8d7be]/30 blur-3xl" />

          <header className={`${cardShell} relative overflow-hidden p-4 sm:p-5`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#8f6a43] via-[#d1a774] to-[#8f6a43]" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <img
                    src="/spraystone-logo.png"
                    alt="Spraystone"
                    className="h-10 w-auto sm:h-11"
                    onError={(e) =>
                      (((e.target as HTMLImageElement).style.display = 'none'))
                    }
                  />
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-extrabold text-[#1f1a14] sm:text-[2rem]">
                      {t('results.title')}
                    </h1>
                    <p className="text-sm text-[#6d5a45]">{t('results.subtitle')}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full border border-[#e3d1b8] bg-[#fbf7f0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#876745]">
                  {t('results.preview.title')}
                </span>
                <LanguageSwitcher />
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {topFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-xl border border-[#ece0cf] bg-[#fcf9f5] px-3 py-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6845]">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2d241b] [overflow-wrap:anywhere]">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </header>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_380px]">
            <main className="flex flex-col gap-3">
              <section className={`${cardShell} relative overflow-hidden p-4`}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d2af84] to-transparent" />
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9a744b]">
                    {t('results.preview.title')}
                  </p>
                  <span className="rounded-full border border-[#e8dbc8] bg-[#faf6f0] px-2.5 py-1 text-[11px] font-semibold text-[#6e5b47]">
                    {prettyFacade || t('common.notSpecified')}
                  </span>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
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
                    className="group relative w-full overflow-hidden rounded-xl border border-[#e4d5bf] bg-[#f7f0e4]/55 text-left shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ minHeight: '220px', aspectRatio: '4 / 3' }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('results.beforeImageAlt')}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4 text-center">
                        <div>
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1dfc8]">
                            <Camera className="h-5 w-5 text-[#9a744b]" />
                          </div>
                          <p className="text-xs font-semibold text-[#2d241b]">
                            {t('results.awaitingPhotoTitle')}
                          </p>
                          <p className="mx-auto mt-1 max-w-[220px] text-[11px] text-[#6e5b47]">
                            {t('results.awaitingPhotoBody')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-[#2d241b]">
                          {t('results.beforeBadge')}
                        </span>
                        <p className="mt-1 line-clamp-2 text-[11px] text-white/92">
                          {prettyCondition || t('common.notSpecified')}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold text-[#2d241b] opacity-0 transition-opacity group-hover:opacity-100">
                        {t('results.preview.open')}
                      </span>
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
                      className="group relative w-full overflow-hidden rounded-xl border border-[#e4d5bf] bg-[#f7f0e4]/55 text-left shadow-sm transition hover:shadow-md"
                      style={{ minHeight: '220px', aspectRatio: '4 / 3' }}
                    >
                      <img
                        src={generatedImage}
                        alt={t('results.afterImageAlt')}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-[#2d241b]">
                            {t('results.afterBadge')}
                          </span>
                          <p className="mt-1 text-[11px] text-white/92">
                            {prettyFinish || 'Spraystone'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold text-[#2d241b] opacity-0 transition-opacity group-hover:opacity-100">
                          {t('results.preview.open')}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div
                      className="relative w-full overflow-hidden rounded-xl border border-[#e4d5bf] bg-[#f7f0e4]/55 shadow-sm"
                      style={{ minHeight: '220px', aspectRatio: '4 / 3' }}
                    >
                      <div className="absolute left-2 top-2">
                        <span className="inline-flex rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-[#2d241b]">
                          {t('results.afterBadge')}
                        </span>
                      </div>
                      <div className="flex h-full items-center justify-center p-4 text-center">
                        <div>
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1dfc8]">
                            {isImageGenerating ? (
                              <Loader2 className="h-5 w-5 animate-spin text-[#9a744b]" />
                            ) : (
                              <Camera className="h-5 w-5 text-[#9a744b]" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#2d241b]">
                            {isImageGenerating
                              ? t('results.preview.generation.generatingTitle')
                              : t('results.previewSoonTitle')}
                          </p>
                          <p className="mx-auto mt-1 max-w-[220px] text-[11px] text-[#6e5b47]">
                            {isImageGenerating
                              ? imageGenerationStatus || t('results.preview.afterDisabled')
                              : t('results.previewSoonBody')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className={`${cardShell} p-4`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#2a2118]">{t('results.investment.title')}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#e6d7c4] bg-[#fbf8f3] px-2.5 py-1 text-[10px] font-semibold text-[#876a4a]">
                    <Euro className="h-3.5 w-3.5" />
                    TVAC
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {overviewStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-[#ece1d1] bg-[#fcfaf7] px-3 py-2"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#896746]">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#2d241b] [overflow-wrap:anywhere]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${cardShell} p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-[#2a2118]">{t('results.next.title')}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#ecdfcc] bg-[#fbf8f3] px-2.5 py-1 text-[10px] font-semibold text-[#876a4a]">
                    <CalendarClock className="h-3.5 w-3.5" />
                    3
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#6e5b47]">
                  {visualizationText || t('results.afterSummaryFallback')}
                </p>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-xl border border-[#eee2d3] bg-[#fcfaf7] px-3 py-3"
                    >
                      <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c79a68] text-[11px] font-bold text-white">
                        {n}
                      </div>
                      <p className="text-sm font-semibold text-[#2d241b]">
                        {t(`results.next.step${n}.title`)}
                      </p>
                      <p className="mt-1 text-xs text-[#6e5b47]">
                        {t(`results.next.step${n}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${cardShell} -mt-1 p-2.5 lg:mt-auto`}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {actionButtons}
                </div>
              </section>
            </main>

            <aside className="flex flex-col gap-3 lg:sticky lg:top-4 self-start">
              <section className={`${cardShell} relative overflow-hidden p-4`}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d2af84] to-transparent" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9a744b]">
                      {t('results.investment.title')}
                    </p>
                    <p className="mt-1 text-sm text-[#6e5b47]">
                      {t('results.investment.subtitle')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#eadfce] bg-[#faf6f0] p-2">
                    <Euro className="h-5 w-5 text-[#8f6a43]" />
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#efe5d7] bg-[#fcfaf7] p-3">
                  <div className="flex items-end justify-between gap-2">
                    <label
                      className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#876a4a]"
                      htmlFor="surface-input"
                    >
                      {t('results.investment.adjustSurfaceLabel')}
                    </label>
                    <div className="flex items-baseline gap-1 rounded-lg border border-[#e6d7c4] bg-white px-2 py-1">
                      <input
                        id="surface-input"
                        type="number"
                        inputMode="numeric"
                        min={MIN_SURFACE}
                        max={MAX_SURFACE}
                        value={surfaceInput}
                        onChange={(e) => handleSurfaceInput(e.target.value)}
                        onBlur={handleSurfaceBlur}
                        className="w-14 bg-transparent text-right text-base font-extrabold text-[#2d241b] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-semibold text-[#6e5b47]">m{'\u00B2'}</span>
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
                    className="mt-2 w-full accent-[#c79a68]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-semibold text-[#7b644b]">
                    <span>{MIN_SURFACE} m{'\u00B2'}</span>
                    <span>{MAX_SURFACE} m{'\u00B2'}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#efe5d7] bg-[#fcfaf7] px-3 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#876a4a]">
                    {t('results.investment.toggleTotal')}
                  </p>
                  <p className="mt-1 text-[1.9rem] font-extrabold leading-none text-[#1f1a14]">
                    {totalEstimateLabel}
                  </p>
                </div>

                <div className="my-4 border-t border-[#ecdfcc]" />

                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#876a4a]">
                    {t('results.investment.monthlyTitle')}
                  </p>
                  <span className="rounded-full border border-[#e7d8c5] bg-[#fbf8f3] px-2.5 py-1 text-[10px] font-semibold text-[#6e5b47]">
                    {loanDurationMonths} {t('common.months')}
                  </span>
                </div>
                <div className="mt-1.5 flex items-end gap-2">
                  <p className="text-[1.9rem] font-extrabold leading-none text-[#2d241b]">
                    {monthlyInstallmentLabel}
                  </p>
                  <p className="pb-1 text-sm font-semibold text-[#6e5b47]">
                    {t('results.investment.perMonth')}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[#6e5b47]">
                  {t('results.investment.monthlyCaption', {
                    months: loanDurationMonths,
                  })}
                </p>

                <div className="mt-3">
                  <label
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#876a4a]"
                    htmlFor="loan-duration"
                  >
                    {t('results.investment.durationLabel')}
                  </label>
                  <input
                    id="loan-duration"
                    type="range"
                    min={MIN_MONTHS}
                    max={durationMaxMonths}
                    step={MONTH_STEP}
                    value={loanDurationMonths}
                    onChange={(e) =>
                      setLoanDurationMonths(
                        clamp(
                          Number(e.target.value),
                          MIN_MONTHS,
                          durationMaxMonths
                        )
                      )
                    }
                    className="mt-2 w-full accent-[#c79a68]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-semibold text-[#7b644b]">
                    <span>{MIN_MONTHS} {t('common.months')}</span>
                    <span>{durationMaxMonths} {t('common.months')}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#efe5d7] bg-[#fbf8f3] p-2.5 text-[11px] text-[#6e5b47]">
                  {t('results.investment.disclaimer')}
                </div>
              </section>

              <section className={`${cardShell} p-3`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#2a2118]">{t('results.summaryTitle')}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#ecdfcc] bg-[#fbf8f3] px-2 py-1 text-[10px] font-semibold text-[#876a4a]">
                    <MapPin className="h-3 w-3" />
                    {summaryRows.length}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#efe5d7]">
                  {summaryRows.map((row, index) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-1 gap-1 border-t border-[#efe5d7] px-2.5 py-2 first:border-t-0 sm:grid-cols-[120px,minmax(0,1fr)] sm:items-center sm:gap-2 ${
                        index % 2 === 0 ? 'bg-[#fcfaf7]' : 'bg-white'
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-[#7a6146]">{row.label}</p>
                      <p className="text-left text-[12px] font-bold text-[#2d241b] [overflow-wrap:anywhere] sm:text-right">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
};
