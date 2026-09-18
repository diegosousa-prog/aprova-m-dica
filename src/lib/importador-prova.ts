import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type AlternativaImportada = {
  letra: "A" | "B" | "C" | "D" | "E";
  texto: string;
};

export type BlocoQuestao = {
  numero: number;
  texto: string;
  alternativas: AlternativaImportada[];
  paginas: number[];
  confianca: number;
};

type ItemPDF = {
  texto: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
};

type TextoPagina = {
  pagina: number;
  texto: string;
};

/**
 * Limpa espaços excessivos sem destruir as quebras de linha.
 */
function limparTexto(texto: string): string {
  return texto
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Remove cabeçalhos e rodapés conhecidos.
 */
function removerRuido(texto: string): string {
  const linhas = texto.split("\n");

  const resultado = linhas.filter((linha) => {
    const limpa = linha.trim();

    if (!limpa) {
      return true;
    }

    if (/^ÁREA\s+LIVRE$/i.test(limpa)) {
      return false;
    }

    if (/^CADERNO\s+0?1$/i.test(limpa)) {
      return false;
    }

    if (/^Enamed\s+2026$/i.test(limpa)) {
      return false;
    }

    /*
     * Remove números isolados que normalmente
     * correspondem ao número da página.
     */
    if (/^\d{1,3}$/.test(limpa)) {
      return false;
    }

    return true;
  });

  return limparTexto(resultado.join("\n"));
}

/**
 * Reconstrói uma coluna preservando a ordem vertical.
 */
function reconstruirColuna(elementos: ItemPDF[]): string {
  if (elementos.length === 0) {
    return "";
  }

  const linhas: Array<{
    y: number;
    itens: ItemPDF[];
  }> = [];

  /*
   * O PDF usa coordenadas de baixo para cima.
   * Por isso, ordenamos Y de cima para baixo.
   */
  const ordenados = [...elementos].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 2) {
      return b.y - a.y;
    }

    return a.x - b.x;
  });

  for (const elemento of ordenados) {
    let linha = linhas.find(
      (existente) => Math.abs(existente.y - elemento.y) <= 3,
    );

    if (!linha) {
      linha = {
        y: elemento.y,
        itens: [],
      };

      linhas.push(linha);
    }

    linha.itens.push(elemento);
  }

  for (const linha of linhas) {
    linha.itens.sort((a, b) => a.x - b.x);
  }

  return linhas
    .map((linha) =>
      linha.itens
        .map((item) => item.texto)
        .join(" ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

/**
 * Extrai o texto das páginas do PDF.
 *
 * O texto é reconstruído página por página.
 * Em cada página, as duas colunas são processadas
 * separadamente para evitar que linhas de colunas
 * diferentes sejam misturadas.
 */
async function extrairPaginas(
  arquivo: File,
): Promise<{
  paginas: TextoPagina[];
  numeroPaginas: number;
}> {
  const arrayBuffer = await arquivo.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;

  const paginas: TextoPagina[] = [];

  for (
    let numeroPagina = 1;
    numeroPagina <= pdf.numPages;
    numeroPagina++
  ) {
    const pagina = await pdf.getPage(numeroPagina);
    const conteudo = await pagina.getTextContent();

    const itens: ItemPDF[] = [];

    for (const item of conteudo.items) {
      if (!("str" in item)) {
        continue;
      }

      const texto = item.str.trim();

      if (!texto) {
        continue;
      }

      const transform = item.transform;

      const x = transform[4] ?? 0;
      const y = transform[5] ?? 0;

      const largura = item.width ?? 0;
      const altura = item.height ?? 0;

      itens.push({
        texto,
        x,
        y,
        largura,
        altura,
      });
    }

    const viewport = pagina.getViewport({
      scale: 1,
    });

    const larguraPagina = viewport.width;
    const metadePagina = larguraPagina / 2;

    const colunaEsquerda = itens.filter(
      (item) => item.x < metadePagina,
    );

    const colunaDireita = itens.filter(
      (item) => item.x >= metadePagina,
    );

    const textoEsquerda =
      reconstruirColuna(colunaEsquerda);

    const textoDireita =
      reconstruirColuna(colunaDireita);

    /*
     * A ordem é mantida página por página:
     *
     * página 1:
     *   coluna esquerda
     *   coluna direita
     *
     * página 2:
     *   coluna esquerda
     *   coluna direita
     *
     * etc.
     */
    const textoPagina = [
      textoEsquerda,
      textoDireita,
    ]
      .filter(Boolean)
      .join("\n");

    paginas.push({
      pagina: numeroPagina,
      texto: textoPagina,
    });
  }

  return {
    paginas,
    numeroPaginas: pdf.numPages,
  };
}

/**
 * Junta todas as páginas.
 */
function juntarPaginas(
  paginas: TextoPagina[],
): string {
  return paginas
    .map((pagina) => pagina.texto)
    .join("\n");
}

/**
 * Localiza marcadores no formato:
 *
 * QUESTÃO 1
 * QUESTÃO 2
 * QUESTAO 3
 *
 * Também aceita:
 *
 * {01}
 * {02}
 *
 * A estratégia principal é usar QUESTÃO X.
 */
function encontrarMarcadoresQuestoes(
  texto: string,
): Array<{
  indice: number;
  numero: number;
  tamanho: number;
}> {
  const marcadores: Array<{
    indice: number;
    numero: number;
    tamanho: number;
  }> = [];

  /*
   * Primeiro procuramos QUESTÃO X.
   */
  const regexQuestao =
  /QUEST(?:ÃO|AO)[\s\u00A0\u200B\u200C\u200D\uFEFF]*(?:[.:,-][\s\u00A0\u200B\u200C\u200D\uFEFF]*)?(\d{1,3})(?!\d)/gi;

  let match: RegExpExecArray | null;

  while ((match = regexQuestao.exec(texto)) !== null) {
    const numeroTexto = match[1];

    if (!numeroTexto) {
      continue;
    }

    marcadores.push({
      indice: match.index,
      numero: Number(numeroTexto),
      tamanho: match[0].length,
    });
  }

  /*
   * Se encontramos uma quantidade razoável de
   * marcadores QUESTÃO, usamos somente essa estratégia.
   *
   * Isso evita que números presentes no texto
   * sejam confundidos com novas questões.
   */
  if (marcadores.length >= 5) {
    return removerMarcadoresDuplicados(marcadores);
  }

  /*
   * Caso o documento não utilize QUESTÃO X,
   * tentamos o formato {01}, {02}, etc.
   */
  const marcadoresChaves: Array<{
    indice: number;
    numero: number;
    tamanho: number;
  }> = [];

  const regexChaves = /\{\s*(\d{1,3})\s*\}/g;

  while (
    (match = regexChaves.exec(texto)) !== null
  ) {
    const numeroTexto = match[1];

    if (!numeroTexto) {
      continue;
    }

    marcadoresChaves.push({
      indice: match.index,
      numero: Number(numeroTexto),
      tamanho: match[0].length,
    });
  }

  return removerMarcadoresDuplicados(
    marcadoresChaves,
  );
}

/**
 * Remove marcadores duplicados na mesma posição.
 */
function removerMarcadoresDuplicados(
  marcadores: Array<{
    indice: number;
    numero: number;
    tamanho: number;
  }>,
): Array<{
  indice: number;
  numero: number;
  tamanho: number;
}> {
  marcadores.sort(
    (a, b) => a.indice - b.indice,
  );

  const resultado: typeof marcadores = [];

  for (const marcador of marcadores) {
    const anterior =
      resultado[resultado.length - 1];

    if (
      anterior &&
      marcador.indice === anterior.indice &&
      marcador.numero === anterior.numero
    ) {
      continue;
    }

    resultado.push(marcador);
  }

  return resultado;
}

/**
 * Separa o texto em blocos de questões.
 */
function separarQuestoes(
  texto: string,
): Array<{
  numero: number;
  texto: string;
}> {
  const marcadores =
    encontrarMarcadoresQuestoes(texto);

  const questoes: Array<{
    numero: number;
    texto: string;
  }> = [];

  for (
    let i = 0;
    i < marcadores.length;
    i++
  ) {
    const atual = marcadores[i];

    if (!atual) {
      continue;
    }

    const proximo = marcadores[i + 1];

    const inicio =
      atual.indice + atual.tamanho;

    const fim = proximo
      ? proximo.indice
      : texto.length;

    const conteudo = texto.slice(
      inicio,
      fim,
    );

    const textoLimpo =
      removerRuido(conteudo);

    if (!textoLimpo) {
      continue;
    }

    questoes.push({
      numero: atual.numero,
      texto: textoLimpo,
    });
  }

  return questoes;
}

/**
 * Detecta uma alternativa.
 *
 * Suporta:
 *
 * (A) texto
 * A) texto
 * A. texto
 * A - texto
 * A: texto
 */
function detectarAlternativa(
  texto: string,
): {
  encontrada: boolean;
  letra:
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | null;
  texto: string;
} {
  const padroes = [
    /^\s*\(([A-E])\)\s*(.+)/i,
    /^\s*([A-E])[.)]\s*(.+)/i,
    /^\s*([A-E])\s*[-:]\s*(.+)/i,
  ];

  for (const regex of padroes) {
    const match = texto.match(regex);

    if (!match || !match[1]) {
      continue;
    }

    return {
      encontrada: true,
      letra: match[1].toUpperCase() as
        | "A"
        | "B"
        | "C"
        | "D"
        | "E",
      texto: limparTexto(match[2] ?? ""),
    };
  }

  return {
    encontrada: false,
    letra: null,
    texto: "",
  };
}

/**
 * Divide cada questão em:
 *
 * enunciado
 * alternativas
 */
function separarAlternativas(
  texto: string,
): {
  enunciado: string;
  alternativas: AlternativaImportada[];
} {
  const linhas = texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

  const alternativas: AlternativaImportada[] = [];
  const enunciado: string[] = [];

  let alternativaAtual:
    | {
        letra:
          | "A"
          | "B"
          | "C"
          | "D"
          | "E";
        texto: string;
      }
    | null = null;

  for (const linha of linhas) {
    const alternativa =
      detectarAlternativa(linha);

    if (
      alternativa.encontrada &&
      alternativa.letra
    ) {
      if (alternativaAtual) {
        alternativas.push(
          alternativaAtual,
        );
      }

      alternativaAtual = {
        letra: alternativa.letra,
        texto: alternativa.texto,
      };

      continue;
    }

    if (alternativaAtual) {
      alternativaAtual.texto =
        `${alternativaAtual.texto} ${linha}`.trim();
    } else {
      enunciado.push(linha);
    }
  }

  if (alternativaAtual) {
    alternativas.push(
      alternativaAtual,
    );
  }

  return {
    enunciado: limparTexto(
      enunciado.join("\n"),
    ),
    alternativas,
  };
}

/**
 * Descobre as páginas relacionadas à questão.
 */
function descobrirPaginas(
  textoQuestao: string,
  paginas: TextoPagina[],
): number[] {
  const palavras = textoQuestao
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " ",
    )
    .split(/\s+/)
    .filter(
      (palavra) => palavra.length >= 6,
    )
    .slice(0, 8);

  if (palavras.length === 0) {
    return [];
  }

  const encontradas: number[] = [];

  for (const pagina of paginas) {
    const texto =
      pagina.texto.toLowerCase();

    const quantidade =
      palavras.filter((palavra) =>
        texto.includes(
          palavra.toLowerCase(),
        ),
      ).length;

    if (quantidade >= 2) {
      encontradas.push(
        pagina.pagina,
      );
    }
  }

  return encontradas;
}

