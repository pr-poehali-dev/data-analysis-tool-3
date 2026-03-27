
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
import { HowItWorks } from "./pages/HowItWorks";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfUse } from "./pages/TermsOfUse";
import { Help } from "./pages/Help";
import YandexCallback from "./pages/YandexCallback";
import TelegramCallback from "./pages/TelegramCallback";
import VkCallback from "./pages/VkCallback";
import GoogleCallback from "./pages/GoogleCallback";
import { authStore } from "./store/authStore";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminRecommendations from "./pages/admin/AdminRecommendations";
import AdminEscrow from "./pages/admin/AdminEscrow";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminStats from "./pages/admin/AdminStats";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminLayout from "./components/admin/AdminLayout";

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
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    console.log("[App] starting restoreSession...");
    authStore.restoreSession().then(() => {
      const restoredUser = authStore.getUser();
      console.log("[App] session restored, user:", restoredUser?.email || "null", "hasAccessToken:", !!authStore.getAccessToken());
      setUser(restoredUser);
      setSessionReady(true);
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
    // Новый пользователь после регистрации сразу попадает на создание заявки
    navigate("/create-request");
  };

  if (!sessionReady) {
    return null;
  }

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
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/help" element={<Help />} />
      <Route path="/create-request" element={<CreateRequest />} />
      <Route path="/edit-request/:requestId" element={<EditRequest />} />
      <Route path="/suggest-property" element={<SuggestProperty />} />
      <Route path="/edit-recommendation/:recommendationId" element={<EditRecommendation />} />
      <Route path="/request-offers/:requestId" element={<RequestOffers currentUser={user || undefined} />} />
      <Route path="/request/:requestId" element={<RequestDetails />} />
      <Route path="/auth/yandex/callback" element={<YandexCallback />} />
      <Route path="/auth/telegram/callback" element={<TelegramCallback />} />
      <Route path="/auth/vk/callback" element={<VkCallback />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      {/* Админ-панель — изолированный layout, не пересекается с основным сайтом */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="escrow" element={<AdminEscrow />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
      </Route>
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