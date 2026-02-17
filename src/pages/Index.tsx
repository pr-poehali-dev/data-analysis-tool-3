import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PortfolioNavbar,
  ProductTeaserCard,
  BankingScaleHero,
  BenefitsSection,
  Footer,
} from "@/components/landing";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";

interface IndexProps {
  onRegistrationSuccess: (data: any) => void;
}

const Index = ({ onRegistrationSuccess }: IndexProps) => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const scrollTarget = location.state?.scrollTo;
    if (scrollTarget) {
      window.history.replaceState({}, '');
      const tryScroll = (retries: number) => {
        const el = document.querySelector(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else if (retries > 0) {
          requestAnimationFrame(() => tryScroll(retries - 1));
        }
      };
      tryScroll(20);
    }
  }, [location.state]);

  const handleRegistrationClick = () => {
    setIsRegistrationOpen(true);
  };

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  const handleLoginComplete = () => {
    setIsLoginOpen(false);
    navigate("/");
  };

  const handleRecommendClick = () => {
    navigate("/feed");
  };

  const handleRegistrationComplete = (data: any) => {
    setIsRegistrationOpen(false);
    onRegistrationSuccess(data);
  };

  return (
    <>
      <PortfolioNavbar 
        onRegisterClick={handleRegistrationClick}
        onLoginClick={handleLoginClick}
        onLogout={() => navigate("/")}
      />
      <ProductTeaserCard 
        onRegisterClick={handleRegistrationClick}
        onRecommendClick={handleRecommendClick}
      />
      <BankingScaleHero 
        onRegisterClick={handleRegistrationClick}
        onRecommendClick={handleRecommendClick}
      />
      <BenefitsSection 
        onRegisterClick={handleRegistrationClick}
        onRecommendClick={handleRecommendClick}
      />
      <div className="flex justify-center py-8 bg-[#fafafa] md:hidden">
        <button
          onClick={() => navigate("/feed")}
          className="relative inline-flex justify-center items-center leading-4 text-center cursor-pointer whitespace-nowrap outline-none font-medium h-9 text-[#232730] bg-white/50 backdrop-blur-sm shadow-[0_1px_1px_0_rgba(255,255,255,0),0_0_0_1px_rgba(87,90,100,0.12)] rounded-lg px-4 text-sm"
        >
          <span className="relative z-10 flex items-center gap-1">
            Перейти в ленту заявок
            <ArrowRight className="w-4 h-4 -mr-1" />
          </span>
        </button>
      </div>
      <Footer onRegisterClick={handleRegistrationClick} hiddenOnMobile />

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={handleRegistrationComplete} />
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md">
          <LoginForm onSuccess={handleLoginComplete} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;