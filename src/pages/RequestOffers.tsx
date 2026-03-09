import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { useNavigate, useParams } from "react-router-dom";
import { requestsStore } from "@/store/requestsStore";
import { recommendationsStore, Recommendation } from "@/store/recommendationsStore";
import funcUrls from "../../backend/func2url.json";
import UserProfileDialog, { UserProfile, Review } from "@/components/offers/UserProfileDialog";
import RecommendationCard from "@/components/offers/RecommendationCard";

interface RequestOffersProps {
  currentUser?: {
    email: string;
    firstName: string;
    lastName: string;
    photo?: string;
  };
}

export const RequestOffers = ({ currentUser }: RequestOffersProps) => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [request, setRequest] = useState(requestsStore.getRequestById(requestId || ''));
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileReviews, setProfileReviews] = useState<{ reviews: Review[]; avg_rating: number | null; total: number }>({ reviews: [], avg_rating: null, total: 0 });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (!requestId) {
      navigate("/dashboard");
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
        navigate("/dashboard");
      }
    });

    const updateRecommendations = () => {
      const offers = recommendationsStore.getRecommendationsByRequestId(requestId);
      setRecommendations(offers);
    };

    updateRecommendations();
    recommendationsStore.fetchRecommendationsByRequestId(requestId);
    const unsubscribe = recommendationsStore.subscribe(updateRecommendations);
    return unsubscribe;
  }, [requestId, navigate]);

  useEffect(() => {
    const emails = [...new Set(recommendations.map(r => r.userId))];
    const PROFILE_API = funcUrls["profile-update"];
    emails.forEach(async (email) => {
      setProfiles(prev => {
        if (prev[email]) return prev;
        fetch(`${PROFILE_API}?email=${encodeURIComponent(email)}`)
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setProfiles(p => ({ ...p, [email]: data.user }));
            }
          })
          .catch(console.error);
        return prev;
      });
    });
  }, [recommendations]);

  const openProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    setProfileDialogOpen(true);
    const REVIEWS_API = funcUrls["reviews"];
    try {
      const res = await fetch(`${REVIEWS_API}?reviewee_email=${encodeURIComponent(profile.email)}`);
      const data = await res.json();
      setProfileReviews({ reviews: data.reviews || [], avg_rating: data.avg_rating, total: data.total || 0 });
    } catch (e) {
      setProfileReviews({ reviews: [], avg_rating: null, total: 0 });
    }
  };

  if (!request) return null;

  return (
    <div className="min-h-screen bg-background">
      <PortfolioNavbar onLogout={() => navigate("/")} showNavigation={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20 mb-20">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard", { state: { activeSection: "requests" } })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors mb-4"
          >
            <Icon name="ArrowLeft" size={16} />
            Назад к заявкам
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            Предложения по заявке
          </h1>
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6 mt-4">
            <div className="flex items-start gap-4">
              {request.avatar ? (
                <img
                  src={request.avatar}
                  alt={request.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center${request.avatar ? " hidden" : ""}`}>
                <span className="text-primary font-semibold text-lg sm:text-xl">
                  {request.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2">{request.name}</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Локация:</span>
                    <span className="ml-2 text-foreground">{request.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Бюджет:</span>
                    <span className="ml-2 text-foreground">{request.budget}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Тип жилья:</span>
                    <span className="ml-2 text-foreground">{request.housingType}, {request.roomsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Вознаграждение:</span>
                    <span className="ml-2 text-primary font-semibold">{request.reward}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
            Полученные предложения ({recommendations.length})
          </h2>
          {recommendations.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">По этой заявке пока нет предложений</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  profile={profiles[recommendation.userId]}
                  request={request}
                  currentUser={currentUser}
                  onOpenProfile={openProfile}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profile={selectedProfile}
        reviews={profileReviews}
      />

      <Footer hiddenOnMobile />
    </div>
  );
};