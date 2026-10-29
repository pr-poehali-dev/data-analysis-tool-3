import {createFileRoute} from "@tanstack/react-router";
import AdminEscrow from "@/pages/admin/AdminEscrow";

export const Route = createFileRoute("/admin/escrow")({
    component: AdminEscrow,
});
