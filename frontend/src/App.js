import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import CandidateDashboard from "@/pages/CandidateDashboard";
import RecruiterDashboard from "@/pages/RecruiterDashboard";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" />;
  if (role && user.role !== role) return <Navigate to={user.role === "candidate" ? "/candidat" : "/recruteur"} />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === "candidate" ? "/candidat" : "/recruteur"} /> : <LandingPage />} />
      <Route path="/auth" element={user ? <Navigate to={user.role === "candidate" ? "/candidat" : "/recruteur"} /> : <AuthPage />} />
      <Route path="/candidat/*" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
      <Route path="/recruteur/*" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}
