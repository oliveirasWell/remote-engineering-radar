import { z } from 'zod';

const geocodeEntrySchema = z.object({
  name: z.string(),
  local_names: z.record(z.string(), z.string()).optional(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
  state: z.string().optional(),
});

export const geocodeResponseSchema = z.array(geocodeEntrySchema);

export type GeocodeResponse = z.infer<typeof geocodeResponseSchema>;
