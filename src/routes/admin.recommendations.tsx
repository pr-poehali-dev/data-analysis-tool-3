import {createFileRoute} from "@tanstack/react-router";
import AdminRecommendations from "@/pages/admin/AdminRecommendations";

export const Route = createFileRoute("/admin/recommendations")({
    component: AdminRecommendations,
});
