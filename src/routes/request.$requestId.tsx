import {useMemo} from "react";
import {createFileRoute, notFound} from "@tanstack/react-router";
import {RequestDetails} from "@/pages/RequestDetails";
import {loadRequestById, toRequests} from "@/lib/public-requests";

export const Route = createFileRoute("/request/$requestId")({
    loader: async ({params}) => {
        const request = await loadRequestById(params.requestId);
        if (request === "missing") throw notFound();
        return {request};
    },
    head: ({loaderData}) => {
        const request = loaderData?.request;
        if (!request) return {};
        const title = `${request.name} — заявка на аренду в ${request.city || "SovetPay"}`;
        const description = `${request.location}. Бюджет: ${request.budget}. Вознаграждение за рекомендацию: ${request.reward}.`;
        return {
            meta: [
                {title},
                {name: "description", content: description},
                {property: "og:title", content: title},
                {property: "og:description", content: description},
            ],
        };
    },
    component: RequestPage,
});

function RequestPage() {
    const {request} = Route.useLoaderData();
    const initialRequest = useMemo(() => (request ? toRequests([request])[0] : null), [request]);
    return <RequestDetails initialRequest={initialRequest}/>;
}
