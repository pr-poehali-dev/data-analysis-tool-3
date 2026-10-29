import {createFileRoute} from "@tanstack/react-router";
import AdminFeedback from "@/pages/admin/AdminFeedback";

export const Route = createFileRoute("/admin/feedback")({
    component: AdminFeedback,
});
