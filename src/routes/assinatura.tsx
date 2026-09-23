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

type PlanoPremium = {
  codigo: string;
  nome: string;
  descricao: string | null;
  valor: number;
  periodicidade: string;
};

function Assinatura() {
  const [planoAtual, setPlanoAtual] =
    useState<Plano>("gratuito");

  const [planoPremium, setPlanoPremium] =
    useState<PlanoPremium | null>(null);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !ativo) {
        setCarregando(false);
        return;
      }

      const [
        { data: perfil, error: erroPerfil },
        { data: plano, error: erroPlano },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("plano")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("planos")
          .select(
            "codigo, nome, descricao, valor, periodicidade",
          )
          .eq("codigo", "premium")
          .eq("ativo", true)
          .maybeSingle(),
      ]);

      if (!ativo) {
        return;
      }

      if (erroPerfil) {
        console.error(
          "Erro ao carregar plano do usuário:",
          erroPerfil,
        );
      }

      if (erroPlano) {
        console.error(
          "Erro ao carregar plano Premium:",
          erroPlano,
        );
      }

      setPlanoAtual(
        perfil?.plano === "premium"
          ? "premium"
          : "gratuito",
      );

      setPlanoPremium(plano);

      setCarregando(false);
    }

    void carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  function escolherPlano() {
    toast.info("Pagamento em breve.", {
      description:
        "O checkout do QBMed será conectado na próxima etapa.",
    });
  }

  const valorFormatado = planoPremium
    ? planoPremium.valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "R$ 14,90";

  return (
    <AppShell
      titulo="Assinatura"
      descricao="Tenha acesso completo às ferramentas do QBMed para sua preparação."
    >
      <div className="mx-auto max-w-5xl space-y-8">
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
            QBMed Premium
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Estude sem limites e aproveite todos os recursos
            do QBMed.
          </p>
        </div>

        {/* Plano Premium */}
        <div className="flex justify-center">
          <Card className="relative flex w-full max-w-md flex-col border-primary shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gap-1 px-3 py-1">
                <Crown className="size-3.5" />
                Premium
              </Badge>
            </div>

            <CardHeader className="pt-8 text-center">
              <CardTitle className="text-2xl">
                {planoPremium?.nome ?? "Premium"}
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                {planoPremium?.descricao ??
                  "Acesso completo ao QBMed."}
              </p>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold">
                  {valorFormatado}
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
                size="lg"
                disabled={
                  carregando ||
                  planoAtual === "premium" ||
                  !planoPremium
                }
                onClick={escolherPlano}
              >
                {planoAtual === "premium"
                  ? "Plano Premium ativo"
                  : carregando
                    ? "Carregando..."
                    : "Assinar por R$ 14,90/mês"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Segurança */}
        <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:flex-row">
          <CreditCard className="size-4" />

          <span>
            Pagamento seguro. O checkout será integrado
            em uma próxima etapa.
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