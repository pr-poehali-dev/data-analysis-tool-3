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
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface IndexProps {
  onRegistrationSuccess: (data: any) => void;
}

const Index = ({ onRegistrationSuccess }: IndexProps) => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const navigate = useNavigate();

  const handleRegistrationClick = () => {
    setIsRegistrationOpen(true);
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
    </>
  );
};

export default Index;