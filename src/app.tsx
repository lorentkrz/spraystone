import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StepIndicator } from "@/components/step-indicator";
import { Step1Address } from "@/components/step-1-address";
import { Step2FacadeType } from "@/components/step-2-facade-type";
import { Step3Condition } from "@/components/step-3-condition";
import { Step4Surface } from "@/components/step-4-surface";
import { Step5Finish } from "@/components/step-5-finish";
import { Step6Image } from "@/components/step-6-image";
import { Step7Treatments } from "@/components/step-7-treatments";
import { Step8Timeline } from "@/components/step-8-timeline";
import { Step9Contact } from "@/components/step-9-contact";
import { ResultsPage } from "@/components/results-page";
import { GameModal } from "@/components/game-modal";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n";
import type { FormData, PreviewFinish, RetryOptions, Treatment } from "@/types";
import { cropDataUrl, letterboxToFile } from "@/utils/image-processing";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const LEAD_GATING_MODE = import.meta.env.VITE_LEAD_GATING_MODE || "before";
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "false";
const IMAGE_PROVIDER = import.meta.env.VITE_IMAGE_PROVIDER || "proxy-openai";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const AZURE_IMAGE_ENDPOINT =
  import.meta.env.VITE_AZURE_IMAGE_GENERATIONS_ENDPOINT || "";
const AZURE_IMAGE_EDITS_ENDPOINT =
  import.meta.env.VITE_AZURE_IMAGE_EDITS_ENDPOINT || "";
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || "";
const TEXT_PROVIDER = import.meta.env.VITE_TEXT_PROVIDER || "none";
const OPENAI_CHAT_MODEL = import.meta.env.VITE_OPENAI_CHAT_MODEL || "gpt-4o";
const OPENAI_IMAGE_MODEL =
  import.meta.env.VITE_OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const AZURE_CHAT_COMPLETIONS_ENDPOINT =
  import.meta.env.VITE_AZURE_CHAT_COMPLETIONS_ENDPOINT || "";
const PROXY_IMAGE_ENDPOINT =
  import.meta.env.VITE_PROXY_IMAGE_ENDPOINT ||
  "http://localhost:8787/api/apply-spraystone";
const IMAGE_GENERATION_ETA_SECONDS = Number(
  import.meta.env.VITE_IMAGE_GENERATION_ETA_SECONDS || 30
);

type FinishId = Exclude<FormData["finish"], "">;
type GeneratedImagesByFinish = Partial<Record<FinishId, string>>;

const RESULT_FINISHES = [
  "natural-stone",
  "smooth",
  "textured",
  "other",
] as const satisfies ReadonlyArray<PreviewFinish>;

const isPreviewFinish = (value: string): value is PreviewFinish =>
  (RESULT_FINISHES as readonly string[]).includes(value);

const DEFAULT_PHONE_PREFIX = "+32";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
// const GAME_BEFORE_IMAGE = "/game-before.jpg";
// const GAME_AFTER_IMAGE = "/game-after.jpg";
const SPRAYSTONE_REFERENCE_MAP: Record<string, string> = {
  "natural-stone": "/limestone-classic.jpg",
  smooth: "/render-neutral.jpg",
  textured: "/limestone-textured.jpg",
  suggest: "/render-neutral.jpg",
  other: "/brick-warm.jpg",
  brick: "/brick-warm.jpg",
  render: "/render-neutral.jpg",
  concrete: "/limestone-textured.jpg",
  painted: "/render-neutral.jpg",
};

const DEFAULT_REFERENCE_TEXTURE = "/limestone-classic.jpg";

const FINISH_LABELS: Record<string, string> = {
  "natural-stone": "Natural stone Spraystone finish",
  smooth: "Smooth or textured render",
  textured: "Textured Spraystone finish",
  suggest: "Suggested by Spraystone",
  other: "Custom Spraystone hybrid",
};

const FACADE_LABELS: Record<string, string> = {
  brick: "Brick / masonry",
  render: "Render / plaster",
  concrete: "Concrete block",
  painted: "Painted facade",
  other: "Mixed material",
};

const CONDITION_LABELS: Record<string, string> = {
  cracks: "Cracks or peeling",
  moss: "Moss / moisture",
  good: "Good condition",
  unknown: "Condition unknown",
};

