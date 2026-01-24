import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { RequestsFeed } from "@/components/dashboard/RequestsFeed";
import { PortfolioNavbar, Footer } from "@/components/landing";
import { useNavigate } from "react-router-dom";
import { requestsStore, Request } from "@/store/requestsStore";

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
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("feed");
  const [userRequests, setUserRequests] = useState<Request[]>([]);

  useEffect(() => {
    const updateUserRequests = () => {
      const requests = requestsStore.getUserRequests(user.email);
      setUserRequests(requests);
    };

    updateUserRequests();
    const unsubscribe = requestsStore.subscribe(updateUserRequests);
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
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Мои заявки</h2>
            {userRequests.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">У вас пока нет активных заявок</p>
                <Button 
                  className="mt-6" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/create-request");
                  }}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать заявку
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-border rounded-xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={request.avatar}
                        alt={request.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{request.name}</h3>
                          <span className="text-sm text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
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
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">О себе:</p>
                          <p className="text-sm text-foreground mt-1">{request.aboutYourself}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/create-request");
                  }}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать ещё одну заявку
                </Button>
              </div>
            )}
          </div>
        );
      case "recommendations":
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Мои рекомендации</h2>
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="ThumbsUp" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">У вас пока нет рекомендаций</p>
            </div>
          </div>
        );
      case "messages":
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Сообщения</h2>
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">У вас нет новых сообщений</p>
            </div>
          </div>
        );
      case "documents":
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Документы</h2>
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="FolderOpen" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">У вас пока нет документов</p>
              <Button className="mt-6">
                <Icon name="Upload" size={16} className="mr-2" />
                Загрузить документ
              </Button>
            </div>
          </div>
        );
      case "balance":
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Баланс</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">Доступно к выводу</p>
                <p className="text-3xl font-bold text-foreground">0 ₽</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">В обработке</p>
                <p className="text-3xl font-bold text-foreground">0 ₽</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">Заработано всего</p>
                <p className="text-3xl font-bold text-foreground">0 ₽</p>
              </div>
            </div>
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="Wallet" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">История транзакций пуста</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Настройки профиля</h2>
            <div className="bg-white border border-border rounded-xl p-8">
              <div className="grid gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Имя</label>
                  <input
                    type="text"
                    defaultValue={user.firstName}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Фамилия</label>
                  <input
                    type="text"
                    defaultValue={user.lastName}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Телефон</label>
                  <input
                    type="tel"
                    defaultValue={user.phone}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {user.city && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Город</label>
                    <input
                      type="text"
                      defaultValue={user.city}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <Button>
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить изменения
                  </Button>
                  <Button variant="outline">Отменить</Button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background">
        <PortfolioNavbar onLogout={onLogout} />
      </div>

      <div className="flex max-w-7xl mx-auto pt-[80px]">
        <aside className="w-64 bg-white border-r border-border min-h-[calc(100vh-80px)] p-6 sticky top-[80px] self-start">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-gray-100"
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="font-medium">{item.label}</span>
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