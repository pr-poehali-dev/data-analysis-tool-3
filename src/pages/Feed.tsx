import { useState, useEffect } from "react";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { PortfolioNavbar, Footer } from "@/components/landing";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { authStore } from "@/store/authStore";
import { messagesStore } from "@/store/messagesStore";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { MobileProfileSheet } from "@/components/dashboard/MobileProfileSheet";

export const Feed = () => {
  const navigate = useNavigate();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    setIsAuthenticated(authStore.isAuthenticated());
    
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = authStore.getUser();
    if (!user) return;

    const updateUnreadCount = () => {
      setUnreadMessagesCount(messagesStore.getTotalUnreadCount(user.email));
    };

    const init = async () => {
      await messagesStore.fetchUserChats();
      updateUnreadCount();
    };
    init();

    updateUnreadCount();
    const unsubscribe = messagesStore.subscribe(updateUnreadCount);
    return unsubscribe;
  }, [isAuthenticated]);

  const handleBottomNavSelect = (id: string) => {
    if (id === "feed") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/dashboard", { state: { activeSection: id } });
  };

  const handleLogout = () => {
    authStore.logout();
    navigate("/");
  };

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
        onLoginClick={() => setIsLoginOpen(true)}
        onLogout={() => navigate("/")}
        showNavigation={!isAuthenticated}
        showMobileMenu={!isAuthenticated}
      />

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 ${isAuthenticated ? "pb-24 md:pb-8" : ""}`}>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Лента заявок</h1>
          <p className="hidden sm:block text-base sm:text-lg text-muted-foreground">
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

      {isAuthenticated && (
        <>
          <MobileBottomNav
            activeSection="feed"
            onSelect={handleBottomNavSelect}
            unreadMessagesCount={unreadMessagesCount}
            onProfileClick={() => setIsProfileSheetOpen(true)}
          />

          <MobileProfileSheet
            open={isProfileSheetOpen}
            onOpenChange={setIsProfileSheetOpen}
            onSelect={handleBottomNavSelect}
            onLogout={handleLogout}
          />
        </>
      )}

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={handleRegistrationComplete} />
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md">
          <LoginForm onSuccess={() => {
            setIsLoginOpen(false);
            navigate("/feed");
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};