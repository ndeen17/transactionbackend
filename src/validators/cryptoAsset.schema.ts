import { z } from "zod";

export const createCryptoAssetSchema = z
  .object({
    coingeckoId: z.string().trim().min(1, "Choose a crypto currency"),
    network: z.string().trim().max(40).optional().or(z.literal("")),
    address: z.string().trim().min(1, "Required").max(200),
  })
  .strict();

export type CreateCryptoAssetInput = z.infer<typeof createCryptoAssetSchema>;

export const updateCryptoAssetSchema = z
  .object({
    network: z.string().trim().max(40).optional().or(z.literal("")),
    address: z.string().trim().min(1, "Required").max(200),
  })
  .strict();

export type UpdateCryptoAssetInput = z.infer<typeof updateCryptoAssetSchema>;
