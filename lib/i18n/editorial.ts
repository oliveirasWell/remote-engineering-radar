import type { ScoreWeightGroupId } from '@/lib/scoring/weight-rows/weight-rows';
import { DEFAULT_LOCALE, type Locale } from './messages';

type EditorialSection = {
  title: string;
  paragraphs: readonly string[];
};

export type Editorial = {
  guide: {
    title: string;
    introduction: string;
    window: (days: number) => string;
    curationTitle: string;
    curation: readonly string[];
    scoreTitle: string;
    scoreIntro: string;
    signalColumn: string;
    pointsColumn: string;
    groups: Record<ScoreWeightGroupId, string>;
    weightLabels: Record<string, string>;
    signalsTitle: string;
    signals: (input: {
      multiple: number;
      recent: number;
      tech: number;
      days: number;
    }) => string;
    useTitle: string;
    use: readonly string[];
    sourcesTitle: string;
    sourcesNote: string;
    limitsTitle: string;
    limits: readonly string[];
  };
  privacy: {
    title: string;
    introduction: string;
    sections: readonly EditorialSection[];
    cookieLabel: string;
    publisherLabel: string;
    analyticsLabel: string;
    adsSettingsLabel: string;
    adCookiesLabel: string;
  };
};

const WEIGHT_LABELS_EN: Record<string, string> = {
  senior: 'Senior',
  staff: 'Staff',
  mid: 'Mid-level',
  junior: 'Junior',
  principal: 'Principal',
  frontend: 'Frontend',
  fullstack: 'Fullstack',
  platform: 'Cloud & Ops',
  remote: 'Remote',
  brazil: 'Brazil',
  latam: 'LATAM',
  americas: 'Americas',
  onsiteOnly: 'On-site only',
  relocationRequired: 'Relocation required',
  unrelatedStack: 'Unrelated stack',
  unrelatedRole: 'Unrelated role',
};

const EN_EDITORIAL: Editorial = {
  guide: {
    title: 'How the radar works',
    introduction:
      'Remote Engineering Radar is a daily index of remote roles in React engineering, Cloud & Ops, product, and data annotation. It filters and scores public listings. It does not accept applications.',
    window: (days: number) =>
      `A role stays on the site only while it is remote and was posted, or first seen, within the last ${days} days. Ingestion runs once a day, so a listing can lag the source by up to a day. Roles that leave the source, or that fall outside that window, leave the public pages.`,
    curationTitle: 'What gets in',
    curation: [
      'The ingest reads public company boards and job feeds. Each listing is normalized, then compared with listings already stored, so the same role is not shown twice when two sources carry it.',
      'On-site-only roles, junior titles, required relocation, and stacks outside the four focus areas lose a large share of their score. The public pages keep the remote slice of that set.',
      'A country filter is the set of roles a person in that place can take. The Brazil view keeps roles that name Brazil and roles open to Latin America or worldwide. The same rule is applied to the other country tabs.',
    ],
    scoreTitle: 'How a job score is built',
    scoreIntro:
      'The score is a heuristic over the public title, location, seniority, and technologies. It is capped between 0 and 100. It is not a judgment of the employer, the compensation, or whether you should apply. The points below are the weights in the current code. Cloud & Ops uses its own table, so a React role that merely mentions Docker does not collect cloud points.',
    signalColumn: 'Signal',
    pointsColumn: 'Points',
    groups: {
      react: 'React engineering',
      cloud: 'Cloud & Ops',
      seniority: 'Seniority',
      role: 'Role focus',
      adjustment: 'Remote policy, geography, and penalties',
    },
    weightLabels: WEIGHT_LABELS_EN,
    signalsTitle: 'How a company gets a hiring signal',
    signals: ({ multiple, recent, tech, days }) =>
      `A company is ranked from its active engineering openings, not from a marketing page. The current rules mark a signal when at least ${multiple} engineering roles are open, when at least ${recent} of those were posted in the last ${days} days, when at least ${tech} roles match the focus technologies, when hiring spans more than one of frontend, backend, and mobile, or when a title is a leadership role such as staff, principal, or engineering manager. Open a company row to read those signals and the source links they came from.`,
    useTitle: 'How to use the pages',
    use: [
      'The companies page is the daily overview. Sort it by newest roles, by how many roles are open, or by name. Expanding a row loads the evidence and the roles behind the score.',
      'The jobs page lists individual roles. Filters for technology, seniority, remote policy, country, and minimum score narrow that list. Opening a role shows the relevance score, a sentence for each signal that produced it, and the listing text quoted from the source.',
      'Hide job stores the choice in this browser only. The count next to the original listing is an aggregate of people who opened the source. There is no account.',
    ],
    sourcesTitle: 'Where listings come from',
    sourcesNote:
      'Each source below is fetched as a public payload. Nothing is submitted on your behalf. The same list is on the About page.',
    limitsTitle: 'Limits',
    limits: [
      'The quoted listing text belongs to the source that published it. This site adds the score, the hiring signals, the deduplication, and the filters. Confirm compensation, time zone, contract type, and how to apply on the original page.',
      'When a weight changes in the code, the table on this page renders the new number from that same table. Corrections and source suggestions go to the email in the footer.',
    ],
  },
  privacy: {
    title: 'Privacy',
    introduction:
      'Remote Engineering Radar is a personal public site. It has no accounts and no application form. This page says what the site stores and which third parties run when a page loads.',
    sections: [
      {
        title: 'What this site stores',
        paragraphs: [
          'The site does not ask for your name. Choosing a language stores that choice in a first-party cookie so the next visit stays in the same language. That cookie is not used to build an advertising profile.',
          'View original job adds one to a counter stored with that listing. The page shows the total. The request sends the job id only.',
          'Hide job writes that id into local storage in this browser. The server does not receive the list.',
        ],
      },
      {
        title: 'Advertising',
        paragraphs: [
          'Pages load Google AdSense to show display ads. Google, as a third-party vendor, uses cookies to serve ads based on visits to this site and other sites. The publisher id is listed below. The ads.txt file at the root of this site names the same publisher.',
          'You can opt out of personalized advertising in Google’s Ads Settings. How Google uses cookies in advertising is linked below.',
        ],
      },
      {
        title: 'Measurement',
        paragraphs: [
          'Google Analytics counts page views. The measurement id is listed below. This site does not sell a separate export of your identity.',
        ],
      },
      {
        title: 'Job listings',
        paragraphs: [
          'The listing text on a role page is quoted from the public source named there. It is stored so the role can be read here and so the score can be checked against the same words. The radar does not contact employers for you.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          'Questions about this page, or a correction to a listing, go to the email below. The personal site in the footer is the same maintainer.',
        ],
      },
    ],
    cookieLabel: 'Language cookie',
    publisherLabel: 'AdSense publisher',
    analyticsLabel: 'Analytics measurement',
    adsSettingsLabel: 'Google Ads Settings',
    adCookiesLabel: 'How Google uses cookies in advertising',
  },
};

