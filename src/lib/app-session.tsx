import {createContext, useContext} from "react";

export type AppUser = {
    firstName: string;
    lastName: string;
    role: "tenant" | "recommender" | "landlord";
    email: string;
    phone: string;
    city?: string;
    photo?: string;
    vkLink?: string;
};

export type RegistrationData = {firstName: string; lastName: string; email: string; phone: string};

export type AppSession = {
    user: AppUser | null;
    /** true once the stored session was restored in the browser */
    sessionReady: boolean;
    handleLogout: () => void;
    handleRegistrationSuccess: (data: RegistrationData) => void;
};

export const AppSessionContext = createContext<AppSession>({
    user: null,
    sessionReady: false,
    handleLogout: () => undefined,
    handleRegistrationSuccess: () => undefined,
});

export function useAppSession(): AppSession {
    return useContext(AppSessionContext);
}
