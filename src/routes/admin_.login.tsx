import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import AdminLogin from "@/pages/admin/AdminLogin";

export const Route = createFileRoute("/admin_/login")({
    ssr: false,
    pendingComponent: PagePending,
    component: AdminLogin,
});
