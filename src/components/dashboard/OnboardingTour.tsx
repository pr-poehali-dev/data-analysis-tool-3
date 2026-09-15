import { useEffect, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { onboardingTourSteps } from "@/config/onboardingTourSteps";

interface OnboardingTourProps {
  onFinish: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const getTargetRect = (targetId: string): TargetRect | null => {
  const el = document.getElementById(`mobile-nav-${targetId}`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
};

export const OnboardingTour = ({ onFinish }: OnboardingTourProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const step = onboardingTourSteps[stepIndex];
  const isLastStep = stepIndex === onboardingTourSteps.length - 1;

  useLayoutEffect(() => {
    const update = () => setRect(getTargetRect(step.targetId));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step.targetId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleSkip = () => {
    onFinish();
  };

  if (!rect) {
    return null;
  }

  const padding = 6;
  const highlightTop = rect.top - padding;
  const highlightLeft = rect.left - padding;
  const highlightWidth = rect.width + padding * 2;
  const highlightHeight = rect.height + padding * 2;

  const tooltipBottom = window.innerHeight - highlightTop + 10;

  return createPortal(
    <div className="fixed inset-0 z-[100] md:hidden">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" width="100%" height="100%">
        <defs>
          <mask id="onboarding-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={highlightLeft}
              y={highlightTop}
              width={highlightWidth}
              height={highlightHeight}
              rx={12}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#onboarding-mask)"
        />
      </svg>

      <div
        className="absolute rounded-xl ring-2 ring-primary pointer-events-none"
        style={{
          top: highlightTop,
          left: highlightLeft,
          width: highlightWidth,
          height: highlightHeight,
        }}
      />

      <div
        className="absolute left-3 right-3 bg-white rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2"
        style={{ bottom: tooltipBottom }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading font-bold text-base text-foreground">{step.title}</h3>
          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground shrink-0 -mt-1 -mr-1 p-1"
            aria-label="Пропустить"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {onboardingTourSteps.map((s, i) => (
              <span
                key={s.targetId}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-4 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Пропустить
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? "Понятно" : "Далее"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
