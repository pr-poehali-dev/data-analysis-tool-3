import { useState } from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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
  roles: ("tenant" | "recommender" | "landlord")[];
};

const menuItems: MenuItem[] = [
  { id: "requests", label: "Мои заявки", icon: "FileText", roles: ["tenant"] },
  { id: "recommendations", label: "Мои рекомендации", icon: "ThumbsUp", roles: ["tenant", "recommender", "landlord"] },
  { id: "messages", label: "Сообщения", icon: "MessageSquare", roles: ["tenant", "recommender", "landlord"] },
  { id: "documents", label: "Документы", icon: "FolderOpen", roles: ["tenant", "recommender", "landlord"] },
  { id: "balance", label: "Баланс", icon: "Wallet", roles: ["recommender"] },
  { id: "settings", label: "Настройки профиля", icon: "Settings", roles: ["tenant", "recommender", "landlord"] },
];

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeSection, setActiveSection] = useState("requests");

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const renderContent = () => {
    switch (activeSection) {
      case "requests":
        return (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Мои заявки</h2>
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">У вас пока нет активных заявок</p>
              <Button className="mt-6">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать заявку
              </Button>
            </div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img 
            src="https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/34962643-9b8b-4fd1-bec2-5ba3e9cbbfcc.png" 
            alt="SovetPay" 
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName}
            </span>
            <Button variant="outline" onClick={onLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        <aside className="w-64 bg-white border-r border-border min-h-[calc(100vh-73px)] p-6">
          <nav className="space-y-2">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
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
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
