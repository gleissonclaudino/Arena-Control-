import { Layout } from "@/components/Layout";
import { ChevronLeft, User, Phone, MapPin, Calendar, Clock, DollarSign, CreditCard, FileText, Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useQuadras } from "@/hooks/useQuadras";
import { useClientes, useCreateCliente } from "@/hooks/useClientes";
import { useCreateReserva } from "@/hooks/useReservas";
import { useOpcionais } from "@/hooks/useOpcionais";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
];
const statuses = ["confirmada", "pendente", "cancelada"];
const statusLabels: Record<string, string> = { confirmada: "Confirmado", pendente: "Pendente", cancelada: "Cancelado" };

export default function NovaReserva() {
  const navigate = useNavigate();
  const { data: quadras = [] } = useQuadras();
  const { data: clientes = [] } = useClientes();
  const { data: opcionais = [] } = useOpcionais();
  const createReserva = useCreateReserva();
  const createCliente = useCreateCliente();

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [quadraId, setQuadraId] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [valor, setValor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [status, setStatus] = useState("confirmada");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedOpcionais, setSelectedOpcionais] = useState<string[]>([]);

  const activeOpcionais = opcionais.filter((o: any) => o.ativo);

  const toggleOpcional = (id: string) => {
    setSelectedOpcionais(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const valorExtras = useMemo(() => {
    return selectedOpcionais.reduce((sum, id) => {
      const op = opcionais.find((o: any) => o.id === id);
      return sum + (op ? Number(op.preco) : 0);
    }, 0);
  }, [selectedOpcionais, opcionais]);

  const valorBase = parseFloat(valor) || 0;
  const valorTotal = valorBase + valorExtras;

  const handleSubmit = async () => {
    if (!clienteNome.trim() || !clienteTelefone.trim()) {
      toast({ title: "Preencha nome e telefone do cliente", variant: "destructive" });
      return;
    }
    if (!quadraId || !data || !horaInicio || !horaFim) {
      toast({ title: "Preencha quadra, data e horários", variant: "destructive" });
      return;
    }
    if (horaFim <= horaInicio) {
      toast({ title: "Horário final deve ser maior que o inicial", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let clienteId: string;
      const existingClient = clientes.find(c => c.telefone === clienteTelefone.trim());
      if (existingClient) {
        clienteId = existingClient.id;
      } else {
        const newClient = await createCliente.mutateAsync({
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim(),
        });
        clienteId = newClient.id;
      }

      const reserva = await createReserva.mutateAsync({
        quadra_id: quadraId,
        cliente_id: clienteId,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        valor: valorTotal,
        status,
        observacoes: observacoes || undefined,
        metodo_pagamento: paymentMethod,
      });

      // Insert selected opcionais
      if (selectedOpcionais.length > 0 && reserva?.id) {
        const rows = selectedOpcionais.map(opcId => {
          const op = opcionais.find((o: any) => o.id === opcId);
          return { reserva_id: reserva.id, opcional_id: opcId, preco: Number(op?.preco || 0) };
        });
        await supabase.from("reserva_opcionais").insert(rows);
      }

      navigate("/reservas");
    } catch (error) {
      // Error handled by hooks
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Reserva</h1>
            <p className="text-sm text-muted-foreground">Arena Control Center</p>
          </div>
        </div>

        <Section title="DADOS DO CLIENTE">
          <InputField icon={<User className="h-4 w-4" />} label="Nome do Cliente" placeholder="ex: Michael Totok" value={clienteNome} onChange={setClienteNome} />
          <InputField icon={<Phone className="h-4 w-4" />} label="WhatsApp / Telefone" placeholder="+55 (11) 99999-0000" value={clienteTelefone} onChange={setClienteTelefone} />
        </Section>

        <Section title="QUADRA & HORÁRIO">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Selecionar Quadra</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={quadraId} onChange={(e) => setQuadraId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione uma quadra</option>
                {quadras.filter(q => q.ativa).map((q) => (
                  <option key={q.id} value={q.id}>{q.nome} ({q.tipo_esporte}) - R$ {Number(q.preco_hora).toFixed(0)}/h</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField icon={<Calendar className="h-4 w-4" />} label="Data" placeholder="" type="date" value={data} onChange={setData} />
            <InputField icon={<Clock className="h-4 w-4" />} label="Início" placeholder="" type="time" value={horaInicio} onChange={setHoraInicio} />
            <InputField icon={<Clock className="h-4 w-4" />} label="Fim" placeholder="" type="time" value={horaFim} onChange={setHoraFim} />
          </div>
        </Section>

        {activeOpcionais.length > 0 && (
          <Section title="OPCIONAIS">
            <div className="space-y-2">
              {activeOpcionais.map((op: any) => (
                <button key={op.id} onClick={() => toggleOpcional(op.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between ${selectedOpcionais.includes(op.id) ? "border-primary bg-accent" : "bg-card"}`}>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{op.nome}</p>
                    {op.descricao && <p className="text-xs text-muted-foreground">{op.descricao}</p>}
                  </div>
                  <span className="text-sm font-bold text-primary">+R$ {Number(op.preco).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="PAGAMENTO & STATUS">
          <InputField icon={<DollarSign className="h-4 w-4" />} label="Valor Base" placeholder="R$ 0,00" value={valor} onChange={setValor} type="number" />

          {valorExtras > 0 && (
            <div className="text-sm space-y-1 px-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Valor base:</span><span>R$ {valorBase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Opcionais:</span><span>R$ {valorExtras.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground border-t pt-1">
                <span>Total:</span><span>R$ {valorTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Forma de Pagamento</label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((m) => (
                <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${paymentMethod === m.value ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    status === s
                      ? s === "confirmada" ? "status-paid" : s === "pendente" ? "status-pending" : "status-cancelled"
                      : "bg-card border text-foreground"
                  }`}>
                  {s === "confirmada" ? "✓ " : ""}{statusLabels[s]}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="OBSERVAÇÕES">
          <textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Requisitos especiais, bolas extras, coletes..."
            className="w-full p-3 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </Section>

        <div className="space-y-3 pb-4">
          <Button onClick={handleSubmit} disabled={saving}
            className="w-full arena-gradient text-primary-foreground rounded-xl py-6 text-base font-semibold gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "✓"} Confirmar Reserva
          </Button>
        </div>
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

function InputField({ icon, label, placeholder, type = "text", value, onChange }: {
  icon: React.ReactNode; label: string; placeholder: string; type?: string; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
    </div>
  );
}
