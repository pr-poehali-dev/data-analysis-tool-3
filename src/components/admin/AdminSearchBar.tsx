import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AdminSearchBarProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export default function AdminSearchBar({
  value,
  placeholder = "Поиск...",
  onChange,
  onSearch,
}: AdminSearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="flex gap-2 w-full sm:flex-1 sm:min-w-[220px]">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1"
      />
      <Button variant="outline" size="icon" onClick={onSearch}>
        <Icon name="Search" size={16} />
      </Button>
    </div>
  );
}
