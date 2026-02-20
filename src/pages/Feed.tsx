import { useState, useEffect } from "react";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { PortfolioNavbar, Footer } from "@/components/landing";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { authStore } from "@/store/authStore";

export const Feed = () => {
  const navigate = useNavigate();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authStore.isAuthenticated());
    
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
    
    return unsubscribe;
  }, []);

  const handleRegistrationClick = () => {
    setIsRegistrationOpen(true);
  };

  const handleSuggestProperty = (requestId?: string, requestName?: string) => {
    if (authStore.isAuthenticated()) {
      navigate("/suggest-property", {
        state: {
          requestId,
          requestName,
          fromDashboard: false
        }
      });
    } else {
      setIsRegistrationOpen(true);
    }
  };

  const handleRegistrationComplete = (data: { firstName: string; lastName: string; role: string; email: string; phone: string; city?: string }) => {
    authStore.setUser({
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      email: data.email,
      phone: data.phone,
      city: data.city,
    });
    setIsRegistrationOpen(false);
    
    if (data.role === "recommender") {
      navigate("/suggest-property");
    } else if (data.role === "tenant") {
      navigate("/create-request");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar 
        onRegisterClick={handleRegistrationClick}
        onLogout={() => navigate("/")}
        showNavigation={!isAuthenticated}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Лента заявок</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Просматривайте заявки и предлагайте варианты жилья
          </p>
        </div>

        <RequestsFeed 
          onRegisterClick={handleRegistrationClick}
          onSuggestProperty={handleSuggestProperty}
          isAuthenticated={isAuthenticated}
        />
      </main>

      <Footer onRegisterClick={handleRegistrationClick} hiddenOnMobile />

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={handleRegistrationComplete} />
        </DialogContent>
      </Dialog>
    </div>
  );
};