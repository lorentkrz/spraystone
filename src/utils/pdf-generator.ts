import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FormData } from "@/types";
import { LOCALE_BY_LANGUAGE, translations, type Language } from "@/i18n/translations";

type FinishId = Exclude<FormData["finish"], "">;
type GeneratedImagesByFinish = Partial<Record<FinishId, string>>;

const LOGO_PATH = "/spraystone-logo.png";
let logoCache: string | null = null;

const STORAGE_KEY = "spraystone-lang";

const loadLogo = async (): Promise<string | null> => {
  if (logoCache) return logoCache;
  try {
    const response = await fetch(LOGO_PATH);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    logoCache = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
};

const parseNumber = (s: string | number | null | undefined): number | null => {
  if (!s) return null;
  const digits = String(s).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
};

const roundToNearest = (value: number, step: number) =>
  Math.round(value / step) * step;

const isLanguage = (value: string): value is Language =>
  value === "en" || value === "fr" || value === "nl";

const getInitialLanguage = (): Language => {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (stored && isLanguage(stored)) return stored;
  } catch {
    // ignore
  }
  return "en";
};

const getByPath = (obj: any, key: string): unknown =>
  key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);

const createTranslator = (lang: Language) => {
  return (key: string, vars?: Record<string, string | number>): string => {
    const primary = getByPath((translations as any)[lang], key);
    const fallback = getByPath((translations as any).en, key);
    const template =
      typeof primary === "string"
        ? primary
        : typeof fallback === "string"
          ? fallback
          : key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(vars, name)
        ? String(vars[name])
        : match
    );
  };
};

