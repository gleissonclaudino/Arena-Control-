import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Check, User, Phone, Mail, CheckCircle2, ChevronLeft } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDiaSemana } from "@/hooks/useFuncionamento";

type Step = "quadra" | "data" | "horario" | "opcionais" | "resumo" | "dados";

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<Step>("quadra");
  const [selectedQuadra, setSelectedQuadra] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedOpcionais, setSelectedOpcionais] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("pix");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { data: arena, isLoading: loadingArena } = useQuery({
    queryKey: ["public-arena", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("arenas").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: quadras = [] } = useQuery({
    queryKey: ["public-quadras", arena?.id],
    queryFn: async () => {
      const { data } = await supabase.from("quadras").select("*").eq("arena_id", arena!.id).eq("ativa", true);
      return data || [];
    },
    enabled: !!arena?.id,
  });

  const { data: allFotos = [] } = useQuery({
    queryKey: ["public-quadra-fotos", arena?.id],
    queryFn: async () => {
      const quadraIds = quadras.map(q => q.id);
      if (quadraIds.length === 0) return [];
      const { data } = await supabase.from("quadra_fotos").select("*").in("quadra_id", quadraIds);
      return data || [];
    },
    enabled: quadras.length > 0,
  });

  const { data: allRecursos = [] } = useQuery({
    queryKey: ["public-quadra-recursos", arena?.id],
    queryFn: async () => {
      const quadraIds = quadras.map(q => q.id);
      if (quadraIds.length === 0) return [];
      const { data } = await supabase.from("quadra_recursos").select("*").in("quadra_id", quadraIds);
      return data || [];
    },
    enabled: quadras.length > 0,
  });

  const { data: config } = useQuery({
    queryKey: ["public-config", arena?.id],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes_arena").select("*").eq("arena_id", arena!.id).single();
      return data;
    },
    enabled: !!arena?.id,
  });

  const { data: opcionais = [] } = useQuery({
    queryKey: ["public-opcionais", arena?.id],
    queryFn: async () => {
      const { data } = await supabase.from("opcionais").select("*").eq("arena_id", arena!.id).eq("ativo", true);
      return data || [];
    },
    enabled: !!arena?.id,
  });

  const { data: funcionamento = [] } = useQuery({
    queryKey: ["public-funcionamento", arena?.id],
    queryFn: async () => {
      const { data } = await supabase.from("arena_funcionamento").select("*").eq("arena_id", arena!.id);
      return data || [];
    },
    enabled: !!arena?.id,
  });

  const { data: existingReservas = [] } = useQuery({
    queryKey: ["public-reservas", arena?.id, selectedDate, selectedQuadra],
    queryFn: async () => {
      const { data } = await supabase.from("reservas").select("hora_inicio, hora_fim")
        .eq("arena_id", arena!.id).eq("data", selectedDate).eq("quadra_id", selectedQuadra).neq("status", "cancelada");
      return data || [];
    },
    enabled: !!arena?.id && !!selectedDate && !!selectedQuadra,
  });

  const { data: bloqueios = [] } = useQuery({
    queryKey: ["public-bloqueios", arena?.id, selectedDate, selectedQuadra],
    queryFn: async () => {
      const { data } = await supabase.from("bloqueios_agenda").select("hora_inicio, hora_fim")
        .eq("arena_id", arena!.id).eq("data", selectedDate).eq("quadra_id", selectedQuadra);
      return data || [];
    },
    enabled: !!arena?.id && !!selectedDate && !!selectedQuadra,
  });

  const availableHours = useMemo(() => {
    if (!config) return [];
    const start = parseInt(config.horario_abertura?.slice(0, 2) || "8");
    const end = parseInt(config.horario_fechamento?.slice(0, 2) || "23");
    const hours: string[] = [];
    for (let h = start; h < end; h++) {
      const hourStr = `${h.toString().padStart(2, "0")}:00`;
      const isOccupied = existingReservas.some((r: any) => r.hora_inicio?.slice(0, 5) === hourStr);
      const isBlocked = bloqueios.some((b: any) => {
        const bStart = b.hora_inicio?.slice(0, 5);
        const bEnd = b.hora_fim?.slice(0, 5);
        return hourStr >= bStart && hourStr < bEnd;
      });
      if (!isOccupied && !isBlocked) hours.push(hourStr);
    }
    return hours;
  }, [config, existingReservas, bloqueios]);


  const dates = useMemo(() => {
    const activeDays = funcionamento.filter((f: any) => f.ativo).map((f: any) => f.dia_semana);
    const all = Array.from({ length: 30 }, (_, i) => {
      const d = addDays(new Date(), i);
      return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE dd/MM", { locale: ptBR }), date: d };
    });
    if (activeDays.length === 0) return all.slice(0, 14);
    return all.filter(d => activeDays.includes(getDiaSemana(d.date))).slice(0, 14);
  }, [funcionamento]);

  const toggleOpcional = (id: string) => {
    setSelectedOpcionais(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const quadra = quadras.find(q => q.id === selectedQuadra);
  const valorBase = Number(quadra?.preco_hora || 0);
  const valorExtras = selectedOpcionais.reduce((sum, id) => {
    const op = opcionais.find((o: any) => o.id === id);
    return sum + (op ? Number(op.preco) : 0);
  }, 0);
  const valorTotal = valorBase + valorExtras;

  const fotosForQuadra = (qId: string) => allFotos.filter((f: any) => f.quadra_id === qId);
  const recursosForQuadra = (qId: string) => allRecursos.filter((r: any) => r.quadra_id === qId);

  const handleConfirm = async () => {
    if (!nome.trim() || !telefone.trim()) {
      toast({ title: "Nome e telefone são obrigatórios", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const { data: existingClient } = await supabase.from("clientes")
        .select("id").eq("arena_id", arena!.id).eq("telefone", telefone.trim()).single();

      let clienteId: string;
      if (existingClient) {
        clienteId = existingClient.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase.from("clientes")
          .insert({ arena_id: arena!.id, nome: nome.trim(), telefone: telefone.trim(), email: email.trim() || null })
          .select().single();
        if (clientErr) throw clientErr;
        clienteId = newClient.id;
      }

      const horaFimNum = parseInt(selectedHour.slice(0, 2)) + 1;
      const horaFim = `${horaFimNum.toString().padStart(2, "0")}:00`;

      const { data: reserva, error: resErr } = await supabase.from("reservas").insert({
        arena_id: arena!.id, quadra_id: selectedQuadra, cliente_id: clienteId,
        data: selectedDate, hora_inicio: selectedHour, hora_fim: horaFim,
        valor: valorTotal, status: "pendente", origem: "link_publico",
        metodo_pagamento: metodoPagamento,
      }).select().single();
      if (resErr) throw resErr;

      if (selectedOpcionais.length > 0 && reserva?.id) {
        const rows = selectedOpcionais.map(opcId => {
          const op = opcionais.find((o: any) => o.id === opcId);
          return { reserva_id: reserva.id, opcional_id: opcId, preco: Number(op?.preco || 0) };
        });
        await supabase.from("reserva_opcionais").insert(rows);
      }

      setConfirmed(true);
      toast({ title: "Reserva realizada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loadingArena) return <PageLoader />;
  if (!arena) return <PageMessage text="Arena não encontrada" />;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--arena-green-light))] flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-[hsl(var(--arena-green))]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reserva Realizada!</h1>
          <p className="text-muted-foreground">Sua reserva foi registrada como <strong>pendente</strong>. A arena irá confirmar em breve.</p>
          <p className="text-sm text-muted-foreground">{arena.nome}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-6 pb-8">
        {/* Header */}
        <div className="text-center pt-6">
          <div className="w-16 h-16 rounded-full arena-gradient flex items-center justify-center mx-auto mb-3">
            <span className="text-primary-foreground text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{arena.nome}</h1>
          {arena.endereco && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" /> {arena.endereco}{arena.cidade ? `, ${arena.cidade}` : ""}
            </p>
          )}
        </div>

        {/* Step: Select Court */}
        {step === "quadra" && (
          <Section title="SELECIONE A QUADRA">
            <div className="space-y-3">
              {quadras.map((q) => {
                const fotos = fotosForQuadra(q.id);
                const recursos = recursosForQuadra(q.id);
                return (
                  <div key={q.id} className={`rounded-xl border transition-colors overflow-hidden ${selectedQuadra === q.id ? "border-primary" : ""}`}>
                    {fotos.length > 0 && (
                      <div className="flex overflow-x-auto gap-1">
                        {fotos.map((f: any) => (
                          <img key={f.id} src={f.url} alt={q.nome} className="h-32 w-auto object-cover flex-shrink-0" />
                        ))}
                      </div>
                    )}
                    <button onClick={() => { setSelectedQuadra(q.id); setStep("data"); }}
                      className="w-full p-3 text-left">
                      <p className="font-semibold text-foreground text-sm">{q.nome}</p>
                      <p className="text-xs text-muted-foreground">{q.tipo_esporte} • R$ {Number(q.preco_hora).toFixed(0)}/h</p>
                      {q.descricao && <p className="text-xs text-muted-foreground mt-1">{q.descricao}</p>}
                      {recursos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recursos.map((r: any) => (
                            <span key={r.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                              <Check className="h-2.5 w-2.5" /> {r.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Step: Select Date */}
        {step === "data" && (
          <>
            <BackButton onClick={() => setStep("quadra")} />
            <Section title="SELECIONE A DATA">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((d) => (
                  <button key={d.value} onClick={() => { setSelectedDate(d.value); setStep("horario"); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${selectedDate === d.value ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Step: Select Time */}
        {step === "horario" && (
          <>
            <BackButton onClick={() => setStep("data")} />
            <Section title="HORÁRIOS DISPONÍVEIS">
              {availableHours.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum horário disponível</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableHours.map((h) => (
                    <button key={h} onClick={() => { setSelectedHour(h); setStep(opcionais.length > 0 ? "opcionais" : "resumo"); }}
                      className="py-2 rounded-xl text-xs font-semibold transition-colors bg-card border text-foreground hover:border-primary">
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {/* Step: Opcionais */}
        {step === "opcionais" && (
          <>
            <BackButton onClick={() => setStep("horario")} />
            <Section title="OPCIONAIS">
              <div className="space-y-2">
                {opcionais.map((op: any) => (
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
              <Button onClick={() => setStep("resumo")} className="w-full arena-gradient text-primary-foreground rounded-xl mt-3">
                Continuar
              </Button>
            </Section>
          </>
        )}

        {/* Step: Summary + User Data */}
        {(step === "resumo" || step === "dados") && (
          <>
            <BackButton onClick={() => setStep(opcionais.length > 0 ? "opcionais" : "horario")} />
            <Section title="RESUMO">
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground"><span>Quadra:</span><span>{quadra?.nome}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Data:</span><span>{format(new Date(selectedDate + "T12:00"), "dd/MM/yyyy")}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Horário:</span><span>{selectedHour}</span></div>
                {selectedOpcionais.length > 0 && (
                  <div className="border-t pt-1 mt-1">
                    <p className="text-muted-foreground font-medium mb-1">Extras:</p>
                    {selectedOpcionais.map(id => {
                      const op = opcionais.find((o: any) => o.id === id);
                      return op ? <div key={id} className="flex justify-between text-muted-foreground"><span>{op.nome}</span><span>R$ {Number(op.preco).toFixed(2)}</span></div> : null;
                    })}
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground border-t pt-1"><span>Quadra:</span><span>R$ {valorBase.toFixed(2)}</span></div>
                {valorExtras > 0 && <div className="flex justify-between text-muted-foreground"><span>Opcionais:</span><span>R$ {valorExtras.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-foreground border-t pt-1"><span>Total:</span><span>R$ {valorTotal.toFixed(2)}</span></div>
              </div>
            </Section>

            <Section title="FORMA DE PAGAMENTO">
              <div className="flex flex-wrap gap-2">
                {[{ value: "pix", label: "PIX" }, { value: "cartao", label: "Cartão" }, { value: "dinheiro", label: "Dinheiro" }].map((m) => (
                  <button key={m.value} onClick={() => setMetodoPagamento(m.value)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${metodoPagamento === m.value ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="SEUS DADOS">
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome *"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="WhatsApp *"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opcional)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </Section>

            <Button onClick={handleConfirm} disabled={saving} className="w-full arena-gradient text-primary-foreground rounded-xl py-6 text-base font-semibold">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "✓"} Confirmar Reserva
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">{title}</h3>
      <div className="bg-card rounded-xl border p-4">{children}</div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ChevronLeft className="h-4 w-4" /> Voltar
    </button>
  );
}

function PageLoader() {
  return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function PageMessage({ text }: { text: string }) {
  return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">{text}</p></div>;
}
