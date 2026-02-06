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
    image: '/Pierre de france..jpeg',
    icon: <Gem className="h-5 w-5" />,
    palette: ['#D9D4C9', '#B6B0A3', '#8F897B'],
  },
  {
    id: 'smooth',
    image: '/Pierre des gres beige brun.jpeg',
    icon: <Waves className="h-5 w-5" />,
    palette: ['#DDD2C3', '#BDA788', '#8C7561'],
  },
  {
    id: 'textured',
    image: '/Pierre des gres claire.jpeg',
    icon: <Sparkles className="h-5 w-5" />,
    palette: ['#E3DACB', '#C7B69D', '#948167'],
  },
  {
    id: 'gris-bleue',
    image: '/Pierre des gres blau.jpeg',
    icon: <Waves className="h-5 w-5" />,
    palette: ['#D6DCE2', '#9EA9B6', '#6D7A87'],
  },
  {
    id: 'gris-bleue-nuancee',
    image: '/Pierre gris bleue nuance.jpeg',
    icon: <Sparkles className="h-5 w-5" />,
    palette: ['#DCE0E4', '#A9B0B8', '#707982'],
  },
  {
    id: 'brick',
    image: '/brick-warm.jpg',
    icon: <Compass className="h-5 w-5" />,
    palette: ['#C97848', '#AF5E35', '#7B3F24'],
  },
  {
    id: 'other',
    image: '/WhatsApp Image 2026-01-21 at 15.46.04.jpeg',
    icon: <Compass className="h-5 w-5" />,
    palette: ['#D7D0C3', '#B6AB98', '#8A7A64'],
  },
];

export const Step5Finish: React.FC<Step5FinishProps> = ({
  formData,
  onTogglePreviewFinish,
}) => {
  const { t } = useI18n();
  const selectedFinish = formData.previewFinishes[0] ?? null;

  return (
    <div>
      <div className="mb-5 text-center sm:mb-8">
        <div className="mx-auto mb-2 inline-flex w-fit items-center justify-center rounded-full border border-[#eadfcb] bg-[#fdf8f2] px-3 py-1 text-[11px] font-semibold text-[#6B5E4F]">
          {t('common.optional')}
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {t('steps.finish.title')}
        </h2>
        <p className="text-gray-600">{t('steps.finish.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {finishCards.map((card) => {
          const keyBase = `steps.finish.options.${card.id}`;
          const title = t(`${keyBase}.title`);
          const subtitle = t(`${keyBase}.subtitle`);
          const bestFor = t(`${keyBase}.bestFor`);
          const isSelected = selectedFinish === card.id;

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
    </div>
  );
};
