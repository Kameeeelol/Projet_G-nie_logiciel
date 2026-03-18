import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, GraduationCap, Building2, ArrowRight, Users, FileText, Calendar, MessageSquare } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A]" data-testid="landing-page">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50 bg-[#0F172A]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <span className="text-lg font-semibold text-slate-50 tracking-tight">StageConnect</span>
          </div>
          <Button data-testid="nav-login-btn" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => navigate("/auth")}>
            Se connecter
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl animate-slide-up">
            <p className="text-xs font-medium tracking-widest uppercase text-indigo-400 mb-4">Plateforme de stages et emplois</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-50 leading-[1.1]">
              Connectez talents et opportunités
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
              StageConnect simplifie la recherche de stages et d'emplois pour les étudiants, et le recrutement pour les entreprises. Une plateforme moderne, rapide et intuitive.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-3xl">
            <button
              data-testid="cta-candidate-btn"
              onClick={() => navigate("/auth?role=candidate")}
              className="group relative bg-slate-900 border border-slate-800 rounded-lg p-8 text-left hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 animate-fade-in stagger-1"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-50 tracking-tight mb-2">Je suis candidat</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Trouvez le stage ou l'emploi idéal, suivez vos candidatures et préparez vos entretiens.
              </p>
              <ArrowRight className="w-5 h-5 text-indigo-400 mt-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              data-testid="cta-recruiter-btn"
              onClick={() => navigate("/auth?role=recruiter")}
              className="group relative bg-slate-900 border border-slate-800 rounded-lg p-8 text-left hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 animate-fade-in stagger-2"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-50 tracking-tight mb-2">Je suis recruteur</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Publiez vos offres, gérez les candidatures et trouvez les meilleurs talents.
              </p>
              <ArrowRight className="w-5 h-5 text-emerald-400 mt-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800/50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase text-slate-500 mb-3">Fonctionnalités</p>
          <h2 className="text-3xl font-medium tracking-tight text-slate-50 mb-12">Tout ce dont vous avez besoin</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: "Suivi des candidatures", desc: "Tableau Kanban pour suivre chaque étape de vos candidatures" },
              { icon: Users, title: "Profils détaillés", desc: "CV, compétences et parcours en un seul endroit" },
              { icon: MessageSquare, title: "Messagerie intégrée", desc: "Communiquez en temps réel avec les recruteurs ou candidats" },
              { icon: Calendar, title: "Calendrier d'entretiens", desc: "Planifiez et gérez tous vos rendez-vous" },
            ].map((f, i) => (
              <div key={i} className={`bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors animate-fade-in stagger-${i+1}`}>
                <f.icon className="w-5 h-5 text-indigo-400 mb-4" />
                <h3 className="text-sm font-medium text-slate-200 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>StageConnect</span>
          </div>
          <span>2026 Tous droits réservés</span>
        </div>
      </footer>
    </div>
  );
}
