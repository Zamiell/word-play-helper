import { getEnv } from "complete-node";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
});

export const env = await getEnv(envSchema);
