import {createFileRoute} from "@tanstack/react-router";
import AdminStats from "@/pages/admin/AdminStats";

export const Route = createFileRoute("/admin/stats")({
    component: AdminStats,
});
