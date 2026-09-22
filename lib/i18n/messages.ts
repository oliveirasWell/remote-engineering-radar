export const LOCALE_COOKIE = 'remote-engineering-radar-locale';
export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];

export const EN_MESSAGES = {
  app: {
    name: 'Remote Engineering Radar',
    focusStack:
      'React, TypeScript, Node.js, GraphQL, React Native, and Cloud & Ops',
    description:
      'Remote senior tech jobs and the companies hiring for them: React Engineering (React, TypeScript, Node.js, GraphQL, React Native), Cloud & Ops, Product, and Data Annotation, with Brazil and LATAM filters.',
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
      'Companies hiring remote senior talent in React, TypeScript, Node.js, GraphQL and React Native, Cloud & Ops, Product, and Data Annotation.',
    companiesToWatch: 'Companies to watch',
    relevantJobs: 'Relevant jobs',
    seeAllJobs: (count: number) => `See all ${count} jobs`,
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
      'Search remote senior openings in React, TypeScript, Node.js, GraphQL and React Native, Cloud & Ops, Product, and Data Annotation.',
    metaTitle: 'Remote React, Cloud, Product & AI Annotation Jobs',
    filtersHeading: 'Filters',
    focusLabel: 'Focus area',
    focusAll: 'All roles',
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
    sortLabel: 'Sort jobs',
    sortOptions: {
      newest: 'Newest first',
      relevance: 'Most relevant',
    },
  },
  seo: {
    homeTitle: 'Remote React, Cloud & Product Jobs',
    countryCompaniesTitle: (place: string) =>
      `Remote tech companies hiring – ${place}`,
    countryCompaniesDescription: (place: string) =>
      `Companies with open remote senior roles in React Engineering, Cloud & Ops, Product, and Data Annotation – ${place}. Updated daily.`,
    focusCompaniesTitle: (track: string) =>
      `Companies hiring remote ${track} roles`,
    focusCompaniesDescription: (track: string) =>
      `Companies with open remote senior ${track} roles, ranked by hiring signal. Updated daily.`,
    countryJobsTitle: (place: string) => `Remote tech jobs – ${place}`,
    countryJobsDescription: (place: string) =>
      `Remote senior React Engineering, Cloud & Ops, Product, and Data Annotation jobs – ${place}. Updated daily.`,
    focusJobsTitle: (track: string) => `Remote ${track} jobs`,
    focusJobsDescription: (track: string) =>
      `Remote senior ${track} jobs from public job boards. Updated daily.`,
  },
  focus: {
    engineering: 'React Engineering',
    'cloud-ops': 'Cloud & Ops',
    'data-annotation': 'Data Annotation',
    product: 'Product',
  },
  countries: {
    brazil: 'Brazil',
    chile: 'Chile',
    argentina: 'Argentina',
    mexico: 'Mexico',
    colombia: 'Colombia',
    'united-states': 'United States',
    ukraine: 'Ukraine',
    india: 'India',
    egypt: 'Egypt',
    pakistan: 'Pakistan',
    latam: 'LATAM',
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
    Platform: 'Cloud & Ops',
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
    sourcesIntro:
      'We ingest public listings only. Each source is fetched as JSON or an embedded public payload — no applications are submitted on your behalf.',
    sources: [
      {
        name: 'Greenhouse',
        description:
          'Public board API for configured company tokens (GREENHOUSE_BOARD_TOKENS).',
      },
      {
        name: 'Ashby',
        description:
          'Public job-board API for configured board names (ASHBY_BOARD_NAMES).',
      },
      {
        name: 'Lever',
        description:
          'Public postings API for configured board slugs (LEVER_BOARD_SLUGS).',
      },
      {
        name: 'GetOnBrd',
        description: 'Public programming-category API (LATAM-focused boards).',
      },
      {
        name: 'Hacker News',
        description:
          'Algolia search over the latest “Who is hiring?” thread comments.',
      },
      {
        name: 'Himalayas',
        description: 'Public remote jobs API (bounded recent pages).',
      },
      {
        name: 'Jobicy',
        description: 'Public remote engineering feed (count-limited).',
      },
      {
        name: 'frontendbr',
        description: 'Open issues from the frontendbr/vagas GitHub repository.',
      },
      {
        name: 'quave',
        description: 'Open issues from the quavedev/join GitHub repository.',
      },
      {
        name: 'Y Combinator',
        description:
          'Public Work at a Startup listing pages for remote software-engineering roles.',
      },
    ],
    freshnessTitle: 'Freshness and scope',
    freshness:
      'Ingestion runs once daily through GitHub Actions. Listings can be up to 24 hours out of date.',
    scope:
      'Only remote roles posted within the last 30 days are shown, across all focus areas.',
    scoringTitle: 'Signals, not endorsements',
    scoring:
      'Scores are heuristics over public text — not endorsements of a company or role.',
    scoringJob:
      'The radar tracks four focus areas. React Engineering and Cloud & Ops are scored on equal footing: React Engineering favors React, TypeScript, Node.js, GraphQL, and React Native; Cloud & Ops favors AWS, Kubernetes, Terraform, Docker, Azure, and GCP. Data Annotation groups AI training, data labeling, and RLHF roles. Product groups product manager and product owner roles. All four favor senior/staff titles, remote work, and Brazil/LATAM/Americas geography. Junior, onsite-only, relocation-required, and unrelated stacks are heavily down-ranked.',
    scoringCompany:
      'Company hiring score aggregates active engineering openings, recent posting bursts, relevant tech matches, and leadership roles — again from public listings only.',
    applications:
      'The radar does not accept applications. Follow the original job links to check the details and apply directly at the source.',
    contactTitle: 'Contact',
    contact:
      'Questions, corrections, or source suggestions — email works best. The personal site has more context on other work.',
    contactEmailLabel: 'Email',
    contactSiteLabel: 'Personal site',
    repositoryTitle: 'Open source',
    repository: 'Explore the code and how the radar works on GitHub.',
  },
};
export const PT_BR_MESSAGES: typeof EN_MESSAGES = {
  app: {
    name: 'Remote Engineering Radar',
    focusStack:
      'React, TypeScript, Node.js, GraphQL, React Native e Cloud & Ops',
    description:
      'Vagas remotas sênior de tecnologia e as empresas que estão contratando: Engenharia React (React, TypeScript, Node.js, GraphQL, React Native), Cloud & Ops, Produto e Anotação de Dados, com filtros para Brasil e LATAM.',
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
      'Empresas contratando profissionais sênior para trabalho remoto em React, TypeScript, Node.js, GraphQL e React Native, Cloud & Ops, Produto e Anotação de Dados.',
    companiesToWatch: 'Empresas para acompanhar',
    relevantJobs: 'Vagas relevantes',
    seeAllJobs: (count: number) => `Ver todas as ${count} vagas`,
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
      'Busque vagas remotas sênior em React, TypeScript, Node.js, GraphQL e React Native, Cloud & Ops, Produto e Anotação de Dados.',
    metaTitle: 'Vagas remotas em React, Cloud, Produto e Anotação de IA',
    filtersHeading: 'Filtros',
    focusLabel: 'Área de foco',
    focusAll: 'Todas as áreas',
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
    sortLabel: 'Ordenar vagas',
    sortOptions: {
      newest: 'Mais recentes',
      relevance: 'Maior relevância',
    },
  },
  seo: {
    homeTitle: 'Vagas remotas em React, Cloud e Produto',
    countryCompaniesTitle: (place: string) =>
      `Empresas de tecnologia contratando remoto – ${place}`,
    countryCompaniesDescription: (place: string) =>
      `Empresas com vagas remotas sênior em Engenharia React, Cloud & Ops, Produto e Anotação de Dados – ${place}. Atualizado diariamente.`,
    focusCompaniesTitle: (track: string) =>
      `Empresas contratando remoto em ${track}`,
    focusCompaniesDescription: (track: string) =>
      `Empresas com vagas remotas sênior em ${track}, ordenadas por sinal de contratação. Atualizado diariamente.`,
    countryJobsTitle: (place: string) =>
      `Vagas remotas de tecnologia – ${place}`,
    countryJobsDescription: (place: string) =>
      `Vagas remotas sênior em Engenharia React, Cloud & Ops, Produto e Anotação de Dados – ${place}. Atualizado diariamente.`,
    focusJobsTitle: (track: string) => `Vagas remotas de ${track}`,
    focusJobsDescription: (track: string) =>
      `Vagas remotas sênior de ${track} em fontes públicas. Atualizado diariamente.`,
  },
  focus: {
    engineering: 'Engenharia React',
    'cloud-ops': 'Cloud & Ops',
    'data-annotation': 'Anotação de Dados',
    product: 'Produto',
  },
  countries: {
    brazil: 'Brasil',
    chile: 'Chile',
    argentina: 'Argentina',
    mexico: 'México',
    colombia: 'Colômbia',
    'united-states': 'Estados Unidos',
    ukraine: 'Ucrânia',
    india: 'Índia',
    egypt: 'Egito',
    pakistan: 'Paquistão',
    latam: 'América Latina',
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
    Platform: 'Cloud & Ops',
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
    sourcesIntro:
      'Coletamos apenas listagens públicas. Cada fonte é lida como JSON ou payload público embutido — nenhuma candidatura é enviada em seu nome.',
    sources: [
      {
        name: 'Greenhouse',
        description:
          'API pública de boards para os tokens configurados (GREENHOUSE_BOARD_TOKENS).',
      },
      {
        name: 'Ashby',
        description:
          'API pública de job board para os nomes configurados (ASHBY_BOARD_NAMES).',
      },
      {
        name: 'Lever',
        description:
          'API pública de postings para os slugs configurados (LEVER_BOARD_SLUGS).',
      },
      {
        name: 'GetOnBrd',
        description: 'API pública da categoria programming (foco LATAM).',
      },
      {
        name: 'Hacker News',
        description:
          'Busca Algolia nos comentários do thread mais recente de “Who is hiring?”.',
      },
      {
        name: 'Himalayas',
        description:
          'API pública de vagas remotas (páginas recentes limitadas).',
      },
      {
        name: 'Jobicy',
        description:
          'Feed público de engenharia remota (com limite de quantidade).',
      },
      {
        name: 'frontendbr',
        description:
          'Issues abertas do repositório frontendbr/vagas no GitHub.',
      },
      {
        name: 'quave',
        description: 'Issues abertas do repositório quavedev/join no GitHub.',
      },
      {
        name: 'Y Combinator',
        description:
          'Páginas públicas do Work at a Startup com vagas remotas de software engineering.',
      },
    ],
    freshnessTitle: 'Atualização e escopo',
    freshness:
      'A coleta é executada uma vez por dia pelo GitHub Actions. As vagas podem estar até 24 horas desatualizadas.',
    scope:
      'São exibidas apenas vagas remotas publicadas nos últimos 30 dias, em todas as áreas de foco.',
    scoringTitle: 'Sinais, não recomendações',
    scoring:
      'As pontuações são heurísticas sobre texto público — não uma recomendação de empresa ou vaga.',
    scoringJob:
      'O radar acompanha quatro áreas de foco. Engenharia React e Cloud & Ops são pontuadas em pé de igualdade: Engenharia React favorece React, TypeScript, Node.js, GraphQL e React Native; Cloud & Ops favorece AWS, Kubernetes, Terraform, Docker, Azure e GCP. Anotação de Dados reúne vagas de treinamento de IA, rotulagem de dados e RLHF. Produto reúne vagas de product manager e product owner. As quatro favorecem títulos senior/staff, remoto e geografia Brasil/LATAM/Américas. Junior, apenas presencial, relocação obrigatória e stacks sem relação são fortemente penalizados.',
    scoringCompany:
      'A nota da empresa agrega vagas de engenharia ativas, rajadas recentes de publicações, matches de tech relevante e papéis de liderança — sempre a partir de listagens públicas.',
    applications:
      'O radar não recebe candidaturas. Acesse os links originais das vagas para conferir os detalhes e se candidatar diretamente na fonte.',
    contactTitle: 'Contato',
    contact:
      'Dúvidas, correções ou sugestões de fontes — e-mail é o melhor canal. O site pessoal traz mais contexto sobre outros trabalhos.',
    contactEmailLabel: 'E-mail',
    contactSiteLabel: 'Site pessoal',
    repositoryTitle: 'Código aberto',
    repository: 'Explore o código e o funcionamento do radar no GitHub.',
  },
};

export const isLocale = (value: unknown): value is Locale =>
  LOCALES.some((locale) => locale === value);

export const messagesFor = (locale: Locale = 'en') =>
  locale === 'pt-BR' ? PT_BR_MESSAGES : EN_MESSAGES;
