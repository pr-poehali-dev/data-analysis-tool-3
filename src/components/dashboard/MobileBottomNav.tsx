import Icon from "@/components/ui/icon";
import { getDashboardMenuItem } from "@/config/dashboardMenu";

interface MobileBottomNavItem {
  id: string;
  label: string;
  icon: string;
}

const BOTTOM_NAV_IDS = ["feed", "recommendations", "requests", "messages"];

const bottomNavItems: MobileBottomNavItem[] = [
  ...BOTTOM_NAV_IDS.map((id) => {
    const item = getDashboardMenuItem(id)!;
    return { id: item.id, label: item.shortLabel ?? item.label, icon: item.icon };
  }),
  { id: "profile", label: "Профиль", icon: "User" },
];

const PROFILE_SECTIONS = ["documents", "balance", "reviews", "settings"];

interface MobileBottomNavProps {
  activeSection: string;
  onSelect: (id: string) => void;
  unreadMessagesCount: number;
  onProfileClick: () => void;
}

export const MobileBottomNav = ({
  activeSection,
  onSelect,
  unreadMessagesCount,
  onProfileClick,
}: MobileBottomNavProps) => {
  const isProfileActive = PROFILE_SECTIONS.includes(activeSection);

  const handleClick = (id: string) => {
    if (id === "profile") {
      onProfileClick();
      return;
    }
    onSelect(id);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border pb-[calc(env(safe-area-inset-bottom)+10px)]">
      <div className="flex items-stretch justify-between px-1">
        {bottomNavItems.map((item) => {
          const isActive = item.id === "profile" ? isProfileActive : activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1"
            >
              <span className={`relative ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <Icon name={item.icon} size={22} />
                {item.id === "messages" && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] text-center leading-none">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};