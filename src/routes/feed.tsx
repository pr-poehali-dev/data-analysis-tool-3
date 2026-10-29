import {useMemo} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Feed} from "@/pages/Feed";
import {loadActiveRequests, toRequests} from "@/lib/public-requests";

export const Route = createFileRoute("/feed")({
    loader: async () => ({requests: await loadActiveRequests()}),
    head: () => ({
        meta: [
            {title: "Лента заявок — SovetPay"},
            {property: "og:title", content: "Лента заявок — SovetPay"},
        ],
    }),
    component: FeedPage,
});

function FeedPage() {
    const {requests} = Route.useLoaderData();
    const initialRequests = useMemo(() => toRequests(requests), [requests]);
    return <Feed initialRequests={initialRequests}/>;
}
