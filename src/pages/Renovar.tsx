import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Star, Shield, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    name: "Plano Início",
    price: "R$ 97",
    period: "/mês",
    description: "Ideal para continuar operando sua quadra com controle total.",
    link: "https://pay.cakto.com.br/34w44zh_811011",
    highlight: false,
    icon: Shield,
  },
  {
    name: "Plano Pro",
    price: "R$ 267",
    period: "/trimestre",
    description: "Mais economia e estabilidade para manter sua arena sempre organizada.",
    link: "https://pay.cakto.com.br/nm6ievg_813226",
    highlight: false,
    icon: TrendingUp,
  },
  {
    name: "Plano Elite",
    price: "R$ 897",
    period: "/ano",
    description: "Melhor custo-benefício para quem quer crescer e maximizar resultados.",
    link: "https://pay.cakto.com.br/3dyf628_813231",
    highlight: true,
    badge: "Mais vantajoso",
    extra: "Economize mais de R$ 200 por ano",
    icon: Star,
  },
];

export default function Renovar() {
  const { subscription } = useSubscription();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Seu acesso foi pausado</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sua assinatura expirou e, por isso, o acesso ao sistema foi temporariamente bloqueado.
          </p>
        </div>

        {/* Pain points */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <p className="font-semibold text-foreground mb-3">
              Ao ficar sem acesso, você pode estar perdendo:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Novas reservas todos os dias
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Controle da agenda da sua quadra
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Organização financeira da sua arena
              </li>
            </ul>
            <p className="mt-4 font-semibold text-foreground">
              Não deixe sua arena parar.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Retome o controle da sua arena agora mesmo ⚽
          </h2>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={
                  plan.highlight
                    ? "border-primary ring-2 ring-primary/20 relative"
                    : "relative"
                }
              >
                {plan.highlight && plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                  {plan.extra && (
                    <p className="text-xs font-medium text-primary">{plan.extra}</p>
                  )}
                  <Button
                    className={
                      plan.highlight
                        ? "w-full arena-gradient text-primary-foreground"
                        : "w-full"
                    }
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => window.open(plan.link, "_blank")}
                  >
                    Assinar {plan.name.replace("Plano ", "")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Social proof */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <CheckCircle key={s} className="h-4 w-4 text-primary" />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Mais de 100 arenas já utilizam o sistema para organizar reservas e aumentar o faturamento.
          </p>
        </div>

        {/* Logout */}
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
