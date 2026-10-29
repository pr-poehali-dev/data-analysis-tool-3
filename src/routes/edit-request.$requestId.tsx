import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import {EditRequest} from "@/pages/EditRequest";

export const Route = createFileRoute("/edit-request/$requestId")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><EditRequest/></SessionGate>,
});
