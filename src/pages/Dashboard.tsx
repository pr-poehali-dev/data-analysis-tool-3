import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { DashboardRequestsSection } from "@/components/dashboard/DashboardRequestsSection";
import { DashboardRecommendationsSection } from "@/components/dashboard/DashboardRecommendationsSection";
import { DashboardOtherSections } from "@/components/dashboard/DashboardOtherSections";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { requestsStore, Request } from "@/store/requestsStore";
import { recommendationsStore, Recommendation } from "@/store/recommendationsStore";

interface DashboardProps {
  user: {
    firstName: string;
    lastName: string;
    role: "tenant" | "recommender" | "landlord";
    email: string;
    phone: string;
    city?: string;
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
  { id: "settings", label: "Настройки профиля", icon: "Settings" },
];

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>("feed");
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [userRecommendations, setUserRecommendations] = useState<Recommendation[]>([]);

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

    updateUserRequests();
    const unsubscribe = requestsStore.subscribe(updateUserRequests);
    return unsubscribe;
  }, [user.email]);

  useEffect(() => {
    const updateUserRecommendations = () => {
      const recommendations = recommendationsStore.getUserRecommendations(user.email);
      setUserRecommendations(recommendations);
    };

    updateUserRecommendations();
    const unsubscribe = recommendationsStore.subscribe(updateUserRecommendations);
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
            <h2 className="text-3xl font-bold text-foreground mb-6">Лента заявок</h2>
            <RequestsFeed />
          </div>
        );
      case "requests":
        return <DashboardRequestsSection userRequests={userRequests} />;
      case "recommendations":
        return <DashboardRecommendationsSection userRecommendations={userRecommendations} />;
      default:
        return <DashboardOtherSections activeSection={activeSection} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background">
        <PortfolioNavbar onLogout={onLogout} showNavigation={false} />
      </div>

      <div className="flex max-w-7xl mx-auto pt-[80px]">
        <aside className="w-56 bg-white border-r border-border min-h-[calc(100vh-80px)] p-4 sticky top-[80px] self-start">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === item.id
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-gray-100"
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>

      <Footer />
    </div>
  );
};