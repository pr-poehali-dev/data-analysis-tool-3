import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  labels: Record<string, string>;
  styles: Record<string, string>;
  className?: string;
}

export default function StatusBadge({ status, labels, styles, className = "" }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs ${styles[status] || ""} ${className}`}
    >
      {labels[status] || status}
    </Badge>
  );
}
