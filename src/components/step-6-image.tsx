import React from 'react';
import { Upload } from 'lucide-react';
import type { Step6ImageProps } from '@/types';
import { useI18n } from '@/i18n';

export const Step6Image: React.FC<Step6ImageProps> = ({
  imagePreview,
  onImageUpload,
  onImageRemove,
}) => {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-5 text-center sm:mb-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          {t('steps.photo.title')}
        </h2>
        <p className="text-gray-600">{t('steps.photo.subtitle')}</p>
      </div>

      {!imagePreview ? (
        <label htmlFor="file-upload" className="block">
          <div className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-[#d4a574]/60 bg-white p-8 text-center transition hover:bg-[#fff7ec] sm:p-12">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1dd]">
              <Upload className="h-6 w-6 text-[#c4955e]" />
            </div>
            <div className="font-medium text-gray-900">
              {t('steps.photo.cta')}
            </div>
            <div className="text-sm text-gray-500">{t('steps.photo.formats')}</div>
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/*,.heic,.heif"
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div
            className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-[#fdf8f2]"
            style={{ height: 'min(38vh, 320px)' }}
          >
            <img
              src={imagePreview}
              alt={t('steps.photo.previewAlt')}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onImageRemove}
              className="text-sm text-gray-600 underline transition hover:text-gray-900"
            >
              {t('steps.photo.remove')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
