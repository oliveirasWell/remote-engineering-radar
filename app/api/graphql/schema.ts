import { GraphQLScalarType, Kind } from 'graphql';
import { createSchema } from 'graphql-yoga';
import { JOBS_PAGE_LIMIT } from '@/app/[lang]/jobs/constants';
import { parseJobId } from '@/app/[lang]/jobs/[id]/parse-job-id';
import {
  parseJobFilters,
  type JobsSearchParams,
} from '@/app/[lang]/jobs/parse-job-filters';
import {
  getJobDetailData,
  getJobsPageData,
} from '@/lib/report/get-jobs-page-data';
import type { ReportJobListing } from '@/lib/report/types';
import { DEFAULT_JOBS_FIRST, MIN_JOBS_FIRST } from './constants';

const TYPE_DEFS = /* GraphQL */ `
  scalar DateTime

  input JobFilter {
    technology: String
    seniority: String
    remote: String
    country: String
    focus: String
    company: String
    minimumScore: Int
  }

  type Company {
    id: ID!
    name: String!
    slug: String!
    websiteUrl: String
    logoUrl: String
  }

  type Job {
    id: ID!
    title: String!
    url: String!
    location: String
    remotePolicy: String
    technologies: [String!]!
    seniority: String
    score: Int!
    postedAt: DateTime
    company: Company!
  }

  type Query {
    jobs(filter: JobFilter, first: Int = ${DEFAULT_JOBS_FIRST}): [Job!]!
    job(id: ID!): Job
  }
`;

type JobFilterInput = Partial<Record<keyof JobsSearchParams, string | number>>;

const DateTime = new GraphQLScalarType<Date, string>({
  name: 'DateTime',
  serialize: (value) => new Date(value as Date | string).toISOString(),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) =>
    ast.kind === Kind.STRING ? new Date(ast.value) : null,
});

// Filter values reach the same parser as the jobs page, so an unknown value is
// dropped instead of becoming a new `use cache` key.
const toSearchParams = (
  filter: JobFilterInput | null | undefined,
): JobsSearchParams =>
  Object.fromEntries(
    Object.entries(filter ?? {}).flatMap(([key, value]) =>
      value == null ? [] : [[key, String(value)]],
    ),
  );

const clampFirst = (first: number | null | undefined): number =>
  Math.min(
    Math.max(first ?? DEFAULT_JOBS_FIRST, MIN_JOBS_FIRST),
    JOBS_PAGE_LIMIT,
  );

// `Company!` is non-null; a listing whose company row vanished is skipped.
const hasCompany = (job: ReportJobListing): boolean => job.company !== null;

export const radarSchema = createSchema({
  typeDefs: TYPE_DEFS,
  resolvers: {
    DateTime,
    Query: {
      jobs: async (
        _parent: unknown,
        args: { filter?: JobFilterInput | null; first?: number | null },
      ) => {
        // Always read the page-sized list so `first` never adds a cache key.
        const { jobs } = await getJobsPageData(
          parseJobFilters(toSearchParams(args.filter)),
        );
        return jobs.filter(hasCompany).slice(0, clampFirst(args.first));
      },
      job: async (_parent: unknown, args: { id: string }) => {
        const id = parseJobId(args.id);
        if (!id) {
          return null;
        }
        const { job } = await getJobDetailData(id);
        return job && hasCompany(job) ? job : null;
      },
    },
  },
});
