import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  CreditCard,
  Crown,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/assinatura")({
  component: Assinatura,
});

type Plano = "gratuito" | "premium";

function Assinatura() {
  const [planoAtual, setPlanoAtual] =
    useState<Plano>("gratuito");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarPlano() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !ativo) {
        setCarregando(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", user.id)
        .maybeSingle();

      if (!ativo) return;

      if (error) {
        console.error(
          "Erro ao carregar plano:",
          error,
        );
      }

      setPlanoAtual(
        data?.plano === "premium"
          ? "premium"
          : "gratuito",
      );

      setCarregando(false);
    }

    carregarPlano();

    return () => {
      ativo = false;
    };
  }, []);

  function escolherPlano(nome: string) {
    toast.info("Assinatura em breve.", {
      description: `O plano ${nome} estará disponível para contratação em breve.`,
    });
  }

  return (
    <AppShell
      titulo="Assinatura"
      descricao="Escolha o plano que melhor combina com sua preparação para a residência."
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Plano atual */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                {planoAtual === "premium" ? (
                  <Crown className="size-6" />
                ) : (
                  <ShieldCheck className="size-6" />
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Seu plano atual
                </p>

                <p className="text-xl font-bold">
                  {planoAtual === "premium"
                    ? "Premium"
                    : "Gratuito"}
                </p>

                <p className="text-sm text-muted-foreground">
                  {planoAtual === "premium"
                    ? "Você possui acesso ilimitado às questões."
                    : "Você pode responder até 10 questões por dia."}
                </p>
              </div>
            </div>

            <Badge
              variant={
                planoAtual === "premium"
                  ? "default"
                  : "secondary"
              }
              className="w-fit"
            >
              {planoAtual === "premium"
                ? "Premium ativo"
                : "Plano gratuito"}
            </Badge>
          </CardContent>
        </Card>

        {/* Título */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Escolha seu plano
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Tenha acesso às ferramentas do QBMed para
            organizar sua preparação.
          </p>
        </div>

        {/* Planos */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Mensal */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">
                Mensal
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Flexibilidade para estudar mês a mês.
              </p>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              <div>
                <span className="text-4xl font-bold">
                  R$ 29,90
                </span>

                <span className="text-sm text-muted-foreground">
                  /mês
                </span>
              </div>

              <div className="space-y-3">
                <Beneficio>
                  Questões ilimitadas
                </Beneficio>

                <Beneficio>
                  Acesso aos simulados
                </Beneficio>

                <Beneficio>
                  Acompanhamento de desempenho
                </Beneficio>

                <Beneficio>
                  Anotações de estudo
                </Beneficio>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                disabled={
                  carregando ||
                  planoAtual === "premium"
                }
                onClick={() =>
                  escolherPlano("Mensal")
                }
              >
                {planoAtual === "premium"
                  ? "Plano Premium ativo"
                  : "Assinar plano mensal"}
              </Button>
            </CardFooter>
          </Card>

          {/* Semestral */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">
                Semestral
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Mais tempo para manter o ritmo de estudos.
              </p>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              <div>
                <span className="text-4xl font-bold">
                  R$ 19,90
                </span>

                <span className="text-sm text-muted-foreground">
                  /mês
                </span>
              </div>

              <div className="space-y-3">
                <Beneficio>
                  Questões ilimitadas
                </Beneficio>

                <Beneficio>
                  Acesso aos simulados
                </Beneficio>

                <Beneficio>
                  Acompanhamento de desempenho
                </Beneficio>

                <Beneficio>
                  Anotações de estudo
                </Beneficio>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                disabled={
                  carregando ||
                  planoAtual === "premium"
                }
                onClick={() =>
                  escolherPlano("Semestral")
                }
              >
                {planoAtual === "premium"
                  ? "Plano Premium ativo"
                  : "Assinar plano semestral"}
              </Button>
            </CardFooter>
          </Card>

          {/* Anual */}
          <Card className="relative flex flex-col border-primary shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gap-1 px-3 py-1">
                <Crown className="size-3.5" />
                Mais popular
              </Badge>
            </div>

            <CardHeader className="pt-8">
              <CardTitle className="text-xl">
                Anual
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Para manter uma preparação contínua.
              </p>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              <div>
                <span className="text-4xl font-bold">
                  R$ 14,90
                </span>

                <span className="text-sm text-muted-foreground">
                  /mês
                </span>
              </div>

              <div className="space-y-3">
                <Beneficio>
                  Questões ilimitadas
                </Beneficio>

                <Beneficio>
                  Acesso aos simulados
                </Beneficio>

                <Beneficio>
                  Acompanhamento de desempenho
                </Beneficio>

                <Beneficio>
                  Anotações de estudo
                </Beneficio>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                disabled={
                  carregando ||
                  planoAtual === "premium"
                }
                onClick={() =>
                  escolherPlano("Anual")
                }
              >
                {planoAtual === "premium"
                  ? "Plano Premium ativo"
                  : "Assinar plano anual"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <CreditCard className="size-4" />
          <span>
            O pagamento será integrado em uma próxima etapa.
          </span>
        </div>
      </div>
    </AppShell>
  );
}

function Beneficio({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}