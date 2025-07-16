import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { CRMLayout } from "@/components/layouts/CRMLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import Guide from "./pages/Guide";
import Projects from "./pages/Projects";
import Contract from "./pages/Contract";
import Notifications from "./pages/Notifications";
import DuckAI from "./pages/DuckAI";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Payment from "./pages/Payment";
import Statistics from "./pages/Statistics";
import UpdatedSettings from "./pages/UpdatedSettings";
import ClientsManagement from "./pages/ClientsManagement";
import DesignerManagement from "./pages/DesignerManagement";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import RFQ from "./pages/RFQ";
import Invoice from "./pages/Invoice";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="crm-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<SignIn />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Dashboard />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/community" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Community />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/how-to" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Guide />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/guide" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Guide />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Notifications />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Projects />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/duck-ai" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <DuckAI />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Profile />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Chat />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/payment" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Payment />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/statistics" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Statistics />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <UpdatedSettings />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/clients-management" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <ClientsManagement />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/projects-management" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Projects />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/projects-management/design" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Contract />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/projects-management/manufacturing" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <RFQ />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/projects-management/completed" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <Invoice />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              <Route path="/designer-management" element={
                <ProtectedRoute>
                  <CRMLayout>
                    <DesignerManagement />
                  </CRMLayout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
