// Dados 100% fictícios, criados para demonstração. Nenhum conteúdo real de provas.

export type Alternativa = { letra: "A" | "B" | "C" | "D" | "E"; texto: string };

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
};

export const especialidades = [
  "Clínica Médica",
  "Cirurgia Geral",
  "Pediatria",
  "Ginecologia e Obstetrícia",
  "Medicina Preventiva",
];

export const subespecialidades: Record<string, string[]> = {
  "Clínica Médica": ["Cardiologia", "Pneumologia", "Endocrinologia", "Nefrologia"],
  "Cirurgia Geral": ["Trauma", "Abdome Agudo", "Cirurgia Vascular"],
  Pediatria: ["Neonatologia", "Infectologia Pediátrica", "Crescimento"],
  "Ginecologia e Obstetrícia": ["Obstetrícia", "Ginecologia Endócrina", "Oncoginecologia"],
  "Medicina Preventiva": ["Epidemiologia", "Saúde Coletiva", "Bioestatística"],
};

export const bancas = ["Instituto Aurora", "Fundação Meridiano", "Banca Vitalis", "Consórcio Solaris"];
export const anos = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
export const statusQuestao = ["Não respondidas", "Acertadas", "Erradas", "Favoritas"] as const;
export type StatusQuestao = (typeof statusQuestao)[number];

const comentariosBase: Comentario[] = [
  {
    id: "c1",
    autor: "Dra. Marina Alcântara",
    avatar: "MA",
    tempo: "há 2 horas",
    texto:
      "Dica de prova: sempre ancore o raciocínio no dado mais objetivo do caso antes de olhar as alternativas.",
    curtidas: 42,
  },
  {
    id: "c2",
    autor: "Rafael Bittencourt",
    avatar: "RB",
    tempo: "há 5 horas",
    texto: "Caí na alternativa distratora. A pegadinha está no tempo de evolução descrito no enunciado.",
    curtidas: 18,
  },
  {
    id: "c3",
    autor: "Prof. Henrique Salles",
    avatar: "HS",
    tempo: "ontem",
    texto: "Questão fictícia excelente para revisar conduta inicial. Refaça em 7 dias para fixar.",
    curtidas: 31,
  },
];

function q(
  id: number,
  enunciado: string,
  especialidade: string,
  subespecialidade: string,
  banca: string,
  ano: number,
  dificuldade: Questao["dificuldade"],
  tags: string[],
  alternativas: string[],
  correta: Questao["correta"],
  resolucao: string,
): Questao {
  const letras: Alternativa["letra"][] = ["A", "B", "C", "D", "E"];
  return {
    id: `Q${String(id).padStart(4, "0")}`,
    enunciado,
    especialidade,
    subespecialidade,
    banca,
    ano,
    dificuldade,
    tags,
    alternativas: alternativas.map((texto, i) => ({ letra: letras[i]!, texto })),
    correta,
    resolucao,
    comentarios: comentariosBase,
  };
}

