import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { onboardingTourSteps } from "@/config/onboardingTourSteps";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  onFinish: () => void;
}

const SPOTLIGHT_PADDING = 6;

export const OnboardingTour = ({ onFinish }: OnboardingTourProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const step = onboardingTourSteps[stepIndex];
  const isLastStep = stepIndex === onboardingTourSteps.length - 1;

  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.id}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const domRect = el.getBoundingClientRect();
    setRect({
      top: domRect.top - SPOTLIGHT_PADDING,
      left: domRect.left - SPOTLIGHT_PADDING,
      width: domRect.width + SPOTLIGHT_PADDING * 2,
      height: domRect.height + SPOTLIGHT_PADDING * 2,
    });
  }, [step]);

  useEffect(() => {
    // Даём кнопкам нижнего меню отрисоваться перед измерением
    const raf = requestAnimationFrame(measureTarget);
    return () => cancelAnimationFrame(raf);
  }, [measureTarget]);

  useEffect(() => {
    window.addEventListener("resize", measureTarget);
    return () => window.removeEventListener("resize", measureTarget);
  }, [measureTarget]);

  if (!step) return null;

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    onFinish();
  };

  const tooltipBottom = rect ? window.innerHeight - rect.top + 12 : undefined;
  const tooltipCenter = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const tooltipLeft = Math.min(Math.max(tooltipCenter, 150), window.innerWidth - 150);

  return createPortal(
    <div className="md:hidden fixed inset-0 z-[9998]">
      {rect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75)",
          }}
        />
      )}
      {!rect && (
        <div className="fixed inset-0 bg-slate-900/75" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed w-[280px] -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4"
          style={{ bottom: tooltipBottom ?? 90, left: tooltipLeft }}
        >
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            aria-label="Закрыть подсказку"
          >
            <Icon name="X" size={16} />
          </button>

          <h3 className="text-sm font-bold text-foreground pr-5 mb-1">{step.title}</h3>
          <p className="text-xs text-muted-foreground leading-5 mb-3">{step.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {onboardingTourSteps.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex ? "w-4 bg-primary" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground px-1"
              >
                Пропустить
              </button>
              <Button size="sm" onClick={handleNext} className="h-8 px-3 text-xs">
                {isLastStep ? "Понятно" : "Далее"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};
