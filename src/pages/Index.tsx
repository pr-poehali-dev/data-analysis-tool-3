import { useState } from "react";
import {
  PortfolioNavbar,
  ProductTeaserCard,
  BankingScaleHero,
  PricingSection,
  Footer,
} from "@/components/landing";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface IndexProps {
  onRegistrationSuccess: (data: any) => void;
}

const Index = ({ onRegistrationSuccess }: IndexProps) => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const handleRegistrationClick = () => {
    setIsRegistrationOpen(true);
  };

  const handleRegistrationComplete = (data: any) => {
    setIsRegistrationOpen(false);
    onRegistrationSuccess(data);
  };

  return (
    <>
      <PortfolioNavbar onRegisterClick={handleRegistrationClick} />
      <ProductTeaserCard onRegisterClick={handleRegistrationClick} />
      <BankingScaleHero />
      <PricingSection />
      <Footer />

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={handleRegistrationComplete} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;