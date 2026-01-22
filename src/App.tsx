
import { useState } from "react";
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
import { SuggestProperty } from "./pages/SuggestProperty";

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
  } | null>(null);

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const handleRegistrationSuccess = (data: any) => {
    setUser({
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      email: data.email,
      phone: data.phone,
      city: data.city,
    });
    
    if (data.role === "tenant") {
      navigate("/create-request");
    }
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
      <Route path="/feed" element={<Feed />} />
      <Route path="/create-request" element={<CreateRequest />} />
      <Route path="/suggest-property" element={<SuggestProperty />} />
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