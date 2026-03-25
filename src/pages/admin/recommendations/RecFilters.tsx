import { RecommendationsFilter } from "@/hooks/useAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";

interface RecFiltersProps {
  searchInput: string;
  filter: RecommendationsFilter;
  pages: number;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onStatusFilter: (value: string) => void;
  onPage: (newPage: number) => void;
}

export default function RecFilters({
  searchInput,
  filter,
  pages,
  onSearchInputChange,
  onSearch,
  onKeyDown,
  onStatusFilter,
  onPage,
}: RecFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-2 w-full sm:flex-1 sm:min-w-[220px]">
          <Input
            placeholder="Поиск по адресу, заявке, email..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={onSearch}>
            <Icon name="Search" size={16} />
          </Button>
        </div>

        <Select defaultValue="all" onValueChange={onStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">На модерации</SelectItem>
            <SelectItem value="accepted">Принятые</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
            <SelectItem value="deleted">Удалённые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <Button
            variant="outline"
            size="sm"
            disabled={(filter.page || 1) <= 1}
            onClick={() => onPage((filter.page || 1) - 1)}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {filter.page || 1} из {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(filter.page || 1) >= pages}
            onClick={() => onPage((filter.page || 1) + 1)}
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      )}
    </>
  );
}