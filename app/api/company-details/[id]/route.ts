import { getCompanyDetailsData } from '@/lib/report/get-company-details-data';
import { parseCountryFilter } from '@/lib/report/parse-country-filter';
import { parseFocusFilter } from '@/lib/report/parse-focus-filter';
import { REPORT_CACHE_LIFE } from '@/lib/report/constants';

const COMPANY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const queryValue = (query: URLSearchParams, key: string) => {
  const values = query.getAll(key);
  return values.length === 1 ? values[0] : values;
};

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  if (!COMPANY_ID_PATTERN.test(id)) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const query = new URL(request.url).searchParams;
  try {
    const details = await getCompanyDetailsData({
      id: id.toLowerCase(),
      country: parseCountryFilter(queryValue(query, 'country')),
      focus: parseFocusFilter(queryValue(query, 'focus')),
    });
    if (!details) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    return Response.json(details, {
      headers: {
        'Cache-Control': `public, s-maxage=${REPORT_CACHE_LIFE.revalidate}, stale-while-revalidate=${REPORT_CACHE_LIFE.expire - REPORT_CACHE_LIFE.revalidate}`,
      },
    });
  } catch {
    return Response.json({ error: 'internal' }, { status: 500 });
  }
};
