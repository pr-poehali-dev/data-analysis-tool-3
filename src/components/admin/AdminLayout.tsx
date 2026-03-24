import { useEffect } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { adminStore } from "@/store/adminStore";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { to: "/admin/users", label: "Пользователи", icon: "Users" },
  { to: "/admin/requests", label: "Заявки", icon: "FileText" },
  { to: "/admin/recommendations", label: "Рекомендации", icon: "ThumbsUp" },
  { to: "/admin/escrow", label: "Сделки", icon: "Banknote" },
  { to: "/admin/reviews", label: "Отзывы", icon: "Star" },
  { to: "/admin/feedback", label: "Обратная связь", icon: "MessageSquare" },
  { to: "/admin/stats", label: "Статистика", icon: "BarChart2" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminStore.isAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    adminStore.clearToken();
    navigate("/admin/login", { replace: true });
  };

  if (!adminStore.isAuthenticated()) {
    return null;
  }

  return (
    <div className="h-screen flex bg-muted/20">
      {/* Боковое меню */}
      <aside className="w-56 shrink-0 bg-background border-r flex flex-col">
        <div className="px-4 py-5 border-b flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="ShieldCheck" size={16} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">Админ-панель</span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Основное содержимое */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}