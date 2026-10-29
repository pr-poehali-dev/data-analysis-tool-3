import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import {CreateRequest} from "@/pages/CreateRequest";

export const Route = createFileRoute("/create-request")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><CreateRequest/></SessionGate>,
});
