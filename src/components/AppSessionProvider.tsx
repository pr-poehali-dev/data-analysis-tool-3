import {useEffect, useLayoutEffect, useState, type ReactNode} from "react";
import {useNavigate} from "@/lib/router-compat";
import {authStore} from "@/store/authStore";
import {useSyncUserTimezone} from "@/hooks/useSyncUserTimezone";
import {AppSessionContext, useAppSession, type AppUser, type RegistrationData} from "@/lib/app-session";

// Session restore that App.tsx did before rendering the routes. The server
// knows nothing about the session: it renders the guest version of public
// pages. In the browser a visitor with a stored session sees nothing until the
// session is restored (as before); a guest keeps the server-rendered page.
export function AppSessionProvider({children}: {children: ReactNode}) {
    const navigate = useNavigate();
    const [user, setUser] = useState<AppUser | null>(null);
    const [phase, setPhase] = useState<"server" | "restoring" | "ready">("server");

    useSyncUserTimezone(phase === "ready" && user !== null);

    // Layout effect: runs before the passive effects of the pages, so they
    // already see the stored user.
    useLayoutEffect(() => {
        authStore.markHydrated();
        if (authStore.hasStoredSession()) setPhase("restoring");
    }, []);

    useEffect(() => {
        console.log("[App] starting restoreSession...");
        authStore.restoreSession().then(() => {
            const restoredUser = authStore.getUser();
            console.log("[App] session restored, user:", restoredUser?.email || "null", "hasAccessToken:", !!authStore.getAccessToken());
            setUser(restoredUser);
            setPhase("ready");
        });

        const unsubscribe = authStore.subscribe(() => {
            const newUser = authStore.getUser();
            console.log("[App] subscribe triggered, user:", newUser?.email || "null");
            setUser(newUser);
        });

        return unsubscribe;
    }, []);

    const handleLogout = () => {
        authStore.logout();
        setUser(null);
        navigate("/");
    };

    const handleRegistrationSuccess = (data: RegistrationData) => {
        const userData = {
            firstName: data.firstName,
            lastName: data.lastName,
            role: "tenant" as const,
            email: data.email,
            phone: data.phone,
        };

        authStore.setUser(userData);
        setUser(userData);
        // Новый пользователь после регистрации сразу попадает на создание заявки
        navigate("/create-request");
    };

    return (
        <AppSessionContext.Provider value={{user, sessionReady: phase === "ready", handleLogout, handleRegistrationSuccess}}>
            {phase === "restoring" ? null : children}
        </AppSessionContext.Provider>
    );
}

/** Private pages: rendered only after the session is restored, as in the old App. */
export function SessionGate({children}: {children: ReactNode}) {
    const {sessionReady} = useAppSession();
    if (!sessionReady) return null;
    return <>{children}</>;
}
