// Places DTO
// 백엔드 스키마 재노출

import { z } from 'zod';

/**
 * 장소 검색 응답 스키마
 * 서버는 respond() 헬퍼로 c.json(result.data)를 반환하므로 래퍼 없이 직접 데이터 구조 사용
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
 * 서버는 respond() 헬퍼로 c.json(result.data)를 반환하므로 래퍼 없이 직접 데이터 구조 사용
 */
export const PlaceDetailResponseSchema = z.object({
  id: z.string(),
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
