import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CaseStudy {
  id: string;
  company: string;
  logo: ReactNode;
  title: string;
  features: string[];
  quote: string;
  attribution: string;
  accentColor: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: "notion",
    company: "ТехноСофт",
    logo: (
      <svg fill="none" height="48" viewBox="0 0 38 48" width="38" xmlns="http://www.w3.org/2000/svg">
        <path
          d="m14.25 5c0 7.8701-6.37994 14.25-14.25 14.25v9.5h14.25v14.25h9.5c0-7.8701 6.3799-14.25 14.25-14.25v-9.5h-14.25v-14.25z"
          fill="#16b364"
        />
      </svg>
    ),
    title: "ТехноСофт использует СинхроЛинк для понимания взаимодействия команд в реальном времени.",
    features: ["Звонки в Slack", "Транскрипции встреч", "Отчеты о настроениях"],
    quote: "СинхроЛинк дает нам ясность в синхронизации команды, которой раньше не было.",
    attribution: "Мария Иванова, Руководитель операций, ТехноСофт",
    accentColor: "#16b364",
  },
  {
    id: "cloudwatch",
    company: "ДатаВью",
    logo: (
      <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
        <rect fill="url(#gradient1)" height="48" rx="12" width="48" />
        <circle cx="24" cy="24" r="12" fill="white" />
        <circle cx="24" cy="24" r="8" fill="#3b82f6" />
        <defs>
          <linearGradient id="gradient1" gradientUnits="userSpaceOnUse" x1="24" x2="24" y1="0" y2="48">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: "ДатаВью использует СинхроЛинк для мониторинга динамики команд в глобальных офисах.",
    features: ["Звонки в Slack", "Транскрипции встреч", "Отчеты о настроениях"],
    quote: "С СинхроЛинк мы видим паттерны взаимодействия, которые напрямую влияют на скорость разработки.",
    attribution: "Сергей Петров, VP Engineering, ДатаВью",
    accentColor: "#3b82f6",
  },
  {
    id: "eightball",
    company: "СинергиЯ",
    logo: (
      <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" fill="#0A0D12" />
        <circle cx="28" cy="20" r="8" fill="white" />
      </svg>
    ),
    title: "СинергиЯ полагается на СинхроЛинк для отслеживания здоровья команды и качества асинхронной коммуникации.",
    features: ["Звонки в Slack", "Отчеты о настроениях"],
    quote: "СинхроЛинк изменил наше понимание культуры удаленной работы.",
    attribution: "Анна Смирнова, Сооснователь, СинергиЯ",
    accentColor: "#0A0D12",
  },
  {
    id: "coreos",
    company: "КорСистемс",
    logo: (
      <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#101828" height="48" rx="12" width="48" />
        <path d="M16 16h16v16H16z" fill="#155eef" />
        <path d="M20 20h8v8h-8z" fill="white" />
      </svg>
    ),
    title: "КорСистемс использует СинхроЛинк для синхронизации дизайн и инженерных команд во время спринтов.",
    features: ["Транскрипции встреч", "Отчеты о настроениях"],
    quote: "Анализ настроений помогает выявить точки напряжения до того, как они станут блокерами.",
    attribution: "Николай Козлов, VP Engineering, КорСистемс",
    accentColor: "#155eef",
  },
];

