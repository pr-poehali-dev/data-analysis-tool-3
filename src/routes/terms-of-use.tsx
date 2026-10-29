import {createFileRoute} from "@tanstack/react-router";
import {TermsOfUse} from "@/pages/TermsOfUse";

export const Route = createFileRoute("/terms-of-use")({
    component: TermsOfUse,
});
