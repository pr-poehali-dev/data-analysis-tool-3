import {createFileRoute} from "@tanstack/react-router";
import AdminRequests from "@/pages/admin/AdminRequests";

export const Route = createFileRoute("/admin/requests")({
    component: AdminRequests,
});
