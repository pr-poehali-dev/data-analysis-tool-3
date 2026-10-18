import { userLocalTimeHint } from "@/lib/admin/userLocalTime";

interface UserLocalTimeProps {
  iso: string | null | undefined;
  tz: string | null | undefined;
  who?: string;
  className?: string;
}

export default function UserLocalTime({ iso, tz, who = "У пользователя", className = "" }: UserLocalTimeProps) {
  const hint = userLocalTimeHint(iso, tz);
  if (!hint) return null;

  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      {who} было {hint}
    </div>
  );
}
