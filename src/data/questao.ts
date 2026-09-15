export type Alternativa = {
  letra: "A" | "B" | "C" | "D" | "E";
  texto: string;
};

export type Comentario = {
  id: string;
  autor: string;
  avatar: string;
  tempo: string;
  texto: string;
  curtidas: number;
};

export type Questao = {
  id: string;
  enunciado: string;
  especialidade: string;
  subespecialidade: string;
  banca: string;
  ano: number;
  dificuldade: "Fácil" | "Média" | "Difícil";
  tags: string[];
  alternativas: Alternativa[];
  correta: "A" | "B" | "C" | "D" | "E";
  resolucao: string;
  comentarios: Comentario[];
  imagem_url?: string | null;
};