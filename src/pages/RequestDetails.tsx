import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { requestsStore, Request } from "@/store/requestsStore";
import { authStore } from "@/store/authStore";
import UserProfileDialog from "@/components/offers/UserProfileDialog";
import { RequestDetailsCard } from "@/components/request-details/RequestDetailsCard";
import { useAuthorProfile } from "@/components/request-details/useAuthorProfile";

export const RequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fromDashboard = location.state?.fromDashboard || false;
  const { profileDialogOpen, setProfileDialogOpen, selectedProfile, profileReviews, openProfile } = useAuthorProfile();

  const goBack = () => {
    if (fromDashboard) {
      navigate("/dashboard", { state: { activeSection: "feed" } });
    } else {
      navigate("/feed");
    }
  };

  useEffect(() => {
    if (!requestId) {
      goBack();
      return;
    }

    const cached = requestsStore.getRequestById(requestId);
    if (cached) setRequest(cached);

    requestsStore.fetchRequestById(requestId).then((fetched) => {
      if (fetched) {
        setRequest(fetched);
      } else if (!cached) {
        goBack();
      }
    });
  }, [requestId]);

  if (!request) return null;

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar
        onRegisterClick={() => setIsRegistrationOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogout={() => navigate("/")}
        showNavigation={!authStore.isAuthenticated()}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 mb-20">
        <Button variant="outline" onClick={goBack} className="mb-6">
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад в ленту
        </Button>

        <RequestDetailsCard
          request={request}
          onAuthorClick={() => openProfile({
            email: request.userEmail || request.userId,
            name: request.name,
            avatar: request.avatar,
            city: request.city,
          })}
          onSuggest={() => navigate("/suggest-property", {
            state: { requestId: request.id, requestName: request.name, fromDashboard: true }
          })}
          onBack={goBack}
          onRegister={() => setIsRegistrationOpen(true)}
        />
      </main>

      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profile={selectedProfile}
        reviews={profileReviews}
      />

      <Footer hiddenOnMobile />

      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RegistrationForm onSuccess={() => {
            setIsRegistrationOpen(false);
            navigate("/suggest-property", {
              state: { requestId: request?.id, requestName: request?.name, fromDashboard: true }
            });
          }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md">
          <LoginForm onSuccess={() => setIsLoginOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