const PT_EDITORIAL: Editorial = {
  guide: {
    title: 'Como o radar funciona',
    introduction:
      'O Remote Engineering Radar é um índice diário de vagas remotas em engenharia React, Cloud & Ops, produto e anotação de dados. Ele filtra e pontua anúncios públicos. Não recebe candidaturas.',
    window: (days: number) =>
      `Uma vaga permanece no site só enquanto é remota e foi publicada, ou vista pela primeira vez, nos últimos ${days} dias. A coleta roda uma vez por dia, então um anúncio pode atrasar até um dia em relação à fonte. Vagas que saem da fonte, ou que ficam fora dessa janela, saem das páginas públicas.`,
    curationTitle: 'O que entra',
    curation: [
      'A coleta lê boards públicos de empresas e feeds de vagas. Cada anúncio é normalizado e comparado com os que já estão guardados, para a mesma vaga não aparecer duas vezes quando duas fontes a publicam.',
      'Vagas só presenciais, títulos júnior, mudança obrigatória e stacks fora das quatro áreas de foco perdem uma parte grande da pontuação. As páginas públicas ficam com o recorte remoto desse conjunto.',
      'O filtro de país é o conjunto de vagas que uma pessoa naquele lugar pode assumir. A visão do Brasil mantém vagas que citam o Brasil e vagas abertas à América Latina ou ao mundo. A mesma regra vale para as outras abas de país.',
    ],
    scoreTitle: 'Como a pontuação de uma vaga é montada',
    scoreIntro:
      'A pontuação é uma heurística sobre o título, o local, a senioridade e as tecnologias públicas. Ela fica entre 0 e 100. Não é um julgamento do empregador, da remuneração, nem de se você deve se candidatar. Os pontos abaixo são os pesos do código atual. Cloud & Ops usa a própria tabela, então uma vaga de React que só menciona Docker não ganha pontos de cloud.',
    signalColumn: 'Sinal',
    pointsColumn: 'Pontos',
    groups: {
      react: 'Engenharia React',
      cloud: 'Cloud & Ops',
      seniority: 'Senioridade',
      role: 'Foco do cargo',
      adjustment: 'Modelo de trabalho, geografia e penalidades',
    },
    weightLabels: {
      senior: 'Sênior',
      staff: 'Staff',
      mid: 'Pleno',
      junior: 'Júnior',
      principal: 'Principal',
      frontend: 'Frontend',
      fullstack: 'Fullstack',
      platform: 'Cloud & Ops',
      remote: 'Remoto',
      brazil: 'Brasil',
      latam: 'América Latina',
      americas: 'Américas',
      onsiteOnly: 'Somente presencial',
      relocationRequired: 'Mudança obrigatória',
      unrelatedStack: 'Stack sem relação',
      unrelatedRole: 'Cargo sem relação',
    },
    signalsTitle: 'Como uma empresa ganha um sinal de contratação',
    signals: ({ multiple, recent, tech, days }) =>
      `Uma empresa é ordenada pelas vagas de engenharia ativas, não por uma página de marketing. As regras atuais marcam um sinal quando há pelo menos ${multiple} vagas de engenharia abertas, quando pelo menos ${recent} delas foram publicadas nos últimos ${days} dias, quando pelo menos ${tech} vagas batem com as tecnologias de foco, quando a contratação atravessa mais de uma entre frontend, backend e mobile, ou quando o título é de liderança, como staff, principal ou engineering manager. Abra a linha da empresa para ler esses sinais e os links de origem.`,
    useTitle: 'Como usar as páginas',
    use: [
      'A página de empresas é o panorama do dia. Ordene pelas vagas mais recentes, pela quantidade de vagas abertas ou pelo nome. Expandir uma linha carrega as evidências e as vagas por trás da nota.',
      'A página de vagas lista cada papel. Filtros de tecnologia, senioridade, modelo de trabalho, país e pontuação mínima enxugam a lista. Abrir uma vaga mostra a pontuação de relevância, uma frase para cada sinal que a produziu e o texto citado da fonte.',
      'Ocultar vaga guarda a escolha só neste navegador. O contador ao lado do anúncio original é a soma de pessoas que abriram a fonte. Não há conta.',
    ],
    sourcesTitle: 'De onde vêm os anúncios',
    sourcesNote:
      'Cada fonte abaixo é lida como um payload público. Nada é enviado em seu nome. A mesma lista está na página Sobre.',
    limitsTitle: 'Limites',
    limits: [
      'O texto citado pertence à fonte que o publicou. Este site acrescenta a pontuação, os sinais de contratação, a deduplicação e os filtros. Confirme remuneração, fuso horário, tipo de contrato e como se candidatar na página original.',
      'Quando um peso muda no código, a tabela desta página mostra o número novo a partir dessa mesma tabela. Correções e sugestões de fonte vão para o e-mail do rodapé.',
    ],
  },
  privacy: {
    title: 'Privacidade',
    introduction:
      'O Remote Engineering Radar é um site público pessoal. Não há contas nem formulário de candidatura. Esta página diz o que o site guarda e quais terceiros rodam quando uma página carrega.',
    sections: [
      {
        title: 'O que este site guarda',
        paragraphs: [
          'O site não pede o seu nome. Escolher um idioma guarda essa escolha num cookie primário para a próxima visita continuar no mesmo idioma. Esse cookie não é usado para montar um perfil de publicidade.',
          'Ver vaga original soma um num contador guardado com aquele anúncio. A página mostra o total. O pedido envia só o id da vaga.',
          'Ocultar vaga grava esse id no armazenamento local deste navegador. O servidor não recebe a lista.',
        ],
      },
      {
        title: 'Publicidade',
        paragraphs: [
          'As páginas carregam o Google AdSense para exibir anúncios. O Google, como fornecedor terceiro, usa cookies para veicular anúncios com base em visitas a este site e a outros sites. O id de editor está listado abaixo. O arquivo ads.txt na raiz deste site nomeia o mesmo editor.',
          'Você pode desativar a publicidade personalizada nas Configurações de anúncios do Google. O link de como o Google usa cookies em publicidade está abaixo.',
        ],
      },
      {
        title: 'Medição',
        paragraphs: [
          'O Google Analytics conta visualizações de página. O id de medição está listado abaixo. Este site não vende uma exportação separada da sua identidade.',
        ],
      },
      {
        title: 'Anúncios de vagas',
        paragraphs: [
          'O texto na página de uma vaga é citado da fonte pública nomeada ali. Ele fica guardado para a vaga ser lida aqui e para a pontuação ser conferida contra as mesmas palavras. O radar não contata empregadores por você.',
        ],
      },
      {
        title: 'Contato',
        paragraphs: [
          'Dúvidas sobre esta página, ou uma correção de anúncio, vão para o e-mail abaixo. O site pessoal no rodapé é do mesmo mantenedor.',
        ],
      },
    ],
    cookieLabel: 'Cookie de idioma',
    publisherLabel: 'Editor do AdSense',
    analyticsLabel: 'Medição do Analytics',
    adsSettingsLabel: 'Configurações de anúncios do Google',
    adCookiesLabel: 'Como o Google usa cookies em publicidade',
  },
};

export const editorialFor = (locale: Locale = DEFAULT_LOCALE): Editorial =>
  locale === 'pt-BR' ? PT_EDITORIAL : EN_EDITORIAL;
