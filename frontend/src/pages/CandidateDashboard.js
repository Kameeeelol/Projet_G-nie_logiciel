import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Briefcase, User, Search, Kanban, MessageSquare, Calendar, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CandidateHome from "@/pages/candidate/CandidateHome";
import CandidateProfile from "@/pages/candidate/CandidateProfile";
import JobFeed from "@/pages/candidate/JobFeed";
import ApplicationTracker from "@/pages/candidate/ApplicationTracker";
import CandidateMessages from "@/pages/candidate/CandidateMessages";
import CandidateCalendar from "@/pages/candidate/CandidateCalendar";

const navItems = [
  { path: "", icon: Briefcase, label: "Tableau de bord" },
  { path: "profil", icon: User, label: "Mon profil" },
  { path: "offres", icon: Search, label: "Offres" },
  { path: "candidatures", icon: Kanban, label: "Candidatures" },
  { path: "messages", icon: MessageSquare, label: "Messages" },
  { path: "calendrier", icon: Calendar, label: "Calendrier" },
];

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location.pathname.replace("/candidat/", "").replace("/candidat", "");

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-[#0F172A] flex" data-testid="candidate-dashboard">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 p-5 border-b border-slate-800">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-50 text-sm tracking-tight">StageConnect</span>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = currentPath === item.path || (item.path === "" && currentPath === "");
            return (
              <button
                key={item.path}
                data-testid={`nav-${item.path || "home"}`}
                onClick={() => { navigate(`/candidat/${item.path}`); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-300" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-medium">
              {user?.full_name?.charAt(0) || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button data-testid="logout-btn" variant="ghost" onClick={handleLogout} className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm">
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 h-14">
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-medium text-slate-300">
              {navItems.find(n => n.path === currentPath)?.label || "Tableau de bord"}
            </h1>
            <div className="w-8" />
          </div>
        </header>
        <div className="p-6">
          <Routes>
            <Route index element={<CandidateHome />} />
            <Route path="profil" element={<CandidateProfile />} />
            <Route path="offres" element={<JobFeed />} />
            <Route path="candidatures" element={<ApplicationTracker />} />
            <Route path="messages" element={<CandidateMessages />} />
            <Route path="calendrier" element={<CandidateCalendar />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
