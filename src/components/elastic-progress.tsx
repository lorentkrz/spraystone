import React, { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

export interface ElasticProgressProps {
  value: number;
  displayValue?: number;
  showValue?: boolean;
  ariaLabel?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const rubberBand = (distance: number, dimension: number, constant = 1) => {
  if (dimension <= 0) return 0;
  const abs = Math.abs(distance);
  const dir = Math.sign(distance) || 1;
  const limited = (abs * dimension * constant) / (dimension + abs * constant);
  return dir * limited;
};

export const ElasticProgress: React.FC<ElasticProgressProps> = ({
  value,
  displayValue,
  showValue = false,
  ariaLabel = "Progress",
  className,
}) => {
  const safeValue = clamp(value, 0, 100);
  const shownValue = displayValue ?? safeValue;
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef(0);

  const maxDistance = useMemo(
    () => clamp(trackWidth * 0.50, 100, 200),
    [trackWidth]
  );

  const offsetX = useMotionValue(0);
  const stretchX = useTransform(offsetX, (x) => {
    const n = maxDistance ? clamp(Math.abs(x) / maxDistance, 0, 1) : 0;
    return isDragging ? 1 + n * 0.22 : 1;
  });
  const stretchY = useTransform(offsetX, (x) => {
    const n = maxDistance ? clamp(Math.abs(x) / maxDistance, 0, 1) : 0;
    return isDragging ? 1 - n * 0.08 : 1;
  });
  const glow = useTransform(offsetX, (x) => {
    const n = maxDistance ? clamp(Math.abs(x) / maxDistance, 0, 1) : 0;
    const alpha = isDragging ? 0.15 + n * 0.15 : 0.12;
    return `0 12px 28px rgba(0,0,0,${alpha})`;
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setTrackWidth(rect.width);
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (isDragging) return;
    offsetX.set(0);
  }, [safeValue, isDragging, offsetX]);

  const springBack = () => {
    animate(offsetX, 0, {
      type: "spring",
      stiffness: 400,
      damping: 30,
      mass: 1.5,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== null) return;
    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    dragStartRef.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const raw = e.clientX - dragStartRef.current;
    offsetX.set(rubberBand(raw, maxDistance, 1.2));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    springBack();
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setIsDragging(false);
    springBack();
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        className="relative h-3 w-full rounded-full bg-[#f2e7da] shadow-inner shadow-white/80"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamp(shownValue, 0, 100))}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${safeValue}%`,
            background:
              "linear-gradient(120deg, #d4a574 0%, #f6d7b0 50%, #c4955e 100%)",
            backgroundSize: "200% 100%",
            animation: "stepProgressGlint 4s ease-in-out infinite",
          }}
        />

        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-25"
          style={{
            width: `${safeValue}%`,
            background:
              "radial-gradient(circle at 12% 50%, rgba(255,255,255,0.9), rgba(255,255,255,0))",
          }}
        />

        <motion.div
          className={[
            "absolute top-1/2 -translate-y-1/2",
            "-translate-x-1/2",
            "rounded-full border border-[#c4955e]/70 bg-white",
            showValue
              ? "px-3 py-1 text-[11px] font-bold tabular-nums text-[#2d2a26]"
              : "px-3 py-1.5 text-[11px] font-bold text-[#2d2a26]",
            "select-none touch-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
          style={{
            left: `${safeValue}%`,
            x: offsetX,
            scaleX: stretchX,
            scaleY: stretchY,
            boxShadow: glow,
            transformOrigin: "center",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
          whileHover={{ scale: isDragging ? 1 : 1.03 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {showValue ? (
            `${Math.round(clamp(shownValue, 0, 100))}%`
          ) : (
            <span aria-hidden className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 rounded-full bg-[#c4955e]/60" />
              <span className="h-3 w-0.5 rounded-full bg-[#c4955e]/60" />
              <span className="h-3 w-0.5 rounded-full bg-[#c4955e]/60" />
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
};
