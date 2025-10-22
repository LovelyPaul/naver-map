// Places Backend API Schemas
// 장소 API 요청/응답 스키마

import { z } from 'zod';

/**
 * 장소 검색 쿼리 스키마
 */
export const SearchPlacesQuerySchema = z.object({
  query: z.string().min(2, '검색어는 최소 2자 이상이어야 합니다').max(100),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export type SearchPlacesQuery = z.infer<typeof SearchPlacesQuerySchema>;

/**
 * 장소 ID 파라미터 스키마
 */
export const PlaceIdParamSchema = z.object({
  placeId: z.string().uuid('유효하지 않은 장소 ID입니다'),
});

export type PlaceIdParam = z.infer<typeof PlaceIdParamSchema>;

/**
 * 장소 검색 응답 스키마
 */
export const SearchPlacesResponseSchema = z.object({
  items: z.array(
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
  total: z.number(),
});

export type SearchPlacesResponse = z.infer<typeof SearchPlacesResponseSchema>;

/**
 * 장소 상세 응답 스키마
 */
export const PlaceDetailResponseSchema = z.object({
  id: z.string().uuid(),
  naverPlaceId: z.string(),
  name: z.string(),
  address: z.string(),
  categoryMain: z.string(),
  categorySub: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  statistics: z.object({
    averageRating: z.number(),
    totalReviews: z.number(),
    ratingDistribution: z.object({
      1: z.number(),
      2: z.number(),
      3: z.number(),
      4: z.number(),
      5: z.number(),
    }),
  }),
});

export type PlaceDetailResponse = z.infer<typeof PlaceDetailResponseSchema>;
