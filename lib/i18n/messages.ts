export const LOCALE_COOKIE = 'remote-engineering-radar-locale';
export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];

export const EN_MESSAGES = {
  app: {
    name: 'Remote Engineering Radar',
    focusStack: 'React, TypeScript, Node.js, GraphQL, and React Native',
    description:
      'Automated job intelligence for remote senior frontend and fullstack roles in React, TypeScript, Node.js, GraphQL, and React Native.',
  },
  navigation: {
    label: 'Main navigation',
    companies: 'Companies',
    jobs: 'Jobs',
    about: 'About',
    language: 'Language',
    languages: { en: 'English', 'pt-BR': 'Português (Brasil)' },
    github: 'GitHub',
  },
  home: {
    subtitle:
      'Remote senior frontend and fullstack companies hiring in React, TypeScript, Node.js, GraphQL, and React Native.',
    companiesToWatch: 'Companies to watch',
    relevantJobs: 'Relevant jobs',
    openRoles: (count: number) =>
      `${count} ${count === 1 ? 'open role' : 'open roles'}`,
    evidence: 'Evidence / sources',
    countryFilterLabel: 'Country',
    countryAll: 'All countries',
    sortLabel: 'Sort',
    sortOptions: {
      default: 'Hiring signal',
      jobs: 'Open roles',
      name: 'Name (A–Z)',
    },
    loading: 'Loading companies…',
  },
  jobs: {
    title: 'Jobs',
    subtitle:
      'Search remote senior frontend and fullstack openings in React, TypeScript, Node.js, GraphQL, and React Native.',
    metaTitle: 'Jobs in React, TypeScript, Node.js, GraphQL, and React Native',
    filtersHeading: 'Filters',
    technology: 'Technology',
    seniority: 'Seniority',
    remote: 'Remote policy',
    country: 'Country',
    anyOption: 'Any',
    minimumScore: 'Minimum score',
    apply: 'Apply filters',
    empty: 'No active jobs match these filters.',
    notFound: 'This job is inactive or was not found.',
    backToJobs: 'Back to jobs',
    loading: 'Loading jobs…',
    whyRelevant: 'Why this is relevant:',
  },
  countries: {
    brazil: 'Brazil',
    chile: 'Chile',
    argentina: 'Argentina',
    mexico: 'Mexico',
    colombia: 'Colombia',
    'united-states': 'United States',
    worldwide: 'Worldwide',
  },
  seniority: {
    junior: 'junior',
    mid: 'mid',
    senior: 'senior',
    staff: 'staff',
    principal: 'principal',
  },
  remote: { remote: 'remote', hybrid: 'hybrid', onsite: 'onsite' },
  jobReasons: {
    Senior: 'Senior',
    Staff: 'Staff',
    'Mid-level': 'Mid-level',
    Junior: 'Junior',
    Frontend: 'Frontend',
    Fullstack: 'Fullstack',
    Remote: 'Remote',
    'On-site only': 'On-site only',
    Brazil: 'Brazil',
    LATAM: 'LATAM',
    Americas: 'Americas',
    'Relocation required': 'Relocation required',
    'Unrelated stack': 'Unrelated stack',
    'Unrelated role': 'Unrelated role',
  },
  jobCard: {
    hideAction: 'Hide job',
    hideConfirmation:
      'Hide this job? You will not see it again in this browser.',
    viewOriginal: 'View original job',
    postedLabel: 'Posted',
    unknownCompany: 'Unknown company',
  },
  companyCard: {
    hiringSignalLabel: 'Hiring signal',
    signalsLabel: 'Signals:',
    viewCompany: 'View company',
    openRolesSuffix: 'engineering positions currently open',
    summaries: {
      'Strong hiring signal': 'Strong hiring signal',
      'Company is actively expanding engineering hiring.':
        'Company is actively expanding engineering hiring.',
    },
    kindLabels: {
      product: 'Product',
      consultancy: 'Consultancy',
      staffing: 'Staffing',
    },
  },
  report: {
    emptyCompanies: 'No companies to watch yet.',
    error: 'The report could not be loaded from the database.',
    unknownTime: 'Unknown',
    updated: (value: string) => `Updated: ${value}`,
  },
  globalError: {
    title: 'Something went wrong',
    description: 'The page could not be rendered. Trying again may be enough.',
    retry: 'Try again',
  },
  about: {
    title: 'About the radar',
    introduction:
      'A daily overview of remote engineering opportunities, with links to the original sources.',
    sourcesTitle: 'Sources',
    sources:
      'We ingest public listings from Greenhouse, Ashby, Hacker News, frontendbr, Himalayas, Jobicy, GetOnBrd, and Lever.',
    freshnessTitle: 'Freshness and scope',
    freshness:
      'Ingestion runs once daily through GitHub Actions. Listings can be up to 24 hours out of date.',
    scope: 'Only remote roles posted within the last 30 days are shown.',
    scoringTitle: 'Signals, not endorsements',
    scoring:
      'The hiring score is a heuristic based on public hiring signals, not an endorsement of a company or a role.',
    applications:
      'The radar does not accept applications. Follow the original job links to check the details and apply directly at the source.',
    repositoryTitle: 'Open source',
    repository: 'Explore the code and how the radar works on GitHub.',
  },
};

