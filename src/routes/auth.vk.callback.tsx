import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import VkCallback from "@/pages/VkCallback";

export const Route = createFileRoute("/auth/vk/callback")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><VkCallback/></SessionGate>,
});
