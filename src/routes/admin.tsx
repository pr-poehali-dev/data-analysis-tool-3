import {createFileRoute} from "@tanstack/react-router";
import {PagePending} from "@/components/PagePending";
import AdminLayout from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
    ssr: false,
    pendingComponent: PagePending,
    component: AdminLayout,
});
