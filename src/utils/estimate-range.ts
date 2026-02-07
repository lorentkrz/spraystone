import type { FormData } from "@/types";

export type EstimateRange = { min: number; max: number };

const ESTIMATE_RATE_MIN = 130;
const ESTIMATE_RATE_MAX = 140;
const DEFAULT_SURFACE_AREA = 100;

const parseNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const roundToNearest = (value: number, step: number) =>
  Math.round(value / step) * step;

const normalizeRange = (min: number, max: number): EstimateRange => {
  const orderedMin = Math.min(min, max);
  const orderedMax = Math.max(min, max);
  return {
    min: roundToNearest(orderedMin, 100),
    max: roundToNearest(orderedMax, 100),
  };
};

export const parseSurfaceAreaAverage = (
  sa: FormData["surfaceArea"]
): number | null => {
  if (sa === undefined || sa === null) return null;
  if (typeof sa === "number") return sa;
  const str = String(sa).trim();
  if (!str || str === "unknown") return null;
  if (/^<\s*50/.test(str)) return 40;
  if (/^>\s*150/.test(str)) return 180;
  const range = str.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
  }
  const num = parseFloat(str);
  return Number.isNaN(num) ? null : num;
};

export const deriveEstimateRange = (
  text: string,
  surfaceArea: FormData["surfaceArea"]
): EstimateRange => {
  const rangeMatch =
    text.match(
      /TOTAL\s+PROJECT\s+COST[^\d]*([\d.,]+)\s*(?:-|\u2013|\u2014|to)\s*([\d.,]+)/i
    ) ||
    text.match(/TOTAL[^\d]*([\d.,]+)\s*(?:-|\u2013|\u2014|to)\s*([\d.,]+)/i);
  if (rangeMatch) {
    const min = parseNumber(rangeMatch[1]);
    const max = parseNumber(rangeMatch[2]);
    if (min !== null && max !== null) {
      return normalizeRange(min, max);
    }
  }

  const perM2Match = text.match(
    /(?:\u20AC|\bEUR\b)?\s*([\d.,]+)\s*(?:-|\u2013|\u2014|to)\s*(?:\u20AC|\bEUR\b)?\s*([\d.,]+)\s*\/\s*m(?:\u00B2|2)/i
  );
  if (perM2Match) {
    const minRate = parseNumber(perM2Match[1]);
    const maxRate = parseNumber(perM2Match[2]);
    const area = parseSurfaceAreaAverage(surfaceArea) || DEFAULT_SURFACE_AREA;
    if (minRate !== null && maxRate !== null) {
      return normalizeRange(minRate * area, maxRate * area);
    }
  }

  const area = parseSurfaceAreaAverage(surfaceArea) || DEFAULT_SURFACE_AREA;
  return normalizeRange(area * ESTIMATE_RATE_MIN, area * ESTIMATE_RATE_MAX);
};

export const deriveEstimateMidpoint = (range: EstimateRange, step = 100) =>
  roundToNearest((range.min + range.max) / 2, step);
