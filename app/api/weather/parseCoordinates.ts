import { z } from 'zod';

type Coordinates = {
  lat: number;
  lon: number;
};

const coordinate = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value : undefined),
    z.coerce.number().min(min).max(max),
  );

const coordinatesSchema = z.object({
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
});

export const parseCoordinates = (
  params: URLSearchParams,
): Coordinates | null => {
  const result = coordinatesSchema.safeParse({
    lat: params.get('lat'),
    lon: params.get('lon'),
  });
  return result.success ? result.data : null;
};
