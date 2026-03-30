import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AdminPaginationProps {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}

export default function AdminPagination({ page, pages, onPage }: AdminPaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <Icon name="ChevronLeft" size={16} />
      </Button>
      <span className="text-sm text-muted-foreground">
        Страница {page} из {pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        <Icon name="ChevronRight" size={16} />
      </Button>
    </div>
  );
}
