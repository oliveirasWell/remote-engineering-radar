export const SCORE_WEIGHTS = {
  technologies: {
    React: 25,
    TypeScript: 20,
    'Node.js': 15,
    GraphQL: 15,
    'React Native': 15,
  },
  seniority: {
    senior: 15,
    staff: 10,
    mid: -30,
    junior: -100,
    principal: 0,
  },
  /**
   * The Cloud & Ops track's own table. Weights mirror the React track so the
   * two rank on equal footing, and a separate table is what keeps a React job
   * that merely mentions Docker from collecting free points.
   */
  cloudTechnologies: {
    AWS: 25,
    Kubernetes: 20,
    Terraform: 15,
    Docker: 15,
    Azure: 15,
    GCP: 15,
    Ansible: 10,
  },
  roleFocus: {
    frontend: 10,
    fullstack: 10,
    platform: 10,
  },
  remote: 10,
  geography: {
    brazil: 15,
    latam: 15,
    americas: 10,
  },
  onsiteOnly: -50,
  relocationRequired: -40,
  unrelatedStack: -50,
  unrelatedRole: -50,
} as const;

export const MIN_NORMALIZED_SCORE = 0;
export const MAX_NORMALIZED_SCORE = 100;
