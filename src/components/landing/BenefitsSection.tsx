import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";

interface BenefitsSectionProps {
  onRegisterClick?: () => void;
  onRecommendClick?: () => void;
}

interface Benefit {
  text: string;
}

interface BenefitColumn {
  title: string;
  icon: string;
  benefits: Benefit[];
  color: string;
}

const columns: BenefitColumn[] = [
  {
    title: "Арендатора",
    icon: "User",
    color: "#155eef",
    benefits: [
      { text: "Доступ к скрытому рынку предложений" },
      { text: "Экономия бюджета на риелторах" },
      { text: "Экономия личного времени" },
    ],
  },
  {
    title: "Рекомендателя",
    icon: "Users",
    color: "#155eef",
    benefits: [
      { text: "Легальный дополнительный заработок" },
      { text: "Помощь друзьям в сдаче жилья" },
      { text: "Гарантия оплаты вознаграждения через эскроу" },
    ],
  },
  {
    title: "Арендодателя",
    icon: "Home",
    color: "#155eef",
    benefits: [
      { text: "Предварительно проверенные жильцы" },
      { text: "Меньше пустых звонков" },
      { text: "Снижение риска простоев жилья" },
    ],
  },
];

export function BenefitsSection({ onRegisterClick, onRecommendClick }: BenefitsSectionProps = {}) {
  return (
    <section id="benefits" className="py-12 bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] leading-[36px] sm:leading-[44px] md:leading-[52px] lg:leading-[60px] tracking-tight text-[#202020] mb-4 font-medium">
            Преимущества
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
          {columns.map((column, index) => (
            <motion.div
              key={column.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-white rounded-2xl p-5 md:p-8 border border-[#e5e5e5] hover:border-[#155eef]/30 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3 md:mb-6">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${column.color}15` }}
                >
                  <Icon name={column.icon} size={24} style={{ color: column.color }} />
                </div>
                <h3 className="text-xl md:text-2xl font-medium text-[#202020]">
                  {column.title}
                </h3>
              </div>

              <ul className="space-y-2 md:space-y-4">
                {column.benefits.map((benefit, benefitIndex) => (
                  <motion.li
                    key={benefitIndex}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.15 + benefitIndex * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-[#155eef] flex items-center justify-center">
                        <Icon name="Check" size={14} className="text-white" />
                      </div>
                    </div>
                    <span className="text-[#666666] text-base leading-relaxed">
                      {benefit.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 mt-16 w-full sm:w-auto"
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
    </section>
  );
}