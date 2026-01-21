import { useState } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

type PlanLevel = "starter" | "pro" | "enterprise";

interface PricingFeature {
  name: string;
  included: PlanLevel | "all";
}

interface PricingPlan {
  name: string;
  level: PlanLevel;
  price: {
    monthly: number;
    yearly: number;
  };
  popular?: boolean;
}

const features: PricingFeature[] = [
  { name: "Публикация заявок на аренду", included: "all" },
  { name: "Поиск вариантов жилья", included: "all" },
  { name: "Вознаграждение за рекомендации", included: "all" },
  { name: "Защита через эскроу-счета", included: "all" },
  { name: "Готовые шаблоны договоров", included: "all" },
  { name: "Встроенный мессенджер", included: "all" },
  { name: "Проверка пользователей", included: "all" },
  { name: "Поддержка в чате", included: "all" },
];

const plans: PricingPlan[] = [
  {
    name: "Рязань",
    price: { monthly: 5000, yearly: 50000 },
    level: "starter",
  },
  {
    name: "Казань",
    price: { monthly: 6000, yearly: 60000 },
    level: "pro",
  },
  {
    name: "Санкт-Петербург",
    price: { monthly: 8000, yearly: 80000 },
    level: "enterprise",
    popular: true,
  },
];

function shouldShowCheck(included: PricingFeature["included"], level: PlanLevel): boolean {
  return included === "all";
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanLevel>("pro");

  return (
    <section className="py-24 bg-background" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-[40px] font-normal leading-tight mb-4">Вознаграждения по городам</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Фиксированное вознаграждение для рекомендателей за успешную сделку. Арендаторы могут увеличить сумму для приоритета.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2 rounded-full text-lg transition-all",
                !isYearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
Базовое
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2 rounded-full text-lg transition-all",
                isYearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
С бонусом
              <span className="ml-2 text-sm text-[#156d95]">+₽</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => setSelectedPlan(plan.level)}
              className={cn(
                "relative p-8 rounded-2xl text-left transition-all border-2",
                selectedPlan === plan.level
                  ? "border-[#156d95] bg-[#156d95]/5"
                  : "border-border hover:border-[#156d95]/50"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#156d95] text-white px-4 py-1 rounded-full text-sm">
                  Популярный
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-medium mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-medium">
                    {(isYearly ? plan.price.yearly : plan.price.monthly).toLocaleString("ru-RU")} ₽
                  </span>
                  <span className="text-lg text-muted-foreground">/сделка</span>
                </div>
              </div>
              <div
                className={cn(
                  "w-full py-3 px-6 rounded-full text-lg transition-all text-center",
                  selectedPlan === plan.level ? "bg-[#156d95] text-white" : "bg-secondary text-foreground"
                )}
              >
                {selectedPlan === plan.level ? "Выбран" : "Выбрать"}
              </div>
            </button>
          ))}
        </div>

        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <div className="min-w-[768px]">
              <div className="flex items-center p-6 bg-secondary border-b border-border">
                <div className="flex-1">
                  <h3 className="text-xl font-medium">Возможности</h3>
                </div>
                <div className="flex items-center gap-8">
                  {plans.map((plan) => (
                    <div key={plan.level} className="w-24 text-center text-lg font-medium">
                      {plan.name}
                    </div>
                  ))}
                </div>
              </div>

              {features.map((feature, index) => (
                <div
                  key={feature.name}
                  className={cn(
                    "flex items-center p-6 transition-colors",
                    index % 2 === 0 ? "bg-background" : "bg-secondary/30",
                    feature.included === selectedPlan && "bg-[#156d95]/5"
                  )}
                >
                  <div className="flex-1">
                    <span className="text-lg">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    {plans.map((plan) => (
                      <div key={plan.level} className="w-24 flex justify-center">
                        {shouldShowCheck(feature.included, plan.level) ? (
                          <div className="w-6 h-6 rounded-full bg-[#156d95] flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            В Москве вознаграждение составляет <strong>10 000 ₽</strong> за успешную сделку
          </p>
        </div>
      </div>
    </section>
  );
}