import Index from "@/pages/Index";
import {Dashboard} from "@/pages/Dashboard";
import {useAppSession} from "@/lib/app-session";

/** "/" and "/dashboard": the cabinet for a signed-in user, the landing for a guest. */
export function HomeOrDashboard() {
    const {user, handleLogout, handleRegistrationSuccess} = useAppSession();
    return user ? (
        <Dashboard user={user} onLogout={handleLogout}/>
    ) : (
        <Index onRegistrationSuccess={handleRegistrationSuccess}/>
    );
}
