import {createFileRoute} from "@tanstack/react-router";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";

export const Route = createFileRoute("/admin/audit-log")({
    component: AdminAuditLog,
});