export const questoes: Questao[] = [
  q(
    1,
    "Paciente fictício de 58 anos, hipertenso, chega à unidade simulada relatando dor torácica em aperto há 40 minutos, irradiada para o membro superior esquerdo, associada a sudorese. Exame simulado mostra PA 150x95 mmHg e FC 98 bpm. Qual a conduta inicial mais adequada neste cenário hipotético?",
    "Clínica Médica",
    "Cardiologia",
    "Instituto Aurora",
    2025,
    "Média",
    ["Dor torácica", "Emergência", "Conduta inicial"],
    [
      "Solicitar apenas exames laboratoriais e reavaliar em 12 horas.",
      "Realizar eletrocardiograma nos primeiros 10 minutos e iniciar monitorização.",
      "Encaminhar para ambulatório de cardiologia em 30 dias.",
      "Prescrever ansiolítico e liberar o paciente do cenário simulado.",
      "Iniciar antibioticoterapia empírica de amplo espectro.",
    ],
    "B",
    "No cenário fictício apresentado, a suspeita de síndrome coronariana aguda exige eletrocardiograma precoce (até 10 minutos da chegada) e monitorização contínua, pois a estratificação de risco define a estratégia de reperfusão. As demais alternativas retardam a conduta ou tratam hipóteses não sugeridas pelo caso.",
  ),
  q(
    2,
    "Em um caso simulado, lactente de 3 meses apresenta tosse progressiva, taquipneia e sibilância há 3 dias, sem febre alta. Ausculta hipotética revela sibilos difusos. Qual a hipótese diagnóstica mais provável?",
    "Pediatria",
    "Infectologia Pediátrica",
    "Fundação Meridiano",
    2024,
    "Fácil",
    ["Bronquiolite", "Lactente", "Sibilância"],
    [
      "Pneumonia bacteriana lobar.",
      "Bronquiolite viral aguda.",
      "Coqueluche em fase paroxística.",
      "Corpo estranho em via aérea.",
      "Insuficiência cardíaca descompensada.",
    ],
    "B",
    "O padrão fictício de sibilância difusa em lactente menor de 6 meses, com pródromo de via aérea superior e ausência de febre alta, é característico de bronquiolite viral aguda. O manejo demonstrativo é de suporte, com oxigenoterapia e hidratação conforme necessidade.",
  ),
  q(
    3,
    "Paciente fictícia de 29 anos, gestante de 34 semanas, apresenta cefaleia, escotomas e PA 165x110 mmHg em duas medidas simuladas. Proteinúria hipotética positiva. Qual a melhor conduta?",
    "Ginecologia e Obstetrícia",
    "Obstetrícia",
    "Banca Vitalis",
    2026,
    "Difícil",
    ["Pré-eclâmpsia", "Emergência hipertensiva", "Gestação"],
    [
      "Repouso domiciliar e retorno em 15 dias.",
      "Internação, anti-hipertensivo e sulfato de magnésio.",
      "Indução imediata do parto sem estabilização.",
      "Apenas dieta hipossódica e monitorização domiciliar.",
      "Prescrição de diurético de alça em domicílio.",
    ],
    "B",
    "No caso fictício com sinais de iminência de eclâmpsia, a conduta demonstrativa envolve internação, controle pressórico com anti-hipertensivo de ação rápida e profilaxia de convulsão com sulfato de magnésio, planejando a resolução da gestação conforme estabilidade materno-fetal.",
  ),
  q(
    4,
    "Homem fictício de 41 anos chega ao pronto-socorro simulado após colisão automobilística, hipotenso, taquicárdico e com abdome distendido. Qual a prioridade no atendimento hipotético?",
    "Cirurgia Geral",
    "Trauma",
    "Consórcio Solaris",
    2023,
    "Média",
    ["Trauma abdominal", "Choque", "ATLS fictício"],
    [
      "Tomografia de crânio antes de qualquer intervenção.",
      "Avaliação sequencial de via aérea, ventilação e circulação com reposição volêmica.",
      "Alta com analgesia oral.",
      "Aguardar exames laboratoriais completos antes de tratar.",
      "Iniciar fisioterapia motora precoce.",
    ],
    "B",
    "A sistematização fictícia do atendimento ao politraumatizado prioriza via aérea, ventilação e circulação. O paciente instável com suspeita de sangramento intra-abdominal requer reposição volêmica e avaliação cirúrgica precoce, e não exames que retardem o controle do foco.",
  ),
  q(
    5,
    "Em um estudo hipotético de coorte com 800 participantes, pesquisadores acompanham a incidência de um desfecho fictício em expostos e não expostos. Qual medida de associação é mais apropriada?",
    "Medicina Preventiva",
    "Epidemiologia",
    "Instituto Aurora",
    2022,
    "Média",
    ["Epidemiologia", "Coorte", "Risco relativo"],
    [
      "Razão de chances como única medida possível.",
      "Risco relativo.",
      "Prevalência pontual.",
      "Coeficiente de correlação de Pearson.",
      "Sensibilidade do teste diagnóstico.",
    ],
    "B",
    "Em estudos de coorte fictícios é possível calcular incidência nos grupos expostos e não expostos, permitindo o cálculo direto do risco relativo. A razão de chances é típica de estudos caso-controle.",
  ),
  q(
    6,
    "Paciente fictício de 65 anos, diabético, evolui com poliúria, perda ponderal e glicemia capilar simulada de 320 mg/dL, sem cetose. Qual ajuste terapêutico é o mais apropriado no cenário?",
    "Clínica Médica",
    "Endocrinologia",
    "Fundação Meridiano",
    2021,
    "Média",
    ["Diabetes", "Ajuste terapêutico", "Ambulatório"],
    [
      "Suspender todos os medicamentos e apenas orientar dieta.",
      "Intensificar o tratamento com insulinização basal e reforço de educação em saúde.",
      "Prescrever antibiótico profilático.",
      "Solicitar somente hemograma e reavaliar em 6 meses.",
      "Indicar internação em unidade intensiva imediatamente.",
    ],
    "B",
    "No caso simulado de descompensação hiperglicêmica sem cetose e com catabolismo, a insulinização basal associada à reeducação alimentar é a conduta demonstrativa mais adequada, com reavaliação precoce.",
  ),
  q(
    7,
    "Recém-nascido fictício a termo apresenta icterícia com 20 horas de vida. Qual a conduta inicial no cenário hipotético?",
    "Pediatria",
    "Neonatologia",
    "Banca Vitalis",
    2020,
    "Difícil",
    ["Icterícia precoce", "Neonatologia", "Investigação"],
    [
      "Observar sem exames, pois é sempre fisiológica.",
      "Investigar causa hemolítica com bilirrubinas, tipagem e Coombs.",
      "Iniciar fototerapia apenas após 72 horas de vida.",
      "Suspender aleitamento materno definitivamente.",
      "Encaminhar para transfusão imediata sem exames.",
    ],
    "B",
    "Icterícia nas primeiras 24 horas de vida, em caso fictício, nunca é considerada fisiológica: exige investigação de hemólise com dosagem de bilirrubinas, tipagem sanguínea e teste de Coombs direto.",
  ),
  q(
    8,
    "Mulher fictícia de 47 anos relata sangramento uterino anormal há 5 meses, com ciclos irregulares. Ultrassonografia simulada mostra espessamento endometrial. Qual a conduta?",
    "Ginecologia e Obstetrícia",
    "Ginecologia Endócrina",
    "Consórcio Solaris",
    2024,
    "Média",
    ["Sangramento uterino", "Perimenopausa", "Investigação"],
    [
      "Apenas anticoncepcional oral sem investigação.",
      "Realizar amostragem endometrial para afastar patologia.",
      "Indicar histerectomia imediata.",
      "Manter conduta expectante por 2 anos.",
      "Prescrever apenas anti-inflamatório.",
    ],
    "B",
    "Diante do caso fictício de sangramento uterino anormal em paciente acima de 45 anos com espessamento endometrial, a avaliação histológica do endométrio é mandatória antes de qualquer tratamento hormonal.",
  ),
  q(
    9,
    "Paciente fictício de 33 anos com dor abdominal em fossa ilíaca direita, febre baixa e sinal de descompressão positivo no exame simulado. Qual hipótese principal?",
    "Cirurgia Geral",
    "Abdome Agudo",
    "Instituto Aurora",
    2025,
    "Fácil",
    ["Abdome agudo", "Inflamatório", "Diagnóstico"],
    [
      "Apendicite aguda.",
      "Gastroenterite viral simples.",
      "Cistite não complicada.",
      "Enxaqueca abdominal.",
      "Refluxo gastroesofágico.",
    ],
    "A",
    "O conjunto fictício de dor migratória para fossa ilíaca direita, febre baixa e irritação peritoneal localizada é clássico de apendicite aguda no material de estudo.",
  ),
  q(
    10,
    "Em um cenário fictício de vigilância, uma equipe precisa avaliar rapidamente a magnitude de um surto em uma comunidade. Qual indicador é mais adequado?",
    "Medicina Preventiva",
    "Saúde Coletiva",
    "Fundação Meridiano",
    2026,
    "Fácil",
    ["Vigilância", "Surto", "Indicadores"],
    [
      "Taxa de incidência no período do surto.",
      "Expectativa de vida ao nascer.",
      "Índice de Gini municipal.",
      "Taxa de alfabetização.",
      "Razão de dependência etária.",
    ],
    "A",
    "A taxa de incidência mede casos novos em um período determinado, sendo o indicador demonstrativo mais útil para dimensionar a magnitude e a velocidade de um surto fictício.",
  ),
  q(
    11,
    "Paciente fictício de 70 anos com dispneia progressiva, edema de membros inferiores e estertores bibasais no exame simulado. Qual exame inicial ajuda mais na estratificação?",
    "Clínica Médica",
    "Pneumologia",
    "Banca Vitalis",
    2022,
    "Média",
    ["Dispneia", "Congestão", "Propedêutica"],
    [
      "Radiografia de tórax associada a avaliação clínica estruturada.",
      "Ressonância de coluna lombar.",
      "Endoscopia digestiva alta.",
      "Colonoscopia de rastreio.",
      "Densitometria óssea.",
    ],
    "A",
    "No caso hipotético com sinais de congestão, a radiografia de tórax somada à avaliação clínica estruturada orienta a hipótese de descompensação e direciona a conduta inicial.",
  ),
  q(
    12,
    "Adolescente fictício de 14 anos apresenta baixa estatura e velocidade de crescimento reduzida no acompanhamento simulado. Qual a primeira etapa da avaliação?",
    "Pediatria",
    "Crescimento",
    "Consórcio Solaris",
    2023,
    "Difícil",
    ["Crescimento", "Puberdade", "Avaliação"],
    [
      "Iniciar hormônio de crescimento imediatamente.",
      "Construir a curva de crescimento e calcular a estatura-alvo familiar.",
      "Solicitar ressonância de crânio sem outros dados.",
      "Indicar dieta hipercalórica isolada.",
      "Encaminhar direto para cirurgia ortopédica.",
    ],
    "B",
    "A avaliação fictícia de baixa estatura começa pela antropometria seriada, construção da curva de crescimento e cálculo da estatura-alvo familiar, antes de exames complementares ou terapias.",
  ),
];

