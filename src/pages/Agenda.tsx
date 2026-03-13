import { Layout } from "@/components/Layout";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useReservas } from "@/hooks/useReservas";
import { useQuadras } from "@/hooks/useQuadras";
import { useBloqueios } from "@/hooks/useBloqueios";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

const hours = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
const weekDayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const statusStyles: Record<string, string> = {
  confirmada: "bg-[hsl(var(--arena-green-light))] border-l-4 border-l-[hsl(var(--arena-green))]",
  pendente: "bg-[hsl(var(--arena-yellow-light))] border-l-4 border-l-[hsl(var(--arena-yellow))]",
  cancelada: "bg-[hsl(var(--arena-red-light))] border-l-4 border-l-[hsl(var(--arena-red))] line-through opacity-60",
};

export default function Agenda() {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();
  const { data: reservas = [], isLoading } = useReservas();
  const { data: quadras = [] } = useQuadras();
  const { data: bloqueios = [] } = useBloqueios();

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return weekOffset === 0 ? base : weekOffset > 0 ? addWeeks(base, weekOffset) : subWeeks(base, Math.abs(weekOffset));
  }, [weekOffset]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const filteredReservas = useMemo(() => {
    return reservas.filter((r: any) => {
      const rDate = r.data;
      const inWeek = weekDates.some(d => format(d, "yyyy-MM-dd") === rDate);
      const matchField = !selectedField || r.quadra_id === selectedField;
      return inWeek && matchField && r.status !== "cancelada";
    });
  }, [reservas, weekDates, selectedField]);

  const getSlot = (hour: string, dayIdx: number) => {
    const dateStr = format(weekDates[dayIdx], "yyyy-MM-dd");
    return filteredReservas.find((r: any) => r.data === dateStr && r.hora_inicio?.slice(0, 5) === hour);
  };

  const getBlock = (hour: string, dayIdx: number) => {
    const dateStr = format(weekDates[dayIdx], "yyyy-MM-dd");
    return bloqueios.find((b: any) => {
      if (b.data !== dateStr) return false;
      if (selectedField && b.quadra_id !== selectedField) return false;
      const bStart = b.hora_inicio?.slice(0, 5);
      const bEnd = b.hora_fim?.slice(0, 5);
      return hour >= bStart && hour < bEnd;
    });
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <p className="text-sm text-muted-foreground">Visualização semanal</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5 rounded-full" onClick={() => navigate("/agenda/bloquear")}>
              <Lock className="h-4 w-4" /> Bloquear Horário
            </Button>
            <Button className="arena-gradient text-primary-foreground gap-1.5 rounded-full" onClick={() => navigate("/reservas/nova")}>
              <Plus className="h-4 w-4" /> Nova Reserva
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card border rounded-full px-4 py-2">
            <ChevronLeft className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setWeekOffset(w => w - 1)} />
            <span className="text-sm font-medium text-foreground">
              {format(weekDates[0], "MMM dd", { locale: ptBR })} – {format(weekDates[6], "dd", { locale: ptBR })}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setWeekOffset(w => w + 1)} />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedField(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!selectedField ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
            Todas
          </button>
          {quadras.filter(q => q.ativa).map((q) => (
            <button key={q.id} onClick={() => setSelectedField(q.id === selectedField ? null : q.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedField === q.id ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
              {q.nome}
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[hsl(var(--arena-green))]" /> Confirmado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[hsl(var(--arena-yellow))]" /> Pendente</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-destructive" /> Bloqueado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted border" /> Livre</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="bg-card rounded-xl border overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="w-16 p-3 text-xs text-muted-foreground font-medium text-left">Hora</th>
                  {weekDayLabels.map((d, i) => (
                    <th key={d} className="p-3 text-xs text-muted-foreground font-medium text-center">
                      {d}<br /><span className="text-[10px]">{format(weekDates[i], "dd/MM")}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="border-b last:border-0">
                    <td className="p-3 text-xs text-muted-foreground font-medium">{hour}</td>
                    {weekDayLabels.map((_, dayIdx) => {
                      const slot = getSlot(hour, dayIdx);
                      const block = getBlock(hour, dayIdx);
                      return (
                        <td key={dayIdx} className="p-1.5">
                          {block ? (
                            <div className="rounded-lg p-2 text-xs bg-destructive/10 border-l-4 border-l-destructive">
                              <p className="font-semibold text-destructive flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Bloqueado
                              </p>
                              {block.motivo && <p className="text-muted-foreground text-[10px]">{block.motivo}</p>}
                            </div>
                          ) : slot ? (
                            <div onClick={() => navigate(`/reservas/${slot.id}`)}
                              className={`rounded-lg p-2 text-xs cursor-pointer hover:opacity-80 transition-opacity ${statusStyles[slot.status] || ""}`}>
                              <p className="font-semibold text-foreground">{(slot as any).clientes?.nome || "—"}</p>
                              <p className="text-muted-foreground">{(slot as any).quadras?.nome || "—"}</p>
                            </div>
                          ) : (
                            <div onClick={() => navigate("/reservas/nova")}
                              className="rounded-lg border border-dashed border-[hsl(var(--arena-gray))] p-2 text-xs text-muted-foreground text-center cursor-pointer hover:bg-muted/50 transition-colors h-[52px] flex items-center justify-center">
                              +
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
