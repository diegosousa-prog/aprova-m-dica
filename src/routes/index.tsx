import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  Check,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { planos } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QBMed — Banco de Questões para Residência Médica" },
      {
        name: "description",
        content:
          "Plataforma de estudos com banco de questões, simulados e analytics de desempenho para a Residência Médica. Teste grátis.",
      },
      { property: "og:title", content: "QBMed — Banco de Questões para Residência Médica" },
      {
        property: "og:description",
        content: "Questões comentadas, simulados e analytics para acelerar sua aprovação na Residência Médica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const metricas = [
  { valor: "42.000+", label: "Questões fictícias comentadas" },
  { valor: "18.500", label: "Alunos estudando" },
  { valor: "96%", label: "Satisfação com as resoluções" },
  { valor: "320", label: "Simulados publicados" },
];

const features = [
  {
    icon: BookOpenCheck,
    titulo: "Banco de questões filtrável",
    texto: "Filtre por especialidade, subespecialidade, banca, ano e status de resposta em segundos.",
  },
  {
    icon: ClipboardList,
    titulo: "Simulados cronometrados",
    texto: "Simulados nacionais e temáticos com correção automática e ranking fictício.",
  },
  {
    icon: BarChart3,
    titulo: "Analytics de desempenho",
    texto: "Gráficos de acertos, evolução mensal e pontos fracos por especialidade.",
  },
  {
    icon: Brain,
    titulo: "Revisão inteligente",
    texto: "O sistema reagenda automaticamente as questões que você errou.",
  },
  {
    icon: MessageSquare,
    titulo: "Fórum por questão",
    texto: "Discuta cada alternativa com colegas e professores dentro da própria questão.",
  },
  {
    icon: Target,
    titulo: "Metas diárias",
    texto: "Streak, meta de questões por dia e progresso semanal para manter a constância.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">QBMed</span>
          <nav className="ml-8 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <Link to="/dashboard" className="hover:text-foreground">Demonstração</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Testar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-5 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
              <Sparkles className="mr-1 size-3.5" /> Novo ciclo 2026 disponível
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Sua aprovação na Residência Médica começa aqui
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
              Banco de questões inéditas e comentadas, simulados cronometrados e analytics que mostram
              exatamente o que estudar hoje.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth">Testar Grátis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <a href="#planos">Ver Planos</a>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/70">
              <Users className="size-4" /> 7 dias grátis, sem cartão de crédito
            </p>
          </div>

          <Card className="border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70">
                Questão do dia
              </p>
              <p className="text-sm leading-relaxed text-primary-foreground/90">
                Paciente fictício de 58 anos com dor torácica em aperto há 40 minutos e sudorese. Qual a
                conduta inicial?
              </p>
              <div className="space-y-2">
                {["Solicitar apenas exames e reavaliar em 12h", "ECG em até 10 minutos e monitorização", "Encaminhar ao ambulatório em 30 dias"].map(
                  (alt, i) => (
                    <div
                      key={alt}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        i === 1
                          ? "border-accent bg-accent/25 text-primary-foreground"
                          : "border-primary-foreground/20 text-primary-foreground/75"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {alt}
                    </div>
                  ),
                )}
              </div>
              <p className="text-xs text-primary-foreground/60">Conteúdo fictício, apenas demonstrativo.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {metricas.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{m.valor}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Tudo o que você precisa em uma só plataforma</h2>
          <p className="mt-3 text-muted-foreground">
            Da primeira questão do dia até o relatório final antes da prova.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.titulo} className="transition-shadow hover:shadow-[var(--shadow-card)]">
              <CardContent className="p-6">
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <f.icon className="size-5" />
                </span>
                <h3 className="text-base font-semibold">{f.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.texto}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="planos" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Planos para cada fase do seu estudo</h2>
            <p className="mt-3 text-muted-foreground">Cancele quando quiser. Todos os planos com 7 dias grátis.</p>
          </div>

          <Tabs defaultValue="semestral" className="mt-10">
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
              <TabsTrigger value="semestral">Semestral</TabsTrigger>
              <TabsTrigger value="anual">Anual</TabsTrigger>
            </TabsList>
            {planos.map((p) => (
              <TabsContent key={p.id} value={p.id} className="mt-8">
                <div className="grid gap-6 md:grid-cols-3">
                  {planos.map((item) => (
                    <Card
                      key={item.id}
                      className={
                        item.id === p.id
                          ? "border-accent shadow-[var(--shadow-card)] ring-2 ring-accent"
                          : "opacity-90"
                      }
                    >
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{item.nome}</h3>
                          {item.destaque ? <Badge className="bg-accent text-accent-foreground">Mais popular</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.descricao}</p>
                        <p>
                          <span className="text-4xl font-bold text-primary">R$ {item.preco}</span>
                          <span className="text-sm text-muted-foreground">{item.sufixo}</span>
                        </p>
                        <ul className="space-y-2 text-sm">
                          {item.recursos.map((r) => (
                            <li key={r} className="flex gap-2">
                              <Check className="mt-0.5 size-4 shrink-0 text-success" /> {r}
                            </li>
                          ))}
                        </ul>
                        <Button asChild className="w-full" variant={item.id === p.id ? "default" : "outline"}>
                          <Link to="/auth">Assinar {item.nome}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="size-4" />
              </span>
              <span className="font-bold">QBMed</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Plataforma de estudos para Residência Médica com conteúdo autoral e fictício.
            </p>
          </div>
          {[
            { titulo: "Produto", itens: ["Questões", "Simulados", "Desempenho", "Anotações"] },
            { titulo: "Empresa", itens: ["Sobre", "Blog", "Carreiras", "Contato"] },
            { titulo: "Suporte", itens: ["Central de ajuda", "Termos de uso", "Privacidade", "Status"] },
          ].map((col) => (
            <div key={col.titulo}>
              <p className="text-sm font-semibold">{col.titulo}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {col.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © 2026 QBMed. Conteúdo demonstrativo e fictício, sem uso de provas reais.
        </div>
      </footer>
    </div>
  );
}
