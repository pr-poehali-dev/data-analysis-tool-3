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

const roleNames = {
  tenant: "Арендатор",
  recommender: "Рекомендатель",
  landlord: "Арендодатель",
};

const roleDescriptions = {
  tenant: "Вы можете просматривать предложения от рекомендателей и находить своё жильё",
  recommender: "Вы можете рекомендовать варианты арендаторам и получать вознаграждение",
  landlord: "Вы можете размещать свои объекты и находить арендаторов через рекомендации",
};

const roleActions = {
  tenant: [
    { icon: "Search", label: "Найти жильё", href: "#search" },
    { icon: "Bell", label: "Мои заявки", href: "#requests" },
    { icon: "MessageSquare", label: "Сообщения", href: "#messages" },
  ],
  recommender: [
    { icon: "List", label: "Лента заявок", href: "#feed" },
    { icon: "ThumbsUp", label: "Мои рекомендации", href: "#my-recommendations" },
    { icon: "Wallet", label: "Вознаграждения", href: "#earnings" },
  ],
  landlord: [
    { icon: "Plus", label: "Добавить объект", href: "#add-property" },
    { icon: "Home", label: "Мои объекты", href: "#my-properties" },
    { icon: "Users", label: "Заявки арендаторов", href: "#tenant-requests" },
  ],
};

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">SovetPay</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {roleNames[user.role]}
            </span>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">
              Привет, {user.firstName}!
            </h2>
            <p className="text-lg text-muted-foreground">
              {roleDescriptions[user.role]}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {roleActions[user.role].map((action, index) => (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-white border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon
                    name={action.icon}
                    className="text-primary"
                    size={24}
                  />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {action.label}
                </h3>
                <div className="flex items-center text-primary gap-2 text-sm font-medium">
                  <span>Перейти</span>
                  <Icon name="ArrowRight" size={16} />
                </div>
              </motion.a>
            ))}
          </div>

          <div className="bg-white border border-border rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Информация профиля
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Имя и Фамилия</p>
                <p className="text-lg font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-lg font-medium text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Телефон</p>
                <p className="text-lg font-medium text-foreground">{user.phone}</p>
              </div>
              {user.city && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Город</p>
                  <p className="text-lg font-medium text-foreground">{user.city}</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <Button variant="outline">
                <Icon name="Settings" size={16} className="mr-2" />
                Редактировать профиль
              </Button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Icon name="Info" className="text-white" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Это демонстрационная версия
                </h4>
                <p className="text-muted-foreground">
                  Личный кабинет находится в разработке. Здесь будет полный функционал для {roleNames[user.role].toLowerCase()}а.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