export const PT_BR_MESSAGES: typeof EN_MESSAGES = {
  app: {
    name: 'Remote Engineering Radar',
    focusStack: 'React, TypeScript, Node.js, GraphQL e React Native',
    description:
      'Inteligência automatizada de vagas remotas sênior de frontend e fullstack em React, TypeScript, Node.js, GraphQL e React Native.',
  },
  navigation: {
    label: 'Navegação principal',
    companies: 'Empresas',
    jobs: 'Vagas',
    about: 'Sobre',
    language: 'Idioma',
    languages: { en: 'English', 'pt-BR': 'Português (Brasil)' },
    github: 'GitHub',
  },
  home: {
    subtitle:
      'Empresas contratando profissionais sênior de frontend e fullstack para trabalho remoto em React, TypeScript, Node.js, GraphQL e React Native.',
    companiesToWatch: 'Empresas para acompanhar',
    relevantJobs: 'Vagas relevantes',
    openRoles: (count: number) =>
      `${count} ${count === 1 ? 'vaga aberta' : 'vagas abertas'}`,
    evidence: 'Evidências / fontes',
    countryFilterLabel: 'País',
    countryAll: 'Todos os países',
    sortLabel: 'Ordenar',
    sortOptions: {
      default: 'Sinal de contratação',
      jobs: 'Vagas abertas',
      name: 'Nome (A–Z)',
    },
    loading: 'Carregando empresas…',
  },
  jobs: {
    title: 'Vagas',
    subtitle:
      'Busque vagas remotas sênior de frontend e fullstack em React, TypeScript, Node.js, GraphQL e React Native.',
    metaTitle: 'Vagas em React, TypeScript, Node.js, GraphQL e React Native',
    filtersHeading: 'Filtros',
    technology: 'Tecnologia',
    seniority: 'Senioridade',
    remote: 'Modelo de trabalho',
    country: 'País',
    anyOption: 'Qualquer',
    minimumScore: 'Pontuação mínima',
    apply: 'Aplicar filtros',
    empty: 'Nenhuma vaga ativa corresponde a estes filtros.',
    notFound: 'Esta vaga está inativa ou não foi encontrada.',
    backToJobs: 'Voltar para vagas',
    loading: 'Carregando vagas…',
    whyRelevant: 'Por que esta vaga é relevante:',
  },
  countries: {
    brazil: 'Brasil',
    chile: 'Chile',
    argentina: 'Argentina',
    mexico: 'México',
    colombia: 'Colômbia',
    'united-states': 'Estados Unidos',
    worldwide: 'Mundo todo',
  },
  seniority: {
    junior: 'júnior',
    mid: 'pleno',
    senior: 'sênior',
    staff: 'staff',
    principal: 'principal',
  },
  remote: { remote: 'remoto', hybrid: 'híbrido', onsite: 'presencial' },
  jobReasons: {
    Senior: 'Sênior',
    Staff: 'Staff',
    'Mid-level': 'Pleno',
    Junior: 'Júnior',
    Frontend: 'Frontend',
    Fullstack: 'Fullstack',
    Remote: 'Remoto',
    'On-site only': 'Somente presencial',
    Brazil: 'Brasil',
    LATAM: 'América Latina',
    Americas: 'Américas',
    'Relocation required': 'Mudança de cidade ou país obrigatória',
    'Unrelated stack': 'Tecnologias fora do foco',
    'Unrelated role': 'Cargo fora do foco',
  },
  jobCard: {
    hideAction: 'Ocultar vaga',
    hideConfirmation:
      'Ocultar esta vaga? Você não a verá novamente neste navegador.',
    viewOriginal: 'Ver vaga original',
    postedLabel: 'Publicada',
    unknownCompany: 'Empresa desconhecida',
  },
  companyCard: {
    hiringSignalLabel: 'Sinal de contratação',
    signalsLabel: 'Sinais:',
    viewCompany: 'Ver empresa',
    openRolesSuffix: 'vagas de engenharia abertas no momento',
    summaries: {
      'Strong hiring signal': 'Forte sinal de contratação',
      'Company is actively expanding engineering hiring.':
        'A empresa está ampliando as contratações de engenharia.',
    },
    kindLabels: {
      product: 'Produto',
      consultancy: 'Consultoria',
      staffing: 'Recrutamento',
    },
  },
  report: {
    emptyCompanies: 'Ainda não há empresas para acompanhar.',
    error: 'Não foi possível carregar o relatório do banco de dados.',
    unknownTime: 'Desconhecida',
    updated: (value: string) => `Atualizado: ${value}`,
  },
  globalError: {
    title: 'Algo deu errado',
    description:
      'Não foi possível exibir a página. Tentar novamente pode resolver.',
    retry: 'Tentar novamente',
  },
  about: {
    title: 'Sobre o radar',
    introduction:
      'Um panorama diário de oportunidades remotas de engenharia, com links para as fontes originais.',
    sourcesTitle: 'Fontes',
    sources:
      'Coletamos vagas públicas de Greenhouse, Ashby, Hacker News, frontendbr, Himalayas, Jobicy, GetOnBrd e Lever.',
    freshnessTitle: 'Atualização e escopo',
    freshness:
      'A coleta é executada uma vez por dia pelo GitHub Actions. As vagas podem estar até 24 horas desatualizadas.',
    scope: 'São exibidas apenas vagas remotas publicadas nos últimos 30 dias.',
    scoringTitle: 'Sinais, não recomendações',
    scoring:
      'A pontuação de contratação é uma heurística baseada em sinais públicos de contratação, não uma recomendação de empresa ou vaga.',
    applications:
      'O radar não recebe candidaturas. Acesse os links originais das vagas para conferir os detalhes e se candidatar diretamente na fonte.',
    repositoryTitle: 'Código aberto',
    repository: 'Explore o código e o funcionamento do radar no GitHub.',
  },
};

export const isLocale = (value: unknown): value is Locale =>
  LOCALES.some((locale) => locale === value);

export const messagesFor = (locale: Locale = 'en') =>
  locale === 'pt-BR' ? PT_BR_MESSAGES : EN_MESSAGES;
