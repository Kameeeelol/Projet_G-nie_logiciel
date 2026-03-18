import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreVertical, Users, Eye, EyeOff, Trash2, MapPin, Clock } from "lucide-react";

export default function ManageOffers() {
  const { axiosAuth } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const res = await axiosAuth().get("/offers/mine");
      setOffers(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, [axiosAuth]);

  const toggleActive = async (offer) => {
    try {
      await axiosAuth().put(`/offers/${offer.id}`, { is_active: !offer.is_active });
      toast.success(offer.is_active ? "Offre désactivée" : "Offre activée");
      fetchOffers();
    } catch { toast.error("Erreur"); }
  };

  const deleteOffer = async (id) => {
    try {
      await axiosAuth().delete(`/offers/${id}`);
      toast.success("Offre supprimée");
      fetchOffers();
    } catch { toast.error("Erreur"); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="manage-offers">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Mes offres</h2>
        <p className="text-sm text-slate-400 mt-1">{offers.length} offre{offers.length !== 1 ? "s" : ""} publiée{offers.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-3">
        {offers.map((offer, i) => (
          <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors" data-testid={`manage-offer-${i}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-slate-200">{offer.title}</h3>
                  <Badge className={`text-[10px] ${offer.type === "stage" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"}`}>
                    {offer.type === "stage" ? "Stage" : "Emploi"}
                  </Badge>
                  {!offer.is_active && <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offer.location}</span>
                  {offer.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{offer.duration}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{offer.applicant_count || 0} candidat{(offer.applicant_count || 0) !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200" data-testid={`offer-menu-${i}`}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-slate-800" align="end">
                  <DropdownMenuItem onClick={() => toggleActive(offer)} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100 gap-2">
                    {offer.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {offer.is_active ? "Désactiver" : "Activer"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteOffer(offer.id)} className="text-red-400 focus:bg-red-500/10 focus:text-red-300 gap-2">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <p className="text-sm text-slate-500">Aucune offre publiée</p>
          </div>
        )}
      </div>
    </div>
  );
}
