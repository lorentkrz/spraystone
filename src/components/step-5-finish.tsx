import React from 'react';
import type { PreviewFinish, Step5FinishProps } from '@/types';
import { Gem, Waves, Sparkles, Compass } from 'lucide-react';
import { useI18n } from '@/i18n';
import { SelectionMark } from '@/components/selection-mark';
import { selectableCardClass } from '@/utils/selectable';

interface FinishCardMeta {
  id: PreviewFinish;
  image: string;
  icon: React.ReactNode;
  palette: string[];
}

const finishCards: FinishCardMeta[] = [
  {
    id: 'natural-stone',
    image: '/limestone-classic.jpg',
    icon: <Gem className="h-5 w-5" />,
    palette: ['#D9D4C9', '#B6B0A3', '#8F897B'],
  },
  {
    id: 'smooth',
    image: '/render-neutral.jpg',
    icon: <Waves className="h-5 w-5" />,
    palette: ['#DDD8D2', '#C8C3BD', '#A9A39D'],
  },
  {
    id: 'textured',
    image: '/limestone-textured.jpg',
    icon: <Sparkles className="h-5 w-5" />,
    palette: ['#DCCEBF', '#C0A98F', '#8D6A4D'],
  },
  {
    id: 'other',
    image: '/brick-warm.jpg',
    icon: <Compass className="h-5 w-5" />,
    palette: ['#C97848', '#AF5E35', '#7B3F24'],
  },
];

export const Step5Finish: React.FC<Step5FinishProps> = ({
  formData,
  onTogglePreviewFinish,
}) => {
  const { t } = useI18n();
  const selectedCount = formData.previewFinishes.length;
  const selectedFinishCards = finishCards.filter((card) =>
    formData.previewFinishes.includes(card.id)
  );

  return (
    <div>
      <div className="mb-5 text-center sm:mb-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {t('steps.finish.title')}
        </h2>
        <p className="text-gray-600">{t('steps.finish.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {finishCards.map((card) => {
          const keyBase = `steps.finish.options.${card.id}`;
          const title = t(`${keyBase}.title`);
          const subtitle = t(`${keyBase}.subtitle`);
          const bestFor = t(`${keyBase}.bestFor`);
          const isSelected = formData.previewFinishes.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onTogglePreviewFinish(card.id)}
              className={selectableCardClass(
                isSelected,
                'group flex min-h-[clamp(120px,18vh,220px)] flex-col overflow-hidden text-left'
              )}
            >
              <SelectionMark isSelected={isSelected} />
              <div className="relative flex h-[clamp(56px,10vh,128px)] items-center justify-center overflow-hidden">
                <img
                  src={card.image}
                  alt={t('steps.finish.sampleAlt', { title })}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                  {bestFor}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {card.icon} {title}
                  </p>
                  <p className="line-clamp-2 text-sm text-gray-600">{subtitle}</p>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {card.palette.map((swatch) => (
                    <span
                      key={swatch}
                      className="h-3 w-8 rounded-full border border-white/40"
                      style={{ backgroundColor: swatch }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-[#eadfcb] bg-[#fdf8f2] p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B5E4F]">
              {t('steps.finish.preview.title')}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {t('steps.finish.preview.subtitle')}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {t('steps.finish.preview.hint')}
            </p>
          </div>
          <div className="self-start rounded-full border border-[#eadfcb] bg-white px-3 py-1 text-xs font-semibold text-gray-700">
            {t('steps.finish.preview.count', {
              count: selectedCount,
              total: finishCards.length,
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {selectedFinishCards.map((card) => {
            const title = t(`results.texture.options.${card.id}`);
            return (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-xl border border-[#d4a574]/40 bg-white shadow-sm"
              >
                <SelectionMark isSelected />
                <div className="relative h-16 w-full overflow-hidden bg-gray-50">
                  <img
                    src={card.image}
                    alt={t('steps.finish.sampleAlt', { title })}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="px-2 py-1.5">
                  <div className="truncate text-xs font-semibold text-[#2D2A26]">
                    {title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