const parseSurfaceAreaAverage = (
  sa: string | number | null | undefined
): number | null => {
  if (sa === undefined || sa === null) return null;
  if (typeof sa === "number") return sa;
  const str = String(sa).trim();
  if (!str) return null;
  if (/^<\s*50/.test(str)) return 40;
  if (/^>\s*150/.test(str)) return 180;
  const range = str.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

const deriveFixedEstimateAmount = (text: string, formData: FormData): number => {
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
    const area = parseSurfaceAreaAverage(formData.surfaceArea) || 100;
    if (lo && hi) {
      const avg = (lo + hi) / 2;
      return roundToNearest(avg * area, 100);
    }
  }

  const fallbackArea = parseSurfaceAreaAverage(formData.surfaceArea) || 100;
  const fallbackRatePerM2 = 115;
  return roundToNearest(fallbackArea * fallbackRatePerM2, 100);
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

const formatPhone = (data: FormData): string => {
  if (!data.phone) return "—";
  return `${data.phonePrefix || ""} ${data.phone}`.trim();
};

const detectImageType = (dataUrl: string): "PNG" | "JPEG" => {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "JPEG";
  return "JPEG";
};

export const generateQuotePDF = async (
  formData: FormData,
  result: string,
  generatedImagesByFinish: GeneratedImagesByFinish,
  uploadedImage: string | null
): Promise<void> => {
  const lang = getInitialLanguage();
  const locale = LOCALE_BY_LANGUAGE[lang] || "en-GB";
  const t = createTranslator(lang);
  const formatEur = (value: number, options: Intl.NumberFormatOptions = {}) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      ...options,
    }).format(value);

  const doc = new jsPDF();
  const today = new Date().toLocaleDateString(locale);
  const estimateAmount = deriveFixedEstimateAmount(result, formData);
  const estimateLabel = formatEur(estimateAmount, { maximumFractionDigits: 0 });
  const maxDurationMonths = getMaxDurationMonths(estimateAmount);
  const durationMonths = Math.min(48, maxDurationMonths);
  const installment = calculateMonthlyInstallment(
    estimateAmount,
    durationMonths,
    LOAN_TAEG
  );
  const logoData = typeof window !== "undefined" ? await loadLogo() : null;

  doc.setFillColor(245, 241, 232);
  doc.rect(0, 0, 210, 297, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 10, 190, 32, 4, 4, "F");
  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 14, 32, 18);
  }
  doc.setTextColor(45, 42, 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(t("pdf.header.title"), 50, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(t("pdf.header.subtitle"), 50, 32);
  doc.text(t("pdf.header.date", { date: today }), 150, 32);

  const projectData: Array<[string, string]> = [
    [t("pdf.fields.client"), formData.name || "—"],
    [t("pdf.fields.email"), formData.email || "—"],
    [t("pdf.fields.phone"), formatPhone(formData)],
    [
      t("pdf.fields.callback"),
      formData.callDuringDay ? t("pdf.callback.requested") : t("pdf.callback.notRequested"),
    ],
    [t("pdf.fields.address"), formData.address || "—"],
    [
      t("pdf.fields.facadeType"),
      formData.facadeType
        ? t(`steps.facadeType.options.${formData.facadeType}.label`)
        : "—",
    ],
    [
      t("pdf.fields.condition"),
      formData.condition ? t(`steps.condition.options.${formData.condition}`) : "—",
    ],
    [
      t("pdf.fields.surfaceArea"),
      formData.surfaceArea && formData.surfaceArea !== "unknown"
        ? `${formData.surfaceArea} m\u00B2`
        : t("common.toBeMeasured"),
    ],
    [
      t("pdf.fields.desiredFinish"),
      formData.finish ? t(`steps.finish.options.${formData.finish}.title`) : "—",
    ],
    [
      t("pdf.fields.treatments"),
      formData.treatments?.length
        ? formData.treatments.map((tr) => t(`steps.treatments.options.${tr}.title`)).join(", ")
        : t("common.none"),
    ],
    [
      t("pdf.fields.timeline"),
      formData.timeline ? t(`steps.timeline.options.${formData.timeline}`) : "—",
    ],
  ];

  autoTable(doc, {
    startY: 52,
    head: [[t("pdf.table.item"), t("pdf.table.details")]],
    body: projectData,
    theme: "striped",
    headStyles: { fillColor: [212, 165, 116], textColor: 255, fontSize: 11 },
    bodyStyles: { textColor: 45, fontSize: 10 },
    styles: { cellPadding: 3 },
    margin: { left: 10, right: 10 },
  });

  let yPos = (doc as any).lastAutoTable.finalY + 10;

  const DEFAULT_FINISH_ORDER: FinishId[] = [
    "natural-stone",
    "smooth",
    "textured",
    "other",
    "suggest",
  ];
  const defaultFinishSet = new Set(DEFAULT_FINISH_ORDER);
  const orderedGeneratedFinishes = DEFAULT_FINISH_ORDER.filter((finish) =>
    Boolean(generatedImagesByFinish[finish])
  );
  const extraGeneratedFinishes = (Object.keys(generatedImagesByFinish) as FinishId[]).filter(
    (finish) => !defaultFinishSet.has(finish) && Boolean(generatedImagesByFinish[finish])
  );
  const generatedFinishIds = [...orderedGeneratedFinishes, ...extraGeneratedFinishes];

  if (uploadedImage || generatedFinishIds.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(45, 42, 38);
    doc.text(t("pdf.visualization.title"), 10, yPos);
    yPos += 6;

    const colLeftX = 10;
    const colRightX = 110;
    const colWidth = 90;
    const imgHeight = 60;
    const labelOffsetY = 4;
    const imgOffsetY = 6;
    const rowGap = 10;
    const pageBottomY = 270;

    const blocks: Array<{ label: string; dataUrl: string }> = [];
    if (uploadedImage) {
      blocks.push({ label: t("pdf.visualization.before"), dataUrl: uploadedImage });
    }
    for (const finish of generatedFinishIds) {
      const dataUrl = generatedImagesByFinish[finish];
      if (!dataUrl) continue;
      const finishLabel = t(`results.texture.options.${finish}`);
      blocks.push({
        label: `${t("pdf.visualization.after")} — ${finishLabel}`,
        dataUrl,
      });
    }

    let x = colLeftX;
    let y = yPos;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(45, 42, 38);

    for (const block of blocks) {
      if (x === colLeftX && y + imgOffsetY + imgHeight > pageBottomY) {
        doc.addPage();
        y = 20;
      }

      doc.text(block.label, x, y + labelOffsetY);
      try {
        doc.addImage(
          block.dataUrl,
          detectImageType(block.dataUrl),
          x,
          y + imgOffsetY,
          colWidth,
          imgHeight
        );
      } catch (error) {
        console.warn("Unable to render visualization image", error);
      }

      if (x === colLeftX) {
        x = colRightX;
      } else {
        x = colLeftX;
        y += imgOffsetY + imgHeight + rowGap;
      }
    }

    yPos = y + imgOffsetY + imgHeight + 2;
  }

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(45, 42, 38);
  doc.text(t("pdf.investment.title"), 10, yPos);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(45, 42, 38);
  doc.text(estimateLabel, 10, yPos + 8);

  if (installment) {
    const taegPercent = (LOAN_TAEG * 100).toFixed(2);
    const calcRatePercent = (loanCalcRate(LOAN_TAEG) * 100).toFixed(2);
    const installmentLabel = formatEur(installment, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    doc.setTextColor(70, 70, 70);
    doc.setFontSize(9);
    doc.text(
      t("pdf.investment.financingExample", {
        months: durationMonths,
        installment: installmentLabel,
        taeg: taegPercent,
        calcRate: calcRatePercent,
        maxMonths: maxDurationMonths,
      }),
      10,
      yPos + 14
    );
  }

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(
    t("pdf.investment.disclaimer"),
    10,
    yPos + 20
  );

  doc.setTextColor(140, 124, 104);
  doc.setFontSize(8);
  doc.text(
    t("pdf.footer.note"),
    10,
    285
  );
  doc.text(t("pdf.footer.contact"), 10, 290);

  const fileName = `Spraystone_Quote_${formData.name || "Client"}_${today.replace(
    /\//g,
    "-"
  )}.pdf`;
  doc.save(fileName);
};
