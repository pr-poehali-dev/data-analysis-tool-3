import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import {SessionGate} from "@/components/AppSessionProvider";
import {RequestOffers} from "@/pages/RequestOffers";
import {useAppSession} from "@/lib/app-session";

export const Route = createFileRoute("/request-offers/$requestId")({
    ssr: false,
    pendingComponent: PagePending,
    component: RequestOffersPage,
});

function RequestOffersPage() {
    const {user} = useAppSession();
    return (
        <SessionGate>
            <RequestOffers currentUser={user || undefined}/>
        </SessionGate>
    );
}