/**
 * Calcula uma confiança estrutural.
 */
function calcularConfianca(
  texto: string,
  alternativas: AlternativaImportada[],
): number {
  let confianca = 0.4;

  if (texto.length > 100) {
    confianca += 0.2;
  }

  if (alternativas.length >= 4) {
    confianca += 0.3;
  } else if (alternativas.length >= 2) {
    confianca += 0.15;
  }

  if (
    alternativas.some(
      (alternativa) =>
        alternativa.letra === "A",
    )
  ) {
    confianca += 0.05;
  }

  return Math.min(
    confianca,
    1,
  );
}

/**
 * Remove questões duplicadas pelo número.
 *
 * Mantemos o bloco que contém mais conteúdo.
 */
function removerQuestoesDuplicadas(
  questoes: Array<{
    numero: number;
    texto: string;
  }>,
): Array<{
  numero: number;
  texto: string;
}> {
  const mapa =
    new Map<
      number,
      {
        numero: number;
        texto: string;
      }
    >();

  for (const questao of questoes) {
    const existente =
      mapa.get(questao.numero);

    if (
      !existente ||
      questao.texto.length >
        existente.texto.length
    ) {
      mapa.set(
        questao.numero,
        questao,
      );
    }
  }

  return Array.from(
    mapa.values(),
  );
}

