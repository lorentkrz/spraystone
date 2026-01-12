import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import type { StepProps } from '@/types';
import { useI18n } from '@/i18n';

export const Step9Contact: React.FC<StepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="mb-3 text-center text-2xl font-bold text-gray-900">
          {t('steps.contact.title')}
        </h2>
        <p className="text-center text-gray-600">{t('steps.contact.subtitle')}</p>
      </div>

      <div className="mx-auto max-w-xl space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={onChange}
              placeholder={t('steps.contact.fields.firstName.placeholder')}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900"
              autoComplete="given-name"
            />
          </div>

          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={onChange}
              placeholder={t('steps.contact.fields.lastName.placeholder')}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder={t('steps.contact.fields.email.placeholder')}
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900"
            autoComplete="email"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative w-28 flex-shrink-0">
            <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              name="phonePrefix"
              value={formData.phonePrefix}
              onChange={onChange}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 font-semibold text-gray-900"
              aria-label={t('steps.contact.fields.phonePrefix.ariaLabel')}
            >
              <option value="+32">+32</option>
              <option value="+33">+33</option>
            </select>
          </div>
          <div className="relative flex-1">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              placeholder={t('steps.contact.fields.phone.placeholder')}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
              autoComplete="tel"
            />
          </div>
        </div>

        <label
          className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${
            formData.callDuringDay
              ? 'border-[#d4a574] bg-[#fff7ec]'
              : 'border-[#eadfcb] bg-white hover:border-[#d4a574]/70 hover:bg-[#fdf8f2]'
          }`}
        >
          <input
            type="checkbox"
            name="callDuringDay"
            checked={formData.callDuringDay}
            onChange={onChange}
            className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#d4a574]"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {t('steps.contact.callDuringDay.title')}
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {t('steps.contact.callDuringDay.help')}
            </div>
          </div>
        </label>

        <div className="mt-3 rounded-xl border border-[#d4a574]/30 bg-[#fdf8f2] p-3">
          <p className="text-xs text-[#2d2a26]">
            <strong>{t('steps.contact.privacy.title')}</strong>{' '}
            {t('steps.contact.privacy.body')}
          </p>
        </div>
      </div>
    </div>
  );
};