const TREATMENT_LABELS: Record<string, string> = {
  "water-repellent": "Water-repellent protection",
  "anti-stain": "Anti-stain / anti-pollution",
  none: "No additional treatments",
  unknown: "To be decided with an expert",
};
function App() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    address: "",
    facadeType: "",
    condition: "",
    surfaceArea: "",
    finish: RESULT_FINISHES[0],
    previewFinishes: [RESULT_FINISHES[0]],
    treatments: [],
    timeline: "",
    name: "",
    email: "",
    phonePrefix: DEFAULT_PHONE_PREFIX,
    phone: "",
    callDuringDay: false,
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedImagesByFinish, setGeneratedImagesByFinish] =
    useState<GeneratedImagesByFinish>({});
  const [activeGeneratedFinish, setActiveGeneratedFinish] =
    useState<FinishId | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isGameVisible, setIsGameVisible] = useState(false);
  const [gameProgress, setGameProgress] = useState(0);
  const [gameSessionId, setGameSessionId] = useState(0);
  const [forceGamePreview, setForceGamePreview] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    "forward" | "backward"
  >("forward");

  const totalSteps = 9;

  const fileReaderToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const getReferencePath = (finish: string) =>
    SPRAYSTONE_REFERENCE_MAP[finish] || DEFAULT_REFERENCE_TEXTURE;

  const updateGameProgress = (value: number) => {
    setGameProgress((prev) => (value > prev ? value : prev));
  };

  // const startGamePreview = () => {
  //   setForceGamePreview(true);
  //   setIsGameVisible(true);
  //   setGameProgress(0);
  //   setGameSessionId((prev) => prev + 1);
  // };

  const handleGameClose = () => {
    setIsGameVisible(false);
    setForceGamePreview(false);
  };

  const handleResumeGame = () => {
    setIsGameVisible(true);
  };

  const getMimeFromDataUrl = (dataUrl?: string | null) => {
    if (!dataUrl) return "image/jpeg";
    const match = dataUrl.match(/^data:(.*?);base64,/);
    return match?.[1] || "image/jpeg";
  };
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  };

  const fetchReferenceDataUrl = async (
    finish: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(getReferencePath(finish));
      if (!response.ok) return null;
      const blob = await response.blob();
      return await fileReaderToDataUrl(blob);
    } catch (err) {
      console.warn("Failed to load material reference", err);
      return null;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as unknown as {
      name: string;
      value: string;
      type?: string;
      checked?: boolean;
    };

    const value =
      target.type === "checkbox" ? Boolean(target.checked) : target.value;
    setError(null);
    setFormData((prev) => {
      const next = { ...prev, [target.name]: value } as FormData;

      if (
        target.name === "finish" &&
        typeof value === "string" &&
        prev.finish !== value &&
        isPreviewFinish(value)
      ) {
        const current = prev.previewFinishes?.length
          ? prev.previewFinishes
          : [...RESULT_FINISHES];
        const set = new Set(current);
        set.add(value);
        next.previewFinishes = RESULT_FINISHES.filter((finish) => set.has(finish));
      }

      return next;
    });
  };

  const handleTogglePreviewFinish = (finish: PreviewFinish) => {
    setError(null);
    setFormData((prev) => {
      const current = prev.previewFinishes?.length
        ? prev.previewFinishes
        : [...RESULT_FINISHES];
      const set = new Set(current);
      const wasSelected = set.has(finish);

      if (set.has(finish)) {
        if (set.size === 1) return prev;
        set.delete(finish);
      } else {
        set.add(finish);
      }

      const nextPreviewFinishes = RESULT_FINISHES.filter((id) => set.has(id));

      const primaryFinish = prev.finish;
      const primaryStillSelected =
        isPreviewFinish(primaryFinish) && nextPreviewFinishes.includes(primaryFinish);

      const nextPrimaryFinish = !wasSelected
        ? finish
        : primaryFinish === finish || !primaryStillSelected
          ? nextPreviewFinishes[0]
          : primaryFinish;

      return {
        ...prev,
        finish: nextPrimaryFinish,
        previewFinishes: nextPreviewFinishes,
      };
    });
  };

  const fileToBase64NoPrefix = async (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.replace(/^data:.+;base64,/, ""));
        } else {
          reject(new Error("FileReader result is not a string"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleTreatmentChange = (treatment: Treatment | "__clear_all__") => {
    if (treatment === "__clear_all__") {
      setError(null);
      setFormData((prev) => ({ ...prev, treatments: [] }));
      return;
    }
    setError(null);
    setFormData((prev) => {
      const current = prev.treatments ?? [];
      const isExclusive = treatment === "none" || treatment === "unknown";

      if (isExclusive) {
        return {
          ...prev,
          treatments: current.includes(treatment) ? [] : [treatment],
        };
      }

      const cleaned = current.filter((t) => t !== "none" && t !== "unknown");
      const next = cleaned.includes(treatment)
        ? cleaned.filter((t) => t !== treatment)
        : [...cleaned, treatment];

      return { ...prev, treatments: next };
    });
  };

  const getSelectionContext = (overrides: { finish?: string } = {}) => {
    const finish = overrides.finish ?? formData.finish;
    return {
      address: formData.address,
      facadeType: formData.facadeType,
      condition: formData.condition,
      surfaceArea: formData.surfaceArea,
      finish,
      finishLabel:
        FINISH_LABELS[finish as keyof typeof FINISH_LABELS] ||
        FINISH_LABELS["natural-stone"],
      treatments: formData.treatments,
      timeline: formData.timeline,
    };
  };

  const isHeicFile = (file: File) => {
    const name = file.name.toLowerCase();
    const type = (file.type || "").toLowerCase();
    return (
      type === "image/heic" ||
      type === "image/heif" ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    );
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    const heic2anyModule = await import("heic2any");
    const heic2any = (heic2anyModule as any).default ?? (heic2anyModule as any);
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
      type: "image/jpeg",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setError(null);
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error("max_size");
      }
      const isImageType = (file.type || "").toLowerCase().startsWith("image/");
      if (!isImageType && !isHeicFile(file)) {
        throw new Error("invalid_type");
      }
      const normalizedFile = isHeicFile(file)
        ? await convertHeicToJpeg(file)
        : file;
      setUploadedImage(normalizedFile);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(normalizedFile);
    } catch (err) {
      console.error("Unable to process image upload:", err);
      setUploadedImage(null);
      setImagePreview(null);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "max_size") {
        setError(t("errors.uploadTooLarge"));
      } else if (msg === "invalid_type") {
        setError(t("errors.uploadInvalidType"));
      } else {
        setError(t("errors.uploadProcessFailed"));
      }
    } finally {
      input.value = "";
    }
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: base64EncodedData,
        mimeType: file.type,
      },
    };
  };

  const withRetry = async (
    fn: () => Promise<any>,
    options: RetryOptions = {}
  ) => {
    const { retries = 3, baseDelayMs = 1200, onRetry } = options;
    let attempt = 0;
    let lastErr: Error | unknown;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (/\b(400|401|403|404|422)\b/.test(msg) && !/\b429\b/.test(msg)) {
          break;
        }
        attempt += 1;
        if (attempt >= retries) break;
        const delay = Math.round(
          baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 400
        );
        if (onRetry)
          onRetry(
            attempt,
            retries,
            err instanceof Error ? err : new Error(String(err))
          );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastErr;
  };

  const generateImagePrompt = (options?: {
    hasReference?: boolean;
    finishLabel?: string;
    finishId?: FinishId;
  }) => {
    const finishMap: Record<string, string> = {
      "natural-stone":
        "Belgian limestone inspired Spraystone blocks with soft chiseled edges, pale silver-grey palette, matte mineral texture, and subtle aggregate sparkle",
      smooth:
        "Modern smooth render with micro-texture, even tone, delicate sheen, and razor-sharp transitions around openings",
      textured:
        "Decorative mineral coating with layered depth, gentle relief, highlighted shadows, and artisanal trowel marks",
      suggest:
        "Premium Spraystone standard set: neutral stone blend with light amber undertones and authentic joint patterning",
      other:
        "Custom Spraystone hybrid with warm brick / masonry cues, terracotta-beige undertones, subtle joint lines, and a crisp mineral texture",
    };

    const finishId =
      options?.finishId || ((formData.finish || "natural-stone") as FinishId);
    const finishDescription = finishMap[finishId] || finishMap["natural-stone"];
    const treatments = formData.treatments?.length
      ? formData.treatments.map((t) => TREATMENT_LABELS[t] || t).join(", ")
      : "none";
    const area = (() => {
      const value = parseSurfaceAreaAverage(formData.surfaceArea);
      return isNaN(value) ? "unknown" : `${value} m\u00B2`;
    })();
    const facade = FACADE_LABELS[formData.facadeType] || "residential facade";
    const condition = CONDITION_LABELS[formData.condition] || "good condition";
    const finishLabel =
      options?.finishLabel ||
      FINISH_LABELS[finishId as keyof typeof FINISH_LABELS] ||
      FINISH_LABELS["natural-stone"];
    const referenceInstruction = options?.hasReference
      ? "Use Image B as the exact Spraystone reference for tone, aggregate density, joint depth, and surface reflectance."
      : "If Image B is unavailable, approximate the Spraystone reference described below with matching tone, aggregate density, joint depth, and reflectance.";
    const selectionJson = JSON.stringify(getSelectionContext({ finish: finishId }));

    const materialStyleSection = [
      referenceInstruction,
      `Target look: ${finishLabel} - ${finishDescription}.`,
      finishId === "other"
        ? "If a brick/masonry pattern is used, keep a realistic brick scale (~ 21 x 6.5 cm) with consistent mortar joints."
        : "Block scale ≈ 25 × 8 cm with tight joints, deep mortar lines, and natural variation around reveals.",
      "Surface character: matte mineral texture with subtle aggregate sparkle and crisp transitions around windows and doors.",
      "If scale ambiguity occurs, keep the pattern scale realistic and consistent across the full facade.",
    ]
      .map((line) => `- ${line}`)
      .join("\n");

    const constraintSection = [
      "Preserve the full framing of Image A: no crop, zoom, rotate, or change in aspect ratio.",
      "Preserve all architecture, proportions, rooflines, windows, doors, trims, railings, and surroundings exactly as in Image A.",
      "Preserve all architectural geometry, framing, and fenestration 1:1 from Image A.",
      "Replace only the exterior wall surfaces (brick, render, plaster, painted areas) with the Spraystone material.",
      "Do not modify window frames, glass reflections, landscaping, or sky.",
      "Do not add or remove people, vehicles, plants, furniture, or any new scene elements.",
      "Maintain camera angle, focal length, and perspective identical to Image A.",
      "Lighting must remain natural daylight with soft shadows and no HDR bloom.",
      "Keep fine details (mortar lines, sills, joints, edges, stains) crisp and physically plausible—avoid plastic smoothing.",
      "Ensure texture scale is consistent and shading is physically plausible.",
      "Final output must read as a real renovation photo (photoreal), not an illustration or 3D render.",
    ]
      .map((line) => `- ${line}`)
      .join("\n");

    return [
      "TASK:",
      "Edit Image A (user-uploaded building facade) by applying the Spraystone material from Image B to replace only the wall finish.",
      `Project details: Facade type ${facade}, condition ${condition}, estimated surface ${area}, requested treatments: ${treatments}, desired finish: ${finishLabel}.`,
      "MATERIAL & STYLE:",
      materialStyleSection,
      "SITE CONTEXT (from user selection):",
      selectionJson,
      "CONSTRAINTS:",
      constraintSection,
      "OUTPUT:",
      "Produce a single high-resolution photorealistic image matching Image A's framing and aspect ratio, showing Image A's facade coated with the Spraystone finish from Image B, seamlessly blended and tone-matched.",
      "END NOTE:",
      "Final result = Image A edited using material cues from Image B.",
    ].join("\n\n");
  };
  const generatePrompt = () => {
    return `You are a facade renovation expert for Spraystone. Analyze the provided facade image and give a SHORT, practical estimate.

**CLIENT INFO:**
- Address: ${formData.address || "Not provided"}
- Facade Type: ${formData.facadeType || "Unknown"}
- Condition: ${formData.condition || "Not specified"}
- Surface Area: ${formData.surfaceArea || "To estimate"} m\u00B2
- Desired Finish: ${formData.finish || "Natural stone (Spraystone)"}
- Treatments: ${formData.treatments.join(", ") || "None"}
- Timeline: ${formData.timeline || "TBD"}

Provide a CONCISE analysis (max 400 words) with:

1. **FACADE ASSESSMENT** (2-3 sentences):
   - Actual facade type & condition
   - Current issues visible

2. **BEFORE/AFTER VISUALIZATION** (3-4 sentences):
   - How it looks NOW (color, texture, state)
   - How it will look AFTER with Spraystone natural stone finish
   - Specific transformation details (what changes visually)

3. **RECOMMENDATIONS** (bullet points):
   - Prep work needed
   - Best Spraystone finish for this facade
   - Value of requested treatments

4. **PRICING ESTIMATE**:
   - Estimate total surface area from photo if not provided
   - Price range: \u20AC80-150/m\u00B2 (including prep, coating, treatments)
   - TOTAL PROJECT COST in \u20AC (be specific, e.g., "\u20AC6,500 - \u20AC9,800")

5. **TIMELINE**: Realistic duration (e.g., "3-4 weeks")

Keep it SHORT, practical, and focused on the visual transformation and pricing. No long letters or formalities.`;
  };
  const prepareUploadForGeneration = async () => {
    if (!uploadedImage || !imagePreview) {
      throw new Error("missing_upload");
    }
    const prepared = await letterboxToFile(
      imagePreview,
      { width: 1024, height: 1024 },
      {
        fileName: uploadedImage.name || "spraystone-upload.png",
        mimeType: "image/png",
        background: "#fdf8f2",
      }
    );
    return { uploadForGeneration: prepared.file, cropRect: prepared.crop };
  };

  const createProgressReporter = (options?: {
    prefix?: string;
    segment?: { index: number; total: number };
  }) => {
    return (message: string, progressHint?: number) => {
      const labeled = options?.prefix ? `${options.prefix} — ${message}` : message;
      setLoadingProgress(labeled);
      if (typeof progressHint !== "number") return;

      if (options?.segment) {
        const { index, total } = options.segment;
        const base = (index / total) * 100;
        const span = 100 / total;
        const mapped = base + (progressHint * span) / 100;
        updateGameProgress(Math.round(mapped));
        return;
      }

      updateGameProgress(progressHint);
    };
  };

  const generateImageForFinish = async (
    finish: FinishId,
    prepared: { uploadForGeneration: File; cropRect: any },
    reportProgress: (message: string, progressHint?: number) => void
  ): Promise<string | null> => {
    reportProgress(t("progress.image.lockingReference"), 18);
    const materialReferenceDataUrl = await fetchReferenceDataUrl(finish);
    const materialReferenceMimeType = getMimeFromDataUrl(materialReferenceDataUrl);
    const materialReferenceBase64 = materialReferenceDataUrl
      ? materialReferenceDataUrl.split(",")[1]
      : null;

    const finishLabelForPrompt =
      FINISH_LABELS[finish as keyof typeof FINISH_LABELS] ||
      FINISH_LABELS["natural-stone"];
    const imagePrompt = generateImagePrompt({
      hasReference: Boolean(materialReferenceBase64),
      finishLabel: finishLabelForPrompt,
      finishId: finish,
    });

    reportProgress(t("progress.image.assemblingBrief"), 32);
    const selectionContext = getSelectionContext({ finish });
    const selectionJson = JSON.stringify(selectionContext);
    reportProgress(t("progress.image.sendingReferences"), 45);

    const { uploadForGeneration, cropRect } = prepared;
    let output: string | null = null;

    if (IMAGE_PROVIDER === "azure-openai") {
      if (!AZURE_IMAGE_ENDPOINT || !AZURE_OPENAI_API_KEY) {
        setError(t("errors.azureImageNotConfigured"));
        return null;
      }

      let b64: string | null = null;
      try {
        const form = new FormData();
        form.append("prompt", imagePrompt);
        form.append("size", "1024x1024");
        form.append("n", "1");
        form.append("response_format", "b64_json");
        form.append("image", uploadForGeneration);
        const editsJson = await withRetry(
          async () => {
            let response = await fetch(AZURE_IMAGE_EDITS_ENDPOINT, {
              method: "POST",
              headers: { Authorization: `Bearer ${AZURE_OPENAI_API_KEY}` },
              body: form,
            });
            if (response.status === 401 || response.status === 403) {
              response = await fetch(AZURE_IMAGE_EDITS_ENDPOINT, {
                method: "POST",
                headers: { "api-key": AZURE_OPENAI_API_KEY },
                body: form,
              });
            }
            if (!response.ok) {
              throw new Error(
                `Azure Edits ${response.status}: ${await response.text()}`
              );
            }
            return response.json();
          },
          {
            retries: 3,
            baseDelayMs: 2000,
            onRetry: (attempt, total) =>
              reportProgress(
                t("progress.image.refiningLayersRetry", { attempt, total }),
                52
              ),
          }
        );
        b64 = editsJson?.data?.[0]?.b64_json || null;
      } catch (editsErr) {
        console.warn("Azure edits failed, falling back to generations:", editsErr);
      }

      if (!b64) {
        const payload = {
          model: "dall-e-3",
          prompt: imagePrompt,
          size: "1024x1024",
          style: "vivid",
          quality: "standard",
          n: 1,
          response_format: "b64_json",
        };
        const genJson = await withRetry(
          async () => {
            let response = await fetch(AZURE_IMAGE_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${AZURE_OPENAI_API_KEY}`,
              },
              body: JSON.stringify(payload),
            });
            if (response.status === 401 || response.status === 403) {
              response = await fetch(AZURE_IMAGE_ENDPOINT, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "api-key": AZURE_OPENAI_API_KEY,
                },
                body: JSON.stringify(payload),
              });
            }
            if (!response.ok) {
              throw new Error(
                `Azure Generations ${response.status}: ${await response.text()}`
              );
            }
            return response.json();
          },
          {
            retries: 3,
            baseDelayMs: 2000,
            onRetry: (attempt, total) =>
              reportProgress(
                t("progress.image.calibratingFinishRetry", { attempt, total }),
                65
              ),
          }
        );
        b64 = genJson?.data?.[0]?.b64_json || null;
      }

      if (b64) {
        const raw = `data:image/png;base64,${b64}`;
        try {
          output = await cropDataUrl(raw, cropRect);
        } catch {
          output = raw;
        }
        reportProgress(t("progress.complete"), 96);
      } else {
        output = null;
      }
      return output;
    }

    if (IMAGE_PROVIDER === "openai") {
      if (!OPENAI_API_KEY) {
        setError(t("errors.openaiKeyMissing"));
        return null;
      }

      const promptWithContext = `${imagePrompt} Selection context JSON: ${selectionJson}`;
      const form = new FormData();
      form.append("model", OPENAI_IMAGE_MODEL);
      form.append("prompt", promptWithContext);
      form.append("size", "1024x1024");
      if (!OPENAI_IMAGE_MODEL.startsWith("gpt-image")) {
        form.append("response_format", "b64_json");
      }
      form.append("image[]", uploadForGeneration, uploadForGeneration.name || "facade.png");
      if (materialReferenceBase64) {
        const referenceBlob = base64ToBlob(materialReferenceBase64, materialReferenceMimeType);
        form.append(
          "image[]",
          new File([referenceBlob], "reference.jpg", {
            type: materialReferenceMimeType,
          })
        );
      }

      const data = await withRetry(
        async () => {
          const response = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: form,
          });
          if (!response.ok) {
            throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
          }
          return response.json();
        },
        {
          retries: 3,
          baseDelayMs: 2000,
          onRetry: (attempt, total) =>
            reportProgress(
              t("progress.image.craftingTextureRetry", { attempt, total }),
              72
            ),
        }
      );

      const first = data?.data?.[0];
      const b64 = first?.b64_json;
      const url = first?.url;
      let raw: string | null = null;
      if (b64) {
        raw = `data:image/png;base64,${b64}`;
      } else if (url) {
        const imageResponse = await fetch(url);
        if (!imageResponse.ok) {
          throw new Error(`OpenAI image fetch ${imageResponse.status}: ${await imageResponse.text()}`);
        }
        raw = await fileReaderToDataUrl(await imageResponse.blob());
      } else {
        return null;
      }
      try {
        output = await cropDataUrl(raw, cropRect);
      } catch {
        output = raw;
      }
      return output;
    }

    if (IMAGE_PROVIDER === "proxy-openai") {
      const base64 = await fileToBase64NoPrefix(uploadForGeneration);
      const resp = await withRetry(
        async () => {
          const response = await fetch(PROXY_IMAGE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              prompt: imagePrompt,
              size: "1024x1024",
              materialReferenceBase64,
              selections: selectionContext,
            }),
          });
          if (!response.ok) {
            throw new Error(`Proxy ${response.status}: ${await response.text()}`);
          }
          return response.json();
        },
        {
          retries: 3,
          baseDelayMs: 1200,
          onRetry: (attempt, total) =>
            reportProgress(t("progress.image.artisansRetry", { attempt, total }), 82),
        }
      );

      const b64 = resp?.output;
      if (!b64) return null;
      const raw = `data:image/png;base64,${b64}`;
      try {
        output = await cropDataUrl(raw, cropRect);
      } catch {
        output = raw;
      }
      return output;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const promptParts: any[] = [
      { text: imagePrompt },
      await fileToGenerativePart(uploadForGeneration),
    ];
    if (materialReferenceBase64) {
      promptParts.push({
        inlineData: {
          data: materialReferenceBase64,
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await withRetry(() => imageModel.generateContent(promptParts), {
      retries: 3,
      baseDelayMs: 2000,
      onRetry: (attempt, total) =>
        reportProgress(t("progress.image.geminiRetry", { attempt, total }), 78),
    });
    const response = await result.response;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        const raw = `data:${mimeType};base64,${imageData}`;
        try {
          output = await cropDataUrl(raw, cropRect);
        } catch {
          output = raw;
        }
        return output;
      }
    }

    return null;
  };

  const handleImageGenerationError = (err: unknown) => {
    console.error("Image generation error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("must be verified") || msg.includes("OpenAI 403")) {
      setError(t("errors.openaiOrgVerification"));
    } else if (msg === "missing_upload") {
      setError(t("errors.missingFacadeImage"));
    } else {
      setError(t("errors.imageGenerationFailed"));
    }
  };

  const startImageGenerationSession = () => {
    setGameProgress(0);
    setGameSessionId((prev) => prev + 1);
    setIsImageGenerating(true);
    setIsGameVisible(false);
    updateGameProgress(8);
  };

  const endImageGenerationSession = () => {
    updateGameProgress(100);
    setIsImageGenerating(false);
    setTimeout(() => {
      handleGameClose();
    }, 800);
    setLoadingProgress("");
  };

  const handleGenerateOneFinish = async () => {
    const hasAnyGenerated = Object.keys(generatedImagesByFinish).length > 0;
    if (isImageGenerating || hasAnyGenerated) return;
    if (!formData.finish) return;

    setError(null);
    startImageGenerationSession();
    try {
      const prepared = await prepareUploadForGeneration();
      const finish = formData.finish as FinishId;
      const finishLabel = t(`results.texture.options.${finish}`);
      const reportProgress = createProgressReporter({ prefix: finishLabel });
      const output = await generateImageForFinish(finish, prepared, reportProgress);
      if (!output) {
        throw new Error("image_generation_failed");
      }
      setGeneratedImagesByFinish({ [finish]: output });
      setActiveGeneratedFinish(finish);
    } catch (err) {
      handleImageGenerationError(err);
    } finally {
      endImageGenerationSession();
    }
  };

  const handleGenerateAllFinishes = async () => {
    const finishesToGenerate = formData.previewFinishes?.length
      ? formData.previewFinishes
      : [...RESULT_FINISHES];
    const hasAllGenerated = finishesToGenerate.every((finish) =>
      Boolean(generatedImagesByFinish[finish])
    );
    if (isImageGenerating || hasAllGenerated) return;
    if (!finishesToGenerate.length) return;

    setError(null);
    startImageGenerationSession();
    try {
      const prepared = await prepareUploadForGeneration();
      const total = finishesToGenerate.length;
      const nextImages: GeneratedImagesByFinish = { ...generatedImagesByFinish };

      for (let i = 0; i < total; i++) {
        const finish = finishesToGenerate[i];
        if (nextImages[finish]) continue;
        const finishLabel = t(`results.texture.options.${finish}`);
        const reportProgress = createProgressReporter({
          prefix: `${finishLabel} (${i + 1}/${total})`,
          segment: { index: i, total },
        });
        const output = await generateImageForFinish(finish, prepared, reportProgress);
        if (!output) {
          throw new Error("image_generation_failed");
        }
        nextImages[finish] = output;
      }

      setGeneratedImagesByFinish(nextImages);
      const preferred = isPreviewFinish(formData.finish)
        ? (formData.finish as FinishId)
        : null;
      const nextActive =
        (preferred && nextImages[preferred] ? preferred : null) ||
        finishesToGenerate.find((finish) => Boolean(nextImages[finish])) ||
        null;
      setActiveGeneratedFinish(nextActive);
    } catch (err) {
      handleImageGenerationError(err);
    } finally {
      endImageGenerationSession();
    }
  };

  const handleSelectGeneratedFinish = (finish: FinishId) => {
    if (!generatedImagesByFinish[finish]) return;
    setActiveGeneratedFinish(finish);
  };
  const generateMockAnalysis = () => {
    const surface = parseSurfaceAreaAverage(formData.surfaceArea) || 100;
    const lowPrice = Math.round(surface * 80);
    const highPrice = Math.round(surface * 150);
    const finishLabel =
      FINISH_LABELS[formData.finish as keyof typeof FINISH_LABELS] ||
      "Natural stone";

    return `**FACADE ASSESSMENT**:
The facade appears to be a ${formData.facadeType || "painted"} facade in ${
      formData.condition || "good"
    } condition. The current surface shows typical aging with some minor weathering. The structure is sound and suitable for Spraystone application.

**BEFORE/AFTER VISUALIZATION**:
Currently, your facade presents a standard finish with minimal texture. After Spraystone treatment with ${finishLabel}, it will display authentic stone texture with visible aggregate particles. The transformation will add depth, character, and premium aesthetic appeal while maintaining architectural integrity.

**RECOMMENDATIONS**:
- Surface preparation: thorough cleaning and minor crack repair recommended
- Best finish: ${finishLabel}
- ${
      formData.treatments.includes("water-repellent")
        ? "Water-repellent protection will extend facade lifespan significantly"
        : "Consider water-repellent treatment for long-term protection"
    }
- ${
      formData.treatments.includes("anti-stain")
        ? "Anti-stain treatment will keep the facade cleaner for longer"
        : "Anti-pollution treatment recommended for urban environments"
    }

**PRICING ESTIMATE**:
- Estimated surface area: ${surface} m\u00B2
- Price range: \u20AC80-150/m\u00B2 (including prep, coating, treatments)
- **TOTAL PROJECT COST: \u20AC${lowPrice.toLocaleString()} - \u20AC${highPrice.toLocaleString()}**

**TIMELINE**:
Realistic project duration: 3-4 weeks from approval to completion, including preparation, application, and curing time.`;
  };

  const parseSurfaceAreaAverage = (
    sa: string | number | null | undefined
  ): number => {
    if (!sa) return 100;
    if (typeof sa === "number") return sa;
    const str = String(sa).trim();
    if (/^<\s*50/.test(str)) return 40;
    if (/^>\s*150/.test(str)) return 180;
    const range = str.match(/(\d+)\s*-\s*(\d+)/);
    if (range) return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
    const num = parseFloat(str);
    return isNaN(num) ? 100 : num;
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, "");

  const isValidPhone = (phone: string) => normalizePhone(phone).length >= 8;

  const isValidAddress = (address: string) => address.trim().length >= 5;
  const handleSubmit = async () => {
    if (!uploadedImage) {
      setError(t("errors.missingFacadeImage"));
      return;
    }
    if (!isValidAddress(formData.address)) {
      setError(t("errors.invalidAddress"));
      return;
    }

    const hasEmail = formData.email.trim() !== "";
    const hasPhone = normalizePhone(formData.phone).length > 0;
    const needsLead = LEAD_GATING_MODE === "before";

    if (formData.callDuringDay && !isValidPhone(formData.phone)) {
      setError(t("errors.invalidPhoneForCall"));
      return;
    }

    if (needsLead) {
      if (!hasEmail && !hasPhone) {
        setError(t("errors.provideContactMethod"));
        return;
      }
      if (hasEmail && !isValidEmail(formData.email)) {
        setError(t("errors.invalidEmail"));
        return;
      }
      if (hasPhone && !isValidPhone(formData.phone)) {
        setError(t("errors.invalidPhone"));
        return;
      }
    } else {
      if (hasEmail && !isValidEmail(formData.email)) {
        setError(t("errors.invalidEmail"));
        return;
      }
      if (hasPhone && !isValidPhone(formData.phone)) {
        setError(t("errors.invalidPhone"));
        return;
      }
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(t("progress.preparingImage"));
    setGeneratedImagesByFinish({});
    setActiveGeneratedFinish(
      ((formData.finish && formData.finish !== "suggest"
        ? formData.finish
        : formData.previewFinishes?.[0] || RESULT_FINISHES[0]) as FinishId)
    );

    try {
      if (DEV_MODE) {
        setLoadingProgress(t("progress.generatingMock"));
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setResult(generateMockAnalysis());
        setLoadingProgress(t("progress.complete"));
        return;
      }

      const textPrompt = generatePrompt();
      let text = "";

      if (TEXT_PROVIDER === "azure-openai") {
        if (!AZURE_CHAT_COMPLETIONS_ENDPOINT || !AZURE_OPENAI_API_KEY) {
          setLoadingProgress(t("progress.chatNotConfigured"));
          text = generateMockAnalysis();
        } else {
          setLoadingProgress(t("progress.analyzingFacadeData"));
          const chatJson = await withRetry(
            async () => {
              const response = await fetch(AZURE_CHAT_COMPLETIONS_ENDPOINT, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${AZURE_OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a facade renovation expert for Spraystone. Be concise and precise.",
                    },
                    { role: "user", content: textPrompt },
                  ],
                  temperature: 0.6,
                  max_tokens: 900,
                }),
              });
              if (!response.ok) {
                throw new Error(
                  `Azure Chat ${response.status}: ${await response.text()}`
                );
              }
              return response.json();
            },
            {
              retries: 4,
              baseDelayMs: 1500,
              onRetry: (attempt, total) =>
                setLoadingProgress(
                  t("progress.analyzingRetry", {
                    attempt: attempt + 1,
                    total,
                  })
                ),
            }
          );
          text = chatJson?.choices?.[0]?.message?.content || "";
        }
      } else if (TEXT_PROVIDER === "openai") {
        if (!OPENAI_API_KEY) {
          setLoadingProgress(t("progress.chatKeyMissing"));
          text = generateMockAnalysis();
        } else {
          setLoadingProgress(t("progress.analyzingFacadeData"));
          const chatJson = await withRetry(
            async () => {
              const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: OPENAI_CHAT_MODEL,
                    messages: [
                      {
                        role: "system",
                        content:
                          "You are a facade renovation expert for Spraystone. Be concise and precise.",
                      },
                      { role: "user", content: textPrompt },
                    ],
                    temperature: 0.6,
                    max_tokens: 900,
                  }),
                }
              );
              if (!response.ok) {
                throw new Error(
                  `OpenAI Chat ${response.status}: ${await response.text()}`
                );
              }
              return response.json();
            },
            {
              retries: 4,
              baseDelayMs: 1500,
              onRetry: (attempt, total) =>
                setLoadingProgress(
                  t("progress.analyzingRetry", {
                    attempt: attempt + 1,
                    total,
                  })
                ),
            }
          );
          text = chatJson?.choices?.[0]?.message?.content || "";
        }
      } else if (TEXT_PROVIDER === "gemini") {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        setLoadingProgress(t("progress.analyzingFacade"));
        const aiResult = await withRetry(
          () => model.generateContent([textPrompt]),
          {
            retries: 5,
            baseDelayMs: 2000,
            onRetry: (attempt, total) =>
              setLoadingProgress(
                t("progress.analyzingRetry", {
                  attempt: attempt + 1,
                  total,
                })
              ),
          }
        );
        const response = await aiResult.response;
        text = response.text();
      } else {
        text = generateMockAnalysis();
      }
      setResult(text);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t("errors.generateFailed", { message }));
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  };
  const resetForm = () => {
    setCurrentStep(1);
    setTransitionDirection("forward");
    setFormData({
      address: "",
      facadeType: "",
      condition: "",
      surfaceArea: "",
      finish: RESULT_FINISHES[0],
      previewFinishes: [RESULT_FINISHES[0]],
      treatments: [],
      timeline: "",
      name: "",
      email: "",
      phonePrefix: DEFAULT_PHONE_PREFIX,
      phone: "",
      callDuringDay: false,
    });
    setUploadedImage(null);
    setImagePreview(null);
    setGeneratedImagesByFinish({});
    setActiveGeneratedFinish(null);
    setResult(null);
    setError(null);
  };

  const handleToggleCallDuringDay = () => {
    setFormData((prev) => ({ ...prev, callDuringDay: !prev.callDuringDay }));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return isValidAddress(formData.address);
      case 2:
        return formData.facadeType !== "";
      case 3:
        return formData.condition !== "";
      case 4:
        return formData.surfaceArea !== "";
      case 5:
        return formData.previewFinishes.length > 0;
      case 6:
        return uploadedImage !== null;
      case 7:
        return true;
      case 8:
        return formData.timeline !== "";
      case 9:
        if (formData.callDuringDay) {
          return isValidPhone(formData.phone);
        }

        if (LEAD_GATING_MODE !== "before") {
          if (formData.email && !isValidEmail(formData.email)) return false;
          if (formData.phone && !isValidPhone(formData.phone)) return false;
          return true;
        }

        const hasEmail = formData.email.trim() !== "";
        const hasPhone = normalizePhone(formData.phone).length > 0;
        if (!hasEmail && !hasPhone) return false;
        if (hasEmail && !isValidEmail(formData.email)) return false;
        if (hasPhone && !isValidPhone(formData.phone)) return false;
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (loading) return;
    if (!canGoNext()) {
      switch (currentStep) {
        case 1:
          setError(t("errors.step.address"));
          return;
        case 2:
          setError(t("errors.step.facadeType"));
          return;
        case 3:
          setError(t("errors.step.condition"));
          return;
        case 4:
          setError(t("errors.step.surface"));
          return;
        case 5:
          setError(t("errors.step.finish"));
          return;
        case 6:
          setError(t("errors.step.photo"));
          return;
        case 8:
          setError(t("errors.step.timeline"));
          return;
        case 9:
          if (formData.callDuringDay) {
            setError(t("errors.step.phoneForCall"));
            return;
          }
          setError(t("errors.step.emailOrPhone"));
          return;
        default:
          setError(t("errors.step.complete"));
          return;
      }
    }

    if (currentStep < totalSteps) {
      setError(null);
      setTransitionDirection("forward");
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setError(null);
      setTransitionDirection("backward");
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Address formData={formData} onChange={handleInputChange} />
        );
      case 2:
        return (
          <Step2FacadeType formData={formData} onChange={handleInputChange} />
        );
      case 3:
        return (
          <Step3Condition formData={formData} onChange={handleInputChange} />
        );
      case 4:
        return (
          <Step4Surface formData={formData} onChange={handleInputChange} />
        );
      case 5:
        return (
          <Step5Finish
            formData={formData}
            onChange={handleInputChange}
            onTogglePreviewFinish={handleTogglePreviewFinish}
          />
        );
      case 6:
        return (
          <Step6Image
            imagePreview={imagePreview}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
        );
      case 7:
        return (
          <Step7Treatments
            formData={formData}
            onTreatmentChange={handleTreatmentChange}
          />
        );
      case 8:
        return (
          <Step8Timeline formData={formData} onChange={handleInputChange} />
        );
      case 9:
        return (
          <Step9Contact formData={formData} onChange={handleInputChange} />
        );
      default:
        return null;
    }
  };

  const skipToResults = () => {
    setFormData({
      address: "123 Main Street, 1000 Brussels",
      facadeType: "brick",
      condition: "good",
      surfaceArea: "100",
      finish: "natural-stone",
      previewFinishes: ["natural-stone"],
      treatments: ["water-repellent"],
      timeline: "1-3months",
      name: "John Doe",
      email: "john@example.com",
      phonePrefix: DEFAULT_PHONE_PREFIX,
      phone: "123 456 789",
      callDuringDay: false,
    });
    setTransitionDirection("forward");
    setResult(generateMockAnalysis());
  };

  const stepAnimationClass =
    transitionDirection === "forward"
      ? "step-animate-forward"
      : "step-animate-backward";
  const mainForm = (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden p-2 sm:p-6 lg:p-10"
      style={{
        background: "linear-gradient(135deg, #F5F1E8 0%, #E8DCC8 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col xl:h-full">
        <div className="mb-2 grid flex-shrink-0 grid-cols-[1fr,auto,1fr] items-center sm:mb-3">
          <div />
          <img
            src="/spraystone-logo.png"
            alt="Spraystone Logo"
            className="h-12 w-auto sm:h-16"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col rounded-3xl border border-[#d4a574]/40 bg-white shadow-2xl">
          <div className="pointer-events-none absolute bottom-0 left-6 h-32 w-32 rounded-full bg-[#f5f1e8]/70 blur-2xl" />
          <div className="relative flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
            <div className="flex-shrink-0">
              <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
            </div>
            {/* <div className="mt-4 mb-6 flex flex-col gap-3 rounded-2xl border border-[#eadfcb] bg-[#fdf8f2] px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c4955e]">
                  Want to play?
                </p>
                <p className="text-sm text-[#6b5e4f]"></p>
                <div className="flex gap-2">
                  {[
                    { label: "Original", src: GAME_BEFORE_IMAGE },
                    { label: "Spraystone finish", src: GAME_AFTER_IMAGE },
                  ].map((thumb) => (
                    <div
                      key={thumb.label}
                      className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/80 p-2 shadow-sm"
                    >
                      <img
                        src={thumb.src}
                        alt={thumb.label}
                        className="h-12 w-16 rounded-xl object-cover"
                        loading="lazy"
                      />
                      <span className="text-xs font-semibold text-[#2d2a26]">
                        {thumb.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={startGamePreview}
                className="inline-flex items-center justify-center rounded-full border border-[#d4a574] px-4 py-2 text-sm font-semibold text-[#2d2a26] shadow-sm transition hover:bg-[#fff7ec]"
              >
                🎮 Try the game
              </button>
            </div> */}

            <div className="flex min-h-0 flex-1 flex-col">
              <div
                key={currentStep}
                className={`mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col step-panel ${stepAnimationClass}`}
              >
                {renderStep()}
              </div>

              {error && (
                <div className="mt-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 flex-row items-center justify-between gap-2 pt-2 sm:pt-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-colors sm:px-6 sm:py-2.5 ${
                    currentStep === 1 || loading
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>{t("common.back")}</span>
                </button>

                {DEV_MODE && (
                  <button
                    onClick={skipToResults}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-50"
                    title="Dev: Skip to Results"
                  >
                    ? Skip
                  </button>
                )}
              </div>

              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!canGoNext() || loading}
                  className={`button-press flex items-center justify-center space-x-2 rounded-xl px-4 py-2 font-semibold sm:px-8 sm:py-2.5 ${
                    canGoNext() && !loading
                      ? "text-white shadow-lg"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                  style={
                    canGoNext() && !loading
                      ? {
                          background:
                            "linear-gradient(135deg, #D4A574 0%, #C4955E 100%)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }
                      : undefined
                  }
                >
                  <span>{t("common.continue")}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canGoNext() || loading}
                  className={`button-press flex items-center justify-center space-x-2 rounded-xl px-4 py-2 font-semibold sm:px-8 sm:py-2.5 ${
                    canGoNext() && !loading
                      ? "text-white shadow-lg"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                  style={
                    canGoNext() && !loading
                      ? {
                          background:
                            "linear-gradient(135deg, #D4A574 0%, #C4955E 100%)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }
                      : undefined
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{loadingProgress || t("common.analyzing")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("common.generate")}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const activeGeneratedImage = activeGeneratedFinish
    ? generatedImagesByFinish[activeGeneratedFinish] ?? null
    : null;
  const selectedPreviewFinishes =
    formData.previewFinishes?.length ? formData.previewFinishes : [...RESULT_FINISHES];
  const hasAnyGeneratedImage = Object.keys(generatedImagesByFinish).length > 0;
  const hasAllGeneratedImages = selectedPreviewFinishes.every((finish) =>
    Boolean(generatedImagesByFinish[finish])
  );

  const resultsView = (
    <div className="min-h-[100dvh] overflow-x-hidden bg-gradient-to-br from-[#F5F1E8] via-[#E8DCC8] to-[#fdf8f2]">
      <ResultsPage
        formData={formData}
        imagePreview={imagePreview}
        generatedImage={activeGeneratedImage}
        generatedImagesByFinish={generatedImagesByFinish}
        activeGeneratedFinish={activeGeneratedFinish}
        finishOptions={selectedPreviewFinishes}
        result={result ?? ""}
        isImageGenerating={isImageGenerating}
        imageGenerationStatus={loadingProgress}
        imageGenerationEtaSeconds={IMAGE_GENERATION_ETA_SECONDS || 30}
        imageGenerationBatchEtaSeconds={
          (IMAGE_GENERATION_ETA_SECONDS || 30) * selectedPreviewFinishes.length
        }
        onReset={resetForm}
        canGenerateOne={!hasAnyGeneratedImage && !isImageGenerating}
        canGenerateAll={!hasAllGeneratedImages && !isImageGenerating}
        onGenerateOne={handleGenerateOneFinish}
        onGenerateAll={handleGenerateAllFinishes}
        onSelectGeneratedFinish={handleSelectGeneratedFinish}
        onOpenGame={handleResumeGame}
        onToggleCallDuringDay={handleToggleCallDuringDay}
      />
    </div>
  );

  const shouldShowGameModal =
    (isImageGenerating && isGameVisible) || (forceGamePreview && isGameVisible);
  const modalProgress = forceGamePreview ? undefined : gameProgress;

  return (
    <>
      <GameModal
        key={gameSessionId}
        isVisible={shouldShowGameModal}
        onClose={handleGameClose}
        progress={modalProgress}
      />
      {isImageGenerating &&
        !forceGamePreview &&
        !isGameVisible &&
        gameProgress < 100 && (
          <button
            type="button"
            onClick={handleResumeGame}
            className="fixed bottom-6 right-6 z-[150] rounded-full border border-[#eadfcb] bg-white/95 px-4 py-3 text-sm font-semibold text-[#2d2a26] shadow-xl shadow-black/10 transition hover:bg-[#fdf7ef]"
          >
            {t("common.resumeGame")}
          </button>
        )}
      {result ? resultsView : mainForm}
    </>
  );
}

export { App };