export const questaoDoDia: Questao = questoes[0]!;

export type Simulado = {
  id: string;
  nome: string;
  data: string;
  questoes: number;
  acertos: number;
  duracao: string;
  status: "Concluído" | "Em andamento" | "Disponível";
};

export const simulados: Simulado[] = [
  { id: "S-101", nome: "Simulado Geral QBMed #12", data: "28/08/2026", questoes: 100, acertos: 78, duracao: "3h20", status: "Concluído" },
  { id: "S-100", nome: "Simulado Clínica Médica Intensivo", data: "14/08/2026", questoes: 60, acertos: 41, duracao: "2h05", status: "Concluído" },
  { id: "S-099", nome: "Simulado Pediatria Foco", data: "02/08/2026", questoes: 50, acertos: 39, duracao: "1h48", status: "Concluído" },
  { id: "S-098", nome: "Simulado Cirurgia Revisão", data: "21/07/2026", questoes: 50, acertos: 31, duracao: "1h55", status: "Concluído" },
  { id: "S-102", nome: "Simulado Nacional Setembro", data: "10/09/2026", questoes: 120, acertos: 0, duracao: "4h00", status: "Disponível" },
  { id: "S-103", nome: "Simulado GO + Preventiva", data: "18/09/2026", questoes: 80, acertos: 0, duracao: "2h40", status: "Disponível" },
];

