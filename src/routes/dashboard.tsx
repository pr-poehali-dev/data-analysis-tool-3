import {createFileRoute} from "@tanstack/react-router";
import {HomeOrDashboard} from "@/components/HomeOrDashboard";

export const Route = createFileRoute("/dashboard")({
    component: HomeOrDashboard,
});
