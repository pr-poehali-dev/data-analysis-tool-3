import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  faqs?: FAQItem[];
}

const defaultFAQs: FAQItem[] = [
  {
    question: "Что такое СинхроЛинк и как он работает?",
    answer:
      "СинхроЛинк — это AI-платформа, которая объединяет все ваши инструменты коммуникации — звонки, чаты и встречи — в единую систему. Она анализирует разговоры в реальном времени, предоставляя аналитику по тональности, настроению, синхронизации команды и паттернам взаимодействия. Просто интегрируйте СинхроЛинк с вашими инструментами (Slack, Zoom, Microsoft Teams) и начните получать инсайты мгновенно.",
  },
  {
    question: "Как СинхроЛинк использует мои данные для создания кастомного AI-чата?",
    answer:
      "СинхроЛинк обрабатывает ваши коммуникационные данные с помощью передовых моделей обработки естественного языка и машинного обучения. Все данные шифруются end-to-end и обрабатываются в соответствии со стандартами корпоративной безопасности. Ваши данные никогда не передаются третьим сторонам, и вы полностью контролируете, что анализируется. AI обучается на паттернах коммуникации вашей команды для предоставления персонализированных инсайтов.",
  },
  {
    question: "Как начать работу с СинхроЛинк и какие есть тарифы?",
    answer:
      "Начать просто: зарегистрируйтесь на бесплатный пробный период, подключите инструменты коммуникации и начните анализ в течение нескольких минут. Мы предлагаем гибкие тарифы: Старт (бесплатно для небольших команд), Про (2900₽/пользователь/месяц) и Корпоративный (индивидуальные условия с выделенной поддержкой). Все тарифы включают базовые функции анализа тональности и инсайты в реальном времени. Свяжитесь с нашим отделом продаж для корпоративных решений.",
  },
];

export const FAQSection = ({ title = "Часто задаваемые вопросы", faqs = defaultFAQs }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-24 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-[40px] leading-tight font-normal text-[#202020] tracking-tight sticky top-24">
              {title}
            </h2>
          </div>

          <div className="lg:col-span-8">
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-[#e5e5e5] last:border-b-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between py-6 text-left group hover:opacity-70 transition-opacity duration-150"
                    aria-expanded={openIndex === index}
                  >
                    <span className="text-lg leading-7 text-[#202020] pr-8 font-normal">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 45 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="flex-shrink-0"
                    >
                      <Plus className="w-6 h-6 text-[#202020]" strokeWidth={1.5} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pr-12">
                          <p className="text-lg leading-6 text-[#666666]">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
