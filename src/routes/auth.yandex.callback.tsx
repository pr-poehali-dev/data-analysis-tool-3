import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import YandexCallback from "@/pages/YandexCallback";

export const Route = createFileRoute("/auth/yandex/callback")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><YandexCallback/></SessionGate>,
});
