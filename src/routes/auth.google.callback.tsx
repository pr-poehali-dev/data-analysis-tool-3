import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import GoogleCallback from "@/pages/GoogleCallback";

export const Route = createFileRoute("/auth/google/callback")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><GoogleCallback/></SessionGate>,
});
