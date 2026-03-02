import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { requestsStore, Request } from "@/store/requestsStore";
import { authStore } from "@/store/authStore";
import UserProfileDialog, { UserProfile, Review } from "@/components/offers/UserProfileDialog";
import funcUrls from "../../backend/func2url.json";

export const RequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileReviews, setProfileReviews] = useState<{ reviews: Review[]; avg_rating: number | null; total: number }>({ reviews: [], avg_rating: null, total: 0 });
  
  const fromDashboard = location.state?.fromDashboard || false;

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
    if (cached) {
      setRequest(cached);
    }

    requestsStore.fetchRequestById(requestId).then((fetched) => {
      if (fetched) {
        setRequest(fetched);
      } else if (!cached) {
        goBack();
      }
    });
  }, [requestId]);

  const openAuthorProfile = async () => {
    if (!request) return;
    const email = request.userEmail || request.userId;
    const PROFILE_API = funcUrls["profile-update"];
    const REVIEWS_API = funcUrls["reviews"];

    const fallback: UserProfile = {
      firstName: request.name.split(' ')[0] || '',
      lastName: request.name.split(' ').slice(1).join(' ') || '',
      avatar_url: request.avatar,
      city: request.city || '',
      vkLink: '',
      role: 'tenant',
      email,
    };

    setSelectedProfile(fallback);
    setProfileDialogOpen(true);

    try {
      const [profileRes, reviewsRes] = await Promise.all([
        fetch(`${PROFILE_API}?email=${encodeURIComponent(email)}`),
        fetch(`${REVIEWS_API}?reviewee_email=${encodeURIComponent(email)}`),
      ]);
      const profileData = await profileRes.json();
      const reviewsData = await reviewsRes.json();

      if (profileData.user) {
        setSelectedProfile({ ...profileData.user, avatar_url: profileData.user.avatar_url || request.avatar });
      }
      setProfileReviews({ reviews: reviewsData.reviews || [], avg_rating: reviewsData.avg_rating, total: reviewsData.total || 0 });
    } catch {
      setProfileReviews({ reviews: [], avg_rating: null, total: 0 });
    }
  };

  if (!request) return null;

  const createdAt = new Date(request.createdAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysDiff <= 2;

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar
        onRegisterClick={() => setIsRegistrationOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogout={() => navigate("/")}
        showNavigation={!authStore.isAuthenticated()}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 mb-20">
        <Button
          variant="outline"
          onClick={goBack}
          className="mb-6"
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад в ленту
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-xl p-4 sm:p-8 overflow-hidden"
        >
          {isNew && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-full">
                <Icon name="Sparkles" size={14} />
                Новая заявка
              </span>
            </div>
          )}

          <div className="flex items-start gap-3 sm:gap-6 mb-6 sm:mb-8">
            <img
              src={request.avatar}
              alt={request.name}
              className="w-14 h-14 sm:w-24 sm:h-24 rounded-full shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={openAuthorProfile}
            />
            <div className="flex-1 min-w-0">
              <h1
                className="text-xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 break-words cursor-pointer hover:text-primary transition-colors"
                onClick={openAuthorProfile}
              >
                {request.name}
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground mb-2 sm:mb-4">{request.location}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Calendar" size={16} />
                <span>Создана: {createdAt.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Icon name="DollarSign" size={16} className="text-primary sm:w-5 sm:h-5" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Бюджет</h3>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground break-words">{request.budget}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Icon name="Gift" size={16} className="text-primary sm:w-5 sm:h-5" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Вознаграждение</h3>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-primary break-words">{request.reward}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Icon name="Home" size={16} className="text-primary sm:w-5 sm:h-5" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Тип жилья</h3>
                </div>
                <p className="text-base sm:text-lg text-foreground">{request.housingType}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{request.roomsCount}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Icon name="Calendar" size={16} className="text-primary sm:w-5 sm:h-5" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Срок аренды</h3>
                </div>
                <p className="text-base sm:text-lg text-foreground">{request.rentalPeriod}</p>
              </div>
            </div>
          </div>

          {request.aboutYourself && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="User" size={20} className="text-primary" />
                <h3 className="text-xl font-semibold text-foreground">О себе</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{request.aboutYourself}</p>
              </div>
            </div>
          )}

          {request.preferences && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Settings" size={20} className="text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Предпочтения</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{request.preferences}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-border">
            {(() => {
              const user = authStore.getUser();
              const ownerEmail = request.userEmail || request.userId;
              const isOwn = user && ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase();
              if (isOwn) {
                return (
                  <div className="flex-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground bg-gray-50 py-3 px-4 rounded-lg border border-border">
                    <Icon name="User" size={14} />
                    <span className="font-medium">Это ваша заявка</span>
                  </div>
                );
              }
              return (
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (authStore.isAuthenticated()) {
                      navigate("/suggest-property", {
                        state: {
                          requestId: request.id,
                          requestName: request.name,
                          fromDashboard: true
                        }
                      });
                    } else {
                      setIsRegistrationOpen(true);
                    }
                  }}
                >
                  <Icon name="Home" size={16} className="mr-2" />
                  Предложить объект
                </Button>
              );
            })()}
            <Button
              variant="outline"
              onClick={goBack}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
          </div>
        </motion.div>
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
              state: {
                requestId: request?.id,
                requestName: request?.name,
                fromDashboard: true
              }
            });
          }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md">
          <LoginForm onSuccess={() => {
            setIsLoginOpen(false);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};