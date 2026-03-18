import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, X, Upload, Save, GraduationCap, Briefcase } from "lucide-react";

export default function CandidateProfile() {
  const { user, axiosAuth, refreshUser } = useAuth();
  const [form, setForm] = useState({
    full_name: "", bio: "", location: "", phone: "", skills: [], education: [], experience: []
  });
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        phone: user.phone || "",
        skills: user.skills || [],
        education: user.education || [],
        experience: user.experience || [],
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosAuth().put("/profile", form);
      await refreshUser();
      toast.success("Profil mis à jour");
    } catch { toast.error("Erreur de sauvegarde"); }
    setSaving(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm(f => ({ ...f, skills: [...f.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));

  const addEducation = () => setForm(f => ({ ...f, education: [...f.education, { school: "", degree: "", year: "" }] }));
  const updateEducation = (i, field, val) => {
    const edu = [...form.education];
    edu[i] = { ...edu[i], [field]: val };
    setForm(f => ({ ...f, education: edu }));
  };
  const removeEducation = (i) => setForm(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));

  const addExperience = () => setForm(f => ({ ...f, experience: [...f.experience, { company: "", role: "", period: "", description: "" }] }));
  const updateExperience = (i, field, val) => {
    const exp = [...form.experience];
    exp[i] = { ...exp[i], [field]: val };
    setForm(f => ({ ...f, experience: exp }));
  };
  const removeExperience = (i) => setForm(f => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }));

  const handleUploadCV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosAuth().post("/upload/cv", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`CV "${res.data.filename}" uploadé`);
      await refreshUser();
    } catch { toast.error("Erreur d'upload"); }
    setUploading(false);
  };

  const inputCls = "bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600";

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in" data-testid="candidate-profile">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Mon profil</h2>
          <p className="text-sm text-slate-400 mt-1">Complétez votre profil pour de meilleures recommandations</p>
        </div>
        <Button data-testid="save-profile-btn" onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
          <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
        </Button>
      </div>

      {/* Basic info */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Informations personnelles</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[13px] text-slate-400">Nom complet</Label>
            <Input data-testid="profile-name-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Localisation</Label>
            <Input data-testid="profile-location-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Paris" className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Téléphone</Label>
            <Input data-testid="profile-phone-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" className={`mt-1.5 ${inputCls}`} />
          </div>
        </div>
        <div>
          <Label className="text-[13px] text-slate-400">Bio</Label>
          <Textarea data-testid="profile-bio-input" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Parlez de vous..." className="mt-1.5 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-600 min-h-[80px]" />
        </div>
      </div>

      {/* CV Upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">Curriculum Vitae</h3>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer" data-testid="cv-upload-label">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleUploadCV} className="hidden" data-testid="cv-upload-input" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-slate-700 text-sm text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Upload en cours..." : "Téléverser un CV"}
            </div>
          </label>
          {user?.cv_url && <span className="text-xs text-emerald-400">CV enregistré</span>}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">Compétences</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {form.skills.map(skill => (
            <Badge key={skill} className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 gap-1 pr-1">
              {skill}
              <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-400"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input data-testid="skill-input" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Ajouter une compétence" className={`flex-1 ${inputCls}`} />
          <Button data-testid="add-skill-btn" onClick={addSkill} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Education */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Formation</h3>
          <Button data-testid="add-education-btn" onClick={addEducation} variant="ghost" className="text-indigo-400 hover:text-indigo-300 text-xs gap-1"><Plus className="w-3 h-3" /> Ajouter</Button>
        </div>
        <div className="space-y-4">
          {form.education.map((edu, i) => (
            <div key={i} className="grid sm:grid-cols-3 gap-3 p-3 bg-slate-950/50 rounded-md relative">
              <Input value={edu.school} onChange={e => updateEducation(i, "school", e.target.value)} placeholder="Établissement" className={inputCls} />
              <Input value={edu.degree} onChange={e => updateEducation(i, "degree", e.target.value)} placeholder="Diplôme" className={inputCls} />
              <div className="flex gap-2">
                <Input value={edu.year} onChange={e => updateEducation(i, "year", e.target.value)} placeholder="Année" className={`flex-1 ${inputCls}`} />
                <Button variant="ghost" onClick={() => removeEducation(i)} className="text-slate-500 hover:text-red-400 px-2"><X className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide flex items-center gap-2"><Briefcase className="w-4 h-4" /> Expérience</h3>
          <Button data-testid="add-experience-btn" onClick={addExperience} variant="ghost" className="text-indigo-400 hover:text-indigo-300 text-xs gap-1"><Plus className="w-3 h-3" /> Ajouter</Button>
        </div>
        <div className="space-y-4">
          {form.experience.map((exp, i) => (
            <div key={i} className="p-3 bg-slate-950/50 rounded-md space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <Input value={exp.company} onChange={e => updateExperience(i, "company", e.target.value)} placeholder="Entreprise" className={inputCls} />
                <Input value={exp.role} onChange={e => updateExperience(i, "role", e.target.value)} placeholder="Poste" className={inputCls} />
                <div className="flex gap-2">
                  <Input value={exp.period} onChange={e => updateExperience(i, "period", e.target.value)} placeholder="Période" className={`flex-1 ${inputCls}`} />
                  <Button variant="ghost" onClick={() => removeExperience(i)} className="text-slate-500 hover:text-red-400 px-2"><X className="w-4 h-4" /></Button>
                </div>
              </div>
              <Textarea value={exp.description} onChange={e => updateExperience(i, "description", e.target.value)} placeholder="Description" className="bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-600 min-h-[60px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
