import React from "react";
import type { Step5FinishProps } from "@/types";
import { Gem, Waves, Sparkles, Compass, Palette } from "lucide-react";

interface FinishCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  icon: React.ReactNode;
  palette: string[];
  bestFor: string;
  textureNote: string;
  features: string[];
}

const finishCards: FinishCard[] = [
  {
    id: "natural-stone",
    title: "Natural stone appearance (Spraystone)",
    subtitle: "Belgian limestone inspired blocks with pale silver-grey mortar.",
    image: "/spraystone-variants/limestone-classic.jpg",
    icon: <Gem className="h-5 w-5" />,
    palette: ["#D9D4C9", "#B6B0A3", "#8F897B"],
    bestFor: "Heritage facades & townhouses",
    textureNote: "Soft chiselled edges + subtle aggregate sparkle.",
    features: ["Block scale ≈ 25 × 8 cm", "Deep mortar shadow lines", "Premium for front elevations"]
  },
  {
    id: "smooth",
    title: "Smooth or micro-textured render",
    subtitle: "Modern mineral render with razor-sharp transitions.",
    image: "/spraystone-variants/render-neutral.jpg",
    icon: <Waves className="h-5 w-5" />,
    palette: ["#DDD8D2", "#C8C3BD", "#A9A39D"],
    bestFor: "Contemporary builds & extensions",
    textureNote: "Feathered plaster matte finish, optional satin sheen.",
    features: ["Ultra-even tone", "Hides patch repairs", "Pairs with bold windows"]
  },
  {
    id: "textured",
    title: "Textured Spraystone relief",
    subtitle: "Hand-worked mineral coat with visible aggregate.",
    image: "/spraystone-variants/limestone-textured.jpg",
    icon: <Sparkles className="h-5 w-5" />,
    palette: ["#DCCEBF", "#C0A98F", "#8D6A4D"],
    bestFor: "Large walls needing depth",
    textureNote: "Layered highs & lows catch daylight for drama.",
    features: ["Rich highlights & shadows", "Adds warmth to classic homes", "Great for sun-exposed facades"]
  },
  {
    id: "other",
    title: "Custom blend / hybrid concept",
    subtitle: "Combine Spraystone with timber, metal, or brick cues.",
    image: "/spraystone-variants/brick-warm.jpg",
    icon: <Compass className="h-5 w-5" />,
    palette: ["#C97848", "#AF5E35", "#7B3F24"],
    bestFor: "Mixed-material statements",
    textureNote: "We layer Spraystone over accents or between trims.",
    features: ["Mix Spraystone + wood/metal", "Exact RAL matching", "Ideal for bespoke briefs"]
  },
  {
    id: "suggest",
    title: "I'm not sure yet (studio suggestion)",
    subtitle: "Let our atelier curate 3 moodboards for you.",
    image: "/spraystone-variants/render-neutral.jpg",
    icon: <Palette className="h-5 w-5" />,
    palette: ["#E5E0D8", "#C2BBB1", "#9A9286"],
    bestFor: "Fast answers with expert help",
    textureNote: "We pick the best Spraystone reference based on your photo + light.",
    features: ["Receive 3 curated looks", "Optimised for your facade type", "Keeps generation ultra-accurate"]
  }
];

export const Step5Finish: React.FC<Step5FinishProps> = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          Which Spraystone finish should we apply?
        </h2>
        <p className="text-gray-600">
          Select the finish that best matches your ideal result. Each one uses the same texture for rendering.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(200px,1fr)] gap-4 min-w-[min(520px,100%)]">
          {finishCards.map((card) => {
            const isSelected = formData.finish === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  onChange({ target: { name: "finish", value: card.id } } as React.ChangeEvent<HTMLInputElement>)
                }
                className={`group flex min-h-[220px] flex-col overflow-hidden rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-[#d4a574] shadow-xl"
                    : "border-gray-200 hover:border-[#d4a574]/70 hover:shadow-lg"
                }`}
              >
                <div className="relative flex h-32 items-center justify-center overflow-hidden">
                  <img
                    src={card.image}
                    alt={`${card.title} sample`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                    {card.bestFor}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {card.icon} {card.title}
                    </p>
                    <p className="text-sm text-gray-600">{card.subtitle}</p>
                  </div>

                  <div className="flex gap-1.5 mt-3">
                    {card.palette.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-3 w-8 rounded-full border border-white/40"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>

                  {isSelected && (
                    <span className="mt-3 text-xs font-bold uppercase tracking-wide text-[#c4955e]">
                      Selected
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
