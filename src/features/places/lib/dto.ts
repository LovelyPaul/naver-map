// Places DTO
// 백엔드 스키마 재노출

import { z } from 'zod';

/**
 * 장소 검색 응답 스키마
 */
export const SearchPlacesResponseSchema = z.object({
  ok: z.literal(true),
  status: z.number(),
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      address: z.string(),
      category: z.string(),
      categoryMain: z.string(),
      categorySub: z.string().nullable(),
      latitude: z.number(),
      longitude: z.number(),
      photoUrl: z.string().nullable(),
      hasReviews: z.boolean(),
      reviewCount: z.number().optional(),
      avgRating: z.number().optional(),
    })
  ),
});

export type SearchPlacesResponse = z.infer<typeof SearchPlacesResponseSchema>;
