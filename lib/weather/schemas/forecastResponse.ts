import { z } from 'zod';

const forecastBlockSchema = z.object({
  dt: z.number(),
  main: z.object({
    temp_min: z.number(),
    temp_max: z.number(),
  }),
  weather: z.array(z.object({ id: z.number() })).min(1),
});

export const forecastResponseSchema = z.object({
  list: z.array(forecastBlockSchema).min(1),
  city: z.object({
    name: z.string(),
    timezone: z.number(),
  }),
});

export type RawForecastBlock = z.infer<typeof forecastBlockSchema>;
export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
