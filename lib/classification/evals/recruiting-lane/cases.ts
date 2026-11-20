/**
 * Labeled job titles for the recruiting lane eval. `source` records where the
 * title came from on 2026-11-18: a live ATS board or feed the radar ingests,
 * or `synthetic` for Brazilian and edge cases no feed returned that day.
 * Ambiguous titles (for example "Talent Operations Specialist") are left out
 * rather than guessed.
 */
export type RecruitingLaneCase = {
  title: string;
  description?: string;
  recruiting: boolean;
  source:
    | 'greenhouse'
    | 'ashby'
    | 'jobicy'
    | 'getonbrd'
    | 'himalayas'
    | 'jooble'
    | 'synthetic';
};

export const RECRUITING_LANE_CASES: readonly RecruitingLaneCase[] = [
  // Recruiting roles.
  {
    title: 'Principal Executive Recruiter',
    recruiting: true,
    source: 'greenhouse',
  },
  { title: 'Recruiter, GTM (EMEA)', recruiting: true, source: 'greenhouse' },
  { title: 'Recruiter, R&D', recruiting: true, source: 'greenhouse' },
  { title: 'Recruiter, Sales (AMER)', recruiting: true, source: 'greenhouse' },
  {
    title: 'Senior Recruiter, Public Sector GTM',
    recruiting: true,
    source: 'greenhouse',
  },
  {
    title: 'Manager, Sales Recruiting (AMER)',
    recruiting: true,
    source: 'greenhouse',
  },
  {
    title: 'Contract Talent Acquisition Sourcer, Sales (APJ)',
    recruiting: true,
    source: 'greenhouse',
  },
  { title: 'Recruiting Coordinator', recruiting: true, source: 'ashby' },
  {
    title: 'Director, GTM & G&A Recruiting',
    recruiting: true,
    source: 'ashby',
  },
  {
    title: 'Senior Recruiter| United States | Remote',
    recruiting: true,
    source: 'ashby',
  },
  {
    title: 'Senior Sales Recruiter | EST | Remote',
    recruiting: true,
    source: 'ashby',
  },
  { title: 'Recruiter, Locum Tenens', recruiting: true, source: 'ashby' },
  {
    title: 'Business Recruiter - International Sales (UK/EMEA)',
    recruiting: true,
    source: 'jobicy',
  },
  { title: 'Lead Talent Partner', recruiting: true, source: 'jobicy' },
  {
    title: 'Mid/Senior Talent Acquisition Specialist (Remote - Poland)',
    recruiting: true,
    source: 'jobicy',
  },
  { title: 'Sourcer, Business Recruiting', recruiting: true, source: 'jobicy' },
  { title: 'Founding Recruiter', recruiting: true, source: 'jobicy' },
  { title: 'Contract Technical Recruiter', recruiting: true, source: 'jobicy' },
  {
    title: 'Talent Acquisition Specialist (1year Limited Term)',
    recruiting: true,
    source: 'jobicy',
  },
  { title: 'Director, Talent Acquisition', recruiting: true, source: 'jobicy' },
  {
    title: 'Binance Accelerator Program - HR Talent Acquisition',
    recruiting: true,
    source: 'jobicy',
  },
  {
    title: 'Talent Acquisition Strategist',
    recruiting: true,
    source: 'jobicy',
  },
  { title: 'Reclutador/a TI con IA', recruiting: true, source: 'getonbrd' },
  {
    title: 'Recruiter (English Fluency Required)',
    recruiting: true,
    source: 'getonbrd',
  },
  { title: 'Senior Recruiter', recruiting: true, source: 'himalayas' },
  {
    title: 'Sr. Technical Sourcing Recruiter, Product & Engineering',
    recruiting: true,
    source: 'himalayas',
  },
  {
    title: '1099 Recruiting Sourcing Specialist | Remote',
    recruiting: true,
    source: 'himalayas',
  },
  {
    title: 'Talent Acquisition Specialist - Distribution Services',
    recruiting: true,
    source: 'himalayas',
  },
  { title: 'Tech Recruiter', recruiting: true, source: 'synthetic' },
  { title: 'Recrutador(a) Tech Pleno', recruiting: true, source: 'synthetic' },
  {
    title: 'Analista de Recrutamento e Seleção',
    recruiting: true,
    source: 'synthetic',
  },
  {
    title: 'Especialista em Aquisição de Talentos',
    recruiting: true,
    source: 'synthetic',
  },
  {
    title: 'Business Partner de Atração de Talentos',
    recruiting: true,
    source: 'synthetic',
  },
  {
    title: 'Technical Sourcer (Remote, LATAM)',
    recruiting: true,
    source: 'synthetic',
  },
  { title: 'Headhunter de Tecnologia', recruiting: true, source: 'synthetic' },

  // Not recruiting: other HR, procurement "sourcing", marketing and talent pools.
  {
    title: 'Senior Talent Brand Manager',
    recruiting: false,
    source: 'greenhouse',
  },
  { title: 'Talent Brand Manager', recruiting: false, source: 'greenhouse' },
  {
    title: 'Principal Strategic Sourcing Lead - Technology',
    recruiting: false,
    source: 'greenhouse',
  },
  {
    title:
      'Grupo QuintoAndar | Banco de Talentos | Analista de Crédito Imobiliário',
    recruiting: false,
    source: 'ashby',
  },
  {
    title: 'Banco de Talentos Diversos - Inclusão de Pessoas com Deficiência',
    recruiting: false,
    source: 'ashby',
  },
  {
    title: 'Senior People Operations Associate',
    recruiting: false,
    source: 'jobicy',
  },
  { title: 'Employee Relations Advisor', recruiting: false, source: 'jobicy' },
  {
    title: 'Strategic Sourcing Lead – Fulfillment - Brazil',
    recruiting: false,
    source: 'jobicy',
  },
  {
    title: 'Director, Global People Analytics',
    recruiting: false,
    source: 'jobicy',
  },
  {
    title: 'HR Technology & Analytics Specialist',
    recruiting: false,
    source: 'jobicy',
  },
  { title: 'Senior Benefits Specialist', recruiting: false, source: 'jobicy' },
  { title: 'Clinical Growth SDR', recruiting: false, source: 'jobicy' },
  { title: 'Human Resources Generalist', recruiting: false, source: 'jobicy' },
  {
    title: 'Senior Director, GTM People Business Partner',
    recruiting: false,
    source: 'jobicy',
  },
  { title: 'HRIS Manager', recruiting: false, source: 'jobicy' },
  {
    title: 'International HRBP / Líder Gestión Personas Internacional',
    recruiting: false,
    source: 'getonbrd',
  },
  {
    title: 'Analista de Remuneraciones',
    recruiting: false,
    source: 'getonbrd',
  },
  {
    title: 'Consultor de Implementación de Nómina',
    recruiting: false,
    source: 'getonbrd',
  },
  { title: 'Sourcing Manager', recruiting: false, source: 'himalayas' },
  { title: 'People Partner', recruiting: false, source: 'himalayas' },
  {
    title: 'Senior Product Marketing Manager - Recruitment Cloud',
    recruiting: false,
    source: 'himalayas',
  },
  {
    title: 'Senior Game Designer - Wordscapes - Peoplefun',
    recruiting: false,
    source: 'himalayas',
  },
  {
    title: 'Analista de Departamento Pessoal',
    recruiting: false,
    source: 'synthetic',
  },

  // French franchise postings: on-site, commission-only, not a remote job.
  {
    title: 'Consultant en recrutement indépendant H/F - Nanterre',
    recruiting: false,
    source: 'himalayas',
  },
  {
    title: 'Consultant en recrutement indépendant H/F - Grenoble',
    recruiting: false,
    source: 'himalayas',
  },
  {
    title: 'Consultant en recrutement indépendant H/F - Rennes',
    recruiting: false,
    source: 'himalayas',
  },

  // Brazilian titles from the Jooble partner API, 2026-11-20.
  {
    title:
      'Analista de Recrutamento e Seleção Jr./Pleno (PcD) - Tech Recruiter - SP',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Assistente de Recrutamento e Seleção',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Estágio em Recrutamento e Seleção',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Headhunter - Recrutamento e Seleção',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Talent Acquisition (Recruiter) Expert',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Tech Recruiter Sênior - 90 - MG',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Recrutador(a) Freelance PJ',
    recruiting: true,
    source: 'jooble',
  },
  {
    title: 'Recrutador De Clientes',
    recruiting: false,
    source: 'jooble',
  },
  {
    title: 'Recrutador De Clientes Presencial',
    recruiting: false,
    source: 'jooble',
  },
  {
    title:
      'MBA Pathways Operations Manager - 2027, Amazon University Talent Acquisition',
    recruiting: false,
    source: 'jooble',
  },

  // Engineering jobs whose product or team is recruiting.
  {
    title: 'Senior Software Engineer, Recruiting Platform',
    recruiting: false,
    source: 'synthetic',
  },
  {
    title: 'Frontend Developer - Talent Acquisition Tools',
    recruiting: false,
    source: 'synthetic',
  },
  {
    title: 'Product Designer, Recruiter Experience',
    recruiting: false,
    source: 'synthetic',
  },
  {
    title: 'Senior React Developer',
    description:
      'You will build the React app recruiters use to source candidates.',
    recruiting: false,
    source: 'synthetic',
  },
];
