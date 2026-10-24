export const LOCALE_COOKIE = 'remote-engineering-radar-locale';
export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

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
    guide: 'How it works',
    about: 'About',
    privacy: 'Privacy',
    footer: 'Site information',
    language: 'Language',
    languages: { en: 'English', 'pt-BR': 'Português (Brasil)' },
    github: 'GitHub',
  },
  marketing: { advertisement: 'Advertisements', preview: 'Ad preview' },
  home: {
    subtitle:
      'Companies hiring remote senior talent in React, TypeScript, Node.js, GraphQL and React Native, Cloud & Ops, Product, and Data Annotation.',
    overview:
      'Companies on this page are rebuilt from public posts each day. A row is here because its remote roles match a focus area and show a hiring signal. Open a row for the evidence, or open a job to read the quoted listing and the score behind it.',
    filteredScope: (scope: string) =>
      `This view is limited to ${scope}. Hiring signals and the daily update are the same as the full radar.`,
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
      default: 'Newest jobs',
      jobs: 'Open roles',
      name: 'Name (A–Z)',
    },
    newJobs: (count: number) =>
      count === 1
        ? '1 new job in the last update'
        : `${count} new jobs in the last update`,
    loading: 'Loading companies…',
  },
  jobs: {
    title: 'Jobs',
    subtitle:
      'Search remote senior openings in React, TypeScript, Node.js, GraphQL and React Native, Cloud & Ops, Product, and Data Annotation.',
    curation:
      'Each row is a remote role from the current listing window. Open it for the text quoted from the source and the reasons it scored.',
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
    sortLabel: 'Sort jobs',
    sortOptions: {
      newest: 'Newest first',
      relevance: 'Most relevant',
    },
  },
  jobDetailMeta: {
    title: (title: string, company: string | null) =>
      company ? `${title} at ${company}` : title,
    description: (title: string, location: string | null) =>
      `${title}. Remote engineering opportunity${location ? ` in ${location}` : ''}. View the role and original listing.`,
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
    mobile: 'Mobile',
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
    clickedCount: (count: number) =>
      count === 1
        ? '1 person already clicked'
        : `${count} people already clicked`,
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
    detailsLoading: 'Loading company details…',
    detailsError: 'Company details could not be loaded.',
    unknownTime: 'Unknown',
    updated: (value: string) => `Updated: ${value}`,
  },
  globalError: {
    title: 'Something went wrong',
    description: 'The page could not be rendered. Trying again may be enough.',
    retry: 'Try again',
  },
  jobDetail: {
    score: (score: number) => `Relevance score: ${score} out of 100`,
    reasonsTitle: 'Why this score',
    technology: (name: string) =>
      `${name} is named in the public listing and adds its weight on the focus table.`,
    listingTitle: 'Listing text',
    listingAttribution: (source: string) =>
      `Quoted from the public ${source} listing. This site did not write it.`,
    listingMissing:
      'This source did not include a public description we could store. The score uses the title, location, seniority, and technologies only. Read the original listing before you decide.',
    verify:
      'The radar does not accept applications. Confirm compensation, time zone, and the application path on the original listing.',
    reasonText: {
      Senior:
        'The title reads as senior. Senior titles gain points because this radar is built for senior roles.',
      Staff:
        'The title reads as staff. Staff titles gain points, a step under senior, because they sit next to the senior work this radar tracks.',
      'Mid-level':
        'The title reads as mid-level. Mid-level roles lose points because the radar is aimed at senior work.',
      Junior:
        'The title reads as junior. Junior roles are heavily down-ranked.',
      Frontend:
        'The role is classified as frontend, one of the focus areas, which adds points.',
      Fullstack:
        'The role is classified as fullstack, one of the focus areas, which adds points.',
      Platform:
        'The role is classified as Cloud & Ops. Cloud technologies are scored on their own table, not the React table.',
      Remote:
        'The listing is remote. Only remote roles stay on the public pages.',
      'On-site only':
        'The listing reads as on-site only, which removes a large share of the score.',
      Brazil:
        'The public text names Brazil or a Brazilian place, which adds geography points.',
      LATAM:
        'The public text is open to Latin America, which adds geography points.',
      Americas:
        'The public text is open to the Americas, which adds geography points.',
      'Relocation required':
        'The listing requires relocation, which is down-ranked.',
      'Unrelated stack':
        'The technologies sit outside the focus stacks, which is down-ranked.',
      'Unrelated role':
        'The role sits outside the focus areas, which is down-ranked.',
    },
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
          'Public boards of companies on the radar, via the Greenhouse API.',
      },
      {
        name: 'Ashby',
        description:
          'Public boards of companies on the radar, via the Ashby API.',
      },
      {
        name: 'Lever',
        description:
          'Public boards of companies on the radar, via the Lever API.',
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
    guide: 'Como funciona',
    about: 'Sobre',
    privacy: 'Privacidade',
    footer: 'Informações do site',
    language: 'Idioma',
    languages: { en: 'English', 'pt-BR': 'Português (Brasil)' },
    github: 'GitHub',
  },
  marketing: { advertisement: 'Publicidade', preview: 'Prévia do anúncio' },
  home: {
    subtitle:
      'Empresas contratando profissionais sênior para trabalho remoto em React, TypeScript, Node.js, GraphQL e React Native, Cloud & Ops, Produto e Anotação de Dados.',
    overview:
      'As empresas desta página são reconstruídas todo dia a partir de anúncios públicos. Uma linha aparece porque as vagas remotas batem com uma área de foco e mostram um sinal de contratação. Abra a linha para ver as evidências, ou abra uma vaga para ler o texto citado e a pontuação.',
    filteredScope: (scope: string) =>
      `Esta visão está limitada a ${scope}. Os sinais de contratação e a atualização diária são os mesmos do radar completo.`,
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
      default: 'Vagas mais recentes',
      jobs: 'Vagas abertas',
      name: 'Nome (A–Z)',
    },
    newJobs: (count: number) =>
      count === 1
        ? '1 vaga nova na última atualização'
        : `${count} vagas novas na última atualização`,
    loading: 'Carregando empresas…',
  },
  jobs: {
    title: 'Vagas',
    subtitle:
      'Busque vagas remotas sênior em React, TypeScript, Node.js, GraphQL e React Native, Cloud & Ops, Produto e Anotação de Dados.',
    curation:
      'Cada linha é uma vaga remota da janela atual de listagem. Abra para ver o texto citado da fonte e os motivos da pontuação.',
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
    sortLabel: 'Ordenar vagas',
    sortOptions: {
      newest: 'Mais recentes',
      relevance: 'Maior relevância',
    },
  },
  jobDetailMeta: {
    title: (title: string, company: string | null) =>
      company ? `${title} na ${company}` : title,
    description: (title: string, location: string | null) =>
      `${title}. Oportunidade remota de engenharia${location ? ` em ${location}` : ''}. Veja a vaga e o anúncio original.`,
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
    mobile: 'Mobile',
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
    clickedCount: (count: number) =>
      count === 1 ? '1 pessoa já clicou' : `${count} pessoas já clicaram`,
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
    detailsLoading: 'Carregando detalhes da empresa…',
    detailsError: 'Não foi possível carregar os detalhes da empresa.',
    unknownTime: 'Desconhecida',
    updated: (value: string) => `Atualizado: ${value}`,
  },
  globalError: {
    title: 'Algo deu errado',
    description:
      'Não foi possível exibir a página. Tentar novamente pode resolver.',
    retry: 'Tentar novamente',
  },
  jobDetail: {
    score: (score: number) => `Pontuação de relevância: ${score} de 100`,
    reasonsTitle: 'Por que esta pontuação',
    technology: (name: string) =>
      `${name} aparece no anúncio público e soma o peso da tabela de foco.`,
    listingTitle: 'Texto do anúncio',
    listingAttribution: (source: string) =>
      `Citado do anúncio público de ${source}. Este site não escreveu esse texto.`,
    listingMissing:
      'Esta fonte não trouxe uma descrição pública que pudéssemos guardar. A pontuação usa só o título, o local, a senioridade e as tecnologias. Leia o anúncio original antes de decidir.',
    verify:
      'O radar não recebe candidaturas. Confirme remuneração, fuso horário e o caminho de candidatura no anúncio original.',
    reasonText: {
      Senior:
        'O título indica senioridade sênior. Títulos sênior ganham pontos porque o radar é feito para esse nível.',
      Staff:
        'O título indica staff. Títulos staff ganham pontos, um degrau abaixo de sênior, porque ficam ao lado do trabalho sênior que o radar acompanha.',
      'Mid-level':
        'O título indica nível pleno. Vagas pleno perdem pontos porque o radar mira trabalho sênior.',
      Junior:
        'O título indica nível júnior. Vagas júnior são fortemente rebaixadas.',
      Frontend:
        'A vaga é classificada como frontend, uma das áreas de foco, e isso soma pontos.',
      Fullstack:
        'A vaga é classificada como fullstack, uma das áreas de foco, e isso soma pontos.',
      Platform:
        'A vaga é classificada como Cloud & Ops. As tecnologias de cloud são pontuadas na tabela própria, não na tabela de React.',
      Remote:
        'A vaga é remota. Só vagas remotas permanecem nas páginas públicas.',
      'On-site only':
        'O texto indica trabalho somente presencial, o que tira uma parte grande da pontuação.',
      Brazil:
        'O texto público cita o Brasil ou uma cidade brasileira, o que soma pontos de geografia.',
      LATAM:
        'O texto público está aberto à América Latina, o que soma pontos de geografia.',
      Americas:
        'O texto público está aberto às Américas, o que soma pontos de geografia.',
      'Relocation required':
        'A vaga exige mudança de cidade ou país, e isso reduz a pontuação.',
      'Unrelated stack':
        'As tecnologias ficam fora das stacks de foco, e isso reduz a pontuação.',
      'Unrelated role':
        'O cargo fica fora das áreas de foco, e isso reduz a pontuação.',
    },
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
          'Boards públicos de empresas no radar, via API do Greenhouse.',
      },
      {
        name: 'Ashby',
        description: 'Boards públicos de empresas no radar, via API do Ashby.',
      },
      {
        name: 'Lever',
        description: 'Boards públicos de empresas no radar, via API do Lever.',
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

export const messagesFor = (locale: Locale = DEFAULT_LOCALE) =>
  locale === 'pt-BR' ? PT_BR_MESSAGES : EN_MESSAGES;
