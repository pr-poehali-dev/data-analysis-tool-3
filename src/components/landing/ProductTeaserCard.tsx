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
    headline = "Арендуйте по рекомендации и без агентств",
    subheadline = "SovetPay — платформа аренды жилья через рекомендации. Арендаторы создают заявки, рекомендатели предлагают варианты за вознаграждение, владельцы находят проверенных жильцов без комиссий.",
    primaryButtonText = "Найти жильё",
    primaryButtonHref = "",
    secondaryButtonText = "Рекомендовать варианты",
    secondaryButtonHref = "",
    onRegisterClick,
    onRecommendClick,
  } = props;

  return (
    <section className="w-full px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
            className="col-span-12 bg-[#e9e9e9] rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 sm:gap-8 lg:gap-12 min-h-[500px] sm:min-h-[550px] lg:min-h-[600px] overflow-hidden"
          >
            <div className="flex flex-col items-start justify-end flex-1 w-full lg:max-w-[520px]">
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
                className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] leading-[36px] sm:leading-[44px] md:leading-[52px] lg:leading-[60px] tracking-tight text-[#202020] mb-4 sm:mb-5 md:mb-6 font-medium"
              >
                {headline}
              </h1>

              <p className="text-base sm:text-lg leading-6 sm:leading-7 text-[#404040] mb-4 sm:mb-5 md:mb-6">
                {subheadline}
              </p>

              <ul className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 flex-wrap mt-6 sm:mt-8 md:mt-10 w-full sm:w-auto">
                <li className="w-full sm:w-auto">
                  <button
                    onClick={onRegisterClick}
                    className="w-full sm:w-auto block cursor-pointer text-white bg-[#155eef] rounded-full px-[18px] py-[15px] text-sm sm:text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                  >
                    {primaryButtonText}
                  </button>
                </li>
                <li className="w-full sm:w-auto">
                  <button
                    onClick={onRecommendClick}
                    className="w-full sm:w-auto block cursor-pointer text-[#202020] border border-[#202020] rounded-full px-[18px] py-[15px] text-sm sm:text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                  >
                    {secondaryButtonText}
                  </button>
                </li>
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1], delay: 0.3 }}
              className="hidden lg:block flex-shrink-0 w-[380px] xl:w-[480px] h-[380px] xl:h-[480px]"
            >
              <img
                src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/2cec801d-231b-4bea-924d-763710d55fc0.png"
                alt="SovetPay платформа аренды"
                className="w-full h-full object-contain rounded-2xl lg:rounded-3xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};