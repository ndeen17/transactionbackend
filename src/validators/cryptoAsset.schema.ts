import { z } from "zod";

export const createCryptoAssetSchema = z
  .object({
    symbol: z.string().trim().min(1, "Required").max(10),
    name: z.string().trim().min(1, "Required").max(80),
    network: z.string().trim().max(40).optional().or(z.literal("")),
    address: z.string().trim().min(1, "Required").max(200),
  })
  .strict();

export type CreateCryptoAssetInput = z.infer<typeof createCryptoAssetSchema>;

export const updateCryptoAssetSchema = createCryptoAssetSchema;

export type UpdateCryptoAssetInput = z.infer<typeof updateCryptoAssetSchema>;
