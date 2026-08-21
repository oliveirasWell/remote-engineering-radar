import { z } from 'zod';

const currentWeatherEntrySchema = z.object({
  id: z.number(),
  description: z.string(),
  icon: z.string(),
});

export const currentWeatherResponseSchema = z.object({
  weather: z.array(currentWeatherEntrySchema).min(1),
  main: z.object({ temp: z.number() }),
  name: z.string(),
});

export type CurrentWeatherResponse = z.infer<
  typeof currentWeatherResponseSchema
>;
