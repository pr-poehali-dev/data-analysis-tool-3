import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface ProductTeaserCardProps {
  dailyVolume?: string;
  dailyVolumeLabel?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  onRegisterClick?: () => void;
  onRecommendClick?: () => void;
}

export const ProductTeaserCard = (props: ProductTeaserCardProps) => {
  const {
    dailyVolumeLabel = "НОВАЯ МОДЕЛЬ АРЕНДЫ ЖИЛЬЯ",
    headline = "Арендуйте по рекомендации, а не через агентов",
    subheadline = "SovetPay — платформа аренды жилья через рекомендации. Арендаторы создают заявки, рекомендатели предлагают варианты за вознаграждение, владельцы находят проверенных жильцов без комиссий.",
    primaryButtonText = "Найти жильё",
    primaryButtonHref = "",
    secondaryButtonText = "Рекомендовать варианты",
    secondaryButtonHref = "",
    onRegisterClick,
    onRecommendClick,
  } = props;

  return (
    <section className="w-full px-8 pt-32 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
            className="col-span-12 bg-[#e9e9e9] rounded-[40px] p-12 lg:p-16 flex flex-col items-start justify-end min-h-[600px] overflow-hidden"
          >
            <a
              href={primaryButtonHref}
              onClick={(e) => e.preventDefault()}
              className="flex flex-col gap-1 text-[#9a9a9a]"
            >
              <motion.span
                initial={{ transform: "translateY(20px)", opacity: 0 }}
                animate={{ transform: "translateY(0px)", opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.645, 0.045, 0.355, 1], delay: 0.6 }}
                className="text-sm uppercase tracking-tight font-mono flex items-center gap-1"
              >
                {dailyVolumeLabel}
                <ArrowUpRight className="w-[0.71em] h-[0.71em]" />
              </motion.span>
            </a>

            <h1
              className="text-[56px] leading-[60px] tracking-tight text-[#202020] max-w-[520px] mb-6 font-medium"
            >
              {headline}
            </h1>

            <p className="text-lg leading-7 text-[#404040] max-w-[520px] mb-6">
              {subheadline}
            </p>

            <ul className="flex gap-1.5 flex-wrap mt-10">
              <li>
                <button
                  onClick={onRegisterClick}
                  className="block cursor-pointer text-white bg-[#155eef] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                >
                  {primaryButtonText}
                </button>
              </li>
              <li>
                <button
                  onClick={onRecommendClick}
                  className="block cursor-pointer text-[#202020] border border-[#202020] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                >
                  {secondaryButtonText}
                </button>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};