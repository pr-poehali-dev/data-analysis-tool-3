import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Icon from "@/components/ui/icon";

interface ProfileMenuItem {
  id: string;
  label: string;
  icon: string;
}

const profileMenuItems: ProfileMenuItem[] = [
  { id: "documents", label: "Документы", icon: "FolderOpen" },
  { id: "balance", label: "Баланс", icon: "Wallet" },
  { id: "reviews", label: "Отзывы", icon: "Star" },
  { id: "settings", label: "Настройка профиля", icon: "Settings" },
];

interface MobileProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onLogout: () => void;
}

export const MobileProfileSheet = ({
  open,
  onOpenChange,
  onSelect,
  onLogout,
}: MobileProfileSheetProps) => {
  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  const handleLogout = () => {
    onOpenChange(false);
    onLogout();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="md:hidden rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <SheetHeader>
          <SheetTitle>Профиль</SheetTitle>
        </SheetHeader>

        <nav className="mt-4 space-y-1">
          {profileMenuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-gray-100 transition-colors"
            >
              <Icon name={item.icon} size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors mt-2"
          >
            <Icon name="LogOut" size={20} />
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