const FeatureBadge = ({ name }: { name: string }) => {
  const getIcon = (featureName: string) => {
    if (featureName.includes("Slack")) {
      return (
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-50">
          <path d="M6 2C6 1.44772 5.55228 1 5 1C4.44772 1 4 1.44772 4 2V6C4 6.55228 4.44772 7 5 7C5.55228 7 6 6.55228 6 6V2Z" fill="#E01E5A" />
          <path d="M10 6C10.5523 6 11 5.55228 11 5C11 4.44772 10.5523 4 10 4H6V6H10Z" fill="#36C5F0" />
          <path d="M14 5C14 4.44772 13.5523 4 13 4C12.4477 4 12 4.44772 12 5V9C12 9.55228 12.4477 10 13 10C13.5523 10 14 9.55228 14 9V5Z" fill="#2EB67D" />
          <path d="M6 10C5.44772 10 5 10.4477 5 11C5 11.5523 5.44772 12 6 12H10V10H6Z" fill="#ECB22E" />
        </svg>
      );
    } else if (featureName.includes("встреч") || featureName.includes("Транскрипции")) {
      return (
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-50">
          <path d="M2 4C2 3.44772 2.44772 3 3 3H9C9.55228 3 10 3.44772 10 4V10C10 10.5523 9.55228 11 9 11H3C2.44772 11 2 10.5523 2 10V4Z" stroke="#5E6AD2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5L13 3V11L10 9" stroke="#5E6AD2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (featureName.includes("настроен") || featureName.includes("Отчеты")) {
      return (
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-50">
          <path d="M3 9L5 11L8 8L13 13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 5H13M3 5V13M13 5V13M3 13H13" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center gap-2 bg-white/75 shadow-sm border border-black/5 rounded-lg px-2 py-1 text-sm font-medium text-foreground">
      {getIcon(name)}
      {name}
    </div>
  );
};

const NotionCollaborationCard = ({ delay, zIndex }: { accentColor: string; delay: number; zIndex: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1], delay }}
      className="absolute w-[380px] rounded-xl p-6 backdrop-blur-xl"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.8), 0 8px 32px 0 rgba(0, 0, 0, 0.12)",
        filter: "drop-shadow(0 4px 6px rgba(30, 30, 44, 0.15))",
        transform: "translate(-200px, -80px)",
        zIndex,
      }}
    >
      <div className="flex flex-col space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Синхронизация команды</h4>
          <span className="text-xs text-muted-foreground">В реальном времени</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-foreground">Дизайн-команда</span>
            </div>
            <span className="text-sm font-semibold text-green-600">96%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-foreground">Разработка</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">94%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm text-foreground">Продукт</span>
            </div>
            <span className="text-sm font-semibold text-purple-600">92%</span>
          </div>
        </div>
        <div className="pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">12</span> активных диалогов
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StripeGlobalCard = ({ accentColor, delay, zIndex }: { accentColor: string; delay: number; zIndex: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1], delay }}
      className="absolute w-[400px] rounded-xl p-6 backdrop-blur-xl"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.8), 0 8px 32px 0 rgba(0, 0, 0, 0.12)",
        filter: "drop-shadow(0 4px 6px rgba(30, 30, 44, 0.15))",
        transform: "translate(-180px, -60px)",
        zIndex,
      }}
    >
      <div className="flex flex-col space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Динамика глобальной команды</h4>
          <span className="text-xs text-muted-foreground">За 24 часа</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-foreground">МСК</div>
            <div className="text-xs text-muted-foreground mt-1">Москва</div>
            <div className="text-xs font-semibold text-green-600 mt-2">Высокая</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-foreground">СПБ</div>
            <div className="text-xs text-muted-foreground mt-1">Петербург</div>
            <div className="text-xs font-semibold text-blue-600 mt-2">Активная</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-foreground">НСК</div>
            <div className="text-xs text-muted-foreground mt-1">Новосибирск</div>
            <div className="text-xs font-semibold text-purple-600 mt-2">Пик</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Кросс-офисная скорость</span>
            <span className="font-semibold text-foreground">+28%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: "87%", backgroundColor: accentColor }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FigmaSprintCard = ({ accentColor, delay, zIndex }: { accentColor: string; delay: number; zIndex: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1], delay }}
      className="absolute w-[380px] rounded-xl p-6 backdrop-blur-xl"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.8), 0 8px 32px 0 rgba(0, 0, 0, 0.12)",
        filter: "drop-shadow(0 4px 6px rgba(30, 30, 44, 0.15))",
        transform: "translate(-190px, -70px)",
        zIndex,
      }}
    >
      <div className="flex flex-col space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: accentColor }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Планирование спринта</h4>
              <p className="text-xs text-muted-foreground">Неделя 3, День 2</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <span className="text-sm text-foreground">Качество передачи дизайна</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "94%" }} />
              </div>
              <span className="text-xs font-semibold text-foreground">94%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <span className="text-sm text-foreground">Настроение команды</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "89%" }} />
              </div>
              <span className="text-xs font-semibold text-foreground">89%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <span className="text-sm text-foreground">Обнаружение конфликтов</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-green-600">Низкое</span>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Выявленных блокеров</span>
            <span className="font-semibold text-foreground">2</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const CaseStudiesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStudy = caseStudies[currentIndex];

  const startAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
    return () => stopAutoPlay();
  }, [isAutoPlaying, currentIndex]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + caseStudies.length) % caseStudies.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 1000 : -1000, opacity: 0 }),
  };

  return (
    <div
      className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center py-24 px-8"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="max-w-7xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-[40px] leading-tight font-normal text-foreground mb-6 tracking-tight">
            Истории успеха клиентов
          </h1>
          <p className="text-lg leading-7 text-muted-foreground max-w-2xl mx-auto">
            Узнайте, как ведущие команды используют СинхроЛинк для понимания взаимодействия и синхронизации.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStudy.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="space-y-6"
              >
                <div className="text-foreground/60">{currentStudy.logo}</div>
                <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight text-[32px] font-normal">
                  {currentStudy.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {currentStudy.features.map((feature, idx) => (
                    <FeatureBadge key={idx} name={feature} />
                  ))}
                </div>
                <blockquote className="border-l-4 border-primary pl-6 py-2">
                  <p className="text-lg leading-7 text-foreground/80 italic mb-3">
                    "{currentStudy.quote}"
                  </p>
                  <footer className="text-sm text-muted-foreground">
                    {currentStudy.attribution}
                  </footer>
                </blockquote>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                {caseStudies.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Перейти к слайду ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  aria-label="Предыдущий слайд"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  aria-label="Следующий слайд"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="relative h-[500px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStudy.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {currentStudy.id === "notion" && (
                  <NotionCollaborationCard accentColor={currentStudy.accentColor} delay={0} zIndex={1} />
                )}
                {currentStudy.id === "cloudwatch" && (
                  <StripeGlobalCard accentColor={currentStudy.accentColor} delay={0} zIndex={1} />
                )}
                {currentStudy.id === "eightball" && (
                  <NotionCollaborationCard accentColor={currentStudy.accentColor} delay={0} zIndex={1} />
                )}
                {currentStudy.id === "coreos" && (
                  <FigmaSprintCard accentColor={currentStudy.accentColor} delay={0} zIndex={1} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