export const desempenhoPorEspecialidade = [
  { especialidade: "Clínica Médica", acertos: 82, total: 100 },
  { especialidade: "Cirurgia Geral", acertos: 61, total: 90 },
  { especialidade: "Pediatria", acertos: 74, total: 95 },
  { especialidade: "GO", acertos: 68, total: 88 },
  { especialidade: "Preventiva", acertos: 57, total: 70 },
];

export const evolucaoMensal = [
  { mes: "Mar", aproveitamento: 52, questoes: 210 },
  { mes: "Abr", aproveitamento: 58, questoes: 320 },
  { mes: "Mai", aproveitamento: 61, questoes: 380 },
  { mes: "Jun", aproveitamento: 66, questoes: 410 },
  { mes: "Jul", aproveitamento: 71, questoes: 520 },
  { mes: "Ago", aproveitamento: 76, questoes: 610 },
];

export const progressoSemanal = [
  { dia: "Seg", questoes: 42, meta: 50 },
  { dia: "Ter", questoes: 55, meta: 50 },
  { dia: "Qua", questoes: 38, meta: 50 },
  { dia: "Qui", questoes: 61, meta: 50 },
  { dia: "Sex", questoes: 47, meta: 50 },
  { dia: "Sáb", questoes: 72, meta: 50 },
  { dia: "Dom", questoes: 25, meta: 50 },
];

