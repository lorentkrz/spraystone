import { en } from "./en";
import { fr } from "./fr";
import { nl } from "./nl";

export type Language = "en" | "fr" | "nl";

export const LANGUAGE_LABEL: Record<Language, string> = {
  en: "EN",
  fr: "FR",
  nl: "NL",
};

export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: "en-GB",
  fr: "fr-BE",
  nl: "nl-BE",
};

export const translations = { en, fr, nl } as const;

