import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface IndexProps {
  onRegistrationSuccess: (data: any) => void;
}

const Index = ({ onRegistrationSuccess }: IndexProps) => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();

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
      <Footer onRegisterClick={handleRegistrationClick} />

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