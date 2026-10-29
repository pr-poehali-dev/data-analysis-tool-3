import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import {SuggestProperty} from "@/pages/SuggestProperty";

export const Route = createFileRoute("/suggest-property")({
    ssr: false,
    pendingComponent: PagePending,
    component: () => <SessionGate><SuggestProperty/></SessionGate>,
});
