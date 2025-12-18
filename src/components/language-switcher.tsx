import React from "react";
import { LANGUAGE_LABEL, type Language } from "@/i18n/translations";
import { useI18n } from "@/i18n";

const LANGS: Language[] = ["en", "fr", "nl"];

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useI18n();

  return (
    <div
      className="inline-flex rounded-full border border-[#d4a574]/40 bg-white/80 p-1 shadow-sm"
      role="group"
      aria-label="Language"
    >
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition ${
              active
                ? "bg-white text-[#2d2a26] shadow"
                : "text-[#6b5e4f] hover:bg-white/60"
            }`}
            aria-pressed={active}
          >
            {LANGUAGE_LABEL[l]}
          </button>
        );
      })}
    </div>
  );
};

