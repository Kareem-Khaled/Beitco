import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import SearchPage from "./pages/Search";
import ListingsPage from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import NotificationsPage from "./pages/Notifications";
import ChatPage from "./pages/Chat";
import CreatePost from "./pages/CreatePost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LayoutRoute({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LayoutRoute><Index /></LayoutRoute>} />
          <Route path="/search" element={<LayoutRoute><SearchPage /></LayoutRoute>} />
          <Route path="/listings" element={<LayoutRoute><ListingsPage /></LayoutRoute>} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/profile" element={<LayoutRoute><ProfilePage /></LayoutRoute>} />
          <Route path="/notifications" element={<LayoutRoute><NotificationsPage /></LayoutRoute>} />
          <Route path="/chat" element={<LayoutRoute><ChatPage /></LayoutRoute>} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
