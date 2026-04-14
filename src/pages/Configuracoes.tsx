import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useArena, useUpdateArena } from "@/hooks/useArena";
import { useConfiguracoes, useUpdateConfiguracoes } from "@/hooks/useConfiguracoes";
import { useFuncionamento, useUpdateFuncionamento, DIAS_SEMANA } from "@/hooks/useFuncionamento";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { data: arena, isLoading: loadingArena } = useArena();
  const { data: config } = useConfiguracoes();
  const updateArena = useUpdateArena();
  const updateConfig = useUpdateConfiguracoes();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [abertura, setAbertura] = useState("08:00");
  const [fechamento, setFechamento] = useState("23:00");
  const [tempoMinimo, setTempoMinimo] = useState(60);
  const [intervalo, setIntervalo] = useState(0);
  const [reservaOnline, setReservaOnline] = useState(true);

  useEffect(() => {
    if (arena) { setNome(arena.nome || ""); setTelefone(arena.telefone || ""); setEndereco(arena.endereco || ""); setCidade(arena.cidade || ""); }
  }, [arena]);

  useEffect(() => {
    if (config) {
      setAbertura(config.horario_abertura || "08:00"); setFechamento(config.horario_fechamento || "23:00");
      setTempoMinimo(config.tempo_minimo_reserva || 60); setIntervalo(config.intervalo_reserva || 0);
      setReservaOnline(config.permitir_reserva_online ?? true);
    }
  }, [config]);

  const handleSaveArena = async () => { await updateArena.mutateAsync({ nome, telefone, endereco, cidade }); };
  const handleSaveConfig = async () => {
    await updateConfig.mutateAsync({ horario_abertura: abertura, horario_fechamento: fechamento, tempo_minimo_reserva: tempoMinimo, intervalo_reserva: intervalo, permitir_reserva_online: reservaOnline });
  };

const publicLink = arena && arena.slug
  ? `https://id-preview--39d624ec-e3b6-4860-902c-1be2a38abcf4.lovable.app/arena/${arena.slug}/reservar`
  : "";

  if (loadingArena) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua arena</p>
        </div>

        <Section title="DADOS DA ARENA">
          <Field label="Nome da Arena" value={nome} onChange={setNome} />
          <Field label="Telefone" value={telefone} onChange={setTelefone} />
          <Field label="Endereço" value={endereco} onChange={setEndereco} />
          <Field label="Cidade" value={cidade} onChange={setCidade} />
          <Button onClick={handleSaveArena} disabled={updateArena.isPending} className="w-full arena-gradient text-primary-foreground rounded-xl">
            {updateArena.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Salvar Dados
          </Button>
        </Section>

        <Section title="HORÁRIOS & REGRAS">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Horário Abertura" value={abertura} onChange={setAbertura} type="time" />
            <Field label="Horário Fechamento" value={fechamento} onChange={setFechamento} type="time" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tempo Mínimo (min)" value={String(tempoMinimo)} onChange={(v) => setTempoMinimo(parseInt(v) || 0)} type="number" />
            <Field label="Intervalo (min)" value={String(intervalo)} onChange={(v) => setIntervalo(parseInt(v) || 0)} type="number" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Permitir reserva online</label>
            <Switch checked={reservaOnline} onCheckedChange={setReservaOnline} />
          </div>
          <Button onClick={handleSaveConfig} disabled={updateConfig.isPending} className="w-full arena-gradient text-primary-foreground rounded-xl">
            {updateConfig.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Salvar Configurações
          </Button>
        </Section>

        <DiasSection />

        {publicLink && (
          <Section title="LINK PÚBLICO">
            <div className="flex items-center gap-2">
              <input readOnly value={publicLink} className="flex-1 px-4 py-2.5 rounded-xl border bg-muted text-sm text-foreground focus:outline-none" />
              <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl gap-1"><Copy className="h-4 w-4" /> Copiar</Button>
            </div>
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
      <div className="bg-card rounded-xl border p-4 space-y-4">{children}</div>
    </div>
  );
}

function DiasSection() {
  const { data: dias = [], isLoading } = useFuncionamento();
  const updateDia = useUpdateFuncionamento();

  if (isLoading) return null;

  return (
    <Section title="DIAS DE FUNCIONAMENTO">
      <div className="space-y-3">
        {DIAS_SEMANA.map(({ value, label }) => {
          const dia = dias.find((d: any) => d.dia_semana === value);
          const ativo = dia?.ativo ?? true;
          return (
            <div key={value} className="flex items-center gap-3">
              <Checkbox
                id={`dia-${value}`}
                checked={ativo}
                onCheckedChange={(checked) => updateDia.mutate({ diaSemana: value, ativo: !!checked })}
              />
              <label htmlFor={`dia-${value}`} className="text-sm font-medium text-foreground cursor-pointer">{label}</label>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