/**
 * Função principal.
 */
export async function processarPDF(
  arquivo: File,
): Promise<{
  paginas: number;
  questoes: BlocoQuestao[];
}> {
  try {
    const resultadoPDF =
      await extrairPaginas(
        arquivo,
      );

    const paginas =
      resultadoPDF.paginas;

    const textoCompleto =
      juntarPaginas(paginas);

    /*
     * O questionário de percepção deve ser
     * separado antes da análise da numeração.
     */
    const divisor =
      /QUESTIONÁRIO\s+DE\s+PERCEPÇÃO\s+DA\s+PROVA/i;

    const partes =
      textoCompleto.split(divisor);

    /*
     * A primeira parte contém as 100 questões.
     */
    const partePrincipal =
      partes[0] ?? "";

    /*
     * Identifica e separa as questões.
     */
    let blocos =
      separarQuestoes(
        partePrincipal,
      );

    /*
     * Remove duplicidades.
     */
    blocos =
      removerQuestoesDuplicadas(
        blocos,
      );

    /*
     * Ordenação numérica.
     *
     * A posição física no PDF deixa de ser
     * determinante para a ordem final.
     */
    blocos.sort(
      (a, b) =>
        a.numero - b.numero,
    );

    /*
     * Converte para a estrutura usada
     * pelo restante do QBMed.
     */
    const questoes: BlocoQuestao[] =
      blocos.map(
        (bloco) => {
          const separado =
            separarAlternativas(
              bloco.texto,
            );

          return {
            numero: bloco.numero,

            texto:
              separado.enunciado,

            alternativas:
              separado.alternativas,

            paginas:
              descobrirPaginas(
                bloco.texto,
                paginas,
              ),

            confianca:
              calcularConfianca(
                separado.enunciado,
                separado.alternativas,
              ),
          };
        },
      );

    /*
     * Aviso específico caso o PDF tenha sido lido,
     * mas nenhum marcador tenha sido encontrado.
     */
    if (questoes.length === 0) {
      console.warn(
        "PDF lido, mas nenhum marcador de questão foi encontrado.",
      );

      console.warn(
        "Início do texto reconstruído:",
        textoCompleto.slice(0, 5000),
      );

      throw new Error(
        "Nenhuma questão pôde ser identificada.",
      );
    }

    return {
      paginas:
        resultadoPDF.numeroPaginas,

      questoes,
    };
  } catch (erro) {
    console.error(
      "Erro detalhado ao processar PDF:",
      erro,
    );

    throw new Error(
      "Não foi possível processar o PDF da prova.",
    );
  }
}