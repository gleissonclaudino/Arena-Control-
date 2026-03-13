import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, User, Phone, Mail, MapPin, Calendar, Clock, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const statusConfig: Record<string, string> = {
  confirmada: "status-paid",
  pendente: "status-pending",
  cancelada: "status-cancelled",
  pago: "status-paid",
  cancelado: "status-cancelled",
};
const statusLabels: Record<string, string> = {
  confirmada: "Confirmado",
  pendente: "Pendente",
  cancelada: "Cancelado",
  pago: "Pago",
  cancelado: "Cancelado",
};

const metodos = ["pix", "cartao", "dinheiro"];
const metodoLabels: Record<string, string> = { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" };

export default function ReservaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [metodo, setMetodo] = useState("");

  const { data: reserva, isLoading } = useQuery({
    queryKey: ["reserva-detalhe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*, clientes(nome, telefone, email), quadras(nome)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: opcionaisReserva = [] } = useQuery({
    queryKey: ["reserva-opcionais", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reserva_opcionais")
        .select("*, opcionais(nome)")
        .eq("reserva_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["reserva-pagamentos", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("reserva_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const handleMarcarPago = async () => {
    if (!reserva || !arenaId) return;
    setSaving(true);
    try {
      // Update reservation status
      await supabase.from("reservas").update({ status: "confirmada" }).eq("id", reserva.id);

      // Create payment record
      await supabase.from("pagamentos").insert({
        arena_id: arenaId,
        reserva_id: reserva.id,
        valor: reserva.valor,
        metodo,
        status: "pago",
      });

      qc.invalidateQueries({ queryKey: ["reserva-detalhe"] });
      qc.invalidateQueries({ queryKey: ["reserva-pagamentos"] });
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast({ title: "Reserva marcada como paga!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = async () => {
    if (!reserva) return;
    setSaving(true);
    try {
      await supabase.from("reservas").update({ status: "cancelada" }).eq("id", reserva.id);

      // Cancel existing payments
      const activePagamentos = pagamentos.filter((p: any) => p.status === "pago");
      for (const p of activePagamentos) {
        await supabase.from("pagamentos").update({ status: "cancelado" }).eq("id", p.id);
      }

      qc.invalidateQueries({ queryKey: ["reserva-detalhe"] });
      qc.invalidateQueries({ queryKey: ["reserva-pagamentos"] });
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast({ title: "Reserva cancelada!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </Layout>
    );
  }

  if (!reserva) {
    return (
      <Layout>
        <p className="text-center py-12 text-muted-foreground">Reserva não encontrada</p>
      </Layout>
    );
  }

  const isPendente = reserva.status === "pendente";
  const isCancelada = reserva.status === "cancelada";
  const defaultMetodo = (reserva as any).metodo_pagamento || "pix";
  if (!metodo) setMetodo(defaultMetodo);
  const totalExtras = opcionaisReserva.reduce((s: number, o: any) => s + Number(o.preco), 0);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Detalhes da Reserva</h1>
            <p className="text-sm text-muted-foreground">#{reserva.id.slice(0, 8)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[reserva.status] || ""}`}>
            {statusLabels[reserva.status] || reserva.status}
          </span>
        </div>

        {/* Client Info */}
        <Section title="DADOS DO CLIENTE">
          <div className="space-y-2">
            <InfoRow icon={<User className="h-4 w-4" />} label="Nome" value={(reserva as any).clientes?.nome || "—"} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={(reserva as any).clientes?.telefone || "—"} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={(reserva as any).clientes?.email || "—"} />
          </div>
        </Section>

        {/* Reservation Info */}
        <Section title="DADOS DA RESERVA">
          <div className="space-y-2">
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Quadra" value={(reserva as any).quadras?.nome || "—"} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data" value={format(new Date(reserva.data + "T00:00:00"), "dd/MM/yyyy")} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Horário" value={`${reserva.hora_inicio?.slice(0, 5)} - ${reserva.hora_fim?.slice(0, 5)}`} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Valor Total" value={`R$ ${Number(reserva.valor).toFixed(2)}`} />
            <InfoRow icon={<Package className="h-4 w-4" />} label="Origem" value={reserva.origem === "link_publico" ? "Link Público" : "Dashboard"} />
          </div>
        </Section>

        {/* Opcionais */}
        {opcionaisReserva.length > 0 && (
          <Section title="OPCIONAIS">
            <div className="space-y-1">
              {opcionaisReserva.map((o: any) => (
                <div key={o.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{(o as any).opcionais?.nome || "—"}</span>
                  <span className="text-muted-foreground">R$ {Number(o.preco).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                <span className="text-foreground">Total Extras</span>
                <span className="text-foreground">R$ {totalExtras.toFixed(2)}</span>
              </div>
            </div>
          </Section>
        )}

        {/* Payments */}
        {pagamentos.length > 0 && (
          <Section title="PAGAMENTOS">
            <div className="space-y-2">
              {pagamentos.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
                  <div>
                    <span className="font-medium text-foreground">{metodoLabels[p.metodo] || p.metodo}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">R$ {Number(p.valor).toFixed(2)}</span>
                    <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[p.status] || ""}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Actions */}
        {!isCancelada && (
          <Section title="AÇÕES">
            {isPendente && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Método de Pagamento</label>
                  <div className="flex flex-wrap gap-2">
                    {metodos.map((m) => (
                      <button key={m} onClick={() => setMetodo(m)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${metodo === m ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
                        {metodoLabels[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleMarcarPago} disabled={saving}
                  className="w-full arena-gradient text-primary-foreground rounded-xl py-5 text-sm font-semibold gap-2 mt-3">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  Marcar como Pago
                </Button>
              </>
            )}
            <Button onClick={handleCancelar} disabled={saving} variant="outline"
              className="w-full rounded-xl py-5 text-sm font-semibold text-destructive border-destructive hover:bg-destructive/10 mt-2">
              Cancelar Reserva
            </Button>
          </Section>
        )}

        {reserva.observacoes && (
          <Section title="OBSERVAÇÕES">
            <p className="text-sm text-muted-foreground">{reserva.observacoes}</p>
          </Section>
        )}
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">{title}</h3>
      <div className="bg-card rounded-xl border p-4 space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground w-20">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
