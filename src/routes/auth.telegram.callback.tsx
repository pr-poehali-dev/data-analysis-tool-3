import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import TelegramCallback from "@/pages/TelegramCallback";

export const Route = createFileRoute("/auth/telegram/callback")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><TelegramCallback/></SessionGate>,
});
