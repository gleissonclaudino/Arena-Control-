import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, MapPin, Calendar, Clock, FileText, Loader2 } from "lucide-react";
import { useQuadras } from "@/hooks/useQuadras";
import { useCreateBloqueio } from "@/hooks/useBloqueios";
import { toast } from "@/hooks/use-toast";

export default function BloqueioAgenda() {
  const navigate = useNavigate();
  const { data: quadras = [] } = useQuadras();
  const createBloqueio = useCreateBloqueio();

  const [quadraId, setQuadraId] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleSubmit = async () => {
    if (!quadraId || !data || !horaInicio || !horaFim) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (horaFim <= horaInicio) {
      toast({ title: "Horário final deve ser maior que o inicial", variant: "destructive" });
      return;
    }
    try {
      await createBloqueio.mutateAsync({
        quadra_id: quadraId,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        motivo: motivo || undefined,
      });
      navigate("/agenda");
    } catch {}
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bloquear Horário</h1>
            <p className="text-sm text-muted-foreground">Impedir reservas neste horário</p>
          </div>
        </div>

        <Section title="QUADRA & HORÁRIO">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Quadra *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={quadraId} onChange={(e) => setQuadraId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione uma quadra</option>
                {quadras.filter(q => q.ativa).map((q) => (
                  <option key={q.id} value={q.id}>{q.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField icon={<Calendar className="h-4 w-4" />} label="Data *" type="date" value={data} onChange={setData} />
            <InputField icon={<Clock className="h-4 w-4" />} label="Início *" type="time" value={horaInicio} onChange={setHoraInicio} />
            <InputField icon={<Clock className="h-4 w-4" />} label="Fim *" type="time" value={horaFim} onChange={setHoraFim} />
          </div>
        </Section>

        <Section title="MOTIVO">
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Manutenção, Evento, Campeonato, Limpeza..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </Section>

        <Button onClick={handleSubmit} disabled={createBloqueio.isPending}
          className="w-full arena-gradient text-primary-foreground rounded-xl py-6 text-base font-semibold gap-2">
          {createBloqueio.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🔒"} Bloquear Horário
        </Button>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">{title}</h3>
      <div className="bg-card rounded-xl border p-4 space-y-4">{children}</div>
    </div>
  );
}

function InputField({ icon, label, type = "text", value, onChange }: {
  icon: React.ReactNode; label: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
    </div>
  );
}
