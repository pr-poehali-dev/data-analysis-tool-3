import { useEffect, useState } from "react";
import { useNavigate, Outlet, NavLink, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!adminStore.isAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  // Закрываем drawer при смене маршрута
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    adminStore.clearToken();
    navigate("/admin/login", { replace: true });
  };

  if (!adminStore.isAuthenticated()) {
    return null;
  }

  const activeLabel = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))?.label ?? "Админ-панель";

  const SidebarContent = () => (
    <>
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
    </>
  );

  return (
    <div className="h-screen flex bg-muted/20">
      {/* Боковое меню — только на десктопе */}
      <aside className="hidden md:flex w-56 shrink-0 bg-background border-r flex-col">
        <SidebarContent />
      </aside>

      {/* Мобильный drawer — затемнение фона */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Мобильный drawer — само меню */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-background border-r flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Основное содержимое */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Мобильный хедер — только на мобильных */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-background border-b shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Открыть меню"
          >
            <Icon name="Menu" size={20} />
          </button>
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <Icon name="ShieldCheck" size={12} className="text-primary-foreground" />
          </div>
          <span className="font-medium text-sm text-foreground">{activeLabel}</span>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
