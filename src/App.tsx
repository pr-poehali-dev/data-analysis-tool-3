
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Dashboard } from "./pages/Dashboard";
import { Feed } from "./pages/Feed";
import { CreateRequest } from "./pages/CreateRequest";
import { EditRequest } from "./pages/EditRequest";
import { SuggestProperty } from "./pages/SuggestProperty";
import { EditRecommendation } from "./pages/EditRecommendation";
import { RequestOffers } from "./pages/RequestOffers";
import { RequestDetails } from "./pages/RequestDetails";
import { authStore } from "./store/authStore";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    role: "tenant" | "recommender" | "landlord";
    email: string;
    phone: string;
    city?: string;
    photo?: string;
    vkLink?: string;
  } | null>(null);

  useEffect(() => {
    const savedUser = authStore.getUser();
    if (savedUser) {
      setUser(savedUser);
    }

    const unsubscribe = authStore.subscribe(() => {
      setUser(authStore.getUser());
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    authStore.logout();
    setUser(null);
    navigate("/");
  };

  const handleRegistrationSuccess = (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      role: "tenant",
      email: data.email,
      phone: data.phone,
    };
    
    authStore.setUser(userData);
    setUser(userData);
    navigate("/");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Index onRegistrationSuccess={handleRegistrationSuccess} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Index onRegistrationSuccess={handleRegistrationSuccess} />
          )
        }
      />
      <Route path="/feed" element={<Feed />} />
      <Route path="/create-request" element={<CreateRequest />} />
      <Route path="/edit-request/:requestId" element={<EditRequest />} />
      <Route path="/suggest-property" element={<SuggestProperty />} />
      <Route path="/edit-recommendation/:recommendationId" element={<EditRecommendation />} />
      <Route path="/request-offers/:requestId" element={<RequestOffers currentUser={user || undefined} />} />
      <Route path="/request/:requestId" element={<RequestDetails />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;