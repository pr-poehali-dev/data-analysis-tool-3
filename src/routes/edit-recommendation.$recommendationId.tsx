import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import {EditRecommendation} from "@/pages/EditRecommendation";

export const Route = createFileRoute("/edit-recommendation/$recommendationId")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><EditRecommendation/></SessionGate>,
});
