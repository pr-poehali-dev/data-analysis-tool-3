import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { DashboardRequestsSection } from "@/components/dashboard/DashboardRequestsSection";
import { DashboardRecommendationsSection } from "@/components/dashboard/DashboardRecommendationsSection";
import { DashboardMessagesSection } from "@/components/dashboard/DashboardMessagesSection";
import { DashboardSettingsSection } from "@/components/dashboard/DashboardSettingsSection";
import { DashboardOtherSections } from "@/components/dashboard/DashboardOtherSections";
import { DashboardReviewsSection } from "@/components/dashboard/DashboardReviewsSection";
import { MessageNotification } from "@/components/notifications/MessageNotification";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { requestsStore, Request } from "@/store/requestsStore";
import { recommendationsStore, Recommendation } from "@/store/recommendationsStore";
import { messagesStore } from "@/store/messagesStore";

interface DashboardProps {
  user: {
    firstName: string;
    lastName: string;
    role: "tenant" | "recommender" | "landlord";
    email: string;
    phone: string;
    city?: string;
    photo?: string;
    vkLink?: string;
  };
  onLogout: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: string;
};

const menuItems: MenuItem[] = [
  { id: "feed", label: "Лента заявок", icon: "List" },
  { id: "requests", label: "Мои заявки", icon: "FileText" },
  { id: "recommendations", label: "Мои рекомендации", icon: "ThumbsUp" },
  { id: "messages", label: "Сообщения", icon: "MessageSquare" },
  { id: "documents", label: "Документы", icon: "FolderOpen" },
  { id: "balance", label: "Баланс", icon: "Wallet" },
  { id: "reviews", label: "Отзывы", icon: "Star" },
  { id: "settings", label: "Настройки профиля", icon: "Settings" },
];

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("feed");
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [userRecommendations, setUserRecommendations] = useState<Recommendation[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location]);

  useEffect(() => {
    const updateUserRequests = () => {
      const requests = requestsStore.getUserRequests(user.email);
      setUserRequests(requests);
    };

    requestsStore.fetchUserRequests(user.email).then(() => {
      updateUserRequests();
    });
    updateUserRequests();
    const unsubscribe = requestsStore.subscribe(updateUserRequests);
    return unsubscribe;
  }, [user.email]);

  useEffect(() => {
    const updateUserRecommendations = () => {
      const recommendations = recommendationsStore.getUserRecommendations(user.email);
      setUserRecommendations(recommendations);
    };

    recommendationsStore.fetchUserRecommendations(user.email).then(() => {
      updateUserRecommendations();
    });
    updateUserRecommendations();
    const unsubscribe = recommendationsStore.subscribe(updateUserRecommendations);
    return unsubscribe;
  }, [user.email]);

  useEffect(() => {
    const updateUnreadCount = () => {
      const count = messagesStore.getTotalUnreadCount(user.email);
      setUnreadMessagesCount(count);
    };

    const init = async () => {
      await messagesStore.fetchUserChats(user.email);
      updateUnreadCount();
    };
    init();

    updateUnreadCount();
    const unsubscribe = messagesStore.subscribe(updateUnreadCount);
    return unsubscribe;
  }, [user.email]);

  const handleMenuClick = (itemId: string) => {
    setActiveSection(itemId);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "feed":
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Лента заявок</h2>
            <RequestsFeed 
              isAuthenticated={true}
              currentUserEmail={user.email}
              onSuggestProperty={(requestId, requestName) => {
                navigate("/suggest-property", {
                  state: {
                    requestId,
                    requestName,
                    fromDashboard: true
                  }
                });
              }}
            />
          </div>
        );
      case "requests":
        return <DashboardRequestsSection userRequests={userRequests} />;
      case "recommendations":
        return <DashboardRecommendationsSection userRecommendations={userRecommendations} />;
      case "messages":
        return <DashboardMessagesSection user={user} />;
      case "reviews":
        return <DashboardReviewsSection userEmail={user.email} />;
      case "settings":
        return <DashboardSettingsSection user={user} />;
      default:
        return <DashboardOtherSections activeSection={activeSection} user={user} />;
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MessageNotification userEmail={user.email} />
      
      <div className="fixed top-0 left-0 right-0 z-50 bg-background">
        <PortfolioNavbar onLogout={onLogout} showNavigation={false} />
      </div>

      <div className="flex max-w-7xl mx-auto pt-[80px]">
        <aside className="hidden md:block w-44 lg:w-56 bg-white border-r border-border min-h-[calc(100vh-80px)] p-2 lg:p-4 sticky top-[80px] self-start flex-shrink-0">
          <nav className="space-y-0.5 lg:space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                type="button"
                className={`w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors whitespace-nowrap relative ${
                  activeSection === item.id
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-gray-100"
                }`}
              >
                <Icon name={item.icon} size={16} className="lg:w-[18px] lg:h-[18px]" />
                <span className="text-xs lg:text-sm font-medium">{item.label}</span>
                {item.id === "messages" && unreadMessagesCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 px-1 lg:px-1.5 py-0.5 bg-red-500 text-white text-[10px] lg:text-xs font-bold rounded-full min-w-[18px] lg:min-w-[20px] text-center">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-3 sm:p-6 md:p-8">
          {renderContent()}
        </main>
      </div>

      <Footer hiddenOnMobile />
    </div>
  );
};