export type Anotacao = {
  id: string;
  titulo: string;
  especialidade: string;
  texto: string;
  data: string;
};

export const anotacoes: Anotacao[] = [
  {
    id: "N1",
    titulo: "Checklist de dor torácica",
    especialidade: "Clínica Médica",
    texto: "ECG em até 10 min, monitorização, acesso venoso, estratificação de risco. Revisar critérios fictícios de reperfusão.",
    data: "30/08/2026",
  },
  {
    id: "N2",
    titulo: "Icterícia neonatal precoce",
    especialidade: "Pediatria",
    texto: "Antes de 24h de vida nunca é fisiológica: bilirrubinas, tipagem e Coombs. Refazer questões erradas em 7 dias.",
    data: "27/08/2026",
  },
  {
    id: "N3",
    titulo: "Sulfato de magnésio",
    especialidade: "Ginecologia e Obstetrícia",
    texto: "Indicações no cenário de iminência de eclâmpsia e sinais de intoxicação a monitorar (reflexos, diurese, FR).",
    data: "22/08/2026",
  },
];

export const planos = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: 89,
    sufixo: "/mês",
    descricao: "Flexibilidade total para começar agora.",
    destaque: false,
    recursos: ["Banco com 40 mil questões fictícias", "Filtros avançados", "Comentários do fórum", "Suporte por e-mail"],
  },
  {
    id: "semestral",
    nome: "Semestral",
    preco: 59,
    sufixo: "/mês",
    descricao: "Equilíbrio ideal para o ciclo de estudos.",
    destaque: true,
    recursos: [
      "Tudo do plano Mensal",
      "Simulados nacionais mensais",
      "Analytics de desempenho completo",
      "Trilhas por especialidade",
    ],
  },
  {
    id: "anual",
    nome: "Anual",
    preco: 42,
    sufixo: "/mês",
    descricao: "O melhor custo-benefício até a prova.",
    destaque: false,
    recursos: [
      "Tudo do plano Semestral",
      "Mentoria em grupo quinzenal",
      "Revisão inteligente por erros",
      "Garantia de 15 dias",
    ],
  },
];

export const notificacoes = [
  { id: "n1", titulo: "Simulado Nacional Setembro liberado", tempo: "há 20 min" },
  { id: "n2", titulo: "Você manteve 12 dias de streak!", tempo: "há 3 h" },
  { id: "n3", titulo: "Nova resposta no fórum da questão Q0004", tempo: "ontem" },
];

export const usuario = {
  nome: "Diego Henrique",
  email: "diego@qbmed.com.br",
  iniciais: "DH",
  plano: "Semestral",
  streak: 12,
};
