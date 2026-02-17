import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, UserCheck, Handshake, FileCheck, Wallet } from "lucide-react";

interface BankingScaleHeroProps {
  onRegisterClick?: () => void;
  onRecommendClick?: () => void;
}

interface ProcessStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}

interface DataPoint {
  id: number;
  left: number;
  top: number;
  height: number;
  direction: "up" | "down";
  delay: number;
}

const processSteps: ProcessStep[] = [
  {
    icon: Search,
    title: "Запрос",
    description: "Арендатор публикует, что ищет",
    delay: 0,
  },
  {
    icon: UserCheck,
    title: "Рекомендация",
    description: "Рекомендатель предлагает вариант",
    delay: 0.15,
  },
  {
    icon: Handshake,
    title: "Согласование",
    description: "Владелец подтверждает показ и знакомится",
    delay: 0.3,
  },
  {
    icon: FileCheck,
    title: "Сделка",
    description: "Заселение и подписание договора",
    delay: 0.45,
  },
  {
    icon: Wallet,
    title: "Вознаграждение",
    description: "Рекомендатель получает деньги после заселения",
    delay: 0.6,
  },
];

const generateDataPoints = (): DataPoint[] => {
  const points: DataPoint[] = [];
  const baseLeft = 1;
  const spacing = 32;
  for (let i = 0; i < 50; i++) {
    const direction = i % 2 === 0 ? "down" : "up";
    const height = Math.floor(Math.random() * 120) + 88;
    const top = direction === "down" ? Math.random() * 150 + 250 : Math.random() * 100 - 80;
    points.push({
      id: i,
      left: baseLeft + i * spacing,
      top,
      height,
      direction,
      delay: i * 0.035,
    });
  }
  return points;
};

export const BankingScaleHero = ({ onRegisterClick, onRecommendClick }: BankingScaleHeroProps = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dataPoints] = useState<DataPoint[]>(generateDataPoints());
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setTypingComplete(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="how-it-works" className="w-full overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-8 py-12 pt-8">
        <div className="grid grid-cols-12 gap-5 gap-y-5">
          <div className="col-span-12 md:col-span-6 relative z-10">
            <div className="relative h-6 inline-flex items-center font-mono uppercase text-xs text-[#9a9a9a] mb-4 px-2">
              <div className="flex items-center gap-0.5 overflow-hidden">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="block whitespace-nowrap overflow-hidden relative z-10"
                  style={{ color: "#9a9a9a" }}
                >
                  Аренда через доверие
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: typingComplete ? [1, 0, 1, 0] : 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="block w-1.5 h-3 ml-0.5 relative z-10 rounded-sm"
                  style={{ backgroundColor: "#9a9a9a" }}
                />
              </div>
            </div>

            <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] leading-[36px] sm:leading-[44px] md:leading-[52px] lg:leading-[60px] tracking-tight text-[#111A4A] mb-3 font-medium">
              Три роли — одна платформа.
            </h2>

            <button className="relative inline-flex justify-center items-center leading-4 text-center cursor-pointer whitespace-nowrap outline-none font-medium h-9 text-[#232730] bg-white/50 backdrop-blur-sm shadow-[0_1px_1px_0_rgba(255,255,255,0),0_0_0_1px_rgba(87,90,100,0.12)] rounded-lg px-4 mt-2.5 text-sm">
              <span className="relative z-10 flex items-center gap-1">
                Как это работает
                <ArrowRight className="w-4 h-4 -mr-1" />
              </span>
            </button>
          </div>

          <div className="col-span-12" style={{ marginTop: '0.8rem' }}>
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="relative">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={
                          isVisible
                            ? {
                                opacity: [0, 1],
                                y: [20, 0],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.6,
                          delay: step.delay,
                          ease: "easeOut",
                        }}
                        className="flex flex-col items-center text-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gradient-to-b from-white to-gray-50/50 border border-gray-300 h-[130px] md:h-full md:min-h-[180px] justify-center overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#155eef]/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#155eef]" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-base font-semibold text-[#111A4A]">
                            {step.title}
                          </h3>
                          <p className="text-sm text-[#7C7F88] leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                      {index < processSteps.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={
                            isVisible
                              ? {
                                  scaleX: [0, 1],
                                }
                              : {}
                          }
                          transition={{
                            duration: 0.5,
                            delay: step.delay + 0.3,
                            ease: "easeOut",
                          }}
                          className="hidden md:block absolute top-8 -right-2 w-4 h-[2px] bg-[#155eef]/60 origin-left"
                          style={{
                            transform: 'translateX(100%)'
                          }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[5px] border-l-[#155eef]/60 border-y-[3px] border-y-transparent" />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-12 mt-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isVisible
                  ? {
                      opacity: [0, 1],
                      y: [20, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
                delay: 0.8,
                ease: "easeOut",
              }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 w-full sm:w-auto"
            >
              <button
                onClick={onRegisterClick}
                className="w-full sm:w-auto block cursor-pointer text-white bg-[#155eef] rounded-full px-[18px] py-[15px] text-sm sm:text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
              >
                Найти жильё
              </button>
              <button
                onClick={onRecommendClick}
                className="w-full sm:w-auto block cursor-pointer text-[#202020] border border-[#202020] rounded-full px-[18px] py-[15px] text-sm sm:text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
              >
                Рекомендовать варианты
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};