import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  GraduationCap,
  Save,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
});

const especialidadesDisponiveis = [
  "Clínica Médica",
  "Cirurgia Geral",
  "Pediatria",
  "Ginecologia e Obstetrícia",
  "Preventiva",
];

function obterIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    return "US";
  }

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return (
    partes[0][0] + partes[partes.length - 1][0]
  ).toUpperCase();
}

function Perfil() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [anoFormacao, setAnoFormacao] = useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [plano, setPlano] = useState<"gratuito" | "premium">("gratuito");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      setCarregando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !ativo) {
        setCarregando(false);
        return;
      }

      setEmail(user.email ?? "");

      const { data: perfil, error } = await supabase
        .from("profiles")
        .select("nome, ano_formacao, especialidades, plano")
        .eq("id", user.id)
        .maybeSingle();

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Não foi possível carregar seu perfil.");
        setCarregando(false);
        return;
      }

      const nomeInicial =
        perfil?.nome ||
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Usuário";

      setNome(nomeInicial);
      setAnoFormacao(perfil?.ano_formacao ?? "");
      setEspecialidades(perfil?.especialidades ?? []);
      setPlano(
        perfil?.plano === "premium"
          ? "premium"
          : "gratuito",
      );

      setCarregando(false);
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, []);

  function alternarEspecialidade(especialidade: string) {
    setEspecialidades((atuais) => {
      if (atuais.includes(especialidade)) {
        return atuais.filter((item) => item !== especialidade);
      }

      return [...atuais, especialidade];
    });
  }

  async function salvarAlteracoes() {
    if (salvando) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (!nome.trim()) {
      toast.warning("Digite seu nome antes de salvar.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          nome: nome.trim(),
          ano_formacao: anoFormacao.trim() || null,
          especialidades,
        },
        {
          onConflict: "id",
        },
      );

    setSalvando(false);

    if (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Não foi possível salvar as alterações.");
      return;
    }

    toast.success("Perfil atualizado com sucesso.");
  }

  const iniciais = obterIniciais(nome);

  return (
    <AppShell
      titulo="Meu perfil"
      descricao="Gerencie suas informações pessoais e preferências de estudo."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Cabeçalho do perfil */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <Avatar className="size-20">
              <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                {iniciais}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold">
                {nome || "Meu perfil"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {email || "Suas informações no QBMed"}
              </p>

              <div className="mt-3">
                {plano === "premium" ? (
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <ShieldCheck className="size-3.5" />
                    Plano Premium
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Plano Gratuito
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Informações pessoais
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>

              <Input
                id="nome"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={carregando || salvando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>

              <Input
                id="email"
                type="email"
                value={email}
                disabled
              />

              <p className="text-xs text-muted-foreground">
                O e-mail da sua conta não pode ser alterado aqui.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Formação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              Formação
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="ano">
                Ano de formação
              </Label>

              <Input
                id="ano"
                placeholder="Ex.: 2027"
                value={anoFormacao}
                onChange={(e) =>
                  setAnoFormacao(e.target.value)
                }
                disabled={carregando || salvando}
              />

              <p className="text-xs text-muted-foreground">
                Essa informação ajuda a personalizar sua experiência no QBMed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Especialidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5" />
              Especialidades de interesse
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione as áreas que você deseja acompanhar no QBMed.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {especialidadesDisponiveis.map(
                (especialidade) => {
                  const selecionada =
                    especialidades.includes(especialidade);

                  return (
                    <button
                      key={especialidade}
                      type="button"
                      disabled={carregando || salvando}
                      onClick={() =>
                        alternarEspecialidade(especialidade)
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                        "hover:border-primary hover:bg-primary/5",
                        selecionada &&
                          "border-primary bg-primary/10",
                        (carregando || salvando) &&
                          "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border",
                          selecionada
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {selecionada ? (
                          <Check className="size-3.5" />
                        ) : null}
                      </span>

                      <span>{especialidade}</span>
                    </button>
                  );
                },
              )}
            </div>

            {especialidades.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {especialidades.map((especialidade) => (
                  <Badge
                    key={especialidade}
                    variant="secondary"
                  >
                    {especialidade}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma especialidade selecionada.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Seu plano
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {plano === "premium"
                    ? "Plano Premium"
                    : "Plano Gratuito"}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {plano === "premium"
                    ? "Você possui acesso ilimitado às questões."
                    : "Você pode responder até 10 questões por dia."}
                </p>
              </div>

              {plano === "gratuito" ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    toast.info(
                      "A área de assinatura será disponibilizada em breve.",
                    )
                  }
                >
                  Conhecer Premium
                </Button>
              ) : (
                <Badge className="w-fit">
                  Premium ativo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={salvarAlteracoes}
            disabled={carregando || salvando}
          >
            <Save className="mr-2 size-4" />

            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}